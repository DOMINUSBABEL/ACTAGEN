const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const inboundDir = 'C:/Users/jegom/.clawdbot/media/inbound';

fs.readdir(inboundDir, async (err, files) => {
    if (err) return console.error(err);
    
    // Sort by time descending to get the very latest
    const sortedFiles = files
        .map(fileName => ({
            name: fileName,
            time: fs.statSync(path.join(inboundDir, fileName)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)
        .slice(0, 10);

    console.log("--- SCANNING FOR ACTA 353 PARTS ---");
    for (const fileObj of sortedFiles) {
        if (!fileObj.name.endsWith('.docx')) continue;
        try {
            const result = await mammoth.extractRawText({path: path.join(inboundDir, fileObj.name)});
            const snippet = result.value.slice(0, 200).replace(/\n/g, ' ');
            
            // Check for Acta 353 indicators
            if (snippet.includes("353") || snippet.includes("14 de noviembre")) {
                console.log(`\nMATCH: ${fileObj.name}`);
                console.log(`SNIPPET: ${snippet}`);
            }
        } catch (e) {
            console.error(`Error reading ${fileObj.name}: ${e.message}`);
        }
    }
});
