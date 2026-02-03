import fs from "fs";
import mammoth from "mammoth";
import { exportToTemplateV6 } from "../services/templateEngineV6.js";

async function extractText(path) {
    const result = await mammoth.extractRawText({ path: path });
    return result.value;
}

async function run() {
    console.log("🚀 Iniciando Ensamblaje Final del Acta 354...");

    const files = [
        'C:/Users/jegom/.clawdbot/media/inbound/a27d2068-1be3-4eb3-8bac-944ed79bd2d0.docx', // Parte 1 (Inicio)
        'C:/Users/jegom/.clawdbot/media/inbound/ab994ab4-02c9-42e3-8a2b-6c30c77446df.docx', // Parte 2 (Medio)
        'C:/Users/jegom/.clawdbot/media/inbound/56fc907b-f090-415d-bcc5-6cb8991190ca.docx'  // Parte 3 (Fin)
    ];

    let fullText = "";

    for (const file of files) {
        console.log(`📖 Leyendo ${file}...`);
        let text = await extractText(file);
        
        // Limpieza de metadatos de digitadoras
        text = text.replace(/Acta\s+354.*?\n/g, ""); 
        text = text.replace(/Mary Luz Pérez Usma\n/g, "");
        text = text.replace(/Sandra Soto\n/g, "");
        text = text.replace(/Parte \d+.*?\n/g, "");
        text = text.replace(/Hablaba.*?\n/g, "");
        
        fullText += text + "\n\n";
    }

    const metadata = {
        numero: "354",
        fecha: "15 de noviembre de 2025"
    };

    const outputPath = "./ACTAGEN/outbound/ACTA_354_FINAL_DIGITADORAS_V6.docx";
    console.log(`🖋️ Generando documento maestro: ${outputPath}`);
    
    await exportToTemplateV6(fullText, outputPath, metadata);
    console.log("✅ Acta 354 Finalizada.");
}

run().catch(console.error);
