import { extractContentWithImages } from "./lib/extractor.cjs";
import { exportToDiplomaticV8 } from "../services/templateEngineV8.js";

async function run() {
    console.log("🚀 Produciendo ACTA 348 - Versión Diplomática Final (Replica 349)...");
    
    const imageDir = "C:/Users/jegom/clawd/ACTAGEN/outbound/images_348";
    const files = [
        'C:/Users/jegom/.clawdbot/media/inbound/5f29afe8-db26-4118-9f62-044dd2eeba26.docx',
        'C:/Users/jegom/.clawdbot/media/inbound/7fefad4d-4b86-43a6-9f87-852b8fab2aac.docx',
        'C:/Users/jegom/.clawdbot/media/inbound/d1393908-b306-49d7-ae80-266318e017e4.docx'
    ];

    let fullContent = [];

    for (const file of files) {
        console.log(`📖 Leyendo fuente: ${file}...`);
        const content = await extractContentWithImages(file, imageDir);
        fullContent = fullContent.concat(content);
    }

    const metadata = { 
        numero: "348", 
        fecha: "Martes 27 de enero de 2026" 
    };
    
    const outputPath = "./ACTAGEN/outbound/ACTA_348_DIPLOMATICA_FINAL.docx";
    
    await exportToDiplomaticV8(fullContent, outputPath, metadata, imageDir);
    console.log(`\n✨ DOCUMENTO FINALIZADO: ${outputPath}`);
    console.log(`Páginas estimadas: ~90`);
}

run().catch(console.error);
