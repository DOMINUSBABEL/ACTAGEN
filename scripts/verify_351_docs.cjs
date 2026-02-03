const mammoth = require('mammoth');
const path = require('path');

const files = [
    'C:/Users/jegom/.clawdbot/media/inbound/d0e59e6c-6e8d-4043-b58d-7dc17d306316.docx',
    'C:/Users/jegom/.clawdbot/media/inbound/6d86d8c9-4e55-428e-90fd-07a8ceab7014.docx',
    'C:/Users/jegom/.clawdbot/media/inbound/1adac13e-9e68-4d90-b8d7-1248a5794bbf.docx'
];

async function inspect() {
    for (const f of files) {
        try {
            const result = await mammoth.extractRawText({path: f});
            console.log(`\n--- FILE: ${path.basename(f)} ---`);
            console.log(result.value.slice(0, 500)); // First 500 chars
        } catch (e) {
            console.error(e.message);
        }
    }
}

inspect();
