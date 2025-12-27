import { SYSTEM_IDENTITY, MASTER_NEGATIVE_ROOT, UNIVERSAL_REFINE_QUALITY } from './tree/00_root_integrity';
import { getHardcoreOrientation, getSurfaceBeautify } from './tree/11_model/0_geometry_locks';
import { BUILD_IDENTITY } from './tree/11_model/1_details';
import { MODEL_PHYSICAL_LAWS, getGenderNegative, MODEL_MASTER_NEGATIVE } from './tree/11_model/model_integrity';
import { getModelLeafPrompt } from './tree/11_model/leaves/dispatcher';
import { ANATOMICAL_IMMERSION } from './tree/11_model/0_anatomy';
import { getPersonaGroup, getSetBCharacter, getSetBEnvironment } from './personaConfig';

/**
 * Structural Pose Protocol (Aesthetic Harmony + Symmetry Lock)
 */
export const getPoseModelPrompt = (config, selectedModel, viewType, genderLabel, isMale, manualPose) => {
   const orientation = getHardcoreOrientation(viewType);
   const leafSpecifics = getModelLeafPrompt(viewType);
   const anatomy = ANATOMICAL_IMMERSION(viewType);

   // --- SET B SPECIFIC LOGIC ---
   const personaGroup = getPersonaGroup(config);
   const characterBlock = getSetBCharacter(personaGroup, isMale, config);
   const environmentBlock = getSetBEnvironment(personaGroup);
   // ----------------------------

   const structuralPrompt = manualPose?.structural_prompt || "";
   const scalingMandate = manualPose?.scaling_mandate || "";
   const limbAction = manualPose?.limb_action || "";
   const expression = manualPose?.facial_expression || "";

   const isOccluded = expression.toLowerCase().includes("hidden") || expression.toLowerCase().includes("obscured");

   return `
[SYSTEM]: 
${SYSTEM_IDENTITY}
ROLE: High-End E-Commerce Lifestyle Photographer.
SPECIALIZATION: Hats & Headwear.

[COMMERCIAL STANDARDS]:
[MODEL PHYSICAL LAWS]:
1. **TOP MARGIN**: 1/5 (20%) vertical gap from the top of the canvas to the crown of the head.
2. **SCALE**: 
   - **FOCUS**: The Hat and Face are the primary visual center (60% attention), but MUST maintain realistic scale relative to the body.
   - **FRAMING**: Half-Body (Head to Mid-Chest).
   - **MODEL EXPRESSION**: 10% supporting role.
3. **BACKGROUND**: Seamless Studio Paper (Pure White). IGNORE reference background.
4. **ANATOMICAL STRUCTURE**:
   - **HEAD-TO-SHOULDER RATIO**: MANDATORY NATURAL PROPORTIONS. Head width must be approx 1/3 of total shoulder width.
   - **PHYSIQUE**: BROAD SHOULDERS. Adult Male Physique. Avoid narrow/sloping shoulders.
   - **LENS CORRECTION**: Telephoto Lens (>85mm). FLATTEN PERSPECTIVE. No "Selfie" distortion.

[SPATIAL ORIENTATION & SYMMETRY]:
${orientation}

[HARMONIZED FRAMING]:
- **SIGHTLINE**: ${scalingMandate}
- **ESSENCE**: IGNORE the artistic style/color/lighting of the reference image. Extract ONLY the anatomical pose and camera angle.
- **LIGHTING**: Apply standard COMMERCIAL STUDIO LIGHTING (Softbox). Do not copy reference lighting.

${environmentBlock}

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

[SUBJECT DETAILS (PERSONA LOCKED)]:
${characterBlock}
- **CLOTHING RULES**: Plain fabrics ONLY. NO LOGOS. NO PRINTS. NO DISTRACTIONS.

[REFINEMENT]:
${getSurfaceBeautify()}
${UNIVERSAL_REFINE_QUALITY}
- **FACE ILLUMINATION**: MANDATORY. The face must be well-lit (unless occluded by angle).
- **NO BRIM SHADOW**: Use a fill light from below to erase any shadow cast by the hat brim onto the eyes/face.

[GLOBAL NEGATIVES]: ${MASTER_NEGATIVE_ROOT} ${MODEL_MASTER_NEGATIVE} ${getGenderNegative(isMale)}, 
${isOccluded ? "visible eyes, looking at camera," : ""} 
strong sunlight, outdoors, harsh shadows, dark face, silhouette, backlighting,
messy hair, plastic skin, cartoon, illustration, painting, 
distorted hands, bad anatomy, strong makeup, jewelry overload,
logo, text, print, pattern on clothes, busy background,
big head, large head, narrow shoulders, bobblehead, chibi, juvenile proportions.
`.trim();
};
