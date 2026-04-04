
import { exportToDiplomaticV9 } from '../services/templateEngineV10.js';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

async function runBenchmark() {
    const testAssetsDir = path.join(process.cwd(), 'test_assets');
    if (!fs.existsSync(testAssetsDir)) {
        fs.mkdirSync(testAssetsDir);
    }

    // Create a 1MB dummy image to make I/O more significant
    const dummyImagePath = path.join(testAssetsDir, 'large_dummy.png');
    const buffer = Buffer.alloc(1024 * 1024, 'a');
    // Minimal PNG header to satisfy image-size if possible,
    // but actually image-size might fail on just 'a's.
    // Let's use a real small png and just make it bigger if needed,
    // or just use many small ones.

    // Better: create 100 small valid PNGs
    const smallPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", 'base64');
    for (let i = 0; i < 50; i++) {
        fs.writeFileSync(path.join(testAssetsDir, `test_${i}.png`), smallPng);
    }

    const contentArray = [];
    for (let i = 0; i < 50; i++) {
        contentArray.push({ type: 'image', value: `test_${i}.png` });
        contentArray.push({ type: 'text', value: 'Some text between images' });
    }

    const metadata = { numero: "123", fecha: "2023-10-27" };
    const outputPath = path.join(process.cwd(), 'outbound', 'benchmark_output_v10.docx');

    if (!fs.existsSync('outbound')) {
        fs.mkdirSync('outbound');
    }

    // Warm up
    await exportToDiplomaticV9(contentArray, outputPath, metadata, testAssetsDir);

    const start = performance.now();
    const iterations = 10;
    for (let i = 0; i < iterations; i++) {
        await exportToDiplomaticV9(contentArray, outputPath, metadata, testAssetsDir);
    }
    const end = performance.now();

    console.log(`Average execution time over ${iterations} iterations: ${(end - start) / iterations}ms`);
}

runBenchmark().catch(console.error);
