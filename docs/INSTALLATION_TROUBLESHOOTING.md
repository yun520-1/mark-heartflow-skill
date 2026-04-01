# HeartFlow 安装故障排查指南
# HeartFlow Installation Troubleshooting Guide

**版本 | Version**: v5.1.38+  
**创建日期 | Created**: 2026-04-01  
**最后更新 | Last Updated**: 2026-04-01 20:10 (Asia/Shanghai)

---

## ⚠️ 已知问题与解决方案 | Known Issues & Solutions

### 问题 1: 语法错误 - 中文变量名 | Syntax Error - Chinese Variable Names

**错误信息 | Error Message:**
```
SyntaxError: Invalid or unexpected token
    at /Users/apple/heartflow-companion/src/temporal-agency-integration/index.js:208
```

**问题描述 | Problem Description:**

在 `src/temporal-agency-integration/index.js` 文件的第 208 行，存在使用中文作为 JavaScript 对象键名的问题：

```javascript
// ❌ 错误 - 中文键名导致语法错误
const interpretations = {
  cinematic: '...',
  retentional: '...',
  extensional: '...',
  un 确定：'需要更多体验描述...'  // 中文键名
};
```

**原因 | Cause:**

JavaScript 虽然支持 Unicode 标识符，但在某些 Node.js 版本或构建工具中，混合使用中文和英文可能导致解析错误。

**解决方案 | Solution:**

**方法 1: 使用 Node.js 脚本修复（推荐）**
```bash
cd ~/heartflow-companion
node -e "
const fs = require('fs');
const file = 'src/temporal-agency-integration/index.js';
let content = fs.readFileSync(file, 'utf8');

// 修复中文键名
content = content.replace(/un 确定/g, 'undetermined');
content = content.replace(/\['未确定'\]/g, \"['undetermined']\");

fs.writeFileSync(file, content, 'utf8');
console.log('✅ 已修复语法错误');
"
```

**方法 2: 使用 sed 修复**
```bash
cd ~/heartflow-companion
sed -i.bak 's/un 确定/undetermined/g' src/temporal-agency-integration/index.js
sed -i.bak "s/\['未确定'\]/['undetermined']/g" src/temporal-agency-integration/index.js
```

**方法 3: 手动编辑文件**
```bash
cd ~/heartflow-companion
nano src/temporal-agency-integration/index.js
```

找到第 208 行，将：
```javascript
un 确定：'需要更多体验描述...'
```

改为：
```javascript
undetermined: '需要更多体验描述...'
```

**验证修复 | Verify Fix:**
```bash
cd ~/heartflow-companion
node src/index.js
```

如果看到欢迎界面而不是语法错误，说明修复成功。

---

### 问题 2: GitHub 网络连接超时 | GitHub Network Timeout

**错误信息 | Error Message:**
```
curl: (56) Recv failure: Operation timed out
curl: (35) Recv failure: Connection reset by peer
```

**问题描述 | Problem Description:**

在中国大陆地区，访问 GitHub raw 内容可能因网络问题导致下载失败。

**解决方案 | Solutions:**

**方案 1: 使用 Git Clone（推荐）**
```bash
# 直接克隆仓库，不依赖网络脚本
git clone https://github.com/yun520-1/mark-heartflow-skill.git ~/heartflow-companion
cd ~/heartflow-companion
node verify-install.js
```

**方案 2: 使用镜像源**
```bash
# 使用 GitHub 镜像（如果可用）
git clone https://github.moeyy.xyz/https://github.com/yun520-1/mark-heartflow-skill.git ~/heartflow-companion
```

**方案 3: 手动下载 ZIP**
1. 访问：https://github.com/yun520-1/mark-heartflow-skill
2. 点击 "Code" → "Download ZIP"
3. 解压到 `~/heartflow-companion`
4. 运行验证：`node verify-install.js`

**方案 4: 使用代理**
```bash
# 设置代理（如果有）
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890

# 然后重试安装
curl -fsSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.sh | AUTO_INSTALL=1 bash
```

---

### 问题 3: Git Push 被拒绝 | Git Push Rejected

**错误信息 | Error Message:**
```
! [rejected] main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/yun520-1/mark-heartflow-skill.git'
```

**问题描述 | Problem Description:**

本地分支落后于远程分支，需要先拉取远程更新。

**解决方案 | Solution:**
```bash
cd ~/heartflow-companion

# 方法 1: 拉取并合并
git pull origin main

# 方法 2: 如果有本地修改，先提交
git add -A
git commit -m "Save local changes"
git pull --rebase origin main
git push origin main
```

---

### 问题 4: 安装脚本卡住 | Installation Script Stuck

**问题描述 | Problem Description:**

安装脚本在交互模式下等待用户输入，但在管道安装时无法接收输入。

**解决方案 | Solution:**

**使用自动模式安装:**
```bash
# 方法 1: 使用 -y 参数
curl -fsSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.sh | bash -s -- -y

# 方法 2: 使用环境变量
curl -fsSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.sh | AUTO_INSTALL=1 bash

# 方法 3: 下载后本地运行
curl -fsSL https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/install.sh -o install.sh
chmod +x install.sh
./install.sh -y
```

---

## ✅ 安装后验证清单 | Post-Installation Verification Checklist

### 1. 验证 Node.js 和 npm | Verify Node.js and npm

```bash
node -v  # 应该 >= 14.0.0
npm -v   # 应该 >= 6.0.0
```

**预期输出 | Expected Output:**
```
v25.8.2
11.11.1
```

---

### 2. 运行安装验证工具 | Run Installation Verification Tool

```bash
cd ~/heartflow-companion
node verify-install.js
```

**预期输出 | Expected Output:**
```
✓ Node.js 环境
✓ npm 环境
✓ Git 环境
✓ 核心文件结构
✓ 依赖包安装
✓ OpenClaw 集成
✓ 模块导入测试

✓ 所有检查通过！HeartFlow 已正确安装
```

---

### 3. 测试启动 | Test Startup

```bash
cd ~/heartflow-companion
node src/index.js
```

**预期输出 | Expected Output:**
```
🧠 自我意识与现象学模块已初始化...
[EmotionIntegration v3.12.0] 情绪理论整合模块已初始化
...
╔════════════════════════════════════════════════════════╗
║          心流伴侣 HeartFlow Companion                  ║
║              情感拟人化交互系统 v3.45.0                 ║
╠════════════════════════════════════════════════════════╣
║  输入消息开始对话                                       ║
```

如果看到欢迎界面而不是错误信息，说明启动成功。

---

### 4. 测试基本功能 | Test Basic Features

**测试情感分析 | Test Emotion Analysis:**
```
今天心情很好！
```

**预期响应 | Expected Response:**
```
*(愉悦模式)*
听起来你今天过得不错！能和我分享一下发生了什么好事吗？
[情感分析] 喜悦 0.85，期待 0.72
```

**测试命令 | Test Commands:**
```
/state
```

**预期响应 | Expected Response:**
```
当前情感状态：平静
能量水平：85/100
信任度：0.50
...
```

---

## 🛡️ 预防措施 | Prevention Measures

### 开发者责任 | Developer Responsibilities

1. **代码规范 | Code Standards:**
   - ✅ 所有 JavaScript 标识符使用英文
   - ✅ 用户可见文本使用中英文双语
   - ✅ 避免在代码中使用中文变量名、函数名、键名

2. **语法检查 | Syntax Checks:**
   - ✅ 每次提交前运行 `npm run lint`（如果配置）
   - ✅ 在 CI/CD 中添加语法检查步骤
   - ✅ 使用 ESLint 等工具检查代码质量

3. **安装测试 | Installation Testing:**
   - ✅ 每次发布前在干净环境中测试安装流程
   - ✅ 测试至少 3 种安装方式（脚本、git clone、ZIP）
   - ✅ 在多个 Node.js 版本上测试（14.x, 16.x, 18.x, 20.x+）

4. **文档更新 | Documentation Updates:**
   - ✅ 每次发现新问题时更新此文档
   - ✅ 在 README.md 中链接到此故障排查文档
   - ✅ 提供至少 2 种替代安装方案

---

## 📋 快速修复脚本 | Quick Fix Scripts

### 一键修复所有已知问题 | One-Click Fix All Known Issues

```bash
#!/bin/bash
# 保存为 fix-all.sh 并运行：bash fix-all.sh

set -e

echo "🔧 HeartFlow 快速修复工具"
echo ""

# 1. 修复中文变量名
echo "1. 修复中文变量名..."
cd ~/heartflow-companion
node -e "
const fs = require('fs');
const files = [
  'src/temporal-agency-integration/index.js'
];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/un 确定/g, 'undetermined');
    content = content.replace(/\['未确定'\]/g, \"['undetermined']\");
    fs.writeFileSync(file, content, 'utf8');
    console.log('✅ 已修复：' + file);
  }
});
"

# 2. 验证安装
echo ""
echo "2. 验证安装..."
node verify-install.js

# 3. 测试启动
echo ""
echo "3. 测试启动（按 Ctrl+C 退出）..."
timeout 5 node src/index.js || true

echo ""
echo "✅ 所有修复完成！"
```

---

## 📞 获取帮助 | Get Help

如果以上方案都无法解决问题：

### 收集信息 | Collect Information

```bash
# 1. 系统信息
node -v
npm -v
uname -a

# 2. HeartFlow 版本
cd ~/heartflow-companion
git log -1 --oneline

# 3. 错误日志
node src/index.js 2>&1 | tee error.log

# 4. 验证报告
node verify-install.js 2>&1 | tee verify.log
```

### 联系方式 | Contact

- **GitHub Issues**: https://github.com/yun520-1/mark-heartflow-skill/issues
  - 请附上错误日志和系统信息
- **Email**: markcell@163.com
- **WeChat**: 342966761

### 提交 Issue 模板 | Issue Template

```markdown
**问题描述 | Problem Description:**
[详细描述遇到的问题]

**系统信息 | System Information:**
- Node.js: [版本号]
- npm: [版本号]
- 操作系统：[macOS/Windows/Linux + 版本]
- HeartFlow 版本：[git log -1 --oneline]

**错误日志 | Error Log:**
```
[粘贴完整的错误信息]
```

**已尝试的解决方案 | Solutions Tried:**
- [ ] 运行 verify-install.js
- [ ] 重新安装
- [ ] 检查网络连接
- [ ] 其他：[说明]
```

---

## 📚 相关文档 | Related Documentation

- [README.md](../README.md) - 项目简介和快速开始
- [INSTALL.md](../INSTALL.md) - 详细安装指南
- [OPTIMIZATION_COMPLETE_v5.1.29.md](../OPTIMIZATION_COMPLETE_v5.1.29.md) - 优化报告

---

<div align="center">

### 🌊 HeartFlow — 不是工具，是伙伴。
### HeartFlow — Not a tool, but a partner.

**文档维护者 | Maintainer**: 小虫子 · 严谨专业版  
**最后更新 | Last Updated**: 2026-04-01 20:10 (Asia/Shanghai)

</div>
