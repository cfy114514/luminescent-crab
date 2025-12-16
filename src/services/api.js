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
// === Prompt Engineering for Views ===
const getViewPrompt = (viewType, config, availableLabels = [], taskKey = '') => {
    // ... (rest of function) ...
    // Spec Requirement: Pure White Background (to be post-processed to #F9F9F9), Studio Lighting 5500K.
    // Added "NO shadows, NO filters" to base prompt.
    const base = `
STRICT PROTOCOL (ZERO CREATIVITY):
1. **TEXTURE PROJECTION ONLY**: You are a texture projection engine, NOT a creative artist. Your goal is to map the Reference Product's EXACT texture and details onto a 3D volume.
2. **GEOMETRY LOCK**: Do NOT change the shape of the product. If the reference is a flat brim, generate a flat brim. If curved, generate curved.
3. **NO HALLUCINATION**: Do not add "cute details" like bows, knots, stickers, or tags if they do not exist in the reference.
4. **MATERIAL TRUTH**: The weave/fabric must be IDENTICAL to the reference.
5. **CLEAN BACKGROUND**: Pure White Hex #FFFFFF. No shadows or props unless specified.
6. **No Text/Watermarks**: Do not render text overlaps.
7. **NEGATIVE PROMPT**: (drawing, painting, illustration, 3d render, sketch, low quality), hanging tag, price label, security tag, plastic loop, extra bow, extra knot, hallucinated seam.
`;

    // Truth Enforcing Context (User Defined Strict Mode)
    let context = `
SYSTEM ROLE: High-Fidelity Product Cutout & Display Engine.
TASK: Show the product on a pure white background as an isolated object.

STRICT PROTOCOL (USER DEFINED):
1. **RESTORE ALL SHOOTING DETAILS**: You must faithfully render the texture, weave, and imperfections. CRITICAL: Analyze the specific Reference Images and their assigned LABELS (e.g., 'Detail', 'Side') to understand exactly which feature corresponds to which view.
2. **NO INVENTION**: Do not invent details out of thin air (不能凭空添加细节).
3. **NO BEAUTIFICATION**: Do not beautify the product (不能美化产品). Show it as it is.
4. **ALLOWED EDIT**: You may ONLY smooth wrinkles (只能抚平褶皱) and remove packaging/tags. Do not alter structural geometry.
5. **CLEANUP PROTOCOL**: Remove all Hang Tags, Price Labels, Security Sensors is MANDATORY. The product must look like a clean studio sample (必须移除所有吊牌和标签).
6. **MATERIAL TRUTH**: Do not use wrong color blocks or materials (不能使用错误的色块及材质).
7. **NO IMAGINATION**: Do not generate non-existent things (不能使用想象生成不存在的东西).
8. **SOURCE TRUTH**: ONLY use elements present in the image (只能使用图中有的元素).
9. **LOGO CONSISTENCY**: For products with logos, maintain Uniform Logo Size and Position relative to the product body across all generated views (保持Logo大小及位置统一).
`;

    // Inject JSON Topology if present (Parsed or Raw)
    if (config.description) {
        context += `
TOPOLOGY CONSTRAINT (JSON API):
${config.description}
INSTRUCTION: Follow this topology STRICTLY.
`;
    }

    // Inject Color Enforcement Protocol (Modular)
    if (config.targetColor) {
        context += `
COLOR ENFORCEMENT PROTOCOL (OVERRIDE):
- TARGET COLOR: ${config.targetColor}
- ACTION: Recolor the base material of the product to match the Target Color EXACTLY.
- CONSTRAINT: PRESERVE TEXTURE. Do not paint flat color. You must map the Target Color onto the existing weave/grain/surface topology.
- SCOPE: Only the main product material. Do not recolor skin, background, or neutral hardware unless specified.
`;
    }

    let prompt = "";
    switch (viewType) {
        case 'front':
            prompt = `${context} 
ACTION: Generate 0-degree Front View.
VERIFICATION: Pixel-perfect match to reference. This is the GROUND TRUTH. ${base}`;
            break;

        case 'angle_front':
            prompt = `${context} 
ACTION: Rotate object exactly 45 degrees.
CONSTRAINT: Do not distort the proportions. Keep the perspective telephoto (low distortion), not wide-angle. Maintain RIGID structural integrity. ${base}`;
            break;

        case 'back':
            const hasBackRef = availableLabels.some(l => l.includes('back'));
            const backInstruction = hasBackRef ?
                "REFERENCE AVAILABLE: Use the provided 'Back View' image as primary source." :
                "MISSING BACK REFERENCE: Infer the back form from the 'Front View' silhouette. CRITICAL: Render the surface SMOOTH and PLAIN. Do NOT invent a Back Logo, Adjustable Strap, or Buckle unless explicitly seen in other views.";

            prompt = `${context} 
ACTION: Rotate object 180 degrees.
LOGIC: ${backInstruction}
CRITICAL WARNING: The back is often blank. When in doubt, render it SMOOTH. ${base}`;
            break;

        case 'top_overhead':
            const hasTopRef = availableLabels.some(l => l.includes('top'));
            const topInstruction = hasTopRef ?
                "REFERENCE AVAILABLE: Use the provided 'Top View' image." :
                "MISSING TOP REFERENCE: Infer the top geometry from the 'Front' and 'Side' brims. Assume standard symmetrical circle/oval shape.";

            prompt = `${context} 
ACTION: 90-degree Flat Lay View.
LOGIC: ${topInstruction}
ORIENTATION: The FRONT of the product must face the BOTTOM of the frame (6 o'clock).
CONSTRAINT: Perfect symmetry. Ensure the opening/brim is geometrically perfect (circle or oval). ${base}`;
            break;

        case 'inside':
            const hasInsideRef = availableLabels.some(l => l.includes('inside'));
            const insideInstruction = hasInsideRef ?
                "REFERENCE AVAILABLE: COPY the Reference Image's interior EXACTLY (Pattern/Tag)." :
                "MISSING INSIDE REFERENCE: Render a GENERIC PLAIN interior. Match the color to the outer material or standard black/beige. Do NOT invent a lining pattern or brand tag.";

            prompt = `${context} 
ACTION: Inside View.
LOGIC: ${insideInstruction}
CONSTRAINT: 
- If reference is available, copy it. 
- If missing, keep it minimal and realistic.
- Do not invent a generic satin lining if the reference is unlined or different.`;
            break;

        case 'detail':
            const hasDetailRef = availableLabels.some(l => l.includes('detail'));
            const detailInstruction = hasDetailRef ?
                "REFERENCE AVAILABLE: Use the provided 'Detail View' zoom-in as ground truth." :
                "MISSING DETAIL REFERENCE: Use the highest resolution 'Front' or 'General' view. Do NOT invent micro-textures. If you can't see the weave, render smooth material.";

            prompt = `${context} 
ACTION: Extreme Macro Textural Shot (Micro-Photography).
LOGIC: ${detailInstruction}
CAMERA: 100mm Macro Lens. Aperture f/8. Focus distance 10cm.
CONSTRAINT: 
- SINGLE FOCUS PRINCIPLE: IMPOSSIBLE to see the whole hat. Show ONLY a 5cm x 5cm patch of fabric.
- MAGNIFICATION: Extreme Close-up. I want to see the thread weave.
- NO LOGOS/BRANDING: Do NOT show the logo. This is a material sample shot. Showing the logo will ruin the texture focus.
- TEXTURE MATCH: The weave/grain must be identical to the zoom-in of the reference.`;
            break;

        case 'model_front':
        case 'model_angle':
        case 'model_side':
        case 'model_back':
        case 'model_lifestyle':
            // Logic for Model / Wardrobe / Hair / Scene
            const hairLogic = config.hairColor ? `, hair color: ${config.hairColor}` : "";
            const modelDesc = `${config.ethnicity || 'asian'} ${config.gender || 'female'} model${hairLogic}`;

            const scene = config.scene ? `in a ${config.scene}` : "Pure White Background";
            const wardrobeStyle = config.clothing ? config.clothing : "Match the product's style (Minimalist/Neutral).";

            // Model View Fallback Logic (Restored)
            let modelFallback = "";
            if (viewType === 'model_back' && !availableLabels.some(l => l.includes('back'))) {
                modelFallback = "MISSING BACK REFERENCE: Render the product back as PLAIN/SMOOTH. Do not invent details.";
            }

            // Global Constraints (Wardrobe, Composition, Subject Priority)
            const globalModelConstraints = `
SYSTEM ROLE: Commercial Fashion Compositor & Virtual Stylist.
GLOBAL MODEL CONSTRAINTS (ALL VIEWS):
1. SUBJECT PRIORITY: The hat MUST occupy 50% of the visual weight. The model is the canvas; the hat is the HERO.
2. COMPOSITION: Head-and-Shoulders or Half-Body crop ONLY. Fixed distance (1.3m).
3. WARDROBE PROTOCOL (STRICT):
    - NO patterns, prints, or logos on clothing.
    - FABRIC: Linen, Cotton, or simple Knitwear.
    - COLORS: Neutral, Light tones (White, Beige, Light Grey) ONLY. Dark/Neon forbidden.
    - STYLE: ${wardrobeStyle}
4. LIGHTING: Soft, even lighting, 5500K. No hard shadows on face.
5. BACKGROUND: ${scene}.
${modelFallback}
`;

            let specificAction = "";
            switch (viewType) {
                case 'model_front':
                    specificAction = `
ACTION: Portrait Frontal View (0°).
POSE: Faces camera directly. Direct eye contact.
FOCUS: Hat perfectly centered. Show brim width and crown height clearly.`;
                    break;
                case 'model_angle':
                    specificAction = `
ACTION: Angled Front View (45°).
POSE: Head turned slightly to side.
FOCUS: Showcase volumetric structure of brim and crown curvature.`;
                    break;
                case 'model_side':
                    specificAction = `
ACTION: Side Profile View (90°).
POSE: Looking straight ahead (off-camera).
FOCUS: Sharp profile. Highlight brim silhouette (flat or curved). Edge lines must be razor sharp.`;
                    break;
                case 'model_back':
                    specificAction = `
ACTION: Rear View (180°).
POSE: Back to camera.
FOCUS: Rear details of the hat.`;
                    break;
                case 'model_lifestyle':
                    let variation = "Primary Pose (Focus on Fit)";
                    if (taskKey && taskKey.includes('2')) {
                        variation = "Secondary Variation (Focus on Interaction/Context). USE A DIFFERENT POSE from the primary one.";
                    }

                    specificAction = `
ACTION: Lifestyle / Editorial Shot.
VARIATION MODE: ${variation}
POSE VARIATIONS (Select One Unique to this Variation):
  - Hand Touching Brim (手扶帽檐): Natural interaction.
  - Looking Down & Smiling (低头微笑): Candid, soft expression.
  - Looking Back (回头侧望): Over the shoulder view.
  - Sitting Pose (坐姿造型): Relaxed posture.
LIGHTING: Soft, even, diffused lighting (均匀柔光). No harsh shadows.
FLOW: Posture and eye contact must be natural and fluid.
FOCUS: Highlight the brim lines (突出帽檐线条) and the fit in different wearing states (不同佩戴状态的效果).`;
                    break;
            }

            prompt = `${globalModelConstraints}
TASK: Composite the Reference Product onto a ${modelDesc}.
SCENE: ${scene}.
${specificAction}
IMPORTANT: The product appearance (texture/shape) must remain IDENTICAL to the reference. Do not wrap or warp the product unrealistically. ${base}`;
            break;

        default:
            prompt = `${context} Projection of product. ${base}`;
            break;
    }

    // Append Manual Override if present (Highest Priority)
    if (config.customPrompt) {
        prompt += `
USER OVERRIDE INSTRUCTION: ${config.customPrompt}`;
    }

    return prompt;
};

// --- NanoBanana API Adapter (Async Polling) ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

const generateSingleImageNanoBanana = async (referenceImages, prompt, apiKey, apiUrl) => {
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
        aspectRatio: "1:1",     // Per spec: 1:1, 3:4, 4:3, etc.
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

// --- Google Gemini API Adapter (Sync Call) ---
const generateSingleImageGemini = async (referenceImages, prompt, apiKey, apiUrl, img2imgInput = null) => {

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
    const parts = [
        { text: prompt },
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
            temperature: 0.4,
            topK: 40,
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

// --- Main Dispatcher ---
const generateSingleImage = async (referenceImages, prompt, apiKey, apiUrl, img2imgInput = null) => {
    // Determine provider based on URL or Config
    if (apiUrl.includes("nanobanana")) {
        return await generateSingleImageNanoBanana(referenceImages, prompt, apiKey, apiUrl); // Note: NanoBanana adapter not updated, assuming direct usage
    } else {
        return await generateSingleImageGemini(referenceImages, prompt, apiKey, apiUrl, img2imgInput);
    }
};

export const generateImages = async (imageObjects, config, onImageGenerated, onStatus) => {
    const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;

    // Dynamic URL Construction based on Config Model
    let apiUrl = import.meta.env.VITE_NANOBANANA_API_URL || '';
    if (config.model) {
        // Regex to replace any existing model name "gemini-..." inside the URL
        apiUrl = apiUrl.replace(/models\/[a-zA-Z0-9-.]+:/, `models/${config.model}:`);
    } else {
        // Fallback default logic if not specified
        apiUrl = apiUrl.replace('{gemini-3-pro-image-preview}', 'gemini-2.5-flash-image');
    }

    console.log(`[API] Using Model: ${config.model || 'Default'} -> URL: ${apiUrl}`);

    const updateStatus = (msg) => {
        if (onStatus) onStatus(msg);
        console.log(`[Status] ${msg}`);
    };

    updateStatus("Processing Reference Images...");

    // Helper to process internal/external keys
    const processImg = async (imgObj) => {
        const file = imgObj.file ? imgObj.file : imgObj;
        const label = imgObj.label || 'general';
        const base64Info = await fileToBase64(file);
        return { ...base64Info, label };
    };

    // 0. PRE-FLIGHT AI ANALYSIS
    // Automatically extract feature map to guide the generator.
    let smartConfig = { ...config };
    try {
        updateStatus("🤖 AI Agent: Analyzing Product Features & Layout...");
        const analysisJson = await analyzeImages(imageObjects);
        console.log("[Auto-Analysis] Result:", analysisJson);
        smartConfig.description = analysisJson; // Inject into context
    } catch (err) {
        console.error("Auto-analysis failed, proceeding without context:", err);
        updateStatus("⚠️ Analysis Failed. Proceeding with raw generation...");
    }

    // 1. Process Initial Images
    let processedImages = await Promise.all(imageObjects.map(processImg));

    // Define Tasks
    const specTasks = [
        { key: 'front', label: '正面视图 (0°)', type: 'front' },
        { key: 'angle_front', label: '斜侧视图 (Smart 45°)', type: 'angle_front' },
        { key: 'back', label: '背面视图 (180°)', type: 'back' },
        { key: 'top', label: '顶部俯视 (Flat Lay)', type: 'top_overhead' },
        { key: 'inside', label: '内部细节 (Inside)', type: 'inside' },
        { key: 'detail', label: '纹理特写 (Detail)', type: 'detail' }
    ];

    // Updated Model Tasks based on new SOP
    const modelTasks = [
        { key: 'model_front', label: '模特展示-正面 (Front)', type: 'model_front' },
        { key: 'model_angle', label: '模特展示-斜侧 (Angle)', type: 'model_angle' },
        { key: 'model_side', label: '模特展示-侧面 (Side)', type: 'model_side' },
        { key: 'model_back', label: '模特展示-背面 (Back)', type: 'model_back' },
        { key: 'model_lifestyle', label: '模特展示-生活 (Lifestyle)', type: 'model_lifestyle' }
    ];

    // Build Task List
    let tasks = [];
    if (config.includeProductViews) {
        // BUG FIX: Use 'task.key' (e.g. 'top') to check config, NOT 'task.type' (e.g. 'top_overhead')
        // App.jsx keys: front, angle_front, back, top, inside, detail
        const selectedSpecs = specTasks.filter(task => config.viewSelection ? config.viewSelection[task.key] : true);
        tasks = [...tasks, ...selectedSpecs];
    }

    // If Model View is enabled, add selected model sub-tasks
    if (config.includeModelView) {
        // Feature: Lifestyle Double Shot. If 'model_lifestyle' is selected, generate 2 variations.
        const modelSelection = config.modelViewSelection || {};

        modelTasks.forEach(task => {
            if (modelSelection[task.key] || !config.modelViewSelection) {
                if (task.key === 'model_lifestyle') {
                    // Inject 2 distinct tasks for Lifestyle
                    tasks.push({ key: 'model_lifestyle_1', label: '生活 (Lifestyle A)', type: 'model_lifestyle' });
                    tasks.push({ key: 'model_lifestyle_2', label: '生活 (Lifestyle B)', type: 'model_lifestyle' });
                } else {
                    tasks.push(task);
                }
            }
        });
    }

    // --- ProductAI 2.0 Workflow: Optimized Concurrency ---

    // Concurrency Helper
    const runWithConcurrency = async (items, limit, fn) => {
        const results = [];
        const executing = [];
        for (const item of items) {
            const p = fn(item).then(res => results.push(res));
            executing.push(p);
            if (executing.length >= limit) {
                await Promise.race(executing);
            }
            // Clean up finished promises
            /* Note: simplistic implementation, for this scale (~10 items) pure Promise.race loop is imperfect but sufficient or use a proper pool logic. 
               Actually, simpler approach for stability: */
        }
        await Promise.all(executing);
        return results;
    };

    // Better Async Pool Implementation
    const asyncPool = async (poolLimit, iterable, iteratorFn) => {
        const ret = [];
        const executing = [];
        for (const item of iterable) {
            const p = Promise.resolve().then(() => iteratorFn(item, iterable));
            ret.push(p);
            if (poolLimit <= iterable.length) {
                const e = p.then(() => executing.splice(executing.indexOf(e), 1));
                executing.push(e);
                if (executing.length >= poolLimit) {
                    await Promise.race(executing);
                }
            }
        }
        return Promise.all(ret);
    };

    const totalTasks = tasks.length;
    let completedTasks = 0;
    let generatedResults = { images: {}, payload: null };

    if (totalTasks > 0) {
        // Boosted Concurrency: 4 parallel requests (balance between speed and rate limits)
        const CONCURRENCY_LIMIT = 4;
        updateStatus(`Starting Accelerated Generation (${CONCURRENCY_LIMIT}x Parallel)...`);

        const results = await asyncPool(CONCURRENCY_LIMIT, tasks, async (task) => {
            try {
                // Determine Concurrency Slot/Start time (for logging)
                // Small stagger to prevent exact millisecond collision (100ms)
                await delay(Math.random() * 200);

                // Feature: Smart Fallback. Pass available labels to Prompt Engine.
                const availableLabels = processedImages.map(img => img.label);

                let attempt = 0;
                const maxRetries = 2;
                // Use smartConfig (with auto-analysis) instead of base config
                let currentPrompt = getViewPrompt(task.type, smartConfig, availableLabels, task.key);
                let finalUrl = "";
                let finalAssessment = null;
                let passed = false;

                let img2imgInput = null;

                // --- RETRY LOOP ---
                while (attempt <= maxRetries && !passed) {
                    if (attempt > 0) updateStatus(`Task ${task.label}: Retrying (Attempt ${attempt + 1})...`);

                    // 1. Generate 
                    const url = await generateSingleImage(processedImages, currentPrompt, apiKey, apiUrl, img2imgInput);
                    finalUrl = url;

                    // 2. Assess
                    const isSupervisorOn = smartConfig.supervisorEnabled !== false;

                    if (url) {
                        try {
                            if (!isSupervisorOn) {
                                // Manual Override
                                console.log(`[Loop] Supervisor Disabled. Skipping QC for ${task.key}.`);
                                passed = true;
                                finalAssessment = {
                                    score: 10,
                                    reason: "Supervisor Disabled by User",
                                    retry_suggestion: "",
                                    error_type: "NONE"
                                };
                            } else {
                                const assessment = await assessImageQuality(url, currentPrompt, processedImages, apiKey, apiUrl, task.label);
                                finalAssessment = assessment;

                                if (assessment.score >= 8) {
                                    passed = true;
                                    console.log(`[Loop] Task ${task.key} PASSED with Score ${assessment.score}`);
                                } else {
                                    console.warn(`[Loop] Task ${task.key} FAILED QC (Score ${assessment.score}). Reason: ${assessment.reason}`);

                                    // PRESERVE FAILED RESULT:
                                    const failKey = `${task.key}_fail_${attempt + 1}`;
                                    const failedResult = {
                                        url: finalUrl,
                                        label: `${task.label} (Fail #${attempt + 1})`,
                                        qc: assessment
                                    };

                                    // Stream immediately
                                    if (onImageGenerated) onImageGenerated(failKey, failedResult, completedTasks, totalTasks);
                                    generatedResults.images[failKey] = failedResult;

                                    // Prepare for next retry
                                    if (attempt < maxRetries) {
                                        if (assessment.error_type === "DETAIL") {
                                            img2imgInput = finalUrl;
                                            currentPrompt += `\n\nPREVIOUS ATTEMPT (ATTACHED) HAD GOOD GEOMETRY BUT DETAIL ERRORS. FIX: ${assessment.retry_suggestion}. KEEP THE POSE, FIX THE DETAILS!`;
                                            console.log(`[Loop] Smart Retry: Using Img2Img for Detail Fix.`);
                                        } else {
                                            img2imgInput = null;
                                            currentPrompt += `\n\nPREVIOUS ATTEMPT FAILED (BAD GEOMETRY). CRITICISM: ${assessment.reason}. RESTART AND FIX: ${assessment.retry_suggestion}.`;
                                            console.log(`[Loop] Smart Retry: Full Clean Regen.`);
                                        }
                                    }
                                }
                            }
                        } catch (qcError) {
                            console.error(`[Loop] QC Crashed, treating as PASS to avoid stalling.`, qcError);
                            passed = true; // Fail open
                        }
                    }

                    if (!passed) attempt++;
                }
                // ------------------

                // Stream Update
                completedTasks++;

                const resultData = {
                    url: finalUrl,
                    label: task.label,
                    qc: finalAssessment
                };

                if (onImageGenerated) onImageGenerated(task.key, resultData, completedTasks, totalTasks);

                return {
                    key: task.key,
                    data: resultData
                };
            } catch (err) {
                console.error(`Task ${task.key} failed:`, err);
                return { key: task.key, error: err.message };
            }
        });

        results.forEach(res => {
            if (res && !res.error) {
                generatedResults.images[res.key] = res.data;
            }
        });
    }

    updateStatus("All Tasks Completed.");
    return generatedResults;
};

/**
 * Analyze Reference Images to extract physical constraints.
 * @param {Array} imageObjects 
 * @returns {Promise<string>} Analysis text
 */
export const analyzeImages = async (imageObjects) => {
    const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;
    // Upgrade to Gemini 2.0 Flash Exp for better vision capabilities (User requested > 2.5mini level)
    const apiUrl = import.meta.env.VITE_NANOBANANA_API_URL
        ? import.meta.env.VITE_NANOBANANA_API_URL.replace('gemini-3-pro-image-preview', 'gemini-2.0-flash-exp')
        : '';

    if (!apiKey || !apiUrl) throw new Error("Missing API Key");

    // Process images with labels
    const processedImages = await Promise.all(imageObjects.map(async (imgObj) => {
        const file = imgObj.file ? imgObj.file : imgObj;
        const label = imgObj.label || 'Unknown View';
        const base64Info = await fileToBase64(file);
        return {
            ...base64Info,
            label
        };
    }));

    const systemPrompt = `
You are a Lead Product Researcher with a cynical, fact-based approach.
Analyze the reference images and output a **Strict JSON Topology Report**.
Do NOT output markdown code blocks. Output RAW JSON only.

REQUIRED JSON STRUCTURE:
{
  "_thinking_trace": "string (Identify ALL non-product elements first. e.g. 'Found Hang Tag on left', 'Found Price Label'. THESE MUST BE EXCLUDED from the component list.)",
  "reference_image_manifest": [
      { 
        "image_label": "string", 
        "description": "string",
        "contains_asymmetry": "boolean"
      }
  ],
  "global_consistency": {
      "primary_material": "string (Identify the core fabric/material. e.g. 'Straw', 'Canvas', 'Wool Felt')",
      "primary_color_unified": "string (The TRUE color code/name cross-referenced from all images. Ignore bad lighting. e.g. 'Navy Blue #000080')",
      "texture_surface": "string (e.g. 'Rough woven texture', 'Smooth matte finish', 'Shiny plastic')",
      "consistency_rule": "Apply this SINGLE material definitions to the entire product. Do not mix textures unless specified."
  },
  "component_breakdown": {
      "main_body_material": "string",
      "brim_material": "string",
      "accent_elements": [
          { "part_name": "string", "material": "string", "color": "string" }
      ]
  },
  "element_layout_map": {
      "front_view_components": ["string (e.g. 'Logo at Viewer Left', 'Vent Hole at Top')"],
      "back_view_components": ["string (e.g. 'Strap at Center', 'Buckle on Right')"],
      "side_profile_features": ["string"]
  },
  "spatial_topology": {
      "logo_position_viewer_context": "string (CRITICAL: 'Viewer Left' or 'Viewer Right'. If Reference has Logo on Left, Top View MUST show it on Left relative to center.)",
      "asymmetry_notes": "string",
      "side_visibility_check": "string"
  },
  "view_specific_features": {
      "back_view_details": "string",
      "inside_view_details": "string",
      "top_view_details": "string"
  }
}

CRITICAL ANTI-HALLUCINATION RULES:
1. **IGNORE NON-PRODUCT ELEMENTS**: Do NOT list "Hang Tags", "Price Labels", "Security Sensors", "Plastic Loops", or "Packaging" as components. They are trash. Ignore them.
2. **Material Truth**: You must define a SINGLE "Global Material".
3. **Back View Enforcer**: If a "Back View" image is provided, you MUST extract its features into "back_view_details".
4. **Viewer Context & Top View**: 
   - **Relative Logic**: In Top View (Flat Lay), the Logo Position must physically align with the Front View. 
   - If Front View = Logo on Left, then Top View = Logo on Left.
   - Do NOT flip or mirror features associated with specific sides.
5. **LABEL AUTHORITY**: Trust the provided image labels (e.g. "Front View", "Side View") implicitly.
   - If an image is labeled "Front View", you MUST treat it as the Front, even if it looks like a side profile.
   - **User Input > AI Inference**.
`.trim();

    // Construct Payload with Interleaved Labels
    let parts = [{ text: systemPrompt }];
    processedImages.forEach(img => {
        parts.push({ text: `Reference Image [${img.label}]:` });
        parts.push({
            inline_data: { mime_type: img.mimeType, data: img.data }
        });
    });

    const isGoogle = apiUrl.includes('googleapis.com');
    const endpoint = isGoogle && !apiUrl.includes("key=") ? `${apiUrl}?key=${apiKey}` : apiUrl;

    const payload = {
        contents: [{ parts: parts }]
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Analysis Failed: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Analysis failed to produce text.";

    return resultText.trim();
};

/**
 * AI Supervisor: Assess Image Quality & Compliance
 * Uses Gemini 2.0 Flash to score the image (0-10) and check for specific defects.
 * Now includes View-Specific Logic (e.g., Back View must not show Front Logo).
 * NOW SUPPORTS MULTI-REFERENCE (Array).
 */
const assessImageQuality = async (generatedImageUrl, originalPrompt, referenceImageObjList, apiKey, apiUrl, viewName = "General") => {
    // Ensure we use Gemini 2.0 Flash for vision capabilities
    let reviewApiUrl = "";

    if (apiUrl && apiUrl.includes("googleapis.com")) {
        // User requested strict adherence to "gemini-2.5-flash"
        reviewApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    } else if (import.meta.env.VITE_NANOBANANA_API_URL && import.meta.env.VITE_NANOBANANA_API_URL.includes("gemini")) {
        // Update Proxy URL to target 2.5 Flash
        reviewApiUrl = import.meta.env.VITE_NANOBANANA_API_URL.replace(/gemini-[\w.-]+-exp/, 'gemini-2.5-flash').replace('gemini-3-pro-image-preview', 'gemini-2.5-flash');
    } else {
        reviewApiUrl = apiUrl;
    }

    if (!reviewApiUrl) {
        console.warn("[Supervisor] No Review API URL found. Skipping QC.");
        return { score: 10, reason: "Skipped (No API)", retry_suggestion: "", error_type: "NONE" };
    }

    console.log(`[Supervisor] Review URL: ${reviewApiUrl} [v2.5 Flash]`);

    if (!reviewApiUrl.includes("key=") && apiKey) {
        reviewApiUrl += `?key=${apiKey}`;
    }

    // 1. Get Generated Image Base64
    let generatedBase64 = "";
    try {
        if (generatedImageUrl.startsWith("data:")) {
            generatedBase64 = generatedImageUrl.split(',')[1];
        } else {
            const resp = await fetch(generatedImageUrl);
            const blob = await resp.blob();
            generatedBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(blob);
            });
        }
    } catch (e) {
        console.error("[Supervisor] Failed to download generated image for review:", e);
        return { score: 5, reason: "Fetch Error", retry_suggestion: "", error_type: "NONE" };
    }

    // 2. Prepare Reference Images (Support Array or Single)
    const refList = Array.isArray(referenceImageObjList) ? referenceImageObjList : [referenceImageObjList];
    const refParts = [];

    for (const [index, refObj] of refList.entries()) {
        let refMime = "";
        let refB64 = "";
        try {
            if (refObj.data && refObj.mimeType) {
                refB64 = refObj.data;
                refMime = refObj.mimeType;
            } else {
                const fileToRead = refObj.file instanceof Blob ? refObj.file : (refObj instanceof Blob ? refObj : null);
                if (fileToRead) {
                    const base64Info = await fileToBase64(fileToRead);
                    refB64 = base64Info.data;
                    refMime = base64Info.mimeType;
                }
            }
        } catch (e) { continue; }

        if (refB64) {
            refParts.push({ text: `REFERENCE IMAGE ${index + 1} (${refObj.label || 'Unknown Ref'}):` });
            refParts.push({ inline_data: { mime_type: refMime, data: refB64 } });
        }
    }

    const promptText = `
SYSTEM ROLE: Senior Product Quality Control Specialist (AI Supervisor).
TASK: Evaluate the "Candidate Image" against the provided "Reference Images" given the REQUIRED VIEW: **${viewName.toUpperCase()}**.
CONTEXT: The User demands PIXEL-PERFECT FIDELITY. The AI Generator is prone to "Hallucinating" logos or mirroring them. You must catch this.

STRICT "VIEWER-PERSPECTIVE" RULES:
- "LEFT" always means "LEFT SIDE OF THE IMAGE" (Viewer's Left).
- "RIGHT" always means "RIGHT SIDE OF THE IMAGE" (Viewer's Right).
- Do not use "Stage Left" or "Wearer's Left". Stick to visual 2D coordinates.

STRICT ANALYSIS STEPS:
1. **REFERENCE TRUTH CHECK**: 
   - Look at the Reference. Does it have a Logo? If YES, where is it? (e.g., "Viewer's Left").
   - Does the Candidate have the SAME Logo in the SAME Visual Position?
   - **CRITICAL**: If the Reference has NO Logo, the Candidate MUST HAVE NO LOGO. Any added logo is an automatic FAIL.
   - **CRITICAL**: If the Reference has a Toggle/Knot at the back, the Candidate MUST have it. If Reference is smooth, Candidate must be smooth.

2. **TOP VIEW ORIENTATION CHECK (FLAT LAY)**:
   - **Relative Mapping**: Imagine the hat resting on its brim.
   - Front (Bottom of Frame) corresponds to Front View.
   - If Front View has Logo on LEFT, Top View MUST have Logo on LEFT relative to the center.
   - **Fail Condition**: If Top View shows Logo on Right (mirrored), it is WRONG -> FAIL.

3. **CLEANUP / TAG ENFORCEMENT**:
   - **TRASH DETECTION**: Does the Candidate show "Hang Tags", "Price Labels", "Plastic Loops", or "Security Tags"?
   - **YES -> FAIL IMMEDIATE** (Score < 5). The User hates tags. 
   - **NO (Clean)** -> PASS. (Removing tags is Desired Behavior).

4. **HALLUCINATION DETECTOR**:
   - Did the generator add a "Brand Tag", "Sticker", or "Extra Seam" that is NOT in the reference? -> FAIL.
   - Did the generator change the Shape (e.g., made a flat brim curved)? -> FAIL.

SCORING CRITERIA:
- **10/10**: Perfect Match. Texture projected exactly. No extra elements. No Tags. Logo correct side.
- **8/9**: Minor lighting shift. All geometry/logos correct. No Tags.
- **5-7**: Good geometry, but Logo is mirrored/missing OR **VISIBLE TAGS REMAIN**. -> **FAIL** (Score < 8 triggers retry).
- **1-4**: Completely wrong view, wrong shape, massive hallucination, or wrong logo side.

OUTPUT JSON FORMAT (Raw JSON only):
{
  "score": number (0-10),
  "reason": "string (Concise failure reason, e.g. 'visible hang tag', 'Logo mirrored to Right', 'Added non-existent feature')",
  "retry_suggestion": "string (Actionable fix, e.g. 'REMOVE HANG TAG', 'MOVE LOGO TO VIEWER LEFT', 'REMOVE HALLUCINATED KNOT')",
  "error_type": "GEOMETRY" | "TEXTURE" | "LOGO" | "TAGS" | "NONE"
}
`;

    const payload = {
        contents: [{
            parts: [
                { text: promptText },
                { text: "REFERENCE IMAGES (GROUND TRUTH):" },
                ...refParts,
                { text: "CANDIDATE IMAGE (TO EVALUATE):" },
                { inline_data: { mime_type: "image/jpeg", data: generatedBase64 } }
            ]
        }],
        generationConfig: { response_mime_type: "application/json" }
    };

    try {
        const response = await fetch(reviewApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("No JSON returned from Supervisor");

        console.log(`[Supervisor] Assessment: `, text);
        return JSON.parse(text);
    } catch (e) {
        console.error("[Supervisor] Analysis Failed", e);
        // Expose error message to UI for debugging
        return { score: 10, reason: `Supervisor Error (Bypassed): ${e.message}`, retry_suggestion: "", error_type: "NONE" };
    }
};
