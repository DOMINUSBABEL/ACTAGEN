import { exportToDiplomaticV9 } from '../services/templateEngineV10.js';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

const IMAGES_DIR = path.join(process.cwd(), 'templates/extracted_349/word/media');
const OUTPUT_DIR = path.join(process.cwd(), 'outbound');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'benchmark_v10.docx');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Ensure images exist (check at least one)
const imageFiles = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
if (imageFiles.length === 0) {
    console.error("No images found in templates directory for benchmark.");
    process.exit(1);
}

// Construct content array
const contentArray = [];
const iterations = 200; // Number of image/text pairs

for (let i = 0; i < iterations; i++) {
    // Add some text that triggers processing
    contentArray.push({
        type: 'text',
        value: `Intervención del concejal Sebastián López Valencia sobre el FONSET.\nEs importante para la seguridad.\n`
    });
    // Add an image (cycle through available images)
    contentArray.push({
        type: 'image',
        value: imageFiles[i % imageFiles.length]
    });
}

const metadata = {
    numero: '999',
    fecha: '20 de noviembre de 2023',
    hora: '09:00'
};

async function runBenchmark() {
    console.log(`Starting benchmark with ${iterations} iterations (Total ${contentArray.length} items)...`);

    // Warm up (optional, but good for JIT)
    // await exportToDiplomaticV9(contentArray.slice(0, 4), OUTPUT_FILE, metadata, IMAGES_DIR);

    const start = performance.now();
    try {
        await exportToDiplomaticV9(contentArray, OUTPUT_FILE, metadata, IMAGES_DIR);
    } catch (error) {
        console.error("Benchmark failed:", error);
        process.exit(1);
    }
    const end = performance.now();

    const duration = end - start;
    console.log(`Benchmark completed in ${duration.toFixed(2)}ms`);
}

runBenchmark();
