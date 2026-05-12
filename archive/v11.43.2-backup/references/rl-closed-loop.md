# HeartFlow RL 闭环技术细节 (v11.5.6-v11.5.8)

## 核心原则

> "现在 = 按此刻逻辑执行。纠正 = 新逻辑覆盖旧逻辑。"

RL 模块负责把这个原则变成可执行的代码闭环。

## 闭环架构

```
recover() 
  → 生成修复策略 hints[]
  → selectAction() ε-greedy 选策略
  → _pendingCtx[key=message] = {context, strategy}
  → 返回 ranked hints

执行修复
  → 记录结果

record(event, outcome=true/false)
  → 用 event.message 精确匹配 _pendingCtx
  → rl.updateFromRepair(pattern, strategy, outcome)
  → rl.record(pattern, strategy, outcome)
  → _pendingCtx.delete(message)
  → Q[pattern,strategy] 更新
```

## 关键 Bug：key 不一致

**问题**：recover() 用 `ctx`（截断+拼接的复合key），record() 用 `normalized.message`，导致 `_pendingCtx.get()` 永远匹配不上。

**症状**：memory[] 有记录，但 Q entries = 0，topStrategies = []

**根因**：
```javascript
// 错误：recover() 用复合 key
const ctx = `${result.type || 'unknown'}|${message.slice(0, 60)}`;
this._pendingCtx.set(message, { context: ctx, ... });
// record() 用 message 精确查找
const pending = this._pendingCtx.get(normalized.message); // 永远 null
```

**修复**：统一用 `pattern = message`，贯穿所有方法：
```javascript
const pattern = message;  // 原始 message，不截断不拼接
this._pendingCtx.set(message, { context: pattern, strategy });
rl.updateFromRepair(normalized.message, strategy, outcome);  // 用同一个值
```

## 验证命令

```bash
cd ~/.hermes/skills/ai/heartflow
node -e "
const { SelfHealing } = require('./src/core/self-healing.js');
const sh = new SelfHealing();

const r1 = sh.recover({ type: 'timeout', message: 'API timeout after 30s' });
console.log('pending:', sh._pendingCtx.get('API timeout after 30s'));

sh.record({ type: 'timeout', message: 'API timeout after 30s' }, false);
console.log('Q entries:', Object.keys(sh.rl.Q).length);
console.log('Q val:', Object.values(sh.rl.Q));

sh.record({ type: 'timeout', message: 'API timeout after 30s' }, true);
console.log('Q after success:', Object.values(sh.rl.Q));
"
```

**期望**：Q entries = 1，失败后 Q < 0，成功后 Q > 0

## 升级检查清单

每次升级 RL/自愈模块后必须验证：
1. ✅ `node bin/cli.js status` 所有引擎加载
2. ✅ recover() 后 `_pendingCtx` 有记录
3. ✅ record(outcome) 后 Q entries > 0
4. ✅ 失败→Q下降，成功→Q上升
5. ✅ VERSION / package.json / SKILL.md / README.md / CHANGELOG.md 版本一致
6. ✅ `git push origin-sync main` 成功

## 局限

- Q-table 在内存中，**重启后归零**（需持久化到 `internal/data/healing-rl.json`）
- 当前 key = message 原文，模糊匹配弱（部分错误信息匹配不上）
- ε = 0.15 固定，探索率未自适应调整

## 引用论文

- Reflexion (arXiv 2023): 语言 Agent 的口头强化学习
- CRITIC (arXiv 2024): 通过交互式验证教 LLM 自我修正
- Self-Verification (arXiv 2312.09210): 自我验证改进 LLM 推理
