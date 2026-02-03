import mammoth from "mammoth";
import fs from "fs";

async function convertDocx(fileName) {
    const inputPath = `./ACTAGEN/inbound/${fileName}.docx`;
    const outputPath = `./ACTAGEN/inbound/${fileName}.md`;
    
    console.log(`Convirtiendo ${inputPath}...`);
    try {
        const result = await mammoth.extractRawText({path: inputPath});
        fs.writeFileSync(outputPath, result.value);
        console.log(`✓ Guardado en ${outputPath}`);
    } catch (err) {
        console.error(`Error en ${fileName}:`, err);
    }
}

async function run() {
    await convertDocx('acta_350_base');
    await convertDocx('acta_349_inquilinatos');
}

run();
