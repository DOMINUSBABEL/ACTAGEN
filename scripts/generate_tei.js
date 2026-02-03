import fs from "fs";

function createTEI(rawText, outputPath) {
    const lines = rawText.split('\n').filter(l => l.trim().length > 0);
    
    let tei = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-model href="http://www.tei-c.org/release/xml/tei/custom/schema/relaxng/tei_all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>Acta 348 - Concejo Distrital de Medellín</title>
        <author>ACTAGEN System</author>
      </titleStmt>
      <publicationStmt>
        <publisher>Concejo de Medellín / Proyecto ACTAGEN</publisher>
        <date when="2025-11-07">7 de noviembre de 2025</date>
      </publicationStmt>
      <sourceDesc>
        <p>Transcripción de sesión plenaria ordinaria.</p>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
  <text>
    <body>
      <div type="session" n="348">
        <head>SESIÓN PLENARIA ORDINARIA - ACTA 348</head>
`;

    lines.forEach(line => {
        let text = line.trim();
        if (text.startsWith("Intervino")) {
            tei += `        <sp>\n          <speaker>${text}</speaker>\n`;
        } else if (text.startsWith('"')) {
            tei += `          <p>${text.replace(/"/g, '')}</p>\n        </sp>\n`;
        } else {
            tei += `        <p>${text}</p>\n`;
        }
    });

    tei += `      </div>\n    </body>\n  </text>\n</TEI>`;
    
    fs.writeFileSync(outputPath, tei);
}

const raw = fs.readFileSync('../ACTA_348_RAW.txt', 'utf-8');
createTEI(raw, 'outbound/ACTA_348_TEI.xml');
console.log("TEI Generated");
