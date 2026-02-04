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
    ImageRun
} from "docx";
import sizeOf from "image-size";

/**
 * ACTAGEN Template Engine V10.2 - Diplomatic Standard
 * Refined for zero-defect production based on Ruth Navarro's audit.
 */

const STYLES = {
    font: "Arial",
    sizeBody: 24,      // 12pt
    sizeCitation: 22,  // 11pt
    sizeFooter: 16,    // 8pt
    sizeTitle: 32,     // 16pt
    sizeSubtitle: 28,  // 14pt
    sizeHeader: 18,    // 9pt
    margins: { top: 1440, bottom: 1440, left: 1700, right: 1440 },
    lineSpacing: 300,  // Calibrated to prevent merged paragraphs
};

const MASTER_MEDIA = "C:/Users/jegom/clawd/ACTAGEN/templates/extracted_349/word/media";

const ACRONYMS = {
    "FONSET": "Fondo Territorial de Seguridad y Convivencia Ciudadana",
    "ESCNNA": "Explotación Sexual Comercial de Niños, Niñas y Adolescentes",
    "HSI": "Homeland Security Investigations",
    "GESET": "Grupo Especializado contra la Explotación Sexual y Trata de Personas",
    "USPEC": "Unidad de Servicios Penitenciarios y Carcelarios",
    "SGP": "Sistema General de Participaciones"
};

const OFFICIAL_NAMES = [
    "Sebastián López Valencia",
    "Santiago Perdomo Montoya",
    "Carlos Alberto Gutiérrez Bustamante",
    "Andrés Felipe Tobón Villada",
    "María Paulina Suárez Roldán",
    "Alejandro De Bedout Arango",
    "Juan Carlos de la Cuesta Galvis",
    "Santiago Narváez Lombana",
    "Damián Pérez Arroyave",
    "Janeth Hurtado Betancur",
    "Farley Jhaír Macías Betancur",
    "José Luis Marín Mora",
    "Alejandro Arias García",
    "Miguel Ángel Iguarán Osorio",
    "Juan Ramón Jiménez Lara",
    "Brisvani Alexis Arenas Suaza",
    "Leticia Orrego Pérez",
    "Andrés Felipe Rodríguez Puerta",
    "Luis Guillermo de Jesús Vélez Álvarez"
];

function isForeignWord(word) {
    const foreign = ["lapsus", "calami", "item", "quorum", "sine", "qua", "non", "status", "quo", "habeas", "corpus"];
    return foreign.includes(word.toLowerCase().replace(/[.,()]/g, ""));
}

export async function exportToDiplomaticV9(contentArray, outputPath, metadata = {}, imageBaseDir) {
    const sections = [];
    const expandedAcronyms = new Set();

    // --- PORTADA (Section 1) ---
    const portadaChildren = [];
    const escudoPath = path.join(MASTER_MEDIA, "image1.png");
    if (fs.existsSync(escudoPath)) {
        const buf = fs.readFileSync(escudoPath);
        const dims = sizeOf(buf);
        portadaChildren.push(new Paragraph({
            children: [new ImageRun({ data: buf, transformation: { width: 180, height: (180/dims.width)*dims.height } })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 1200 }
        }));
    }
    portadaChildren.push(new Paragraph({ spacing: { before: 2000 } }));
    portadaChildren.push(new Paragraph({ children: [new TextRun({ text: "Sesión Plenaria", font: STYLES.font, size: 56 })], alignment: AlignmentType.CENTER }));
    portadaChildren.push(new Paragraph({ children: [new TextRun({ text: "Ordinaria", font: STYLES.font, size: 56 })], alignment: AlignmentType.CENTER }));
    portadaChildren.push(new Paragraph({ children: [new TextRun({ text: `Acta ${metadata.numero}`, bold: true, font: STYLES.font, size: 56 })], alignment: AlignmentType.CENTER, spacing: { before: 1000 } }));
    portadaChildren.push(new Paragraph({ children: [new TextRun({ text: metadata.fecha, font: STYLES.font, size: 56 })], alignment: AlignmentType.CENTER, spacing: { before: 1000 } }));
    
    sections.push({ 
        properties: { page: { margin: STYLES.margins }, titlePage: true }, 
        children: portadaChildren 
    });

    // --- SHARED HEADER ---
    const headerLogoPath = path.join(MASTER_MEDIA, "image2.png");
    let commonHeader = null;
    if (fs.existsSync(headerLogoPath)) {
        const logoBuf = fs.readFileSync(headerLogoPath);
        const lDims = sizeOf(logoBuf);
        commonHeader = new Header({
            children: [new Paragraph({
                children: [
                    new ImageRun({ data: logoBuf, transformation: { width: 45, height: (45/lDims.width)*lDims.height } }),
                    new TextRun({ text: "\tSesión Plenaria Ordinaria – Acta " + metadata.numero, size: 18, color: "808080" }),
                    new TextRun({ text: "\t\t", size: 18 }),
                    new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })
                ],
                tabStops: [{ type: "left", position: 3000 }, { type: "right", position: 9000 }],
                alignment: AlignmentType.LEFT
            })]
        });
    }

    // --- ASISTENCIA PAGE (Section 2) ---
    const asistenciaChildren = [
        new Paragraph({ children: [new TextRun({ text: "SESIÓN PLENARIA ORDINARIA", bold: true, size: 28 })], alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: `ACTA ${metadata.numero}`, bold: true, size: 28 })], alignment: AlignmentType.CENTER, spacing: { after: 800 } }),
        new Paragraph({ children: [new TextRun({ text: "FECHA:", size: 24 }), new TextRun({ text: "\tMedellín, " + metadata.fecha, size: 24 })], tabStops: [{ type: "left", position: 3000 }], spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: "HORA:", size: 24 }), new TextRun({ text: "\t" + (metadata.hora || "De las 09:00 a las 13:00 horas"), size: 24 })], tabStops: [{ type: "left", position: 3000 }], spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: "LUGAR:", size: 24 }), new TextRun({ text: "\tRecinto oficial de sesiones", size: 24 })], tabStops: [{ type: "left", position: 3000 }], spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: "ASISTENTES:", size: 24 }), new TextRun({ text: "\t" + OFFICIAL_NAMES[0], size: 24 })], tabStops: [{ type: "left", position: 3000 }], spacing: { after: 100 } })
    ];
    OFFICIAL_NAMES.slice(1).forEach(n => {
        asistenciaChildren.push(new Paragraph({ children: [new TextRun({ text: "\t" + n, size: 24 })], tabStops: [{ type: "left", position: 3000 }], spacing: { after: 100 } }));
    });
    asistenciaChildren.push(new Paragraph({ children: [new TextRun({ text: "AUSENTES:", size: 24 }), new TextRun({ text: "\tNinguno", size: 24 })], tabStops: [{ type: "left", position: 3000 }], spacing: { before: 400 } }));
    
    sections.push({ 
        properties: { page: { margin: STYLES.margins } }, 
        headers: { default: commonHeader }, 
        children: asistenciaChildren 
    });

    // --- BODY CONTENT (Section 3) ---
    const bodyChildren = [];
    let isWithinIntervention = false;

    for (const item of contentArray) {
        if (item.type === 'image') {
            const imagePath = path.join(imageBaseDir, item.value);
            if (fs.existsSync(imagePath)) {
                try {
                    const buf = fs.readFileSync(imagePath);
                    const dims = sizeOf(buf);
                    bodyChildren.push(new Paragraph({
                        children: [new ImageRun({ data: buf, transformation: { width: 480, height: (480/dims.width)*dims.height } })],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400, after: 400 }
                    }));
                } catch (e) {}
            }
        } else {
            const lines = item.value.split('\n');
            lines.forEach(line => {
                let trimmed = line.replace(/[ \t]+/g, " ").trim();
                if (!trimmed) return;

                // 1. OFFICIAL NAME & SPELLING SANITIZATION
                OFFICIAL_NAMES.forEach(n => {
                    const normLine = trimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    const normName = n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    if (normLine.includes(normName)) {
                        trimmed = trimmed.replace(new RegExp(normName, 'gi'), n);
                    }
                });

                // 2. VOTING LIST LOGIC (Hardened)
                if (trimmed.startsWith("Votaron SÍ") || trimmed.startsWith("Votaron NO")) {
                    const parts = trimmed.split(":");
                    bodyChildren.push(new Paragraph({ children: [new TextRun({ text: parts[0] + ":", bold: true })], spacing: { before: 300, after: 100 } }));
                    if (parts[1]) {
                        const names = parts[1].match(/[A-ZÁÉÍÓÚ][a-záéíóú]+\s[A-ZÁÉÍÓÚ][a-záéíóú]+(\s[A-ZÁÉÍÓÚ][a-záéíóú]+)*/g) || [parts[1]];
                        names.forEach(n => {
                            bodyChildren.push(new Paragraph({ children: [new TextRun({ text: "\t" + n.trim(), bold: true })], tabStops: [{ type: "left", position: 3000 }] }));
                        });
                    }
                    return;
                }

                // 3. ACRONYM EXPANSION (Strict first-use)
                Object.entries(ACRONYMS).forEach(([s, m]) => {
                    if (trimmed.includes(s) && !expandedAcronyms.has(s)) {
                        trimmed = trimmed.replace(s, `${s} (${m})`);
                        expandedAcronyms.add(s);
                    }
                });

                // 4. INTERVENTION LABELS (Protection from Citation Style)
                if (trimmed.startsWith("Intervino") || trimmed.startsWith("Intervención")) {
                    bodyChildren.push(new Paragraph({ children: [new TextRun({ text: trimmed, bold: true, size: 24 })], spacing: { before: 500, after: 200 } }));
                    isWithinIntervention = true;
                    return;
                }

                // 5. CITATION DETECTION & BODY TEXT
                const isCitation = (trimmed.includes("leer textualmente") || (trimmed.startsWith("“") && !isWithinIntervention));
                const textRuns = trimmed.split(" ").map((w, i, arr) => new TextRun({
                    text: w + (i < arr.length - 1 ? " " : ""),
                    font: STYLES.font,
                    size: isCitation ? STYLES.sizeCitation : STYLES.sizeBody,
                    italics: isForeignWord(w.toLowerCase().replace(/[.,()]/g, ""))
                }));

                bodyChildren.push(new Paragraph({
                    children: textRuns,
                    indent: isCitation ? { left: 720, right: 720 } : {},
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 300 }
                }));
                isWithinIntervention = false;
            });
        }
    }

    sections.push({
        properties: { page: { margin: STYLES.margins } },
        headers: { default: commonHeader },
        footers: { default: new Footer({ 
            children: [new Paragraph({ 
                children: [
                    new TextRun({ text: "Acta " + metadata.numero + " - Página ", size: 16 }), 
                    new TextRun({ children: [PageNumber.CURRENT], size: 16 }), 
                    new TextRun({ text: " de ", size: 16 }), 
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16 })
                ], 
                alignment: AlignmentType.RIGHT 
            })] 
        }) },
        children: bodyChildren
    });

    const doc = new Document({ sections });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
}
