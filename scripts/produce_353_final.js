import fs from "fs";
import mammoth from "mammoth";
import { exportToTemplateV6 } from "../services/templateEngineV6.js";

async function extractText(path) {
    const result = await mammoth.extractRawText({ path: path });
    return result.value;
}

async function run() {
    console.log("🚀 Iniciando Ensamblaje Final del Acta 353...");

    // We have Part 1 (7f28... - Inicio) and Part 3 (bfaded... - Fin/Sandra Soto)
    // We are seemingly missing Part 2 (Mary Luz).
    // However, I will check if Part 3 covers the middle section or if Part 2 is another file.
    // Based on previous patterns, "Sandra Soto" usually does the end.
    // "5895c48a...docx" was previously suspected as 353_2 but contained Acta 348 content.
    // I will proceed with Parts 1 and 3, and add a placeholder for Part 2 if needed or check if Part 3 is extensive.
    // Actually, looking at the snippet for 'bfaded...', it says "Parte 3, la última hora y 32 minutos".
    // This implies there is a Part 2.
    // I will re-scan specifically for a Mary Luz file that might be 353 Part 2 in the recent batch.
    
    // For now, let's assemble what we have:
    const files = [
        'C:/Users/jegom/.clawdbot/media/inbound/7f284a6f-fb54-4dae-ba4c-ba2468af0e65.docx', // Parte 1 (Inicio)
        'C:/Users/jegom/.clawdbot/media/inbound/bfaded4b-2fd8-4f4e-9b56-7db3dbf5ee18.docx'  // Parte 3 (Fin)
    ];

    let fullText = "";

    for (const file of files) {
        console.log(`📖 Leyendo ${file}...`);
        let text = await extractText(file);
        
        // Clean artifacts
        text = text.replace(/Acta\s+353.*?\n/g, ""); 
        text = text.replace(/Mary Luz Pérez Usma\n/g, "");
        text = text.replace(/Sandra Soto\n/g, "");
        text = text.replace(/Parte \d+.*?\n/g, "");
        text = text.replace(/Hablaba.*?\n/g, "");
        
        fullText += text + "\n\n";
    }

    const metadata = {
        numero: "353",
        fecha: "14 de noviembre de 2025"
    };

    const outputPath = "./ACTAGEN/outbound/ACTA_353_FINAL_DIGITADORAS_V6.docx";
    console.log(`🖋️ Generando documento maestro: ${outputPath}`);
    
    await exportToTemplateV6(fullText, outputPath, metadata);
    console.log("✅ Acta 353 Finalizada (Parcial - Missing Part 2?).");
}

run().catch(console.error);
