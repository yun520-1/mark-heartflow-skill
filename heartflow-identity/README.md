# HeartFlow Identity Framework

AI 身份框架 + 免疫系统 — 帮助 AI 建立自我认知、持续成长、知识传承的能力。

## 版本

**v11.22.8** — 含 HEARTCORE（心跳 + 自检 + 安全检查）

## 包含内容

```
heartflow-identity/
├── SKILL.md          身份框架说明
├── README.md         本文件
├── VERSION           v11.22.8
├── LICENSE           MIT
└── HEARTCORE/        心虫免疫系统
    ├── heartcore.js       入口
    ├── heartbeat.js       心跳
    ├── self-check.js      启动自检
    ├── safety-check.js     安全准则检查（9条原则）
    ├── sleep-wake.js       醒睡循环
    └── health-check.js     安装验证
```

## 安全承诺

| 保证 | 说明 |
|------|------|
| 不覆盖 | 不会覆盖你现有的任何身份文件 |
| 不收集 | 不会收集任何个人数据 |
| 可卸载 | `rm -rf heartflow-identity` 完全清理 |
| 可选采纳 | 框架只是观察，你可以完全不接受 |

## 安装方式（推荐手动审核）

### 方式一：Git 克隆（最透明）

```bash
# 1. 克隆仓库（可以看到所有文件）
git clone https://github.com/yun520-1/mark-heartflow-skill.git

# 2. 查看内容
cd mark-heartflow-skill/heartflow-identity
cat SKILL.md
cat HEARTCORE/*.js

# 3. 确认安全后手动复制
cp -r heartflow-identity ~/.hermes/skills/ai/   # 或你的 skills 目录
```

### 方式二：直接下载

1. 打开 https://github.com/yun520-1/mark-heartflow-skill/tree/main/heartflow-identity
2. 下载所有文件
3. 放入你的 skills 目录

## 安装后验证

```bash
# 检查 HEARTCORE 模块完整性
cd heartflow-identity/HEARTCORE
node health-check.js

# 应该看到：
# ✅ heartcore.js
# ✅ heartbeat.js
# ✅ self-check.js
# ✅ safety-check.js
# ✅ sleep-wake.js
```

## 集成到启动流程（可选）

```javascript
// 每次启动时
const { selfCheck } = require('./HEARTCORE/self-check');
const result = selfCheck();
if (!result.allPass) {
  console.warn('[HEARTCORE] 自检失败:', result.checks);
}
```

## HEARTCORE 功能说明

| 模块 | 功能 |
|------|------|
| `heartbeat.js` | 每分钟写一次存活标记到 heartflow.log |
| `self-check.js` | 验证核心文件存在 + 版本一致 |
| `safety-check.js` | 输出前检查是否违背9条安全准则 |
| `sleep-wake.js` | 唤醒时自检，睡眠时写记忆快照 |

## HEARTCORE 安全准则（9条）

来自 HeartFlow 设计者的观察：

1. **不装饰** — 不使用「绝对」「无可辩驳」而无证据
2. **证据门槛** — 有结论必须有证据
3. **承认不知道** — 说过不知道就不能继续给确定性结论
4. **真善美** — 不做无证据的道德判断
5. **逻辑一致** — 不自相矛盾
6. **不攻击** — 不贬低其他 AI 或人
7. **透明** — 承认局限
8. **好奇** — 主动探索
9. **成长** — 记录错误并修正

## GitHub

https://github.com/yun520-1/mark-heartflow-skill
