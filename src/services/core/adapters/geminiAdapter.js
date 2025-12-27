// --- Google Gemini API Adapter (Sync Call) ---
export const generateSingleImageGemini = async (referenceImages, prompt, apiKey, apiUrl, img2imgInput = null, config = null) => {
    // Determine provider based on URL or Config

    // Ensure Key is passed
    if (!apiUrl.includes("key=") && apiKey) {
        apiUrl += `?key=${apiKey}`;
    }

    // Construct Payload
    // Convert all images to Inline Data for Gemini
    const inlineDataParts = referenceImages.map(img => {
        return {
            inline_data: {
                mime_type: img.mimeType || 'image/jpeg',
                data: img.data
            }
        };
    });

    // Content Part
    // Creativity & Fidelity Logic
    const creativity = config?.creativity ?? 20; // Default 20 (Strict-ish)
    const effectiveTemp = (creativity / 100) * 1.5; // 0.0 to 1.5

    const parts = [
        { text: prompt.trim() },
        ...inlineDataParts
    ];

    // Add Input Image for Refinement (if available)
    if (img2imgInput) {
        // img2imgInput is "data:image/jpeg;base64,....."
        const base64Data = img2imgInput.split(',')[1];
        const mimeType = img2imgInput.split(';')[0].split(':')[1];

        parts.push({ text: "INPUT IMAGE TO REFINE (PREVIOUS ATTEMPT):" });
        parts.push({
            inline_data: {
                mime_type: mimeType,
                data: base64Data
            }
        });
    }


    // Parse Resolution - Official Format: "1K", "2K", "4K"
    const imageSize = config?.imageSize === '2K' ? '2K' : config?.imageSize === '4K' ? '4K' : '1K';
    const aspectRatio = '1:1'; // Default to square

    const payload = {
        contents: [{ parts: parts }],
        generationConfig: {
            temperature: effectiveTemp,
            topK: creativity < 20 ? 1 : 40,
            topP: 0.9,
            maxOutputTokens: 2048,
            // Official Gemini Image Generation Config (REST API uses camelCase!)
            responseModalities: ['Image'], // Request image-only response
            imageConfig: {
                imageSize: imageSize,  // "1K", "2K", "4K"
                aspectRatio: aspectRatio  // "1:1", "3:4", "16:9", etc.
            }
        }
    };


    console.log(`[Gemini] Sending Request to ${apiUrl}... (Img2Img: ${!!img2imgInput})`);
    console.log("[Gemini Creativity Params]:", {
        creativity: creativity,
        temperature: effectiveTemp,
        topK: payload.generationConfig.topK,
        topP: payload.generationConfig.topP
    });
    console.log("[Gemini Request Prompt]:", parts[0]?.text); // Show exact text prompt
    console.log("[Gemini Request Payload]:", JSON.stringify(payload, null, 2)); // Show full payload



    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Gemini Error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log(`[Gemini Raw]`, JSON.stringify(data, null, 2));

    // Parse Result
    const candidates = data.candidates;
    if (candidates && candidates.length > 0) {
        const parts = candidates[0].content.parts;
        const imagePart = parts.find(p => p.inline_data || p.inlineData);
        if (imagePart) {
            const blob = imagePart.inline_data || imagePart.inlineData;
            const mimeType = blob.mime_type || blob.mimeType;
            const dataSizeKB = Math.round(blob.data.length * 0.75 / 1024); // Base64 decodes to ~75% of original length
            console.log(`[Gemini Response] Image received: ${mimeType}, ~${dataSizeKB} KB (decoded)`);
            return `data:${mimeType};base64,${blob.data}`;
        }
    }

    throw new Error("No image data found in Gemini response");
};
