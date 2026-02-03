import fs from "fs";
import mammoth from "mammoth";
import { exportToTemplateV6 } from "../services/templateEngineV6.js";

async function extractText(path) {
    const result = await mammoth.extractRawText({ path: path });
    return result.value;
}

async function run() {
    console.log("🚀 Iniciando Ensamblaje Final del Acta 348 (Human Sources)...");

    // Part 1: Start (0:00 - 1:11) - Previously extracted or from Part 3 (Cover/Intro)
    // Part 2: Middle (1:11 - 2:23) - Mary Luz Draft
    // Part 3: End (2:23 - End) - Sandra Soto Draft

    const files = [
        'C:/Users/jegom/.clawdbot/media/inbound/5f29afe8-db26-4118-9f62-044dd2eeba26.docx', // Cover & Intro (Part 3 file, but actually Start)
        'C:/Users/jegom/.clawdbot/media/inbound/7fefad4d-4b86-43a6-9f87-852b8fab2aac.docx', // Middle (Part 2)
        'C:/Users/jegom/.clawdbot/media/inbound/d1393908-b306-49d7-ae80-266318e017e4.docx'  // End (Part 1 file, but actually End)
    ];

    let fullText = "";

    // 1. Extract and Clean
    for (const file of files) {
        console.log(`📖 Leyendo ${file}...`);
        let text = await extractText(file);
        
        // Limpieza de artefactos de digitadoras
        text = text.replace(/Acta\s+3[45][18].*?\n/g, ""); 
        text = text.replace(/Mary Luz Pérez Usma\n/g, "");
        text = text.replace(/Sandra Soto\n/g, "");
        text = text.replace(/Parte \d+.*?\n/g, "");
        text = text.replace(/Hablaba.*?\n/g, "");
        
        fullText += text + "\n\n";
    }

    // 2. Generate Final Doc
    const metadata = {
        numero: "348",
        fecha: "07 de noviembre de 2025"
    };

    const outputPath = "./ACTAGEN/outbound/ACTA_348_FINAL_DIGITADORAS_V6.docx";
    console.log(`🖋️ Generando documento maestro: ${outputPath}`);
    
    await exportToTemplateV6(fullText, outputPath, metadata);
    console.log("✅ Acta 348 Finalizada (Fuente Humana).");
}

run().catch(console.error);
