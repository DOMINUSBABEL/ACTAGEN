const mammoth = require('mammoth');
const path = 'C:/Users/jegom/.clawdbot/media/inbound/be40d0e2-ac27-43aa-82ed-f62835503c6b.docx';

mammoth.extractRawText({path: path})
    .then(result => {
        console.log("=== INSPECCIÓN ACTA 355 (?) ===");
        console.log(result.value.slice(0, 500));
    })
    .catch(err => console.error(err));
