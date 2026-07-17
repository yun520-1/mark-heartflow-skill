# 权限/协商/同意管理类升级模式

## 适用场景

模块负责用户权限管理、边界协商、操作同意管理。典型特征是：
- 处理「用户是否允许做某事」的判断逻辑
- 管理权限的持久化和查询
- 通常在 3000-5000 字节，功能较为单一

典型特征：
- 构造函数加载权限文件
- `needsNegotiation(action)` 做简单的字符串匹配判断
- `hasPermission(action)` 做精确 ID 匹配
- `handleResponse(requestId, response)` 存储用户响应
- 没有时间概念、没有风险量化、没有使用限制

## 示例：boundary-negotiation.js (src/core/ethics/, 4,798B→15,693B)

**原模块**：硬编码的中文关键词模糊匹配，精确 ID 匹配权限查询，无过期概念，无使用追踪。

**升级后**：完整的权限管理引擎，包含动态风险评分、过期策略、使用追踪、相似度匹配。

### 可添加的子系统

#### 1. 动态风险评分引擎

```javascript
const RISK_MATRIX = {
  '读取': { low: 10, medium: 30, high: 60 },
  '修改': { low: 30, medium: 50, high: 85 },
  '删除': { low: 50, medium: 75, high: 95 },
  '执行': { low: 40, medium: 65, high: 90 },
  '访问': { low: 15, medium: 35, high: 65 },
  '存储': { low: 20, medium: 45, high: 70 },
  '分享': { low: 25, medium: 55, high: 80 }
};

calculateRiskScore(action, context = {}) {
  const actionStr = typeof action === 'string' ? action : JSON.stringify(action);
  let actionType = '读取';
  for (const type of Object.keys(RISK_MATRIX)) {
    if (actionStr.includes(type)) { actionType = type; break; }
  }
  const baseRisk = RISK_MATRIX[actionType][dataType] || RISK_MATRIX[actionType].medium;
  const scopeBonus = scope === 'global' ? 15 : scope === 'network' ? 25 : 0;
  const frequencyPenalty = Math.min(frequency * 3, 20);
  const totalScore = Math.min(baseRisk + scopeBonus + frequencyPenalty, 100);
  // 返回 { score, level, breakdown: { baseRisk, actionType, scopeBonus, ... } }
}
```

关键点：
- 动作类型矩阵：8种常见操作 × 3级数据敏感度
- 范围加分：local(0) / global(15) / network(25)
- 频率惩罚：每次使用+3分，上限20分
- 总分上限100

#### 2. 权限过期系统

```javascript
const EXPIRY_POLICY = {
  'remember': 24 * 60 * 60 * 1000,   // 记住选择：24小时
  'granted': 7 * 24 * 60 * 60 * 1000, // 单次授权：7天
  'once': 0                            // 仅此一次：立即过期
};

isPermissionExpired(permission) {
  const maxAge = EXPIRY_POLICY[permission.response] || EXPIRY_POLICY.granted;
  if (maxAge === 0) return true;
  const age = Date.now() - new Date(permission.timestamp).getTime();
  return age > maxAge;
}
```

关键点：
- 每种响应类型有不同的过期时长
- `once` 类型立即过期
- 过期时间存储在 `expiresAt` 字段中返回给调用方

#### 3. 使用追踪与自动吊销

```javascript
// 独立持久化文件：permission_usage.json
const AUTO_REVOKE_THRESHOLD = 5;

recordUsage(requestId) {
  this.usageTracking[requestId] = (this.usageTracking[requestId] || 0) + 1;
  this.saveUsageTracking();
}

isUsageExceeded(requestId) {
  return (this.usageTracking[requestId] || 0) >= AUTO_REVOKE_THRESHOLD;
}
```

关键点：
- 独立文件 `permission_usage.json` 追踪使用次数
- 阈值可配置，默认5次
- 在 `hasPermission()` 中每次调用都 `recordUsage()`
- `needsNegotiation()` 中检查使用次数，超限则要求重新协商

#### 4. 相似度模糊匹配

```javascript
// Jaccard similarity on tokenized action strings
tokenize(str) {
  const lower = str.toLowerCase();
  const tokens = [];
  const englishWords = lower.match(/[a-z]+/g) || [];
  tokens.push(...englishWords);
  for (let i = 0; i < lower.length - 1; i++) {
    const pair = lower.substring(i, i + 2);
    if (/[\u4e00-\u9fff]{2}/.test(pair)) {
      tokens.push(pair);
    }
  }
  return tokens;
}

calculateSimilarity(actionStr, permission) {
  const currentTokens = this.tokenize(actionStr);
  const storedTokens = this.tokenize(permission.contextAction || '');
  const intersection = currentTokens.filter(t => storedTokens.includes(t));
  const union = new Set([...currentTokens, ...storedTokens]);
  return intersection.length / union.size;
}
```

关键点：
- 中英文分词：英文单词 + 中文双字词组
- Jaccard 相似度：交集/并集
- 阈值：`hasPermission` 用 0.5，`needsNegotiation` 用 0.6
- 需要保存 `contextAction` 字段在权限记录中

#### 5. 渐进式授权升级

高风险操作即使"记住"也需重新确认：
```
if (risk.level === 'high') {
  return { needed: true, reason: 'high_risk_requires_fresh_consent' };
}
```

低风险操作自动放行：
```
if (risk.score < 20) {
  return { needed: false, reason: 'low_risk_auto_allowed' };
}
```

#### 6. 过期权限清理

```
pruneExpiredPermissions() {
  const before = this.permissions.explicit.length;
  this.permissions.explicit = this.permissions.explicit.filter(p =>
    !this.isPermissionExpired(p)
  );
  return before - this.permissions.explicit.length;
}
```

- 在 `getStatus()` 中自动调用
- 返回清理数量

## 验证清单

- [ ] `node --check` 语法通过
- [ ] 原有方法签名不变
- [ ] 构造不报错
- [ ] 风险评分返回合理的分数
- [ ] 过期权限被正确识别
- [ ] 相似度匹配不会误报
- [ ] 使用追踪文件格式正确
- [ ] HEARTFLOW_DEBUG 守卫不影响运行时
- [ ] VERSION 文件更新
- [ ] SKILL.md 版本同步
