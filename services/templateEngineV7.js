// Fix for V7 Template Engine (Image Buffer Handling)
import fs from "fs";
import { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    AlignmentType, 
    Header, 
    Footer, 
    PageNumber, 
    PageBreak,
    ImageRun
} from "docx";
import sizeOf from "image-size";

const STYLES = {
    font: "Arial",
    sizeBody: 24, 
    sizeCitation: 22,
    sizeFooter: 18,
    sizeTitle: 32,
    sizeSubtitle: 28,
    margins: { top: 1440, bottom: 1440, left: 1700, right: 1440 },
    lineSpacing: 360,
};

export async function exportToTemplateV7(contentArray, outputPath, metadata = {}, imageBaseDir) {
    const children = [];

    // --- PORTADA ---
    for(let i=0; i<15; i++) children.push(new Paragraph({}));
    children.push(new Paragraph({ children: [new TextRun({ text: "Sesión Plenaria", font: STYLES.font, size: STYLES.sizeSubtitle })], alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ children: [new TextRun({ text: "Ordinaria", font: STYLES.font, size: STYLES.sizeSubtitle })], alignment: AlignmentType.CENTER }));
    for(let i=0; i<8; i++) children.push(new Paragraph({}));
    children.push(new Paragraph({ children: [new TextRun({ text: `Acta ${metadata.numero || '---'}`, bold: true, font: STYLES.font, size: STYLES.sizeTitle })], alignment: AlignmentType.CENTER }));
    for(let i=0; i<8; i++) children.push(new Paragraph({}));
    children.push(new Paragraph({ children: [new TextRun({ text: metadata.fecha || '---', font: STYLES.font, size: STYLES.sizeBody })], alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // --- BODY CONTENT ---
    const bodyPromises = contentArray.map(async (item) => {
        if (item.type === 'image') {
            const imagePath = `${imageBaseDir}/${item.value}`;
            try {
                // Explicit Buffer conversion for Node.js <-> docx compatibility
                const imageBuffer = await fs.promises.readFile(imagePath);
                const dimensions = sizeOf(imageBuffer); // Pass buffer, not path
                let width = dimensions.width || 400;
                let height = dimensions.height || 300;

                if (width > 450) {
                    const ratio = 450 / width;
                    width = 450;
                    height = Math.round(height * ratio);
                }

                return new Paragraph({
                    children: [
                        new ImageRun({
                            data: imageBuffer, // Pass buffer
                            transformation: { width: width, height: height },
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 200 }
                });
            } catch (err) {
                if (err.code === 'ENOENT') {
                    return new Paragraph({ children: [new TextRun({ text: `[IMAGEN NO ENCONTRADA: ${item.value}]`, color: "FF0000" })] });
                }
                console.error(`Error processing image ${item.value}: ${err.message}`);
                return new Paragraph({ children: [new TextRun({ text: `[ERROR DE IMAGEN: ${item.value}]`, color: "FF0000" })] });
            }
        } else {
            // Text logic unchanged
            const lines = item.value.split('\n');
            const paragraphs = [];
            lines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) {
                    paragraphs.push(new Paragraph({ spacing: { after: 100 } }));
                    return;
                }
                if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !trimmed.includes(":")) {
                    paragraphs.push(new Paragraph({ children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: STYLES.sizeBody })], alignment: AlignmentType.CENTER, spacing: { before: 600, after: 300 } }));
                } else if (trimmed.startsWith("Intervino")) {
                    paragraphs.push(new Paragraph({ children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: STYLES.sizeBody })], spacing: { before: 400, after: 200, line: STYLES.lineSpacing }, alignment: AlignmentType.LEFT }));
                } else if (trimmed.startsWith("“") || trimmed.startsWith("\"") || (trimmed.startsWith("(") && trimmed.endsWith(")"))) {
                    paragraphs.push(new Paragraph({ children: [new TextRun({ text: trimmed, font: STYLES.font, size: STYLES.sizeCitation })], indent: { left: 720, right: 720 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 240, line: 300 } }));
                } else {
                    paragraphs.push(new Paragraph({ children: [new TextRun({ text: trimmed, font: STYLES.font, size: STYLES.sizeBody })], alignment: AlignmentType.JUSTIFIED, spacing: { after: 240, line: STYLES.lineSpacing } }));
                }
            });
            return paragraphs;
        }
    });

    const bodyChunks = await Promise.all(bodyPromises);
    for (const chunk of bodyChunks) {
        if (Array.isArray(chunk)) {
            children.push(...chunk);
        } else {
            children.push(chunk);
        }
    }

    const doc = new Document({
        sections: [{
            properties: { page: { margin: STYLES.margins } },
            headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "CONCEJO DE MEDELLÍN", bold: true, size: 16 })], alignment: AlignmentType.CENTER })] }) },
            footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: "Página ", size: STYLES.sizeFooter }), new TextRun({ children: [PageNumber.CURRENT], size: STYLES.sizeFooter }), new TextRun({ text: " de ", size: STYLES.sizeFooter }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: STYLES.sizeFooter })], alignment: AlignmentType.RIGHT })] }) },
            children: children,
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
}
