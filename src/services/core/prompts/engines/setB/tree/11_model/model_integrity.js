/**
 * MODEL-SPECIFIC INTEGRITY PROTOCOL
 * These rules only apply whenever a Model is involved.
 */

export const MODEL_PHYSICAL_LAWS = `
[MODEL PHYSICAL LAWS]:
1. **TOP MARGIN**: 1/5 (20%) vertical gap from the top of the canvas to the crown of the head.
2. **SCALE**: The Subject (Model + Hat) area should occupy approximately 30% of the total canvas area.
3. **BACKGROUND**: MANDATORY PURE WHITE (#FFFFFF). 
`.trim();

export const getStrictProtocol = (viewType) => {
    return MODEL_PHYSICAL_LAWS;
};

export const getGenderNegative = (isMale) => {
    return isMale ? "female, woman, girl, makeup, feminine, lipstick" : "male, man, boy, beard, masculine, mustache";
};

export const MODEL_MASTER_NEGATIVE = `
(headshot:5.0), (close-up:5.0), (portrait:5.0), 
(rotating the hat:5.0), (straightened hat:4.0), 
(shadows on the right side of face:8.0), 
`.trim();
