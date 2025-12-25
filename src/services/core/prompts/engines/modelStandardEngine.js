import { SYSTEM_IDENTITY, MASTER_NEGATIVE_ROOT, UNIVERSAL_REFINE_QUALITY } from '../tree/00_root_integrity';
import { getHardcoreOrientation, getSurfaceBeautify } from '../tree/11_model/0_geometry_locks';
import { BUILD_IDENTITY } from '../tree/11_model/1_details';
import { getStrictProtocol, getGenderNegative, MODEL_MASTER_NEGATIVE } from '../tree/11_model/model_integrity';
import { getModelLeafPrompt } from '../tree/11_model/leaves/dispatcher';

/**
 * Standard Model Generation Protocol (Strict Orientation Sync)
 */
export const getStandardModelPrompt = (config, selectedModel, viewType, genderLabel, isMale) => {
    const orientation = getHardcoreOrientation(viewType);
    const protocol = getStrictProtocol(viewType);
    const leafSpecifics = getModelLeafPrompt(viewType);

    const rawIdentity = BUILD_IDENTITY(config, selectedModel, "", "");
    const characterDetails = rawIdentity.replace(/portrait|pose|smiling|commercial|fashion|looking/gi, "");

    return `
[SYSTEM]: 
${SYSTEM_IDENTITY}
ROLE: Photorealistic Model Portrait & Commercial Engine.

[SPATIAL ORIENTATION]:
${orientation}

[100% SPATIAL HEAD LOCK]:
- **MANDATORY**: The model's head MUST EXACTLY MATCH the 3D rotation, tilt, and angle of the mannequin head in Image 1. 
- **NO CORRECTION**: Do NOT straighten the face. Follow the mannequin's exact gaze.

${protocol}

[VIEW-SPECIFIC INSTRUCTIONS]:
${leafSpecifics}

[SUBJECT DETAILS]:
- **CHARACTER**: ${characterDetails}.
- **OUTFIT**: ${config.clothing || 'Standard professional studio outfit'}.

[REFINEMENT & BEAUTIFY]:
${getSurfaceBeautify()}
${UNIVERSAL_REFINE_QUALITY}

[GLOBAL NEGATIVES]: ${MASTER_NEGATIVE_ROOT} ${MODEL_MASTER_NEGATIVE} ${getGenderNegative(isMale)}, changing head angle, rotating the face, shadows.
`.trim();
};
