import { extractContentWithImages } from "./lib/extractor.cjs";
import { exportToTemplateV7 } from "../services/templateEngineV7.js";

async function processActaWithImages(actaId, files, metadata) {
    console.log(`🚀 Procesando Acta ${actaId} (V7 - Con Imágenes)...`);
    
    const imageDir = `C:/Users/jegom/clawd/ACTAGEN/outbound/images_${actaId}`;
    let fullContent = [];

    for (const file of files) {
        console.log(`📖 Leyendo ${file}...`);
        const content = await extractContentWithImages(file, imageDir);
        fullContent = fullContent.concat(content);
    }

    const outputPath = `./ACTAGEN/outbound/ACTA_${actaId}_FINAL_V7_IMAGES.docx`;
    await exportToTemplateV7(fullContent, outputPath, metadata, imageDir);
    console.log(`✅ Acta ${actaId} Generada: ${outputPath}`);
    return outputPath;
}

async function run() {
    // Acta 351 (12 Nov)
    await processActaWithImages("351", [
        'C:/Users/jegom/.clawdbot/media/inbound/76288d80-e15e-47d6-95c9-2e893b316b81.docx',
        'C:/Users/jegom/.clawdbot/media/inbound/023510bd-c890-460c-9b27-9ef8a8482c8e.docx',
        'C:/Users/jegom/.clawdbot/media/inbound/6fdd23e2-3320-46c5-8de8-71928b4c438c.docx'
    ], { numero: "351", fecha: "12 de noviembre de 2025" });

    // Acta 352 (13 Nov)
    await processActaWithImages("352", [
        'C:/Users/jegom/.clawdbot/media/inbound/cac753ff-f026-480e-999f-0e869002b488.docx',
        'C:/Users/jegom/.clawdbot/media/inbound/5895c48a-52b1-4204-aecb-19da4a051602.docx',
        'C:/Users/jegom/.clawdbot/media/inbound/1bfd9ab9-646e-4487-8893-b6a62af01960.docx'
    ], { numero: "352", fecha: "13 de noviembre de 2025" });

    // Acta 354 (15 Nov)
    await processActaWithImages("354", [
        'C:/Users/jegom/.clawdbot/media/inbound/a27d2068-1be3-4eb3-8bac-944ed79bd2d0.docx',
        'C:/Users/jegom/.clawdbot/media/inbound/ab994ab4-02c9-42e3-8a2b-6c30c77446df.docx',
        'C:/Users/jegom/.clawdbot/media/inbound/56fc907b-f090-415d-bcc5-6cb8991190ca.docx'
    ], { numero: "354", fecha: "15 de noviembre de 2025" });
}

run().catch(console.error);
