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
    NumberFormat,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle
} from "docx";

/**
 * ACTAGEN Institutional Docx Generator (V4 - High Fidelity SIMI)
 * Replicates the exact structure of the provided Concejo de Medellín template.
 */

const STYLES = {
    font: "Arial",
    sizeBody: 24, // 12pt
    sizeCitation: 22, // 11pt
    sizeHeader: 20, // 10pt
    margins: {
        top: 1440, // 2.54cm
        bottom: 1440,
        left: 1700, // 3cm for binding
        right: 1440,
    }
};

async function generateV4Acta(markdownText, outputPath) {
    const lines = markdownText.split('\n');
    const children = [];

    // Helper: Add Empty Lines (Vertical Spacing)
    const addEmptyLines = (count) => {
        for (let i = 0; i < count; i++) {
            children.push(new Paragraph({ children: [new TextRun("")] }));
        }
    };

    // Parser State
    let isHeader = true;

    lines.forEach(line => {
        const trimmed = line.trim();
        
        // 1. Portada Logic (First few pages)
        if (isHeader) {
            if (trimmed === "Sesión Plenaria" || trimmed === "Ordinaria") {
                children.push(new Paragraph({
                    children: [new TextRun({ text: trimmed, font: STYLES.font, size: 28 })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200 }
                }));
                return;
            }
            if (trimmed.startsWith("Acta")) {
                addEmptyLines(5);
                children.push(new Paragraph({
                    children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: 32 })],
                    alignment: AlignmentType.CENTER,
                }));
                return;
            }
            if (trimmed.includes("2025")) {
                addEmptyLines(5);
                children.push(new Paragraph({
                    children: [new TextRun({ text: trimmed, font: STYLES.font, size: STYLES.sizeBody })],
                    alignment: AlignmentType.CENTER,
                }));
                isHeader = false; // Transition to body
                return;
            }
        }

        // 2. Body Formatting
        if (!trimmed) {
            // Maintain significant spacing
            children.push(new Paragraph({ spacing: { after: 100 } }));
            return;
        }

        // Section Titles (ALL CAPS)
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !trimmed.includes(":")) {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: STYLES.sizeBody })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 200 }
            }));
        } 
        // Metadata Labels (FECHA, HORA, etc)
        else if (trimmed.includes(":") && (trimmed.startsWith("FECHA") || trimmed.startsWith("HORA") || trimmed.startsWith("LUGAR"))) {
            const [label, ...rest] = trimmed.split(":");
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: label + ":", bold: true, font: STYLES.font, size: STYLES.sizeBody }),
                    new TextRun({ text: " " + rest.join(":").trim(), font: STYLES.font, size: STYLES.sizeBody })
                ],
                spacing: { after: 150 }
            }));
        }
        // Interventions (Intervino...)
        else if (trimmed.startsWith("Intervino")) {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: STYLES.sizeBody })],
                spacing: { before: 300, after: 150 }
            }));
        }
        // Quotes (Citations)
        else if (trimmed.startsWith("“") || trimmed.startsWith("\"")) {
            children.push(new Paragraph({
                children: [new TextRun({ text: trimmed, font: STYLES.font, size: STYLES.sizeCitation })],
                indent: { left: 720, right: 720 },
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 200 }
            }));
        }
        // Standard Paragraphs
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
                page: {
                    margin: STYLES.margins,
                },
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
                                new TextRun({ text: "Página ", size: 18 }),
                                new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                                new TextRun({ text: " de ", size: 18 }),
                                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18 }),
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
}

// Execution with the extracted content
const inputPath = './ACTAGEN/inbound/acta_349_inquilinatos.md';
const content = fs.readFileSync(inputPath, "utf-8");
generateV4Acta(content, "./ACTAGEN/outbound/ACTA_349_FIDELITY_V4.docx")
    .then(() => console.log("✓ Documento V4 de Alta Fidelidad generado."))
    .catch(err => console.error(err));
