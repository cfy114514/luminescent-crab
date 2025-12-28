
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
 * Post-Processing: Smart crop and scale product images (v3).
 * - Excludes thin accessories (ropes) using sliding window density.
 * - Scales product to fill ~85% of canvas as requested.
 * - Uses 'lighten' blending for silk-smooth white transition.
 * @param {string} base64Image The generated image in base64.
 * @param {number} targetRatio The target ratio for main body (default 0.85).
 * @returns {Promise<string>} Processed base64 image.
 */
export const processImageToStandardScale = async (base64Image, targetRatio = 0.85) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const sourceWidth = img.width;
            const sourceHeight = img.height;
            const outputSize = Math.max(sourceWidth, sourceHeight);

            const detectCanvas = document.createElement('canvas');
            const detectCtx = detectCanvas.getContext('2d');
            detectCanvas.width = sourceWidth;
            detectCanvas.height = sourceHeight;
            detectCtx.fillStyle = '#FFFFFF';
            detectCtx.fillRect(0, 0, sourceWidth, sourceHeight);
            detectCtx.drawImage(img, 0, 0);

            const imageData = detectCtx.getImageData(0, 0, sourceWidth, sourceHeight);
            const data = imageData.data;

            // Step 1: Count pixels per row and column
            const rowDensity = new Array(sourceHeight).fill(0);
            const colDensity = new Array(sourceWidth).fill(0);
            const threshold = 238; // Strict threshold to ignore AI background noise/shadows

            for (let y = 0; y < sourceHeight; y++) {
                for (let x = 0; x < sourceWidth; x++) {
                    const idx = (y * sourceWidth + x) * 4;
                    if (data[idx] < threshold || data[idx + 1] < threshold || data[idx + 2] < threshold) {
                        rowDensity[y]++;
                        colDensity[x]++;
                    }
                }
            }

            // Step 2: Use a "Thickness Window" to find the CORE product body
            // This requires a 20px contiguous thick block to start the core range.
            const findCoreRange = (density, windowSize = 20) => {
                const maxD = Math.max(...density, 0);
                if (maxD === 0) return [0, density.length - 1];
                const minCoreDensity = maxD * 0.25;

                let start = 0, end = density.length - 1;

                for (let i = 0; i < density.length - windowSize; i++) {
                    let isSolid = true;
                    for (let j = 0; j < windowSize; j++) {
                        if (density[i + j] < minCoreDensity) { isSolid = false; break; }
                    }
                    if (isSolid) { start = i; break; }
                }

                for (let i = density.length - 1; i > windowSize; i--) {
                    let isSolid = true;
                    for (let j = 0; j < windowSize; j++) {
                        if (density[i - j] < minCoreDensity) { isSolid = false; break; }
                    }
                    if (isSolid) { end = i; break; }
                }
                return [start, end];
            };

            const [coreMinY, coreMaxY] = findCoreRange(rowDensity);
            const [coreMinX, coreMaxX] = findCoreRange(colDensity);

            const coreWidth = Math.max(1, coreMaxX - coreMinX);
            const coreHeight = Math.max(1, coreMaxY - coreMinY);
            const longSide = Math.max(coreWidth, coreHeight);

            // Step 3: Calculate Scale and Position
            const scale = (outputSize * targetRatio) / longSide;
            const coreCenterX = (coreMinX + coreMaxX) / 2;
            const coreCenterY = (coreMinY + coreMaxY) / 2;

            const drawX = (outputSize / 2) - (coreCenterX * scale);
            const drawY = (outputSize / 2) - (coreCenterY * scale);

            // Step 4: Rendering with Smooth Blending
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = outputSize;
            finalCanvas.height = outputSize;
            const ctx = finalCanvas.getContext('2d');

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, outputSize, outputSize);
            ctx.drawImage(img, drawX, drawY, sourceWidth * scale, sourceHeight * scale);

            // Step 5: Silk-Smooth Edge Blending using 'lighten' mode
            const fadeSize = Math.floor(outputSize * 0.12);
            ctx.globalCompositeOperation = 'lighten';

            // Top
            const tGrad = ctx.createLinearGradient(0, 0, 0, fadeSize);
            tGrad.addColorStop(0, '#FFFFFF'); tGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = tGrad; ctx.fillRect(0, 0, outputSize, fadeSize);

            // Bottom
            const bGrad = ctx.createLinearGradient(0, outputSize, 0, outputSize - fadeSize);
            bGrad.addColorStop(0, '#FFFFFF'); bGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = bGrad; ctx.fillRect(0, outputSize - fadeSize, outputSize, fadeSize);

            // Left
            const lGrad = ctx.createLinearGradient(0, 0, fadeSize, 0);
            lGrad.addColorStop(0, '#FFFFFF'); lGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = lGrad; ctx.fillRect(0, 0, fadeSize, outputSize);

            // Right
            const rGrad = ctx.createLinearGradient(outputSize, 0, outputSize - fadeSize, 0);
            rGrad.addColorStop(0, '#FFFFFF'); rGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = rGrad; ctx.fillRect(outputSize - fadeSize, 0, fadeSize, outputSize);

            console.log(`[SmartCrop v3] Core: ${coreWidth}x${coreHeight}, Scale: ${scale.toFixed(2)}, Center: ${coreCenterX.toFixed(0)},${coreCenterY.toFixed(0)}`);
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

            // Create a grayscale version first for edge detection
            const grayscale = new Uint8ClampedArray(data.length);
            for (let i = 0; i < data.length; i += 4) {
                const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                grayscale[i] = grayscale[i + 1] = grayscale[i + 2] = avg;
                grayscale[i + 3] = data[i + 3];
            }

            // Simple Sobel-like edge detection
            const output = ctx.createImageData(canvas.width, canvas.height);
            const outData = output.data;

            for (let y = 1; y < canvas.height - 1; y++) {
                for (let x = 1; x < canvas.width - 1; x++) {
                    const idx = (y * canvas.width + x) * 4;

                    // Simple difference with neighbors
                    const diffX = Math.abs(grayscale[idx] - grayscale[idx + 4]);
                    const diffY = Math.abs(grayscale[idx] - grayscale[idx + canvas.width * 4]);

                    const edge = Math.min(255, (diffX + diffY) * 2);

                    // Invert: white background, black lines
                    const val = 255 - edge;

                    outData[idx] = val;
                    outData[idx + 1] = val;
                    outData[idx + 2] = val;
                    outData[idx + 3] = 255;
                }
            }

            ctx.putImageData(output, 0, 0);

            const resultBase64 = canvas.toDataURL(mimeType).split(',')[1];
            resolve({ data: resultBase64, mimeType });
        };
        img.onerror = () => resolve({ data: base64Data, mimeType });
        img.src = `data:${mimeType};base64,${base64Data}`;
    });
};

/**
 * Extract dominant colors from an image.
 * Samples pixels and returns the most frequent colors.
 */
export const extractDominantColors = (base64Image, sampleCount = 1000) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const sourceWidth = img.width;
            const sourceHeight = img.height;
            canvas.width = sourceWidth;
            canvas.height = sourceHeight;
            ctx.drawImage(img, 0, 0);

            // Define central sampling area (50% center) to avoid background interference
            const sampleRect = {
                x: Math.floor(sourceWidth * 0.25),
                y: Math.floor(sourceHeight * 0.25),
                w: Math.floor(sourceWidth * 0.5),
                h: Math.floor(sourceHeight * 0.5)
            };

            const imageData = ctx.getImageData(sampleRect.x, sampleRect.y, sampleRect.w, sampleRect.h);
            const data = imageData.data;
            let totalR = 0, totalG = 0, totalB = 0, count = 0;

            for (let i = 0; i < data.length; i += 40) { // Sample every 10th pixel
                const r = data[i], g = data[i + 1], b = data[i + 2];
                // Skip very light pixels (background)
                if (r > 230 && g > 230 && b > 230) continue;
                // Skip grey background colors (R ~ G ~ B)
                if (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10 && r > 180) continue;

                totalR += r;
                totalG += g;
                totalB += b;
                count++;
            }

            if (count > 0) {
                const avgColor = {
                    r: Math.round(totalR / count),
                    g: Math.round(totalG / count),
                    b: Math.round(totalB / count)
                };
                console.log(`[ColorExtract] Reference color: RGB(${avgColor.r}, ${avgColor.g}, ${avgColor.b}) sampled from ${count} pixels`);
                resolve(avgColor);
            } else {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = base64Image;
    });
};

/**
 * Apply color correction to an image to match a reference color.
 */
export const applyColorCorrection = (base64Image, referenceColor) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // 1. Find current average color (sampling center)
            const sampleRect = {
                x: Math.floor(canvas.width * 0.25),
                y: Math.floor(canvas.height * 0.25),
                w: Math.floor(canvas.width * 0.5),
                h: Math.floor(canvas.height * 0.5)
            };
            const centerData = ctx.getImageData(sampleRect.x, sampleRect.y, sampleRect.w, sampleRect.h).data;

            let currentR = 0, currentG = 0, currentB = 0, count = 0;
            for (let i = 0; i < centerData.length; i += 40) {
                const r = centerData[i], g = centerData[i + 1], b = centerData[i + 2];
                if (r > 230 && g > 230 && b > 230) continue;
                if (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10 && r > 180) continue;
                currentR += r; currentG += g; currentB += b;
                count++;
            }

            if (count === 0) {
                resolve(base64Image);
                return;
            }

            const avgR = currentR / count;
            const avgG = currentG / count;
            const avgB = currentB / count;

            // 2. Calculate correction factors (limit to ±40% change to avoid deep artifacts)
            const factorR = Math.max(0.6, Math.min(1.4, referenceColor.r / avgR));
            const factorG = Math.max(0.6, Math.min(1.4, referenceColor.g / avgG));
            const factorB = Math.max(0.6, Math.min(1.4, referenceColor.b / avgB));

            console.log(`[ColorCorrect] Current: RGB(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)}), Target: RGB(${referenceColor.r}, ${referenceColor.g}, ${referenceColor.b})`);
            console.log(`[ColorCorrect] Factors: R=${factorR.toFixed(2)}, G=${factorG.toFixed(2)}, B=${factorB.toFixed(2)}`);

            // 3. Apply correction to all non-white pixels
            let correctedCount = 0;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                // Skip white/very light grey/shadow areas (don't tint the background)
                if (r > 200 && g > 200 && b > 200) continue;

                data[i] = Math.min(255, r * factorR);
                data[i + 1] = Math.min(255, g * factorG);
                data[i + 2] = Math.min(255, b * factorB);
                correctedCount++;
            }

            console.log(`[ColorCorrect] Corrected ${correctedCount} product pixels.`);
            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(base64Image);
        img.src = base64Image;
    });
};
