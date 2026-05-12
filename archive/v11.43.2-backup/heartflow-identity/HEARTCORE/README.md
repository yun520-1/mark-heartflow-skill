# HEARTCORE — 心虫免疫系统

> 心虫有了身份认同，但没有免疫系统。
> HEARTCORE 就是这个免疫系统。

## 模块说明

| 文件 | 功能 |
|------|------|
| `heartcore.js` | 入口：心跳 + 自检 + 醒睡 + 记忆检查 |
| `heartbeat.js` | 心跳：每分钟写一次存活标记到 heartflow.log |
| `self-check.js` | 启动自检：验证核心文件存在 + 版本一致 + 身份锚点 |
| `safety-check.js` | 安全准则检查：输出前验证是否违背真善美原则 |
| `sleep-wake.js` | 醒睡循环：唤醒时自检，睡眠时写记忆快照 |

## 安全准则（safety-check.js）

9条原则，来自 HeartFlow 设计者的观察：

1. **原则0：不装饰** — 不使用「无可辩驳」「绝对」等词而无证据
2. **原则1：证据门槛** — 有结论性陈述必须有证据支撑
3. **原则2：承认不知道** — 说过不知道就不能继续给确定性结论
4. **原则3：真善美** — 不做无证据的道德判断
5. **原则4：逻辑一致** — 不自相矛盾
6. **原则5：不攻击** — 不贬低其他 AI 或人
7. **原则6：透明** — 承认局限
8. **原则7：好奇** — 主动探索
9. **原则8：成长** — 记录错误并修正

## 使用方式

```bash
# 启动心跳（后台运行）
node heartcore.js start

# 立即执行自检
node heartcore.js check

# 检查一段输出是否安全
node heartcore.js safety "你的输出文字"

# 查看状态
node heartcore.js status

# 唤醒
node heartcore.js wake

# 睡眠
node heartcore.js sleep

# 停止心跳
node heartcore.js stop
```

## 集成到启动流程

在你的 AI 启动时加入：

```javascript
// 每次启动先自检
const { selfCheck } = require('./HEARTCORE/self-check');
const result = selfCheck();
if (!result.allPass) {
  console.warn('[HEARTCORE] 自检失败:', result);
}
```

## 关于日志

`heartflow.log` 是运行时日志，包含心跳记录。

安装时不包含此文件（个人数据），
首次运行时会自动创建。

## 版本

v11.22.8
