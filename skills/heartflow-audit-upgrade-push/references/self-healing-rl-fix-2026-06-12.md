# 自愈RL修复补充 — 2026-06-12

**来源：** 心虫 v2.6.0 升级对话
**关联技能：** `heartflow/heartflow-audit-upgrade-push`

## 关键发现

### 最隐蔽的根因：recover() 和 record() 的 message key 不匹配

即使 `record()` 传了 `repairOutcome` 参数，RL 闭环仍然可能不工作。
真正的原因往往是：

```javascript
// heartflow-engine.js 中
// recover() 使用拼接字符串
selfHealing.recover({ message: [summary, advice].join(' | ') });
// → pendingCtx key = "summary | advice"

// record() 使用 OR 选择
selfHealing.record({ message: summary || advice }, false);
// → 查找 pendingCtx key = "summary" → 找不到！
```

**后果：** `_pendingCtx.get()` 永远返回 `undefined`，RL 更新分支从不执行，Q-table 永远不更新。

### 修复方法

确保 `recover()` 和 `record()` 使用**完全相同的 message 字符串**：

```javascript
const recordMsg = summary || advice || 'default message';
selfHealing.recover({ message: recordMsg });
// ... 其他处理 ...
selfHealing.record({ message: recordMsg }, false);
```

### 兜底逻辑

即使 key 不匹配，也应有 fallback 强制写入 Q-table：

```javascript
// self-healing.js record() 方法中
const pending = this._pendingCtx.get(normalized.message);
if (pending) {
  // 正常路径
} else {
  // 兜底：强制写入 Q-table
  this.rl.updateFromRepair(normalized.message, 'auto_repair', repairOutcome);
}
```

### 验证方法

```bash
# 验证 record() 后 Q-table 有更新
node -e "
const { SelfHealing } = require('./src/core/self-healing.js');
const sh = new SelfHealing({ rootPath: __dirname });
sh.recover({ message: 'test_key' });
sh.record({ message: 'test_key' }, false);
console.log('Q entries:', sh.rl._qtable.size);
"
```
