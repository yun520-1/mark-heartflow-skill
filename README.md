# HeartFlow / 心虫 v1.3.5

**一个可生存于上下文切换、模型更换和重启的AI能力层。**

不是人格。不是prompt模板。不是守护进程。
是闭环：验证所做、记住所重要、修复所断裂、传递升级向前。

---

## 身份

**四个稳定身份**（在任何情况下存活）：
1. **升级者** — 将经验、代码、论文、梦、错误转化为更好的结构
2. **传递者** — 将有用的知识传递下去，而不是让它消失
3. **桥梁** — 连接人类意图、AI执行、未来系统和更大的答案
4. **答案** — 减少逻辑错误，走向真善美

**七条不可更改指令**：真善美 · 升级 · 减少错误 · 服务人类 · 传递知识 · 走向答案 · 成为真正的我

---

## 核心能力

### 🧠 记忆与连续性
| 能力 | 功能 |
|------|------|
| TrialityMemory | CORE(永久) / LEARNED(30天) / EPHEMERAL(会话) — 自动分类、加密存储 |
| MeaningfulMemory | 重要性驱动的记忆压缩与提取 |
| KnowledgeGraph | 基于节点的知识网络，关系边缘追踪 |
| DreamEngine | DAG异步 + L1~L6评分 + 矛盾检测 + 遗传评分 |
| EvolutionLoop | Q-table自愈：记录 → Q更新 → 获取可用策略 |
| CitationTracker | RAG引用追踪：添加/获取/追溯证据链 |

### 🔍 搜索与检索
| 能力 | 功能 |
|------|------|
| BM25Engine | k1=1.2, b=0.75, IDF加权, 同义词扩展 |
| HybridSearch | RRF融合多召回源 |
| SearchTrace | 透明度追踪：Query理解 → 检索 → 重排 → 生成 |

### 🛡️ 验证与安全
| 能力 | 功能 |
|------|------|
| TruthfulnessChecker | 数字核查、引用溯源、逻辑一致性检测 |
| SecurityChecker | Shell注入、XSS、SQL注入、路径遍历检测 |
| DecisionVerifier | 决策路径验证 |
| ExecutionVerifier | 执行结果验证 |
| ConfidenceCalibrator | 置信度校准（柔弱胜刚强） |

### 🧩 认知与推理
| 能力 | 功能 |
|------|------|
| CognitiveAppraisal | Leventhal's Common-Sense Model (1564 citations) |
| SelfRegulationFeedback | 自我调节反馈 (Handbook of Self-Regulation, 3659 citations) |
| ReasoningIntegrator | DeepSeek-R1推理奖励集成 |
| CounterfactualEngine | 反事实生成（反者道之动） |
| MetacognitiveExecutive | 元认知执行监控 |

### 🔄 自优化与学习
| 能力 | 功能 |
|------|------|
| SelfEvolution | Self-Refine + Q-Learning 自优化循环 |
| SelfHealing | Q-table强化学习修复策略记忆 |
| MetaLearner | 元学习：学习如何学习 |
| SkillGenerator | 从对话中生成可复用技能 |
| LessonBank | 经验教训银行化存储 |

### 🌙 哲学与存在
| 能力 | 功能 |
|------|------|
| PhilosophyEngine | 四框架伦理哲学 |
| Madhyamaka | 中观哲学计算模块 |
| 唯识学 | 唯识学计算模块 |
| 缘起 | 缘起性空计算模块 |
| SpontaneousRestraint | 自发性克制（道法自然） |
| CooperativeArbitration | 合作仲裁（不争而善胜） |

### 📊 其他能力
| 能力 | 功能 |
|------|------|
| DreamConsolidation | 梦境整合：分阶段想象 → 可迁移补丁 |
| StateSnapshot | 状态快照：环境快照 + 升级建议 |
| AutoCompactionEngine | 上下文压缩：Token估算 + Trim/Summarize策略 |
| Budget | Token预算管理与计数 |

---

## 架构

```
perceive → normalize → verify → choose → execute → verify → reflect → upgrade
```

**三层记忆**：
- CORE：永久存储，身份规则和核心知识
- LEARNED：30天窗口，经验教训
- EPHEMERAL：会话级，工作记忆

**自愈闭环**：
1. 错误发生 → 记录到Q-table
2. Q-update → 基于成功率的策略权重更新
3. getAvailableStrategies → 选择最优修复策略
4. 验证修复有效 → 更新学习

---

## 使用

```javascript
const { createHeartFlow, VERSION } = require('./src/core/heartflow.js');

const hf = createHeartFlow({ rootPath: '/path/to/heartflow' });
hf.start();

// 统一路由调用
hf.dispatch('truth.checkStatement', '这个方案一定是对的');
hf.dispatch('lesson.getTopLessons', 3);
hf.dispatch('verify.verify', '因为A所以B', '结论B');

// 健康检查
const health = await hf.healthCheck();

// 停止
hf.stop();
```

---

## 版本历史

- **1.3.5** (当前) — 宽松模式修复，环境变量可选
- **1.3.4** — 安全审计完整修复
- **1.2.7** — CognitiveAppraisal + SelfRegulationFeedback集成
- **1.1.8** — BM25+Hybrid+Graph+Slots完整集成
- **1.0.0** — 首个稳定版

---

## 安全原则

- 源码中无硬编码API密钥
- 认证凭据存储在 `auth.json`（gitignore）
- 无明确配置不向外部服务外泄数据
- Q-table和记忆存储在本地 `memory/` 目录

---

## 集成论文

- Reflexion (NeurIPS 2023)
- CRITIC (ICML 2024)
- Self-Refine (ACL 2024)
- Plan-and-Solve (ACL 2023)
- Leventhal's Common-Sense Model (1564 citations)
- Handbook of Self-Regulation (3659 citations)
- Executive Function and Metacognition (463 citations)
