// Template Engine V8 - Diplomatic Replica based on Master 349
import fs from "fs";
import path from "path";
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
    ImageRun,
    ExternalHyperlink
} from "docx";
import sizeOf from "image-size";

const STYLES = {
    font: "Arial",
    sizeBody: 24, // 12pt
    sizeCitation: 22, // 11pt
    sizeFooter: 16,
    sizeTitle: 32,
    sizeSubtitle: 28,
    margins: { top: 1440, bottom: 1440, left: 1700, right: 1440 },
    lineSpacing: 360,
};

const MASTER_MEDIA = path.join(process.cwd(), "templates/extracted_349/word/media");

export async function exportToDiplomaticV8(contentArray, outputPath, metadata = {}, imageBaseDir) {
    const children = [];

    // 1. ESCUDO DE ARMAS (image1.png)
    const escudoPath = path.join(MASTER_MEDIA, "image1.png");
    try {
        const escudoBuffer = await fs.promises.readFile(escudoPath);
        const dims = sizeOf(escudoBuffer);
        children.push(new Paragraph({
            children: [
                new ImageRun({
                    data: escudoBuffer,
                    transformation: { width: 100, height: (100 / dims.width) * dims.height },
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 1000 }
        }));
    } catch (e) {
        // Ignore if file doesn't exist
    }

    // 2. PORTADA
    children.push(new Paragraph({ spacing: { before: 2000 } }));
    children.push(new Paragraph({ children: [new TextRun({ text: "Sesión Plenaria", font: STYLES.font, size: STYLES.sizeSubtitle })], alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ children: [new TextRun({ text: "Ordinaria", font: STYLES.font, size: STYLES.sizeSubtitle })], alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ spacing: { before: 1000 } }));
    children.push(new Paragraph({ children: [new TextRun({ text: `Acta ${metadata.numero || '---'}`, bold: true, font: STYLES.font, size: STYLES.sizeTitle })], alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ spacing: { before: 1000 } }));
    children.push(new Paragraph({ children: [new TextRun({ text: metadata.fecha || '---', font: STYLES.font, size: STYLES.sizeBody })], alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // 3. BODY CONTENT
    for (const item of contentArray) {
        if (item.type === 'image') {
            const imagePath = path.join(imageBaseDir, item.value);
            try {
                const imageBuffer = await fs.promises.readFile(imagePath);
                const dimensions = sizeOf(imageBuffer);
                let width = Math.min(dimensions.width, 450);
                let height = (width / dimensions.width) * dimensions.height;

                children.push(new Paragraph({
                    children: [new ImageRun({ data: imageBuffer, transformation: { width, height } })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 200 }
                }));
            } catch (e) { console.error(e); }
        } else {
            const lines = item.value.split('\n');
            lines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) {
                    children.push(new Paragraph({ spacing: { after: 100 } }));
                    return;
                }
                
                // Formateo de Títulos
                if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !trimmed.includes(":")) {
                    children.push(new Paragraph({ 
                        children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: STYLES.sizeBody })], 
                        alignment: AlignmentType.CENTER, 
                        spacing: { before: 600, after: 300 } 
                    }));
                } 
                // Intervenciones
                else if (trimmed.startsWith("Intervino") || trimmed.startsWith("Intervención")) {
                    children.push(new Paragraph({ 
                        children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: STYLES.sizeBody })], 
                        spacing: { before: 400, after: 200, line: STYLES.lineSpacing }, 
                        alignment: AlignmentType.LEFT 
                    }));
                } 
                // Citas / Transcripción Literal
                else if (trimmed.startsWith("“") || trimmed.startsWith("\"") || (trimmed.startsWith("(") && trimmed.endsWith(")"))) {
                    children.push(new Paragraph({ 
                        children: [new TextRun({ text: trimmed, font: STYLES.font, size: STYLES.sizeCitation })], 
                        indent: { left: 720, right: 720 }, 
                        alignment: AlignmentType.JUSTIFIED, 
                        spacing: { after: 240, line: 300 } 
                    }));
                } 
                // Texto Normal
                else {
                    children.push(new Paragraph({ 
                        children: [new TextRun({ text: trimmed, font: STYLES.font, size: STYLES.sizeBody })], 
                        alignment: AlignmentType.JUSTIFIED, 
                        spacing: { after: 240, line: STYLES.lineSpacing } 
                    }));
                }
            });
        }
    }

    // 4. HEADER & FOOTER WITH MASTER LOGOS
    const headerLogoPath = path.join(MASTER_MEDIA, "image2.png");
    let headerChildren = [new Paragraph({ children: [new TextRun({ text: "CONCEJO DISTRITAL DE MEDELLÍN", bold: true, size: 16 })], alignment: AlignmentType.CENTER })];
    
    try {
        const logoBuf = await fs.promises.readFile(headerLogoPath);
        const lDims = sizeOf(logoBuf);
        headerChildren = [
            new Paragraph({
                children: [
                    new ImageRun({
                        data: logoBuf,
                        transformation: { width: 50, height: (50 / lDims.width) * lDims.height },
                    }),
                    new TextRun({ text: "  CONCEJO DISTRITAL DE MEDELLÍN", bold: true, size: 18 })
                ],
                alignment: AlignmentType.LEFT
            })
        ];
    } catch (e) {
        // Ignore if file doesn't exist
    }

    const doc = new Document({
        sections: [{
            properties: { page: { margin: STYLES.margins } },
            headers: { default: new Header({ children: headerChildren }) },
            footers: { default: new Footer({ 
                children: [
                    new Paragraph({ 
                        children: [
                            new TextRun({ text: "Acta " + metadata.numero + " - Página ", size: STYLES.sizeFooter }), 
                            new TextRun({ children: [PageNumber.CURRENT], size: STYLES.sizeFooter }), 
                            new TextRun({ text: " de ", size: STYLES.sizeFooter }), 
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: STYLES.sizeFooter })
                        ], 
                        alignment: AlignmentType.RIGHT 
                    })
                ] 
            }) },
            children: children,
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
}
