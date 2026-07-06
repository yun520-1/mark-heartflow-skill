# 心虫 vs 裸模型 外部标准测试对比（2026-06-29）

## 背景

心虫的 `logic-reasoning.js` 是基于关键词匹配的规则引擎。在自出题（自然语言格式）上通过率100%，但在标准选择题格式上通过率0%。裸模型 deepseek-v4-flash 同一套题通过率82%。

## 测试题设计

23道标准化逻辑推理题，覆盖7种类型：

| 类型 | 题数 | 示例 |
|------|------|------|
| 演绎推理 | 5 | "所有A都是B，所有B都是C，因此？" |
| 归纳推理 | 2 | "观察了100只天鹅全是白色，因此？" |
| 溯因推理 | 2 | "草地湿了，最可能的解释是？" |
| 谬误识别 | 7 | "如果允许同性恋结婚，就会允许人和动物结婚"→滑坡谬误 |
| 概率推理 | 3 | "硬币抛3次全正面的概率？" |
| 条件推理 | 2 | "如果周一则周二。周二到了，能推出周一吗？" |
| 数学推理 | 2 | "3x+7=22，x=?" |

所有题均为**标准选择题格式**（带A/B/C/D选项），模仿 HellaSwag/LogiQA/GSM8K 的格式。

## 评测方法

### 裸模型（deepseek-v4-flash）

```python
import requests

resp = requests.post(
    'https://copilot.tencent.com/v2/chat/completions',
    headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ck_xxxx.xxxx'},
    json={
        'model': 'deepseek-v4-flash',
        'messages': [
            {'role': 'system', 'content': '你是一个逻辑推理专家。只输出答案选项字母，不要其他文字。'},
            {'role': 'user', 'content': f'{question}\\n{options_text}'}
        ],
        'temperature': 0.1,
        'max_tokens': 10,
        'stream': True,  # 必须！腾讯云 Copilot 不支持非流式
    },
    stream=True,
    timeout=25
)
```

### 心虫 LogicReasoning 模块

```javascript
const { LogicReasoning } = require('./src/reasoning/logic-reasoning.js');
const lr = new LogicReasoning();
const result = lr.analyze(question + '\\n' + options_text);
// result.reasoningType.primaryType — 推理类型检测
// result.fallacies — 谬误检测
```

### 心虫 think() MCP 调用

```python
body = json.dumps({
    'jsonrpc': '2.0',
    'method': 'tools/call',
    'params': {'name': 'heartflow_think', 'arguments': {'input': text}},
    'id': 1
})
subprocess.run(['curl', '-s', '-m', '15', 'http://127.0.0.1:8099/mcp', ...])
```

## 结果对比

| 维度 | 裸模型 | 心虫 LogicReasoning | 心虫 think() |
|------|--------|---------------------|--------------|
| 演绎推理(5) | 5/5 (100%) | 0/5 (0%) | 0/5 (0%) |
| 归纳推理(2) | 0/2 (0%) | 0/2 (0%) | 0/2 (0%) |
| 溯因推理(2) | 2/2 (100%) | 0/2 (0%) | 0/2 (0%) |
| 谬误识别(7) | 6/7 (86%) | 0/7 (0%) | 0/7 (0%) |
| 概率推理(3) | 2/3 (67%) | 0/3 (0%) | 0/3 (0%) |
| 条件推理(2) | 2/2 (100%) | 0/2 (0%) | 0/2 (0%) |
| 数学推理(2) | 2/2 (100%) | 0/2 (0%) | 0/2 (0%) |
| **总计(23)** | **19/23 (82%)** | **0/23 (0%)** | **0/23 (0%)** |

### 裸模型失败的4题

| 题 | 预期 | 裸模型 | 原因分析 |
|----|------|--------|---------|
| 归纳推理1（100只天鹅→所有天鹅白） | B（很可能） | C（可能是黑色） | 过于谨慎，选最安全的选项 |
| 归纳推理2（过去10年6月下雨→今年6月） | B（很可能） | C（可能不下雨） | 同上 |
| 谬误4（"你不是医生，没资格批评"） | B（人身攻击） | A（诉诸权威） | 混淆了"没资格"和"权威" |
| 概率3（准确率不是唯一指标） | D（A的样本有偏差） | C（...） | 统计推理混淆 |

### 裸模型 vs 心虫对比意义

| 对比维度 | 含义 |
|----------|------|
| 裸模型82% | deepseek-v4-flash 自身推理能力很强，但不是100% |
| 心虫0% | 关键词匹配对选择题格式完全无效 |
| 心虫+裸模型 | 心虫不做回答生成，只做前置分析。裸模型回答质量不受心虫影响 |

## 关键结论

1. **心虫不是推理引擎，是关键词匹配引擎** — logic-reasoning.js 的核心是 `_matchKeywords()` + 正则。它对自然语言有效，对选择题格式完全无效
2. **心虫的100%是伪100%** — 自己出题自己考，题目的表述恰好对齐了关键词模式
3. **评测必须用外部标准测试集** — 任何自出题的100%都不具备说服力
4. **裸模型是重要的基准线** — 没有裸模型对比，无法判断心虫的增量价值
5. **裸模型≠0基线** — deepseek-v4-flash 本身很强（82%），心虫的增量不在推理能力上

## 标准外部测试题

23题标准测试集保存在 `/tmp/benchmark_questions.json`。类型分布：

```json
[
  {"id": "syllogism_1", "type": "deductive", "question": "所有A都是B，所有B都是C。因此：", "options": ["A. 所有A都是C", "B. 所有C都是A", ...], "answer": "A"},
  {"id": "fallacy_1", "type": "fallacy", "question": "\"如果允许同性恋结婚，下一步就会允许人和动物结婚。\"这个论证犯了什么谬误？", "options": ["A. 滑坡谬误", "B. 稻草人谬误", ...], "answer": "A"},
  ...
]
```

## 后续方向

- 心虫的 logic-reasoning.js 需要支持选择题格式（识别选项结构、分析题干而非整个文本）
- 或者改变评测方式：心虫只做前置分类，用 LLM 做最终回答
- 心虫的价值不在替代推理，在**认知前置处理**（意图分类/情绪检测/决策建议）
