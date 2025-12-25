// === Prompt Engineering for Views ===
// --- TIER 0: ROOT INTEGRITY ---
import { SYSTEM_IDENTITY, STRICT_PROTOCOL_BASE, CONTEXT_RULES, getGenderNegative, MODEL_NEGATIVE_BASE, BASE_NEGATIVE_STRING, PRODUCT_NEGATIVE_IN_BASE } from './tree/00_root_integrity';

// --- TIER 1A: PRODUCT BRANCH ---
import { PRODUCT_GEOMETRY_LOCK } from './tree/10_product/geometry';
import { PRODUCT_RENDERING_STYLE } from './tree/10_product/rendering';

// --- TIER 1B: MODEL BRANCH ---
import { MODEL_TASK_HEADER, ORIENTATION_LOCK_PRIORITY_1, SECONDARY_HAT_CONSTRAINTS } from './tree/11_model/0_geometry_locks';
import { ANATOMICAL_IMMERSION } from './tree/11_model/0_anatomy';
import { COMPOSITION_REQUIREMENT, FRAMING_PRIORITY_2, TEMPLATE_COMPOSITE_STRATEGY } from './tree/11_model/1_framing';
import { VISUAL_HIERARCHY, OUTFIT_SPECIFICATION } from './tree/11_model/1_details';

// --- TIER 2: LEAF NODES (Dynamic Injection) ---
// Product Leaves
import { LEAF_PROMPT_PRODUCT_FRONT } from './tree/10_product/leaves/front';
import { LEAF_PROMPT_PRODUCT_ANGLE } from './tree/10_product/leaves/angle';
import { LEAF_PROMPT_PRODUCT_BACK } from './tree/10_product/leaves/back';
import { LEAF_PROMPT_PRODUCT_TOP } from './tree/10_product/leaves/top';
import { LEAF_PROMPT_PRODUCT_DETAIL } from './tree/10_product/leaves/detail';
import { LEAF_PROMPT_PRODUCT_INSIDE } from './tree/10_product/leaves/inside';

// Model Leaves
import { LEAF_PROMPT_MODEL_FRONT } from './tree/11_model/leaves/front';
import { LEAF_PROMPT_MODEL_SIDE } from './tree/11_model/leaves/side';
import { LEAF_PROMPT_MODEL_BACK } from './tree/11_model/leaves/back';
import { LEAF_PROMPT_MODEL_BACK_ANGLE } from './tree/11_model/leaves/back_angle';
import { LEAF_PROMPT_MODEL_POSE1 } from './tree/11_model/leaves/pose1';
import { LEAF_PROMPT_MODEL_POSE2 } from './tree/11_model/leaves/pose2';
import { LEAF_PROMPT_MODEL_POSE3 } from './tree/11_model/leaves/pose3';

// Helper Map for Leaves
const LEAF_MAP = {
    // Product
    'p_front': LEAF_PROMPT_PRODUCT_FRONT,
    'p_angle': LEAF_PROMPT_PRODUCT_ANGLE,
    'p_back': LEAF_PROMPT_PRODUCT_BACK,
    'p_top': LEAF_PROMPT_PRODUCT_TOP,
    'p_detail': LEAF_PROMPT_PRODUCT_DETAIL,
    'p_inside': LEAF_PROMPT_PRODUCT_INSIDE,
    // Model
    'm_front': LEAF_PROMPT_MODEL_FRONT,
    'm_side': LEAF_PROMPT_MODEL_SIDE,
    'm_back': LEAF_PROMPT_MODEL_BACK,
    'm_back_angle': LEAF_PROMPT_MODEL_BACK_ANGLE,
    'm_pose1': LEAF_PROMPT_MODEL_POSE1,
    'm_pose2': LEAF_PROMPT_MODEL_POSE2,
    'm_pose3': LEAF_PROMPT_MODEL_POSE3
};


export const getViewPrompt = (viewType, config, availableLabels = [], taskKey = '', presets = null, styleRefLabel = '') => {
    // 1. Fetch Style Preset (if selected)
    const selectedStyle = presets?.styles?.find(s => s.id === config.styleId);

    // 2. Fetch Viewpoint Preset (if available)
    // Mapping: specTasks/modelTasks 'type' to presets.json 'id'
    // presets.json ids are: front, angle_front, back, top, inside, detail
    const selectedViewpoint = presets?.viewpoints?.find(v => v.id === viewType || (viewType.startsWith('model_') && v.id === viewType.replace('model_', '')));

    // 3. Fetch Model Preset (if selected)
    const selectedModel = presets?.models?.find(m => m.id === config.modelId);

    // 4. Fetch Product Category (NEW)
    const selectedCategory = presets?.productCategories?.find(c => c.id === config.categoryId);
    const categoryConstraint = selectedCategory ? `
CATEGORY CONSTRAINT (${selectedCategory.name}):
${selectedCategory.promptConstraint}
` : "";

    // Helper to merge base + interrogated + viewpoint + model prompts
    const styleBase = selectedStyle ? selectedStyle.basePrompt : "";
    const styleAI = selectedStyle ? selectedStyle.interrogatedPrompt : "";

    const viewBase = selectedViewpoint ? selectedViewpoint.basePrompt : "";
    const viewAI = selectedViewpoint ? selectedViewpoint.interrogatedPrompt : "";

    const modelAI = selectedModel ? selectedModel.visual_identity : "";

    // 4. Fetch Model-Specific Viewpoint Override (NEW)
    // If the model has a specific pose saved for this viewType, it takes precedence over the generic viewpoint interrogated prompt
    const cleanViewId = viewType.startsWith('model_') ? viewType.replace('model_', '') : viewType;
    const modelViewPose = selectedModel?.viewpoints?.[cleanViewId] || "";

    // Hierarchy: 
    // - Base: Generic Viewpoint Base (e.g. Frontal logic)
    // - AI Components: Mixed (Identity + (Model-Specific Pose OR Generic Pose) + Artistic Style)
    const orchestratedBase = [viewBase, styleBase].filter(Boolean).join(', ');

    // Logic: Use model-specific pose if available, else fallback to generic viewAI
    const effectivePosePrompt = modelViewPose || viewAI;
    const orchestratedAI = [effectivePosePrompt, styleAI, modelAI].filter(Boolean).join(', ');

    // Spec Requirement: Pure White Background (to be post-processed to #F9F9F9), Studio Lighting 5500K.
    // Added "NO shadows, NO filters" to base prompt.
    // NOTE: In modular refactor, STRICT_PROTOCOL_BASE replaces the old literal 'base'.
    // We append the PRODUCT NEGATIVE to it to match original structure, OR we can inject it inside.
    const base = STRICT_PROTOCOL_BASE + `8. **NEGATIVE PROMPT**: ${PRODUCT_NEGATIVE_IN_BASE}\n`;

    // Truth Enforcing Context (User Defined Strict Mode)
    let context = SYSTEM_IDENTITY + CONTEXT_RULES(orchestratedBase, orchestratedAI, categoryConstraint);

    // Inject JSON Topology if present (Parsed or Raw)
    if (config.description) {
        context += `
TOPOLOGY CONSTRAINT(JSON API):
${config.description}
    INSTRUCTION: Follow this topology STRICTLY.
`;
    }

    // Inject Color Enforcement Protocol (Modular)
    if (config.targetColor) {
        context += `
COLOR ENFORCEMENT PROTOCOL(OVERRIDE):
    - TARGET COLOR: ${config.targetColor}
    - ACTION: Recolor the base material of the product to match the Target Color EXACTLY.
- CONSTRAINT: PRESERVE TEXTURE.Do not paint flat color.You must map the Target Color onto the existing weave / grain / surface topology.
- SCOPE: Only the main product material.Do not recolor skin, background, or neutral hardware unless specified.
`;
    }

    // === RESOLVE LEAF NODE ===
    // Map viewType (e.g., 'm_back') to specific leaf content.
    // Note: 'model_' prefix needs careful handling if keys are simple.
    // My map uses simple keys: p_front, m_back etc. which match standard viewType IDs.
    const leafContent = LEAF_MAP[viewType] || "";

    // === PRE-FLIGHT LOGIC CHECKS (LOGIC LAYER) ===
    // 1. Conflict Resolution: If view is BACK or BACK_ANGLE, force remove specific "Frontal" terms if they leaked into config.
    // (This is a safety net in addition to the prompt rules)
    const isBackView = viewType.includes('back');
    if (isBackView) {
        // We don't change config state here (read-only), but we can adjust our string injection.
        // For example, ensure 'Face Visible' is not in description.
    }

    // 2. Detail Shot Logic: Increase texture emphasis
    // (Optional: Could append a strong texture booster)
    const isDetail = viewType.includes('detail');
    const textureBooster = isDetail ? " (macro photography:1.3), (hyper-texture:1.5) " : "";

    let prompt = "";

    // === DECISION TREE: ROOT SPLIT ===
    // BRANCH A: MODEL (HUMAN)
    // BRANCH B: PRODUCT (STILL LIFE)

    if (viewType.startsWith('model_') || viewType.startsWith('m_')) {
        // ==========================================
        // BRANCH A: MODEL VIEW LOGIC
        // ==========================================

        // CHECK FOR TEMPLATE COMPOSITE MODE
        const templateImage = selectedModel?.templateImage;

        if (templateImage) {
            // --- TEMPLATE COMPOSITE SUB-BRANCH ---
            prompt = TEMPLATE_COMPOSITE_STRATEGY;
        } else {
            // --- STANDARD GENERATIVE SUB-BRANCH ---
            const hairLogic = config.hairColor ? `, hair color: ${config.hairColor} ` : "";
            const modelIdentity = selectedModel ? modelAI : `${config.ethnicity || 'asian'} ${config.gender || 'female'} model${hairLogic} `;

            // Composition is now imported from templates
            const composition = COMPOSITION_REQUIREMENT;

            const scene = config.scene ? `in a ${config.scene} ` : "Pure White Background";
            const wardrobeStyle = config.outfitSuggestion || config.clothing || "Professional Studio Outfit";
            const orchestratedAI_Model = [modelIdentity, styleAI, effectivePosePrompt].filter(Boolean).join(', ');

            // --- GENDER ENFORCEMENT LOGIC ---
            const isMale = (selectedModel?.visual_identity?.toLowerCase().includes('male') || config.gender === 'male');
            const genderNegative = getGenderNegative(isMale);

            // Assemble Model Prompt
            // T1 + T2 Modules + T3 Leaf
            const modelPrompt = `
${MODEL_TASK_HEADER}
${ORIENTATION_LOCK_PRIORITY_1}

${FRAMING_PRIORITY_2(viewType)}

${SECONDARY_HAT_CONSTRAINTS}

${ANATOMICAL_IMMERSION}

${VISUAL_HIERARCHY}

${MODEL_NEGATIVE_BASE(BASE_NEGATIVE_STRING, viewType, genderNegative)}

[COMPOSITION]: ${composition}
[VIEW SPECIFIC INSTRUCTION]: ${leafContent}

MODEL IDENTITY: ${orchestratedAI_Model}.
${OUTFIT_SPECIFICATION(wardrobeStyle)}
SCENE: ${scene}.
${categoryConstraint}
${base}
`.trim();
            prompt = modelPrompt;
        }

    } else {
        // ==========================================
        // BRANCH B: PRODUCT VIEW LOGIC (STILL LIFE)
        // ==========================================
        const productPrompt = `
${context}
${PRODUCT_GEOMETRY_LOCK}

${PRODUCT_RENDERING_STYLE}

[VIEW SPECIFIC INSTRUCTION]: ${leafContent}
${textureBooster}
`.trim();

        prompt = productPrompt;
    }

    // Append Style Reference Logic if present
    if (styleRefLabel) {
        prompt += `\n\n[STYLE REFERENCE ALERT]: An additional image labeled "${styleRefLabel}" is provided. Use its COLOR, LIGHTING, and MATERIAL TONES as the master reference for the output. Maintain the geometry of the target product, but match the visual style of this style reference EXACTLY.`;
    }

    return prompt;
};
