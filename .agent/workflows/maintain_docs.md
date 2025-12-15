---
description: 维护功能文档的工作流
---

当代码库中的功能模块发生变更、新增或删除时，执行此工作流以保持 `functional_documentation.md` 的准确性。

1.  **识别变更范围**:
    *   查看本次修改涉及的文件。
    *   如果是 `src/services` 下的文件，检查是否涉及 API 逻辑变更。
    *   如果是 `src/components` 下的文件，检查是否涉及 UI/UX 流程变更。
    *   如果是 `PROMPT_SPEC.md`，检查是否涉及核心 Prompt 规则变更。

2.  **更新文档**:
    *   打开 `functional_documentation.md`。
    *   **核心引擎**: 如果 `PROMPT_SPEC.md` 有变动，更新 "1. 核心引擎" 部分。
    *   **服务层**: over if API function signatures or logic changed, update "2. 服务层".
    *   **前端组件**: over if component responsibilities changed, update "3. 前端组件".

3.  **验证**:
    *   阅读更新后的文档，确保描述清晰且与代码实际行为一致。
    *   (可选) 如果是重大变更，通知团队成员审阅文档。
