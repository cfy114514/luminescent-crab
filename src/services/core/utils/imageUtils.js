
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

            resolve(finalCanvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(base64Image);
        img.src = base64Image;
    });
};

/**
 * Convert image to edge-detected sketch style.
 * This completely removes face details while preserving pose structure.
 * @param {string} base64Data The image data (without data:... prefix)
 * @param {string} mimeType The mime type
 * @returns {Promise<{data: string, mimeType: string}>} Sketch-style image
 */
export const maskFaceInImage = async (base64Data, mimeType) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Get image data for processing
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const width = canvas.width;
            const height = canvas.height;

            // Step 1: Convert to grayscale
            const gray = new Uint8ClampedArray(width * height);
            for (let i = 0; i < data.length; i += 4) {
                const idx = i / 4;
                gray[idx] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            }

            // Step 2: Apply Sobel edge detection
            const edges = new Uint8ClampedArray(width * height);
            const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
            const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    let gx = 0, gy = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const idx = (y + ky) * width + (x + kx);
                            const kernelIdx = (ky + 1) * 3 + (kx + 1);
                            gx += gray[idx] * sobelX[kernelIdx];
                            gy += gray[idx] * sobelY[kernelIdx];
                        }
                    }
                    const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy));
                    edges[y * width + x] = magnitude;
                }
            }

            // Step 3: Create sketch output (white background, dark edges)
            const outputData = ctx.createImageData(width, height);
            for (let i = 0; i < edges.length; i++) {
                const edgeValue = edges[i];
                // Invert and threshold for sketch effect
                const sketchValue = edgeValue > 30 ? 0 : 255; // Black edges on white
                outputData.data[i * 4] = sketchValue;
                outputData.data[i * 4 + 1] = sketchValue;
                outputData.data[i * 4 + 2] = sketchValue;
                outputData.data[i * 4 + 3] = 255;
            }
            ctx.putImageData(outputData, 0, 0);

            // Step 4: Add instruction text
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${Math.floor(img.width * 0.025)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('POSE REFERENCE - GENERATE NEW FACE', canvas.width / 2, canvas.height * 0.05);

            // Convert back to base64
            const resultDataUrl = canvas.toDataURL('image/png');
            const resultBase64 = resultDataUrl.split(',')[1];

            console.log('[maskFaceInImage] Edge detection sketch created successfully');
            resolve({
                data: resultBase64,
                mimeType: 'image/png'
            });
        };
        img.onerror = () => {
            console.warn('[maskFaceInImage] Failed to load image, returning original');
            resolve({ data: base64Data, mimeType: mimeType });
        };
        img.src = `data:${mimeType};base64,${base64Data}`;
    });
};
