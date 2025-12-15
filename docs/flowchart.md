# 下一步实现目标 (Next Gen Implementation Goal)

This flowchart represents the target architecture for the next version of the system, introducing a robust backend, AI supervision, and a manual review loop.

```mermaid
flowchart TD
    %% 样式定义
    classDef ui fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef backend fill:#fff3e0,stroke:#ff6f00,stroke-width:2px;
    classDef ai fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef storage fill:#eceff1,stroke:#455a64,stroke-width:2px;
    classDef alert fill:#ffebee,stroke:#c62828,stroke-width:2px,stroke-dasharray: 5 5;

    %% --- UI 层 (前台) ---
    subgraph UI_Layer ["💻 运营管理后台 (UI)"]
        User(["运营人员"]) -->|1. 批量上传 SKU| Upload["任务创建面板"]
        Upload -->|2. 配置要求 (静物/模特)| Config["参数配置"]
        Config -->|3. 提交任务| Submit["发送请求"]
        
        %% 实时状态反馈
        StatusDisplay["状态监控大屏\n(显示: 生成中 / 质检中 / 重绘中)"]
        ResultView["结果审核页"]
        ManualFix["人工修复入口"]
    end

    %% --- 逻辑层 (后台) ---
    subgraph Logic_Layer ["⚙️ 后端服务 (Backend)"]
        Submit -->|API 接收| Dispatcher["任务分发器"]
        Dispatcher -->|拆分12个并发槽位| Queue["消息队列 (Redis)"]
        
        %% 状态推送到 UI
        Queue -.->|WebSocket 推送进度| StatusDisplay
        
        %% AI 处理管线
        subgraph AI_Pipeline ["AI 生产流水线"]
            Queue --> Gen["🚀 生成: NanoBanana Pro"]
            Gen --> Check["👮 质检: Gemini Supervisor"]
            
            Check --> Decision{"评分 > 8?"}
            
            %% 自动重绘闭环
            Decision -- "否 (尝试修复)" --> RetryCheck{"重试 < 2次?"}
            RetryCheck -- "是" -->|调整 Prompt/Seed| Gen
            
            %% 结果分流
            Decision -- "是 (合格)" --> TagPass["标记: ✅ Auto-Pass"]
            RetryCheck -- "否 (熔断)" --> TagFail["标记: ⚠️ Need-Human"]
        end
    end

    %% --- 存储层 ---
    subgraph Data_Layer ["💾 数据存储"]
        TagPass & TagFail --> DB[(数据库)]
        DB -->|加载数据| ResultView
    end

    %% --- 闭环交互 ---
    ResultView -->|查看合格品| User
    ResultView -->|筛选'待修复'项| ManualFix
    ManualFix -->|人工PS后回传| DB

    %% 连接线说明
    class User,Upload,Config,Submit,StatusDisplay,ResultView,ManualFix ui;
    class Dispatcher,Queue,TagPass,TagFail,RetryCheck backend;
    class Gen,Check,Decision ai;
    class DB storage;
    class TagFail,ManualFix alert;
```
