# HeartFlow Version Files | 版本文件说明

**Last Updated | 最后更新**: 2026-04-02  
**Current Version | 当前版本**: v5.1.108

---

## 根目录保留文件 | Files Retained in Root

为减少 GitHub 前端显示混乱，根目录**仅保留**以下版本文件：

| 文件类型 | 保留规则 | 当前文件 |
|----------|----------|----------|
| **大版本里程碑** | 每 10 个小版本保留 | `UPGRADE_COMPLETE_v5.1.80.md` |
| | | `UPGRADE_COMPLETE_v5.1.90.md` |
| | | `UPGRADE_COMPLETE_v5.1.100.md` |
| **最新版本** | 始终保留最新 | `UPGRADE_COMPLETE_v5.1.108.md` |
| | | `theory-update-summary-v5.1.108.md` |
| | | `self-evolution-state-v5.1.108.md` |
| | | `upgrade-report-v5.1.108-cron.md` |

---

## 历史版本归档 | Historical Versions Archive

所有其他版本文件已归档到 `archive/` 目录：

| 归档目录 | 内容 | 文件数 |
|----------|------|--------|
| `archive/upgrade-reports/` | 历史升级完成报告 | 100+ |
| `archive/theory-summaries/` | 历史理论更新摘要 | 100+ |
| `archive/self-evolution/` | 历史自我进化状态 | 100+ |
| `archive/cron-reports/` | 历史 Cron 执行报告 | 100+ |
| `archive/releases/` | 历史发布说明 | 50+ |

---

## 查找历史版本 | Finding Historical Versions

### 方法 1: 通过版本索引 | Method 1: Via Version Index

```
GitHub → archive/ → VERSION_INDEX.md → 选择版本
```

### 方法 2: 直接浏览归档 | Method 2: Browse Archive

```
GitHub → archive/upgrade-reports/ → 选择版本文件
```

### 方法 3: Git 标签 | Method 3: Git Tags

```bash
# 查看所有标签
git tag -l

# 检出特定版本
git checkout v5.1.100
```

---

## 归档政策 | Archive Policy

详细归档政策见：[archive/VERSION_ARCHIVE_POLICY.md](archive/VERSION_ARCHIVE_POLICY.md)

---

## 联系 | Contact

**Email**: markcell@163.com  
**GitHub**: https://github.com/yun520-1/mark-heartflow-skill

---

*This document is bilingual compliant with HeartFlow BILINGUAL_STANDARD.md v5.1.3+*  
*本文档符合 HeartFlow BILINGUAL_STANDARD.md v5.1.3+ 双语标准*
