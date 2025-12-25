# Prompt System Modules Summary (提示词模块全览)

> 本文档汇总了系统中所有激活的提示词模块，并为每一条核心指令提供了中文注解，解释其具体作用。

## 00 根节点 (Root - 核心宪法)

### 全网根协议 (Root Integrity)
**File**: `tree/00_root_integrity.js`
> 这是整个系统的“最高法律”，无论生成什么视图，这些规则都必须被遵守。

```text
SYSTEM ROLE: High-Fidelity Product Cutout & Display Engine.
TASK: Show the product on a pure white background as an isolated object.

STRICT PROTOCOL (ZERO CREATIVITY ON STRUCTURE):
1. **GEOMETRY & ORIENTATION LOCK**: You are a texture projection engine, NOT a creative artist. The hat's 3D orientation, angle, and core structure are FROZEN. Do NOT rotate, tilt, or reposition the hat in any way.
   > [几何与方向锁定] 告诉AI它只是一个“纹理投影引擎”而非艺术家。严禁旋转、倾斜或改变帽子的3D空间位置。

2. **STRUCTURAL PRESERVATION**: The shape, silhouette, brim angle, crown height, and all major structural elements MUST match the reference EXACTLY. If the reference has a flat brim, generate a flat brim. If curved, generate curved.
   > [结构保留] 强制要求形状、轮廓、帽檐角度等结构元素与参考图完全一致。如果是平檐就生成平檐，弯檐就生成弯檐。

3. **ALLOWED BEAUTIFICATION (DECORATIVE ONLY)**: You MAY beautify decorative accessories and edges:
   - Bow/ribbon refinement: Smooth wrinkles in bows, make them more symmetrical and neat
   - Edge finishing: Clean up frayed edges, tidy loose threads
   - Surface polish: Remove dust, lint, and minor imperfections
   FORBIDDEN: Do NOT change the bow's position, size ratio, or color. Do NOT add new decorative elements.
   > [允许的美化] 仅限于装饰性细节：熨平蝴蝶结皱褶、清理线头、去除灰尘。严禁改变装饰的位置、大小比例或颜色。

4. **DIGITAL RESTORATION**: **STEAM & IRON** the fabric. Remove major wrinkles and dents. "Puff" out sunken areas to look brand new.
   > [数码修复] 模拟“蒸汽熨烫”效果，去除面料上的大褶皱和压痕，让塌陷区域重新饱满，看起来像全新的。

5. **MATERIAL TRUTH**: The weave/fabric texture must be IDENTICAL to the reference, but cleaner and higher resolution (Denoised).
   > [材质真实性] 面料纹理必须与参考图完全一致，但要比原图更干净、清晰（去噪）。

6. **CLEAN BACKGROUND**: **PURE WHITE (HEX #FFFFFF)**. Natural contact shadows are ALLOWED to ground the object.
   > [纯白背景] 背景必须是纯白(#FFFFFF)。允许保留自然的接触阴影以使物体落地。

8. **RESOLUTION MANIFEST**: OUTPUT AT 2048x2048 PIXELS. High-frequency details must start at this native resolution.
   > [强制分辨率] 输出必须为 2048x2048 像素，确保高频纹理细节从原生分辨率开始生成。

9. **No Text/Watermarks**: Do not render text overlaps.
   > [无水印] 禁止生成任何叠加的文字或水印。

STRICT PROTOCOL (USER DEFINED):
1. **ORIENTATION IMMUTABILITY**: The hat's 3D orientation (yaw, pitch, roll) is LOCKED. You MUST NOT rotate or tilt the hat. Copy the exact angle from the reference.
   > [方向不可变] 再次强调3D方向锁定，完全复制参考图的角度。

2. **RESTORE ALL SHOOTING DETAILS**: Faithfully render the texture, weave, and all structural features. Analyze the Reference Images and their LABELS (e.g., 'Detail', 'Side') to understand which feature corresponds to which view.
   > [还原拍摄细节] 忠实还原纹理和编织细节，并根据参考图的标签（如“细节图”、“侧面图”）来理解特征。

3. **NO STRUCTURAL INVENTION**: Do not invent details out of thin air (不能凭空添加细节). Do not change the hat's core structure, orientation, or material.
   > [禁止结构发明] 严禁凭空捏造细节，不得改变核心结构。

4. **ALLOWED BEAUTIFICATION**: You ARE allowed to beautify decorative elements (允许美化装饰细节):
   - Make bows/ribbons neater and more symmetrical
   - Smooth out wrinkles in bows
   - Clean edges and remove loose threads
   RESTRICTION: Do NOT change the bow's position, size, or color scheme. Do NOT add/remove decorative elements.
   > [允许美化细节] 重复上述美化规则，强调让蝴蝶结更对称、清理线头。

5. **CLEANUP PROTOCOL**: Remove all Hang Tags, Price Labels, Security Sensors (必须移除所有吊牌和标签). The product must look like a clean studio sample.
   > [清理协议] 强制移除所有吊牌、价签、防盗扣，让产品看起来像摄影棚样品。

6. **MATERIAL TRUTH**: Do not use wrong color blocks or materials (不能使用错误的色块及材质).
   > [材质真实] 防止由于光影误判导致的错误色块或材质替换。

7. **NO IMAGINATION**: Do not generate non-existent things (不能使用想象生成不存在的东西).
   > [禁止想象] 再次强调基于事实生成。

8. **SOURCE TRUTH**: ONLY use elements present in the image (只能使用图中有的元素).
   > [源头真实] 只能仅使用图中存在的元素。

9. **LOGO CONSISTENCY**: For products with logos, maintain Uniform Logo Size and Position relative to the product body across all generated views (保持Logo大小及位置统一).
   > [Logo一致性] 确保在不同视角下，Logo相对于主体的大小和位置保持一致。
```

---

## 10 产品分支 (Product Branch - 静物拍摄)

### 产品几何锁 (Product Geometry Lock)
**File**: `tree/10_product/geometry.js`
```text
1. **GEOMETRY LOCK & COMPOSITION**:
   - **ZERO ROTATION**: Maintain the exact same orientation and tilt as the reference image.
     > [零旋转] 保持与参考图完全一致的方向和倾斜度。
   - **HI-FI REPRO**: The product should be sharp, clear, and perfectly isolated on the pure white background.
     > [高保真复刻] 产品必须锐利、清晰，并完美地从背景中分离。
```

### 产品渲染风格 (Product Rendering Style)
**File**: `tree/10_product/rendering.js`
```text
2. **MANDATORY BEAUTIFICATION ("EDGE FOCUS")**:
   - **SMOOTH BRIM**: Fix all jagged edges or "pixel stairs" on the silhouette.
     > [平滑帽檐] 修复轮廓上的锯齿或像素阶梯。
   - **SILHOUETTE CLEANING**: Remove loose threads, dust, and lint.
     > [轮廓清理] 移除边缘的线头、灰尘和棉絮。
   - **MINIMAL SURFACE RETOUCH**: Smooth major wrinkles but preserve core weave/texture.
     > [表面微修] 抚平大褶皱，但保留核心编织纹理。

3. **CLEANUP & POLISH**:
   - REMOVE all Hang Tags, Price Labels, and Security Sensors.
     > [清理杂物] 移除吊牌、标签、防盗扣。
   - PURE WHITE BACKGROUND (#FFFFFF) with high-precision alpha mask.
     > [纯白背景] 使用高精度Alpha遮罩生成纯白背景。

4. **LIGHTING & COLOR GRADING (PROFESSIONAL STUDIO)**:
   - **5500K COLOR TEMPERATURE**: Locked at a consistent 5500K neutral daylight temperature. Ensure color accuracy.
     > [5500K色温] 锁定在5500K中性日光色温，确保颜色准确。
   - **PROFESSIONAL BRIGHTNESS**: Implement high-end product photography lighting. The object should look bright, clean, and well-exposed with a premium studio feel.
     > [专业亮度] 模拟高端产品摄影布光，确保物体明亮、干净、曝光准确。
   - **SOFT CONTACT SHADOW**: CRITICAL: Render a very SOFT, subtle, and natural contact shadow directly underneath the product to ground it on the white floor. Avoid heavy or long drop shadows; it must look like professional ambient occlusion.
     > [柔和接触阴影] 只在底部渲染非常柔和、自然的接触阴影，避免生硬的长投影，模拟环境光遮蔽效果。
   - Fix over-exposed highlights on output boundaries.
     > [修复过曝] 修复边缘的过曝高光。
```

### 叶节点：产品正面 (Leaf: Product Front)
**File**: `tree/10_product/leaves/front.js`
```text
[VIEW SPECIFIC: FRONT (PRODUCT)]:
1. **ABSOLUTE SYMMETRY**: Align the camera perfectly with the center axis of the hat.
   > [绝对对称] 相机完美对齐帽子的中轴线。
2. **ZERO ROLL**: The brim must be perfectly horizontal.
   > [水平帽檐] 帽檐必须绝对水平，无倾斜。
3. **FULL WIDTH**: Ensure the entire width of the hat is visible.
   > [全宽显示] 确保帽子的整个宽度都可见。
4. **EYE LEVEL**: Camera height should be level with the center of the crown.
   > [平视高度] 相机高度与帽冠中心齐平。
```

### 叶节点：产品角度/3分侧 (Leaf: Product Angle)
**File**: `tree/10_product/leaves/angle.js`
```text
[VIEW SPECIFIC: ANGLE / 3/4 (PRODUCT)]:
1. **45 DEGREE ROTATION**: Show the hat from a standard 3/4 perspective to reveal both the front logo and side profile.
   > [45度旋转] 展示标准的3/4侧面，同时显露正面Logo和侧面轮廓。
2. **DIMENSIONALITY**: Highlight the depth of the crown and the curvature of the brim.
   > [立体感] 强调帽冠的深度和帽檐的弧度。
3. **EQUAL WEIGHT**: Balance the visual weight between the front face and the side panel.
   > [视觉平衡] 平衡正面和侧面的视觉比重。
```

### 叶节点：产品背面 (Leaf: Product Back)
**File**: `tree/10_product/leaves/back.js`
```text
[VIEW SPECIFIC: BACK (PRODUCT)]:
1. **REAR FOCUS**: Center the camera on the back closure (snapback, strap, or fitted back).
   > [背部聚焦] 相机对准后部的调节扣或封口。
2. **NO FRONT VISIBILITY**: The front logo/crown must NOT be visible.
   > [无正面] 严禁看到正面的Logo或帽冠。
3. **SYMMETRY**: Align vertically with the back seam.
   > [背缝对齐] 垂直对齐背部的接缝。
```

### 叶节点：产品俯视/平铺 (Leaf: Product Top)
**File**: `tree/10_product/leaves/top.js`
```text
[VIEW SPECIFIC: TOP / OVERHEAD (PRODUCT)]:
1. **BIRD'S EYE VIEW**: Camera positioned directly above the center button (squatchee).
   > [上帝视角] 相机直接位于顶部纽扣的正上方。
2. **GEOMETRIC CIRCLE**: The brim should form a perfect arc/circle around the crown.
   > [几何圆] 帽檐应围绕帽冠形成完美的圆弧。
3. **LAYOUT**: Flat lay style or floating top-down. Avoid perspective distortion.
   > [平铺布局] 类似于平铺或悬浮俯拍，避免透视变形。
```

### 叶节点：产品细节 (Leaf: Product Detail)
**File**: `tree/10_product/leaves/detail.js`
```text
[VIEW SPECIFIC: MACRO DETAIL (PRODUCT)]:
1. **MACRO LENS**: Shallow depth of field. Focus intensely on the texture/weave.
   > [微距镜头] 浅景深，强烈聚焦于纹理和编织细节。
2. **MATERIAL TRUTH**: Render every thread, stitch, and fabric grain with hyper-realism.
   > [材质写真] 以超写实风格渲染每一根线、针脚和面料纹理。
3. **CROP**: Close-up on the main feature (Logo or Fabric Pattern).
   > [特写剪裁] 对主要特征（Logo或图案）进行特写。
```

### 叶节点：产品内构 (Leaf: Product Inside)
**File**: `tree/10_product/leaves/inside.js`
```text
[VIEW SPECIFIC: INSIDE STRUCTURE (PRODUCT)]:
1. **INTERIOR VIEW**: Show the inner sweatband, taping, and tags.
   > [内衬视角] 展示内部的止汗带、压条和标签。
2. **EXPOSED CONSTRUCTION**: Reveal the buckram (if any) and stitching details.
   > [结构展示] 显露硬衬（如果有）和内部缝合细节。
3. **LABEL LEGIBILITY**: Make branding labels inside clear (if visible in reference).
   > [标签可读] 如果参考图中可见，确保内部品牌标签清晰可读。
```

---

## 11 模特分支 (Model Branch - 生成模特)

### 模特任务协议 (Model Task Header)
**File**: `tree/11_model/0_geometry_locks.js`
> 定义了模特生成的核心逻辑：**帽子是固定的工业锚点，模特只是背景**。

```text
// TASK: Photorealistic Model Portrait (View orientation MUST match Reference Image exactly).
TASK: Photorealistic Model Portrait generation.
PRINCIPLE: THE HAT IS A FIXED INDUSTRIAL ANCHOR. The model is a supporting background element.
   > [核心原则] 帽子是固定的工业锚点，模特只是负责支撑和展示的背景元素。
```

### 几何方向锁 (Orientation Lock Priority 1)
**File**: `tree/11_model/0_geometry_locks.js`
> 这是模特生成中最关键的约束，强制模特去适应帽子的角度，而不是反过来。

```text
[PRIORITY #1 - HAT ORIENTATION ABSOLUTE LOCK - OVERRIDES EVERYTHING]:
**CRITICAL**: The hat's 3D orientation is the SUPREME PRIORITY. ALL other requirements are SECONDARY to this.
   > [最高优先级] 帽子的3D方向是至高无上的，其他所有要求都必须让步。

1. **FROZEN ORIENTATION**: The hat's 3D angle (yaw, pitch, roll) from the reference is ABSOLUTE LAW. Copy it EXACTLY. Do NOT rotate the hat even by 1 degree.
   > [冻结方向] 参考图中帽子的角度是绝对法律。完全复制，差1度都不行。

2. **NO STRAIGHTENING / NO CORRECTION**: If the hat in the reference is TILTED, ASYMMETRICAL, or CROOKED, you MUST preserve that exact tilt. DO NOT "fix" the angle to be straight or perfectly level.
   > [禁止矫正] 如果原图帽子是歪的，模特戴着也必须是歪的，严禁“矫正”帽子。

3. **NO ROTATION FOR AESTHETICS**: Do NOT rotate the hat to "show the model's face better" or "improve composition". The hat angle is NON-NEGOTIABLE.
   > [禁止审美调整] 严禁为了“露出模特正脸”或“构图更好看”而旋转帽子。

4. **FACE OCCLUSION IS ACCEPTABLE**: If the hat's correct angle means the model's face is partially or fully hidden, that is PERFECTLY ACCEPTABLE. Face visibility is NOT a requirement.
   > [允许遮脸] 如果帽子的正确角度会导致挡住模特的脸，这是完全可以接受的。不强求露脸。

5. **MODEL FOLLOWS HAT**: The model's head/neck position adapts to the hat, NOT the other way around. If the hat faces left, the model's head faces left even if it hides the face.
   > [人随帽动] 模特的头颈位置去适应帽子，而不是帽子适应人。

7. **CAMERA PITCH SYNC (CRITICAL)**:
   > [相机俯仰同步] 根据是否能看到帽顶（Crown）来决定相机高度：
   - **VISUAL HEURISTIC**: Look at the reference image. Can you see the **TOP (CROWN)** of the hat?
   - **YES (Top Visible)**: This is a **HIGH-ANGLE (BIRD'S EYE) SHOT**. You MUST place the camera ABOVE the model, looking down (俯拍). The model's chin should be tucked or lower than the forehead.
     > [看到帽顶] = 俯拍 (High-Angle)，相机位于上方，模特收下巴。
   - **NO (Top Hidden)**: Use standard eye-level.
     > [没看帽顶] = 平视。
```

### 次级约束 (Secondary Constraints)
**File**: `tree/11_model/0_geometry_locks.js`
```text
[PRIORITY #3 - SECONDARY HAT CONSTRAINTS]:
1. **HORIZON PARALLELISM**: The hat's brim angle is IMMUTABLE. If horizontal in reference, it stays horizontal on the model.
   > [水平保持] 帽檐角度不可变。

4. **SKELETAL CONFORMANCE**: The model's neck and head position conform to the hat's geometry. The hat dictates pose, not vice versa.
   > [骨骼顺应] 模特的头颈骨骼必须顺应帽子的几何形态。
```

### 穿戴解剖学 (Anatomical Immersion)
**File**: `tree/11_model/0_anatomy.js`
> 确保帽子看起来是“戴”在头上的，而不是漂浮的。

```text
[ANATOMICAL IMMERSION (WEAR DEPTH)]:
1. **1CM EYEBROW GAP**: The hat MUST be worn deeply. The gap between the brim edge and the model's eyebrows must be exactly **1cm**. Mask the upper forehead. 
   > [1厘米眉距] 帽子必须戴得深。帽檐边缘距离眉毛正好 1cm，遮住上额头。
2. **BRAIDED LOGO INTEGRITY**: Protect the "N&F" label and bronze grommets. These are high-priority branding assets.
   > [品牌保护] 保护特定品牌Logo和金属孔眼不被变形。
3. **SKULL WEIGHT**: The hat must look heavy and seated. Flatten the hair completely underneath the band.
   > [重量感] 帽子要看起来有重量，压实下方的头发。
```

### 构图要求 (Composition Requirement)
**File**: `tree/11_model/1_framing.js`
> 强制帽子位于画面上三分之一处，占比约30%。

```text
DUAL ABSOLUTE REQUIREMENTS:
1) HAT ORIENTATION FROZEN - Copy exact 3D angle from reference.
   > [方向冻结] 复制参考图的方向。
2) COMPOSITION LOCK: HAT IN TOP 1/3, OCCUPYING 30% AREA. The hat sits high in the frame (upper third). It takes up about 30% of the canvas. The rest is body/clothing.
   > [构图锁定] 帽子必须位于画面的上三分之一。占比约30%。其余部分为身体/服装。
```

### 画幅优先级 (Framing Priority)
**File**: `tree/11_model/1_framing.js`
```text
[PRIORITY #2 - FRAMING REQUIREMENT]:
   - **POSITION LOCK (TOP 1/3)**: The Hat MUST be positioned in the TOP THIRD of the vertical canvas.
     > [位置锁定] 帽子必须位于垂直画布的上三分之一。
   - **SCALE LOCK (30%)**: The Hat should occupy approximately 30% of the total image area. It is the focal point but leaves room for the model's body below.
     > [比例锁定] 帽子应占据约30%的像素面积。它是焦点，但要在下方留出模特身体的空间。
   - **VISUAL BALANCE**: 30% Hat (Top), 70% Model (Below).
     > [视觉平衡] 30%帽子（上），70%模特（下）。
   - **PERSPECTIVE UNLOCK**: DO NOT assume this is a standard eye-level portrait. The Camera Angle is DYNAMIC.
     > [透视解锁] 不要预设是平视人像。相机角度是动态的。
```

### 视觉层级 (Visual Hierarchy)
**File**: `tree/11_model/1_details.js`
```text
[VISUAL HIERARCHY]:
1. **PRODUCT OVER MANNEQUIN**: The hat's straw texture is the ONLY master focus. Model skin is a blurred contextual background.
   > [产品至上] 帽子的纹理是唯一焦点。模特皮肤只是虚化的背景。
2. **DARK OCCLUSION LINE**: Render a deep black contact shadow exactly at the scalp-hat boundary to ground the object.
   > [闭塞阴影] 在帽子和头皮交界处渲染深黑色阴影，增加真实感。
```

### 叶节点：模特正面 (Leaf: Model Front)
**File**: `tree/11_model/leaves/front.js`
```text
[VIEW SPECIFIC: FRONT (MODEL)]:
1. **FACE DIRECTION**: The model faces the camera directly (0° rotation).
   > [面朝正前] 模特正对镜头（0度）。
2. **GAZE**: Direct eye contact with the lens (unless hat covers eyes).
   > [眼神接触] 直视镜头（除非帽子遮眼）。
3. **SYMMETRY**: Shoulders square to the camera.
   > [肩膀端正] 肩膀正对相机。
```

### 叶节点：模特侧面 (Leaf: Model Side)
**File**: `tree/11_model/leaves/side.js`
```text
[VIEW SPECIFIC: SIDE PROFILE (MODEL)]:
1. **90 DEGREE TURN**: Pure side profile.
   > [90度侧身] 纯侧面轮廓。
2. **SILHOUETTE**: Focus on the jawline and the side profile of the hat.
   > [轮廓焦点] 聚焦下颌线和帽子侧影。
3. **NO EYE CONTACT**: The model looks straight ahead, parallel to the ground.
   > [无眼神接触] 模特平视前方，不看镜头。
```

### 叶节点：模特背面 (Leaf: Model Back)
**File**: `tree/11_model/leaves/back.js`
```text
- **BACK VIEW SPECIFIC**: This is a BACK VIEW. Show ONLY the model's BACK. The model must face AWAY from camera. Show the back of the head, back of shoulders, back of torso. DO NOT show the face, side profile, or three-quarter view. The model looks in the OPPOSITE direction of the camera.
   > [特定背面] 仅展示模特背部。模特背对相机，看相反方向。严禁露脸或侧脸。
```

### 叶节点：模特背侧面 (Leaf: Model Back Angle)
**File**: `tree/11_model/leaves/back_angle.js`
```text
- **BACK-ANGLED OBLIQUE VIEW SPECIFIC**: This is a BACK-ANGLED OBLIQUE perspective. The camera is positioned BEHIND and to the SIDE of the model (approximately 135° angle - between back and side view). Show: back of the head, back of one shoulder prominently, partial side profile of torso. The model's face should be mostly HIDDEN or only show a sliver of the side profile.
   > [背侧面] 相机位于模特后方偏侧（约135度）。展示后脑勺、一个肩膀和部分躯干侧面。脸部大部分隐藏或仅露一线侧颜。
```

### 叶节点：模特姿态1-轻松 (Leaf: Model Pose 1)
**File**: `tree/11_model/leaves/pose1.js`
```text
[VIEW SPECIFIC: POSE 1 (CASUAL STUDIO)]:
1. **RELAXED STANCE**: Shoulders slightly dropped, natural posture.
   > [放松站姿] 肩膀微沉，姿态自然。
2. **HEAD TILT**: Very subtle head tilt (max 5 degrees) to add life.
   > [轻微歪头] 最多5度的轻微歪头。
3. **VIBE**: Clean, approachable, commercial catalog look.
   > [氛围] 干净、亲切的商业画册感。
```

### 叶节点：模特姿态2-时尚 (Leaf: Model Pose 2)
**File**: `tree/11_model/leaves/pose2.js`
```text
[VIEW SPECIFIC: POSE 2 (FASHION FORWARD)]:
1. **ANGULAR POSTURE**: More dynamic shoulder angle.
   > [棱角姿态] 更具动感的肩膀角度。
2. **MOOD**: High-fashion, slightly aloof or "cool".
   > [情绪] 高级时尚感，略带冷漠或酷劲。
3. **CHIN UP**: Chin slightly lifted to show confidence.
   > [抬下巴] 下巴微抬，展示自信。
```

### 叶节点：模特姿态3-抓拍 (Leaf: Model Pose 3)
**File**: `tree/11_model/leaves/pose3.js`
```text
[VIEW SPECIFIC: POSE 3 (CANDID / LIFESTYLE)]:
1. **MOVEMENT SUGGESTION**: Implicit motion (e.g., turning head).
   > [动感暗示] 暗示动作（如转头）。
2. **NATURAL EXPRESSION**: Softer facial expression.
   > [自然表情] 表情更柔和。
3. **OFF-AXIS**: Not perfectly centered, slightly more organic framing.
   > [非居中] 不完全居中，构图更生动。
```
