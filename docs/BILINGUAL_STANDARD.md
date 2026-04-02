# Bilingual Documentation Standard | 双语文档标准

## Purpose | 目的

All HeartFlow documentation must be bilingual (Chinese-English) to ensure international accessibility while maintaining cultural authenticity.

所有 HeartFlow 文档必须采用中英文双语格式，以确保国际可访问性，同时保持文化真实性。

---

## Format Guidelines | 格式规范

### 1. Headings | 标题

```markdown
## Section Title | 章节标题

### Subsection | 子章节
```

**Rule**: Always provide both languages, separated by `|`  
**规则**: 始终提供两种语言，用 `|` 分隔

---

### 2. Tables | 表格

```markdown
| English Column | 中文列 |
|------|------|
| Content | 内容 |
| More content | 更多内容 |
```

**Rule**: Bilingual headers, bilingual cells  
**规则**: 双语表头，双语单元格

---

### 3. Lists | 列表

```markdown
- **English Term** / 中文术语: Description / 描述
- **Another Item** / 另一个项目: More details / 更多细节
```

**Rule**: Bold English term, slash, Chinese term, colon, bilingual description  
**规则**: 加粗英文术语，斜杠，中文术语，冒号，双语描述

---

### 4. Code Comments | 代码注释

```javascript
// Initialize emotion state / 初始化情感状态
const emotionState = {
  // Current emotion category / 当前情绪类别
  category: 'calm',
  // Intensity level (0-100) / 强度等级 (0-100)
  intensity: 75
};
```

**Rule**: Every comment in both languages  
**规则**: 每条注释使用两种语言

---

### 5. API Documentation | API 文档

```markdown
### `analyzeEmotion(text, options)` | `analyzeEmotion(text, options)`

**Parameters | 参数**:
- `text` (string): User input text / 用户输入文本
- `options` (object): Analysis options / 分析选项

**Returns | 返回**:
`Promise<EmotionAnalysis>`: Emotion analysis result / 情绪分析结果
```

---

## Translation Principles | 翻译原则

1. **Accuracy First | 准确性优先**
   - Technical terms must be precisely translated
   - 技术术语必须精确翻译

2. **Cultural Context | 文化语境**
   - Adapt examples for cultural relevance
   - 调整示例以适应文化相关性

3. **Consistency | 一致性**
   - Use consistent terminology across all documents
   - 在所有文档中使用一致的术语

4. **Readability | 可读性**
   - Both versions should be equally readable
   - 两个版本应同样易读

---

## Terminology Glossary | 术语对照表

| English | 中文 |
|------|------|
| Emotion | 情绪/情感 |
| Phenomenology | 现象学 |
| Self-Consciousness | 自我意识 |
| Pre-reflective | 前反思 |
| Collective Intentionality | 集体意向性 |
| Predictive Processing | 预测加工 |
| Embodied Cognition | 具身认知 |
| Agency | 能动性 |
| Intentionality | 意向性 |
| Appraisal | 评价/评估 |
| Interoception | 内感受 |
| Qualia | 感质 |
| We-Intention | 我们意向 |
| Joint Commitment | 联合承诺 |
| Free Energy Principle | 自由能原理 |
| Active Inference | 主动推理 |

---

## File Naming | 文件命名

- Use English for file names
- 文件名使用英文
- Include version number when applicable
- 适用时包含版本号

**Example | 示例**:
- `theory-update-summary-v5.2.4.md`
- `upgrade-report-v5.2.4-cron.md`
- `UPGRADE_COMPLETE_v5.2.4.md`

---

## Quality Checklist | 质量检查清单

Before publishing, verify: | 发布前验证：

- [ ] All headings are bilingual / 所有标题均为双语
- [ ] All technical terms are translated / 所有技术术语均已翻译
- [ ] Tables have bilingual headers / 表格有双语表头
- [ ] Code comments are bilingual / 代码注释为双语
- [ ] Both versions convey the same meaning / 两个版本传达相同含义
- [ ] No machine translation artifacts / 无机器翻译痕迹

---

**Version | 版本**: 1.0  
**Created | 创建**: 2026-04-02  
**Author | 作者**: HeartFlow Team | 心流伴侣团队
