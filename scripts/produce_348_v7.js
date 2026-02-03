import { extractContentWithImages } from "./lib/extractor.cjs";
import { exportToTemplateV7 } from "../services/templateEngineV7.js";

async function run() {
    console.log("🚀 Iniciando Re-Procesamiento Acta 348 (V7 - Con Imágenes)...");
    
    const imageDir = "C:/Users/jegom/clawd/ACTAGEN/outbound/images_348";
    const files = [
        'C:/Users/jegom/.clawdbot/media/inbound/5f29afe8-db26-4118-9f62-044dd2eeba26.docx', // Part 1
        'C:/Users/jegom/.clawdbot/media/inbound/7fefad4d-4b86-43a6-9f87-852b8fab2aac.docx', // Part 2 (Has images)
        'C:/Users/jegom/.clawdbot/media/inbound/d1393908-b306-49d7-ae80-266318e017e4.docx'  // Part 3
    ];

    let fullContent = [];

    for (const file of files) {
        console.log(`📖 Extrayendo multimedia de ${file}...`);
        const content = await extractContentWithImages(file, imageDir);
        fullContent = fullContent.concat(content);
    }

    const metadata = { numero: "348", fecha: "07 de noviembre de 2025" };
    const outputPath = "./ACTAGEN/outbound/ACTA_348_FINAL_V7_IMAGES.docx";
    
    await exportToTemplateV7(fullContent, outputPath, metadata, imageDir);
    console.log(`✅ Acta 348 V7 Generada: ${outputPath}`);
}

run().catch(console.error);
