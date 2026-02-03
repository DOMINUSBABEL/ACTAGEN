import fs from "fs";
import { exportToTemplateV6 } from "./templateEngineV6.js";
import { geminiService } from "./geminiService.ts";

/**
 * CHUNK PROCESSOR FOR LONG SESSIONS
 * Divides video transcripts into 15-minute segments, processes with LLM, 
 * and merges into a final SIMI V6 document.
 */

async function processInChunks(actaId, videoDurationMins, metadata) {
    console.log(`🚀 Iniciando procesamiento por chunks para el Acta ${actaId}...`);
    const chunkSizeMins = 15;
    const totalChunks = Math.ceil(videoDurationMins / chunkSizeMins);
    let fullReconstructedContent = "";

    // 1. Initial Metadata Header
    fullReconstructedContent += `SESIÓN PLENARIA ORDINARIA\nACTA ${actaId}\n\n`;
    fullReconstructedContent += `FECHA: ${metadata.fecha}\n`;
    fullReconstructedContent += `HORA: Inicio ${metadata.horaInicio}\n`;
    fullReconstructedContent += `LUGAR: Recinto oficial de sesiones\n\n`;

    // 2. Iterative Chunk Processing
    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSizeMins;
        const end = Math.min((i + 1) * chunkSizeMins, videoDurationMins);
        console.log(`📦 Procesando Chunk ${i + 1}/${totalChunks}: [${start}:00 - ${end}:00]...`);

        // Prompt Gemini to extract detailed transcript for this segment
        const prompt = `Actúa como relator experto del Concejo de Medellín. 
        Analiza el segmento del video de la Sesión ${actaId} desde el minuto ${start} al ${end}.
        Extrae las intervenciones literales, identifica oradores y temas tratados.
        Formato: "Intervino [Nombre/Cargo]: [Contenido literal]".
        Regla: No resumas excesivamente, mantén la extensión legislativa.`;

        try {
            // Simulation of segment extraction (using geminiService)
            // In a real run, this would call the video API or use the transcript tool
            const segmentResult = await geminiService.sendMessage(prompt);
            fullReconstructedContent += `\n--- SEGMENTO ${start}:00 - ${end}:00 ---\n`;
            fullReconstructedContent += segmentResult.text;
            fullReconstructedContent += "\n";
        } catch (error) {
            console.error(`❌ Error en Chunk ${i + 1}:`, error.message);
            fullReconstructedContent += `\n[ERROR EN PROCESAMIENTO SEGMENTO ${start}-${end}]\n`;
        }
    }

    // 3. Final Reconstruction & Export
    const outputPath = `./ACTAGEN/outbound/ACTA_${actaId}_CHUNKED_RECONSTRUCTION_V6.docx`;
    console.log(`🖋️ Reconstruyendo documento final V6: ${outputPath}`);
    await exportToTemplateV6(fullReconstructedContent, outputPath, metadata);
    console.log(`✅ Proceso completado para Acta ${actaId}`);
    return outputPath;
}

// EXECUTION WRAPPER
async function run() {
    // Acta 348 - 234 minutes approx
    await processInChunks("348", 234, { 
        fecha: "07 de noviembre de 2025", 
        horaInicio: "09:30 a.m.",
        numero: "348" 
    });

    // Acta 351 - 198 minutes approx
    await processInChunks("351", 198, { 
        fecha: "12 de noviembre de 2025", 
        horaInicio: "09:28 a.m.",
        numero: "351" 
    });
}

run().catch(console.error);
