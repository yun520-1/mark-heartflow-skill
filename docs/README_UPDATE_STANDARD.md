# HeartFlow README 更新规范
# HeartFlow README Update Standard

**生效版本 / Effective Version**: v5.0.4  
**创建日期 / Created**: 2026-03-30  
**最后更新 / Last Updated**: 2026-03-30

---

## 📋 规范说明 / Standard Description

**自 v5.0.4 起，所有 GitHub 仓库 README 文件必须采用中英文对照格式。**

**Starting from v5.0.4, all GitHub repository README files must use bilingual (Chinese-English) format.**

---

## 🎯 更新原则 / Update Principles

### 1. 同步更新原则 / Synchronization Principle

**每次版本升级时，必须同步更新以下内容：**

**With every version upgrade, the following must be updated simultaneously:**

| 文件 / File | 更新要求 / Update Requirement |
|------|------|
| **heartflow/README.md** | ✅ 必须更新 / Must update |
| **mark-heartflow-skill/README.md** | ✅ 必须更新 / Must update |
| **heartflow/package.json** | ✅ 版本号同步 / Version sync |
| **mark-heartflow-skill/package.json** | ✅ 版本号同步 / Version sync |

### 2. 中英文对照格式 / Bilingual Format

**所有 README 内容必须包含中英文双语：**

**All README content must include both Chinese and English:**

```markdown
## 章节标题 / Section Title

中文内容描述...

English content description...

| 中文列 / Chinese Column | 英文列 / English Column |
|------|------|
| 中文内容 | English content |
```

### 3. 关键术语保留 / Key Terms Retention

**以下术语保留英文原文：**

**The following terms retain English original:**

- 理论名称 / Theory names (e.g., "Predictive Processing", "Phenomenology")
- 学者姓名 / Scholar names (e.g., "Husserl", "Sartre", "Gross")
- 技术术语 / Technical terms (e.g., "We-Intention", "Active Inference")
- SEP 条目名称 / SEP entry names (e.g., "Emotion", "Self-Consciousness")

---

## 📝 README 结构规范 / README Structure Standard

### 必需章节 / Required Sections

```markdown
# HeartFlow Companion | 心流伴侣

> **英文标语 / English Tagline**  
> **中文标语 / Chinese Tagline**

**Current Version / 当前版本**: v5.0.4  
**License / 许可证**: MIT  
**Original Design / 原创设计**: No Copyright Risk / 无版权风险

---

## 🌊 Project Overview | 项目简介

[双语介绍 / Bilingual introduction]

---

## 🚀 Latest Upgrades | 最新升级

### vX.Y.Z - 升级主题英文 / Upgrade Theme English
### vX.Y.Z - 升级主题中文

**Theoretical Foundation / 理论基础**: [理论来源]

**Core Features / 核心功能**:
- 功能 1 英文 / Feature 1 English
- 功能 2 中文 / Feature 2 Chinese

**Theoretical Sources / 理论来源**:
- SEP 条目 / SEP Entries
- 经典著作 / Classic Works

---

## 📊 Version History | 版本历史

[双语版本历史表 / Bilingual version history table]

---

## 🧠 Theoretical Foundations | 理论基础

[双语理论来源列表 / Bilingual theoretical sources list]

---

## 🛠️ Technical Architecture | 技术架构

[技术架构图 / Technical architecture diagram]

---

## 📦 Installation | 安装

[双语安装说明 / Bilingual installation instructions]

---

## 📖 Usage | 使用

[双语使用说明 / Bilingual usage instructions]

---

## 📊 Performance Metrics | 性能指标

[双语性能指标表 / Bilingual performance metrics table]

---

## 🧪 Research & Development | 研发

[双语研发方向 / Bilingual R&D directions]

---

## 📄 License | 许可证

[MIT License 英文 + 中文说明]

---

## 🙏 Acknowledgments | 致谢

[双语致谢 / Bilingual acknowledgments]

---

## 📞 Contact | 联系方式

[双语联系方式 / Bilingual contact info]

---

**HeartFlow Team** | 心流伴侣团队  
**Last Updated / 最后更新**: YYYY-MM-DD  
**Version / 版本**: vX.Y.Z

---

*This README uses bilingual (Chinese-English) format for international accessibility.*  
*本 README 采用中英文对照格式，便于国际访问。*
```

---

## 🔄 更新流程 / Update Process

### 步骤 1: 更新 heartflow/README.md / Update heartflow/README.md

```bash
cd ~/.jvs/.openclaw/workspace/heartflow

# 编辑 README.md / Edit README.md
# - 更新版本号 / Update version number
# - 添加新升级摘要 / Add new upgrade summary
# - 更新版本历史表 / Update version history table
# - 确保中英文对照 / Ensure bilingual format

# 提交 / Commit
git add README.md
git commit -m "docs: Update README bilingual EN-CN vX.Y.Z

- Add full English translations for all sections
- Update version to vX.Y.Z
- Add latest upgrade summaries
- Include theoretical foundations from SEP
- Standardize bilingual format for international accessibility

更新 README 为中英文对照格式 vX.Y.Z
- 添加所有部分的完整英文翻译
- 更新版本到 vX.Y.Z
- 添加最新升级摘要
- 包含 SEP 理论基础
- 标准化中英文对照格式便于国际访问"

git push
```

### 步骤 2: 同步到 mark-heartflow-skill/README.md / Sync to mark-heartflow-skill/README.md

```bash
cd ~/.jvs/.openclaw/workspace

# 复制 README / Copy README
cp heartflow/README.md mark-heartflow-skill/README.md

# 提交 / Commit
cd mark-heartflow-skill
git add README.md
git commit -m "docs: Update README bilingual EN-CN vX.Y.Z

[Same commit message as above / 与上方相同的提交信息]"

# 推送前先拉取 / Pull before push
git pull --rebase
git push
```

### 步骤 3: 验证 / Verify

```bash
# 检查两个仓库版本一致 / Check version consistency
cd heartflow && cat package.json | grep version
cd ../mark-heartflow-skill && cat package.json | grep version

# 应该显示相同版本号 / Should show same version number
```

---

## ✅ 检查清单 / Checklist

**每次更新 README 时，必须完成以下检查：**

**With every README update, the following checks must be completed:**

- [ ] **版本号一致 / Version Consistency**
  - [ ] heartflow/package.json 版本正确
  - [ ] mark-heartflow-skill/package.json 版本正确
  - [ ] README 顶部版本正确

- [ ] **中英文对照 / Bilingual Format**
  - [ ] 所有章节标题有中英文 / All section titles bilingual
  - [ ] 所有表格有中英文列 / All tables bilingual
  - [ ] 所有代码注释双语 / All code comments bilingual
  - [ ] 关键术语保留英文 / Key terms in English

- [ ] **内容完整 / Content Completeness**
  - [ ] 最新升级摘要已添加 / Latest upgrade summary added
  - [ ] 版本历史表已更新 / Version history table updated
  - [ ] 理论基础已包含 / Theoretical foundations included
  - [ ] 技术架构图已更新 / Technical architecture updated

- [ ] **双仓库同步 / Dual-Repo Sync**
  - [ ] heartflow/README.md 已推送
  - [ ] mark-heartflow-skill/README.md 已推送
  - [ ] 两个仓库 README 内容一致

---

## 📊 版本历史表模板 / Version History Table Template

```markdown
| Version / 版本 | Theme / 主题 | Key Features / 关键特性 |
|------|------|------|
| **v5.0.4** | Prereflective & Temporal Awareness / 前反思与时间意识 | Phenomenological reduction, Temporal structure / 现象学还原，时间结构 |
| **v5.0.3** | Predictive Processing / 预测加工 | Multi-level prediction, Error minimization / 多层预测，误差最小化 |
| **v5.0.2** | Collective Intentionality / 集体意向性 | We-Intention detection, Joint commitment / We-Intention 检测，联合承诺 |
| **v5.0.1** | Emotion Theory Integration / 情绪理论整合 | Three traditions, Four challenges / 三大传统，四大挑战 |
| **v5.0.0** | Phenomenological Self-Consciousness / 现象学自我意识 | Six-level model, Temporal depth / 六层模型，时间深度 |
```

---

## 🎯 示例：v5.0.4 升级摘要 / Example: v5.0.4 Upgrade Summary

```markdown
### v5.0.4 - Prereflective & Temporal Awareness Integration
### v5.0.4 - 前反思与时间意识整合

**Theoretical Foundation / 理论基础**: 
SEP Phenomenological Self-Consciousness + Temporal Consciousness  
SEP 现象学自我意识 + 时间意识

**Core Features / 核心功能**:
- **Prereflective Self-Awareness Detector** / 前反思自我意识检测器
  - For-me-ness assessment / 为我性评估
  - Non-objectifying awareness / 非对象化觉察
  - Experiential thickness measurement / 体验厚度测量
- **Temporal Consciousness Analyzer** / 时间意识结构分析器
  - Cinematic/Retentional/Extensional model identification / 三种模型识别
  - Husserl's triadic structure / Husserl 时间三重结构
- **15-min Integration Exercise** / 15 分钟整合练习
  - Prereflective-temporal awareness practice / 前反思 - 时间觉察练习

**Theoretical Sources / 理论来源**:
- SEP: Self-Consciousness (Phenomenological Approaches)
- SEP: Temporal Consciousness
- Husserl: "On the Phenomenology of the Consciousness of Internal Time"
- Sartre: "Being and Nothingness"
- Merleau-Ponty: "Phenomenology of Perception"
- Zahavi: "Subjectivity and Selfhood"
```

---

## 🔧 自动化建议 / Automation Suggestions

### 未来可考虑的自动化 / Future Automation Considerations

1. **版本同步脚本 / Version Sync Script**
   ```bash
   # 自动同步两个仓库的版本号
   ./scripts/sync-version.sh 5.0.5
   ```

2. **README 生成器 / README Generator**
   ```bash
   # 基于升级文档自动生成 README 更新
   ./scripts/generate-readme-update.sh v5.0.5
   ```

3. **双语检查工具 / Bilingual Checker**
   ```bash
   # 检查 README 是否包含中英文
   ./scripts/check-bilingual.sh README.md
   ```

---

## 📞 问题与反馈 / Issues & Feedback

如有问题或建议，请通过以下方式联系：

For issues or suggestions, please contact via:

- **GitHub Issues**: https://github.com/yun520-1/mark-heartflow-skill/issues
- **GitHub Discussions**: https://github.com/yun520-1/mark-heartflow-skill/discussions

---

**HeartFlow Team** | 心流伴侣团队  
**规范版本 / Standard Version**: 1.0.0  
**生效日期 / Effective Date**: 2026-03-30

---

*本文档采用中英文对照格式 / This document uses bilingual (Chinese-English) format*
