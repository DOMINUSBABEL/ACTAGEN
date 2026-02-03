const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const inboundDir = 'C:/Users/jegom/.clawdbot/media/inbound';

fs.readdir(inboundDir, async (err, files) => {
    if (err) return console.error(err);
    
    for (const file of files) {
        if (!file.endsWith('.docx')) continue;
        try {
            const result = await mammoth.extractRawText({path: path.join(inboundDir, file)});
            if (result.value.includes("351") || result.value.toLowerCase().includes("movilidad")) {
                console.log(`\n[MATCH FOUND] ${file}`);
                console.log(result.value.slice(0, 200).replace(/\n/g, ' '));
            }
        } catch (e) {}
    }
});
