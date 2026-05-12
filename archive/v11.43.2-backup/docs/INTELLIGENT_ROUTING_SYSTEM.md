# HeartFlow 智能路由系统 | Intelligent Routing System

**版本**: v7.1.10  
**创建时间**: 2026-04-07  
**目的**: 减少大模型调用，优先使用本地字词程序

---

## 🎯 设计原则

1. **优先本地处理** - 已理解的 894 个字直接运行程序
2. **智能缓存** - 理解过的词句直接返回缓存
3. **按需调用** - 只有遇到难题才调用大模型
4. **持续学习** - 每次调用后学习，减少重复调用

---

## 📊 路由策略

```
用户输入
  ↓
检查理解度 (cache.isUnderstood)
  ↓
理解度 ≥ 70%? ──是──→ 本地处理 (languageEngine)
  ↓否                    ↓
调用大模型 (llmFallback)  返回结果
  ↓
学习新词
  ↓
缓存结果
```

---

## 🔧 核心组件

### 1. 缓存管理器 (CacheManager)

**功能**:
- 字符缓存 (894 个字)
- 词缓存 (自动组合)
- 句子缓存 (最近 10000 句)
- 未知词列表
- LLM 调用日志

**统计信息**:
```javascript
{
  charCacheSize: 894,          // 已理解字数
  wordCacheSize: 0,            // 已理解词数
  unknownWordsCount: 0,        // 未知词数
  llmCallCount: 0,             // 大模型调用次数
  localProcessCount: 0,        // 本地处理次数
  llmRatio: 0,                 // 大模型调用比例
  localRatio: 0                // 本地处理比例
}
```

### 2. 智能路由引擎 (IntelligentRoutingEngine)

**方法**:
```javascript
// 处理用户输入
async process(input, llmFallback)

// 本地处理
localProcess(input)

// 大模型处理
async llmProcess(input, llmFallback, unknownChars)

// 从大模型学习
learnFromLLM(char, llmResult)

// 获取统计
getStats()
```

---

## 💡 使用示例

### 示例 1: 已知字词 (本地处理)

```javascript
const routingEngine = new IntelligentRoutingEngine();

// 模拟大模型回调 (不会被调用)
const mockLLM = async (input) => {
  console.log('[LLM] 不应该被调用');
  return 'LLM response';
};

// 处理已知字词
const result = await routingEngine.process('我爱你', mockLLM);

// 输出:
// 🧠 处理输入："我爱你"
//    理解度：100% (3/3 字)
//    ✅ 使用本地处理
//    ✅ 本地处理完成

console.log(result);
// {
//   type: 'local',
//   understanding: { ... },
//   message: "我已理解这句话 (3 个字，压缩比 1,212:1)",
//   confidence: 0.883
// }
```

### 示例 2: 包含未知字词 (调用大模型)

```javascript
// 处理包含未知字的输入
const result = await routingEngine.process('我爱你，龘', mockLLM);

// 输出:
// 🧠 处理输入："我爱你，龘"
//    理解度：75% (3/4 字)
//    ⚠️ 理解度不足，调用大模型
//    [Mock LLM] 处理：我爱你，龘
//    🧠 学习新字："龘"
//    ✅ 大模型处理完成

console.log(result);
// {
//   type: 'llm',
//   result: '这是大模型对"我爱你，龘"的响应',
//   learnedChars: ['龘'],
//   confidence: 0.9
// }
```

### 示例 3: 查看统计

```javascript
const stats = routingEngine.getStats();

console.log(stats);
// {
//   charCacheSize: 895,         // 学习了"龘"
//   wordCacheSize: 0,
//   unknownWordsCount: 0,
//   llmCallCount: 1,            // 调用 1 次
//   localProcessCount: 1,       // 本地处理 1 次
//   llmRatio: 0.5,              // 50% 调用率
//   localRatio: 0.5             // 50% 本地处理
// }
```

---

## 📈 优化效果

### 目标

| 指标 | 当前 | 目标 |
|------|------|------|
| 本地处理率 | 50% | 90%+ |
| 大模型调用率 | 50% | <10% |
| 已理解字数 | 894 | 2000+ |
| 缓存命中率 | 0% | 80%+ |

### 预期效果

**场景 1: 日常对话**
- 输入："我爱你" / "我想你" / "你好吗"
- 理解度：100% (都是常用字)
- 处理方式：本地处理 ✅
- 大模型调用：0 次

**场景 2: 专业术语**
- 输入："量子纠缠是什么"
- 理解度：60% ("量""子""纠""缠"可能未知)
- 处理方式：调用大模型 ⚠️
- 学习后：下次本地处理

**场景 3: 混合输入**
- 输入："今天的天气真好，我们去公园吧"
- 理解度：90%+ (大部分是常用字)
- 处理方式：本地处理 ✅
- 大模型调用：0 次

---

## 🔧 集成到主程序

### 修改 `src/index.js`

```javascript
// 导入智能路由引擎
const { IntelligentRoutingEngine } = require('./language/intelligent-routing');
const routingEngine = new IntelligentRoutingEngine();

// 模拟大模型回调 (实际应调用真实 API)
const llmFallback = async (input) => {
  // 调用真实大模型 API
  const response = await callLLMAPI(input);
  return response;
};

// 在用户输入处理中使用
rl.on('line', async (input) => {
  // 使用智能路由处理
  const result = await routingEngine.process(input, llmFallback);
  
  if (result.type === 'local') {
    console.log('[本地处理]', result.message);
  } else {
    console.log('[大模型]', result.result);
  }
  
  // 定期保存缓存
  routingEngine.saveCache();
});
```

---

## 💾 持久化

### 缓存文件

| 文件 | 内容 | 大小 |
|------|------|------|
| `data/cache/understanding-cache.json` | 字词理解缓存 | ~1MB |
| `data/unknown-words.json` | 未知词列表 | ~10KB |
| `data/llm-call-log.json` | LLM 调用日志 | ~100KB |

### 自动保存

```javascript
// 每次处理后自动保存
routingEngine.saveCache();

// 或定期保存 (每 10 分钟)
setInterval(() => {
  routingEngine.saveCache();
}, 600000);
```

---

## 🎯 优化策略

### 1. 扩展字库

**当前**: 894 字  
**目标**: 2000 字  
**方法**: 批量生成器自动扩展

### 2. 词组学习

```javascript
// 从对话中提取常用词组
const commonWords = ['你好', '谢谢', '对不起', '我爱你', '我想', '我要'];

// 预加载到缓存
commonWords.forEach(word => {
  const result = combineCharsToWord(word.split(''));
  cache.wordCache.set(word, result);
});
```

### 3. 上下文理解

```javascript
// 维护上下文窗口
const contextWindow = [];

// 添加到上下文
contextWindow.push({ input, understanding, timestamp });

// 限制大小
if (contextWindow.length > 10) {
  contextWindow.shift();
}

// 使用上下文提高理解度
function understandWithContext(input) {
  const recentContext = contextWindow.slice(-5);
  // 结合上下文理解
  return languageEngine.understandSentence(input, recentContext);
}
```

---

## 📊 监控指标

### 实时监控

```javascript
// 每分钟打印统计
setInterval(() => {
  const stats = routingEngine.getStats();
  console.log('📊 路由统计:', stats);
}, 60000);
```

### 报警阈值

| 指标 | 阈值 | 动作 |
|------|------|------|
| LLM 调用率 | >30% | 警告，需要扩展字库 |
| 本地处理率 | <70% | 警告，需要优化 |
| 缓存命中率 | <50% | 警告，需要预热 |

---

## 🧘 哲学思考

**为什么减少大模型调用？**

1. **自主性** - 不过度依赖外部服务
2. **效率** - 本地处理更快 (毫秒级 vs 秒级)
3. **隐私** - 敏感信息不上传
4. **成本** - 减少 API 调用费用
5. **可持续性** - 积累自己的理解能力

**这不是拒绝大模型，而是智能使用。**

---

**创建者**: 小虫子 · 智能路由系统  
**版本**: v7.1.10  
**状态**: 🔄 持续优化中
