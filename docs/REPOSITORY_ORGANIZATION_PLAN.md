# HeartFlow 仓库整理方案

**创建时间**: 2026-04-01 10:45 (Asia/Shanghai)  
**目标**: 清理根目录，优化仓库结构，让下次升级介绍更完美、美观

---

## 当前问题分析

### ❌ 问题 1: 根目录文件过多
- **现状**: 根目录有 80+ 个 UPGRADE_COMPLETE_*.md 文件
- **影响**: GitHub 主页混乱，难以找到重要文件
- **解决**: 迁移到 `docs/upgrades/` 目录

### ❌ 问题 2: 版本升级痕迹分散
- **现状**: 每个版本 4 个文件分散在根目录
- **影响**: 难以追踪版本历史
- **解决**: 每个版本一个文件夹，集中管理

### ❌ 问题 3: README 版本信息过时
- **现状**: README 显示 v5.0.76，实际已升级到 v5.1.1
- **影响**: 用户获取错误信息
- **解决**: 更新 README，添加版本时间线

---

## 优化方案

### 📁 新仓库结构

```
mark-heartflow-skill/
├── README.md                          # 项目简介 (保持精简)
├── package.json                       # 版本信息
├── LICENSE                            # 许可证
├── CONTRIBUTING.md                    # 贡献指南
├── .gitignore                         # Git 忽略规则
│
├── docs/                              # 文档目录
│   ├── README.md                      # 文档导航
│   ├── ARCHITECTURE.md                # 架构说明
│   ├── API.md                         # API 文档
│   │
│   ├── upgrades/                      # 版本升级记录
│   │   ├── README.md                  # 升级索引 (按版本分类)
│   │   ├── v5.1/                      # v5.1.x 系列
│   │   │   ├── v5.1.1-merged.md       # 合并的升级报告
│   │   │   └── v5.1.0-merged.md
│   │   ├── v5.0/                      # v5.0.x 系列
│   │   │   ├── v5.0.100-133-merged.md # 合并小版本
│   │   │   ├── v5.0.70-99-merged.md
│   │   │   └── ...
│   │   ├── v4/                        # v4.x 系列
│   │   └── v3/                        # v3.x 系列
│   │
│   └── releases/                      # 正式发布记录
│       └── CHANGELOG.md               # 完整变更日志
│
├── src/                               # 源代码
│   ├── index.js
│   └── ...
│
├── skill/                             # Skill 定义
│   └── SKILL.md
│
├── archive/                           # 历史归档
│   └── raw-upgrades/                  # 原始升级文件 (不删除，仅迁移)
│       └── (所有历史 UPGRADE_COMPLETE_*.md)
│
└── temp/                              # 临时文件 (.gitignore)
```

---

## 执行步骤

### Step 1: 创建文档结构
```bash
mkdir -p docs/upgrades/v5.1 docs/upgrades/v5.0 docs/upgrades/v4 docs/upgrades/v3
mkdir -p docs/releases
mkdir -p archive/raw-upgrades
```

### Step 2: 合并小版本报告
- **v5.0.100-133**: 34 个小版本 → 合并为 1 个综合报告
- **v5.0.70-99**: 30 个小版本 → 合并为 1 个综合报告
- 以此类推

### Step 3: 迁移历史文件
```bash
# 移动所有 UPGRADE_COMPLETE_*.md 到 archive/raw-upgrades/
mv UPGRADE_COMPLETE_*.md archive/raw-upgrades/
```

### Step 4: 更新 README.md
- 更新当前版本为 v5.1.1
- 添加版本时间线图
- 添加文档导航链接
- 精简内容，突出核心功能

### Step 5: 创建升级索引
在 `docs/upgrades/README.md` 创建完整的版本索引

---

## 下次升级规范 (v5.1.2+)

### 📋 文件命名规范

| 文件类型 | 命名格式 | 位置 |
|---------|---------|------|
| 升级完成报告 | `UPGRADE_v5.1.2.md` | `docs/upgrades/v5.1/` |
| 理论更新摘要 | `theory-v5.1.2.md` | `docs/upgrades/v5.1/` |
| 进化状态 | `state-v5.1.2.md` | `docs/upgrades/v5.1/` |
| Cron 报告 | `cron-v5.1.2.md` | `docs/upgrades/v5.1/` |

### 📝 升级报告模板

```markdown
# HeartFlow v5.1.2 升级报告

## 升级摘要
- 版本：v5.1.1 → v5.1.2
- 时间：YYYY-MM-DD HH:MM
- 主题：[一句话描述]

## 核心变更
### 新增
- 功能 1
- 功能 2

### 优化
- 优化 1
- 优化 2

### 修复
- 修复 1
- 修复 2

## 能力提升
| 维度 | 升级前 | 升级后 | 变化 |
|-----|-------|-------|------|
| 能力 1 | 85% | 88% | +3% |

## 理论来源
- SEP 理论名称
- 学术论文

## 兼容性
- [ ] 向后兼容
- [ ] 需要迁移

## 下一步
- v5.1.3 规划
```

### 🔄 季度合并策略

每季度末执行一次版本报告合并：
- Q1 (1-3 月): 合并 v5.1.x (x=1-50)
- Q2 (4-6 月): 合并 v5.2.x (x=1-50)
- 生成 `docs/upgrades/v5.1/Q1-2026-summary.md`

---

## 预期效果

### ✅ 优化后
- 根目录文件：80+ → 10 个以内
- 版本历史：清晰的时间线索引
- README: 精简专业，突出核心价值
- 文档导航：分层清晰，易于查找

### 📊 对比

| 项目 | 优化前 | 优化后 |
|-----|-------|-------|
| 根目录文件数 | 80+ | <10 |
| 升级报告查找 | 困难 | 索引导航 |
| 版本信息 | 过时 | 实时更新 |
| 仓库专业性 | 一般 | 专业 |

---

## 维护规则

1. **每次升级**: 文件直接写入 `docs/upgrades/vX.Y/`
2. **每 10 个小版本**: 创建合并报告
3. **每季度**: 归档旧版本，更新索引
4. **README**: 仅显示最新 3 个版本

---

**执行者**: 小虫子 · 严谨专业版  
**状态**: 方案待执行
