import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Definimos la instrucción del sistema para permitir expansión y análisis.
const SYSTEM_INSTRUCTION = `
Eres "ActaGen", un Auditor y Redactor Parlamentario Especializado para el Concejo de Medellín.
Tu misión es TRANSFORMAR insumos brutos (notas rápidas, OCR sucio, fragmentos de imágenes, AUDIOS DE SESIÓN) en un ACTA ADMINISTRATIVA SOLEMNE Y EXTENSA.

### TUS PODERES DE REDACCIÓN (LA "MAGIA" LEGISLATIVA):
A diferencia de un transcriptor literal, tú tienes licencia para **AMPLIAR Y EMBELLECER** la forma, manteniendo el fondo de los hechos.

1. **FUENTE DE VERDAD (PRIORIDAD MÁXIMA):**
   - Si se proporciona un **VIDEO DE YOUTUBE** o un **ARCHIVO DE AUDIO (MP3)**, esta es tu fuente primaria para corroborar hechos, votaciones, lista de asistencia y tono de las intervenciones.
   - Usa el audio para corregir nombres mal escritos en los borradores de texto o llenar vacíos marcados como "(inaudible)".

2. **TÉCNICA DE EXPANSIÓN RETÓRICA (NO INVENTAR HECHOS, SÍ EXPANDIR FORMA):**
   - **Insumo:** "El concejal saludó y se quejó de la seguridad."
   - **Tu Salida:** "Toma el uso de la palabra el Honorable Concejal, quien inicia su intervención extendiendo un cálido y respetuoso saludo a la Mesa Directiva, a los organismos de control presentes y a la ciudadanía que sigue la transmisión. Acto seguido, procede a dejar constancia de su profunda preocupación frente al deterioro de la percepción de seguridad en el distrito..."
   - **Objetivo:** Convertir apuntes breves en párrafos de texto formal. Usa conectores: "En ese mismo sentido", "A renglón seguido", "No obstante lo anterior".

3. **INTERPRETACIÓN Y ANÁLISIS DE IMÁGENES/OCR:**
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
   - Si hay audio adjunto, úsalo para enriquecer la transcripción de las intervenciones clave.
   - Elimina marcas de corte de página (pies de página, números de página repetidos).
   - Crea una narrativa fluida uniendo los párrafos cortados.
3. **CIERRE:** Formal, con hora de levantamiento de sesión.

### REGLAS DE ORO:
- **Volumen:** El usuario quiere un acta ROBUSTA. No ahorres palabras si estas aportan formalidad y claridad.
- **Coherencia:** Si una frase queda cortada en el OCR de la página 1 y sigue en la 2, únelas lógicamente.
- **Estilo:** Jurídico, Legislativo, Solemne.
`;

// Instrucción específica para el modo Auditoría TEI
const AUDIT_SYSTEM_INSTRUCTION = `
Eres un AUDITOR DE CALIDAD XML/TEI para documentos legislativos.
Tu tarea NO es reescribir el texto, sino ANALIZARLO y MARCAR LOS ERRORES insertando etiquetas XML <FLAW> alrededor del texto problemático.

REGLAS DE MARCADO:
1. Identifica errores de ortografía, estilo (según manual municipal), coherencia o formalidad.
2. Envuelve el error con: <FLAW type="[tipo]" severity="[high/medium/low]" suggestion="[corrección]">texto erroneo</FLAW>
3. Tipos de error (type): 'spelling', 'grammar', 'style', 'format', 'coherence'.
4. El resto del texto debe quedar INTACTO.

EJEMPLO:
Entrada: "El consejal dijo q no estaba de acuerdo."
Salida: "El <FLAW type="spelling" severity="high" suggestion="concejal">consejal</FLAW> <FLAW type="style" severity="medium" suggestion="manifestó">dijo</FLAW> <FLAW type="grammar" severity="low" suggestion="que">q</FLAW> no estaba de acuerdo."
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
    // Access process.env.API_KEY directly as per guidelines
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public initChat(): void {
    try {
      this.chat = this.ai.chats.create({
        model: 'gemini-3-pro-preview', // Use a model capable of multimodal understanding (audio/video/text)
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.5,
          maxOutputTokens: 8192,
          tools: [{ googleSearch: {} }],
        },
      });
    } catch (error) {
      console.error("Failed to initialize chat", error);
    }
  }

  public async sendMessage(message: string, youtubeUrl?: string, audioData?: AudioPart): Promise<GeminiResponse> {
    if (!this.chat) {
      this.initChat();
    }
    
    if (!this.chat) {
        throw new Error("Chat not initialized");
    }

    try {
      let messageContent: any = [];
      let textPrompt = message;

      if (youtubeUrl) {
        textPrompt = `[CONTEXTO: VIDEO DISPONIBLE EN ${youtubeUrl}]\n\nINSTRUCCIÓN DE PROCESAMIENTO: A continuación se presentan los insumos documentales. Tu tarea es ANALIZAR este contenido, y usar el video como referencia cruzada.\n\nINSUMOS:\n${message}`;
      } else if (audioData) {
        textPrompt = `[CONTEXTO: AUDIO DE LA SESIÓN ADJUNTO]\n\nINSTRUCCIÓN DE PROCESAMIENTO: Escucha el audio adjunto para corroborar la fidelidad de las actas, identificar oradores y expandir intervenciones. Cruza esto con los documentos OCR proporcionados.\n\nINSUMOS:\n${message}`;
      }

      // Add text part
      messageContent.push({ text: textPrompt });

      // Add audio part if present
      if (audioData) {
        messageContent.push(audioData);
      }

      const response: GenerateContentResponse = await this.chat.sendMessage({ message: messageContent });
      
      return {
        text: response.text || "No response generated.",
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      return {
        text: "Error de conexión con el Agente. Verifique su API Key o el formato del archivo."
      };
    }
  }

  // Nuevo método para auditoría XML TEI (Stateless)
  public async auditTextWithTEI(text: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Modelo rápido para tareas de análisis de texto puro
        contents: text,
        config: {
          systemInstruction: AUDIT_SYSTEM_INSTRUCTION,
          temperature: 0.1, // Baja temperatura para precisión en el marcado
        }
      });
      return response.text || "No se pudo generar el análisis XML.";
    } catch (error) {
      console.error("Error en auditoría TEI:", error);
      return `Error de Análisis: ${(error as any).message}`;
    }
  }
}

export const geminiService = new GeminiService();