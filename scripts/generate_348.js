import fs from "fs";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

function loadRawText(path) {
    return fs.readFileSync(path, "utf-8");
}

async function createActa348(rawPath, outputPath) {
    const rawText = loadRawText(rawPath);
    const lines = rawText.split("\n");
    const docChildren = [];

    lines.forEach(line => {
        let text = line.trim();
        if (text.length === 0) return;

        // Limpieza de caracteres (Mapeo manual para mitigar fallos de encoding)
        text = text.replace(/Sesin/g, "SESIÓN")
                   .replace(/Plenaria/g, "PLENARIA")
                   .replace(/Ordinaria/g, "ORDINARIA")
                   .replace(/ndice/g, "ÍNDICE")
                   .replace(/Medelln/g, "Medellín")
                   .replace(/Sebastin/g, "Sebastián")
                   .replace(/Lpez/g, "López")
                   .replace(/Gutirrez/g, "Gutiérrez")
                   .replace(/Tobn/g, "Tobón")
                   .replace(/Surez/g, "Suárez")
                   .replace(/Damin/g, "Damián")
                   .replace(/Prez/g, "Pérez")
                   .replace(/Jhar/g, "Jhaír")
                   .replace(/Macas/g, "Macías")
                   .replace(/Marn/g, "Marín")
                   .replace(/Iguarn/g, "Iguarán")
                   .replace(/Jimnez/g, "Jiménez")
                   .replace(/Rodrguez/g, "Rodríguez")
                   .replace(/Vlez/g, "Vélez")
                   .replace(/lvarez/g, "Álvarez")
                   .replace(/prxima/g, "próxima")
                   .replace(/vdeo/g, "vídeo");

        const upText = text.toUpperCase();
        if (upText.includes("ACTA 348") || upText.includes("SESIÓN PLENARIA")) {
             docChildren.push(new Paragraph({
                text: text.toUpperCase(),
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 200 }
            }));
        } else if (text.startsWith("Intervino")) {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: text, bold: true, font: "Arial", size: 22 })],
                spacing: { before: 240 }
            }));
        } else {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: text, font: "Arial", size: 22 })],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 120, after: 120, line: 360 }
            }));
        }
    });

    const doc = new Document({
        sections: [{
            children: docChildren
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    console.log("SUCCESS");
}

createActa348("../ACTA_348_RAW.txt", "outbound/ACTA_348_FINAL.docx");
