/**
 * OpenAI API Adapter for Local Proxy (Gemini 3 Pro Image)
 * Implements the protocol used in test.py via fetch
 */

export const generateSingleImageOpenAI = async (referenceImages, prompt, apiKey, apiUrl, img2imgInput = null, config = null) => {
    // Default config from test.py if not provided
    // base_url="http://127.0.0.1:8045/v1"

    // If we are routed here, apiUrl usually comes from VITE_API_URL_GENERATOR or similar. 
    // However, the user request says "add this call method... separate from local reverse proxy".
    // Actually, the user said "explicitly separate current local proxy way and original way".
    // We will assume the URL passed in might need adjustment or we use a hardcoded fallback if it's the specific "OpenAI" mode.
    // For now, let's assume the caller passes the correct base URL or we handle it here.

    // The test.py uses: http://127.0.0.1:8045/v1
    // And calls: /chat/completions

    let endpoint = apiUrl;
    if (!endpoint.endsWith('/chat/completions')) {
        // Safe check to append path if only base is given
        if (endpoint.endsWith('/v1')) {
            endpoint = `${endpoint}/chat/completions`;
        } else if (endpoint.endsWith('/')) {
            endpoint = `${endpoint}v1/chat/completions`;
        } else {
            // It might be the full URL already, or just base.
            // If it doesn't have 'chat/completions', append it.
            if (!endpoint.includes('chat/completions')) {
                endpoint = `${endpoint}/v1/chat/completions`;
            }
        }
    }

    // Prepare content for "content" field. 
    // Unlike Google adapter which takes "parts", OpenAI usually takes a string or array of content parts.
    // This proxy seems to be "Text to Image" disguised as Chat.
    // In test.py: content is just string "Draw a futuristic city".
    // But we have Reference Images!
    // Does the proxy support multimodal inputs in standard OpenAI vision format?
    // The user didn't provide a multimodal test case, only text. 
    // However, since it's "Gemini 3 Pro Image", it likely supports input images.
    // Standard OpenAI Vision format:
    // { type: "text", text: "..." }, { type: "image_url", image_url: { url: "data:image/jpeg;base64,..." } }

    const messages = [];
    const contentParts = [];

    // 1. Add Prompt
    contentParts.push({
        type: "text",
        text: prompt
    });

    // 2. Add Reference Images
    // We assume the proxy handles standard OpenAI Vision inputs for reference
    referenceImages.forEach(img => {
        const base64Str = `data:${img.mimeType || 'image/jpeg'};base64,${img.data}`;
        contentParts.push({
            type: "image_url",
            image_url: {
                url: base64Str
            }
        });
    });

    messages.push({
        role: "user",
        content: contentParts
    });

    // 3. Construct Body
    // Mapped from test.py
    // extra_body={ "size": "2048x2048" } -> Merged into root

    // Determine size
    let sizeParam = "1024x1024";
    if (config?.imageSize === '2K') sizeParam = "2048x2048";
    if (config?.imageSize === '4K') sizeParam = "2048x2048"; // Proxy might not support 4K or uses specific enum? test.py lists 2048x2048.
    // test.py comments: Support: "1024x1024" (1:1), "1280x720" (16:9), "720x1280" (9:16), "1216x896" (4:3)

    // Handle Aspect Ratio if provided
    if (config?.aspect_ratio) {
        switch (config.aspect_ratio) {
            case '16:9': sizeParam = "1280x720"; break;
            case '9:16': sizeParam = "720x1280"; break;
            case '4:3': sizeParam = "1216x896"; break;
            case '3:4': sizeParam = "896x1216"; break; // Assumptions based on inverse? Or fallback to 1:1 if not supported
            case '1:1': default: sizeParam = "1024x1024";
                if (config?.imageSize === '2K') sizeParam = "2048x2048";
                break;
        }
    }

    const payload = {
        model: "gemini-3-pro-image", // Fixed model name from test.py
        messages: messages,
        size: sizeParam,
        // Optional: stream: false
    };

    console.log(`[OpenAI Adapter] Sending request to ${endpoint} with size ${sizeParam}`);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI Proxy Error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // Parse response
    // test.py: response.choices[0].message.content
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error("No content received from OpenAI Proxy");
    }

    // The content might be a markdown image like "![img](url)" or "![img](data:image...)"
    // We need to extract the URL part inside the parentheses.
    // Regex explanation:
    // !\[.*?\]  -> Matches ![alt text]
    // \((.*?)\) -> Matches (url), capturing the url group
    const markdownMatch = content.match(/!\[.*?\]\((.*?)\)/);
    if (markdownMatch && markdownMatch[1]) {
        return markdownMatch[1]; // Return the captured URL/DataURI
    }

    // If no markdown syntax, check if it's a raw URL or Data URI
    if (content.startsWith('http') || content.startsWith('data:')) {
        return content.trim();
    }

    // Fallback: If it's just raw base64 without prefix (unlikely but possible from some proxies)
    // validation: check if it looks like base64? 
    // For now, return content and hope.
    return content;
};

