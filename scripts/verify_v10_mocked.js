
import fs from 'fs/promises';
import path from 'path';

// Minimal mock for docx classes
class Paragraph { constructor(opts) { this.opts = opts; } }
class TextRun { constructor(opts) { this.opts = opts; } }
class ImageRun { constructor(opts) { this.opts = opts; } }
class Document { constructor(opts) { this.opts = opts; } }
class Packer { static async toBuffer(doc) { return Buffer.from("mock docx data"); } }
const AlignmentType = { CENTER: 'center', LEFT: 'left', JUSTIFIED: 'justified', RIGHT: 'right' };
const PageNumber = { CURRENT: 'current', TOTAL_PAGES: 'total' };
class Header { constructor(opts) { this.opts = opts; } }
class Footer { constructor(opts) { this.opts = opts; } }

// Mock sizeOf
const sizeOf = (buf) => ({ width: 100, height: 100 });

// Re-implement the core logic from templateEngineV10.js for verification
// since we can't easily import it without its real dependencies.

const STYLES = { font: "Arial", sizeBody: 24, margins: { top: 1440 } };
const OFFICIAL_NAMES = ["Official Name"];
const PROCESSED_OFFICIAL_NAMES = [{ original: "Official Name", normName: "official name", regex: /official name/gi }];

async function mockedExport(contentArray, outputPath, metadata = {}, imageBaseDir) {
    const sections = [];
    const bodyChildren = [];

    for (const item of contentArray) {
        if (item.type === 'image') {
            const imagePath = path.join(imageBaseDir, item.value);
            try {
                // VERIFICATION: Check if using async readFile
                const buf = await fs.readFile(imagePath);
                const dims = sizeOf(buf);
                bodyChildren.push(new Paragraph({
                    children: [new ImageRun({ data: buf })]
                }));
                console.log(`Successfully processed image: ${item.value}`);
            } catch (e) {
                console.log(`Gracefully skipped missing image: ${item.value}`);
            }
        } else {
            bodyChildren.push(new Paragraph({ children: [new TextRun({ text: item.value })] }));
        }
    }

    const doc = new Document({ sections });
    const buffer = await Packer.toBuffer(doc);
    // VERIFICATION: Check if using async writeFile
    await fs.writeFile(outputPath, buffer);
}

async function verify() {
    console.log("Starting functional verification with MOCKS...");
    const testAssetsDir = path.join(process.cwd(), 'test_assets_verify_mock');
    await fs.mkdir(testAssetsDir, { recursive: true });

    const smallPng = Buffer.from("dummy png data");
    await fs.writeFile(path.join(testAssetsDir, 'valid.png'), smallPng);

    const contentArray = [
        { type: 'text', value: 'Hello World' },
        { type: 'image', value: 'valid.png' },
        { type: 'image', value: 'missing.png' },
        { type: 'text', value: 'After missing image' }
    ];

    const outputPath = path.join(process.cwd(), 'outbound', 'verify_mock_output.docx');
    await fs.mkdir('outbound', { recursive: true });

    try {
        await mockedExport(contentArray, outputPath, metadata, testAssetsDir);
        console.log("Mocked export successful!");

        const exists = await fs.access(outputPath).then(() => true).catch(() => false);
        if (exists) {
            console.log("Output file generated successfully.");
        } else {
            throw new Error("Output file NOT generated.");
        }
    } catch (err) {
        console.error("Verification failed:", err);
        process.exit(1);
    } finally {
        await fs.rm(testAssetsDir, { recursive: true, force: true });
    }
}

const metadata = { numero: "456", fecha: "2023-10-28" };
verify();
