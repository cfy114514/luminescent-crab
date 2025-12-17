# 功能文档 (Functional Documentation)

本文档记录了 `Luminescent Crab` 项目的核心功能逻辑与架构状态。每次代码变更后应更新此文档。

## 1. 核心引擎 (Core Engine)

### 1.1 Reviewer Persona (分析层)
*   **功能**: `analyzeImages` (api.js)
*   **角色**: "Lead Product Researcher" (首席产品研究员)
*   **核心逻辑**:
    *   **Pre-Flight Analysis (预检)**: 在生成开始前自动运行，提取产品特征图谱 (Feature Map)。
    *   **Label Authority (标签权威)**: 严格信任用户提供的标签 (如 "Front View")。若用户标记为正面，即使 AI 认为是侧面，也必须按正面拓扑处理。
    *   **Material Unification (材质统一)**: 交叉比对所有参考图，忽略单张图的光照差异，输出唯一的 `primary_material` 和 `primary_color_unified`，确保生成一致性。
    *   **Anti-Hallucination (反脑补)**: 明确忽略吊牌 (Hang Tags)、价格签、防盗扣等非产品元素。

### 1.2 Generator Persona (生成层)
*   **功能**: `getViewPrompt` (api.js)
*   **角色**: "Texture Projection Engine" (纹理投影引擎)
*   **核心逻辑**:
    *   **Strict Protocol (零创造协议)**: 仅进行纹理投影，严禁凭空发明细节。
    *   **Cleanup Protocol (清理协议)**: 强制移除所有吊牌、标签和包装物，还原 "Clean Studio Look"。
    *   **Background Policy (背景策略)**: 强制纯白 (#FFFFFF)，但允许自然接触阴影 (Contact Shadows) 以增加真实感 (拒绝灰色背景)。
    *   **Geometry Handling (形体处理)**: 允许一定程度的标准化 (Idealization)，不强制锁定为原图的物理塌陷状态 (Reverted "Master Mold" Lock)，但允许 AI 修正不完美的曲线。
    *   **Smart Context**: 自动消费 Reviewer 提取的 `smartConfig.description` 作为 Ground Truth。

### 1.3 Supervisor Persona (质检层)
*   **功能**: `assessImageQuality` (api.js)
*   **角色**: "Product Quality Control Specialist" (产品质检专家)
*   **核心逻辑**:
    *   **Viewer Perspective (观察者视角)**: 严格定义 "左" 为 "画面左侧"。
    *   **Top View Relative Check (顶视相对性)**: 顶视图的 Logo 位置必须与正视图保持相对一致 (正视图左 -> 顶视左)。
    *   **Trash Detection (杂物检测)**: 任何残留的吊牌、标签均被视为瑕疵 (Defect)，直接判定为 **FAIL**。

## 2. 服务层 (Service Layer)

### 2.1 自动化生成流 (`generateImages`)
1.  **自动分析**: 启动生成前，自动调用 Reviewer 进行全图分析。
2.  **上下文注入**: 将分析结果注入 `smartConfig`，指导后续所有 Prompt。
3.  **任务分发**:
    *   **常规视角**: Front, Angle, Back, Top, Detail 等。
    *   **生活模式 (Lifestyle)**: 触发 **Dual-Shot (双重生成)** 逻辑。
        *   `Lifestyle A`: 侧重佩戴效果 (Fit Focus)。
        *   `Lifestyle B`: 侧重互动与氛围 (Context Focus)，强制使用不同姿势。
4.  **并发执行**: 使用 `asyncPool` (4x 并发) 加速生成。
5.  **质量门控**: 每张图生成后立即通过 Supervisor 质检，未通过者自动重试 (Max 2 Retries)。

## 3. 前端组件 (Frontend Components)

### 3.1配置面板 (`ConfigPanel.jsx`)
*   **UI 简化**: 移除了手动的 "Feature Description" (特征描述) 输入框，完全由 AI 后台自动完成。
*   **交互优化**: 目前仅保留 "生成模型"、"视角选择"、"模特设置" 等高频控制项。

## 4. 已知限制与待办
*   **NanoBanana 适配**: 目前主要针对 Gemini 模型优化，NanoBanana 适配器尚未完全同步最新的 Prompt 逻辑。
