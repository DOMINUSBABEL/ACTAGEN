
import fs from 'fs/promises';
import fsSync from 'fs';
import { performance } from 'perf_hooks';
import path from 'path';

async function benchmark() {
    const filePath = 'test_file.bin';
    const data = Buffer.alloc(1024 * 1024, 'a'); // 1MB
    await fs.writeFile(filePath, data);

    const iterations = 100;

    // Sync
    const startSync = performance.now();
    for (let i = 0; i < iterations; i++) {
        fsSync.readFileSync(filePath);
    }
    const endSync = performance.now();

    // Async
    const startAsync = performance.now();
    const promises = [];
    for (let i = 0; i < iterations; i++) {
        promises.push(fs.readFile(filePath));
    }
    await Promise.all(promises);
    const endAsync = performance.now();

    console.log(`Sync total: ${endSync - startSync}ms`);
    console.log(`Async total: ${endAsync - startAsync}ms`);

    await fs.unlink(filePath);
}

benchmark().catch(console.error);
