const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const inboundDir = 'C:/Users/jegom/.clawdbot/media/inbound';

fs.readdir(inboundDir, async (err, files) => {
    if (err) return console.error(err);
    
    // Last 10 files
    const sortedFiles = files
        .map(fileName => ({
            name: fileName,
            time: fs.statSync(path.join(inboundDir, fileName)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)
        .slice(0, 10);

    console.log("--- SCANNING RECENT FILES ---");
    for (const fileObj of sortedFiles) {
        if (!fileObj.name.endsWith('.docx')) continue;
        try {
            const result = await mammoth.extractRawText({path: path.join(inboundDir, fileObj.name)});
            const snippet = result.value.slice(0, 150).replace(/\n/g, ' ');
            console.log(`FILE: ${fileObj.name}`);
            console.log(`CONTENT: ${snippet}`);
            console.log("---------------------------------------------------");
        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
    }
});
