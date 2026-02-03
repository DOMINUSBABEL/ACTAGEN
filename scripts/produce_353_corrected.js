import { extractContentWithImages } from "./lib/extractor.cjs";
import { exportToTemplateV7 } from "../services/templateEngineV7.js";

async function run() {
    console.log("🚀 Iniciando Ensamblaje Correctivo del Acta 353...");

    const imageDir = "C:/Users/jegom/clawd/ACTAGEN/outbound/images_353";
    const files = [
        'C:/Users/jegom/.clawdbot/media/inbound/7f284a6f-fb54-4dae-ba4c-ba2468af0e65.docx', // Part 1
        'C:/Users/jegom/.clawdbot/media/inbound/5895c48a-52b1-4204-aecb-19da4a051602.docx', // Part 2 (CORRECT CONTENT, WRONG HEADER)
        'C:/Users/jegom/.clawdbot/media/inbound/bfaded4b-2fd8-4f4e-9b56-7db3dbf5ee18.docx'  // Part 3
    ];

    let fullContent = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📖 Extrayendo de ${file}...`);
        let content = await extractContentWithImages(file, imageDir);
        
        // SPECIAL CORRECTION FOR PART 2 (Index 1)
        if (i === 1) {
            console.log("🛠️ Aplicando corrección de encabezado en Parte 2...");
            content = content.map(item => {
                if (item.type === 'text') {
                    // Replace "Acta 348" with "Acta 353" if it appears in the header area
                    // Also generic cleanup
                    let text = item.value;
                    text = text.replace(/Acta 348/g, "Acta 353"); 
                    text = text.replace(/7 de noviembre/g, "14 de noviembre"); // Fix date if present
                    return { type: 'text', value: text };
                }
                return item;
            });
        }

        fullContent = fullContent.concat(content);
    }

    const metadata = { numero: "353", fecha: "14 de noviembre de 2025" };
    const outputPath = "./ACTAGEN/outbound/ACTA_353_FINAL_CORREGIDA_V7.docx";
    
    await exportToTemplateV7(fullContent, outputPath, metadata, imageDir);
    console.log(`✅ Acta 353 Corregida Generada: ${outputPath}`);
}

run().catch(console.error);
