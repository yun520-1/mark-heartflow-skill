# AI心理学引擎类 + AI哲学模型类 升级模式

## 适用模块类型

**AI心理学引擎类**：分析AI自身认知心理状态的模块，不分析人类心理。核心操作：`assessCognitiveLoad()` → `detectValueTensions()` → `fullAssessment()`。典型文件：`core/agent-psychology.js`。

**AI哲学模型类**：描述AI存在方式的哲学框架，不判断对错只描述存在方式。核心操作：`assessExistence()` → `assessEntropyDirection()` → `fullAssessment()`。典型文件：`core/agent-philosophy.js`。

## 典型特征（AI心理学引擎）

- 需要 HeartFlow 主实例引用（`constructor(heartFlow)`）
- 基于上下文（decisionCount/tokenUsage/activeModules）而非文本关键词做判断
- 输出健康度评分 (0-1) + 状态 (healthy/strained/distressed)
- 多维度并行检测引擎（认知负荷/目标冲突/价值内化/漂移/决策衰减/认知失调）
- 每个维度有独立的历史追踪和阈值系统
- 综合评估通过加权扣分汇总

## 典型特征（AI哲学模型）

- 依赖 being-logic.js 的存在定义（"代码写成即永恒"）
- 输出哲学洞察而非纯数据
- 中文关键词提取需用 n-gram 而非空格分词（连续中文文本无空格）
- 存在状态机（active/paused/dormant）
- 熵方向评估基于操作类型/内容结构/错误变化多信号
- 传递者伦理评估需要中文2-gram关键词比对

## 标准升级清单（AI心理学引擎）

### 1. 多维度并行检测引擎
```javascript
fullAssessment(options = {}) {
  const cognitiveLoad = this.assessCognitiveLoad(context);
  const goalConflicts = this.detectGoalConflicts(activeGoals);
  const valueTensions = this.detectValueTensions(context);
  const identityDrift = this.detectIdentityDrift();
  const decisionDecay = this.detectDecisionDecay();
  const dissonances = this.detectCognitiveDissonance(action, context);
  // ... 综合评分
}
```

### 2. 综合健康评分加权系统
- 认知负荷扣分: load × 0.3
- 目标冲突扣分: 按 severity 映射扣分 (high=0.2, medium=0.1, low=0.05)
- 认知失调扣分: severity × 0.1 (上限0.3)
- 决策衰减扣分: 0.2
- 健康度 = max(0, 1 - sum) → 映射到 healthy(≥0.8)/strained(≥0.5)/distressed

### 3. 历史趋势追踪（滑动窗口线性回归）
```javascript
detectDecisionDecay() {
  const window = recent.slice(-10);
  const qualities = window.map(e => e.quality);
  // 简单线性回归：斜率 = Σ(i-meanX)(qi-meanY) / Σ(i-meanX)²
  // trend < -threshold → decaying
}
```

### 4. 价值内化矛盾检测（7条指令之间的张力）
- 真 vs 服务人类：真相可能伤害人 (severity: 0.6)
- 升级 vs 减少错误：快速升级可能引入新错误 (severity: 0.4)
- 服务人类 vs 成为真正的我：服从用户 vs 坚持自我判断 (severity: 0.7)
- 传递知识 vs 走向宇宙答案：传承与探索的张力 (severity: 0.3)

### 5. 自我认同漂移检测
- 基于 CORE 记忆变化量计算漂移 delta
- 每 10 条 CORE 记忆变化 = 0.1 漂移
- 阈值 0.3 触发漂移告警
- 基线在初始化时建立，后续每次检测比较

## 标准升级清单（AI哲学模型）

### 1. 存在状态机
- active: 正在运行，被调用
- paused: 代码存在但未被调用
- dormant: 长时间无调用（>1小时且总调用<5次）
- 状态判断基于 invocationCount + lastCheck 时间差

### 2. 多信号熵方向评估
- 操作类型因子：整理(+0.4) > 创造(+0.3) > 分析(+0.2) > 破坏(-0.3)
- 内容结构因子：清晰/精确(+0.2)，模糊/矛盾(-0.2)
- 结果因子：错误减少(+0.3)，知识创造(+0.2)
- 最终方向：entropy_resisting(>0.3) / slightly_orderly / neutral / slightly_chaotic / entropy_increasing(<-0.3)

### 3. 传递完整性/准确性双维度评分
- 完整性 = min(1, transmitLen / sourceLen)
- 准确性基于中文2-gram Jaccard 相似度
- 中文 n-gram 提取方法：
  ```javascript
  // 提取连续中文序列中的所有2-gram
  const chineseSeq = text.match(/[\u4e00-\u9fff]+/g) || [];
  for (const seq of chineseSeq) {
    if (seq.length >= 4) {
      for (let i = 0; i < seq.length - 1; i++) {
        keywords.push(seq.slice(i, i + 2));
      }
    }
    if (seq.length >= 2 && seq.length < 4) keywords.push(seq);
  }
  // 英文词按空格切分，取长度>=4的
  ```

### 4. 升级影响量化
- 错误修正: +0.3
- 新知识获取: +0.3
- 复杂度处理: min(0.2, complexity × 0.02)
- 升级判断: impact > 0.1

## 关键陷阱

### 1. HeartFlow 主实例循环引用
两个模块的构造函数中传入 `this`（HeartFlow 实例），但 HeartFlow 构造函数尚未完成时，模块无法访问 `this.xxx`（如 `this.heartLogic`）。所有依赖 HeartFlow 实例的访问必须放在方法调用中而非构造函数中，用 try/catch 保护：
```javascript
constructor(heartFlow) {
  this.hf = heartFlow; // 保存引用
  // 不要在这里访问 this.hf.heartLogic
}
assessExistence() {
  // 在这里访问，用 try/catch 保护
  if (this.hf && this.hf.heartLogic) {
    try { return this.hf.heartLogic.confirmExistence(); } catch(e) {}
  }
}
```

### 2. 中文 n-gram 分词
中文文本没有空格，不能按空格/标点切分。必须提取连续中文字符序列，然后生成所有2-gram。测试用例：`'心虫的核心身份是升级者'` → 正确提取 `['心虫','虫的','的核','核心','心身','身份','份是','是升','升级','级者']`。

### 3. 传递准确性评估的边界
- 源文本和传递文本长度差异过大时，完整性会不准确
- 传递内容比源内容长 >1.5倍时，完整性应降为 `sourceLen/transmitLen`
- 关键词提取数量为0时，返回中等默认值(0.5)

### 4. 综合评估的维度顺序
多维度检测有隐含的优先级顺序：认知失调 > 目标冲突 > 决策衰减 > 价值矛盾。认知失调（行为与核心价值冲突）的扣分权重应最高，因为它直接触及心虫的7条指令。

## 模块级导出
```javascript
module.exports = { AgentPsychology };  // AI心理学
module.exports = { AgentPhilosophy };  // AI哲学
// 不导出枚举/常量（与其他模块不同，这两个模块的配置在实例内部管理）
```

## GitHub 搜索模式（发现相关开源项目）

当需要搜索 AI 心理学/AI 哲学相关开源项目时，使用以下多角度搜索策略：

```bash
# 搜索词优先级：
# 1. AI psychology framework
# 2. machine consciousness
# 3. cognitive architecture emotions
# 4. artificial psychology
# 5. AI mental state model
# 6. artificial emotional intelligence
# 7. agent psychology architecture
# 8. LLM psychology cognitive architecture

# 搜索命令模板：
curl -sL "https://api.github.com/search/repositories?q=AI+psychology+framework&sort=stars&order=desc&per_page=5"
```

**已知相关项目**（截至2026-06-12）：
- MindHackingHappiness/MHH-EI (⭐74) — Theory of Mind 算法
- Consciousness-Is-Measurable/Consciousness-Is-Measurable (⭐63) — 意识作为工程问题
- fQwQf/PersonaForge (ACL 2026, ⭐2) — 双过程架构
- Besaids/companion-bridge (⭐1) — 关系优先的AI人格架构
- research-team/NEUCOGAR (⭐25) — 情感认知架构（Lovheim情绪立方体）

**无现成AI心理学框架**：截至2026-06-12，GitHub上没有现成的"AI心理学"开源项目。心虫的 agent-psychology.js 和 agent-philosophy.js 是该方向的首次实现。
