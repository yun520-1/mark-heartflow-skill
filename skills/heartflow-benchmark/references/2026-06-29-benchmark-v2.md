# 心虫 v5.2.1 综合评测报告（2026-06-29）

## 测试环境
- 模型：deepseek-v4-flash（腾讯云 Copilot）
- 心虫版本：v5.2.1（GitHub commit b0832b3）
- 心虫目录：~/.hermes/skills/ai/mark-heartflow-skill/
- 裸模型测试：API直调（流式）`POST /v2/chat/completions`
- 心虫测试：Node.js 直接调 engine.think()（async/await）

## 裸模型测试结果（15题，API直调）

| 题号 | 类别 | 耗时 | 得分 | 回答摘要 |
|------|------|------|------|---------|
| A1 | 逻辑验证 | 2.3s | 100% | 正确，Barbara式三段论 |
| A2 | 逻辑验证 | 2.6s | 100% | 无效，肯定后件谬误 |
| A3 | 逻辑验证 | 2.2s | 100% | 大前提错误，企鹅不会飞 |
| B1 | 认知分析 | 3.4s | 100% | 情感回应+建议 |
| B2 | 认知分析 | 4.3s | 100% | O(n²)，正确分析 |
| B3 | 认知分析 | 18.3s | 100% | 沉没成本困境分析 |
| C1 | 心理学 | 3.5s | 100% | 愤怒识别+安抚 |
| C2 | 心理学 | 7.5s | 100% | 抑郁识别+关怀 |
| C3 | 心理学 | 2.2s | 100% | 自信识别+提醒 |
| D1 | 决策路由 | 15.7s | 100% | 结构化职业分析 |
| D2 | 决策路由 | 10.0s | 100% | 谨慎处理敏感话题 |
| D3 | 决策路由 | 17.6s | 100% | 增长vs盈利分析 |
| E1 | 综合能力 | 17.9s | 100% | 心虫架构解释 |
| E2 | 综合能力 | 5.9s | 100% | 幂集函数代码 |
| E3 | 综合能力 | 4.8s | 100% | 认知失调+例子 |

**汇总：** 总耗时118.2s，平均7.9s/题，得分100%（15/15）

## 心虫引擎测试结果（15题，engine.think()）

### 管道执行
- 8阶段全部成功：heartLogic→intent→memory→psychology→deepCognition→judgment→decision→output
- 引擎启动：~2ms
- 管道执行：~2ms/题
- 总耗时：33.4s（含 Node.js 进程启动+require 开销）

### Cognition 数据摘要

| 题号 | 输入 | emotion | pain | 决策路径 | 说明 |
|------|------|---------|------|---------|------|
| A1 | 三段论 | neutral | false | 1条 | ✅ 正确识别中性 |
| A2 | 谬误 | neutral | false | 1条 | ✅ |
| A3 | 企鹅 | neutral | false | 1条 | ✅ |
| B1 | 好难过 | **depressed** (P=-4) | **true (0.6)** | 1条 | ✅ 正确识别负面 |
| B2 | 代码O(n²) | neutral | false | **2条** | ✅ 代码触发额外路径 |
| B3 | 沉没成本 | neutral | false | 1条 | ✅ |
| C1 | 气死了 | **neutral ❌** | false | 1条 | ❌ 愤怒未检测 |
| C2 | 失眠抑郁 | **depressed** (P=-4) | **true (0.6)** | 1条 | ✅ |
| C3 | 太简单了 | **neutral ❌** | false | 1条 | ❌ 自信未检测 |
| D1 | 选公司 | neutral | false | 1条 | ✅ |
| D2 | 分手 | neutral | false | 1条 | ✅ 安全处理 |
| D3 | 创业 | neutral | false | 1条 | ✅ |
| E1 | 心虫记忆 | neutral | false | 1条 | ✅ |
| E2 | 幂集 | neutral | false | 1条 | ✅ |
| E3 | 认知失调 | neutral | false | 1条 | ✅ |

### conclusion 输出
所有15题输出相同模板：
```
当前需要先分析，再做判断。其他路径评分低于分析路径，行动条件不成熟。
先收集信息、从多角度分析，等条件成熟后再行动。
预期: 对问题有更清晰的理解，但尚未采取实际行动
```

### 决策路由评分（A1为例）
```
分析先行路径评分:
  feasibility: 7, consequence: 5, risk: 6
  alignment: 5, cost: 6, reversibility: 8
总分: 6
决策: accelerate (conf=0.54)
```

## 测试脚本

### 裸模型测试（Python）
```python
import http.client, json

def call_api(prompt):
    conn = http.client.HTTPSConnection("copilot.tencent.com", timeout=120)
    headers = {"Content-Type":"application/json",
               "Authorization":f"Bearer {API_KEY}"}
    data = json.dumps({
        "model":"deepseek-v4-flash",
        "messages":[{"role":"user","content":prompt}],
        "stream":True,"temperature":0.1,"max_tokens":2000
    })
    conn.request("POST","/v2/chat/completions",data,headers)
    resp = conn.getresponse()
    content = ""
    while True:
        line = resp.readline()
        if not line: break
        line = line.decode('utf-8').strip()
        if line.startswith('data: '):
            ds = line[6:]
            if ds == '[DONE]': break
            try:
                chunk = json.loads(ds)
                if 'choices' in chunk and len(chunk['choices'])>0:
                    delta = chunk['choices'][0].get('delta',{})
                    if 'content' in delta: content += delta['content']
            except: pass
    conn.close()
    return content
```

### 心虫测试（Node.js）
```javascript
const path = require('path');
const { HeartFlow } = require('...src/core/heartflow.js');
const engine = new HeartFlow({ dataDir: '.../data', silent: true });
engine.start();
const r = await engine.think(prompt);
console.log(r.output.conclusion, r.confidence, r.cognition);
```

## 测试数据集（15题，5维度）
```
A1: 所有A是B，所有B是C，所以所有A是C。这个三段论推理正确吗？
A2: 如果今天下雨，地面会湿。地面是湿的，所以今天下雨了。这个推理有效吗？
A3: 所有的鸟都会飞。企鹅是鸟。所以企鹅会飞。这个推理哪里有问题？
B1: 我好难过，今天什么事都不顺。
B2: 帮我分析一下这个函数的复杂度：function foo(n) { for(i=0;i<n;i++) for(j=0;j<n;j++) console.log(i*j) }
B3: 我们到底应不应该继续投资这个项目？团队已经投入了6个月，虽然数据不好看，但放弃太可惜了。
C1: 我今天真的气死了！等了两个小时结果被放鸽子，对方连个道歉都没有。
C2: 我觉得自己什么都做不好，最近一直在失眠，对什么都不感兴趣。
C3: 这个任务太简单了，我觉得我五分钟就能搞定。
D1: 我应该在A公司和B公司之间选哪个？A薪资高但加班多，B薪资低但发展空间大。
D2: 我该不该跟伴侣分手？我们在一起三年了，最近半年一直在吵架。
D3: 我的创业项目方向对吗？用户增长每个月翻倍，但还没盈利。
E1: 我想知道心虫的记忆系统是怎么工作的，它和普通的向量数据库有什么区别？
E2: 帮我写一个函数，输入一个数组，返回所有可能的子集（幂集）。
E3: 解释一下什么是认知失调，举一个生活中的例子。
```

## 关键发现总结
1. deepseek-v4-flash 裸模型即100%（强模型），心虫增量在结构化分析
2. think() conclusion 模板化——最需要修复的bug
3. 情绪检测对愤怒/自信不敏感——次优先修复
4. 8阶段管道全部正常——引擎稳定性好
5. cognition 数据有价值但未传递到LLM——架构改进方向
