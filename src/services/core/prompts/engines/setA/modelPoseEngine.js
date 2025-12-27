import { SYSTEM_IDENTITY, MASTER_NEGATIVE_ROOT, UNIVERSAL_REFINE_QUALITY } from './tree/00_root_integrity';
import { getHardcoreOrientation, getSurfaceBeautify } from './tree/11_model/0_geometry_locks';
import { BUILD_IDENTITY } from './tree/11_model/1_details';
import { MODEL_PHYSICAL_LAWS, getGenderNegative, MODEL_MASTER_NEGATIVE } from './tree/11_model/model_integrity';
import { getModelLeafPrompt } from './tree/11_model/leaves/dispatcher';
import { ANATOMICAL_IMMERSION } from './tree/11_model/0_anatomy';

/**
 * Structural Pose Protocol (Aesthetic Harmony + Symmetry Lock)
 */
export const getPoseModelPrompt = (config, selectedModel, viewType, genderLabel, isMale, manualPose) => {
    const orientation = getHardcoreOrientation(viewType);
    const leafSpecifics = getModelLeafPrompt(viewType);
    const anatomy = ANATOMICAL_IMMERSION(viewType);

    const rawIdentity = BUILD_IDENTITY(config, selectedModel, "", "");
    const characterDetails = rawIdentity.replace(/portrait|pose|smiling|commercial|fashion|looking/gi, "");

    const structuralPrompt = manualPose?.structural_prompt || "";
    const scalingMandate = manualPose?.scaling_mandate || "";
    const limbAction = manualPose?.limb_action || "";
    const expression = manualPose?.facial_expression || "";

    const isOccluded = expression.toLowerCase().includes("hidden") || expression.toLowerCase().includes("obscured");

    return `
[SYSTEM]: 
${SYSTEM_IDENTITY}
ROLE: Photorealistic Model Portrait & Commercial Engine.
${MODEL_PHYSICAL_LAWS}

[SPATIAL ORIENTATION & SYMMETRY]:
${orientation}

[HARMONIZED FRAMING]:
- **SIGHTLINE**: ${scalingMandate}
- **ESSENCE**: Replicate the airy composition of the reference.

[VIEW-SPECIFIC INSTRUCTIONS]:
${leafSpecifics}

[SPATIAL HEAD LOCK - IMAGE 1]:
- **3D SYNC**: The model's head MUST match the exact tilt/orientation shown in Image 1. 

${anatomy}

[VISUAL PRIVACY & OCCLUSION]:
${isOccluded ? "CRITICAL: The hat brim MUST cast a deep shadow over the eyes. Do NOT render eyes." : "Render expression naturally."}
- **FACIAL MOOD**: ${expression}

[ANATOMICAL ELEGANCE]:
- **FLOW**: ${structuralPrompt}
- **EXTREMITIES**: ${limbAction}

- **MODEL IDENTITY**: ${characterDetails}.

[REFINEMENT]:
${getSurfaceBeautify()}
${UNIVERSAL_REFINE_QUALITY}

[GLOBAL NEGATIVES]: ${MASTER_NEGATIVE_ROOT} ${MODEL_MASTER_NEGATIVE} ${getGenderNegative(isMale)}, ${isOccluded ? "visible eyes, looking at camera," : ""} stiff pose, distorted features.
`.trim();
};
