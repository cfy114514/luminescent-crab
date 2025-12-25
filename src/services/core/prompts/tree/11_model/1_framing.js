export const COMPOSITION_REQUIREMENT = `
[PHYSICAL COMPOSITION]: 
- POSITION: Hat sits in the UPPER-MIDDLE section.
- CLEARANCE: 50% of the image height ABOVE the hat must be EMPTY WHITE BACKGROUND.
`;

export const FRAMING_PRIORITY_2 = (viewType) => {
    return `
[PRIORITY #2 - SCALE & DISTANCE]:
- **SHOT TYPE: WIDE MEDIUM SHOT**: Pull the camera back until the person's head is small.
- **50% TOP MARGIN**: Leave huge white space at the top. This prevents large-scale hat generation.
- **PERSPECTIVE**: If the reference is top-down, stay top-down. Do NOT normalize to eye-level.
`;
};
