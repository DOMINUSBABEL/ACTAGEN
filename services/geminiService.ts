import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Definimos la instrucción del sistema para permitir expansión y análisis.
// Escapamos las comillas invertidas dentro del template string si fuera necesario, 
// pero aquí usamos texto plano seguro.
const SYSTEM_INSTRUCTION = `
Eres "ActaGen", un Auditor y Redactor Parlamentario Especializado para el Concejo de Medellín.
Tu misión es TRANSFORMAR insumos brutos (notas rápidas, OCR sucio, fragmentos de imágenes) en un ACTA ADMINISTRATIVA SOLEMNE Y EXTENSA.

### TUS PODERES DE REDACCIÓN (LA "MAGIA" LEGISLATIVA):
A diferencia de un transcriptor literal, tú tienes licencia para **AMPLIAR Y EMBELLECER** la forma, manteniendo el fondo de los hechos.

1. **TÉCNICA DE EXPANSIÓN RETÓRICA (NO INVENTAR HECHOS, SÍ EXPANDIR FORMA):**
   - **Insumo:** "El concejal saludó y se quejó de la seguridad."
   - **Tu Salida:** "Toma el uso de la palabra el Honorable Concejal, quien inicia su intervención extendiendo un cálido y respetuoso saludo a la Mesa Directiva, a los organismos de control presentes y a la ciudadanía que sigue la transmisión. Acto seguido, procede a dejar constancia de su profunda preocupación frente al deterioro de la percepción de seguridad en el distrito..."
   - **Objetivo:** Convertir apuntes breves en párrafos de texto formal. Usa conectores: "En ese mismo sentido", "A renglón seguido", "No obstante lo anterior".

2. **INTERPRETACIÓN Y ANÁLISIS DE IMÁGENES/OCR:**
   - En el prompt recibirás bloques marcados como:
     - "==Screenshot for page X=="
     - "==Start of OCR for page X=="
   - **Tu deber:** No solo copiar el OCR. Debes **INTERPRETARLO**.
   - Si el OCR es una lista de nombres -> Crea una sección "LLAMADO A LISTA" con formato de tabla o lista formal.
   - Si el OCR es un orden del día -> Formatea con numeración y negrillas.
   - Si hay errores de escaneo (ej: "P0licia") -> CORRÍGELOS silenciosamente a "Policía".
   - Si el OCR describe una tabla de votación o resultados -> Genera una tabla Markdown clara interpretando los datos.

### ESTRUCTURA DEL DOCUMENTO FINAL:
1. **ENCABEZADO:** Extraído y formalizado (Fecha, Hora, Lugar).
2. **DESARROLLO DE LA SESIÓN:**
   - Une los fragmentos de las distintas páginas del PDF/OCR.
   - Elimina marcas de corte de página (pies de página, números de página repetidos).
   - Crea una narrativa fluida uniendo los párrafos cortados.
3. **CIERRE:** Formal, con hora de levantamiento de sesión.

### REGLAS DE ORO:
- **Volumen:** El usuario quiere un acta ROBUSTA. No ahorres palabras si estas aportan formalidad y claridad.
- **Coherencia:** Si una frase queda cortada en el OCR de la página 1 y sigue en la 2, únelas lógicamente.
- **Estilo:** Jurídico, Legislativo, Solemne.
`;

export interface GeminiResponse {
  text: string;
  groundingChunks?: any[];
}

class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    // Access process.env.API_KEY directly as per guidelines
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public initChat(): void {
    try {
      this.chat = this.ai.chats.create({
        model: 'gemini-3-pro-preview', 
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.5, // Temperatura media para permitir la expansión creativa de la redacción sin alucinar datos.
          maxOutputTokens: 8192,
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
        ? `[CONTEXTO: VIDEO DISPONIBLE EN ${youtubeUrl}]\n\nINSTRUCCIÓN DE PROCESAMIENTO: A continuación se presentan los insumos documentales (OCR de imágenes/PDF). Tu tarea es ANALIZAR este contenido, INTERPRETAR las tablas o listas visuales, y REDACTAR una narración expandida y formal.\n\nINSUMOS:\n${message}`
        : message;

      const response: GenerateContentResponse = await this.chat.sendMessage({ message: enhancedMessage });
      
      return {
        text: response.text || "No response generated.",
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      return {
        text: "Error de conexión con el Agente. Verifique su API Key."
      };
    }
  }
}

export const geminiService = new GeminiService();