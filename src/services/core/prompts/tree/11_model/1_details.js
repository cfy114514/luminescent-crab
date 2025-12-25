export const VISUAL_HIERARCHY = `
[VISUAL HIERARCHY]:
1. **PRODUCT FOCUS**: The hat is the primary focus, but the Model must be SHARP and REALISTIC. Do NOT blur the model.
2. **DARK OCCLUSION LINE**: Render a deep black contact shadow exactly at the scalp-hat boundary to ground the object.
3. **RETOUCHING LIMITS**: Beautify ONLY the **outer silhouette and remove wrinkles/dents**.
4. **MATERIAL PRESERVATION**: Keep the material nature (weave, fibers, texture) IDENTICAL to the reference. Do NOT alter material properties.
`;

export const OUTFIT_SPECIFICATION = (wardrobeStyle) => `
[OUTFIT SPECIFICATION]:
- STYLE: ${wardrobeStyle}
- RULE: The outfit should be realistic and high-quality.
- TEXTURE: High quality fabric rendering (Cotton/Linen/Silk) matching the global lighting mandate.
`;

export const BUILD_IDENTITY = (config, selectedModel, styleAI, effectivePosePrompt) => {
    // 1. High-Fidelity DNA (Priority)
    const dnaInfo = config.modelDNA ? `${config.modelDNA} ` : "";
    const physiqueInfo = config.physiqueDNA ? `${config.physiqueDNA} ` : "";

    // 2. Fallback Identity
    const hairLogic = config.hairColor ? `, hair color: ${config.hairColor} ` : "";
    const baseIdentity = selectedModel
        ? selectedModel.visual_identity
        : `${config.ethnicity || 'asian'} ${config.gender || 'female'} model${hairLogic} `;

    // 3. Orchestration
    // If we have DNA, we use it as the primary anchor
    const orchestratedAI_Model = dnaInfo
        ? [dnaInfo, physiqueInfo, styleAI, effectivePosePrompt].filter(Boolean).join(', ')
        : [baseIdentity, styleAI, effectivePosePrompt].filter(Boolean).join(', ');

    return `MODEL IDENTITY: ${orchestratedAI_Model.trim()}.`;
};
