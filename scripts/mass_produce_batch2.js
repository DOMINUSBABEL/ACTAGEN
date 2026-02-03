import { extractContentWithImages } from "./lib/extractor.cjs";
import { exportToDiplomaticV8 } from "../services/templateEngineV8.js";
import fs from "fs";
import path from "path";

const ACTA_MAP = {
  "351": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\76288d80-e15e-47d6-95c9-2e893b316b81.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\023510bd-c890-460c-9b27-9ef8a8482c8e.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\6fdd23e2-3320-46c5-8de8-71928b4c438c.docx"
  ],
  "352": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\1bfd9ab9-646e-4487-8893-b6a62af01960.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\cac753ff-f026-480e-999f-0e869002b488.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\e1695618-2446-45ca-a899-05befcec4ea7.docx"
  ],
  "353": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\7f284a6f-fb54-4dae-ba4c-ba2468af0e65.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\a211fdc5-4c81-4c33-a667-c645a43890dd.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\a8b1b3ae-e577-4269-bc08-5d3c0310f7f5.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\bfaded4b-2fd8-4f4e-9b56-7db3dbf5ee18.docx"
  ],
  "355": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\41b3b716-f823-4e5c-8156-d96259e8a8df.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\8c85376c-7a44-4fc3-b3c2-501f4019381c.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\eb5c5bbd-6426-4676-888b-42beaa5be26f.docx"
  ],
  "356": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\3427aeda-dcbb-4979-9ee8-1a950a48827e.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\abdedb8d-107c-4d82-998e-3b16af72f954.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\de19bb7f-529d-439d-b072-fadbabe63f2f.docx"
  ],
  "368": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\8e6c03e0-c6d7-48ca-8bc0-7d96b7f70d38.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\9a67e5c0-e390-4e4e-9483-fb67ce37e32c.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\ded23929-ba92-46af-9bbc-b269b55892f7.docx"
  ],
  "369": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\5892cc82-1c8d-44dc-918f-f6d1177b39b8.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\68b34039-10e5-4d40-aa8d-5639b76c0053.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\d6579849-7ba0-40ef-b7cd-2a8f22828c5c.docx"
  ],
  "382": [
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\6d86d8c9-4e55-428e-90fd-07a8ceab7014.docx",
    "C:\\Users\\jegom\\.clawdbot\\media\\inbound\\d0e59e6c-6e8d-4043-b58d-7dc17d306316.docx"
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
    console.log("🚀 INICIANDO BATCH 2 DE PRODUCCIÓN MASIVA...");
    for (const id of Object.keys(ACTA_MAP)) {
        await produce(id);
    }
    console.log("\n✨ PROCESO COMPLETADO.");
}

run().catch(console.error);
