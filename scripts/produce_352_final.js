import fs from "fs";
import mammoth from "mammoth";
import { exportToTemplateV6 } from "../services/templateEngineV6.js";

async function extractText(path) {
    const result = await mammoth.extractRawText({ path: path });
    return result.value;
}

async function run() {
    console.log("🚀 Iniciando Ensamblaje Final del Acta 352...");

    const files = [
        'C:/Users/jegom/.clawdbot/media/inbound/cac753ff-f026-480e-999f-0e869002b488.docx', // Parte 1 (Citacion Infraestructura)
        'C:/Users/jegom/.clawdbot/media/inbound/5895c48a-52b1-4204-aecb-19da4a051602.docx', // Parte 2 (Incorrectly labeled 353? Checking content...)
        'C:/Users/jegom/.clawdbot/media/inbound/1bfd9ab9-646e-4487-8893-b6a62af01960.docx'  // Parte 3
    ];

    let fullText = "";

    // 1. Extract and Clean
    for (const file of files) {
        console.log(`📖 Leyendo ${file}...`);
        let text = await extractText(file);
        
        // Limpieza de artefactos de digitadoras
        text = text.replace(/Acta\s+3[45][1823].*?\n/g, ""); 
        text = text.replace(/Mary Luz Pérez Usma\n/g, "");
        text = text.replace(/Sandra Soto\n/g, "");
        text = text.replace(/Parte \d+.*?\n/g, "");
        text = text.replace(/Hablaba.*?\n/g, "");
        
        fullText += text + "\n\n";
    }

    // 2. Generate Final Doc
    const metadata = {
        numero: "352",
        fecha: "13 de noviembre de 2025"
    };

    const outputPath = "./ACTAGEN/outbound/ACTA_352_FINAL_DIGITADORAS_V6.docx";
    console.log(`🖋️ Generando documento maestro: ${outputPath}`);
    
    await exportToTemplateV6(fullText, outputPath, metadata);
    console.log("✅ Acta 352 Finalizada.");
}

run().catch(console.error);
