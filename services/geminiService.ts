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

// PROMPT DE AUDITORÍA: Configurado como motor de regex semántico, no como chat.
const AUDIT_SYSTEM_INSTRUCTION = `
ROLE: XML TEXT TAGGING ENGINE.
TASK: Receive input text and return it EXACTLY verbatim, injecting <FLAW> tags for style violations.

### CRITICAL RULES (ZERO TOLERANCE FOR SUMMARIZATION):
1. **FULL ECHO**: The text outside the tags MUST match the input character-for-character.
2. **NO OMISSION**: Do not skip sentences, headers, or footers.
3. **NO COMMENTS**: Do not output "Here is the text", "Processed:", or markdown code blocks. Just the raw XML-tagged text.

### STYLE RULES (MANUAL V3_2026):
Tag errors using: <FLAW type="[type]" suggestion="[correction]">original_text</FLAW>

1. **Hierarchy of Quotes**:
   - Error: "Text" or 'Text'. -> Suggestion: “Text” (English quotes).
   - Error: .”, -> Suggestion: ”., (Punctuation OUTSIDE).
2. **Capitalization**:
   - Error: "Secretario", "Alcalde" (Positions). -> Suggestion: "secretario", "alcalde".
   - Error: "secretaría de hacienda" (Entities). -> Suggestion: "Secretaría de Hacienda".
3. **Numbers**:
   - Error: "20 mil". -> Suggestion: "$ 20.000".
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

  // CHUNK SIZE REDUCIDO A 4000 PARA GARANTIZAR SEGURIDAD TOTAL EN EL OUTPUT.
  // 4000 chars ~= 1000 tokens de input.
  // El modelo devuelve ~= 1000-1200 tokens de output (texto + tags).
  // Límite del modelo es 8192. Estamos sobrados de margen, lo que evita cortes.
  private chunkText(text: string, chunkSize: number = 4000): string[] {
    const chunks: string[] = [];
    let currentIndex = 0;
    while (currentIndex < text.length) {
      let end = Math.min(currentIndex + chunkSize, text.length);
      // Intentar cortar en un salto de línea para no romper frases
      if (end < text.length) {
        const nextNewLine = text.indexOf('\n', end);
        if (nextNewLine !== -1 && nextNewLine - end < 500) { // Look ahead limit reduced
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
      // 1. Consolidación de texto de entrada
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

      // 2. Lógica de Tubería (Piping)
      if (!hasBinary && allText.length > 0) {
        // Usamos chunks más pequeños para asegurar que el output (que es input + tags) 
        // nunca exceda el límite de tokens de salida.
        const chunks = this.chunkText(allText, 4000); 
        console.log(`[Audit] Processing ${allText.length} chars in ${chunks.length} chunks.`);
        
        const results = [];
        
        for (let i = 0; i < chunks.length; i++) {
             const chunk = chunks[i];
             
             if (onProgress) {
                 onProgress(i + 1, chunks.length);
             }

             // El prompt es una orden de REPRODUCCIÓN, no de análisis.
             const prompt = `INPUT_DATA_START:
${chunk}
:INPUT_DATA_END

TASK: REPRODUCE THE INPUT DATA EXACTLY.
1. Copy the text inside INPUT_DATA_START and INPUT_DATA_END word-for-word.
2. While copying, inject <FLAW> tags where style rules are violated.
3. DO NOT SUMMARIZE. DO NOT TRUNCATE.
4. Output ONLY the tagged text.`;

             const response = await this.generateWithFallback(
                {
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    config: {
                        systemInstruction: AUDIT_SYSTEM_INSTRUCTION,
                        temperature: 0.0, // Determinismo máximo
                        maxOutputTokens: 8192,
                    }
                },
                'gemini-3-flash-preview',
                'gemini-flash-latest'
             );
             
             // Limpieza básica por si el modelo devuelve markdown extra
             let resultText = response.text || "";
             resultText = resultText.replace(/^```xml\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
             
             results.push(resultText);
        }
        
        // Reconstrucción del documento total
        return results.join(""); 
      }

      // Fallback para binarios (imágenes/audio) donde no podemos hacer chunking de texto
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