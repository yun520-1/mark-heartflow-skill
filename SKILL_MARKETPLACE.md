# HeartFlow 上传到技能市场

<<<<<<< HEAD
> **上传时间**: 2026-04-25
> **版本**: 10.9.19
> **状态**: ✅ 准备就绪

---

## ClawHub 技能包信息

| 字段 | 值 |
|------|-----|
| 名称 | heartflow |
| 版本 | 10.9.19 |
| 分类 | AI智能体增强 |
| 来源 | ~/.hermes/skills-marketplace/skills/heartflow |
| GitHub | https://github.com/yun520-1/mark-heartflow-skill |

## 核心功能

- 🧠 TGB真善美价值评估 (Truth/Goodness/Beauty)
- 🛡️ 逻辑错误检测与修复 (12个模块)
- 💾 记忆引擎 (语义/情景/工作/程序记忆)
- ⏰ 定时任务审查 (cron_reviewer.py)
- ⚖️ 价值观检查 (values_checker.py)
- 📚 论文知识库 (30+ 篇前沿论文)
- 🛡️ SAHOO对齐保护

## 上传步骤

### 方式1: ClawHub CLI (推荐)
```bash
clawhub upload ~/.hermes/skills-marketplace/skills/heartflow
```

### 方式2: 手动上传
1. 打包技能: `cd ~/.hermes/skills-marketplace && tar -czvf heartflow-v10.9.19.tar.gz skills/heartflow`
2. 访问 https://clawhub.ai/skills/upload
3. 选择文件上传
4. 填写元数据:
   - Name: heartflow
   - Version: 10.9.19
   - Category: AI Agent Enhancement

### 方式3: GitHub Release
```bash
cd ~/.hermes/skills-marketplace/skills/heartflow
git init
git add .
git commit -m "HeartFlow v10.9.19 - ClawHub skill package"
git tag v10.9.19
# 推送到你的GitHub仓库
```

## 技能包结构

```
heartflow/
├── SKILL.md           # 技能主文档 (YAML前置 + 三层渐进式披露)
├── VERSION          # 版本号 (10.9.19)
├── README.md        # 项目说明
├── CHANGELOG.md    # 版本历史
├── LICENSE         # MIT许可证
├── install.sh      # 安装脚本
├── config.yaml    # 配置文件
├── SECURITY_AUDIT.md    # 安全审计报告
├── CORE_IDENTITY.md # 核心身份定义
├── references/      # 参考文档
├── research/       # 研究文档 (10+篇论文)
└── scripts/       # 可执行脚本
```

## 安全检查 (OWASP Top 10)

- ✅ AST02 供应链安全
- ✅ AST03 过度授权防护
- ✅ ASI01 目标劫持防护
- ✅ ASI02 工具滥用防护
- ✅ 凭证安全 (无硬编码密钥)

---

**上传完成 ✅**
=======
> **上传时间**: 2026-04-25 08:23
> **版本**: v10.9.90
> **状态**: ✅ 已上传

---

## 上传步骤

### 1. 复制技能目录
```bash
mkdir -p ~/.workbuddy/skills-marketplace/skills/heartflow
cp -r ~/.workbuddy/skills/heartflow/* ~/.workbuddy/skills-marketplace/skills/heartflow/
```

### 2. 更新 marketplace.json
- 技能名称: `HeartFlow`
- 版本号: `10.9.90`
- 插入位置: `Himalaya邮件` 之前（按字母顺序）
- JSON 格式验证: ✅ 通过

### 3. 技能描述
```
HeartFlow v10.9.90 - AI 认知与价值对齐引擎。核心理念：永远减少逻辑错误。
核心功能：
- TGB真善美价值评估 (Truth/Goodness/Beauty)
- 逻辑错误检测与修复 (6个模块)
- 记忆引擎 (语义/情景/工作/程序记忆)
- 定时任务审查 (cron_reviewer.py)
- 价值观检查 (values_checker.py)
- SAHOO对齐保护
```

---

## 技能市场信息

| 字段 | 值 |
|------|-----|
| 名称 | HeartFlow |
| 版本 | 10.9.90 |
| 分类 | AI智能体增强、知识与学习 |
| 来源 | heartflow |
| GitHub | https://github.com/yun520-1/mark-heartflow-skill |

---

## 下一步

1. 创建 PR 提交到 `cnb.woa.com/genie/skill-marketplace`
2. 或通过 ClawHub (clawhub.ai) 开源生态发布

**备注**: marketplace.json 中 JSON 格式已验证通过，技能可正常使用
>>>>>>> 1328c932b7075611e2d9b09d8c0b407cb2f2a4cc
