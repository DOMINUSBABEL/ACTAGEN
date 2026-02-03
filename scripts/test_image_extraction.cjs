const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

// Test file: Acta 348 Part 2 (Mary Luz) which definitely has images/graphs
const docxPath = 'C:/Users/jegom/.clawdbot/media/inbound/7fefad4d-4b86-43a6-9f87-852b8fab2aac.docx';
const outputDir = 'C:/Users/jegom/clawd/ACTAGEN/outbound/images_348';

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

let imageCount = 0;

const options = {
    convertImage: mammoth.images.imgElement(function(image) {
        return image.read("base64").then(function(imageBuffer) {
            imageCount++;
            const extension = image.contentType.split('/')[1];
            const filename = `image_${imageCount}.${extension}`;
            const filePath = path.join(outputDir, filename);
            
            // Write binary
            fs.writeFileSync(filePath, Buffer.from(imageBuffer, 'base64'));
            
            return {
                src: `[MEDIA: ${filename}]`, // Placeholder for our parser
                class: "extracted-image"
            };
        });
    })
};

mammoth.convertToHtml({path: docxPath}, options)
    .then(result => {
        console.log(`Extracted ${imageCount} images to ${outputDir}`);
        console.log("HTML Preview (first 1000 chars):");
        console.log(result.value.slice(0, 1000));
        
        // Save HTML for inspection
        fs.writeFileSync(path.join(outputDir, 'content.html'), result.value);
    })
    .catch(err => console.error(err));
