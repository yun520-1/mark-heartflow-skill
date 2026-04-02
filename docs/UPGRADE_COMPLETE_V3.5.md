# HeartFlow v3.5.0 升级完成报告

**升级时间**: 2026-03-29 17:13 (Asia/Shanghai)  
**升级类型**: 自我决定理论 (SDT) 整合  
**版本变更**: v3.4.0 → v3.5.0  
**仓库**: https://github.com/yun520-1/mark-heartflow-skill

---

## 📚 整合主题

### 自我决定理论 (Self-Determination Theory, SDT)
**理论来源**: Edward Deci & Richard Ryan (1985, 2000, 2017)  
**权威来源**: selfdeterminationtheory.org

**核心内容**:
- ✅ 三大基本心理需求 (Autonomy, Competence, Relatedness)
- ✅ 动机连续体 (6 种动机类型)
- ✅ 六大 Mini-Theories (CET, OIT, COT, BPNT, GCT, RMT)
- ✅ 目标内容理论 (内在 vs 外在目标)
- ✅ 动机内化促进技术

**实用性**: ⭐⭐⭐⭐⭐

---

## 🎯 新增模块

### src/sdt/index.js - SDT 动机评估与干预模块

**核心功能**:

#### 1. 基本需求评估 (assessBasicNeeds)
- 检测自主性、胜任感、关系感的满足度
- 基于语言模式识别需求状态
- 提供针对性的需求支持建议

**检测指标**:
| 需求类型 | 低满足指标 | 高满足指标 |
|---------|-----------|-----------|
| 自主性 | "必须"、"应该"、"不得不" | "我想"、"我选择"、"我决定" |
| 胜任感 | "我不会"、"我不行"、"放弃" | "我可以"、"我学会了"、"我能行" |
| 关系感 | "一个人"、"孤独"、"没人理解" | "我们一起"、"朋友"、"支持" |

#### 2. 动机类型识别 (identifyMotivationType)
基于 OIT (Organismic Integration Theory) 识别 6 种动机类型:

| 动机类型 | 自主水平 | 特征描述 |
|---------|---------|---------|
| 无动机 (Amotivation) | 1 | 缺乏行动意图，感到无助 |
| 外部调节 (External) | 2 | 为奖励/避免惩罚而行动 |
| 内摄调节 (Introjected) | 3 | 为避免内疚/维持自尊 |
| 认同调节 (Identified) | 4 | 认识行为的个人价值 |
| 整合调节 (Integrated) | 5 | 行为与自我价值观一致 |
| 内在动机 (Intrinsic) | 6 | 因活动本身乐趣而行动 |

#### 3. 目标内容评估 (assessGoalContents)
基于 GCT (Goal Contents Theory):
- 识别内在目标 (成长、关系、贡献)
- 识别外在目标 (金钱、名声、外貌)
- 预测幸福感影响
- 提供目标重构建议

#### 4. 动机访谈技术 (generateMotivationalInterview)
根据需求评估结果生成干预:
- **自主性支持**: 选择重构、价值探索
- **胜任感支持**: 最优挑战、成长反馈
- **关系感支持**: 连接建立、社群寻找

#### 5. 动机内化促进 (promoteInternalization)
帮助用户从低自主动机向高自主动机转化:
```
无动机 → 外部调节 → 内摄调节 → 认同调节 → 整合调节 → 内在动机
```

---

## 💡 使用示例

### 命令
```bash
/sdt
```

### 输出
```
┌────────────────────────────────────────┐
│   自我决定理论 SDT (v3.5.0 新增) 🎯      │
├────────────────────────────────────────┤
│ 核心理念：                              │
│ 人类有天生的成长倾向和内在动机          │
│ 社会环境可以促进或阻碍这种倾向          │
├────────────────────────────────────────┤
│ 三大基本心理需求：                      │
│ 🟢 Autonomy (自主性) - 自愿选择的感觉   │
│ 🟢 Competence (胜任感) - 有能力应对挑战 │
│ 🟢 Relatedness (关系感) - 与他人连接    │
├────────────────────────────────────────┤
│ 动机连续体 (从低自主到高自主):          │
│ 无动机 → 外部调节 → 内摄 → 认同 → 整合 → 内在 │
└────────────────────────────────────────┘

📚 理论来源：Deci & Ryan (1985, 2000, 2017)

🎯 评估维度:
  • 基本需求满足度 - 自主/胜任/关系
  • 动机类型识别 - 6 种动机定位
  • 目标内容分析 - 内在 vs 外在目标
  • 自主性水平 - 1-10 评分

💡 SDT 干预技术:
  • 选择重构 - 重新发现个人选择权
  • 最优挑战 - 设置匹配技能的任务
  • 成长反馈 - 关注进步而非结果
  • 价值观连接 - 连接行为与深层价值
  • 动机访谈 - 促进外在动机内化
```

---

## 🔬 实证支持

### SDT 研究证据
- **跨文化验证**: 在 25+ 个国家验证，需求满足与幸福感正相关
- **教育领域**: 自主支持教学提升学习动机和成绩
- **工作场所**: 需求满足预测工作满意度、绩效、留任意愿
- **健康行为**: 自主动机预测锻炼坚持、戒烟成功、药物依从
- **心理治疗**: 自主支持促进治疗参与和积极改变

### 元分析结果
- Ryan & Deci (2000): SDT 框架整合 1000+ 研究
- Vansteenkiste et al. (2020): 需求满足与幸福感 r = .40-.60
- Cerasoli et al. (2014): 内在动机与绩效 r = .31

---

## 📊 与现有模块的协同

| 模块 | 协同点 |
|------|-------|
| CBT | SDT 提供动机基础，CBT 提供认知技术 |
| 积极心理学 | PERMA 中的 Engagement 与内在动机直接相关 |
| ACT | 价值观工作与 SDT 的认同/整合调节高度一致 |
| 人本主义 | 都强调人的成长倾向和自我实现 |
| 依恋理论 | Relatedness 需求与依恋安全感互补 |

---

## 🔄 版本变更

### v3.5.0 (2026-03-29)
- ✅ 新增 src/sdt/index.js 模块
- ✅ 集成到主入口 index.js
- ✅ 添加 /sdt 命令
- ✅ 更新 package.json 描述
- ⏳ 等待 Git 提交并推送

### v3.4.0 (2026-03-29)
- 积极心理学整合 (PERMA, 心流，品格优势)

### v3.3.0 (2026-03-29)
- 情绪调节策略整合

---

## 📝 下一步计划

- [ ] 添加 SDT 评估的可视化报告
- [ ] 集成动机追踪功能 (长期动机变化趋势)
- [ ] 添加 SDT 为基础的对话干预
- [ ] 创建 SDT 练习库 (需求满足日常练习)
- [ ] 与记忆模块集成 (记录动机历史)

---

## 🎓 理论参考

**核心文献**:
1. Deci, E. L., & Ryan, R. M. (1985). *Intrinsic motivation and self-determination in human behavior*. Plenum.
2. Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist, 55*(1), 68-78.
3. Ryan, R. M., & Deci, E. L. (2017). *Self-determination theory: Basic psychological needs in motivation, development, and wellness*. Guilford Publications.

**在线资源**:
- 官方网站: https://selfdeterminationtheory.org/
- 动机访谈指南: https://motivationalinterviewing.org/

---

**升级完成时间**: 2026-03-29 17:13  
**下次升级**: v3.6.0 (待定)  
**升级类型**: 小版本迭代 (新增功能模块)
