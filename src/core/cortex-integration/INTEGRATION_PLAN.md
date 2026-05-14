# CAPY Cortex 集成方案

## 目标

将 CAPY Cortex 的自我进化机制集成到 HeartFlow，让自我进化引擎真正工作。

## CAPY Cortex 核心机制

### 1. 7个Lifecycle Hooks
- `on_session_start`: 加载反模式+原则+偏好
- `on_prompt_submit`: Triple Fusion检索相关规则
- `on_pre_bash`: 阻止已知危险命令
- `on_pre_write`: 强制文件大小限制
- `on_tool_success`: 成功→增强规则置信度
- `on_tool_failure`: LLM根因分析+质量门限
- `on_stop`: 提取纠正+偏好+会话学习

### 2. 质量门限
- 每个提取的洞察按4个维度评分（0-4）
- **阈值: 2/4** — 低于此分数丢弃
- 四维度：Actionable、Specific、Novel、Durable

### 3. Triple Fusion检索
- FTS5全文搜索 + TF-IDF嵌入 + 实体图
- 通过Reciprocal Rank Fusion融合
- <10ms延迟

### 4. 强化循环
- 成功的规则 → 增加置信度
- 不成功的规则 → 置信度衰减（90天半衰期）

## HeartFlow现有问题

1. decision-loop-state.json 全部 simulated，executed=false
2. healing-rl-state.json Q-table只有2条记录
3. 没有真正的错误捕获机制
4. 没有质量门限
5. 没有Triple Fusion检索

## 集成步骤

### Phase 1: 基础集成（立即可做）
1. 将CAPY Cortex的hooks作为HeartFlow的error-capture模块
2. 使用CAPY的质量门限机制替代当前的"记录一切"
3. 创建cortex.db SQLite数据库

### Phase 2: 检索集成
1. 集成Triple Fusion检索到HeartFlow的memory系统
2. 使用FTS5替代当前的简单JSON存储

### Phase 3: 强化循环
1. 实现真正的强化学习循环
2. 替代当前的空壳Q-table

## 风险

1. CAPY Cortex是Python，HeartFlow是JavaScript/TypeScript
2. 需要适配层
3. LLM提取API调用成本

## 下一步

等待确认后执行Phase 1。
