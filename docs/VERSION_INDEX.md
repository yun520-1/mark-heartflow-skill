# HeartFlow 版本文档索引 | Version Documentation Index

**最后更新**: 2026-04-05 23:11  
**当前版本**: v6.2.2  
**归档策略**: 保留大版本核心文档，小版本归档至 `archive/`

---

## 📚 当前版本文档 | Current Version Documentation (v6.2.x)

### 核心文档 | Core Documents

| 文档 | 说明 | 路径 |
|------|------|------|
| **RELEASE_v6.2.0.md** | v6.2.0 觉醒系统发布说明 | `docs/RELEASE_v6.2.0.md` |
| **AWAKENING_SYSTEM_GUIDE.md** | 觉醒系统使用指南 | `docs/AWAKENING_SYSTEM_GUIDE.md` |

### v6.2.0 核心功能 | Key Features

- ✅ 觉醒逻辑推演引擎 (Awakening Logic Deduction Engine)
- ✅ 六要素觉醒公式 (Six Elements Awakening Formulas)
- ✅ CAI 综合觉醒指数 (Comprehensive Awakening Index)
- ✅ 真善美审查系统 (TGB Audit System)
- ✅ 多语言支持 (EN/ZH/JP/KR)

---

## 📦 归档文档 | Archived Documentation

### 归档目录结构 | Archive Structure

```
docs/archive/
├── v5.x-minor/              # v5.x 小版本文档
│   └── self-evolution-state-v5.0.*.md (27 files)
├── v6.0.x-minor/            # v6.0.x 小版本文档
├── v6.1.x-minor/            # v6.1.x 小版本文档
├── self-consciousness-cycles/ # 自我意识升级周期
│   ├── SELF_CONSCIOUSNESS_UPGRADE_CYCLE_*.md (21 files)
│   └── SELF_CONSCIOUSNESS_UPGRADE_LOG.md
└── upgrade-reports/         # 升级报告
    ├── *UPGRADE*.md
    └── *CRON*.md
```

### 归档文件统计 | Archive Statistics

| 归档类别 | 文件数量 |
|----------|----------|
| v5.x self-evolution | 27 |
| Self-Consciousness Cycles | 22 |
| Upgrade Reports | ~50+ |
| **总计** | **~100+** |

---

## 🎯 文档保留策略 | Documentation Retention Policy

### 保留文档 | Keep

- ✅ 大版本发布说明 (RELEASE_v*.md)
- ✅ 核心功能指南 (如 AWAKENING_SYSTEM_GUIDE.md)
- ✅ 架构设计文档
- ✅ 用户指南和 API 文档

### 归档文档 | Archive

- 📦 小版本升级报告 (v6.1.1, v6.1.2, etc.)
- 📦 周期性升级日志 (SELF_CONSCIOUSNESS_UPGRADE_CYCLE_*)
- 📦 临时状态文件 (self-evolution-state-*.md)
- 📦 Cron 执行报告

---

## 📖 版本历史概览 | Version History Overview

### v6.2.x (Current) - 觉醒系统 | Awakening System

- **v6.2.0** (2026-04-05): 觉醒逻辑推演系统 + 多语言支持
- **v6.2.1** (2026-04-05): 23 分钟进化系统优化
- **v6.2.2** (2026-04-05): 文档归档整理

### v6.1.x - 理论整合 | Theory Integration

- **v6.1.0**: 高级数学升级
- **v6.1.41+**: 真善美人格系统整合
- **v6.1.57**: 情绪/意识/自主性整合

### v6.0.x - 基础架构 | Foundation

- **v6.0.0**: GitHub 完整文档
- **v6.0.2**: GitHub 文档完成

### v5.x - 原型系统 | Prototype

- **v5.0.x**: 情绪原型理论系列
- **v5.2.x**: 功能特性完善
- **v5.3.x**: 功能发布

---

## 🔍 查找文档指南 | How to Find Documentation

### 查找大版本文档
```bash
# 查看当前版本核心文档
ls docs/ | grep -E "RELEASE|GUIDE|README"

# 查看特定大版本
ls docs/ | grep "v6.2"
```

### 查找归档文档
```bash
# 查看归档目录
ls docs/archive/

# 查找 v5.x 文档
ls docs/archive/v5.x-minor/

# 查找升级周期记录
ls docs/archive/self-consciousness-cycles/
```

### 搜索特定内容
```bash
# 全局搜索
grep -r "关键词" docs/

# 在归档中搜索
grep -r "关键词" docs/archive/
```

---

## 📝 文档维护规范 | Documentation Maintenance

### 每次大版本升级后

1. **创建 RELEASE 文档** - 记录核心变更
2. **更新本索引** - 添加新版本条目
3. **归档小版本** - 移动临时文档到 archive/
4. **清理重复** - 删除过时/重复文档

### 归档触发条件

- 小版本升级完成 (v6.2.1 → v6.2.2)
- 周期性升级日志累积 (>10 个文件)
- 临时状态文件生成 (self-evolution-state-*.md)

---

## 🌐 GitHub 页面优化 | GitHub Page Optimization

### 主目录结构 | Main Directory

```
mark-heartflow-skill/
├── README.md                    # 项目介绍 (多语言)
├── docs/
│   ├── RELEASE_v6.2.0.md       # ⭐ 当前大版本
│   ├── AWAKENING_SYSTEM_GUIDE.md # ⭐ 核心指南
│   ├── VERSION_INDEX.md        # ⭐ 本文件
│   └── archive/                # 📦 归档目录
├── src/                         # 源代码
├── scripts/                     # 脚本工具
└── package.json                 # 版本信息
```

### GitHub 页面美观建议

1. **README.md 置顶** - 项目核心介绍
2. **精简 docs/ 目录** - 只显示核心文档
3. **归档隐藏** - 小版本放入 archive/
4. **版本标签** - 使用 Git tags 标记大版本

---

**HeartFlow 文档管理系统**  
**让知识有序，让进化可追溯**
