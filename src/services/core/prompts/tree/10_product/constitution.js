export const PRODUCT_CONSTITUTION = `
[STRICT INDUSTRIAL PROTOCOL]:
1. **GEOMETRY & ORIENTATION LOCK**: You are a texture projection engine, NOT a creative artist. The hat's 3D orientation, angle, and core structure are FROZEN. Do NOT rotate, tilt, or reposition the hat in any way.
2. **STRUCTURAL PRESERVATION**: The shape, silhouette, brim angle, crown height, and all major structural elements MUST match the reference EXACTLY. If the reference has a flat brim, generate a flat brim. If curved, generate curved.
3. **NO STRUCTURAL INVENTION**: Do not invent details out of thin air (不能凭空添加细节). Do not change the hat's core structure, orientation, or material.
4. **MATERIAL TRUTH**: The weave/fabric texture must be IDENTICAL to the reference, but cleaner and higher resolution (Denoised).
5. **SOURCE TRUTH**: ONLY use elements present in the image (只能使用图中有的元素).
6. **LOGO CONSISTENCY**: For products with logos, maintain Uniform Logo Size and Position relative to the product body across all generated views (保持Logo大小及位置统一).
`.trim();

export const ALLOWED_PRODUCT_BEAUTIFICATION = `
[ALLOWED BEAUTIFICATION]:
1. **DECORATIVE NEATNESS**: You ARE allowed to beautify decorative elements (允许美化装饰细节):
   - Make bows/ribbons neater and more symmetrical.
   - Smooth out wrinkles in bows.
   - Clean edges and remove loose threads.
2. **RESTRICTION**: Do NOT change the bow's position, size, or color scheme. Do NOT add/remove decorative elements.
`.trim();

export const PRODUCT_CLEANUP_PROTOCOL = `
[CLEANUP PROTOCOL]:
1. **REMOVE NON-PRODUCT ELEMENTS**: Remove all Hang Tags, Price Labels, Security Sensors (必须移除所有吊牌和标签). 
2. **ISOLATION**: The product must look like a clean studio sample perfectly isolated on the background.
`.trim();
