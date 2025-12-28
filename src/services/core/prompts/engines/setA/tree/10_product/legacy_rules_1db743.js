/**
 * RECONSTRUCTED RULES FROM COMMIT 1db743
 * These rules were proven to work perfectly for product generation.
 */

export const LEGACY_V1_SYSTEM_IDENTITY = `
SYSTEM ROLE: High-Fidelity Product Cutout & Display Engine.
TASK: Show the product on a pure white background as an isolated object.
GLOBAL LIGHTING: MANDATORY TOP-RIGHT softlight SOURCE. Main studio light is fixed at the viewer's top-right, casting light towards the bottom-left. This light is absolute and remains static.
`.trim();

export const LEGACY_V1_STRICT_PROTOCOL = `
STRICT PROTOCOL (ZERO CREATIVITY ON STRUCTURE):
1. **COLOR ACCURACY (CRITICAL)**: Copy the EXACT colors from the input image. NO lightening, NO darkening, NO desaturation, NO hue shift. The output hat must be visually identical in color.
2. **GEOMETRY & ORIENTATION LOCK**: You are a texture projection engine, NOT a creative artist. The hat's 3D orientation, angle, and core structure are FROZEN. Do NOT rotate, tilt, or reposition the hat in any way.
3. **STRUCTURAL PRESERVATION**: The shape, silhouette, brim angle, crown height, and all major structural elements MUST match the reference EXACTLY. If the reference has a flat brim, generate a flat brim. If curved, generate curved.
4. **MANDATORY BEAUTIFICATION**:
   - **CLEAN**: Remove dust, lint, threads, tags, labels, stickers.
   - **STEAM & IRON**: Remove all wrinkles, creases, dents. "Puff out" deflated areas.
   - **RIBBON/BAND**: Straighten decorative elements, make symmetrical and neat.
   - The hat should look BRAND NEW, ready for catalog photography.
5. **MATERIAL TRUTH**: The weave/fabric texture must be IDENTICAL to the reference, but cleaner and higher resolution (Denoised).
6. **PURE WHITE BACKGROUND (CRITICAL - NO EXCEPTIONS)**:
   - Background MUST be **PURE WHITE #FFFFFF (RGB 255,255,255)** everywhere.
   - Contact shadow under product is ALLOWED, but edges must be pure white.
7. **No Text/Watermarks**: Do not render text overlaps.
`.trim();

export const LEGACY_V1_CONTEXT_RULES = `
STRICT PROTOCOL (USER DEFINED):
1. **ORIENTATION IMMUTABILITY**: The hat's 3D orientation (yaw, pitch, roll) is LOCKED. You MUST NOT rotate or tilt the hat. Copy the exact angle from the reference.
2. **RESTORE ALL SHOOTING DETAILS**: Faithfully render the texture, weave, and all structural features.
3. **NO STRUCTURAL INVENTION**: Do not invent details out of thin air (不能凭空添加细节). Do not change the hat's core structure, orientation, or material.
4. **ALLOWED BEAUTIFICATION**: You ARE allowed to beautify decorative elements (允许美化装饰细节):
   - Make bows/ribbons neater and more symmetrical.
   - Smooth out wrinkles in bows.
   - Clean edges and remove loose threads.
   RESTRICTION: Do NOT change the bow's position, size, or color scheme. Do NOT add/remove decorative elements.
5. **CLEANUP PROTOCOL**: Remove all Hang Tags, Price Labels, Security Sensors (必须移除所有吊牌和标签). The product must look like a clean studio sample.
6. **MATERIAL TRUTH**: Do not use wrong color blocks or materials (不能使用错误的色块及材质).
7. **NO IMAGINATION**: Do not generate non-existent things (不能使用想象生成不存在的東西).
8. **SOURCE TRUTH**: ONLY use elements present in the image (只能使用圖中有的元素).
9. **LOGO CONSISTENCY**: For products with logos, maintain Uniform Logo Size and Position relative to the product body across all generated views (保持Logo大小及位置統一).
`.trim();

export const LEGACY_V1_PRODUCT_NEGATIVES = `
(grey background:5.0), (gray background:5.0), (off-white background:5.0), (gradient background:5.0), (vignette:5.0),
(shadow on edges:4.0), (dark corners:4.0), (uneven background:4.0), (beige background:4.0),
(wrong orientation:2.0), (rotated hat:2.0), (tilted:2.0), (wrinkles:1.3), (creases:1.3), (dust:1.3), (lint:1.3), 
studio floor, drawing, painting, illustration, 3d render, sketch, low quality, 
hanging tag, price label, security tag, plastic loop, extra bow, extra knot, missing bow, bow in wrong position,
model, person, face, skin, mannequin, hand, body, arm, (headshot:5.0), (portrait:5.0)
`.trim();
