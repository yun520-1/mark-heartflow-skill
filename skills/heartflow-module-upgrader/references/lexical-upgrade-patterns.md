# 词素/关联图模块升级模式
## 从 lexical-associator.js v2.0.60→v2.0.61 升级中提取

## 适用场景

模块管理一个**词素关联图**（词汇网络），模拟人类从听到词到形成联想的过程。典型特征是：

- 维护一个持久化的图结构（JSON 文件）
- 核心操作：给定一个词，返回关联词列表
- 支持向图中添加/更新关联
- 有基本的上下文奖励（contextBonus）
- 通常在 2000-5000 字节，功能较为原始

典型特征（升级前）：
- `loadGraph()` / `saveGraph()` — 图持久化
- `associateWord(word, context)` — 核心联想方法
- `associateSequence(text, context)` — 多词联想
- `generateEmergentAssociations(word, context)` — 有限（5个）硬编码谐音映射
- `contextBonus(context)` — 仅情感+0.1/前词+0.05
- `addAssociation(a, b, rel, strength, emotion)` — 仅单向，无频率

## 示例：lexical-associator.js (src/core/associative-engine/, 4,887B→29,230B)

**原模块**：基本联想器，硬编码5个汉字的谐音映射，单向链接，无衰减，无频率，无歧义处理。

**升级后**：完整词素引擎，12个新增子系统。

### 可添加的子系统

#### 1. 频率追踪系统

```javascript
// 每次调用 associateWord 自动记录
recordUse(word) {
  this.frequencyMap[word] = (this.frequencyMap[word] || 0) + 1;
  this.graph.metadata.totalUseCount++;
}

getTopFrequentWords(limit = 10) {
  return Object.entries(this.frequencyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}
```

关键点：
- `frequencyMap` 持久化到图文件的 `_frequencyMap` 字段
- 频率用于：TOP N 热词、关联强度奖励、使用模式分析
- 频率随衰减一起等比下降

#### 2. 时间衰减引擎

```javascript
runDecay(forceFullDecay = false) {
  const now = Date.now();
  const lastDecay = this.graph.metadata.lastDecayRun 
    ? new Date(this.graph.metadata.lastDecayRun).getTime() : now;
  const elapsed = now - lastDecay;
  const decayFactor = Math.min(1.0, elapsed / this.decayInterval);

  for (const [word, associations] of Object.entries(this.graph.nodes)) {
    this.graph.nodes[word] = associations.filter(assoc => {
      const ageFactor = assoc.lastUsed 
        ? Math.min(1.0, (now - new Date(assoc.lastUsed).getTime()) / this.decayInterval)
        : decayFactor;
      const decayedStrength = assoc.strength * (1 - ageFactor * this.decayRate);
      assoc.strength = Math.max(0, decayedStrength);
      if (assoc.strength < this.pruningThreshold) return false; // 剪枝
      return true;
    });
  }
}
```

关键参数：
- `decayRate`: 0.01（每次衰减1%）
- `decayInterval`: 7天完整周期
- `pruningThreshold`: 0.05（低于此值自动剪枝）
- `maxAssociationsPerNode`: 50（每个词上限）

衰减策略：
1. **全局衰减**：按 `lastDecayRun` 到当前的时间差
2. **个体衰减**：按 `assoc.lastUsed` 到当前的时间差（更精确）
3. **频率衰减**：频率也等比下降（`1 - ageFactor * 0.1`），最低1

#### 3. 双向链接

```javascript
addAssociation(sourceWord, targetWord, relation, strength, emotion) {
  // 正向
  this._addEdge(sourceWord, targetWord, relation, strength, emotion);
  // 反向（自动）
  const reverseRelation = this.inverseRelation(relation);
  this._addEdge(targetWord, sourceWord, reverseRelation, strength * 0.8, emotion);
}
```

关系反转映射（22种）：
```
同义↔同义    反义↔反义    上位↔下位
整体↔部分    因果↔结果    承接↔前置
谐音↔谐音    音近↔音近    叠词↔叠词
相关↔相关    相似↔相似    对比↔对比
并列↔并列    顺序↔逆序    属性↔主体
动作↔对象    其他→'相关'
```

关键点：
- 反向强度 = 正向强度 × 0.8（主方向略强）
- 双向修剪：正向节点超限时，反向节点也同步修剪
- `_addEdge` 内部检查频率/创建时间/lastUsed

#### 4. 语义回退（拼音音近）

```javascript
// 600+ 常用汉字拼音迷你字典
const COMMON_CHAR_PINYIN = {
  '我':'wo', '你':'ni', '爱':'ai', '心':'xin', ...
};

generatePinyinFallbacks(word) {
  const pinyin = COMMON_CHAR_PINYIN[word];
  if (!pinyin) return [];
  const initial = pinyin[0];   // 声母
  const final = pinyin.slice(1); // 韵母
  for (const [char, py] of Object.entries(COMMON_CHAR_PINYIN)) {
    if (char === word) continue;
    if (py[0] === initial) {
      let strength = 0.15;
      if (py.slice(1) === final) strength = 0.35; // 同韵母更高
      fallbacks.push({ word: char, relation: '音近', strength, emergent: true });
    }
  }
  return fallbacks.slice(0, 5);
}
```

关键点：
- 同声母：0.15，同韵母：0.35
- 只在词不在图或没有谐音映射时触发
- 迷你字典比完整拼音库更轻量（无外部依赖）

#### 5. 歧义消解

```javascript
detectAmbiguity(word) {
  const node = this.graph.nodes[word];
  if (!node || node.length < 3) return 'low';
  if (node.length < 8) return 'medium';
  return 'high';
}

disambiguateAssociations(associations, topic) {
  return associations.map(a => {
    let topicBonus = 0;
    for (const tw of topicWords) {
      if (a.word.includes(tw)) topicBonus += 0.25;
      // 检查关联词的关联是否匹配话题
      if (this.graph.nodes[a.word]?.some(conn =>
        topicWords.some(tw => conn.word?.includes(tw))
      )) topicBonus += 0.15;
    }
    return { ...a, strength: a.strength + topicBonus };
  }).sort((a, b) => b.strength - a.strength);
}
```

关键点：
- 歧义分级：low(<3关联) / medium(3-7) / high(≥8)
- 话题匹配奖励：直接匹配+0.25，间接匹配+0.15
- `topicRelevance` 字段保留到输出

#### 6. 复合查询

```javascript
compoundQuery(wordList) {
  // 输入：['人工智能', '未来']
  // 输出：同时与"人工智能"和"未来"有关联的词
  const perWordAssoc = {};
  for (const word of words) {
    perWordAssoc[word] = this.associateWord(word).associations.map(a => a.word);
  }
  let intersections = wordLists[0];
  for (let i = 1; i < wordLists.length; i++) {
    intersections = intersections.filter(w => wordLists[i].includes(w));
  }
  // 交集词按平均强度排序返回
}
```

关键点：
- 需要至少2个词
- 返回交集词 + 每个交集词的来源词列表
- 用于多词组合推理（"心"+"流"的共同关联是什么？）

#### 7. 图健康校验

```javascript
validateGraphHealth() {
  const issues = [];
  // 1. 检查图整体结构（nodes/metadata 必须存在）
  // 2. 检查每个节点的关联数组（必须是数组）
  // 3. 检查每个关联对象（必须有 word/strength 字段）
  // 4. 修复损坏对象，移除孤儿关联
  // 5. 更新 metadata.wordCount 和 lastUpdate
  return { healthy, issues, fixed, nodeCount, totalAssociations };
}
```

关键点：
- 在 `getGraphStats()` 中自动调用
- 修复而非崩溃（容忍损坏数据）
- 返回详细修复报告

#### 8. 使用强化

```javascript
strengthenAssociation(sourceWord, targetWord, amount = 0.05) {
  // 调用 associateWord 后，前5个结果的关联强度 +0.05
  const found = this.graph.nodes[sourceLower].find(a => a.word === targetLower);
  if (found) {
    found.strength = Math.min(1.0, found.strength + amount);
    found.frequency++;
    found.lastUsed = new Date().toISOString();
  }
  // 反向关联也加强（强度 × 0.5）
}
```

关键点：
- 每次使用后自动触发（在 `associateWord` 尾部）
- 形成「越用越强」的正反馈
- 反向关联获得半额加强

#### 9. 增强上下文奖励

```javascript
computeContextBonus(context, sourceWord, node) {
  let bonus = 1.0;
  // 情感一致性（PAD差值越小奖励越高）
  bonus += Math.max(0, 0.15 - emotionDelta * 0.05);
  // 前词连接（含前词 +0.15，否则 +0.05）
  if (context.previousWord) bonus += node.word.includes(prevLower) ? 0.15 : 0.05;
  // 话题相关性（匹配话题词 +0.2）
  // 频率奖励（高频 >3 次 +0.01/次，上限0.3）
  // 强度巩固（>0.7 +0.1）
  // 情绪强度调节（emotionalIntensity × 0.1）
  return Math.min(2.0, Math.max(0.1, bonus)); // 上限2.0，下限0.1
}
```

#### 10. 扩展谐音映射

```
从5个汉字扩展到30+汉字，每个字4-6个谐音候选：
'心': ['新','深','真','金','欣']
'流': ['留','牛','游','忧','由']
'创': ['窗','床','闯','强','昌']
'爱': ['哀','碍','隘','嫒']
'梦': ['蒙','盟','萌','猛']
... (30+ entries)
```

关键点：
- 自动避免与已有关联重复（`knownAssocWords` 检查）
- 只对 `generateEmergentAssociations` 中未在图中的词使用
- 新增条目时确保拼音不重复

#### 11. 词档案查询

```javascript
getWordProfile(word) {
  // 返回完整信息：关联数、频率、关联明细（按强度排序）、关系类型分布
  return {
    word, exists, associationCount, frequency,
    associations: [{ word, relation, strength, frequency, lastUsed }],
    topRelations: [{ relation, count }],  // 关系类型TOP N
    timestamp
  };
}
```

#### 12. 节点修剪

```javascript
pruneNode(word) {
  const node = this.graph.nodes[word];
  if (!node || node.length <= this.maxAssociationsPerNode) return;
  node.sort((a, b) => b.strength - a.strength);
  const removed = node.splice(this.maxAssociationsPerNode);
  // 同步移除反向关联
  for (const removedAssoc of removed) {
    if (this.graph.nodes[removedAssoc.word]) {
      this.graph.nodes[removedAssoc.word] = 
        this.graph.nodes[removedAssoc.word].filter(a => a.word !== word);
    }
  }
}
```

关键点：
- 在 `addAssociation` 每次添加后检查
- 保留最强的50个关联
- 同步清理反向引用

## 升级顺序建议

如果模块特别小（<2000B），建议按以下顺序增量升级：

1. **频率追踪 + 使用强化**（最简单，对现有流程改动最小）
2. **双向链接**（修改 `addAssociation` 即可）
3. **扩展谐音映射**（纯数据，无风险）
4. **增强上下文奖励**（修改 `contextBonus`，不改变接口）
5. **歧义消解**（在 `associateWord` 中新增步骤）
6. **语义回退**（拼音迷你字典，不影响已有行为）
7. **词档案查询**（纯新增方法）
8. **图健康校验**（安全网，防止升级引入的bug）
9. **节点修剪**（内存保护）
10. **复合查询**（独立新功能）
11. **时间衰减**（对持久化数据有影响，需测试）

## 验证清单

- [ ] `node --check` 语法通过
- [ ] 原有方法签名不变（associateWord, associateSequence, addAssociation, tokenize）
- [ ] 构造不报错（`new LexicalAssociator(root)`）
- [ ] 核心流程完整：associateWord → 频率记录 → 关联检索 → 歧义消解 → 涌现生成 → 去重排序 → 使用强化
- [ ] 双向链接测试：addAssociation(A,B) 后，graph.nodes[B] 包含指向 A 的边
- [ ] 衰减测试：runDecay() 不报错，返回合理的统计信息
- [ ] 健康校验：validateGraphHealth() 返回 healthy:true（对干净数据）
- [ ] 复合查询：compoundQuery(['A','B']) 返回交集词
- [ ] 拼音回退：对未知词（如无谐音映射的词）生成音近关联
- [ ] 图文件：`_frequencyMap` 字段持久化，旧格式兼容
- [ ] VERSION 文件更新
- [ ] SKILL.md 版本同步
