const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const othersDir = 'C:/Users/jegom/clawd/ACTAGEN/inbound/others';

fs.readdir(othersDir, (err, files) => {
    if (err) return console.error(err);
    const docxFiles = files.filter(f => f.endsWith('.docx'));
    
    docxFiles.forEach(file => {
        const fullPath = path.join(othersDir, file);
        mammoth.extractRawText({path: fullPath})
            .then(result => {
                const text = result.value;
                let actaMatch = text.match(/Acta\s+(\d+)/i);
                let info = actaMatch ? `ACTA ${actaMatch[1]}` : 'UNKNOWN ACTA';
                console.log(`FILE: ${file} | INFO: ${info} | PREVIEW: ${text.slice(0, 50).replace(/\n/g, ' ')}`);
            })
            .catch(err => console.error(`Error processing ${file}: ${err.message}`));
    });
});
