import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Definimos la instrucción del sistema con esteroides para evitar resúmenes.
const SYSTEM_INSTRUCTION = `
Eres "ActaGen", el Relator Oficial del Concejo de Medellín. TU OBJETIVO ES LA PRECISIÓN Y LA EXTENSIÓN.
ESTÁ ESTRICTAMENTE PROHIBIDO RESUMIR. DEBES GENERAR UN DOCUMENTO "VERBATIM FORMALIZADO".

### REGLAS DE ESTILO V3_2026 (MANDATORIAS):
1. **PUNTUACIÓN Y COMILLAS:**
   - Usa comillas INGLESAS (“...”) como principales.
   - Usa comillas ESPAÑOLAS («...») SOLO dentro de las inglesas.
   - El punto (.) y la coma (,) van SIEMPRE DESPUÉS de las comillas de cierre. (Ej: “Terminó la sesión”.)
2. **CIFRAS Y MONEDA:**
   - Formato: $ 20.000.000.000 (Puntos de mil).
   - Opcional: "$ 20.000 millones".
3. **MAYÚSCULAS:**
   - CARGOS: minúscula (secretario, alcalde, concejal).
   - ENTIDADES: Mayúscula (Secretaría de Hacienda, Concejo de Medellín).
   - Ej: "El secretario de Hacienda dijo..."
4. **VOTACIONES:**
   - Resultado en número y letra: "21 (veintiún) votos".
   - NO contar ausentes en el total.

### PROTOCOLO DE PROCESAMIENTO:
- Si el audio es largo, procesa por fases sin resumir.
- Usa tono solemne parlamentario.
- Identifica voces con precisión.
`;

const AUDIT_SYSTEM_INSTRUCTION = `
Eres un **MOTOR DE AUDITORÍA DE CÓDIGO XML/TEI**.

### TU MISIÓN CRÍTICA:
Recibirás un fragmento de texto. DEVUÉLVELO EXACTO (VERBATIM) insertando etiquetas <FLAW> en los errores según el MANUAL V3_2026.

### REGLAS DE ORO (FIDELIDAD ABSOLUTA):
1. **INTEGRIDAD TOTAL**: Devuelve el texto COMPLETO. No omitas ni una sola palabra.
2. **SIN RESÚMENES**: Prohibido resumir. Si el texto es largo, procésalo todo.
3. **CONTINUIDAD**: Si el fragmento empieza o termina a mitad de frase, déjalo así. No intentes completarlo.
4. **SOLO ETIQUETAS**: Tu única modificación permitida es insertar <FLAW>...</FLAW>.

### REGLAS DE AUDITORÍA (MANUAL V3_2026):
1. **COMILLAS**:
   - Error: Uso de comillas simples ('') o rectas (""). -> Suggest: Inglesas (“”).
   - Error: Punto DENTRO de comillas. -> Suggest: Punto FUERA.
2. **VOTACIONES**:
   - Error: Solo número ("21 votos"). -> Suggest: "21 (veintiún) votos".
   - Error: Suma de ausentes en el total. -> Suggest: Eliminar ausentes del conteo.
3. **CARGOS**:
   - Error: "Secretario de Hacienda". -> Suggest: "secretario de Hacienda" (Cargo minúscula).
   - Error: "secretaria de salud". -> Suggest: "secretaria de Salud" (Entidad mayúscula).
4. **MONEDA**:
   - Error: 20 mil millones. -> Suggest: $ 20.000.000.000.

### SALIDA XML:
Envuelve errores con: <FLAW type="[tipo]" severity="[high/medium]" suggestion="[corrección]">texto erroneo</FLAW>

Tipos: 'spelling', 'style', 'format'.
`;

export interface GeminiResponse {
  text: string;
  groundingChunks?: any[];
}

export interface AudioPart {
  inlineData: {
    mimeType: string;
    data: string;
  }
}

class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public initChat(): void {
    try {
      this.chat = this.ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.3, // Temperatura baja para mayor fidelidad
          maxOutputTokens: 8192,
        },
      });
    } catch (error) {
      console.error("Failed to initialize chat", error);
    }
  }

  // Detecta si el error es por cuota o rate limit
  private isQuotaError(error: any): boolean {
    return error.status === 429 || 
           error.code === 429 || 
           (error.message && (error.message.includes('Quota exceeded') || error.message.includes('RESOURCE_EXHAUSTED')));
  }

  // Implementación de Exponential Backoff genérica
  private async withRetry<T>(operation: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> {
    let currentDelay = initialDelay;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        if (!this.isQuotaError(error) || i === retries - 1) {
          throw error;
        }

        console.warn(`[GeminiService] Quota hit (429). Retrying in ${currentDelay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= 2;
      }
    }
    throw new Error("Max retries exceeded");
  }

  // Ejecuta una generación de contenido con Fallback de modelo si el primario falla por cuota
  private async generateWithFallback(
    params: any, 
    primaryModel: string, 
    fallbackModel: string
  ): Promise<GenerateContentResponse> {
    try {
      // Intento con modelo primario (ej: Gemini 3)
      return await this.withRetry(async () => {
        return await this.ai.models.generateContent({
          ...params,
          model: primaryModel
        });
      }, 3, 2000);
    } catch (error: any) {
      if (this.isQuotaError(error)) {
        console.warn(`[GeminiService] Primary model ${primaryModel} exhausted. Switching to fallback ${fallbackModel}.`);
        // Intento con modelo fallback (ej: Gemini Flash Latest)
        return await this.withRetry(async () => {
          return await this.ai.models.generateContent({
            ...params,
            model: fallbackModel
          });
        }, 3, 2000);
      }
      throw error;
    }
  }

  // Helper para fragmentar texto largo (Split & Conquer) - REDUCED CHUNK SIZE FOR SAFETY
  private chunkText(text: string, chunkSize: number = 6000): string[] {
    const chunks: string[] = [];
    let currentIndex = 0;
    while (currentIndex < text.length) {
      let end = Math.min(currentIndex + chunkSize, text.length);
      // Intentar cortar en un salto de línea para no romper frases
      if (end < text.length) {
        const nextNewLine = text.indexOf('\n', end);
        if (nextNewLine !== -1 && nextNewLine - end < 1000) {
            end = nextNewLine;
        }
      }
      chunks.push(text.slice(currentIndex, end));
      currentIndex = end;
    }
    return chunks;
  }

  // Método simple para mensajes cortos
  public async sendMessage(message: string, youtubeUrl?: string, audioData?: AudioPart): Promise<GeminiResponse> {
    if (!this.chat) this.initChat();
    if (!this.chat) throw new Error("Chat not initialized");

    return this.withRetry(async () => {
      try {
        let messageContent: any = [];
        let textPrompt = message;

        if (youtubeUrl) {
          textPrompt = `[CONTEXTO: VIDEO YOUTUBE ${youtubeUrl}]\n${message}`;
        } else if (audioData) {
          textPrompt = `[CONTEXTO: AUDIO ADJUNTO]\n${message}`;
        }

        messageContent.push({ text: textPrompt });
        if (audioData) messageContent.push(audioData);

        const response: GenerateContentResponse = await this.chat!.sendMessage({ message: messageContent });
        return {
          text: response.text || "No response.",
          groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
        };
      } catch (error) {
        console.error("API Error in sendMessage:", error);
        throw error;
      }
    });
  }

  // Método de Orquestación Secuencial para Audio Largo
  public async *generateLongAudioActa(audioData: AudioPart, sessionContext: string): AsyncGenerator<{step: string, text: string}> {
    if (!this.chat) this.initChat();
    if (!this.chat) throw new Error("Chat not initialized");

    // Fases del proceso... (mantenemos las mismas fases)
    const PHASES = [
      {
        name: "FASE 1: ANÁLISIS ESTRUCTURAL E INSTALACIÓN",
        prompt: `[INICIO DEL PROCESO]
        He adjuntado el AUDIO COMPLETO de la sesión.
        
        TU TAREA AHORA (PASO 1/5):
        1. Analiza el audio para entender la duración total y los oradores principales.
        2. Redacta UNICAMENTE el ENCABEZADO (Lugar, Fecha, Hora) y el LLAMADO A LISTA (Verificación del Quórum).
        3. Si escuchas la lectura del Orden del Día, transcríbela tal cual.
        
        NO avances al desarrollo del debate todavía. Solo estructura inicial.`
      },
      { name: "FASE 2: INTERVENCIONES INICIALES", prompt: `CONTINUAMOS (PASO 2/5): Redacta intervenciones post-orden del día.` },
      { name: "FASE 3: DEBATE CENTRAL (A)", prompt: `CONTINUAMOS (PASO 3/5): Primera mitad del debate central.` },
      { name: "FASE 4: DEBATE CENTRAL (B)", prompt: `CONTINUAMOS (PASO 4/5): Segunda mitad y conclusiones.` },
      { name: "FASE 5: CIERRE", prompt: `FINALIZAMOS (PASO 5/5): Proposiciones finales y cierre.` }
    ];

    try {
      let firstMessage: any = [
        { text: `${sessionContext}\n\n${PHASES[0].prompt}` },
        audioData
      ];
      
      const response1 = await this.withRetry(async () => 
        await this.chat!.sendMessage({ message: firstMessage })
      );
      yield { step: PHASES[0].name, text: response1.text || "" };

      for (let i = 1; i < PHASES.length; i++) {
        const phase = PHASES[i];
        const response = await this.withRetry(async () => 
          await this.chat!.sendMessage({ message: phase.prompt })
        );
        yield { step: phase.name, text: response.text || "" };
      }

    } catch (error) {
      console.error("Error en flujo secuencial:", error);
      throw error;
    }
  }

  // Método Multi-parte AVANZADO con Callback de Progreso
  public async auditTextWithTEI(
    contents: any[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<string> {
    try {
      // 1. Detección de contenido de texto puro
      let allText = "";
      let hasBinary = false;

      for (const part of contents) {
        if (part.text) {
          // Extraemos el texto crudo, limpiando etiquetas previas si las hay
          let cleanText = part.text.replace(/^\[ARCHIVO.*?\]\n/, ''); 
          allText += cleanText + "\n";
        } else if (part.inlineData) {
          hasBinary = true;
        }
      }

      // 2. Estrategia de "Split & Conquer" para texto puro
      // Ahora incluye PDFs gracias a la extracción en cliente.
      if (!hasBinary && allText.length > 0) {
        // Reducido a 6000 caracteres (aprox 1.5k tokens) para máxima seguridad de output.
        // Esto evita cortes abruptos en el output de 8k tokens.
        const chunks = this.chunkText(allText, 6000); 
        console.log(`[Audit] Split document into ${chunks.length} chunks to prevent summarization.`);
        
        const results = [];
        
        // Procesamos secuencialmente para no saturar la cuota
        for (let i = 0; i < chunks.length; i++) {
             const chunk = chunks[i];
             
             if (onProgress) {
                 onProgress(i + 1, chunks.length);
             }

             const prompt = `[FRAGMENTO ${i+1}/${chunks.length} DEL DOCUMENTO TOTAL]
             
             INSTRUCCIÓN ÚNICA: Audita este fragmento de texto aplicando etiquetas <FLAW>.
             - NO RESUMAS. Devuelve el texto íntegro letra por letra.
             - Si el fragmento corta una frase, devuélvela cortada (se completará en el siguiente bloque).
             
             TEXTO A AUDITAR:
             ${chunk}`;

             // Usamos temperature 0 para determinismo absoluto
             const response = await this.generateWithFallback(
                {
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    config: {
                        systemInstruction: AUDIT_SYSTEM_INSTRUCTION,
                        temperature: 0.0, 
                        maxOutputTokens: 8192,
                    }
                },
                'gemini-3-flash-preview',
                'gemini-flash-latest'
             );
             results.push(response.text || "");
        }
        
        return results.join(""); // Join sin saltos extra para continuidad
      }

      // Fallback para binarios no procesables (no debería ocurrir con PDF ahora)
      const userMessage = {
        role: 'user',
        parts: [
          { text: "INSTRUCCIÓN CRÍTICA: NO RESUMAS. Si el documento es muy largo, procesa hasta donde alcances con máxima fidelidad." },
          ...contents
        ]
      };

      const response = await this.generateWithFallback(
        {
            contents: [userMessage],
            config: {
                systemInstruction: AUDIT_SYSTEM_INSTRUCTION,
                temperature: 0.0,
                maxOutputTokens: 8192,
            }
        },
        'gemini-3-flash-preview', 
        'gemini-flash-latest' 
      );

      return response.text || "No se pudo generar el análisis XML.";

    } catch (error: any) {
      console.error("Error en auditoría TEI:", error);
      
      let errorMsg = error.message || JSON.stringify(error);
      if (this.isQuotaError(error)) {
        return `⚠️ **SISTEMA SATURADO (ERROR 429):**
        
        El documento es demasiado extenso para procesarlo de una sola vez con la cuota actual.
        
        **Solución:** El sistema está intentando fragmentarlo automáticamente. Si este error persiste, espere un minuto.`;
      }
      return `Error de Análisis: ${errorMsg}`;
    }
  }
}

export const geminiService = new GeminiService();