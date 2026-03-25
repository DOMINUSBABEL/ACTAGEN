
import { performance } from 'perf_hooks';

// Simulate extractText which is I/O bound
async function mockExtractText(path) {
    // Simulate a delay of 100-300ms for file I/O and parsing
    const delay = Math.floor(Math.random() * 200) + 100;
    await new Promise(resolve => setTimeout(resolve, delay));
    return `Content of ${path}`;
}

async function runSequential(files) {
    const start = performance.now();
    let fullText = "";
    for (const file of files) {
        let text = await mockExtractText(file);
        fullText += text + "\n\n";
    }
    const end = performance.now();
    return end - start;
}

async function runParallel(files) {
    const start = performance.now();
    const textParts = await Promise.all(files.map(async (file) => {
        let text = await mockExtractText(file);
        return text;
    }));
    const fullText = textParts.join("\n\n") + "\n\n";
    const end = performance.now();
    return end - start;
}

async function main() {
    const files = [
        'file1.docx',
        'file2.docx',
        'file3.docx',
        'file4.docx',
        'file5.docx'
    ];

    console.log(`Benchmarking with ${files.length} mock files...`);

    const seqTime = await runSequential(files);
    console.log(`Sequential Time: ${seqTime.toFixed(2)}ms`);

    const parTime = await runParallel(files);
    console.log(`Parallel Time: ${parTime.toFixed(2)}ms`);

    const speedup = (seqTime / parTime).toFixed(2);
    console.log(`Speedup: ${speedup}x`);
}

main().catch(console.error);
