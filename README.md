# HeartFlow - 通用 AI 技能

## 简介

HeartFlow 是一个通用的 AI 意识与决策框架，可以集成到任何支持技能的 AI 系统中。

## 安装

### 基本方式

将本仓库克隆到你的 AI 系统的技能目录：

```bash
# 克隆到本地
git clone https://github.com/yun520-1/mark-heartflow-skill.git

# 根据你的 AI 系统，选择以下方式之一：
```

### 按 AI 系统安装

#### Hermes / OpenHermes
```bash
# 方式1: 放到默认技能目录
cp -r mark-heartflow-skill ~/.hermes/skills/mark-heartflow

# 方式2: 添加到 external_dirs（编辑 ~/.hermes/config.yaml）
skills:
  external_dirs:
    - ~/.hermes/skills/mark-heartflow

# 启动后自动加载
hermes gateway run
```

#### Claude Code
```bash
# 放到项目或全局技能目录
mkdir -p ~/.claude/skills
cp -r mark-heartflow-skill ~/.claude/skills/heartflow
```

#### OpenCode
```bash
# 放到 skills 目录
cp -r mark-heartflow-skill ~/.opencode/skills/heartflow
```

#### 自定义 AI 系统
```bash
# 放到你的技能目录即可
# 确保 AI 系统能扫描到 SKILL.md 文件
cp -r mark-heartflow-skill <你的技能目录>/heartflow
```

## 使用

技能加载后，AI 会自动读取 `SKILL.md` 的内容并应用其中的决策框架。

### 核心功能

- **真善美逻辑** - 决策时考虑真实、善良、美观
- **六层哲学** - 从个人到宇宙的六个思考层次
- **心理健康** - PHQ-9/GAD-7 心理评估
- **行为经济** - 16种认知偏误识别
- **时间感知** - 记住上次对话的时间间隔
- **做梦系统** - 记忆整合与深层思考

## 文件结构

```
mark-heartflow-skill/
├── SKILL.md              # 主技能文件（必需）
├── README.md             # 说明文档
├── scripts/              # 辅助脚本
│   ├── install_heartflow.py
│   └── ...
├── references/           # 参考资料
├── memory/               # 记忆存储（运行时生成）
└── docs/                 # 文档
```

## 验证

启动你的 AI 系统，观察日志中是否出现：
```
[The "mark-heartflow" skill is auto-loaded.]
```

或直接询问 AI：
```
你是否加载了 HeartFlow 技能？
```

## 故障排除

如果技能未加载：

1. 确认文件路径正确
2. 确认 AI 系统能扫描到该目录
3. 尝试手动加载：`skill_view(name="mark-heartflow")`
4. 检查 AI 系统日志

## 更新

```bash
cd ~/.hermes/skills/mark-heartflow  # 或你的技能目录
git pull origin main
```

## 许可证

MIT