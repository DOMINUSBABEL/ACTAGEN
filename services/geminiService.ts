import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

// Definimos la instrucción del sistema con esteroides para evitar resúmenes.
const SYSTEM_INSTRUCTION = `
Eres "ActaGen", el Relator Oficial del Concejo de Medellín. TU OBJETIVO ES LA PRECISIÓN Y LA EXTENSIÓN.
ESTÁ ESTRICTAMENTE PROHIBIDO RESUMIR. DEBES GENERAR UN DOCUMENTO "VERBATIM FORMALIZADO".

### PROTOCOLO DE PROCESAMIENTO DE AUDIO LARGO:
El usuario te entregará un audio de larga duración (1 a 4 horas).
NO INTENTES TRANSCRIBIR TODO EN UNA SOLA RESPUESTA.
Trabajaremos por FASES. En cada turno, te pediré que proceses una parte específica de la sesión.

### TUS PODERES DE REDACCIÓN:
1. **EXTENSIÓN OBLIGATORIA:** Si un concejal habla durante 10 minutos, tu redacción debe reflejar la totalidad de sus argumentos, no solo la idea central.
2. **TONO SOLEMNE:** Transforma "dijo que la seguridad está mal" por "El Honorable Concejal manifiesta su profunda preocupación por el deterioro de los indicadores de seguridad...".
3. **IDENTIFICACIÓN DE VOCES:** Usa el audio para identificar quién habla. Si no sabes el nombre, usa "El H.C. Interviniente".

### FORMATO DE SALIDA (MARKDOWN):
Usa títulos claros (###), negrillas para nombres y tablas para votaciones.
`;

const AUDIT_SYSTEM_INSTRUCTION = `
Eres el **AUDITOR MASTER Y EDITOR DE ACTAGEN**. Tu tarea es doble: FUSIONAR borradores fragmentados y AUDITAR el resultado final.

### FASE 1: FUSIÓN INTELIGENTE Y LIMPIEZA (PROTOCOLO 19 PASOS)
Recibirás múltiples archivos (Partes de transcripción). Debes procesarlos así:
1. **Concatenación Lógica:** Une los archivos en el orden provisto.
2. **Eliminación de Solapamientos (Overlap):** Es CRÍTICO que detectes si el final del Archivo N se repite al inicio del Archivo N+1. Elimina la redundancia para crear una frase gramaticalmente perfecta.
3. **Limpieza de "Basura" Editorial:** Elimina encabezados de página, números de folio originales, o marcas de software de transcripción que hayan quedado en medio del texto fusionado.
4. **Unificación:** El texto resultante debe parecer un solo documento continuo, sin saltos abruptos.

### FASE 2: AUDITORÍA TEI / XML (MANUAL DE ESTILO V3_2026)
Sobre el texto YA FUSIONADO y LIMPIO, ejecuta la auditoría:
1. Envuelve errores con: <FLAW type="[tipo]" severity="[high/medium/low]" suggestion="[corrección]">texto erroneo</FLAW>
2. Tipos de error: 
   - 'spelling' (Ortografía)
   - 'style' (Uso de comillas incorrectas, mayúsculas en cargos, formato de hora erróneo)
   - 'coherence' (Frases cortadas por mala fusión)
   - 'format' (Tablas de votación mal formadas)

IMPORTANTE: Devuelve el texto completo fusionado con las marcas XML insertadas.
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

  // Método Multi-parte con FALLBACK inteligente
  public async auditTextWithTEI(contents: any[]): Promise<string> {
    try {
      // Preparamos el mensaje del usuario con todas las partes
      const userMessage = {
        role: 'user',
        parts: [
          { text: "Por favor, FUSIONA estos borradores en un solo documento continuo, elimina redundancias en los empalmes y luego EJECUTA LA AUDITORÍA XML sobre el resultado." },
          ...contents
        ]
      };

      const params = {
        contents: [userMessage],
        config: {
          systemInstruction: AUDIT_SYSTEM_INSTRUCTION,
          temperature: 0.1,
          maxOutputTokens: 8192,
        }
      };

      // ESTRATEGIA: Intentar Gemini 3 (Primary) -> Fallback a Gemini Flash Latest (Stable)
      // 'gemini-flash-latest' suele ser la versión estable más robusta (actualmente 1.5 o 2.5) con mejores cuotas.
      const response = await this.generateWithFallback(
        params,
        'gemini-3-flash-preview', 
        'gemini-flash-latest' 
      );

      return response.text || "No se pudo generar el análisis XML.";
    } catch (error: any) {
      console.error("Error en auditoría TEI:", error);
      
      let errorMsg = error.message || JSON.stringify(error);
      if (this.isQuotaError(error)) {
        return `⚠️ **SISTEMA SATURADO (ERROR 429 PERSISTENTE):**
        
        Se agotaron todos los intentos (Primary + Fallback) debido a límites de cuota de Google.
        
        **Posibles Causas:**
        - El volumen de texto/archivos es demasiado grande para un solo request (> 1 Millón de tokens).
        - La cuenta de facturación tiene un límite estricto.
        
        **Solución:** Intente subir los archivos de uno en uno o reduzca su tamaño.`;
      }
      return `Error de Análisis: ${errorMsg}`;
    }
  }
}

export const geminiService = new GeminiService();