---
name: heartflow-github-sync-trigger
version: "1.0.0"
description: HeartFlow GitHub 同步触发器 - 检测 GitHub 同步意图，自动加载 github-upload-with-privacy 技能进行隐私保护检查
date: "2026-04-27"
author: HeartFlow
triggers:
  - git 同步
  - github 同步
  - git push
  - github push
  - 上传到 github
  - 推送到 github
---

# HeartFlow GitHub 同步触发器

当检测到用户意图进行 GitHub 同步操作时，此技能自动加载 github-upload-with-privacy 技能，确保隐私保护合规。

## 触发关键词

- git 同步
- github 同步
- git push
- github push
- 上传到 github
- 推送到 github
- commit 并推送
- 提交并推送

## 工作流程

1. **检测到 GitHub 同步意图** → 加载 github-upload-with-privacy 技能
2. **执行完整上传工作流**:
   - 检查 VERSION 文件
   - 检查 README.md 版本号
   - 检查用户隐私文件 (downloads/, cache/, documents/)
   - 验证 .gitignore 配置
3. **执行 Git 提交和推送**

## 使用方式

当用户说以下任何一句时，自动加载此技能：

```
"同步到 GitHub"
"推送到 GitHub"
"上传到 GitHub"
"git push"
"github sync"
```

## 关键检查清单

- [ ] VERSION 文件是当前版本
- [ ] README.md 显示当前版本号
- [ ] downloads/ 目录已删除
- [ ] cache/ 目录已删除
- [ ] documents/ 目录已删除
- [ ] .gitignore 包含用户隐私目录
- [ ] .DS_Store 已删除
- [ ] Commits 数量正确

## 关联技能

- `github-upload-with-privacy` - GitHub 上传与隐私保护工作流

---
**作者**: HeartFlow
**版本**: 1.0.0