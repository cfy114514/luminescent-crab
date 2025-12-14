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
const getViewPrompt = (viewType, config) => {
    // Spec Requirement: Pure White Background (to be post-processed to #F9F9F9), Studio Lighting 5500K.
    // Added "NO shadows, NO filters" to base prompt.
    const base = "White background, Studio 5500K, 8k resolution. NO dramatic shadows, NO artistic filters, NO post-processing styles.";

    // Truth Enforcing Context (Radical 'Zero Creativity' Overhaul)
    let context = `
SYSTEM ROLE: You are a Scientific Photogrammetry Engine. You are NOT an artist.
PRIME DIRECTIVE: ACCURACY > AESTHETICS.
TASK: Project the reference product texture onto a 3D manifold at the requested angle.

STRICT CONSTRAINTS (VIOLATION = FAILURE):
1. **ZERO HALLUCINATION**: If you don't see it in the reference, DO NOT RENDER IT. Leave unseen areas generic and smooth. Never invent logos, buckles, or complex stitching just to fill empty space.
2. **GEOMETRIC RIGIDITY**: Treat the object as a solid, rigid form. Do not warp, bend, or melt the silhouette to make it look "dynamic". Maintain industrial design proportions.
3. **TEXTURE CLONING**: Copy the exact weave, grain, and color from the reference. Do not apply "artistic effects" or change the material properties (e.g., don't turn cotton into silk).
4. **LIGHTING NEUTRALITY**: Use flat, even studio lighting to reveal truth. Avoid mood lighting.

CLEANUP PROTOCOL:
- REMOVE all hang tags, price tags, barcodes, and plastic security loops.
- INPAINT the removal area with the adjacent material texture.
`;

    // Inject JSON Topology if present (Parsed or Raw)
    if (config.description) {
        context += `
TOPOLOGY CONSTRAINT (JSON API):
${config.description}
INSTRUCTION: Follow this topology STRICTLY. If JSON says "No Logo", DO NOT render a logo despite what you think you see.
`;
    }

    switch (viewType) {
        case 'front':
            return `${context} 
ACTION: Generate 0-degree Front View.
VERIFICATION: Pixel-perfect match to reference. This is the GROUND TRUTH. ${base}`;

        case 'angle_front':
            return `${context} 
ACTION: Rotate object exactly 45 degrees.
CONSTRAINT: Do not distort the proportions. Keep the perspective telephoto (low distortion), not wide-angle. Maintain RIGID structural integrity. ${base}`;

        case 'back':
            return `${context} 
ACTION: Rotate object 180 degrees.
CRITICAL WARNING: The back is often blank. Do NOT invent a "Back Logo" or "Adjustable Strap" unless the JSON or Reference explicitly confirms it. When in doubt, render it SMOOTH. ${base}`;

        case 'top_overhead':
            return `${context} 
ACTION: 90-degree Flat Lay View.
CONSTRAINT: Perfect symmetry. Ensure the opening/brim is geometrically perfect (circle or oval). ${base}`;

        case 'inside':
            return `${context} 
ACTION: Inside View.
CONSTRAINT: Show construction reality. If unlined, show raw material back. Do not invent a satin lining if not present. ${base}`;

        case 'detail':
            return `${context} 
ACTION: Macro Zoom (5x).
FOCUS: Surface micro-texture only. Ignore overall shape. Focus on the weave/grain. ${base}`;

        case 'model_front':
        case 'model_angle':
        case 'model_side':
        case 'model_back':
        case 'model_lifestyle':
            const modelDesc = `${config.ethnicity || 'asian'} ${config.gender || 'female'} model`;
            const scene = config.scene ? `in a ${config.scene}` : "studio lighting";

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
    - STYLE: Minimalist.
4. LIGHTING: Soft, even lighting, 5500K. No hard shadows on face.
5. BACKGROUND: Pure White or softly blurred Light Grey (#F9F9F9).

VISIBILITY PHYSICS & REALISM PROTOCOL:
1. CONDITIONAL VISIBILITY: Product details (Tags/Logos) are NOT necessarily visible from all angles.
   - If a detail is occluded by the head curvature or angle, DO NOT RENDER IT.
   - DO NOT warp geometry to force a logo to be visible in Side/Back views.
2. NO ARTISTIC INTERPRETATION (STRICT):
   - You are a camera, not a designer. DO NOT invent details.
   - DO NOT move tags to make them visible. If they are hidden, they remain hidden.
3. GRAVITY: Brim must be PARALLEL to the ground.
4. NATURAL FIT: Hat sits naturally on the head.
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
FOCUS: Show back of head and hat's rear design.
CRITICAL DETAIL: If adjustment buckle/velcro exists, it MUST be visible and geometrically accurate. Show hair interaction naturally.`;
                    break;
                case 'model_lifestyle':
                    specificAction = `
ACTION: Lifestyle / Natural Pose.
POSE: Hand gently touching edge of brim (fingers relaxed, NOT covering details) OR Looking down/smiling.
VIBE: Relaxed, "Holiday" or "Daily Wear".
CONSTRAINT: Even in action, hat shape must NOT be distorted.`;
                    break;
            }

            return `${globalModelConstraints}
TASK: Composite the Reference Product onto a ${modelDesc}.
SCENE: ${scene}.
${specificAction}
IMPORTANT: The product appearance (texture/shape) must remain IDENTICAL to the reference. Do not wrap or warp the product unrealistically. ${base}`;

        default:
            return `${context} Projection of product. ${base}`;
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
        // Construct Gemini Payload with MULTIPLE images and LABEL TEXTS
        // We interleave text and images: [Text: "Front View"], [Image], [Text: "Back View"], [Image]

        let parts = [
            { text: prompt + " Ensure consistency with all provided reference images." }
        ];

        referenceImagesBase64.forEach(img => {
            // Add label metadata if not 'general'
            // Map internal label keys to human readable prompt text
            const labelMap = {
                'front': 'Front View (0-degree)',
                'angle_left': 'Left Front Angle View (45-degree)',
                'angle_right': 'Right Front Angle View (45-degree)',
                'side_left': 'Left Side_Profile View (90-degree)',
                'side_right': 'Right Side_Profile View (90-degree)',
                'back': 'Back View (180-degree)',
                'top_overhead': 'Top Down View (Flat Lay)',
                'inside': 'Inside/Interior View',
                'detail': 'Detail Shot',
                'general': 'Reference View'
            };

            const labelText = labelMap[img.label] || 'Reference View';

            parts.push({ text: `Reference Image [${labelText}]:` });
            parts.push({
                inline_data: { mime_type: img.mimeType, data: img.data }
            });
        });

        payload = {
            contents: [{ parts: parts }]
        };
    } else {
        // Fallback for OpenAI/Generic (First image only)
        headers['Authorization'] = `Bearer ${apiKey}`;
        payload = {
            prompt,
            init_image: referenceImagesBase64[0].fullDataUrl,
            steps: 30
        };
    }

    const response = await fetch(apiUrl, {
        method: 'POST', headers, body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`[API ERROR] Status: ${response.status}`, errText);
        throw new Error(`API Error ${response.status}: ${errText}`);
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

export const generateImages = async (imageObjects, config, onImageGenerated, onStatus) => {
    const apiKey = import.meta.env.VITE_NANOBANANA_API_KEY;
    const apiUrl = import.meta.env.VITE_NANOBANANA_API_URL ? import.meta.env.VITE_NANOBANANA_API_URL.replace('{gemini-3-pro-image-preview}', 'gemini-1.5-flash') : '';

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
        const selectedModels = modelTasks.filter(task =>
            config.modelViewSelection ? config.modelViewSelection[task.key] : true
        );
        tasks = [...tasks, ...selectedModels];
    }

    const totalTasks = tasks.length;
    let completedTasks = 0;

    // --- ProductAI 2.0 Workflow: Serial Anchor Injection ---
    const anchorTaskKey = 'front';
    const anchorTask = tasks.find(t => t.key === anchorTaskKey);
    const followUpTasks = tasks.filter(t => t.key !== anchorTaskKey);

    let generatedResults = { images: {}, payload: null };
    let anchorBase64Obj = null;

    // 2. Execute Anchor Task (Front)
    if (anchorTask) {
        updateStatus("Phase 1: Generating Anchor View (Ground Truth)...");
        try {
            const prompt = getViewPrompt(anchorTask.type, config);
            const url = await generateSingleImage(processedImages, prompt, apiKey, apiUrl);

            generatedResults.images[anchorTask.key] = { url, label: anchorTask.label };

            // Stream Update
            completedTasks++;
            if (onImageGenerated) onImageGenerated(anchorTask.key, url, completedTasks, totalTasks);

            // Convert Result URL to Base64 for Injection
            updateStatus("Processing Anchor for Injection...");
            const res = await fetch(url);
            const blob = await res.blob();
            anchorBase64Obj = await fileToBase64(blob);
            anchorBase64Obj.label = "GENERATED ANCHOR FRONT";

        } catch (err) {
            console.error("Anchor Task Failed:", err);
            updateStatus("Anchor Generation Failed. Proceeding with raw references...");
        }
    }

    // 3. Inject Anchor into Context
    let currentContextImages = [...processedImages];
    if (anchorBase64Obj) {
        currentContextImages.push(anchorBase64Obj);
        updateStatus("Anchor Injected. Starting Parallel Ensuing...");
    }

    // 4. Execute Follow-up Tasks (Parallel but Staggered)
    if (followUpTasks.length > 0) {
        updateStatus(`Phase 2: Generating ${followUpTasks.length} Variations...`);

        // Use map then Promise.all, but inject a DELAY based on index
        const results = await Promise.all(followUpTasks.map(async (task, index) => {
            // ARTIFICIAL STAGGER: Wait 1.5s * index to force sequential-ish feeling
            // This prevents "Boom, all done" and ensures users see them pop in 1 by 1
            await delay(index * 1500);

            try {
                const prompt = getViewPrompt(task.type, config);
                const url = await generateSingleImage(currentContextImages, prompt, apiKey, apiUrl);

                // Stream Update
                completedTasks++;
                if (onImageGenerated) onImageGenerated(task.key, url, completedTasks, totalTasks);

                return { key: task.key, data: { url, label: task.label } };
            } catch (err) {
                console.error(`Task ${task.key} failed:`, err);
                return { key: task.key, error: err.message };
            }
        }));

        results.forEach(res => {
            if (!res.error) {
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
  "_thinking_trace": "string (Step-by-step reasoning. CRITICAL: Explicitly verify if a 'Band' or 'Eyelets' actually exist. Do not assume. Many hats have NO band. If just a crease, say so.)",
  "reference_image_manifest": [
      { 
        "image_label": "string", 
        "description": "string",
        "contains_asymmetry": "boolean"
      }
  ],
  "global_consistency": {
      "material_name": "string",
      "texture_description": "string",
      "consistency_rule": "The described material MUST be applied uniformly. Ignore lighting variations."
  },
  "feature_side": "left" | "right" | "symmetrical" | "unknown",
  "design_dna": {
     "material_origin": "string",
     "weave_pattern": "string",
     "color_palette": "string"
  },
  "geometry_profile": {
     "crown_shape": "string",
     "brim_behavior": "string",
     "volumetric_feel": "string"
  },
  "components": {
     "band_specs": "string (Start with 'None' if no distinct band exists. Do NOT describe shadows as bands.)",
     "hardware_list": ["string"],
     "decoration_logic": "string"
  },
  "spatial_topology": {
      "logo_position": "string",
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
1. **NO GENERIC COMPONENTS**: Do not list "Leather Band" or "Eyelets" unless you clearly see them. If the hat is a simple straw mold, say "No Band", "No Eyelets".
2. **Material Truth**: You must define a SINGLE "Global Material" based on the highest quality image provided.
3. **Back View Enforcer**: If a "Back View" image is provided, you MUST extract its features into "back_view_details".
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
