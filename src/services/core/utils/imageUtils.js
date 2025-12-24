
// Helper: Convert File to Base64
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            data: reader.result.split(',')[1],
            mimeType: reader.result.split(';')[0].split(':')[1],
            fullDataUrl: reader.result
        });
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Post-Processing: Automatically scale and center the product to exactly 0.78125 of the canvas.
 * @param {string} base64Image The generated image in base64.
 * @param {number} targetRatio The target ratio (default 0.78125).
 * @returns {Promise<string>} Processed base64 image.
 */
export const processImageToStandardScale = async (base64Image, targetRatio = 0.78125) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const size = Math.max(img.width, img.height);
            canvas.width = size;
            canvas.height = size;

            // 1. Draw original to detect bounds
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;

            let minX = size, minY = size, maxX = 0, maxY = 0;
            let found = false;

            // Threshold to detect non-white pixels (Pure White is 255,255,255)
            const threshold = 250;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const index = (y * size + x) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];

                    if (r < threshold || g < threshold || b < threshold) {
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                        found = true;
                    }
                }
            }

            if (!found) {
                resolve(base64Image); // Return original if empty
                return;
            }

            const pWidth = maxX - minX;
            const pHeight = maxY - minY;
            const pLongSide = Math.max(pWidth, pHeight);

            // 2. Calculate scale factor to make pLongSide exactly targetRatio portion of canvas size
            const scale = (size * targetRatio) / pLongSide;

            // 3. Draw final scaled and centered image
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = size;
            finalCanvas.height = size;
            const finalCtx = finalCanvas.getContext('2d');

            finalCtx.fillStyle = '#FFFFFF';
            finalCtx.fillRect(0, 0, size, size);

            const drawWidth = pWidth * scale;
            const drawHeight = pHeight * scale;
            const offsetX = (size - drawWidth) / 2;
            const offsetY = (size - drawHeight) / 2;

            finalCtx.drawImage(
                img,
                minX, minY, pWidth, pHeight, // Source
                offsetX, offsetY, drawWidth, drawHeight // Destination
            );

            resolve(finalCanvas.toDataURL('image/jpeg', 0.95));
        };
        img.onerror = () => resolve(base64Image);
        img.src = base64Image;
    });
};
