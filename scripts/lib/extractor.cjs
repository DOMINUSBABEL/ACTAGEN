const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function extractContentWithImages(docxPath, imageOutputDir) {
    if (!fs.existsSync(imageOutputDir)) fs.mkdirSync(imageOutputDir, { recursive: true });
    
    let imageCount = 0;
    const content = []; // Array of { type: 'text' | 'image', value: string }

    const options = {
        convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(imageBuffer) {
                imageCount++;
                const extension = image.contentType.split('/')[1];
                const filename = `img_${path.basename(docxPath, '.docx')}_${imageCount}.${extension}`;
                const filePath = path.join(imageOutputDir, filename);
                fs.writeFileSync(filePath, Buffer.from(imageBuffer, 'base64'));
                return { src: `[MEDIA:${filename}]` }; // Special marker
            });
        })
    };

    const result = await mammoth.convertToHtml({path: docxPath}, options);
    const html = result.value;

    // Parse HTML to split text and images
    // Simple regex parser for <p> and <img src="[MEDIA:...]">
    const parts = html.split(/(<img src="\[MEDIA:[^"]+\]" \/>)/g);

    parts.forEach(part => {
        if (part.startsWith('<img src="[MEDIA:')) {
            const filename = part.match(/\[MEDIA:(.*?)\]/)[1];
            content.push({ type: 'image', value: filename });
        } else {
            // Convert HTML back to plain text (stripped tags)
            let text = part.replace(/<\/p><p>/g, "\n").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');
            if (text.trim()) content.push({ type: 'text', value: text });
        }
    });

    return content;
}

module.exports = { extractContentWithImages };
