# HeartFlow Version Archive Policy | 版本归档政策

**Effective Date | 生效日期**: 2026-04-02  
**Version | 版本**: 1.0

---

## 归档政策 | Archive Policy

**English:**

To reduce confusion and improve navigation, HeartFlow now follows a streamlined version documentation policy:

**中文:**

为减少混乱并改善导航，HeartFlow 现在遵循简化的版本文档政策：

---

## 保留规则 | Retention Rules

### 根目录保留文件 | Files Kept in Root Directory

| 文件类型 | 保留规则 | 示例 |
|----------|----------|------|
| **大版本升级** | 每 0.1 版本保留 | `UPGRADE_COMPLETE_v5.1.80.md`, `v5.1.90.md`, `v5.1.100.md` |
| **最新版本** | 始终保留最新 | `UPGRADE_COMPLETE_v5.1.104.md` (当前) |
| **理论摘要** | 大版本 + 最新 | `theory-update-summary-v5.1.100.md`, `v5.1.104.md` |
| **自我进化状态** | 大版本 + 最新 | `self-evolution-state-v5.1.100.md`, `v5.1.104.md` |

### 归档文件 | Archived Files

| 文件类型 | 归档位置 |
|----------|----------|
| 小版本升级报告 (v5.1.81-v5.1.99) | `archive/upgrade-reports/` |
| 理论更新摘要 (v5.1.81-v5.1.103) | `archive/theory-summaries/` |
| 自我进化状态 (v5.1.81-v5.1.103) | `archive/self-evolution/` |
| Cron 执行报告 (v5.1.81-v5.1.103) | `archive/cron-reports/` |
| 旧版发布说明 (v5.1.81-v5.1.103) | `archive/releases/` |

---

## 当前保留文件 | Currently Retained Files

### 根目录 | Root Directory

```
UPGRADE_COMPLETE_v5.1.100.md  ← 大版本 (里程碑)
UPGRADE_COMPLETE_v5.1.104.md  ← 最新版本
theory-update-summary-v5.1.104.md
self-evolution-state-v5.1.104.md
upgrade-report-v5.1.104-cron.md
```

### 归档目录 | Archive Directories

```
archive/
├── upgrade-reports/      (40+ 文件)
├── theory-summaries/     (40+ 文件)
├── self-evolution/       (40+ 文件)
├── cron-reports/         (40+ 文件)
└── releases/             (20+ 文件)
```

---

## 访问历史版本 | Accessing Historical Versions

**English:**

All historical version documentation is preserved in the `archive/` directory. To access:

**中文:**

所有历史版本文档均保存在 `archive/` 目录中。访问方式：

### 方法 1: GitHub 浏览 | Method 1: GitHub Browse

1. Navigate to: https://github.com/yun520-1/mark-heartflow-skill/tree/main/archive
2. Select category (upgrade-reports, theory-summaries, etc.)
3. Find version by filename

### 方法 2: Git 标签 | Method 2: Git Tags

```bash
# List all tags
git tag -l

# Checkout specific version
git checkout v5.1.95

# View files at that version
ls -la
```

### 方法 3: Git 历史 | Method 3: Git History

```bash
# View commit history
git log --oneline --all

# Show changes in specific commit
git show <commit-hash>
```

---

## 大版本定义 | Major Version Definition

| 版本类型 | 定义 | 保留 |
|----------|------|------|
| **大版本 (Major)** | x.1.00, x.1.10, x.1.20... | ✅ 根目录 |
| **小版本 (Minor)** | x.1.01-x.1.09, x.1.11-x.1.19... | ⚠️ 仅最新 |
| **补丁版本 (Patch)** | x.1.xx (daily upgrades) | ❌ 归档 |

**当前大版本里程碑 | Current Major Milestones**:
- ✅ v5.1.80 - Documentation Consolidation
- ✅ v5.1.90 - Complete Theoretical Integration v1.0
- ✅ v5.1.100 - LLM ToM + LEWM Integration
- ✅ v5.1.104 - Current Latest

---

## 清理时间表 | Cleanup Schedule

| 时间 | 操作 |
|------|------|
| **每次升级后** | 自动移动小版本文件到归档 |
| **每 10 个小版本** | 创建大版本里程碑文档 |
| **每月** | 审查归档，确保完整性 |
| **每季度** | 更新版本索引和导航 |

---

## 版本索引 | Version Index

### v5.1.80-v5.1.89 | 基础理论整合阶段

| 版本 | 主题 | 状态 |
|------|------|------|
| v5.1.80 | 文档整合与 GitHub 发布 | ✅ 保留 |
| v5.1.81-v5.1.89 | 理论深度增强 | 📦 归档 |

### v5.1.90-v5.1.99 | 临床应用增强阶段

| 版本 | 主题 | 状态 |
|------|------|------|
| v5.1.90 | 完整理论整合 v1.0 | ✅ 保留 |
| v5.1.91-v5.1.99 | 临床协议优化 | 📦 归档 |

### v5.1.100-v5.1.104 | 多模态与 AI 整合阶段

| 版本 | 主题 | 状态 |
|------|------|------|
| v5.1.100 | LLM ToM + LEWM | ✅ 保留 |
| v5.1.101-v5.1.103 | 理论深度增强 | 📦 归档 |
| v5.1.104 | 意识现象学 + 预测加工 | ✅ 最新 |

---

## 联系 | Contact

**Questions | 问题**: markcell@163.com

---

**Last Updated | 最后更新**: 2026-04-02  
**Policy Version | 政策版本**: 1.0  
**Next Review | 下次审查**: 2026-07-02

---

*This policy is bilingual compliant with HeartFlow BILINGUAL_STANDARD.md v5.1.3+*  
*本政策符合 HeartFlow BILINGUAL_STANDARD.md v5.1.3+ 双语标准*
