import fs from "fs";
import mammoth from "mammoth";
import { exportToTemplateV6 } from "../services/templateEngineV6.js";

async function extractText(path) {
    const result = await mammoth.extractRawText({ path: path });
    return result.value;
}

async function run() {
    console.log("🚀 Iniciando Ensamblaje Final del Acta 351...");

    const files = [
        'C:/Users/jegom/.clawdbot/media/inbound/76288d80-e15e-47d6-95c9-2e893b316b81.docx', // Parte 1
        'C:/Users/jegom/.clawdbot/media/inbound/023510bd-c890-460c-9b27-9ef8a8482c8e.docx', // Parte 2
        'C:/Users/jegom/.clawdbot/media/inbound/6fdd23e2-3320-46c5-8de8-71928b4c438c.docx'  // Parte 3
    ];

    let fullText = "";

    // 1. Extract and Clean
    for (const file of files) {
        console.log(`📖 Leyendo ${file}...`);
        let text = await extractText(file);
        
        // Limpieza de artefactos de digitadoras
        text = text.replace(/Acta\s+3[45][18].*?\n/g, ""); // Remove header lines like "Acta 348 1:01:15..."
        text = text.replace(/Mary Luz Pérez Usma\n/g, "");
        text = text.replace(/Sandra Soto\n/g, "");
        text = text.replace(/Parte \d+.*?\n/g, "");
        text = text.replace(/Hablaba.*?\n/g, "");
        
        fullText += text + "\n\n";
    }

    // 2. Generate Final Doc
    const metadata = {
        numero: "351",
        fecha: "12 de noviembre de 2025"
    };

    const outputPath = "./ACTAGEN/outbound/ACTA_351_FINAL_DIGITADORAS_V6.docx";
    console.log(`🖋️ Generando documento maestro: ${outputPath}`);
    
    await exportToTemplateV6(fullText, outputPath, metadata);
    console.log("✅ Acta 351 Finalizada.");
}

run().catch(console.error);
