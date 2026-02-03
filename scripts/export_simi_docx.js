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
 * ACTAGEN Institutional Docx Generator (SIMI Compatible)
 * Based on Relatoría del Concejo de Medellín requirements.
 */

const STYLES = {
    font: "Arial",
    sizeBody: 24, // 12pt
    sizeCitation: 22, // 11pt
    sizeHeader: 20, // 10pt
    margins: {
        top: 1440, // 2.54cm
        bottom: 1440,
        left: 1700, // Slightly wider for binding
        right: 1440,
    }
};

async function generateSimiActa(markdownText, outputPath) {
    const lines = markdownText.split('\n');
    const sections = [];
    let currentChildren = [];

    // Helper: Add Paragraph
    const addPara = (text, options = {}) => {
        currentChildren.push(new Paragraph({
            children: [new TextRun({
                text: text,
                size: options.size || STYLES.sizeBody,
                bold: options.bold || false,
                font: STYLES.font,
                italics: options.italics || false,
            })],
            alignment: options.align || AlignmentType.JUSTIFIED,
            spacing: { 
                before: options.before || 0, 
                after: options.after || 200,
                line: 360, // 1.5 line spacing
            },
            indent: options.indent || undefined,
        }));
    };

    // Parse logic
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Header detection (Date, Time, Place)
        if (trimmed.startsWith("FECHA:") || trimmed.startsWith("HORA:") || trimmed.startsWith("LUGAR:")) {
            const [label, ...rest] = trimmed.split(":");
            currentChildren.push(new Paragraph({
                children: [
                    new TextRun({ text: label + ": ", bold: true, size: STYLES.sizeBody, font: STYLES.font }),
                    new TextRun({ text: rest.join(":").trim(), size: STYLES.sizeBody, font: STYLES.font })
                ],
                spacing: { after: 100 }
            }));
        } 
        // Speaker Interventions
        else if (trimmed.startsWith("Intervino")) {
            addPara(trimmed, { bold: true, before: 400 });
        }
        // Citations (Quotes)
        else if (trimmed.startsWith("“") || trimmed.startsWith("\"")) {
            addPara(trimmed, { size: STYLES.sizeCitation, indent: { left: 720 } });
        }
        // Main Titles
        else if (trimmed === trimmed.toUpperCase() && trimmed.length > 5) {
            addPara(trimmed, { bold: true, align: AlignmentType.CENTER, before: 400 });
        }
        // Body
        else {
            addPara(trimmed);
        }
    });

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: STYLES.font,
                        size: STYLES.sizeBody,
                    },
                },
            },
        },
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
                            children: [new TextRun({ text: "CONCEJO DE MEDELLÍN", bold: true, size: STYLES.sizeHeader })],
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: "RELATORÍA - SISTEMA SIMI", size: 16 })],
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
                                new TextRun("Página "),
                                new TextRun({
                                    children: [PageNumber.CURRENT],
                                }),
                                new TextRun(" de "),
                                new TextRun({
                                    children: [PageNumber.TOTAL_PAGES],
                                }),
                            ],
                            alignment: AlignmentType.RIGHT,
                        }),
                    ],
                }),
            },
            children: currentChildren,
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
}

// Execution
const input = fs.readFileSync("./ACTAGEN/inbound/acta_349_inquilinatos.md", "utf-8");
generateSimiActa(input, "./ACTAGEN/outbound/acta_349_SIMI_FINAL.docx")
    .then(() => console.log("✓ Acta exportada con formato SIMI (Relatoría)"))
    .catch(err => console.error("Error:", err));
