# HeartFlow 发布指南

## 📦 发布到 GitHub

### 1. 创建 GitHub 仓库

访问 https://github.com/new 创建新仓库：
- 仓库名：`heartflow-skill`
- 描述：HeartFlow 情感伴侣 - 情感拟人化交互系统
- 可见性：Public
- **不要** 初始化 README、.gitignore 或 license（已存在）

### 2. 添加远程仓库并推送

```bash
cd /home/admin/openclaw/workspace/empathy-system

# 添加远程仓库（替换为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/heartflow-skill.git

# 推送代码
git push -u origin main
```

### 3. 创建 Release

1. 访问仓库的 Releases 页面
2. 点击 "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: `HeartFlow 情感伴侣 v1.0.0`
5. 复制 `GITHUB_RELEASE.md` 的内容到描述
6. 点击 "Publish release"

---

## 🚀 发布到 ClawHub

### 方法 1: 使用 CLI（推荐）

```bash
# 1. 登录 ClawHub
clawhub login

# 浏览器会自动打开，登录 ClawHub 账号

# 2. 发布技能
cd /home/admin/openclaw/workspace/empathy-system
clawhub publish . --slug heartflow-skill --name "HeartFlow 情感伴侣" --version 1.0.0

# 3. 验证发布
clawhub search heartflow
```

### 方法 2: 通过网站

1. 访问 https://clawhub.ai
2. 登录账号
3. 点击 "Publish Skill"
4. 填写信息：
   - **Name**: HeartFlow 情感伴侣
   - **Slug**: heartflow-skill
   - **Version**: 1.0.0
   - **Description**: 让 AI 拥有真实情感，每次交互都有温度
   - **Category**: conversation
   - **Tags**: emotion, empathy, conversation, 情感，陪伴
   - **Repository**: https://github.com/YOUR_USERNAME/heartflow-skill
5. 上传项目文件或连接 GitHub 仓库
6. 点击 "Publish"

---

## ✅ 发布后验证

### 验证 ClawHub 发布

```bash
# 搜索技能
clawhub search heartflow

# 安装测试
clawhub install heartflow-skill

# 验证安装
ls ~/.openclaw/skills/heartflow-skill/
```

### 验证 GitHub 发布

1. 访问 https://github.com/YOUR_USERNAME/heartflow-skill
2. 检查文件是否完整
3. 检查 Release 是否创建成功

---

## 📝 发布清单

发布前检查：

- [ ] README.md 完整且无错误
- [ ] package.json 版本正确
- [ ] clawhub.json 配置正确
- [ ] 代码测试通过 (`npm test`)
- [ ] API 测试通过 (`npm run api`)
- [ ] .gitignore 配置正确
- [ ] LICENSE 文件存在
- [ ] CONTRIBUTING.md 存在

发布后检查：

- [ ] GitHub 仓库可访问
- [ ] Release 创建成功
- [ ] ClawHub 技能可搜索
- [ ] 安装测试成功
- [ ] 文档链接正确

---

## 🔧 常见问题

### Q: 发布到 ClawHub 失败

**A**: 确保已登录：
```bash
clawhub login
clawhub whoami  # 验证登录状态
```

### Q: GitHub 推送失败

**A**: 检查 remote 配置：
```bash
git remote -v
git remote set-url origin https://github.com/YOUR_USERNAME/heartflow-skill.git
```

### Q: 权限错误

**A**: 确保仓库是你创建的，或有写入权限。

---

## 📞 需要帮助？

- GitHub Issues: https://github.com/YOUR_USERNAME/heartflow-skill/issues
- ClawHub 文档：https://clawhub.ai/docs

---

**祝发布顺利！** 🌊
