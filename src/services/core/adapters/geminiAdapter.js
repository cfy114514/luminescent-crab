
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

    // Strictness Injection
    const strictnessPrompt = creativity < 30
        ? "\n[STRICT MODE ACTIVE]: REPLICATE LAYOUT 1:1 (NO ZOOM/NO RADIUS). However, you MUST perform HIGH-END RETOUCHING: Smooth all jagged edges, remove wrinkles, and fix lighting. The outline must be identical, but the content must be PERFECTLY BEAUTIFIED."
        : "";

    // Inject Advanced Settings as text instructions since standard generationConfig doesn't support them
    const advancedInstructions = config ? `
[GENERATION DIRECTIVES]
- ASPECT RATIO: ${config.aspect_ratio || '1:1'}
- OUTPUT QUALITY: ${config.imageSize || '1K'}
- THINKING DEPTH: ${config.thinkingLevel || 'high'} (Optimize for reasoning and complex spatial logic)
- FIDELITY MODE: ${creativity < 30 ? 'STRICT COPY' : 'CREATIVE REIMAGINING'}${strictnessPrompt}
`.trim() : '';

    const parts = [
        { text: `${advancedInstructions}\n\n${prompt}`.trim() },
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

    const payload = {
        contents: [{ parts: parts }],
        generationConfig: {
            temperature: effectiveTemp,
            topK: creativity < 20 ? 1 : 40, // Deterministic at very low creativity
            topP: 0.9,
            maxOutputTokens: 2048,
        }
    };

    console.log(`[Gemini] Sending Request to ${apiUrl}... (Img2Img: ${!!img2imgInput})`);

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
            return `data:${blob.mime_type || blob.mimeType};base64,${blob.data}`;
        }
    }

    throw new Error("No image data found in Gemini response");
};
