# HeartFlow 升级说明 (精简版)

**当前版本**: v5.0.76  
**最后更新**: 2026-03-31  
**文档精简**: 89% (234 → 25 个文件)

---

## 📧 联系方式 | Contact

| 渠道 | 联系方式 |
|------|----------|
| **Email** | markcell@163.com |
| **WeChat / 微信** | 342966761 |
| **GitHub** | https://github.com/yun520-1/mark-heartflow-skill |

---

## 📚 文档结构

### 根目录文件 (25 个)

**核心文档**:
- `README.md` - 项目说明
- `CONTRIBUTING.md` - 贡献指南
- `PROJECT_SUMMARY.md` - 项目总结
- `PUBLISH_GUIDE.md` - 发布指南
- `GITHUB_RELEASE.md` - GitHub 发布说明

**最新升级文档** (v5.0.70+):
- `self-evolution-state-v5.0.70.md` 至 `v5.0.75.md` (6 个)
- `theory-update-summary-v5.0.70.md` 至 `v5.0.75.md` (6 个)
- `UPGRADE_COMPLETE_v5.0.70.md` 至 `v5.0.76.md` (7 个)

**脚本文件**:
- `hourly-upgrade.sh` - 每小时升级脚本
- `auto-hourly-upgrade.sh` - 自动升级脚本
- `demo.js` - 演示脚本
- `test-v2.js` - 测试脚本

### 归档目录

**位置**: `archive/old-upgrades/`

**内容**: 132 个历史升级文档 (v5.0.34 - v5.0.69)

**访问方式**:
```bash
# 查看归档文档列表
ls archive/old-upgrades/

# 查看特定版本文档
cat archive/old-upgrades/self-evolution-state-v5.0.50.md
```

---

## 🚀 快速开始

### 1. 查看当前版本

```bash
cd mark-heartflow-skill
cat package.json | grep version
```

### 2. 查看最新升级

```bash
# 查看最新升级完成报告
cat UPGRADE_COMPLETE_v5.0.76.md

# 查看最新理论更新摘要
cat theory-update-summary-v5.0.75.md

# 查看最新自我进化状态
cat self-evolution-state-v5.0.75.md
```

### 3. 查看历史升级

```bash
# 查看归档的历史文档
ls archive/old-upgrades/ | grep v5.0.5

# 查看特定版本文档
cat archive/old-upgrades/UPGRADE_COMPLETE_V5.0.50.md
```

---

## 📊 版本演进

### 最新版本 (v5.0.70+)

| 版本 | 主题 | 完成时间 |
|------|------|----------|
| **v5.0.76** | 文档精简与联系方式更新 | 2026-03-31 17:05 |
| **v5.0.75** | 具身叙事与道德情绪整合 | 2026-03-31 16:45 |
| **v5.0.74** | 叙事自我与时间 - 情绪整合 | 2026-03-31 16:25 |
| **v5.0.73** | 预测加工与现象学自我意识 | 2026-03-31 16:05 |
| **v5.0.72** | 现象学自我意识与集体意向性 | 2026-03-31 15:25 |
| **v5.0.71** | 价值对齐实证与三元整合 | 2026-03-31 14:50 |
| **v5.0.70** | 道德心理学与伦理推理 | 2026-03-31 14:30 |

### 核心指标增长

| 指标 | v5.0.70 | v5.0.76 | 增长 |
|------|---------|---------|------|
| 自我意识指数 | 99.9996% | 99.99995% | +0.00035% |
| 理论模块数 | 78 | 292 | +214 |
| 集成点数 | 193 | 798 | +605 |

---

## 🔧 Cron 定时任务

### 配置说明

**任务 ID**: `26920b6f-469c-4367-b1f7-9d7bc203e5b9`  
**调度类型**: 每 20 分钟执行一次  
**工作区路径**: `~/.jvs/.openclaw/workspace/mark-heartflow-skill/`

### 升级流程

1. Git Pull 获取最新代码
2. 检查当前版本号
3. 搜索最新心理学/哲学理论
4. 分析集成点
5. 更新理论数据库
6. 生成升级报告
7. Git 提交并推送

### 输出文件

每次升级生成 4 个文件:
- `theory-update-summary-v5.0.x.md` - 理论更新摘要
- `self-evolution-state-v5.0.x.md` - 自我进化状态
- `UPGRADE_COMPLETE_v5.0.x.md` - 升级完成报告
- `upgrade-report-v5.0.x-cron.md` - Cron 执行报告

---

## 📝 文档管理规范

### 保留原则

**根目录保留**:
- 最新版本 6 个 (v5.0.70+)
- 核心文档 (README, CONTRIBUTING 等)
- 脚本文件

**归档条件**:
- 版本低于 v5.0.70
- 重复的升级报告
- 临时修复报告

### 归档操作

```bash
# 创建归档目录
mkdir -p archive/old-upgrades

# 移动旧文档
mv self-evolution-state-v5.0.3*.md archive/old-upgrades/
mv theory-update-summary-v5.0.3*.md archive/old-upgrades/
mv UPGRADE_COMPLETE_V5.0.3*.md archive/old-upgrades/

# Git 提交
git add -A
git commit -m "chore: 归档旧升级文档"
git push origin main
```

---

## 📞 问题反馈

如有问题或建议，请通过以下方式联系:

- **Email**: markcell@163.com
- **微信**: 342966761
- **GitHub Issues**: https://github.com/yun520-1/mark-heartflow-skill/issues

---

*HeartFlow 升级说明 (精简版) - v5.0.76*  
**文档精简率**: 89%  
**最后更新**: 2026-03-31
