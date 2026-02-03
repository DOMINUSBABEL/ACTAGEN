const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const inboundDir = 'C:/Users/jegom/.clawdbot/media/inbound';

fs.readdir(inboundDir, async (err, files) => {
    if (err) return console.error(err);
    
    // Sort by time descending to get the latest
    const sortedFiles = files
        .map(fileName => ({
            name: fileName,
            time: fs.statSync(path.join(inboundDir, fileName)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)
        .slice(0, 5); // Just the last 5

    for (const fileObj of sortedFiles) {
        if (!fileObj.name.endsWith('.docx')) continue;
        try {
            const result = await mammoth.extractRawText({path: path.join(inboundDir, fileObj.name)});
            const preview = result.value.slice(0, 300).replace(/\n/g, ' ');
            console.log(`\nFILE: ${fileObj.name}`);
            console.log(`PREVIEW: ${preview}`);
        } catch (e) {
            console.log(`Error reading ${fileObj.name}: ${e.message}`);
        }
    }
});
