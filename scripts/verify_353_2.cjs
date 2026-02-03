const mammoth = require('mammoth');
const path = 'C:/Users/jegom/.clawdbot/media/inbound/5895c48a-52b1-4204-aecb-19da4a051602.docx'; // This is the file you quoted as 353_2

mammoth.extractRawText({path: path})
    .then(result => {
        console.log("=== VERIFICACIÓN CONTENIDO ARCHIVO 353_2 (?) ===");
        console.log(result.value.slice(0, 500));
        console.log("================================================");
    })
    .catch(err => console.error(err));
