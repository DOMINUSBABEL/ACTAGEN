import fs from "fs";
import path from "path";
import { exportToTemplate } from "../services/templateEngine.js";

/**
 * PRODUCTION SCRIPT: ACTA 348
 * Processes fragmented transcripts into a High-Fidelity SIMI Docx.
 */

async function process348() {
    const inputDir = "./ACTAGEN/testdata/acta348";
    const outputFile = "./ACTAGEN/outbound/ACTA_348_SIMI_V5.docx";
    
    console.log("🚀 Iniciando procesamiento del Acta 348...");

    // 1. Merge Fragments
    const files = [
        "fragmento_01_encabezado.txt",
        "fragmento_02_orden_dia.txt",
        "fragmento_03_debate_central.txt",
        "fragmento_04_intervenciones.txt",
        "fragmento_05_cierre.txt"
    ];

    let fullContent = files.map(f => {
        const p = path.join(inputDir, f);
        return fs.readFileSync(p, "utf-8");
    }).join("\n\n");

    // 2. Metadata for Cover (Portada)
    const metadata = {
        numero: "348",
        fecha: "09 de noviembre de 2025" // Estimada del contexto
    };

    // 3. Export using the V5 Template Engine (Learned from Relatoría)
    console.log("🖋️ Aplicando plantilla institucional SIMI V5...");
    await exportToTemplate(fullContent, outputFile, metadata);

    console.log(`✅ Acta 348 generada con éxito: ${outputFile}`);
}

process348().catch(console.error);
