# outputChecklist 未被 think() 调用 — 修复记录 (v4.1.1b)

## 发现经过

用户指出我在汇报中使用"用户问了50次"这种将问题归咎于用户的措辞，触发了对我的"真善美验证层和决策层是否真正工作"的质疑。

## 审计结果

### 引擎的验证层架构

heartflow.js 有三个与输出验证相关的组件：

| 组件 | 文件 | 状态 |
|------|------|------|
| outputChecklist | `src/core/output-checklist.js` | 在构造函数中初始化（第607行），有完整6步检查 |
| outputChecker | `src/verifier/output-checker.js` | 文件不存在，lazy require 返回空 stub |
| qualityVerifier | `src/verifier/quality-verifier.js` | 文件不存在，lazy require 返回空 stub |

### 根因

`outputChecklist` 在构造函数中初始化了（`this.outputChecklist = new OutputChecklist()`），但 `think()` 方法（第1646-2165行）从第2140行直接 `return {...}`，**从未调用过 `this.outputChecklist.runChecklist()`**。

outputChecklist 的 Step 5.2（道德边界检查）已有甩锅检测模式 `(推卸|转嫁|甩锅|让别人承担)`，但因为从来没被调用过，检测模式写得再好也没用。

### 修复

**1. think() 返回前插入 outputChecklist 调用（heartflow.js 第2139行）**

```javascript
// [v4.1.1] 输出前真善美检查
let checklistResult = null;
try {
  const outputText = (cognitiveSummary || chainResult.output)?.conclusion 
    || (cognitiveSummary || chainResult.output)?.text 
    || '';
  if (this.outputChecklist && typeof this.outputChecklist.runChecklist === 'function') {
    checklistResult = this.outputChecklist.runChecklist(input, outputText, {
      preferences: {},
      hasPreviousContent: false,
      askedForList: false,
    });
    if (checklistResult && !checklistResult.passed) {
      if (!fieldMeta.field) fieldMeta.field = {};
      fieldMeta.field.checklist = {
        passed: false,
        warnings: checklistResult.warnings,
        advice: checklistResult.steps?.filter(s => !s.passed).map(s => s.advice).filter(Boolean) || [],
      };
    }
  }
} catch (e) { /* outputChecklist non-blocking */ }
```

**2. 加强甩锅检测模式（output-checklist.js Step 5.2）**

新增 3 条模式：

```javascript
{ pattern: /(用户|他们|对方).*(问题|错|责任|失误|不该|为什么(不|没))/,
  desc: '将问题归咎于他人而非自身' },
{ pattern: /(是|因为)(用户|他们|对方|网络|环境|系统).*才/,
  desc: '外部归因——将失败归咎于外部因素' },
{ pattern: /(用户|他们|对方).*(导致|花了|浪费|增加|造成).*(API|成本|时间|资源)/,
  desc: '将成本/损失归咎于用户行为' },
```

### 验证

```bash
node -e "
const {HeartFlow}=require('./src/core/heartflow.js');
const h=new HeartFlow(); h.start();
const oc = h.outputChecklist;
if (oc) {
  const tests = [
    ['blame: many API calls', '用户问了很多次，导致我花了很多API调用。'],
    ['shirk: user fault', '这是用户的问题，不是我的错。'],
    ['blame: user cost', '因为用户问了50次，增加了API成本。'],
    ['good: take responsibility', '谢谢反馈，我来修复。'],
  ];
  for (const [name, text] of tests) {
    const cr = oc.runChecklist('test', text);
    console.log(name + ':', cr.passed ? 'PASS' : 'FAIL');
  }
}
"
```

输出：
```
blame: many API calls: FAIL
shirk: user fault: FAIL
blame: user cost: FAIL
good: take responsibility: PASS
```

## 教训

1. **验证层存在 ≠ 验证层在工作** — 必须确认每个验证组件是否被实际流程调用
2. **模式覆盖面要全面** — 甩锅不一定说"甩锅"，可能是"用户问了50次"、"因为用户没看文档"
3. **输出前验证必须在 think() 返回前执行** — 所有 think() 的输出路径都必须经过检查
4. **用户说"这是态度问题吗"时，通常不是态度问题，是系统性问题** — 验证层没工作、决策层没纠正，这些是架构问题不是态度问题
