import fs from "fs";
import { extractContentWithImages } from "./lib/extractor.cjs";
import { exportToTemplateV7 } from "../services/templateEngineV7.js";

async function run() {
    console.log("🚀 Iniciando Ensamblaje Final del Acta 355...");

    const imageDir = "C:/Users/jegom/clawd/ACTAGEN/outbound/images_355";
    const files = [
        'C:/Users/jegom/.clawdbot/media/inbound/8c85376c-7a44-4fc3-b3c2-501f4019381c.docx', // Part 1
        'C:/Users/jegom/.clawdbot/media/inbound/41b3b716-f823-4e5c-8156-d96259e8a8df.docx', // Part 2
        'C:/Users/jegom/.clawdbot/media/inbound/eb5c5bbd-6426-4676-888b-42beaa5be26f.docx'  // Part 3
    ];

    let fullContent = [];

    for (const file of files) {
        console.log(`📖 Extrayendo de ${file}...`);
        let content = await extractContentWithImages(file, imageDir);
        
        // Clean artifacts
        content = content.map(item => {
            if (item.type === 'text') {
                let text = item.value;
                text = text.replace(/Acta\s+355.*?\n/g, ""); 
                text = text.replace(/Mary Luz Pérez Usma\n/g, "");
                text = text.replace(/Sandra Soto\n/g, "");
                text = text.replace(/Parte \d+.*?\n/g, "");
                text = text.replace(/Hablaba.*?\n/g, "");
                return { type: 'text', value: text };
            }
            return item;
        });

        fullContent = fullContent.concat(content);
    }

    const metadata = {
        numero: "355",
        fecha: "16 de noviembre de 2025"
    };

    const outputPath = "./ACTAGEN/outbound/ACTA_355_FINAL_DIGITADORAS_V7.docx";
    console.log(`🖋️ Generando documento maestro: ${outputPath}`);
    
    await exportToTemplateV7(fullContent, outputPath, metadata, imageDir);
    console.log("✅ Acta 355 Finalizada.");
}

run().catch(console.error);
