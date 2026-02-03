import fs from "fs";
import { geminiCLIService } from "./geminiCLIService.ts";
import { exportToTemplateV6 } from "./templateEngineV6.js";

/**
 * PRODUCTION PIPELINE: YOUTUBE TO DOCX (CLI POWERED)
 * Uses Gemini CLI to extract massive amounts of verbatim text without API overhead.
 */

async function runProductionPipeline(actaId, videoUrl, durationMins, metadata) {
    console.log(`\n--- INICIANDO PRODUCCIÓN ACTA ${actaId} (CLI MODE) ---`);
    const chunkSize = 20;
    const totalChunks = Math.ceil(durationMins / chunkSize);
    let fullActaText = "";

    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min((i + 1) * chunkSize, durationMins);
        
        console.log(`[${i+1}/${totalChunks}] Extrayendo bloque ${start}-${end} min...`);
        
        try {
            const transcript = geminiCLIService.extractFromVideo(videoUrl, start, end);
            fullActaText += `\n\n--- BLOQUE ${start}:00 - ${end}:00 ---\n\n${transcript}`;
            
            // Backup incremental
            fs.appendFileSync(`./ACTA_${actaId}_CLI_RAW.txt`, transcript);

            // 🛑 OPTIMIZACIÓN DE CUOTA: Pausa obligatoria entre llamadas masivas
            console.log("⏸️ Enfriando motores para proteger cuota (15s)...");
            await new Promise(resolve => setTimeout(resolve, 15000));

        } catch (err) {
            console.error(`Error en bloque ${start}-${end}:`, err.message);
        }
    }

    const outputPath = `../outbound/ACTA_${actaId}_CLI_EXHAUSTIVE_V6.docx`;
    console.log(`🖋️ Exportando a DOCX V6: ${outputPath}`);
    await exportToTemplateV6(fullActaText, outputPath, metadata);
    console.log(`✅ Acta ${actaId} finalizada con éxito.`);
}

async function start() {
    // Acta 348
    await runProductionPipeline("348", "https://www.youtube.com/watch?v=8jf39zjjhUc", 234, {
        numero: "348",
        fecha: "07 de noviembre de 2025"
    });

    // Acta 351
    await runProductionPipeline("351", "https://www.youtube.com/watch?v=WYoW31NNUBI", 198, {
        numero: "351",
        fecha: "12 de noviembre de 2025"
    });
}

start().catch(console.error);
