import { exportToTemplateV6 } from '../services/templateEngineV6.js';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

async function runBenchmark() {
    const content = "ORDEN DEL DÍA\n" + "Intervino el concejal Juan Pérez\n" + "“Esta es una cita muy importante”\n".repeat(100) + "Texto normal aquí.\n".repeat(1000);
    const metadata = { numero: "123", fecha: "2023-10-27" };
    const outputPath = path.join(process.cwd(), 'outbound', 'benchmark_output_v6.docx');

    if (!fs.existsSync('outbound')) {
        fs.mkdirSync('outbound');
    }

    const start = performance.now();
    const iterations = 5;
    for (let i = 0; i < iterations; i++) {
        await exportToTemplateV6(content, outputPath, metadata);
    }
    const end = performance.now();

    console.log(`Average execution time over ${iterations} iterations: ${(end - start) / iterations}ms`);
}

runBenchmark().catch(console.error);
