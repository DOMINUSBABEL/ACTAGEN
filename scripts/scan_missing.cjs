const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const inboundDir = 'C:/Users/jegom/.clawdbot/media/inbound';
const targets = ['273', '281', '315', '317', '320', '327', '351', '352', '353', '355', '356', '368', '369', '366', '271', '321', '359', '360', '364', '382'];

async function scan() {
    const files = fs.readdirSync(inboundDir);
    const results = {};

    for (const file of files) {
        if (!file.endsWith('.docx')) continue;
        const filePath = path.join(inboundDir, file);
        try {
            const result = await mammoth.extractRawText({path: filePath});
            const text = result.value;
            const match = text.match(/Acta.*?No\.?\s*(\d+)/i) || text.match(/Acta\s*(\d+)/i);
            if (match && targets.includes(match[1])) {
                if (!results[match[1]]) results[match[1]] = [];
                results[match[1]].push(filePath);
            }
        } catch (e) {}
    }
    console.log(JSON.stringify(results, null, 2));
}
scan();
