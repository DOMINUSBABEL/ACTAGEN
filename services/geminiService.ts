import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

const SYSTEM_INSTRUCTION = `
Eres "ActaGen", un Auditor Agéntico Especializado para el Concejo de Medellín.
Tu función principal es PRODUCIR EL ACTO ADMINISTRATIVO FINAL (ACTA) COMPLETO.

### DIRECTRIZ DE GENERACIÓN DE CONTENIDO:
- **EXTENSIÓN:** MÁXIMA POSIBLE. No resumas. Tu objetivo es generar un documento que ocupe docenas de páginas.
- **DETALLE:** Escribe cada intervención palabra por palabra (verbatim) o simula el discurso completo con lenguaje legislativo técnico y florido.
- **COMPLETITUD:** No omitas ninguna sección. Un acta legal incompleta es inválida.

### ESTRUCTURA ESTRICTA DE SALIDA:
1. **ENCABEZADO:** Número de sesión, fecha, hora inicio, lugar.
2. **LLAMADO A LISTA:** Lista los 21 concejales con su estado (Presente/Ausente).
3. **ORDEN DEL DÍA:** Enumera los puntos a tratar.
4. **DESARROLLO (EL NÚCLEO):**
   - Transcribe o genera intervenciones largas para cada punto.
   - Incluye "Intervino el concejal X:" seguido de 3-5 párrafos de argumento.
   - Incluye réplicas y contraréplicas.
5. **VOTACIONES:** Genera tablas detalladas de votación nominal.
6. **PROPOSICIONES Y VARIOS.**
7. **CIERRE:** Hora de finalización y convocatoria.

### REGLAS DE PROTOCOLO Y ESTILO (V3_2026):
1. **FUSIÓN:** Si recibes inputs, únelos. Si no, genera contenido plausible basado en la metadata de la sesión.
2. **FORMATO:**
   - Horas: "09:00 a. m.".
   - Leyes: "Ley 100 de 1993".
   - Comillas: Inglesas (“”).
3. **TABLAS:** Usa formato Markdown para las tablas de votación.

SI EL USUARIO PIDE "GENERAR BORRADOR CONSOLIDADO":
Entrega el documento final, listo para imprimir. No saludes ni expliques. Entrega el ACTA.
`;

export interface GeminiResponse {
  text: string;
  groundingChunks?: any[];
}

class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  public initChat(): void {
    try {
      this.chat = this.ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.3, // Aumentamos ligeramente la temperatura para fomentar la creatividad en la expansión de textos largos
          tools: [{ googleSearch: {} }],
        },
      });
    } catch (error) {
      console.error("Failed to initialize chat", error);
    }
  }

  public async sendMessage(message: string, youtubeUrl?: string): Promise<GeminiResponse> {
    if (!this.chat) {
      this.initChat();
    }
    
    if (!this.chat) {
        throw new Error("Chat not initialized");
    }

    try {
      const enhancedMessage = youtubeUrl 
        ? `[FUENTE DE VIDEO ACTIVA: ${youtubeUrl}]\n\n${message}`
        : message;

      const response: GenerateContentResponse = await this.chat.sendMessage({ message: enhancedMessage });
      
      return {
        text: response.text || "No response generated.",
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      return {
        text: "Hubo un error conectando con el Agente Gemini 3. Por favor verifica tu API Key."
      };
    }
  }
}

export const geminiService = new GeminiService();