/**
 * API Service: Multi-View Parallel Generation with Multi-Reference Support
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Convert File to Base64
const fileToBase64 = (file) => {
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

// === Prompt Engineering for Views ===
const getViewPrompt = (viewType, config) => {
    const base = "high quality, 4k, photorealistic product photography, white background";
    const product = config.clothing ? config.clothing : "the product shown in reference images";

    // Updated prompt to emphasize "referencing provided images"
    let context = "Using the provided reference images to understand the product's structure and details, generate";

    // Inject User Description if present
    if (config.description) {
        context += ` IMPORTANT - Pay attention to these specific features: ${config.description}. `;
    }

    switch (viewType) {
        case 'front':
            return `${context} a clean front-view straight-on photo of ${product}, centeralized composition, ${base}`;
        case 'side':
            return `${context} a side-profile view (90 degree) photo of ${product}, showing detailing, ${base}`;
        case 'top':
            return `${context} a 45-degree isometric top-down view photo of ${product}, ${base}`;
        case 'model':
            const modelDesc = `${config.ethnicity || 'asian'} ${config.gender || 'female'} model`;
            const scene = config.scene ? `in a ${config.scene}` : "studio lighting";
            return `${context} a professional fashion photo of a ${modelDesc} wearing ${product}, ${scene}, ${base}`;
        default: // transparent / general
            return `${context} a clean standalone photo of ${product} isolated on pure white background, ${base}`;
    }
};

// Single API Call Wrapper (Supports Multiple Reference Images)
const generateSingleImage = async (referenceImagesBase64, prompt, apiKey, apiUrl) => {
    // Check Config
    if (!apiKey || !apiUrl || apiUrl.includes("nanobanana.com")) {
        throw new Error("MockMode");
    }

    const isGoogle = apiUrl.includes('googleapis.com');
    if (isGoogle && !apiUrl.includes("key=") && apiKey) {
        apiUrl += `?key=${apiKey}`;
    }

    const headers = { 'Content-Type': 'application/json' };
    let payload = {};

    if (isGoogle) {
        // Construct Gemini Payload with MULTIPLE images
        const imageParts = referenceImagesBase64.map(img => ({
            inline_data: { mime_type: img.mimeType, data: img.data }
        }));

        payload = {
            contents: [{
                parts: [
                    { text: prompt + " Ensure consistency with all provided reference images." },
                    ...imageParts
                ]
            }]
        };
    } else {
        // Fallback for OpenAI/Generic (Usually support only 1 init_image or requires specific multi-image format)
        // For now, we take the FIRST image as init_image for generic APIs
        headers['Authorization'] = `Bearer ${apiKey}`;
        payload = {
            prompt,
            init_image: referenceImagesBase64[0].fullDataUrl, // Only 1 supported for generic
            steps: 30
        };
    }

    const response = await fetch(apiUrl, {
        method: 'POST', headers, body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText.slice(0, 100)}`);
    }

    const data = await response.json();

    // Parse Logic (Same as before)
    if (data.candidates?.[0]?.content?.parts) {
        const parts = data.candidates[0].content.parts;
        const imagePart = parts.find(p => p.inline_data || p.inlineData);
        if (imagePart) {
            const inlineData = imagePart.inline_data || imagePart.inlineData;
            return `data:${inlineData.mime_type || inlineData.mimeType || 'image/png'};base64,${inlineData.data}`;
        }
    }

    if (data.predictions?.[0]) return `data:image/png;base64,${data.predictions[0]}`;
    if (data.output?.[0]) return data.output[0];
    if (data.images?.[0]?.url) return data.images[0].url;

    throw new Error("Unknown Response Format");
};

export const generateImages = async (files, config) => {
    const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;
    const apiUrl = import.meta.env.VITE_NANOBANANA_API_URL ? import.meta.env.VITE_NANOBANANA_API_URL.replace('{gemini-3-pro-image-preview}', 'gemini-1.5-flash') : '';

    // Process ALL files
    const processedImages = await Promise.all(files.map(fileToBase64)); // [{data, mimeType, fullDataUrl}, ...]

    const tasks = [
        { key: 'transparent', label: '透明背景', type: 'transparent' },
        { key: 'front', label: '正面视图', type: 'front' },
        { key: 'side', label: '侧面视图', type: 'side' },
        { key: 'top', label: '45°俯视', type: 'top' },
        { key: 'model', label: '模特展示', type: 'model' }
    ];

    console.log(`Starting ${tasks.length} parallel generations with ${files.length} reference images...`);

    const resultsArray = await Promise.all(tasks.map(async (task) => {
        const prompt = getViewPrompt(task.type, config);
        try {
            const url = await generateSingleImage(processedImages, prompt, apiKey, apiUrl);
            return { key: task.key, label: task.label, url, success: true };
        } catch (err) {
            console.warn(`Task ${task.key} failed:`, err.message);
            // Fallback to FIRST reference image
            return { key: task.key, label: `${task.label} (失败)`, url: processedImages[0].fullDataUrl, success: false, error: err.message };
        }
    }));

    const imagesObj = resultsArray.reduce((acc, item) => {
        acc[item.key] = { url: item.url, label: item.label };
        return acc;
    }, {});

    // Inspector Payload Sample
    const modelPrompt = getViewPrompt('model', config);
    const sampleImageParts = processedImages.map((img, i) => ({
        inline_data: { mime_type: img.mimeType, data: `[Image ${i + 1}: ${(img.data.length / 1024).toFixed(2)}KB]` }
    }));

    const samplePayload = {
        note: `Showing payload (5 parallel reqs). Context: ${files.length} Reference Images.`,
        url: apiUrl,
        method: "POST",
        body: {
            contents: [{
                parts: [
                    { text: modelPrompt },
                    ...sampleImageParts
                ]
            }]
        }
    };

    return {
        payload: samplePayload,
        images: imagesObj
    };
};
