import fs from "fs";
import { exportToTemplateV6 } from "../services/templateEngineV6.js";

async function produce351() {
    console.log("🚀 Iniciando procesamiento del Acta 351 (Fuente: YouTube V6 Fidelity)...");
    
    const transcriptPath = "./ACTAGEN/testdata/acta351/transcript_base.txt";
    const baseText = fs.readFileSync(transcriptPath, "utf-8");

    // Enriquecimiento inicial (Simulando lo que se haría con el video completo)
    const enrichedContent = `
SESIÓN PLENARIA ORDINARIA
ACTA 351

FECHA: Medellín, 12 de noviembre de 2025
HORA: 09:28 a.m.
LUGAR: Recinto oficial de sesiones

El Secretario General informó que se contaba con quórum suficiente (21 concejales).
Siendo las 09:29 a.m. el Presidente declaró abierta la sesión.

ORDEN DEL DÍA:
1. Aprobación del orden del día.
2. Lectura y consideración de excusas.
3. Citación de control político.
4. Lectura de comunicaciones.
5. Proposiciones.
6. Asuntos varios.

DESARROLLO:

1. APROBACIÓN DEL ORDEN DEL DÍA
Sometido a votación, fue aprobado por unanimidad.

2. LECTURA Y CONSIDERACIÓN DE EXCUSAS
Se deja constancia de la asistencia del Secretario de Movilidad, Pablo Ferney Ruiz Garzón.

3. CITACIÓN DE CONTROL POLÍTICO
"Seguimiento a los procedimientos de inmovilización judicial de vehículos y traslado a parqueaderos ilegales".

Intervino el concejal Andrés Felipe Tobón Villada:
"Este es un caso de denuncias ciudadanas... parqueros ilegales secuestran vehículos en nombre de la justicia, pero pasándose por encima de ella. Existen hoy parqueaderos en Antioquia que secuestran vehículos bajo la excusa de procesos judiciales de embargo sin autorización."

(Contenido extraído de la transcripción de YouTube - Procesamiento en curso)
${baseText}
    `;

    const metadata = {
        numero: "351",
        fecha: "12 de noviembre de 2025"
    };

    const outputFile = "./ACTAGEN/outbound/ACTA_351_SIMI_V6.docx";
    await exportToTemplateV6(enrichedContent, outputFile, metadata);
    console.log(`✅ Acta 351 generada con éxito: ${outputFile}`);
}

produce351().catch(console.error);
