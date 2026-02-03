import { execSync } from "child_process";
import fs from "fs";

/**
 * GEMINI CLI WRAPPER SERVICE
 * Provides direct access to Google's Gemini models via the CLI for high-capacity tasks.
 */

class GeminiCLIService {
    /**
     * Executes a prompt via Gemini CLI and returns the text output.
     * @param {string} prompt The instruction for the model.
     * @param {string} inputPath Optional path to a file to include in the context.
     * @returns {string} The model's response.
     */
    public query(prompt: string, inputPath?: string): string {
        try {
            const command = inputPath 
                ? `gemini --prompt "${prompt.replace(/"/g, '\\"')}" < "${inputPath}"`
                : `gemini --prompt "${prompt.replace(/"/g, '\\"')}"`;
            
            console.log(`[CLI] Executing: gemini --prompt "${prompt.substring(0, 50)}..."`);
            const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
            return output;
        } catch (error: any) {
            console.error("[CLI ERROR]", error.message);
            throw new Error(`Gemini CLI failed: ${error.message}`);
        }
    }

    /**
     * Specialized method for video transcript extraction via CLI.
     */
    public extractFromVideo(videoUrl: string, startMin: number, endMin: number): string {
        const prompt = `Actúa como relator experto del Concejo de Medellín. 
        Analiza el video ${videoUrl} en el intervalo [${startMin}:00 - ${endMin}:00]. 
        Extrae la transcripción literal (verbatim), identifica oradores por nombre y cargo, 
        y describe cualquier imagen o diapositiva proyectada. 
        Formato: "Intervino [Nombre]: [Discurso]". 
        REGLA DE ORO: NO RESUMAS. Entrega cada palabra dicha.`;
        
        return this.query(prompt);
    }
}

export const geminiCLIService = new GeminiCLIService();
