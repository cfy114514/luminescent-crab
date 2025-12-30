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
(nipple:5.0), (nude:5.0), (nsfw:5.0), (naked:5.0), (topless:5.0),
(cleavage:3.5), (revealing clothing:3.0), (bikini:4.0), (underwear:4.0), (lingerie:4.0),
(exposed skin:2.5), (low cut:3.0), (see through:4.0), (transparent clothing:4.0),
`.trim();
