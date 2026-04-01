# HeartFlow 中英文双语规范 | Bilingual Standard

**生效日期 | Effective Date**: 2026-04-01  
**版本 | Version**: v5.1.3+

---

## 核心要求 | Core Requirements

**所有对外文档必须同时提供中文和英文版本**  
**All external-facing documentation must be provided in both Chinese and English versions**

---

## 适用范围 | Scope

| 文档类型 | 要求 | 示例 |
|---------|------|------|
| README.md | ✅ 必须双语 | 本文件 |
| 升级报告 | ✅ 必须双语 | UPGRADE_COMPLETE_v5.1.3.md |
| API 文档 | ✅ 必须双语 | docs/API.md |
| 变更日志 | ✅ 必须双语 | docs/releases/CHANGELOG.md |
| 架构说明 | ✅ 必须双语 | docs/ARCHITECTURE.md |
| 贡献指南 | ✅ 必须双语 | CONTRIBUTING.md |
| 内部计划 | ⏳ 可选双语 | temp/*.md |

---

## 文档格式规范 | Document Format Standard

### 1. 标题格式 | Title Format

```markdown
## 中文标题 | Chinese Title

### 子标题中文 | Subtitle Chinese
```

### 2. 表格格式 | Table Format

```markdown
| 中文列 | English Column |
|-------|---------------|
| 中文内容 | English content |
```

### 3. 段落格式 | Paragraph Format

**方式一：先英文后中文 | Option 1: English First, Then Chinese**

```markdown
**English:**

This is the English paragraph.

**中文:**

这是中文段落。
```

**方式二：逐段对照 | Option 2: Paragraph-by-Paragraph**

```markdown
This is the English paragraph.

这是中文段落。
```

### 4. 代码注释 | Code Comments

```javascript
// English: Initialize emotional state
// 中文：初始化情感状态
const emotion = initEmotion('joy');
```

### 5. 列表格式 | List Format

```markdown
- **English item** | **中文项目**
  - Detail in English | 中文详情
```

---

## 翻译质量要求 | Translation Quality Standard

| 要求 | 说明 |
|-----|------|
| **准确性** | 技术术语使用标准翻译，不随意意译 |
| **一致性** | 同一术语在全文中保持统一译法 |
| **可读性** | 避免机器翻译痕迹，符合目标语言习惯 |
| **完整性** | 不遗漏任何关键信息 |

### 术语对照表 | Terminology Glossary

| English | 中文 | 备注 |
|---------|------|------|
| Emotionally Anthropomorphic | 情感拟人化 | 核心定位 |
| Trust Level | 信任度 | 0.0-1.0 |
| Empathy Depth | 共情深度 | 随信任度深化 |
| Implicit Learning | 隐式学习 | 自动学习用户偏好 |
| User Profiling | 用户画像 | 情感偏好档案 |
| Emotional Transition | 情感转换 | 动态调整 |
| Predictive Processing | 预测加工 | Friston 理论 |
| Phenomenological Self | 现象学自我 | Zahavi 理论 |
| Collective Intentionality | 集体意向性 | Searle/Gilbert |
| Narrative Psychology | 叙事心理学 | McAdams |

---

## 升级文档模板 | Upgrade Documentation Template

### UPGRADE_COMPLETE_vX.Y.Z.md

```markdown
# HeartFlow v X.Y.Z Upgrade Complete | 升级完成

**Version | 版本**: v X.Y.Z  
**Date | 日期**: YYYY-MM-DD  
**Status | 状态**: ✅ Complete | 完成

---

## Executive Summary | 执行摘要

**English:**

[Brief summary in English]

**中文:**

[简要中文摘要]

---

## Core Achievements | 核心成果

| Module | English Description | 中文描述 |
|--------|--------------------|----------|
| Module Name | Description | 描述 |

---

## Key Metrics | 关键指标

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Metric Name | Value | Value | +/- |

---

## Next Steps | 下一步规划

| Version | Theme | Target |
|---------|-------|--------|
| v X.Y.Z+1 | Theme | Target metric |

---

**Upgrade Executed By | 升级执行者**: [Name]  
**Repository | 仓库**: https://github.com/yun520-1/mark-heartflow-skill
```

---

## 检查清单 | Checklist

每次发布前请确认 | Before each release, please confirm:

- [ ] README.md 包含中英文对照
- [ ] 升级报告包含中英文摘要
- [ ] 所有表格有中英文表头
- [ ] 术语翻译与术语表一致
- [ ] 代码注释有中英文
- [ ] 用户可见的 UI 文本有中英文
- [ ] 错误消息有中英文

---

## 维护规则 | Maintenance Rules

1. **新增内容**: 必须同时提供中英文
2. **更新内容**: 中英文同步更新
3. **术语变更**: 更新术语对照表
4. **质量审查**: 每次升级前审查双语质量

---

## 例外情况 | Exceptions

以下情况可暂缓提供双语：

| 情况 | 处理方式 |
|-----|---------|
| 紧急安全补丁 | 先发布，24 小时内补充翻译 |
| 内部测试文档 | 可仅用中文 |
| 临时计划文件 | 可仅用中文 |

---

## 工具推荐 | Recommended Tools

| 用途 | 工具 |
|-----|------|
| 翻译辅助 | DeepL Pro |
| 术语管理 | Excel 术语表 |
| 质量检查 | 人工审查 + Grammarly |

---

**维护者 | Maintainer**: 小虫子 · 严谨专业版  
**最后更新 | Last Updated**: 2026-04-01 11:20 (Asia/Shanghai)
