const fs = require('fs');
const path = require('path');
// const AdmZip = require('adm-zip'); // Removido para usar powershell nativo

const { exec } = require('child_process');

const inputFile = 'ACTAGEN/templates/MASTER_ACTA_349_FINAL.zip';
const outputDir = 'ACTAGEN/templates/extracted_349';

// PowerShell command to unzip
const psCommand = `Expand-Archive -Path "${inputFile}" -DestinationPath "${outputDir}" -Force`;

exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error extraction: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return;
    }
    console.log(`Extracted to ${outputDir}`);
    
    // List images
    const mediaDir = path.join(outputDir, 'word', 'media');
    fs.readdir(mediaDir, (err, files) => {
        if (err) {
            console.log("No media folder found or error reading it.");
        } else {
            console.log("Found assets:", files);
            // Generar reporte de assets
            const reportPath = 'ACTAGEN/docs/ASSETS_RECOVERED_349.md';
            const content = `# Assets Recuperados de Acta 349\n\n${files.map(f => `- ${f}`).join('\n')}`;
            fs.writeFileSync(reportPath, content);
        }
    });
});
