const mammoth = require('mammoth');
const files = [
    { name: 'NEW_FILE (352_2?)', path: 'C:/Users/jegom/.clawdbot/media/inbound/ab994ab4-02c9-42e3-8a2b-6c30c77446df.docx' },
    { name: 'OLD_FILE (353_2?)', path: 'C:/Users/jegom/.clawdbot/media/inbound/5895c48a-52b1-4204-aecb-19da4a051602.docx' }
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
