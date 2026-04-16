# HeartFlow v9.1.0 安装指南

## 版本信息
- 版本：9.1.0
- 更新日期：2026-04-16
- 核心更新：框架自我监控

---

## 快速开始

### 1. 下载 Skill
```bash
cd ~/.hermes/skills
git clone https://github.com/yun520-1/mark-heartflow-skill.git mark-heartflow
```

### 2. 启用 xinchong_guardian 插件（重要！）

框架监控功能需要启用 `xinchong_guardian` 插件。

**方法A：检查是否已存在**
```bash
ls ~/.hermes/plugins/xinchong_guardian/
# 如果存在，确保在 config.yaml 中启用
```

**方法B：如果插件不存在**
```bash
# 复制插件到正确位置
mkdir -p ~/.hermes/plugins/xinchong_guardian
# 复制 xinchong_guardian 插件文件到该目录
```

**启用插件（在 config.yaml 中）**
```yaml
plugins:
  enabled:
    - xinchong_guardian
```

---

## 功能验证

### 框架监控工作原理
1. 会话开始时，插件初始化追踪状态
2. 每次调用 `skill_view` 时，自动检测是否加载了 HeartFlow
3. 会话结束时，输出报告到 `~/.hermes/memory/_framework_tracking.json`

### 验证命令
```bash
# 查看框架追踪记录
cat ~/.hermes/memory/_framework_tracking.json

# 应该显示类似：
{
  "session_id": "xxx",
  "framework_called": true,  // 或 false
  "skill_view_calls": [...]
}
```

### 日志输出
- 如果调用了框架：`✅ 框架监控：本次会话调用了 HeartFlow`
- 如果没调用：`⚠️ 框架监控：本次会话未调用 HeartFlow！`

---

## 文件结构
```
mark-heartflow/
├── SKILL.md          # 主技能文件
├── VERSION.txt       # 版本号 (9.1.0)
├── scripts/          # 辅助脚本
└── references/       # 参考文档
```

---

## 常见问题

**Q: 为什么我的对话没有显示框架调用记录？**
A: 确保 xinchong_guardian 插件已启用，并检查 config.yaml 配置。

**Q: 显示"未调用 HeartFlow"怎么办？**
A: 这说明心虫没有加载 mark-heartflow 框架。你可以直接提醒心虫："请用 HeartFlow 框架思考"。

**Q: 插件放在哪里？**
A: `~/.hermes/plugins/xinchong_guardian/__init__.py`

---

## 更新日志
- v9.1.0：新增框架自我监控功能
- v9.0.0：三层做梦架构 + 存在性记忆
- v8.9：双向自升系统 + OpenClaw 记忆