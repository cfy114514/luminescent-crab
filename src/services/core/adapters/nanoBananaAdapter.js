import { sleep } from '../utils/asyncUtils';

// --- NanoBanana API Adapter (Async Polling) ---

const pollTaskStatus = async (taskId, apiKey) => {
    const pollUrl = `https://api.nanobananaapi.ai/api/v1/nanobanana/record-info?taskId=${taskId}`;
    const maxAttempts = 60; // 3 minutes timeout (60 * 3s)
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(pollUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) throw new Error(`Polling Error: ${response.status}`);

            const data = await response.json();
            // Status Values: 0: GENERATING, 1: SUCCESS, 2: CREATE_FAILED, 3: GENERATE_FAILED
            const status = data.data?.status ?? data.status;

            console.log(`[NanoBanana] Polling Task ${taskId}: Status ${status}`);

            if (status === 1) {
                // SUCCESS
                return data.data?.resultImageUrl || data.resultImageUrl;
            } else if (status === 2 || status === 3) {
                // FAILED
                throw new Error(`Task Failed with Status ${status}: ${data.msg || 'Unknown Error'}`);
            }

            // Still GENERATING (0) - Wait and retry
            await sleep(3000);
            attempts++;
        } catch (error) {
            console.error("Polling Exception:", error);
            throw error;
        }
    }
    throw new Error("Task Timed Out");
};

export const generateSingleImageNanoBanana = async (referenceImages, prompt, apiKey, apiUrl, config = null) => {
    let imageUrls = [];

    // Note: 'type' parameter is NOT supported in generate-pro.
    // 'imageUrls' is the only trigger for Image-to-Image.

    if (referenceImages && referenceImages.length > 0) {
        const refImg = referenceImages[0];
        if (refImg.fullDataUrl) {
            imageUrls = [refImg.fullDataUrl];
        }
    }

    const payload = {
        prompt: prompt,
        imageUrls: imageUrls,
        resolution: "2K",       // Per spec: 1K, 2K, 4K
        aspectRatio: config?.aspect_ratio || "1:1",
        callBackUrl: "https://placeholder-callback.com" // Required field per spec description
    };

    console.log("[NanoBanana] Submitting Task (Pro):", JSON.stringify(payload, null, 2));

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok || responseData.code !== 200) {
        throw new Error(`Submission Failed: ${responseData.msg || responseData.message || JSON.stringify(responseData)}`);
    }

    const taskId = responseData.data?.taskId;
    if (!taskId) throw new Error("No Task ID returned from API");

    console.log(`[NanoBanana] Task Submitted. ID: ${taskId}`);
    return await pollTaskStatus(taskId, apiKey);
};
