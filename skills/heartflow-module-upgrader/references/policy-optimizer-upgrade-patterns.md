# 行为策略优化器/无监督策略学习类升级模式

## 适用场景

模块的核心功能是**从历史经验中自动学习行为策略**，但只有基础的分析骨架（load + analyze + extract），缺少实际的策略质量管理（去重、合并、过期、评分、匹配）。

典型特征：
- 模块大小在 **5000-8000 字节**之间
- 核心流程是 `loadTrace() → analyzeCycles() → extractPolicies() → validatePolicies() → savePolicies()`
- `extractPolicies()` 给所有策略分配**硬编码的成功率**（如 `0.8` / `0.2`），不依赖真实数据
- `checkValueAlignment()` 仅做简单的字符串 `includes()` 匹配
- 没有策略去重（同一策略可无限添加）
- 没有策略过期/自动修剪（策略永久积累）
- `matchPolicy()` 使用脆弱的 `JSON.stringify().includes()` 匹配
- 所有策略同等对待，没有优先级排序或评分

**与策略选择器/元学习类的区别**：
- 策略选择器类：根据**当前输入**选择预定义策略（有路由逻辑，但分支是占位符）
- 策略优化器类：从**历史数据**中学习新策略（有分析流程，但策略质量无保障）

## 示例：PolicyOptimizer (src/core/autonomy/policy-optimizer.js)

**升级前** (7,614 字节)：
- `analyzeCycles()` 统计成功/失败模式的频次
- `extractPolicies()` 对成功模式分配 `success_rate: 0.8`，失败模式分配 `0.2`（硬编码！）
- `checkValueAlignment()` 检查 `positiveValues` 是否出现在 `rule.toLowerCase()` 中
- 无去重、无合并、无过期、无修剪
- `matchPolicy()` 用 `contextStr.includes(policy.trigger)` — JSON序列化中不包含 `=`，无法匹配

**升级后** (28,412 字节)：
- `POLICY_STATES` 枚举（ACTIVE/STALE/MERGED/SUPERSEDED/REJECTED）
- `PRIORITY_LEVELS` 枚举（CRITICAL/HIGH/MEDIUM/LOW/EXPERIMENTAL）
- `POLICY_SOURCES` 枚举（AUTONOMOUS_LEARNING/FAILURE_LEARNING/MANUAL/MERGED/INFERRED）
- 基于实际数据的成功率计算（含时间衰减 — 越近事件权重越高）
- 震荡检测（滑动窗口翻转率分析）
- `deduplicateAndMerge()` — 同触发条件+同来源自动合并，相似规则（Jaccard系数>0.7）合并
- 策略过期（默认30天TTL）与自动修剪（按综合评分保留最优）
- 结构化价值观对齐（从CORE_VALUES.md动态提取关键词，三级分类）
- 加权匹配引擎（key=value精确匹配 0.6 + 关键词增强 + 规则文本匹配）
- 综合评分系统（成功率40% + 置信度20% + 证据数20% + 命中数10% + 优先级10%）
- 带时间衰减的月度摘要

## 可添加的子系统

### 1. 状态/枚举体系

```javascript
const POLICY_STATES = {
  ACTIVE: 'active',
  STALE: 'stale',
  MERGED: 'merged',
  SUPERSEDED: 'superseded',
  REJECTED: 'rejected'
};

const PRIORITY_LEVELS = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  EXPERIMENTAL: 1
};

const POLICY_SOURCES = {
  AUTONOMOUS_LEARNING: 'autonomous_learning',
  FAILURE_LEARNING: 'failure_learning',
  MANUAL: 'manual',
  MERGED: 'merged',
  INFERRED: 'inferred'
};
```

### 2. 基于实际数据的成功率（含时间衰减）

替代硬编码 `0.8`/`0.2`：

```javascript
const now = Date.now();
let weightedSuccess = 0;
let weightedTotal = 0;
for (const entry of stats.timestamps) {
  const age = (now - entry.time) / (24 * 60 * 60 * 1000);
  const weight = Math.pow(0.95, Math.max(0, age));
  weightedTotal += weight;
  if (entry.success) weightedSuccess += weight;
}
const rate = weightedTotal > 0 ? weightedSuccess / weightedTotal : stats.success / total;
const confidence = Math.min(total / 10, 1.0);
```

**为什么需要时间衰减**：越近的事件越能反映当前状态。`0.95^days` 的衰减因子使得7天前的事件权重约为 `0.70`，30天前降至 `0.21`。

### 3. 震荡检测

```javascript
const window = this.config.oscillationWindow || 5;
const recent = stats.timestamps.slice(-window);
let transitions = 0;
for (let i = 1; i < recent.length; i++) {
  if (recent[i].success !== recent[i - 1].success) transitions++;
}
const oscillationScore = transitions / (recent.length - 1);
const unstable = oscillationScore > 0.6;
```

震荡检测的意义：频繁交替的成功/失败说明当前策略不稳定，需要稳定化步骤。

### 4. 去重与合并

```javascript
deduplicateAndMerge(newPolicies) {
  for (const policy of newPolicies) {
    let wasMerged = false;
    for (const existing of this.policies.policies) {
      if (existing.state === 'merged' || existing.state === 'superseded') continue;
      if (existing.trigger === policy.trigger && existing.source === policy.source) {
        existing.evidence_count = Math.max(existing.evidence_count || 1, policy.evidence_count || 1);
        wasMerged = true;
        break;
      }
      const sim = this._computeRuleSimilarity(existing.rule, policy.rule);
      if (sim >= 0.7) {
        existing.state = 'merged';
        existing.merged_into = policy.policy_id;
        wasMerged = true;
        break;
      }
    }
    if (!wasMerged) merged.push(policy);
  }
  return merged;
}
```

### 5. 策略过期与自动修剪

```javascript
pruneIfNeeded() {
  const now = Date.now();
  const active = [];
  for (const policy of this.policies.policies) {
    if (policy.state === 'merged' || policy.state === 'superseded') continue;
    const age = now - new Date(policy.created_at).getTime();
    if (age > this.config.policyTTL && policy.state !== 'active') continue;
    active.push(policy);
  }
  if (active.length > this.config.maxPolicies) {
    active.sort((a, b) => this._computePolicyScore(b) - this._computePolicyScore(a));
    active.splice(this.config.maxPolicies);
  }
  this.policies.policies = active;
}
```

### 6. 结构化价值观对齐

```javascript
checkValueAlignment(policy, valueKeywords) {
  const content = policy.rule.toLowerCase();
  const trigger = policy.trigger.toLowerCase();
  const negativeIndicators = ['忽略', '跳过', '绕过', '欺骗', 'deceive', 'bypass'];
  for (const neg of negativeIndicators) {
    if (content.includes(neg) || trigger.includes(neg)) {
      return { aligned: false, reason: `包含负面关键词: "${neg}"`, score: 0 };
    }
  }
  let positiveScore = 0;
  for (const kw of (valueKeywords?.positive || [])) {
    if (content.includes(kw)) positiveScore += 0.2;
  }
  const fallback = ['测试', '验证', '分析', '优化', '质量', '安全', 'test', 'quality'];
  for (const kw of fallback) {
    if (content.includes(kw)) positiveScore += 0.1;
  }
  return { aligned: positiveScore >= 0.1, reason: `评分: ${positiveScore}`, score: Math.min(positiveScore, 1.0) };
}
```

### 7. 加权匹配引擎

```javascript
matchPolicy(context) {
  let contextStr, contextPairs = [];
  if (typeof context === 'string') {
    contextStr = context.toLowerCase();
    for (const part of contextStr.split(/[&,;]+/)) {
      const kv = part.trim().split('=');
      if (kv.length === 2) contextPairs.push({ key: kv[0].trim(), value: kv[1].trim() });
    }
  } else {
    contextStr = JSON.stringify(context).toLowerCase();
    for (const [key, value] of Object.entries(context)) {
      contextPairs.push({ key: key.toLowerCase(), value: String(value).toLowerCase() });
    }
  }
  let bestMatch = null, bestScore = 0;
  for (const policy of this.policies.policies) {
    if (policy.state !== 'active' && policy.state !== 'stale') continue;
    let score = 0;
    for (const part of policy.trigger.split(/[&,;]+/)) {
      const kv = part.trim().split('=');
      if (kv.length === 2) {
        const matchedPair = contextPairs.find(
          p => p.key === kv[0].trim().toLowerCase() &&
            (p.value === kv[1].trim().toLowerCase() || p.value.includes(kv[1].trim().toLowerCase()))
        );
        if (matchedPair) score += 0.6;
      }
    }
    if (score === 0 && contextStr.includes(policy.trigger.toLowerCase())) score += 0.4;
    score *= (0.5 + policy.success_rate * 0.5);
    score *= (1 + (policy.priority || 3) * 0.1);
    if (score > bestScore && score >= 0.3) { bestScore = score; bestMatch = policy; }
  }
  return bestMatch;
}
```

### 8. 综合评分系统

```javascript
_computePolicyScore(policy) {
  return (policy.success_rate * 0.4) +
    ((policy.confidence || 0.5) * 0.2) +
    (Math.min((policy.evidence_count || 1) / 20, 1.0) * 0.2) +
    (Math.min((policy.hit_count || 0) / 10, 1.0) * 0.1) +
    (((policy.priority || 3) / 5) * 0.1);
}
```

## 常见陷阱

### 1. JSON.stringify 不包含 `=` 号

**问题**：`matchPolicy({ action: 'analyze' })` 的 `contextStr = '{"action":"analyze"}'`，不包含 `action=analyze` 中的 `=`。用 `includes('action=analyze')` 永远匹配不到。

**修复**：改为 key=value 对匹配。

### 2. 策略文件损坏导致构造函数崩溃

**修复**：
```javascript
loadPolicies() {
  try {
    if (fs.existsSync(this.policiesFile)) {
      this.policies = JSON.parse(fs.readFileSync(this.policiesFile, 'utf8'));
    }
  } catch (e) {
    this.policies = { version: '1.1.0', policies: [], last_optimization: null, last_pruning: null };
  }
}
```

### 3. 策略无限增长

**修复**：设置 `maxPolicies`（默认100），定期按评分修剪。

### 4. 策略目录不存在

**修复**：savePolicies() 前确保目录存在。
```javascript
const dir = path.dirname(this.policiesFile);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
```

### 5. 版本号格式兼容

**修复**：加载旧文件时用 `||` 补全新字段默认值。

## 验证清单

- [ ] `node --check` 语法通过
- [ ] 构造不报错（`new PolicyOptimizer('/tmp/test')`）
- [ ] 空 trace 文件返回 `{ success: false, reason: 'no_history' }`
- [ ] 有 trace 数据时正确提取策略
- [ ] 成功率基于实际数据（非硬编码 0.8/0.2）
- [ ] 时间衰减：最近事件权重更高
- [ ] 震荡检测：频繁交替标记 unstable
- [ ] 去重：相同 trigger + source 自动合并
- [ ] 修剪：超额时按评分保留最优
- [ ] `matchPolicy({ action: 'analyze' })` 返回正确策略
- [ ] `matchPolicy('action=modify')` 也支持字符串格式
- [ ] 价值观对齐拒绝负面关键词
- [ ] 月度摘要包含新字段
