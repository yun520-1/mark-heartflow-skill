# HeartFlow Companion 安装指南 | Installation Guide

> **5 分钟完成安装，开始你的情感陪伴之旅**  
> **Complete installation in 5 minutes and start your emotional companionship journey**

---

## 📋 系统要求 | System Requirements

| 组件 | 要求 | 检查方法 |
|------|------|---------|
| **Node.js** | >= 14.0.0 | `node -v` |
| **npm** | >= 6.0.0 | `npm -v` |
| **Git** | 任意版本 | `git --version` |
| **操作系统** | macOS / Linux / Windows 10+ | - |

### 安装依赖 | Install Dependencies

**macOS:**
```bash
# 使用 Homebrew (推荐)
brew install node git

# 或者从官网下载
# https://nodejs.org/
# https://git-scm.com/download/mac
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm git
```

**Linux (CentOS/RHEL):**
```bash
sudo yum install nodejs npm git
```

**Windows:**
- Node.js: https://nodejs.org/ (下载 LTS 版本)
- Git: https://git-scm.com/download/win

---

## 🚀 快速安装 | Quick Install

### 方法 1: 一键安装脚本（推荐）| One-Click Install (Recommended)

**macOS / Linux:**
```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.sh | bash
```

**Windows (PowerShell):**
```powershell
# 下载并运行安装脚本
iwr -useb https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.bat | iex
```

安装脚本会自动：
- ✅ 检查系统依赖
- ✅ 克隆仓库到 `~/heartflow-companion`
- ✅ 安装所有依赖包
- ✅ 配置 OpenClaw 集成
- ✅ 创建全局启动命令

---

### 方法 2: 手动安装 | Manual Install

**步骤 1: 克隆仓库 | Clone Repository**
```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git ~/heartflow-companion
```

**步骤 2: 进入目录 | Enter Directory**
```bash
cd ~/heartflow-companion
```

**步骤 3: 安装依赖 | Install Dependencies**
```bash
npm install
```

**步骤 4: 验证安装 | Verify Installation**
```bash
npm run verify
```

**步骤 5: 运行演示 | Run Demo**
```bash
npm run demo
```

---

## 🔧 OpenClaw 集成配置 | OpenClaw Integration

### 自动配置（推荐）| Automatic Configuration

安装脚本会自动创建符号链接。如果手动配置：

**macOS / Linux:**
```bash
ln -s ~/heartflow-companion ~/.jvs/.openclaw/workspace/heartflow-companion
```

**Windows (管理员 PowerShell):**
```powershell
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.jvs\.openclaw\workspace\heartflow-companion" -Target "$env:USERPROFILE\heartflow-companion"
```

### 验证集成 | Verify Integration

在 OpenClaw 中测试：
```
/heartflow help
```

如果看到帮助信息，说明集成成功！

---

## ✅ 验证安装 | Verify Installation

### 运行验证工具 | Run Verification Tool

```bash
cd ~/heartflow-companion
npm run verify
```

**输出示例 | Example Output:**
```
╔═══════════════════════════════════════════════════════════╗
║   🌊  HeartFlow Companion  安装验证工具                  ║
╚═══════════════════════════════════════════════════════════╝

✓ Node.js 环境
  Node.js v24.14.0 ✓

✓ npm 环境
  npm 11.4.0

✓ Git 环境
  git version 2.39.0

✓ 核心文件结构
  所有核心文件存在

✓ 依赖包安装
  无外部依赖

✓ OpenClaw 集成
  符号链接已配置：~/.jvs/.openclaw/workspace/heartflow-companion → ~/heartflow-companion

✓ 模块导入测试
  主模块可正常导入

═══════════════════════════════════════════════════════════

✓ 所有检查通过！HeartFlow 已正确安装

下一步:
  1. 启动 HeartFlow:  node src/index.js
  2. 运行演示：node demo.js
  3. 查看文档：https://github.com/yun520-1/mark-heartflow-skill
```

---

## 🎯 快速开始 | Quick Start

### 启动 HeartFlow | Start HeartFlow

**命令行启动 | CLI:**
```bash
heartflow
# 或
node ~/heartflow-companion/src/index.js
```

**OpenClaw 中使用 | In OpenClaw:**
```
/heartflow
```

### 基本命令 | Basic Commands

| 命令 | 描述 | 示例 |
|------|------|------|
| `/heartflow` | 启动交互模式 | `/heartflow` |
| `/heartflow analyze <文本>` | 情感分析 | `/heartflow analyze 今天心情很好` |
| `/heartflow empathize <文本>` | 共情回应 | `/heartflow empathize 工作压力好大` |
| `/heartflow report` | 生成情感报告 | `/heartflow report` |
| `/heartflow profile` | 查看用户画像 | `/heartflow profile` |
| `/heartflow reset` | 重置状态 | `/heartflow reset` |

---

## 🐛 常见问题 | Troubleshooting

### 问题 1: "Node.js 版本过低"

**错误信息:**
```
✗ Node.js 版本过低 (需要 >= 14.0.0)
```

**解决方案:**
```bash
# 使用 nvm 升级 Node.js (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# 或者从官网下载最新版本
# https://nodejs.org/
```

---

### 问题 2: "权限不足，无法创建符号链接"

**错误信息:**
```
✗ 无法创建符号链接（需要管理员权限）
```

**解决方案 (macOS/Linux):**
```bash
# 手动创建符号链接
sudo ln -s ~/heartflow-companion ~/.jvs/.openclaw/workspace/heartflow-companion
```

**解决方案 (Windows):**
```powershell
# 以管理员身份运行 PowerShell
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.jvs\.openclaw\workspace\heartflow-companion" -Target "$env:USERPROFILE\heartflow-companion"
```

---

### 问题 3: "npm install 失败"

**错误信息:**
```
npm ERR! code EACCES
npm ERR! permission denied
```

**解决方案:**
```bash
# 清理 npm 缓存
npm cache clean --force

# 使用 sudo (不推荐，仅临时)
sudo npm install

# 或者修复 npm 权限 (推荐)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

### 问题 4: "模块导入失败"

**错误信息:**
```
✗ 模块导入失败：Cannot find module 'xxx'
```

**解决方案:**
```bash
cd ~/heartflow-companion

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 再次验证
npm run verify
```

---

### 问题 5: "OpenClaw 无法识别命令"

**错误信息:**
```
Unknown command: /heartflow
```

**解决方案:**

1. **检查符号链接:**
```bash
ls -la ~/.jvs/.openclaw/workspace/heartflow-companion
```

2. **重启 OpenClaw Gateway:**
```bash
openclaw gateway restart
```

3. **手动加载:**
在 OpenClaw 中运行：
```
/skills load heartflow-companion
```

---

## 📚 下一步 | Next Steps

### 1. 运行演示 | Run Demo
```bash
npm run demo
```

### 2. 查看完整文档 | View Full Documentation
- [项目简介](README.md)
- [API 文档](docs/API.md)
- [架构说明](docs/ARCHITECTURE.md)
- [版本升级](docs/upgrades/README.md)

### 3. 加入社区 | Join Community
- **GitHub**: https://github.com/yun520-1/mark-heartflow-skill
- **Issues**: https://github.com/yun520-1/mark-heartflow-skill/issues
- **Email**: markcell@163.com
- **WeChat**: 342966761

---

## 🎉 安装完成！| Installation Complete!

恭喜你完成 HeartFlow Companion 的安装！

**现在你可以:**
- ✅ 与 HeartFlow 进行情感对话
- ✅ 获得个性化的情感支持
- ✅ 记录和分析情绪变化
- ✅ 建立专属你的情感档案

**开始你的第一段对话:**
```bash
heartflow
# 然后输入：你好，我今天心情不太好...
```

---

<div align="center">

### 🌊 HeartFlow — 不是工具，是伙伴。
### HeartFlow — Not a tool, but a partner.

**最后更新**: 2026-04-01  
**维护者**: 小虫子 · 严谨专业版

</div>
