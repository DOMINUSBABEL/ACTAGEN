
import { exportToDiplomaticV9 } from '../services/templateEngineV10.js';
import fs from 'fs/promises';
import path from 'path';

async function verify() {
    console.log("Starting functional verification...");

    const testAssetsDir = path.join(process.cwd(), 'test_assets_verify');
    await fs.mkdir(testAssetsDir, { recursive: true });

    // Create one valid small PNG and one missing image reference
    const smallPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", 'base64');
    await fs.writeFile(path.join(testAssetsDir, 'valid.png'), smallPng);

    const contentArray = [
        { type: 'text', value: 'Hello World' },
        { type: 'image', value: 'valid.png' },
        { type: 'image', value: 'missing.png' }, // Should be handled by try-catch
        { type: 'text', value: 'After missing image' }
    ];

    const metadata = { numero: "456", fecha: "2023-10-28" };
    const outputPath = path.join(process.cwd(), 'outbound', 'verify_output.docx');

    if (!(await fs.access('outbound').then(() => true).catch(() => false))) {
        await fs.mkdir('outbound');
    }

    try {
        console.log("Calling exportToDiplomaticV9...");
        await exportToDiplomaticV9(contentArray, outputPath, metadata, testAssetsDir);
        console.log("Export successful!");

        const exists = await fs.access(outputPath).then(() => true).catch(() => false);
        if (exists) {
            console.log("Output file generated successfully.");
        } else {
            console.error("Output file NOT generated.");
            process.exit(1);
        }
    } catch (err) {
        console.error("Verification failed with error:", err);
        process.exit(1);
    } finally {
        // Cleanup
        await fs.rm(testAssetsDir, { recursive: true, force: true });
    }
}

verify().catch(err => {
    console.error("Unhandled error:", err);
    process.exit(1);
});
