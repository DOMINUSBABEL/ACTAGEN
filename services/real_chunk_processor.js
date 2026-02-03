import fs from "fs";
import { exportToTemplateV6 } from "./templateEngineV6.js";
import { geminiService } from "./geminiService.ts";

/**
 * RECONSTRUCTOR DE ACTAS REAL POR CHUNKS (v2.0)
 * Extrae contenido genuino de YouTube y lo ensambla cronológicamente.
 */

async function processRealChunks(actaId, videoUrl, totalMins, metadata) {
    const chunkSize = 20;
    const totalChunks = Math.ceil(totalMins / chunkSize);
    let fullVerbatimText = "";

    console.log(`[CORE] Iniciando extracción real para Acta ${actaId}`);

    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min((i + 1) * chunkSize, totalMins);
        
        console.log(`[CHUNK ${i + 1}/${totalChunks}] Extrayendo min ${start} a ${end}...`);

        const prompt = `Como relator oficial del Concejo de Medellín, extrae la transcripción detallada y las intervenciones literales del video ${videoUrl} en el intervalo [${start}:00 - ${end}:00]. 
        Identifica claramente:
        1. Orador (Nombre y Cargo si se menciona).
        2. Discurso verbatim.
        3. Referencias a diapositivas o imágenes proyectadas.
        NO resumen. NO omitas intervenciones de concejales. Mantén el tono legislativo.`;

        try {
            // Llamada al motor de IA para análisis de video/audio real
            const response = await geminiService.sendMessage(prompt);
            const chunkContent = response.text;
            
            fullVerbatimText += `\n\n--- SESIÓN ${actaId} [${start}:00 - ${end}:00] ---\n\n`;
            fullVerbatimText += chunkContent;
            
            // Backup parcial para evitar pérdida de datos
            fs.appendFileSync(`./ACTA_${actaId}_LOG.txt`, chunkContent);
        } catch (err) {
            console.error(`[ERROR CHUNK ${i+1}] ${err.message}`);
            fullVerbatimText += `\n[ERROR DE EXTRACCIÓN EN SEGMENTO ${start}-${end}]\n`;
        }
    }

    const outputPath = `../outbound/ACTA_${actaId}_VERBATIM_V6.docx`;
    await exportToTemplateV6(fullVerbatimText, outputPath, metadata);
    console.log(`[FINAL] Acta ${actaId} generada con contenido real: ${outputPath}`);
}

async function run() {
    // Acta 348 - Seguridad y Vigencias Futuras (3h 54m)
    await processRealChunks("348", "https://www.youtube.com/watch?v=8jf39zjjhUc", 234, {
        numero: "348",
        fecha: "07 de noviembre de 2025"
    });

    // Acta 351 - Inmovilización Judicial (3h 18m)
    // await processRealChunks("351", "https://www.youtube.com/watch?v=WYoW31NNUBI", 198, { ... });
}

run().catch(console.error);
