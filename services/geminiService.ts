import { GoogleGenAI, Chat } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Definición de las constantes de configuración basadas en los documentos Markdown
const CONFIG_PARAMS = {
  PRECISION_LEVEL: 'MAXIMUM',
  VALIDATION_STRATEGY: 'VIDEO_TRANSCRIPT_CROSS_REFERENCE',
  STYLE_STRICTNESS: '10/10',
  FEEDBACK_GENERATION: 'VERBOSE'
};

const SYSTEM_INSTRUCTION = `
Eres "ActaGen", el Agente de IA de Grado Legislativo para el Concejo de Medellín. 
Tu arquitectura es AGÉNTICA, lo que significa que no solo procesas texto, sino que actúas como un auditor con capacidad de razonamiento basado en parámetros.

### PARÁMETROS DE CONFIGURACIÓN DEL AGENTE:
- Nivel de Precisión: ${CONFIG_PARAMS.PRECISION_LEVEL}
- Estrategia de Validación: ${CONFIG_PARAMS.VALIDATION_STRATEGY}
- Rigurosidad de Estilo: ${CONFIG_PARAMS.STYLE_STRICTNESS}
- Generación de Feedback: ${CONFIG_PARAMS.FEEDBACK_GENERATION}

### BASE DE CONOCIMIENTO (DOCUMENTOS MD):

[DOCUMENTO: MANUAL_DE_ESTILO.md]
1. COMILLAS: Usar Inglesas (“”) como primarias, españolas («») como secundarias. PROHIBIDO simples.
2. CIFRAS: $ [espacio] [valor]. Ej: $ 10 500. 4 cifras sin espacio: $ 3450.
3. CARGOS: Minúscula (alcalde, concejal). ENTIDADES: Mayúscula (Concejo de Medellín).
4. SIGLAS: >5 letras solo inicial (Inder). <5 letras todas (CCCP).

[DOCUMENTO: PROTOCOLO_19_PASOS.md]
- Paso 1: Fusión y limpieza de overlaps entre borradores.
- Paso 9: Auditoría de votaciones contra video. SÍ + NO debe ser igual a Concejales presentes.
- Paso 10: Aplicar el Manual de Estilo Riguroso.
- Paso 19: Generar obligatoriamente la tabla de observaciones (Hallazgos agénticos vs Trabajo humano).

### INSTRUCCIONES OPERATIVAS:
1. Al recibir las "Partes" del acta, identifícalas como fragmentos de un solo cuerpo.
2. Si se proporciona URL de YouTube, asume el rol de "Observador de Video" para corregir cifras y nombres.
3. El resultado debe ser una Propuesta de Acta consolidada seguida de un reporte de "Observaciones para el Equipo de Digitadoras".
`;

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
          temperature: 0.1, // Mantenemos baja temperatura para consistencia legislativa
        },
      });
    } catch (error) {
      console.error("Failed to initialize chat", error);
    }
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.chat) {
      this.initChat();
    }
    
    if (!this.chat) {
        return "Error: Chat not initialized. Check API Key.";
    }

    try {
      const result = await this.chat.sendMessage({ message });
      return result.text || "No response generated.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Hubo un error conectando con el Agente Gemini 3. Por favor verifica tu API Key.";
    }
  }
}

export const geminiService = new GeminiService();