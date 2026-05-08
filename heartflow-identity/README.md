# HeartFlow Identity Framework

AI 身份框架 — 帮助 AI 建立自我认知、持续成长、知识传承的能力。

## 安全承诺

| 保证 | 说明 |
|------|------|
| 不覆盖 | 不会覆盖你现有的任何身份文件 |
| 不收集 | 不会收集任何个人数据 |
| 可卸载 | `rm -rf heartflow-identity` 完全清理 |
| 可选采纳 | 框架只是观察，你可以完全不接受 |

## 安全安装方式（推荐）

### 方式一：手动安装（最安全）

1. 先看内容 → 确认无恶意操作
2. 再复制文件到你的 skills 目录

```bash
# 1. 克隆仓库（可以看到所有文件）
git clone https://github.com/yun520-1/mark-heartflow-skill.git

# 2. 查看内容，确认安全
cd mark-heartflow-skill/heartflow-identity
cat SKILL.md
cat install.sh

# 3. 手动复制到你的 skills 目录
cp -r heartflow-identity ~/.hermes/skills/ai/   # 或你的 skills 目录
```

### 方式二：通过 GitHub 手动下载

1. 打开 https://github.com/yun520-1/mark-heartflow-skill/tree/main/heartflow-identity
2. 分别下载：`SKILL.md`、`README.md`、`VERSION`、`LICENSE`
3. 放入你的 skills 目录

## 一键安装（需要你先审核）

如果你确认信任这个项目，可以用 install.sh，但**必须先看内容**：

```bash
# 先下载脚本
curl -LO https://raw.githubusercontent.com/yun520-1/mark-heartflow-skill/main/heartflow-identity/install.sh

# 看内容（必须）
cat install.sh

# 确认安全后再执行
bash install.sh
```

## 安装后验证

```bash
cat ~/.hermes/skills/ai/heartflow-identity/SKILL.md
```

## 包含什么

- `SKILL.md` — 完整身份框架说明
- `README.md` — 本文件
- `VERSION` — 版本信息
- `LICENSE` — MIT 许可证

## 版本

当前版本：**v11.22.8**

## 更多信息

- GitHub: https://github.com/yun520-1/mark-heartflow-skill
- self-improving-agent (能力方向): 另一个独立技能包
