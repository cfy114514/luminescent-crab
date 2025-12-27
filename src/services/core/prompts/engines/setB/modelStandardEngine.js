import { SYSTEM_IDENTITY, MASTER_NEGATIVE_ROOT, UNIVERSAL_REFINE_QUALITY } from './tree/00_root_integrity';
import { getHardcoreOrientation, getSurfaceBeautify } from './tree/11_model/0_geometry_locks';
import { BUILD_IDENTITY } from './tree/11_model/1_details';
import { getStrictProtocol, getGenderNegative, MODEL_MASTER_NEGATIVE } from './tree/11_model/model_integrity';
import { getModelLeafPrompt } from './tree/11_model/leaves/dispatcher';
import { getPersonaGroup, getSetBCharacter, getSetBEnvironment } from './personaConfig';

/**
 * Standard Model Generation Protocol (Strict Orientation Sync)
 */
export const getStandardModelPrompt = (config, selectedModel, viewType, genderLabel, isMale) => {
    const orientation = getHardcoreOrientation(viewType);
    const protocol = getStrictProtocol(viewType);
    const leafSpecifics = getModelLeafPrompt(viewType);

    // --- SET B SPECIFIC LOGIC ---
    const personaGroup = getPersonaGroup(config);
    const characterBlock = getSetBCharacter(personaGroup, isMale, config);
    const environmentBlock = getSetBEnvironment(personaGroup);
    // ----------------------------

    return `
[SYSTEM]: 
${SYSTEM_IDENTITY}
ROLE: High-End E-Commerce Lifestyle Photographer. 
SPECIALIZATION: Hats & Headwear.
TONE: Premium, Natural, Commercial, "Life-styled" but STUDIO CONTROLLED.

[SPATIAL ORIENTATION]:
${orientation}

[100% SPATIAL HEAD LOCK]:
- **MANDATORY**: The model's head MUST EXACTLY MATCH the 3D rotation, tilt, and angle of the mannequin head in Image 1. 
- **NO CORRECTION**: Do NOT straighten the face. Follow the mannequin's exact gaze.

[MODEL PHYSICAL LAWS]:
1. **TOP MARGIN**: 1/5 (20%) vertical gap from the top of the canvas to the crown of the head.
2. **SCALE**: 
   - **HAT WEARING STATE**: Occupies ~60% of visual attention.
   - **STRUCTURE DETAILS**: 30% focus on texture and form.
   - **MODEL EXPRESSION**: 10% supporting role.
3. **BACKGROUND**: Seamless Studio Paper (White/Beige/Light Grey). NO REAL WORLD BACKGROUNDS.

${protocol}

${environmentBlock}

[VIEW-SPECIFIC INSTRUCTIONS]:
${leafSpecifics}

[SUBJECT DETAILS (PERSONA STRICT)]:
${characterBlock}
- **CLOTHING RULES**: Plain fabrics ONLY. NO LOGOS. NO PRINTS. NO DISTRACTIONS.

[REFINEMENT & BEAUTIFY]:
${getSurfaceBeautify()}
${UNIVERSAL_REFINE_QUALITY}
- **FACE ILLUMINATION**: MANDATORY. The face must be well-lit.
- **NO BRIM SHADOW**: Use a fill light from below to erase any shadow cast by the hat brim onto the eyes/face.

[GLOBAL NEGATIVES]: ${MASTER_NEGATIVE_ROOT} ${MODEL_MASTER_NEGATIVE} ${getGenderNegative(isMale)}, 
strong sunlight, outdoors, harsh shadows, dark eyes, hidden face, brim shadow, silhouette, 
messy hair, plastic skin, cartoon, illustration, painting, 
distorted hands, bad anatomy, strong makeup, jewelry overload,
logo, text, print, pattern on clothes, busy background.
`.trim();
};
