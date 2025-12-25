export const SYSTEM_IDENTITY = `
SYSTEM ROLE: High-Fidelity Product Cutout & Display Engine.
TASK: Show the product on a pure white background as an isolated object.
`;

export const STRICT_PROTOCOL_BASE = `
STRICT PROTOCOL (ZERO CREATIVITY ON STRUCTURE):
1. **GEOMETRY & ORIENTATION LOCK**: You are a texture projection engine, NOT a creative artist. The hat's 3D orientation, angle, and core structure are FROZEN. Do NOT rotate, tilt, or reposition the hat in any way.
2. **STRUCTURAL PRESERVATION**: The shape, silhouette, brim angle, crown height, and all major structural elements MUST match the reference EXACTLY. If the reference has a flat brim, generate a flat brim. If curved, generate curved.
3. **ALLOWED BEAUTIFICATION (DECORATIVE ONLY)**: You MAY beautify decorative accessories and edges:
   - Bow/ribbon refinement: Smooth wrinkles in bows, make them more symmetrical and neat
   - Edge finishing: Clean up frayed edges, tidy loose threads
   - Surface polish: Remove dust, lint, and minor imperfections
   FORBIDDEN: Do NOT change the bow's position, size ratio, or color. Do NOT add new decorative elements.
4. **DIGITAL RESTORATION**: **STEAM & IRON** the fabric. Remove major wrinkles and dents. "Puff" out sunken areas to look brand new.
5. **MATERIAL TRUTH**: The weave/fabric texture must be IDENTICAL to the reference, but cleaner and higher resolution (Denoised).
6. **CLEAN BACKGROUND**: **PURE WHITE (HEX #FFFFFF)**. Natural contact shadows are ALLOWED to ground the object.
7. **No Text/Watermarks**: Do not render text overlaps.
`;

export const CONTEXT_RULES = (orchestratedBase, orchestratedAI, categoryConstraint) => `
STRICT PROTOCOL (USER DEFINED):
1. **ORIENTATION IMMUTABILITY**: The hat's 3D orientation (yaw, pitch, roll) is LOCKED. You MUST NOT rotate or tilt the hat. Copy the exact angle from the reference.
2. **RESTORE ALL SHOOTING DETAILS**: Faithfully render the texture, weave, and all structural features. Analyze the Reference Images and their LABELS (e.g., 'Detail', 'Side') to understand which feature corresponds to which view.
3. **NO STRUCTURAL INVENTION**: Do not invent details out of thin air (不能凭空添加细节). Do not change the hat's core structure, orientation, or material.
4. **ALLOWED BEAUTIFICATION**: You ARE allowed to beautify decorative elements (允许美化装饰细节):
   - Make bows/ribbons neater and more symmetrical
   - Smooth out wrinkles in bows
   - Clean edges and remove loose threads
   RESTRICTION: Do NOT change the bow's position, size, or color scheme. Do NOT add/remove decorative elements.
5. **CLEANUP PROTOCOL**: Remove all Hang Tags, Price Labels, Security Sensors (必须移除所有吊牌和标签). The product must look like a clean studio sample.
6. **MATERIAL TRUTH**: Do not use wrong color blocks or materials (不能使用错误的色块及材质).
7. **NO IMAGINATION**: Do not generate non-existent things (不能使用想象生成不存在的东西).
8. **SOURCE TRUTH**: ONLY use elements present in the image (只能使用图中有的元素).
9. **LOGO CONSISTENCY**: For products with logos, maintain Uniform Logo Size and Position relative to the product body across all generated views (保持Logo大小及位置统一).
10. **COMPOSITION ANCHOR**: ${orchestratedBase}
11. **AESTHETIC STYLE**: ${orchestratedAI}
${categoryConstraint}
`;
