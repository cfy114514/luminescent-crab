/**
 * Persona Configuration for Set B (Dynamic from Config)
 */

import { DEFAULT_PERSONA_GROUPS } from './defaultPersonas';

/**
 * Heuristic to determine Persona Group based on config
 * Now reads from config.personaGroups (or fallbacks to Default)
 */
export const getPersonaGroup = (config) => {
    // 1. Get Groups Source
    const groups = config.personaGroups || DEFAULT_PERSONA_GROUPS;

    const text = (config.clothing || '').toLowerCase() + ' ' + (config.contextTag || '').toLowerCase();

    // 2. Find matching group by keywords
    // We assume groups have structure: { id, keywords: [], ... }
    // Priority: Reverse order or just find first? Let's trying matching specific to generic.

    // Find all matches
    const matches = groups.filter(g =>
        g.keywords && g.keywords.some(k => text.includes(k.toLowerCase()))
    );

    // Return the first match, or default to the FIRST group (usually A / Vacation)
    return matches.length > 0 ? matches[0] : groups[0];
};

/**
 * Generates the specific lighting and composition block
 */
export const getSetBEnvironment = (group) => {
    if (!group || !group.environment) return "";

    // Strictly enforce Pure White Background as requested
    return `
[COMMERCIAL STUDIO SETTING]:
- **BACKGROUND**: PURE WHITE (#FFFFFF). (Studio Seamless Paper).
- **LIGHTING**: STUDIO SOFTBOX. Setup: Front Softbox + Top Diffuser.
- **ATMOSPHERE**: ${group.environment.lighting || "Clean commercial look"}. (Must be simulated within a Studio).
- **COMPOSITION**:
  - Framing: Half-body portrait (Head to mid-chest).
  - **GOLDEN RATIO**: Hat Brim aligns with the Upper Golden Ratio Line.
`;
};

/**
 * Generates the Character Prompt
 * Selects an outfit from the group's outfit list.
 */
export const getSetBCharacter = (group, isMale, config) => {
    const genderKey = isMale ? 'male' : 'female';
    const profile = group.models[genderKey];

    if (!profile) return "[ERROR: Model Profile Not Found]";

    // Select Outfit
    // Logic: Look for outfit name in config.clothing? Or Random?
    // Since consistency is requested: "One model, one outfit".
    // If we pick randomly, it breaks consistency across re-gens if the seed isn't controlled.
    // However, the prompt engine relies on text. 
    // HACK: Use a simple hash of the current clothing string to pick an outfit if multiple exist, 
    // ensuring consistency for the same input.

    let selectedOutfit = null;
    if (profile.outfits && profile.outfits.length > 0) {
        // Try to find if user explicitly typed an outfit name?
        const userText = (config.clothing || '').toLowerCase();
        const explicitMatch = profile.outfits.find(o => userText.includes(o.name.toLowerCase()));

        if (explicitMatch) {
            selectedOutfit = explicitMatch;
        } else {
            // Fallback: Pick the first one as default? Or Random?
            // User Rule: "Clothing must remain unchanged". 
            // Default to the first outfit to ensure stability unless changed.
            selectedOutfit = profile.outfits[0];
        }
    }

    const outfitPrompt = selectedOutfit ? selectedOutfit.prompt : (profile.outfit || "Standard Outfit");

    return `
[MODEL PERSONA - ${group.name}]:
- **AGE/ETHNICITY**: ${profile.baseBody || "Standard Model"}.
- **HAIR**: ${profile.hair}.
- **OUTFIT**: ${outfitPrompt}.
- **MAKEUP/GROOMING**: ${profile.makeup || profile.grooming || "Natural"}.
- **TEXTURES**: Real fabric textures. No synthetic/plastic shine.
- **EXPRESSION**: Natural, confident, approachable (Lifestyle Commercial).
`;
};
