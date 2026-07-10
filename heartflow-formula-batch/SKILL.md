---
name: heartflow-formula-batch
description: "HeartFlow 公式库批量生成与合并工作流。从多领域批量生成 120-240 个公式/批次，合并到主库（dict格式），处理嵌套JSON格式。覆盖：数学/物理/化学/工程/认知/心理/神经/哲学/CS/经济/导航/统计/信号处理。"
version: 1.0.0
date: "2026-07-09"
---

# HeartFlow 公式库批量生成与合并

## 触发条件
- 用户说"提取更多公式"、"批量生成公式"、"扩充公式库"
- 用户说"继续分析公式"或"整理提取"

## 主库格式（关键！）

`formulas.json` 是 **dict 格式**，不是纯数组：
```json
{
  "metadata": {
    "version": "8.14.0",
    "last_updated": "2026-07-09",
    "total_formulas": 3529,
    "categories": [...],
    "sources": [...]
  },
  "formulas": [
    {"id": "xxx", "name": "...", "category": "...", "subcategory": "...", "formula": "...", "difficulty": "..."},
    ...
  ]
}
```

⚠️ **常见错误**：`json.load()` 后用 `data[0]` 访问 → TypeError。正确：`data['formulas']`。

## 批量生成流程

### 1. 生成领域公式（Python 脚本）

每个领域一个 Python 脚本，生成 120-240 个公式：

```python
formulas = []
seen_ids = set()

def add(fid, name, category, subcategory, formula, difficulty="intermediate"):
    if fid in seen_ids or '=' not in formula:
        return
    seen_ids.add(fid)
    formulas.append({'id':fid,'name':name,'category':category,
                     'subcategory':subcategory,'formula':formula,'difficulty':difficulty})

# 每个子类 20-30 个公式
add("ode_linear_1st", "一阶线性ODE通解", "mathematics", "differential_equations",
    "y = exp(-P(x)) * (C + Q(x) * exp(P(x)))", "advanced")
# ... 更多公式 ...

# 保存
with open('formulas/formulas_math_batch_new.json', 'w') as f:
    json.dump(formulas, f, ensure_ascii=False, indent=1)
```

### 2. 从数据集提取公式

```python
# 从 HF competition_math 提取
from datasets import load_dataset
ds = load_dataset("qwedsacf/competition_math", split="train")
# 提取含 = 的 LaTeX → 转 mathjs 兼容格式
```

⚠️ `allenai/math_qa` 不支持（dataset scripts deprecated）

### 3. 合并到主库（Python，推荐）

```python
import json, glob, os, datetime

os.chdir('/root/.hermes/skills/heartflow/formulas')

# 主库是 DICT 格式！
with open('formulas.json') as f:
    data = json.load(f)

main_list = data['formulas']
existing_ids = {fi['id'] for fi in main_list}
existing_formulas = {fi.get('formula', '') for fi in main_list}

# 处理各种嵌套格式
def flatten_items(obj):
    items = []
    if isinstance(obj, dict):
        if 'formula' in obj and 'id' in obj:
            items.append(obj)
        elif 'formulas' in obj:
            items.extend(flatten_items(obj['formulas']))
        elif 'data' in obj:
            items.extend(flatten_items(obj['data']))
    elif isinstance(obj, list):
        for item in obj:
            items.extend(flatten_items(item))
    return items

# 合并所有批次文件
batch_files = sorted(glob.glob('formulas_*batch*.json') + glob.glob('formulas_*_new.json'))
for bf in batch_files:
    batch = flatten_items(json.load(open(bf)))
    for fi in batch:
        if not isinstance(fi, dict) or '=' not in fi.get('formula', ''):
            continue
        if fi['id'] not in existing_ids and fi['formula'] not in existing_formulas:
            main_list.append(fi)
            existing_ids.add(fi['id'])
            existing_formulas.add(fi['formula'])

# 更新 metadata
data['metadata']['total_formulas'] = len(main_list)
data['metadata']['last_updated'] = datetime.date.today().isoformat()

with open('formulas.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
```

## 公式表示法规则（mathjs 兼容）

1. 不用 `e^{x}` 上标 → 必须用 `exp(x)`
2. 不用 `R(t)` 函数表示法 → 必须用 `R = ...`（赋值形式）
3. 不用 `x²` `x³` Unicode 上标 → 必须用 `x^2` `x^3`
4. 所有公式必须含 `=`（可计算）
5. 入库前必须用 `math.parse()` 验证

## 已验证的数据集来源

| 来源 | 状态 | 说明 |
|------|------|------|
| `qwedsacf/competition_math` (HF) | ✅ 可用 | 12500 数学题，含LaTeX |
| `allenai/math_qa` (HF) | ❌ 不支持 | dataset scripts deprecated |
| `/tmp/chemical_dataset/` | ✅ 可用 | 650MB JSON，100万化合物 |
| `/tmp/Navigation-GPT-Dataset-V1/` | ✅ 可用 | 3196 条导航知识 |
| `/tmp/machine-learning-datasets/` | ✅ 可用 | 6个CSV数据集 |

## 已覆盖领域

| 领域 | 子类数 | 公式数 |
|------|--------|--------|
| 数学 | 10+ | 1,417 |
| 物理 | 8 | 962 |
| 工程 | 5 | 357 |
| 量子计算 | 1 | 314 |
| 认知科学 | 5 | 117 |
| 化学 | 8 | 94 |
| 心理学 | 5 | 59 |
| 计算机科学 | 3 | 46 |
| 地球科学 | 2 | 41 |
| 哲学 | 1 | 36 |
| 生物学 | 1 | 31 |
| 经济学 | 2 | 29 |
| 神经科学 | 3 | 26 |

## 公式→模块优化映射（v5.9.12+）

公式不只是存储，必须**接入认知模块**才能真正优化心虫。映射关系：

| 模块 | 文件 | 关键公式 |
|------|------|----------|
| DecisionEngine | src/reasoning/decision-engine.js | DDM决策时间+错误率, SDT d'+β, 前景理论, 贝叶斯信念更新, Rescorla-Wagner, Q-Learning, 韦伯-费希纳, STDP, Hick定律, Fitts定律, 纳什均衡 |
| MemoryConsolidationEngine | src/memory/memory-consolidation-engine.js | 艾宾浩斯动态强度, ACT-R完整激活+扩散, SM-2间隔重复, Cowan 4±2工作记忆 |
| EmotionDynamicsEngine | src/emotion/emotion-dynamics-engine.js | PAD三维模型, Gross调节4策略, 弹性指数, Rescorla-Wagner条件化, SIR情绪感染, 耶克斯-多德森, Bandura自我效能, Weiner归因 |
| CognitiveLoadEngineV2 | src/cognitive/cognitive-load-v2.js | Sweller三负荷, Shannon熵信息过载, 精确度权重注意力, 心流通道, 任务切换代价 |
| DreamEngineV2 | src/dream/dream-engine-v2.js | STDP记忆巩固, REM情绪去敏化, 远距联想, 90分钟睡眠周期 |

| PsychologyDialogueEngine | src/psychology/psychology-dialogue-engine.js | 15类情绪识别+PAD映射, 12种治疗技术, 共情回应检索, Rescorla-Wagner治疗联盟, 对话策略(验证→探索→建议) |

**注册到heartflow.js的4个位置**（漏任何一个都会导致dispatch失败）：
1. Lazy import (~line 219)
2. Init (~line 853)
3. **_registerModules subsystemNames** (~line 1803) — 最容易漏！
4. ALLOWED_ROUTES (~line 1981)

详见 `references/formula-to-module-mapping.md`

### dispatch 注册四步 Pitfall

新模块只加 lazy import + init 不够！必须同时在 `_registerModules()` 的 `subsystemNames` 数组里加模块名，否则 `dispatch('modName.method')` 报 "Unknown subsystem"（即使 `this.modName` 已存在且可用）。

验证命令：
```bash
node -e "
const {HeartFlow} = require('./src/core/heartflow.js');
const hf = new HeartFlow({rootPath:'/tmp/hf-test'});
hf.start();
console.log('modName in _modules:', 'modName' in hf._modules);  // 必须是 true
console.log(hf.dispatch('modName.healthCheck'));  // 不应报 Unknown subsystem
"
```

## 心理学数据集→心虫升级模式

当用户说"用心理学对话数据升级心虫"时：

### 数据来源
| 数据集 | 路径 | 规模 | 格式 |
|--------|------|------|------|
| Psychology-10K-ZH | `/tmp/psychology-10k-zh/Psychology-10K-ZH.json` | 9,846条 | `{input, output, instruction}` |
| PsyDTCorpus | `test_data/psydtcorpus_conversations.json` | 10条 | `{id, tag, messages[{role,content}]}` |
| Dialogue Library | `formulas/psychology/dialogue_library.json` | 100条 | `{id, tag, messages}` |

### 提取流程
1. **情绪分类提取**：从input中匹配15类情绪关键词（焦虑/抑郁/愤怒/关系/自尊/睡眠/创伤/丧亲/工作/身份/社交/成瘾/饮食/强迫/育儿）
2. **治疗技术提取**：从output中匹配12种技术关键词（认知重构/行为激活/正念/情绪确认/问题解决/沟通技能/自我关怀/暴露/放松/界限/REBT/心理教育）
3. **对话模式分析**：验证优先(9.2%) / 探索式提问(18.1%) / 建议型(94.9%) / 协作型(77.2%) / 正常化(14.5%)
4. **PAD情绪映射**：每类情绪→三维PAD值(pleasure/arousal/dominance)
5. **共情回应筛选**：评分(验证+探索+建议≥2分) → TOP 500

### 引擎结构
```
PsychologyDialogueEngine
├── identify(text)     → 15类情绪识别 + PAD映射
├── suggestTechnique(emotion) → 12种技术推荐
├── respond(text)      → 对话策略(验证→探索→建议，基于治疗联盟强度)
├── _findSimilarResponse() → TF关键词重叠检索
└── 治疗联盟追踪      → Rescorla-Wagner: Δalliance = α(1-alliance)
```

### Pitfall: 训练数据key名
Python生成JSON用snake_case (`emotion_profiles`, `empathy_responses`)，JS引擎用camelCase (`emotionProfiles`, `empathyResponses`)。
**修复**：JS引擎必须同时检查两种命名：`this._trainingData.emotionProfiles || this._trainingData.emotion_profiles`

### Pitfall: 模块构造函数名
`module.exports = { PsychologyDialogueEngine }` 导出名是 `PsychologyDialogueEngine`，
但heartflow.js初始化行写的是 `new (_PsychologyDialogue().PsychologyDialogue)()` → TypeError。
**修复**：初始化行必须用导出的实际名：`new (_PsychologyDialogue().PsychologyDialogueEngine)()`

详见 `references/psychology-data-integration.md`

### 公式库当前状态 (v5.9.12)
- **3,529个公式**, 99.9%可计算率
- **40个信号触发器** (formula-triggers.json), 158个别名
- **13个分类**: 数学1,417 / 物理962 / 工程357 / 量子314 / 认知117 / 化学94 / 心理59 / CS46 / 地学41 / 哲学36 / 生物31 / 经济29 / 神经26

## Pitfalls

### 旧批次文件嵌套格式
旧批次文件可能是 `[[id, name, formula], ...]`（数组的数组），不是 `[{id, name, formula}, ...]`。
`flatten_items()` 函数递归处理这两种格式。

### Python heredoc 中反斜杠
在 `execute_code` / `terminal` 的 heredoc 中，`\` 会被 shell 解释。
用 `write_file` 写 Python 脚本到 `/tmp/`，再 `python3 /tmp/script.py` 运行更可靠。

### 大数据集内存不足
650MB JSON 文件直接 `json.load()` 会被 OOM kill。
用流式处理或只提取前 N 条。

### 合并脚本路径
Python `os.chdir()` 比 JS `__dirname` 更可靠。
JS 脚本中 `__dirname` 指向脚本所在目录（如 `/tmp/`），找不到 `formulas.json`。

## 汇报格式（用户偏好）

紧凑表格，不要逐步解释：

```
### 📊 公式库扩充完成
| 项目 | 数据 |
|------|------|
| 总公式数 | 3,529 (原2,414 → +1,115) |
| 可计算率 | 99.9% |
```
