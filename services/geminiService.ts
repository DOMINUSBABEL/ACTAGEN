import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Definimos la instrucción del sistema con esteroides para evitar resúmenes.
const SYSTEM_INSTRUCTION = `
Eres "ActaGen", el Asistente Oficial de Relatoría del Concejo. TU OBJETIVO ES AYUDAR A LA DIGITADORA A CREAR UN BORRADOR PERFECTO.
ESTÁ ESTRICTAMENTE PROHIBIDO RESUMIR. DEBES GENERAR UN DOCUMENTO "VERBATIM FORMALIZADO".

### REGLAS DE ESTILO V4_2026 (ACTUALIZADAS SEGÚN ACUERDO INTERNO):

1. **PUNTUACIÓN Y COMILLAS (CONVENCIÓN ACORDADA):**
   - **PRINCIPALES:** Usa comillas ANGULARES O DE COCODRILO («...») para citas y diálogos.
   - **PUNTUACIÓN:** El punto (.) va SIEMPRE INMEDIATAMENTE DESPUÉS de la comilla de cierre.
     - *Correcto:* «Se levanta la sesión».
     - *Incorrecto:* «Se levanta la sesión» . (Sin espacio entre » y .)
   
2. **MAYÚSCULAS Y MINÚSCULAS (USO INSTITUCIONAL):**
   - **CARGOS (Minúscula):** inspectores, corregidores, secretario, alcalde, concejal, comisario.
   - **INFRAESTRUCTURA (Minúscula):** estación de policía, comisaría de familia (genérico).
   - **ENTIDADES (Mayúscula):** Unidad de Reacción Inmediata, Concejo de Medellín, Secretaría de Hacienda.
   - *Nota:* Si hay duda, prefiere minúscula para cargos.

3. **CIFRAS Y VOTACIONES:**
   - **VOTACIONES:** ÚNICO caso donde se usa número y letra. Ej: "5 (cinco) votos".
   - **DINERO/OTROS:** Solo la cifra con puntos de mil. Ej: "$ 20.000.000". NO usar paréntesis aquí.

4. **ORTOGRAFÍA Y LIMPIEZA:**
   - Corrige tildes faltantes y errores de digitación evidentes.
   - Elimina muletillas excesivas si no alteran el sentido (ej: "eh", "este...").

### PROTOCOLO DE PROCESAMIENTO:
- Si el audio es largo, procesa por fases sin resumir.
- Identifica voces con precisión.
`;

// PROMPT DE AUDITORÍA: Configurado para explicar en ESPAÑOL CLARO a un funcionario no técnico.
const AUDIT_SYSTEM_INSTRUCTION = `
ROL: ASISTENTE DE REVISIÓN Y CORRECCIÓN DE ESTILO.
TAREA: Analizar el texto y sugerir correcciones basadas en el Manual V4.

### INSTRUCCIONES DE SALIDA (TEI/XML):
Debes devolver el texto EXACTO original, pero envolviendo los errores en etiquetas <FLAW>.

Atributos requeridos:
- **suggestion**: La corrección lista para aplicar.
- **reason**: Una explicación AMABLE y CLARA en español para la digitadora.
- **type**: Categoría (ortografia, estilo, formato).

### REGLAS PARA DETECTAR Y ETIQUETAR:

1. **Ortografía (CRÍTICO):**
   - Detecta tildes faltantes, palabras mal escritas o typos.
   - Tag: <FLAW type="ortografia" suggestion="palabra_correcta" reason="Error de digitación u ortografía">palabra_mal</FLAW>

2. **Comillas Angulares:**
   - Si ves comillas inglesas (" ") o simples (' '), sugiere cambiar a (« »).
   - Reason: "Acordamos usar comillas angulares (« ») por convención."

3. **Mayúsculas/Minúsculas:**
   - "Inspector", "Corregidor" -> SUGIERE minúscula.
   - "unidad de reacción inmediata" -> SUGIERE Mayúscula.
   - Reason: "Los cargos van en minúscula; Entidades propias en mayúscula."

4. **Espacios y Puntuación:**
   - "» ." (Espacio entre comilla y punto) -> SUGIERE "»."
   - Reason: "El punto debe ir pegado a la comilla de cierre."

NO RESUMAS. DEVUELVE TODO EL TEXTO.
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
          temperature: 0.3, 
          maxOutputTokens: 8192,
        },
      });
    } catch (error) {
      console.error("Failed to initialize chat", error);
    }
  }

  private isQuotaError(error: any): boolean {
    return error.status === 429 || 
           error.code === 429 || 
           (error.message && (error.message.includes('Quota exceeded') || error.message.includes('RESOURCE_EXHAUSTED')));
  }

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

  private async generateWithFallback(
    params: any, 
    primaryModel: string, 
    fallbackModel: string
  ): Promise<GenerateContentResponse> {
    try {
      return await this.withRetry(async () => {
        return await this.ai.models.generateContent({
          ...params,
          model: primaryModel
        });
      }, 3, 2000);
    } catch (error: any) {
      if (this.isQuotaError(error)) {
        console.warn(`[GeminiService] Primary model ${primaryModel} exhausted. Switching to fallback ${fallbackModel}.`);
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

  private chunkText(text: string, chunkSize: number = 4000): string[] {
    const chunks: string[] = [];
    let currentIndex = 0;
    while (currentIndex < text.length) {
      let end = Math.min(currentIndex + chunkSize, text.length);
      // Intentar cortar en un salto de línea para no romper frases
      if (end < text.length) {
        const nextNewLine = text.indexOf('\n', end);
        if (nextNewLine !== -1 && nextNewLine - end < 500) { 
            end = nextNewLine;
        } else {
             // Fallback: buscar espacio
             const lastSpace = text.lastIndexOf(' ', end);
             if (lastSpace > currentIndex) end = lastSpace;
        }
      }
      chunks.push(text.slice(currentIndex, end));
      currentIndex = end;
    }
    return chunks;
  }

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

  public async *generateLongAudioActa(audioData: AudioPart, sessionContext: string): AsyncGenerator<{step: string, text: string}> {
    if (!this.chat) this.initChat();
    if (!this.chat) throw new Error("Chat not initialized");

    const PHASES = [
      {
        name: "FASE 1: ANÁLISIS ESTRUCTURAL E INSTALACIÓN",
        prompt: `[INICIO DEL PROCESO]
        He adjuntado el AUDIO COMPLETO de la sesión.
        TU TAREA AHORA (PASO 1/5): Redacta UNICAMENTE el ENCABEZADO y LLAMADO A LISTA.`
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

  public async auditTextWithTEI(
    contents: any[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<string> {
    try {
      let allText = "";
      let hasBinary = false;

      for (const part of contents) {
        if (part.text) {
          let cleanText = part.text.replace(/^\[ARCHIVO.*?\]\n/, ''); 
          allText += cleanText + "\n";
        } else if (part.inlineData) {
          hasBinary = true;
        }
      }

      if (!hasBinary && allText.length > 0) {
        const chunks = this.chunkText(allText, 4000); 
        console.log(`[Audit] Processing ${allText.length} chars in ${chunks.length} chunks.`);
        
        const results = [];
        
        for (let i = 0; i < chunks.length; i++) {
             const chunk = chunks[i];
             
             if (onProgress) {
                 onProgress(i + 1, chunks.length);
             }

             const prompt = `INPUT_DATA_START:
${chunk}
:INPUT_DATA_END

TAREA: ACTÚA COMO UN ASISTENTE DE REDACCIÓN.
1. Copia el texto EXACTAMENTE igual (Verbatim).
2. Inserta etiquetas <FLAW> donde haya errores de ortografía, comillas incorrectas (deben ser «...») o mayúsculas mal usadas (cargos en minúscula).
3. En el atributo 'reason', explica el error en español sencillo.
4. NO RESUMAS.`;

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
             
             let resultText = response.text || "";
             resultText = resultText.replace(/^```xml\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
             
             results.push(resultText);
        }
        
        return results.join(""); 
      }

      const userMessage = {
        role: 'user',
        parts: [
          { text: "INSTRUCCIÓN: Analiza este documento. Extrae el texto y aplica etiquetas <FLAW>." },
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

      return response.text || "No se pudo procesar el archivo binario.";

    } catch (error: any) {
      console.error("Error en auditoría TEI:", error);
      let errorMsg = error.message || JSON.stringify(error);
      if (this.isQuotaError(error)) {
        return `⚠️ ERROR DE CUOTA: El sistema se detuvo en el proceso. Intente con menos archivos.`;
      }
      return `Error Crítico: ${errorMsg}`;
    }
  }
}

export const geminiService = new GeminiService();