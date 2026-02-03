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
    BorderStyle,
    Table,
    TableRow,
    TableCell,
    WidthType,
    VerticalAlign,
    UnderlineType
} from "docx";

/**
 * ACTAGEN Template Engine (V6 - Absolute Fidelity)
 * Replicates the exact typography, vertical spacing, and layout of the SIMI template.
 */

const STYLES = {
    font: "Arial",
    sizeBody: 24, // 12pt
    sizeCitation: 22, // 11pt
    sizeFooter: 18, // 9pt
    sizeTitle: 32, // 16pt
    sizeSubtitle: 28, // 14pt
    margins: {
        top: 1440, // 2.54cm
        bottom: 1440,
        left: 1700, // 3cm for binding
        right: 1440,
    },
    lineSpacing: 360, // 1.5 lines
};

export async function exportToTemplateV6(content, outputPath, metadata = {}) {
    const lines = content.split('\n');
    const children = [];

    // --- PORTADA (REPLICATING ORIGINAL EXACTLY) ---
    // Top spacing
    for(let i=0; i<15; i++) children.push(new Paragraph({}));

    children.push(new Paragraph({
        children: [new TextRun({ text: "Sesión Plenaria", font: STYLES.font, size: STYLES.sizeSubtitle })],
        alignment: AlignmentType.CENTER,
    }));
    children.push(new Paragraph({
        children: [new TextRun({ text: "Ordinaria", font: STYLES.font, size: STYLES.sizeSubtitle })],
        alignment: AlignmentType.CENTER
    }));
    
    for(let i=0; i<8; i++) children.push(new Paragraph({}));

    children.push(new Paragraph({
        children: [new TextRun({ text: `Acta ${metadata.numero || '---'}`, bold: true, font: STYLES.font, size: STYLES.sizeTitle })],
        alignment: AlignmentType.CENTER,
    }));

    for(let i=0; i<8; i++) children.push(new Paragraph({}));

    children.push(new Paragraph({
        children: [new TextRun({ text: metadata.fecha || '---', font: STYLES.font, size: STYLES.sizeBody })],
        alignment: AlignmentType.CENTER,
    }));

    // Page Break after Portada
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // --- BODY CONTENT ---
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) {
            children.push(new Paragraph({ spacing: { after: 100 } }));
            return;
        }

        // Section Titles (e.g., ORDEN DEL DÍA, DESARROLLO)
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !trimmed.includes(":")) {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: STYLES.sizeBody })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 600, after: 300 }
            }));
        } 
        // Metadata Labels (FECHA, HORA, ASISTENTES)
        else if (trimmed.includes(":") && (trimmed.startsWith("FECHA") || trimmed.startsWith("HORA") || trimmed.startsWith("LUGAR") || trimmed.startsWith("ASISTENTES") || trimmed.startsWith("AUSENTES"))) {
            const parts = trimmed.split(":");
            const label = parts[0].trim();
            const val = parts.slice(1).join(":").trim();
            
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: label + ":", bold: true, font: STYLES.font, size: STYLES.sizeBody }),
                    new TextRun({ text: "\t" + val, font: STYLES.font, size: STYLES.sizeBody })
                ],
                spacing: { after: 200, line: STYLES.lineSpacing },
                alignment: AlignmentType.LEFT
            }));
        }
        // Interventions (Intervino...)
        else if (trimmed.startsWith("Intervino")) {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: STYLES.sizeBody })],
                spacing: { before: 400, after: 200, line: STYLES.lineSpacing },
                alignment: AlignmentType.LEFT
            }));
        }
        // Citations (The "Ruth" rule: 1 point smaller + Block indent)
        else if (trimmed.startsWith("“") || trimmed.startsWith("\"") || (trimmed.startsWith("(") && trimmed.endsWith(")"))) {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed, font: STYLES.font, size: STYLES.sizeCitation })],
                indent: { left: 720, right: 720 },
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 240, line: 300 } // Tighter line spacing for citations
            }));
        }
        // Body Text
        else {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed, font: STYLES.font, size: STYLES.sizeBody })],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 240, line: STYLES.lineSpacing }
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
