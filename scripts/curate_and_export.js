import mammoth from "mammoth";
import fs from "fs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

// Función para parsear texto básico a una estructura DOCX institucional
async function createInstitutionalDocx(markdownText, outputPath) {
    const lines = markdownText.split('\n');
    const children = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) {
            children.push(new Paragraph({
                text: trimmed.replace('# ', '').toUpperCase(),
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }));
        } else if (trimmed.startsWith('## ')) {
            children.push(new Paragraph({
                text: trimmed.replace('## ', '').toUpperCase(),
                heading: HeadingLevel.HEADING_2,
            }));
        } else if (trimmed.length > 0) {
            children.push(new Paragraph({
                children: [new TextRun(trimmed)],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 200 },
            }));
        }
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: children,
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
}

// Lógica de corrección y exportación (Mock del Kernel 19)
async function processActa(fileName) {
    const inputMd = `./ACTAGEN/inbound/${fileName}.md`;
    const outputDocx = `./ACTAGEN/outbound/${fileName}_CURADA.docx`;

    if (!fs.existsSync("./ACTAGEN/outbound")) fs.mkdirSync("./ACTAGEN/outbound");

    console.log(`Curando y exportando ${fileName}...`);
    let content = fs.readFileSync(inputMd, "utf-8");
    
    // Aplicación de diplomática y estilo (Simulación de Kernel 19)
    content = content.replace(/Sesin/g, "SESIÓN")
                     .replace(/Plenaria/g, "PLENARIA")
                     .replace(/Acta/g, "ACTA");

    await createInstitutionalDocx(content, outputDocx);
    console.log(`✓ Documento institucional generado: ${outputDocx}`);
}

async function run() {
    await processActa('acta_350_base');
    await processActa('acta_349_inquilinatos');
}

run();
