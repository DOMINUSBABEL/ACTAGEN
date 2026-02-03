import fs from "fs";
import { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    AlignmentType, 
    Header, 
    Footer, 
    PageNumber
} from "docx";

/**
 * ACTAGEN Template Engine (V5 - Dynamic Template)
 * Learns and applies the institutional template to any acta content.
 */

const STYLES = {
    font: "Arial",
    sizeBody: 24, // 12pt
    sizeCitation: 22, // 11pt
    sizeFooter: 18, // 9pt
    margins: {
        top: 1440, // 2.54cm
        bottom: 1440,
        left: 1700, // 3cm for binding
        right: 1440,
    }
};

export async function exportToTemplate(content, outputPath, metadata = {}) {
    const lines = content.split('\n');
    const children = [];

    // 1. FRONT PAGE (PORTADA)
    children.push(new Paragraph({
        children: [new TextRun({ text: "Sesión Plenaria", font: STYLES.font, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000 }
    }));
    children.push(new Paragraph({
        children: [new TextRun({ text: "Ordinaria", font: STYLES.font, size: 28 })],
        alignment: AlignmentType.CENTER
    }));
    
    for(let i=0; i<6; i++) children.push(new Paragraph({})); // Vertical spacing

    children.push(new Paragraph({
        children: [new TextRun({ text: `Acta ${metadata.numero || '---'}`, bold: true, font: STYLES.font, size: 32 })],
        alignment: AlignmentType.CENTER,
    }));

    for(let i=0; i<6; i++) children.push(new Paragraph({})); // Vertical spacing

    children.push(new Paragraph({
        children: [new TextRun({ text: metadata.fecha || '---', font: STYLES.font, size: STYLES.sizeBody })],
        alignment: AlignmentType.CENTER,
    }));

    // Page Break
    children.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }));

    // 2. BODY CONTENT
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Section Titles
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !trimmed.includes(":")) {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: STYLES.sizeBody })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 200 }
            }));
        } 
        // Interventions
        else if (trimmed.startsWith("Intervino")) {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: STYLES.sizeBody })],
                spacing: { before: 300, after: 150 }
            }));
        }
        // Quotes (Fidelity check: Arial 11 + Indent)
        else if (trimmed.startsWith("“") || trimmed.startsWith("\"") || (trimmed.startsWith("(") && trimmed.endsWith(")"))) {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed, font: STYLES.font, size: STYLES.sizeCitation })],
                indent: { left: 720, right: 720 },
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 200 }
            }));
        }
        // Normal text
        else {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed, font: STYLES.font, size: STYLES.sizeBody })],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 200, line: 360 }
            }));
        }
    });

    const doc = new Document({
        sections: [{
            properties: {
                page: { margin: STYLES.margins },
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "CONCEJO DE MEDELLÍN", bold: true, size: 16 })],
                            alignment: AlignmentType.CENTER,
                        })
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({ text: "Página ", size: STYLES.sizeFooter }),
                                new TextRun({ children: [PageNumber.CURRENT], size: STYLES.sizeFooter }),
                                new TextRun({ text: " de ", size: STYLES.sizeFooter }),
                                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: STYLES.sizeFooter }),
                            ],
                            alignment: AlignmentType.RIGHT,
                        }),
                    ],
                }),
            },
            children: children,
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
}
