const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const inboundDir = 'C:/Users/jegom/.clawdbot/media/inbound';

async function identifyAll() {
    const files = fs.readdirSync(inboundDir);
    console.log(`🔍 Escaneando ${files.length} archivos en inbound...`);
    
    const results = [];

    for (const fileName of files) {
        if (!fileName.endsWith('.docx')) continue;
        const filePath = path.join(inboundDir, fileName);
        
        try {
            const result = await mammoth.extractRawText({path: filePath});
            const text = result.value;
            
            // Buscar "Acta No." o "Acta #" o "Sesión Ordinaria No."
            const match = text.match(/Acta.*?No\.?\s*(\d+)/i) || text.match(/Acta\s*(\d+)/i);
            const actaNumber = match ? match[1] : 'Unknown';
            
            if (actaNumber !== 'Unknown') {
                results.push({ acta: actaNumber, file: fileName, path: filePath });
            }
        } catch (e) {
            // console.error(`Error reading ${fileName}`);
        }
    }

    // Agrupar por acta
    const grouped = results.reduce((acc, curr) => {
        if (!acc[curr.acta]) acc[curr.acta] = [];
        acc[curr.acta].push(curr.path);
        return acc;
    }, {});

    console.log('\n--- MAPA DE ACTAS DETECTADAS ---');
    console.log(JSON.stringify(grouped, null, 2));
}

identifyAll().catch(console.error);
