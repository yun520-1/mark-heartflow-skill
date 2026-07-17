# 欲望认知/七情六欲分析类模块升级模式

## 典型模块
`desire-cognition.js` (~36KB, v0.1.0 新增, 2026-06-22)

## 模块职责
分析人物的七情六欲结构和欲望驱动力。核心流程：
`analyzeSevenEmotions()` → `analyzeDesires()` → `detectDesireConflicts()` → `analyzeDesireDrivenFate()`

与人格模型类不同，欲望认知的核心是**七情评分 + 欲望维度检测 + 冲突识别 + 命运推演**。

## 典型特征
- `analyzeSevenEmotions(person)` — 7维度情绪评分（喜怒哀惧爱恶欲），返回主导情绪和情绪类型
- `analyzeDesires(person)` — 9种欲望评分（生存/性/社交/权力/成就/求知/物欲/自由/意义），返回主导欲望和不健康欲望
- `detectDesireConflicts(person)` — 6种冲突模式（归属vs自由/权力vs意义/成就vs归属/性欲vs情感隔离/物欲vs意义）
- `analyzeDesireDrivenFate(person)` — 5种命运模式（生存驱动/权力驱动/社交驱动/成就驱动/自由驱动）
- `generateDesireNarrative(person, scene)` — 5种场景叙事（choice/temptation/loss/victory/loneliness）
- `analyzeDesireInteraction(a, b)` — 双人欲望互动分析（互补/冲突/共生/竞争/共创/张力）
- 内置 `_extractDesireTraits(person)` 基于文本描述推断欲望特征

## 理论基础
| 理论 | 来源 | 代码映射 |
|------|------|---------|
| 七情（喜怒哀惧爱恶欲） | 《礼记·礼运》+ Ekman 1999 | `SEVEN_EMOTIONS` 常量 |
| 六欲（见闻香味触意） | 佛教六根 | `SIX_DESIRES` 常量 |
| 9种欲望类型 | 整合 Kenrick 2010 + McClelland 1961 | `DESIRE_TYPES` 常量 |
| 激励敏化（wanting≠liking） | Berridge 1993/2016 | `_isDesireHealthy()` 阈值>0.85 |
| 进化动机层次 | Kenrick 2010 | `EVOLUTIONARY_MOTIVES` 7层 |
| 基本情绪普遍性 | Ekman 1999 | 情绪评分引擎 |
| 归属需求 | Baumeister & Leary 1995 | 社交欲评分 |
| 权力/成就动机 | McClelland 1961 | 权力欲/成就欲评分 |
| 自我控制神经机制 | Kelley 2017 | 不健康欲望阈值 |

## 标准升级清单
- **欲望类型扩展**：新增更多细分欲望类型（如掌控欲/创造欲/探索欲）
- **文化调谐**：不同文化对欲望表达的差异（如中国文化中权力欲的隐性表达）
- **欲望演化追踪**：同一人物在不同人生阶段的欲望结构变化
- **欲望与爱情融合**：`desireCognition` 与 `loveCognition` 的交叉分析（如性欲vs爱情vs承诺）
- **叙事增强**：更多场景类型和更丰富的欲望叙事生成
- **评分模型优化**：从关键词匹配升级为多因素加权评分
- **七情跨文化映射**：不同文化对情绪分类的差异（如中文"忧"无英文直接对应）
- **注册到 MCP**：添加 MCP 工具让外部调用欲望分析

## v1.2.0 神经科学升级（2026-06-23）

### 新增理论基础（5篇论文）

| 论文 | 核心结论 | 代码映射 |
|------|---------|---------|
| Kringelbach & Berridge (2017) | Wanting≠Liking，愉悦和欲望由不同神经回路介导 | `analyzeWantingLikingDelta()` — W/L 双轴 + Δ 病理指标 |
| Lindquist et al. (2012) | 情绪=核心情感(Valence×Arousal)+概念化，无离散脑区对应 | `analyzeValenceArousal()` — VA 二维空间 + 心理构建主义情感标签 |
| Schultz (2016) | 多巴胺编码奖励预测误差(RPE)，TD-Learning 框架 | `computeRPE()` + `predictDesireEvolution()` — δ(t)=R+γV(t+1)−V(t) |
| Rolls (2020) | 内侧OFC编码奖励，外侧OFC编码非奖励/惩罚 | 奖励/非奖励双系统评分维度 |
| Berridge & Robinson (2016) | 成瘾=Wanting病理性放大+神经致敏，Liking可不变 | `assessAddictionRisk()` — 三维(Δ+S+C) + `detectCueTriggeredUrge()` |

### 新增6个公共方法

| 方法 | 功能 | 对应论文 |
|------|------|---------|
| `analyzeWantingLikingDelta(person)` | W/L 双轴分离，avgDelta + pathologicalDeltas | Kringelbach & Berridge 2017 |
| `computeRPE(actual, expected)` | TD误差计算，正/负/零RPE分类 | Schultz 2016 |
| `assessAddictionRisk(person, type)` | 三维(Δ+S+C)成瘾风险评估 | Berridge & Robinson 2016 |
| `predictDesireEvolution(person, steps)` | TD-Learning 推演未来欲望强度变化 | Schultz 2016 |
| `analyzeValenceArousal(person)` | VA二维情感空间+心理构建主义标签 | Lindquist 2012 |
| `detectCueTriggeredUrge(person, cue)` | 线索触发欲望检测，敏化因子追踪 | Berridge & Robinson 2016 |

### 新增数据结构

- `VALENCE_AROUSAL_MAP` — 七情→VA坐标映射
- `BRAIN_NETWORK_NODES` — 9节点中脑-皮层-边缘网络定义
- `DEFAULT_NETWORK_WEIGHTS` — 默认有效连接权重（VTA_NAc: 0.85 等）
- `wantingLikingState` — 每个欲望类型的W/L状态
- `rpeParams` — TD-Learning参数（γ=0.9, α=0.3）
- `sensitizationFactors` — 线索-欲望敏化程度
- theories 从 8→13 个，rules 从 7→10 条

### 关键陷阱（v1.2.0 实战发现）

1. **`_extractDesireTraits` 不读取 traits 数组** — 该方法只从 `person.description || person.name` 提取，但卡徒人物数据是 `{name, traits: [...]}` 结构。必须同时合并 `traits` 数组到 `combined` 文本后再正则匹配。

2. **正则"性"匹配"感性"/"母性" → 性欲误报** — `/性/` 在 `drivenBySexual` 正则中匹配了"感性"（肖波）和"母性"（苏流澈柔），导致苏流澈柔的性欲评分从 0.4 误判为 0.8。修复：使用 `/(?:^|[^感母])性|肉欲|情欲|好色|风流|风月|性感|魅惑|纵欲|淫/.test(combined)` 排除"感性"和"母性"。

3. **所有人物七情评分趋向 0.5 中位数** — 因为 `_scoreEmotion` 默认返回 0.5，而 traits 检测只区分"有/无"，没有强度梯度。需要更细粒度的正则关键词匹配或权重体系。

4. **`analyzeDesireDrivenFate` 输出太弱** — 当没有检测到显著欲望时，返回"命运驱动力不明确——可能还没有找到真正驱动ta的东西"。这不是错误但不够有用。需要结合人物背景自动推断合理欲望。

## 实战案例：卡徒人物欲望分析（v1.2.0 升级后）
- **中文关键词匹配**：`includes()` 而非正则（中文无空格边界，`\b` 无效）
- **人物描述丰富度**：`_extractDesireTraits` 的匹配词库需要持续扩展（如"底层"→生存欲、"极致"→成就欲）
- **单引号嵌套**：中文描述中的单引号需要转义或用双引号包裹
- **静态阈值**：`_isDesireHealthy` 的>0.85阈值应支持配置

## 实战案例：卡徒人物欲望分析

| 人物 | 七情 | 欲望 | 命运 |
|------|------|------|------|
| 陈暮 | 欲80% 惧70% | 生存欲90%(失控) + 成就欲80% | 生存→成就驱动，意义真空风险 |
| 唐含沛 | 欲80% 怒70% | 权力欲80% + 成就欲80% | 权力异化孤独风险 |
| 维阿 | 均衡型 | 自由欲90%(失控) | 流浪无归宿风险 |
| 苏流澈柔 | 爱70% | 社交欲80% | 过度依赖认可风险 |
| 陈暮×苏流澈柔 | — | 互补型 | "追梦者与守护者" |
