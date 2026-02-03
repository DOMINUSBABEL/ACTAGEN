import { extractContentWithImages } from "./lib/extractor.cjs";
import { exportToDiplomaticV8 } from "../services/templateEngineV8.js";
import fs from "fs";
import path from "path";

const ACTA_MAP = {
  "374": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\29a6d4ce-db31-4ad7-a97c-68b8c711f949.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\d91011dd-585c-40f7-8e3b-30c4c3a99385.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\f4824e32-d5a9-4822-9f85-4c724cf19899.docx"
  ],
  "377": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\2adcc831-ee44-4c56-bfd9-ba205eeceade.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\b3fe6951-e668-4ca3-8324-4f87f8bc4e72.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\c27526cf-6f4b-496e-a935-58b96bb307a4.docx"
  ],
  "378": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\74644989-30fa-4462-95f2-6616f5f5edeb.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\922c2dcd-6c6c-4c18-89f4-7ff5c7ef8cf1.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\be40d0e2-ac27-43aa-82ed-f62835503c6b.docx"
  ],
  "379": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\4ff14c98-3dea-4b9c-bcd8-acf2569fb2d6.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\90b1625e-46ed-4b6b-a3ec-62b2b88ad923.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\a47bfce0-61c8-4251-8b60-2a3e2ceb197f.docx"
  ],
  "380": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\27e94621-4496-4d10-9211-dabb8fc9106a.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\47d4ff03-ae0e-4a0a-8601-c745bbe3ecbd.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\be55123c-0871-459c-b274-ebe5d2dd42bb.docx"
  ],
  "381": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\1adac13e-9e68-4d90-b8d7-1248a5794bbf.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\9049c6a1-c834-4caf-98ce-1259a041ed6b.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\a372cd7a-2d51-490d-a4aa-bacf7a2a332e.docx"
  ]
};

async function produce(id) {
    const files = ACTA_MAP[id];
    if (!files) return;

    console.log(`\n🏗️  PRODUCIENDO ACTA ${id}...`);
    const outputDir = "./ACTAGEN/outbound/mass_production";
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const imageDir = `./ACTAGEN/outbound/images_${id}`;
    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

    let fullContent = [];
    for (const file of files) {
        console.log(`  📖 Leyendo parte: ${path.basename(file)}`);
        const content = await extractContentWithImages(file, imageDir);
        fullContent = fullContent.concat(content);
    }

    const outputPath = path.join(outputDir, `ACTA_${id}_DIPLOMATICA.docx`);
    const metadata = { numero: id, fecha: "[FECHA POR VALIDAR]" };

    await exportToDiplomaticV8(fullContent, outputPath, metadata, imageDir);
    console.log(`  ✅ FINALIZADA: ${outputPath}`);
}

async function run() {
    console.log("🚀 INICIANDO PRODUCCIÓN MASIVA DIPLOMÁTICA...");
    for (const id of Object.keys(ACTA_MAP)) {
        await produce(id);
    }
    console.log("\n✨ PROCESO COMPLETADO.");
}

run().catch(console.error);
