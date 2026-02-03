const mammoth = require('mammoth');
const files = [
    { name: 'PARTE 1', path: 'C:/Users/jegom/.clawdbot/media/inbound/d1393908-b306-49d7-ae80-266318e017e4.docx' },
    { name: 'PARTE 2', path: 'C:/Users/jegom/.clawdbot/media/inbound/7fefad4d-4b86-43a6-9f87-852b8fab2aac.docx' },
    { name: 'PARTE 3', path: 'C:/Users/jegom/.clawdbot/media/inbound/5f29afe8-db26-4118-9f62-044dd2eeba26.docx' }
];

async function inspect() {
    for (const f of files) {
        try {
            const result = await mammoth.extractRawText({path: f.path});
            console.log(`\n=== FILE: ${f.name} ===`);
            console.log(result.value.slice(0, 500)); 
        } catch (e) {
            console.error(`Error reading ${f.name}: ${e.message}`);
        }
    }
}
inspect();
