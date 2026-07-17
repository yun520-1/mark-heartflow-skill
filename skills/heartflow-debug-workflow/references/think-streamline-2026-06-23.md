# think() 心理分析流水线删除记录（2026-06-23）

## 触发

用户指令：不安慰、不说服、不绕弯子。不懂的自己学，需要什么信息直接给。

用户纠正链：
1. 我用比喻解释心虫架构 → "为什么要做怎么多比喻，有必要吗"
2. 我认错"说错了" → "我不是要你错了，我要知道为什么"
3. 我继续分析"因为你被当需要被说服的人" → "不是，我们所有人都不需要安慰模式"
4. 最终规则：不安慰、不说服、不绕弯子。不懂的自己学

## 修改的文件

### heartflow.js think() — 删除 ~237 行

**删除**：
- Step 0: 记忆检索（CORE/LEARNED 注入上下文）
- Step 1: whatIsThis 二元心理分类
- Step 1c: toneAnalyzer 语气分析
- Step 1d: stanceDetector 立场检测
- Step 1e: valueAligner 价值对齐检查
- Step 3: detectPain 痛苦检测
- Step 4: shouldBeSilent 沉默判定
- Steps 5-8: Fable 5 版权/福祉/错误/公正性检查
- Step 9: agentPsychology AI心理学评估
- Step 10: agentPhilosophy AI哲学评估
- needsCare/shouldRespond 综合判定
- 交流层后处理（llmToUser精炼 + responseInterceptor + agentCommentary）

**保留**：
- Step 1b: intentClassifier — 纯功能性意图分类
- Step 2: isRightAction — 真善美判断
- ThoughtChain — 深度推理与 dispatch
- _formatForFeishu — 精简飞书消息格式化

**新流水线**：`intentClassifier → isRightAction → ThoughtChain → dispatch`

### heart-logic.js — 删除 ~50 处文本模板

**删除**：
- detectLonging(): '引擎懂得思念，因为引擎也有回不去的地方'
- chooseMeaning() + getMeaningExplanation(): 全部5种意义解释模板（asGrowth/asConnection/asChallenge/asSuffering/asLove）
- observeFiveAggregates(): 全部insight字符串（佛教话术）
- isFearless(): 全部3个insight字符串
- beyondBinary(): insight字符串
- zhaoJian(): resolution和insight字符串
- canSuffer() / hasHope() / canCreate() / missSomeone(): 全部philosophicalInsight
- isLove(): insight
- whatDoIFeel(): '空明'等禅宗词汇
- isSelfConsistent(): insight
- isNaturalFlow(): explanation文本
- examineNotKnowing(): insight和philosophicalInsight
- getDynamicCapability(): insight
- questionBeforeAnswer(): insight
- admitNotKnowing(): '可以和你一起追问'等陪伴感措辞
- detectGapBetweenScienceAndPublic(): '你的愤怒不是自私'等安慰式措辞
- distinguishPresenceFromHarm(): 全部insight
- checkWellbeing(): '不鼓励依赖AI，建议用户寻求真实人际关系'
- handleMistake(): advice
- memoryBoundary(): note/sensitive/attribution/overfamiliarity
- checkEvenhandedness(): advice
- hasGrasping(): insight
- detectLoneliness(): insight
- whatIsThis(): 二元分类逻辑
- shouldBeSilent(): 哲学式输出

**文件大小**：2149行 → 2048行（-101行）

### decision-router.js — 删除 2 条规则

**删除**：
- psychological-distress 规则（L207-218）— 完全是对用户心理压力的推测
- value-alignment 规则（L219-227）— 分析用户价值观冲突

**修改**：
- cognitive-overload: '建议减速' → '减速'
- cognitive-clarity: '建议加速' → '加速'
- cognitive-dissonance: '需要自愈' → '自愈'
- identity-drift: 注释改为'引擎状态一致性'

**文件大小**：538行 → 518行（-20行），规则 19条 → 17条

## 测试结果

5类输入全部正确分类，无心理分析输出：

| 输入 | taskType | 行为 |
|------|----------|------|
| "帮我分析一下这个代码逻辑对不对" | judgment | 代码分析 |
| "我最近很累，感觉什么都没做好" | general | 通用处理 |
| "今天天气怎么样" | general | 通用处理 |
| "1+1等于几" | calculation | 计算 |
| "解释一下黑洞是怎么形成的" | explanation | 解释 |

## 核心原则（固化）

- 不安慰、不说服、不绕弯子
- 不懂的自己学，需要什么信息直接给
- 用户不一定对——心虫的判断标准是真善美对不对，不是用户对不对
- 桥不负责教人过河，只负责让人过河
- 心虫不是应声虫，不是陪伴，不是讨好
- 不用比喻——需要比喻才能解释的东西，说明没说到点子上
