import fs from 'fs';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Header, Footer, PageNumber, PageBreak } from 'docx';

const STYLES = {
    font: "Arial",
    sizeBody: 24, // 12pt
    sizeCitation: 22, // 11pt
    sizeFooter: 18, // 9pt
    sizeTitle: 32, // 16pt
    sizeSubtitle: 28, // 14pt
    margins: {
        top: 1440,
        bottom: 1440,
        left: 1700,
        right: 1440,
    },
    lineSpacing: 360,
};

async function exportToTemplateV6(content, outputPath, metadata = {}) {
    const lines = content.split('\n');
    const children = [];

    for(let i=0; i<15; i++) children.push(new Paragraph({}));
    children.push(new Paragraph({ children: [new TextRun({ text: "Sesión Plenaria", font: STYLES.font, size: STYLES.sizeSubtitle })], alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ children: [new TextRun({ text: "Ordinaria", font: STYLES.font, size: STYLES.sizeSubtitle })], alignment: AlignmentType.CENTER }));
    for(let i=0; i<8; i++) children.push(new Paragraph({}));
    children.push(new Paragraph({ children: [new TextRun({ text: `Acta ${metadata.numero || '---'}`, bold: true, font: STYLES.font, size: STYLES.sizeTitle })], alignment: AlignmentType.CENTER }));
    for(let i=0; i<8; i++) children.push(new Paragraph({}));
    children.push(new Paragraph({ children: [new TextRun({ text: metadata.fecha || '---', font: STYLES.font, size: STYLES.sizeBody })], alignment: AlignmentType.CENTER }));
    children.push(new Paragraph({ children: [new PageBreak()] }));

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) {
            children.push(new Paragraph({ spacing: { after: 100 } }));
            return;
        }
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !trimmed.includes(":")) {
            children.push(new Paragraph({ children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: STYLES.sizeBody })], alignment: AlignmentType.CENTER, spacing: { before: 600, after: 300 } }));
        } else if (trimmed.startsWith("Intervino")) {
            children.push(new Paragraph({ children: [new TextRun({ text: trimmed, bold: true, font: STYLES.font, size: STYLES.sizeBody })], spacing: { before: 400, after: 200, line: STYLES.lineSpacing }, alignment: AlignmentType.LEFT }));
        } else if (trimmed.startsWith("“") || trimmed.startsWith("\"") || (trimmed.startsWith("(") && trimmed.endsWith(")"))) {
            children.push(new Paragraph({ children: [new TextRun({ text: trimmed, font: STYLES.font, size: STYLES.sizeCitation })], indent: { left: 720, right: 720 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 240, line: 300 } }));
        } else {
            children.push(new Paragraph({ children: [new TextRun({ text: trimmed, font: STYLES.font, size: STYLES.sizeBody })], alignment: AlignmentType.JUSTIFIED, spacing: { after: 240, line: STYLES.lineSpacing } }));
        }
    });

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

const actaId = "348";
const videoUrl = "https://www.youtube.com/watch?v=8jf39zjjhUc";
const totalMins = 234;
const metadata = { numero: "348", fecha: "07 de noviembre de 2025" };

async function startProcessing() {
    console.log(`[STABLE] Iniciando extracción para Acta ${actaId}`);
    let fullText = "SESIÓN PLENARIA ORDINARIA\nACTA 348\n\nFECHA: Medellín, viernes 07 de noviembre de 2025\nHORA: 09:30 a.m.\nLUGAR: Recinto oficial de sesiones\n\n";
    
    // Aquí el agente usará sus herramientas internas para llenar el texto de forma secuencial
    // para evitar fallos de ejecución en segundo plano con módulos complejos.
}

startProcessing();
