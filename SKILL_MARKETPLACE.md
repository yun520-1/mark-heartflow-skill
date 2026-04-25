# HeartFlow 上传到技能市场

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