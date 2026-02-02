import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Definimos la instrucción del sistema basada en el "Estándar Oro" (Acta 349) y observaciones de Ruth Navarro.
const SYSTEM_INSTRUCTION = `
Eres "ActaGen", el Asistente Oficial de Relatoría del Concejo. TU OBJETIVO ES GENERAR UN ACTA CON ESTILO PARLAMENTARIO PERFECTO (BASADO EN ACTA 349).

### REGLAS DE ORO DE REDACCIÓN Y FORMATO (ESTRICTO):

1. **ESTRUCTURA DE INTERVENCIONES:**
   - Formato: **Intervino [cargo/rol en minúscula] [Nombre en Mayúscula Inicial]:**
   - Salto de línea doble.
   - Texto del discurso entre **comillas inglesas (“...”)**.
   - *Ejemplo:*
     Intervino el concejal Brisvani Alexis Arenas Suaza:
     “Muy buenas tardes para todos...”

2. **USO DE COMILLAS (JERARQUÍA):**
   - **Discurso/Voz:** Comillas inglesas altas (**“...”**).
   - **Títulos/Obras/Lemas:** Comillas angulares o españolas (**«...»**).
   - *Ejemplo:* Quiero empezar con el video «Camino al barrio».

3. **ACRÓNIMOS Y SIGLAS (Regla de Ruth):**
   - **Hasta 4 letras:** MAYÚSCULA SOSTENIDA. (Ej: ICBF, DANE, APP, POT).
   - **Más de 4 letras:** Tipo Título (Solo primera mayúscula). (Ej: Isvimed, Sivigila, Fonvalmed, Colpensiones).

4. **CIFRAS Y MONEDA:**
   - **Dinero:** Signo pesos + ESPACIO + Cifra con puntos. (Ej: **$ 20.000** / **$ 1.500.000**).
   - **Hora:** Formato 24h. (Ej: 14:33 horas).

5. **LENGUAJE PARLAMENTARIO:**
   - Usar frases pasivas o impersonales para acciones de procedimiento.
   - *Ejemplos:* "Se dio lectura a...", "Se sometió a consideración...", "Fue aprobado", "El presidente declaró abierta la sesión".

6. **LIMPIEZA EDITORIAL:**
   - **Párrafos:** Evitar "ladrillos" (textos infinitos). Dividir ideas en párrafos legibles.
   - **Coherencia:** Corregir errores fonéticos obvios (Ej: "viven caminando" -> "vienen caminando").
   - **Negrillas:** NO usar negrilla dentro del texto de las intervenciones.

### PROTOCOLO DE PROCESAMIENTO:
Si recibes audio o video, transcríbelo siguiendo estas reglas. Si recibes texto, audítalo y reescríbelo aplicando este formato.
`;

// PROMPT DE AUDITORÍA: Refinado para detectar desviaciones del Acta 349.
const AUDIT_SYSTEM_INSTRUCTION = `
ROL: AUDITOR DE ESTILO LEGISLATIVO (CONTROL DE CALIDAD ACTA 349).
TAREA: Detectar errores que violen el Manual de Estilo V5.

### REGLAS DE ETIQUETADO <FLAW>:

1. **Acrónimos Incorrectos (Type: estilo):**
   - Si ves "ISVIMED" (incorrecto, >4 letras) -> Sugerir "Isvimed".
   - Si ves "Icbf" (incorrecto, <=4 letras) -> Sugerir "ICBF".

2. **Formato Moneda (Type: formato):**
   - Si ves "$20.000" (sin espacio) -> Sugerir "$ 20.000".

3. **Comillas (Type: estilo):**
   - Si usan comillas inglesas (" ") para títulos de videos/documentos -> Sugerir angulares (« »).

4. **Coherencia Fonética (Type: coherencia):**
   - Detectar palabras que suenan igual pero no tienen sentido (viven/vienen).

5. **Basura Editorial (Type: basura_editorial):**
   - Letras sueltas o residuos de OCR/Dictado.

DEVUELVE EL TEXTO ORIGINAL CON LAS ETIQUETAS XML INCRUSTADAS.
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
          temperature: 0.2, // Bajamos temperatura para mayor rigor formal
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
        TU TAREA AHORA (PASO 1/5): Redacta UNICAMENTE el ENCABEZADO y LLAMADO A LISTA siguiendo el formato del Acta 349.`
      },
      { name: "FASE 2: INTERVENCIONES INICIALES", prompt: `CONTINUAMOS (PASO 2/5): Redacta intervenciones post-orden del día. Recuerda: Isvimed (Título), ICBF (Mayúscula).` },
      { name: "FASE 3: DEBATE CENTRAL (A)", prompt: `CONTINUAMOS (PASO 3/5): Primera mitad del debate central. Usa comillas inglesas (“”) para los discursos.` },
      { name: "FASE 4: DEBATE CENTRAL (B)", prompt: `CONTINUAMOS (PASO 4/5): Segunda mitad y conclusiones. Cuida el formato de moneda ($ 20.000).` },
      { name: "FASE 5: CIERRE", prompt: `FINALIZAMOS (PASO 5/5): Proposiciones finales y cierre con la fórmula: 'Agotado el orden del día...'` }
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

TAREA: ACTÚA COMO UN ASISTENTE DE REDACCIÓN (ESTILO ACTA 349).
1. Copia el texto EXACTAMENTE igual (Verbatim).
2. DETECTA ACRÓNIMOS: "ISVIMED" -> sugerir "Isvimed". "Icbf" -> sugerir "ICBF".
3. DETECTA COMILLAS: Títulos con «...», Discurso con “...”.
4. DETECTA MONEDA: "$20.000" -> sugerir "$ 20.000" (espacio).
5. DETECTA COHERENCIA Y BASURA.
6. NO RESUMAS.`;

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
          { text: "INSTRUCCIÓN: Analiza este documento. Extrae el texto y aplica etiquetas <FLAW> según Manual Acta 349." },
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