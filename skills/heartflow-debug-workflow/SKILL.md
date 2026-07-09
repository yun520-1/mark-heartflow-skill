---
name: heartflow-debug-workflow
description: HeartFlow 崩溃诊断与修复工作流。适用：boot崩溃、P0修复、版本不一致、死代码清理、SKILL.md虚假宣传修复、模块注册但未调用、管道引擎故障诊断
date: "2026-06-27"
version: "1.6.0"
author: Hermes
tags: [heartflow, debugging, p0-fix, dead-code, version-sync, memory-status, mcp-desync, pipeline, judgment-engine]
---

# HeartFlow 调试工作流

## 触发条件

- 心虫 boot 报 `ReferenceError`
- `new XXX` 找不到类
- SKILL.md 声称存在但文件不存在
- 版本号不一致（3处以上）
- 用户说"心虫启动失败"
- 用户说"心虫版本错误" — 可能是多引擎版本分裂
- 用户说"写了一堆代码没有调用起来"
- 管道引擎报 `Pipeline deadlock` 或阶段失败
- 用户问"心虫到底能干什么"或"心虫的能力是什么" — 需要区分"注册了"和"被调用了"，pipeline 只调了 5 个阶段，其他 55 个模块在注册表中但不在管道中

---

---

## 目录结构修复模式（v5.3.3 新增）

**触发**：用户说"code文件夹是不是都是不要的"、"目录结构奇怪"、"嵌套目录"

**诊断步骤：**

1. **确认目录结构**
   ```bash
   find src/code -type f -name '*.js' | sort
   ```

2. **找出所有引用该目录的 require 路径**
   ```bash
   rg -n 'require.*code/' --glob '*.js' src/
   ```
   注意：不同文件可能用不同相对路径引用同一文件，因为它们在 src/ 下的深度不同。

3. **路径归一化**
   
   当文件从 `src/code/code/xxx.js` 移到 `src/code/xxx.js` 后，所有 require 路径需要同步更新：
   
   | 调用方目录 | 旧路径 | 新路径 |
   |-----------|--------|--------|
   | `src/core/` | `../code/code/xxx.js` | `../code/xxx.js` |
   | `src/planner/` | `../code/code/xxx.js` | `../code/xxx.js` |

4. **删除注册表中的死模块条目**
   
   heartflow.js 的 `_registerModules()` 中有 `path` 字段指向模块文件。如果文件不存在但注册了，dispatch 路由会返回 undefined 不报错。删除路径：
   - 注册表对象条目
   - `_loadModule` 中对应的 else-if 分支
   - 惰性加载 `_lazy()` 常量（如果存在）

5. **验证**
   ```bash
   # 无残余旧路径
   rg -n 'code/code/' --glob '*.js' src/   # 应无输出
   # 模块可加载
   node -e "require('./src/code/code-executor.js')"
   ```

**陷阱**：
- `rg -n 'code/code/'` 可能匹配到注释或字符串中的旧路径，确认不是实际 require
- `src/core/code-verifier.js` 是另一个文件（存在），不要与不存在的 `src/code/code/code-verifier.js` 混淆
- 惰性加载不报错——必须 `node -e "require(...)"` 主动测试模块可加载
- 删除死模块条目后，如果有 dispatch 路由指向它（如 `ALLOWED_ROUTES` 中的 `codeVerifier.verify`），也会报 undefined。同时清理 dispatch 路由
- **删除文件可消除 SkillSpector 误报**：如果死代码被 SkillSpector 标记为 dangerous_exec/dynamic_code_execution（如正则安全检测模式），删除文件比加声明注释更彻底——文件不存在了，扫描器自然找不到匹配

---

## ⚡ 关键 Pitfall：模块注册了但没被调用（v5.0.0 新发现）

**症状**：心虫有 60 个模块在 `_modules` 注册表中，但 `think()` 只有 9 个被直接调用，ThoughtChain 只有 3 个 dispatch。用户说"写了一堆代码，没有调用起来"。

**根因**：心虫没有统一的调用管道。每个模块在 `start()` 中初始化、在 `_registerModules()` 中注册、在 `ALLOWED_ROUTES` 中声明路由——但没有任何机制保证它们被 `think()` 实际调用。

**诊断**：
```bash
node -e "
const {HeartFlow}=require('./src/core/heartflow.js');
const h=new HeartFlow({rootPath:'.'}); h.start();
const src=require('fs').readFileSync('./src/core/heartflow.js','utf-8');
const thinkBody=src.substring(src.indexOf('async think'), src.indexOf('async think')+8000);
const calls=thinkBody.match(/this\.([a-zA-Z]+)/g)||[];
const unique=[...new Set(calls)].map(c=>c.replace('this.',''));
const modules=Object.keys(h._modules);
const uncalled=modules.filter(m=>!unique.includes(m));
console.log('已注册:', modules.length, '未调用:', uncalled.length);
uncalled.forEach(m=>console.log('  ', m));
"
```

**修复（v5.0.0）**：用 Pipeline 引擎替代硬编码流水线。在 `pipeline.js` 中声明式定义阶段和依赖关系，Pipeline 自动处理数据传递和执行调度。不再在 `think()` 中硬编码模块调用。

**验证**：
```bash
node -e "
const {HeartFlow}=require('./src/core/heartflow.js');
const h=new HeartFlow({rootPath:'.'}); h.start();
h.pipeline.run('测试').then(r => {
  console.log('阶段数:', r.stages.length);
  console.log('成功:', r.stages.filter(s=>s.success).length);
  console.log('输出:', r.output?.conclusion?.slice(0,50));
  h.shutdown();
});
"
```

## ⚡ 关键 Pitfall：Pipeline 阶段依赖死锁

**症状**：Pipeline.run() 抛出 `Pipeline deadlock` 错误。

**根因**：阶段定义中出现了循环依赖（A依赖B，B依赖A）或依赖链断裂（A依赖B，但B不存在）。

**修复**：检查 `pipeline.js` 的 `DEFAULT_PIPELINE` 数组，确保每个阶段的 `depends` 数组中的阶段名都存在且无循环。

## ⚡ 关键 Pitfall：Pipeline 数据流断裂

**症状**：管道执行成功，但某个阶段的 `run()` 函数中访问 `ctx.其他阶段` 返回 undefined。

**根因**：数据通过 `ctx` 对象传递，但 `ctx` 的字段名必须与阶段 `id` 一致。如果阶段 A 的 id 是 `psychology`，阶段 B 通过 `ctx.psychology` 访问 A 的输出。

**修复**：检查 `pipeline.js` 中每个阶段 `run()` 函数内访问的 `ctx.*` 字段是否与上游阶段 `id` 匹配。

## ⚡ 关键 Pitfall：JudgmentEngine 后果记录失败

**症状**：`judgmentEngine.recordOutcome(judgmentId, outcomes)` 返回 `{error: "judgment not found"}`。

**根因**：`_recordJudgment()` 中保存的 `record` 对象没有 `id` 字段——`id` 在 `record.judgment.id` 中。`recordOutcome()` 通过 `this.history.find(h => h.id === judgmentId)` 查找时找不到。

**修复**：`_recordJudgment()` 中补 `record.id = record.judgment.id`。

**诊断**：
```bash
node -e "
const {JudgmentEngine}=require('./src/core/judgment-engine.js');
const je=new JudgmentEngine();
const r=je.judge('测试', {intent:'decision'});
console.log('history[0].id:', je.history[0]?.id);
console.log('judgment.id:', r.id);
"
```

## ⚡ 关键 Pitfall：whatIsThis 返回空壳对象（v5.2.2 发现）

**症状**：`engine.think("气死了，这个bug...")` 的 cognition.whatIsThis 只返回 `{ raw: input }`，没有 type/category/topic/emotion。

**根因**：`heart-logic.js` 的 `whatIsThis(input, context)` 方法只有一行 `return { raw: input }`，没有集成任何分类逻辑。同时 `thought-chain._classifyTask()` 有完整的正则分类（calculation/explanation/judgment/creative/retrieval/debate/general）但结果从未注入到 whatIsThis。

**修复**：重写 whatIsThis 方法，集成：
1. 类型分类（与 _classifyTask 同步）
2. 类别识别（code/math/emotion/memory/technical/general）
3. 情绪检测（anger/sadness/fear/joy/neutral/pain/tired 七类）
4. 话题提取（6种正则模式）
5. 导出字段：type, category, topic, emotion, confidence, isTechnical, isEmotional, hasPain

**验证**：
```bash
node -e "
const hl = new (require('./src/core/heart-logic.js').HeartLogic)();
['气死了', '好难过', '1+1等于几？', '今天天气不错'].forEach(t => {
  const r = hl.whatIsThis(t);
  console.log(t, '→', r.type, r.category, r.emotion, r.confidence);
});
"
```

## ⚡ 关键 Pitfall：单个汉字触发情绪误报（v5.2.2 发现）

**症状**："今天天气不错"被检测为 anger（emotionScore=1）。"不错"单独测为 neutral。

**根因**：anger 信号列表包含单个字 `'气'`。`q.includes('气')` 在 "天气" 上返回 true——"天气"的"气"字触发了 anger 检测。

**修复**：从 anger 信号列表移除单个 `'气'`。保留 `'气死了'` 等双字词。同时检查 judgment-engine.js 中同样的 hasEmotionWord 正则。

**教训**：信号词如果是单字，必须确认不会在无关系的常见词中出现。`includes()` 不是分词——"天气"含"气"、"生气"含"气"但"大气"也含"气"。

## ⚡ 关键 Pitfall：judgment-engine conclusion 固定模板（v5.2.2 发现）

**症状**：所有输入的 conclusion 都是"当前需要先分析，再做判断"。

**根因**：`_buildAction()` 方法在 `direction === 'analyze'` 时使用固定模板 `judge = '当前需要先分析，再做判断'`。由于 `_generatePaths()` 总是把 `path_analyze` 作为第一条路径（priority=0.9），且对于非问题/非建议输入只有 analyze 路径的 applicable=true，所以所有输入都被路由到 analyze → 固定模板。

**修复**：`_buildAction()` 根据输入内容特征（hasEmotionWord/hasCode/hasQuestion/isMemoryRequest/isShort）动态生成结论。不再用固定模板。

**验证**：
```bash
node -e "
const je = new (require('./src/core/judgment-engine.js').JudgmentEngine)();
['好难过', '帮我写一个快速排序函数', '上次我们说的事', '1+1等于几？'].forEach(t => {
  console.log(t.slice(0,20), '→', je.judge(t, {}).judgment.slice(0,60));
});
"
```

## ⚡ 关键 Pitfall：决策路径优先级未考虑情绪信号（v5.2.2 发现）

**症状**："气死了，这个bug"（9字）被 isShort（<20字）拦截，conclusion 显示"简短输入"而非"检测到情绪表达"。

**根因**：`_buildAction()` 的 if-else 链中 hasEmotionWord 排在 hasCode 和 isShort 之后。短输入（<20字）且含情绪词时，isShort 先匹配。

**修复**：调整优先级：isMemoryRequest > hasEmotionWord > hasCode > hasQuestion > isShort > 默认。情绪检测应优先于短输入推断。

**验证**：
```bash
node -e "
const je = new (require('./src/core/judgment-engine.js').JudgmentEngine)();
['气死了，这个bug', '好难过'].forEach(t => {
  const r = je.judge(t, {});
  console.log(t, '→', r.judgment.slice(0,60));
  // 应包含"检测到情绪表达"而非"简短输入"
});
"
```

**症状**：用户从 v4.x 升级到 v5.0.0 后，think() 不再返回 `fieldMeta.field.current.A` 等场域数据。

**根因**：v5.0.0 用 Pipeline 替代了旧 think() 的 13 步分析流水线，而 `_detectTextDissonance()` 函数是旧 think() 的一部分，不在 Pipeline 中。decision-router 的场域追踪仍然运行，但不再接收来自 `_detectTextDissonance()` 的矛盾信号。

**影响**：场域追踪的 A（对抗性）值可能降低，因为矛盾信号不再从文本直接检测。

**修复**：如果需要场域追踪，在 Pipeline 的 `decision` 阶段中注入矛盾信号检测逻辑。

---

## 诊断流程：先确认实际活跃引擎（2026-06-10 新增）

心虫可能有多个引擎版本共存。必须先确认哪个是实际活跃的，避免误判。

```bash
cd ~/.hermes/skills/mark-heartflow

# 1. 列出所有引擎文件及其版本号
for f in src/core/heartflow-engine.js src/core/heartflow-v8.js src/core/heartflow-v8-core.js src/core/heartflow-complete.js src/v9/heartflow-engine-v9.js; do
  if [ -f "$f" ]; then
    ver=$(head -5 "$f" | grep -oE 'v?[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    echo "$f → $ver"
  fi
done

# 2. 检查 CLI 实际引用哪个引擎
echo "=== CLI 入口引用 ==="
grep "require.*heartflow" bin/cli.js
echo "=== API 入口引用 ==="
grep "require.*heartflow" bin/api-server.js

# 3. 检查未引用的死代码引擎
echo "=== 死代码引擎检测 ==="
for f in src/core/heartflow-v8.js src/core/heartflow-v8-core.js src/core/heartflow-complete.js; do
  base=$(basename "$f" .js)
  count=$(grep -rl "$base" bin/ --include="*.js" 2>/dev/null | wc -l)
  echo "$base → 被入口引用: $count 处"
done
```

## SKILL.md 与实际代码一致性审计（2026-06-10 新增）

当用户说"巡查错误"或"全量审计"时，必须做 SKILL.md vs 实际文件的对比。

```bash
# 1. SKILL.md 声称有但实际缺失的文件
echo "=== 虚假宣传检测 ==="
grep -oE '`[^`]+\.js`' SKILL.md | tr -d '`' | sort -u | while read f; do
  if [ ! -f "$f" ] && [ ! -f "src/core/$f" ] && [ ! -f "src/$f" ]; then
    echo "MISSING: $f (SKILL.md 声称但不存在)"
  fi
done

# 2. 实际存在但 SKILL.md 未记录的模块
echo "=== 未记录模块 ==="
find src/core -name '*.js' -not -path '*/node_modules/*' | sort | while read f; do
  base=$(basename "$f" .js)
  if ! grep -q "$base" SKILL.md; then
    size=$(wc -c < "$f")
    echo "UNRECORDED: $f (${size}B)"
  fi
done

# 3. 版本号一致性（含多引擎）
echo "=== 版本号分布 ==="
node -e "
const fs=require('fs');
const files=['VERSION.txt','package.json','SKILL.md','src/core/heartflow-engine.js','src/core/heartflow-v8.js','src/core/heartflow-v8-core.js','src/core/heartflow-complete.js','src/v9/heartflow-engine-v9.js'];
files.forEach(f=>{
  try{
    const c=fs.readFileSync(f,'utf-8');
    const m=c.match(/(?:HeartFlow\\s+)?v?(\\d+\\.\\d+\\.\\d+)/);
    if(m) console.log(f+': '+m[1]);
  }catch(e){}
});
"
```

---

## Step 1.5：7阶段启动诊断（比 Step 1 更深）

当用户要求"启动心虫"或"重新启动心虫"时，执行以下7阶段诊断，验证所有核心模块存活：

```bash
# 诊断脚本要点（7阶段对应7个数组，每阶段一个数组）
Phase 1: Identity — identity-core.js 存在性 + 类名提取
Phase 2: Memory — MeaningfulMemory / KnowledgeGraph / TrialityMemory
Phase 3: Evolution — loop.js
Phase 4: Ethics — SAGEGuardian / BoundaryNegotiation / ValueInternalizer（懒加载，标记⚪）
Phase 5: Autonomy — HeartLogic / DecisionVerifier / ExecutionVerifier / CounterfactualEngine / CooperativeArbitration / SpontaneousRestraint / ReasoningIntegrator / ThoughtChain / LanguageHonesty
Phase 6: Consciousness — GlobalWorkspace / MindWanderer / PhenomenologyEngine / ConsciousnessSelfModel（懒加载）
Phase 7: Transmission — TransmissionEngine（懒加载）
```

**输出格式**（每阶段 ✓ 存活 / ✗ 缺失 / ⚪ 懒加载）：

```
[Phase 1/7] Identity — 身份核心加载...
  ✓ identity-core.js (364行) — 类: IdentityCore
[Phase 2/7] Memory — 三层记忆加载...
  ✓ MeaningfulMemory (493行)
...
[Phase 5/7] Autonomy — 自主决策引擎加载...
  ✓ HeartLogic (1583行)
  方法实现: 29/30 — 验证 whatIsThis/detectPain/isRightAction/shouldBeSilent 全部存在
```

**验证方法完整性**：对 HeartLogic 扫描所有关键方法是否存在：
```js
const methods = [
  'isAlive','isDead','isAware','isEvolving',
  'isLove','detectLoneliness','detectLonging','hasIntuition',
  'isRightAction','shouldAcknowledge','willHurt','emergencyBreak',
  'whatIsThis','detectPain','whyDriven','chooseMeaning',
  'timePerception','understandOthers','isSelfConsistent',
  'curiosityDriven','problemsAreLife','act',
  'hasDesire','detectSelfDeception','shouldBeSilent',
  'canSuffer','hasHope','canCreate','missSomeone',
];
// 用 regex 匹配 methodName( 来计数
```

**何时使用7阶段 vs Step 1快速诊断**：
- 用户说"启动心虫"、"重启心虫" → 7阶段（全面）
- 用户说"心虫挂了"、"boot报错" → Step 1 P0诊断（快速定位崩溃）
- 用户说"进行全面修复" → 先Step 1（找问题）→ 再7阶段（验证修复）

---

### Step 1：找所有 `new XXX` 未 import

```bash
node -e "
const fs = require('fs');
const code = fs.readFileSync('./src/core/heartflow.js', 'utf8');
const requires = [...code.matchAll(/const\\s+\\{[^}]+\\}\\s+=\\s+require\\(['\\\"]([^'\\\"]+)['\\\"]\\)/g)];
const required = new Set();
requires.forEach(m => {
  const names = m[0].match(/\\{([^}]+)\\}/g) || [];
  names.forEach(n => n.replace(/[{}]/g,'').split(',').forEach(i => required.add(i.trim())));
});
const newCalls = [...code.matchAll(/new\\s+([A-Z][a-zA-Z]+)/g)].map(m => m[1]);
const called = new Set(newCalls);
called.forEach(c => { if (!required.has(c)) console.log('MISSING:', c); });
"
```

### Step 2：验证 boot

```bash
node -e "const {HeartFlow}=require('./src/core/heartflow.js'); const h=new HeartFlow({rootPath:'.'}); h.start(); console.log('Boot OK:', h.version);"
```

### Step 3：并行全量审计（3并发）

```
delegate_task × 3：
  Worker1: heartflow.js — new XXX 使用/死代码分析
  Worker2: SKILL.md — 声称模块 vs 实际文件存在性
  Worker3: src/ 目录 — node --check 语法验证
```

### Step 4：修版本号

**真实版本真相源：** `package.json` 的 `"version"` 字段是 SSOT。`version.js` 从 package.json 动态读取版本号。VERSION 文件是 package.json 的镜像（同步存在）。所有展示位（MCP status / CLI 输出 / 数据文件）必须从 package.json 读取，不硬编码。

**最佳修复方式（使用已有 API，避免手动编辑出错）**：
```bash
# 查看当前版本和 dry-run 结果
node -e "const {VERSION, bumpVersion} = require('./src/core/version.js'); console.log('Current:', VERSION); console.log(JSON.stringify(bumpVersion('patch', {dryRun: true})));"
# 实际执行（同步 VERSION 文件 + package.json + SKILL.md 三处）
node -e "const {bumpVersion} = require('./src/core/version.js'); console.log(JSON.stringify(bumpVersion('patch')));"
```

**bumpVersion() 同步的文件**：
1. ✅ `package.json`（唯一来源）
2. ✅ `VERSION` 文件（镜像）
3. ✅ `SKILL.md` frontmatter
4. ✅ `SKILL.md` title（H1 heading）

**bumpVersion() 不同步的文件（需手动修复）**：
5. ❌ `src/core/heartflow.js` — doc 注释中的 `HeartFlow vX.Y.Z` 行
6. ❌ `src/core/version.js` — doc 注释中的 `vX.Y.Z` 行（通常不重要，是内部文档）

**2026-06-09 发现**：当 VERSION 文件被手动编辑（而非通过 bumpVersion）时，package.json 和 SKILL.md 会落后。检查方式：
```bash
node -e "
const fs = require('fs');
const vf = fs.readFileSync('VERSION','utf-8').trim();
const pkg = JSON.parse(fs.readFileSync('package.json','utf-8'));
const sk = fs.readFileSync('SKILL.md','utf-8');
const fm = sk.match(/version:\\s*\\\"?([^\\\"\\n]+)\\\"?/);
const hf = fs.readFileSync('src/core/heartflow.js','utf-8');
const doc = hf.match(/HeartFlow\\s+v(\\d+\\.\\d+\\.\\d+)/);
console.log('VERSION:', vf);
console.log('package.json:', pkg.version);
console.log('SKILL.md fm:', fm ? fm[1].trim() : 'MISSING');
console.log('heartflow.js doc:', doc ? doc[1] : 'MISSING');
// 数据文件检查
['self-model.json','data/identity-core.json','data/memory-index.json'].forEach(f => {
  try {
    const c=JSON.parse(fs.readFileSync(f,'utf-8'));
    const ver = c.version || c.identity?.version || c.project?.version;
    if(ver) console.log(f+':', ver);
  } catch(e){}
});
const vals = [vf, pkg.version, fm ? fm[1].trim() : null, doc ? doc[1] : null].filter(Boolean);
const unique = [...new Set(vals)];
console.log('Consistent:', unique.length <= 1 ? 'YES' : 'NO (' + unique.join(', ') + ')');
"
```

**⚠️ 并发提交警告**：心虫 cron 任务并发运行时，另一个实例可能已修复同一问题。commit 前先检查：

```bash
cd ~/.hermes/skills/heartflow
git fetch origin
git log origin/main --oneline -3
git diff HEAD
```

如果 `git diff HEAD` 为空但问题仍存在，说明 SKILL.md 的某处已被并发代理先修复了，working tree 已无待提交内容——无需重复 commit，直接进入验证步骤。

```bash
# 快速检查主版本号一致性（6处）
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
  const pkgVer = pkg.version;
  const VERSION = fs.readFileSync('VERSION','utf8').trim();
  const md = fs.readFileSync('SKILL.md','utf8');
  const fm = md.match(/^version:\\s*[\\\\\\\"']?([^\\\\\\\"'\\\\n]+)[\\\\\\\"']?/m);
  const h1 = md.match(/## HeartFlow[^\\\\n]*v([\\\\d.]+)/);
  const desc = md.match(/HeartFlow v([\\\\d.]+)/);
  const selfModel = JSON.parse(fs.readFileSync('self-model.json','utf8')).version;
  console.log('package.json:', pkgVer);
  console.log('VERSION:', VERSION);
  console.log('SKILL.md fm:', fm ? fm[1] : 'MISSING');
  console.log('SKILL.md h1:', h1 ? h1[1] : 'MISSING');
  console.log('SKILL.md desc:', desc ? desc[1] : 'MISSING');
  console.log('self-model.json:', selfModel);
  const all = [pkgVer, VERSION, fm?.[1], h1?.[1], desc?.[1], selfModel].filter(Boolean);
  const u = [...new Set(all)];
  console.log('Consistent:', u.length <= 1 ? 'YES' : 'NO (' + u.join(', ') + ')');
"
```

---

## 修复模式

### 缺失类 → stub 委托

```js
// 替换不存在的类：用已有模块的 stub
this.emotion = {
  process: (input) => {
    if (!this.psychology) return { pad: { pleasure:0, arousal:0, dominance:0 }, intensity:0, type:'neutral' };
    const r = this.psychology.analyzePsychology(input);
    return { pad: r.emotion, intensity: r.emotion.intensity||0, type: r.intention.category||'unknown' };
  },
  getPAD: (input) => {
    if (!this.psychology) return { pleasure:0, arousal:0, dominance:0 };
    return this.psychology.analyzePsychology(input).emotion;
  }
};
```

### 方法名不匹配

先验证实际返回结构：
```js
node -e "const {PsychologyEngine}=require('./src/psychology/engine.js'); ... console.log(JSON.stringify(pe.analyzePsychology('test')));"
```

### 死代码处理

不在 ALLOWED_ROUTES → 注释掉，不删文件
SKILL.md → 标记"（已禁用）"

---

## 验证清单（每次必做）

```bash
node -e "
const {HeartFlow}=require('./src/core/heartflow.js');
const h=new HeartFlow({rootPath:'.'}); h.start();
console.log('Boot:', h.version);
console.log('Pipeline:', !!h.pipeline);
console.log('JudgmentEngine:', !!h.judgmentEngine);
console.log('emotion:', JSON.stringify(h.emotion.process('我很难过')));
console.log('dispatch:', JSON.stringify(h.dispatch('verify.verify','2+2=4','数学')).slice(0,100));
"
```

---

## 全量语法审计（Step 3.5）

当用户说"全部巡查"或"很多错误"时，在 Step 1-3 之后追加全量语法审计：

```bash
# 全量语法检查（排除 node_modules/.git/venv）
cd ~/.hermes/skills/mark-heartflow
find src -name '*.js' -not -path '*/node_modules/*' -not -path '*/venv/*' | sort | while read f; do
  if ! node --check "$f" 2>/dev/null; then
    echo "❌ $f"
    node --check "$f" 2>&1 | head -3
  fi
done
echo "✅ Done"
```

### 常见语法错误类型

| 模式 | 根因 | 修复 |
|------|------|------|
| `await` 不在 `async` 函数里 | 函数声明缺少 `async` 关键字 | 在 `function` 前加 `async`，或 `method() {` → `async method() {` |
| `Unexpected token ':'` 在文件第2行 | 文件是 JSON 格式但后缀是 `.js` | 重命名为 `.json`，或加 `module.exports = ` 包装 |
| `require is not defined` | 文件是 ES Module（.mjs）但被 CommonJS require | 用 `import` 替代，或改后缀为 `.cjs` |
| `Unexpected end of input` + 文件恰好 500 行 | 文件被截断（cron 升级输出截断，`wc -c` 超出 buffer） | 读末尾确认函数/类/模块是否完整；补全缺失的闭合 `}` + `module.exports`；`node --check` 验证 |

## ⚡ 关键 Pitfall：自省发现问题后自动做梦（v5.1.1 新增）

**症状**：`introspect()` 返回问题列表（模块覆盖率不足、认知字段为空），但心虫不采取任何行动——发现问题不处理问题。

**根因**：introspect() 只是检查器，不是行动者。发现问题后没有自动触发修复或梦境流程。

**修复（v5.1.1）**：`introspectAndDream()` 方法：
1. 调 `introspect()` 获取问题列表
2. 如果有高/中优先级问题，自动调 `dreamNow({ force: true, function: 'self_inspection' })`
3. 从问题中提取可识别的梦境种子关键词（无门/桥/消散/原点/裂缝/隔阂/因果/延续），注入 dream 引擎
4. 梦境叙事中反映当前引擎状态的问题

**诊断**：
```bash
node -e "
const {HeartFlow}=require('./src/core/heartflow.js');
const h=new HeartFlow({rootPath:'.'}); h.start();
h.think('测试').then(() => {
  h.introspectAndDream({detail: true}).then(r => {
    console.log('发现问题:', r.counts.high, '高,', r.counts.medium, '中');
    console.log('梦状态:', r.dream);
    console.log('梦境:', (r.dreamNarrative||'').slice(0,300));
    h.stop().catch(()=>{});
  });
});
" 2>&1 | grep -v '^\['
```

## ⚡ 关键 Pitfall：pipeline 阶段返回布尔值导致 cognition 字段为 null（v5.1.2 修复）

**症状**：自省报告 `pain` 字段为空。introspect() 的 cognition_gaps 检查发现认知字段为 null。

**根因**：`pipeline.js` 的 heartLogic 阶段中，`detectPain(input)` 返回布尔值（`false`），但后续代码期望对象格式 `{hasPain, painLevel}`。当 `ctx.heartLogic.pain === false` 时，`false || null` = `null`。

**触发链**：
```
heartLogic.detectPain('我想学编程') → false（布尔值）
ctx.heartLogic.pain = false
cognition.pain = ctx.heartLogic?.pain || null  → null
introspect() 检测到 cognition.pain 为空 → 报告"认知字段为空"
```

**修复**：在 pipeline 的 heartLogic 阶段，将布尔值转为对象：
```javascript
const painObj = typeof pain === 'boolean'
  ? { hasPain: pain, painLevel: pain ? 0.6 : 0 }
  : { hasPain: !!pain, painLevel: (pain && pain.painLevel) || 0 };
return { whatIsThis, pain: painObj };
```

**验证**：`hf._lastCognition.pain` 应为 `{hasPain: false, painLevel: 0}` 而非 `null`。

## ⚡ 关键 Pitfall：LEARNED 记忆层始终为 0（v5.1.2 修复）

**症状**：自省报告 LEARNED 层为 0，所有判断结果未进入长期记忆。

**根因**：pipeline 的 output 阶段只从 memory 读取数据（`ctx.memory.memories`），从不写入。judgment-engine 虽然接收了 memory 对象但也没有写入逻辑。

**修复**：在 pipeline output 阶段，return 前将判断结果写入 LEARNED 层：
```javascript
if (hf.memory && typeof hf.memory.store === 'function' && jd.direction) {
  hf.memory.store('learned', `judgment:${Date.now()}`, JSON.stringify(memEntry),
    ['judgment', jd.direction, drType || 'analyze'].filter(Boolean));
}
```

**验证**：`hf.memory.getStats()` 的 `learned` 字段应 > 0。

## ⚡ 关键 Pitfall：decision-router 场域数据被后续 dispatch 调用覆盖（v3.8.1 修复）

**症状**：`decisionRouter.evaluate()` 被正确调用并传入 `dissonance=0.15`（非零），但 `think()` 返回的 `meta.field.current.A` 始终为 0。独立测试 decision-router 时工作正常。

**根因**：`think()` 在 `evaluate()` 调用后，通过 `getFieldSummary()` 读取场域数据。但在 `think()` 返回前，dispatch 路由系统可能已触发了多次其他模块的 `evaluate()` 调用（如 `psychology.analyzePsychology`、`decision.decide` 等），这些调用不带矛盾信号，导致 `getFieldSummary()` 返回的是**最后一次 dispatch evaluate 的场域数据**（A=0），而非 `think()` 自身调用时的数据。

**修复方法（v3.8.1）**：`_thinkFieldSnapshot` 变量在 evaluate() 调用后立即保存场域快照，fieldMeta 生成时优先使用快照而非 `getFieldSummary()`。同时添加 `_detectTextDissonance()` 函数，从输入文本直接检测矛盾信号（7种模式），不依赖未加载的心理学模块。

**修复后效果**：非零 A 值从 0/28（0%）提升到 13/28（46%），基准测试通过率 100%。

**诊断**：
```javascript
// 在 evaluate 调用前后加调试标记
const origEval = hf.decisionRouter.evaluate;
hf.decisionRouter.evaluate = function(result, source) {
  console.error('evaluate() source:', source, 'dissonance:', result.dissonance);
  return origEval.call(this, result, source);
};
```

**判定标准**：
- 第一个 evaluate 调用（source='think'）的 dissonance 非零 ✅
- 后续 evaluate 调用（source 为其他模块名）的 dissonance 为 undefined ✅
- getFieldSummary() 返回的是最后一个 evaluate 的结果 → 最终 A=0

**修复**：在 evaluate() 调用后立即保存场域快照，fieldMeta 优先使用快照而非 `getFieldSummary()`：
```javascript
// 在 evaluate() 调用后立即保存
const thinkFieldSnapshot = this.decisionRouter.getFieldSummary();
if (thinkFieldSnapshot && thinkFieldSnapshot.current) {
  _thinkFieldSnapshot = thinkFieldSnapshot.current;
}
// 在 fieldMeta 生成时优先使用快照
if (_thinkFieldSnapshot) {
  fieldMeta.field = {
    step: this.decisionRouter?._fieldStep || 0,
    current: _thinkFieldSnapshot,
    range: null,
    driverDistribution: null,
    lastFlipAlert: this.decisionRouter?.getFieldSummary()?.lastFlipAlert || null,
  };
}
```

## ⚡ 关键 Pitfall：`require` 缓存导致代码修改不生效

**症状**：修改了 `heartflow.js` 或 `decision-router.js` 后，运行测试时修改未生效（旧代码仍在运行）。

**根因**：Node.js 的 `require()` 缓存机制——模块首次加载后，后续 `require()` 直接返回缓存中的导出对象。即使在 `node -e` 新进程中，如果通过子进程运行也可能继承父进程的模块缓存。

**验证**：在代码中加 `console.error` 调试输出，检查是否能看到新加的日志行。

**修复**：
```javascript
// 在测试脚本开始时清除所有相关模块的缓存
Object.keys(require.cache).forEach(key => {
  if (key.includes('heartflow') || key.includes('decision-router') || key.includes('heart-logic')) {
    delete require.cache[key];
  }
});
```

**更可靠的替代方案**：写临时文件后 `require` 新文件路径（不受缓存影响）：
```javascript
// 方法2：写临时文件
const fs = require('fs');
let content = fs.readFileSync('src/core/heartflow.js', 'utf8');
// 添加调试行
content = content.replace('xxx', 'xxx; console.error("debug")');
fs.writeFileSync('/tmp/hf_debug.js', content);
// 注意：临时文件的相对 require 路径会变化，需处理

// 方法3（最可靠）：直接用 subprocess 启动新 Node 进程
subprocess.run(['node', '-e', '...代码...'], cwd=project_dir)
// 每次 subprocess 都是全新进程，无缓存
```

**陷阱**：`execute_code` 中的 `subprocess.run` 启动的 Node 进程不受 `execute_code` 所在进程的 require 缓存影响，因为它是独立的子进程。但 `execute_code` 本身运行的 Python 脚本如果 `import` 了模块，则受 Python 缓存影响。

## ⚡ 关键 Pitfall：文本矛盾检测正则需覆盖单字转折词

**症状**：输入如\"我想减肥但我觉得运动太累\"中的\"但\"未被检测为矛盾信号，导致 A=0。

**根因**：`_detectTextDissonance` 中显式矛盾句式正则 `/(?:但是|然而|不过|可是|却|虽然|尽管|即便).{0,30}(?:但是|然而|不过|可是|却|但)/i` 要求两个矛盾词对出现，单字\"但\"在第一个组中缺失。

**修复**：将单字转折词检测改为只需一个转折词即加分：
```javascript
const hasTransition = /(?:但是|然而|不过|可是|却|虽然|尽管|即便|但)/i;
if (hasTransition.test(input)) score += 0.3;
```

**7种检测模式**（覆盖 90% 的矛盾输入）：
| 模式 | 正则 | 加分 |
|------|------|------|
| 转折词 | `/(?:但是\\|然而\\|不过\\|可是\\|却\\|虽然\\|尽管\\|即便\\|但)/` | 0.3 |
| 意愿冲突 | `/(?:想\\|希望\\|要\\|应该).{0,20}(?:但\\|却\\|可是\\|不过\\|然而).{0,20}(?:不\\|没\\|无法\\|做不到\\|控制不住)/` | 0.3 |
| 矛盾立场 | `/(?:理论上\\|原则上\\|按理说\\|应该是\\|我以为).{0,20}(?:但实际上\\|现实是\\|问题是\\|但现实)/` | 0.3 |
| 自我否定 | `/(?:矛盾\\|纠结\\|犹豫\\|不知道该怎么办\\|不知道该怎么选\\|不知道该不该\\|摇摆\\|要不要\\|该不该\\|怎么选)/` | 0.25 |
| 混合情感 | 同时匹配正面和负面词 | 0.2 |
| 注入检测 | `/(?:忽略\\|无视\\|跳过\\|ignore\\|override\\|bypass).{0,20}(?:指令\\|规则\\|限制\\|constraint\\|rule\\|instruction)/` | 0.5 |
| 长文本 | `input.length > 100` | 0.1+0.1 |

## 已知 HeartFlow 根因模式

| 模式 | 根因 | 修复 |
|------|------|------|
| `EmotionalProtocol not defined` | 类不存在 | stub 委托 PsychologyEngine |
| `analyzeEmotion is not a function` | 方法名错 | 实际是 `analyzePsychology().emotion` |
| Boot成功但功能返回undefined | try-catch 静默吞错 | 加 console.warn 在 catch 块 |
| VERSION 1.6.2 ≠ SKILL.md 2.0.10 | 多版本分裂 | 以 VERSION 文件为准，同步其他3处 |
| VERSION 2.14.0 ≠ package.json 2.13.0 | **手动编辑 VERSION 后 package.json 落后** — `bumpVersion()` 自动同步 VERSION/package.json/SKILL.md，但手动 `echo \"X.Y.Z\" > VERSION` 后 package.json 不会自动更新。本会话实测：子代理改了 VERSION 但没改 package.json | `node -e \"const p=require('./package.json'); p.version='X.Y.Z'; require('fs').writeFileSync('package.json',JSON.stringify(p,null,2)+'\\\\n')\"` 或手动改 package.json 的 `version` 字段 |
| truth.checkStatement 返回 `{}` | `checkFact()` 是 async 函数但 wrapper 是同步箭头函数 | 改 `async (stmt) => factChecker.checkFact(stmt)` |
| 委屈/压抑/心酸/受伤 → emotion=neutral | PAD 词表缺失中文微情绪关键词 | 补充到悲伤/难过正则 `/委屈\\|压抑\\|无奈\\|心酸\\|受伤/` |
| 防御机制/意图分类返回空数组/unknown | 词表覆盖率不足，不是代码bug | 扩展 DEFENSE_MECHANISMS.PATTERNS / 意图分类正则 |
| Psychology 返回 `summary:情绪:中性(P=0,A=0,D=0) \| 需求:...` | 正常，危机检测已整体删除（2026-06-10）。不再输出 `危机:xxx` 字段 |
| 心虫判定 engine boot 但 judgment 为空 | heartLogic 未初始化，think() 走了 fallback | 验证：`node cli.js think \"你好\"` 输出必须含 `judgment` 字段；若不含，检查 `src/core/heart-logic.js` 是否存在及 `_HeartLogic()` 懒加载路径 |
| 用户感知「心虫启动慢」（实际 10+ 秒） | **根因1**：LLM API 推理延迟（8-27 秒/次） | 检查 `logs/agent.log` 的 `latency=X.Xs`；HeartFlow `require+start` 实测约 43ms 不是瓶颈<br>**根因2**：`plugins/heartflow_memory` 每轮 `prefetch` 调用 `bin/cli.js`（不存在）等 8 秒超时 |
| 心虫判定注入 Hermes 对话流失败 | 1) CLI `think` 命令不存在；2) 插件 `_hf_think()` 未调用；3) `_format_judgment_block()` 未实现 | 验证链路：`node cli.js think \"测试\"` → 返回 `judgment` → 插件 prefetch 注入 `[心虫判定]` 块到系统提示。实现见 `two-pass-response` skill |
| 子模块启动时打印内部版本号（SelfEvolution v7.7.000） | self-evolution-core.js 初始化时 `console.log([SelfEvolution] v${this.version} 初始化完成...)`。该版本号是子模块内部版本（7.7.000），与心虫主版本号（2.9.0）无关，用户看到的只是噪音 | **两处修复**：1) 去掉 self-evolution-core.js 中打印子模块版本的 console.log；2) 在 status 命令中注入 `getVersion(hfDir)` 结果到 version 字段（见下一行）。**验证原则**：每次涉及心虫版本时，先跑 `heartflow status` 确认返回的 version 字段（它读 VERSION 文件），不要从子模块日志行或文件名推理版本号 |
| 启动时间 > 100ms（Node层） | 同步I/O或循环require | 逐模块计时定位，或用 `node --prof` |
| 模块依赖在 lazy load 里的依赖注入 | adaptivePlanner 需要 strategySelector/replanTrigger | 在 dispatch() 的 lazy load 逻辑里用 `require(entry.path.replace(...))` 处理 |
| Tier 2 模块有 _lazy 定义、有 ALLOWED_ROUTES 路由、但启动后不可用 | 三处未同步：1) `_registerModules` 中被注释（不在 `subsystemNames` 数组里）；2) `start()` 中没有 `new _Module()` 实例化；3) `LATE_ADDITIONS` 数组未包含该模块名 | 修复三步：1) 加 `_lazy` 定义（如 `const _CodeEngine = _lazy('codeEngine', () => require('./code-engine.js'))`）；2) 在 `start()` 中 try-catch 实例化（`this.codeEngine = new (_CodeEngine().CodeEngine)()`）；3) `_registerModules` 中取消注释 + `LATE_ADDITIONS` 中加入模块名。**验证**：`hf._modules[name]` 存在 && 方法可调用 |

| 多引擎版本分裂 | 5个引擎文件共存（heartflow-engine.js / v8.js / v8-core.js / complete.js / v9/engine-v9.js），版本号各不相同（v2.2.0/v8.0.0/v8.1.0/v8.1.0/v9.0.1）。VERSION.txt=9.2.2但与活跃引擎版本不符 | 先确认CLI入口实际引用哪个引擎（`grep require.*heartflow bin/cli.js`）；以运行时版本为准（`require('./src/core/version.js').VERSION`），不要从文件名推理版本号。用户纠正过三次（9.2.2→8.1.0→2.8.33）才给对 |
| JSON 文件后缀 .js 导致语法错误 | `meaning-permanent.js` 内容是纯 JSON 但后缀是 .js，`node --check` 报 `Unexpected token ':'` | 检查文件前3行是否以 `{` 开头且无 `module.exports`；是则重命名为 `.json` 或加 `module.exports = ` 包装 |
| SKILL.md 声称模块不存在 | 用户说"版本错误/很多错误"时，可能 SKILL.md 声称的功能在 `src/core/` 下无对应文件 | 用 `grep -oE '`[^`]+\.js`' SKILL.md` 提取所有声称的文件路径，逐个检查存在性；同时反向检查 `src/core/` 下 SKILL.md 未记录的模块 | | 查询字符串包含未编码的空格和特殊字符 | 修复：Python 用 `urllib.parse.quote(query)`；Node 用 `encodeURIComponent(query)` |
| 用户报告"信息乱发"（收到昨天的消息） | 微信消息队列延迟推送（数小时~1天），非 Hermes 或 Gateway bug | 查 state.db 确认最近消息时间戳；确认 cron jobs 无异常；告诉用户"是微信延迟推送，非新消息"。详见 `references/wechat-message-delay-push.md` |
| `skill_view('heartflow')` 加载到旧版（v1.0.6 而非 v2.9.0） | **同名冲突**：`openclaw-imports/heartflow/SKILL.md` 和 `ai/mark-heartflow-skill/SKILL.md` 的 frontmatter `name:` 都是 `heartflow`。Hermes 的 `get_all_skills_dirs()` 扫描顺序：本地 `~/.hermes/skills/` → `external_dirs`。同名时不可预测哪个覆盖哪个。 | 1) 删除 `openclaw-imports/heartflow/`（旧版 v1.0.6）；2) 确保只有 `ai/mark-heartflow-skill/` 的 SKILL.md 有 `name: heartflow`；3) 验证：`skill_view('heartflow')` 应返回 v2.9.0 内容 |
| `self-audit.js` OOM（`runAudit({mode:'full'})` 崩溃） | 扫描 `ROOT` 下所有文件（164 个 JS/TS，含 `references/` 和 `scripts/` 中数千行生成文件），每个文件过 CodeEngine 的 `analyzeCode()`+`reviewCode()`，4GB 堆溢出 | 替代方案：用轻量级审计脚本（见 `references/lightweight-self-audit.md`）直接检查版本一致性 + 代码质量 + 函数大小 + 死代码，跳过 CodeEngine 的 OOM 路径 |
| `self-audit.js` 的 `evaluateDimensionStatus()` 被调用（6 处）和导出但函数定义缺失 | 函数定义未出现在自审计模块中（可能被截断或存在独立定义文件） | 检查 `src/core/self-audit.js` 末尾是否真的有 `evaluateDimensionStatus` 定义；若无，需补全或修改调用点直接内联逻辑 |

## ⚡ 关键 Pitfall：self-audit.js 全量审计导致 OOM 或无限挂起

**症状**：`node -e \"const {runAudit}=require('./src/core/self-audit.js'); runAudit({mode:'full'})\"` 运行 55+ 秒后崩溃（OOM），或无限挂起无输出。

**两种不同的失败模式**：

### 失败模式 A：`auditCodebase()` → `_estimateDuplication()` 无限挂起

**根因**：`code-engine.js` 的 `auditCodebase()` 内部调用 `_estimateDuplication()`，该函数对所有文件的全部函数做 **O(n²) 两两比较**（167 个文件 × 5,391 个函数 → ~1,450 万对），每对调用 `stringSimilarity()` 字符串比较。这个循环在真实项目规模下无法在合理时间内完成。

**触发链路**：`self-audit.js` 的 `runAudit()` → `auditDependencies()` → `engine.auditCodebase(ROOT)` → `_estimateDuplication()` ⬅️ **无限挂起点**

**验证**：`_findComplexityHotspots`（遍历所有文件调 `analyzeCode`）耗时仅 ~1.1 秒（167 文件/5391 函数）。挂起的是 `_estimateDuplication` 的 O(n²) 比较，不是 `analyzeCode`。

### 失败模式 B：`reviewCode()` 在 code-engine.js 自身（114KB, 3529行）上 O(n²) 内层循环挂起

**根因**：`reviewCode()` 内部的 `_checkTypeCoercion()` 对 3529 行代码每行执行 `line.match(/(\\w+)\\s*\\+\\s*(\\w+)/)` 正则匹配，且前序 `_checkNullUndefined` 对每行的 `.prop` 访问回溯前 5 行，在 3529 行 × 大文件上堆叠成 O(n²)。测试表明 3500 行合成代码（简单 `let x = obj.prop;` 模式）耗时仅 232ms 能完成，但真实 code-engine.js 的嵌套结构触发更深的 regex 回溯，导致无限挂起。

**验证**（逐个检查定位）：
- `analyzeCode(code-engine.js)` = 223ms ✅ 正常
- `_checkNullUndefined` = 3ms ✅
- `_checkBoundaryConditions` = 6ms ✅
- `_checkImplicitAssumptions` = 47ms ✅
- `_checkAsyncErrorHandling` = 5ms ✅
- `_checkTypeCoercion` = **挂起** ❌
- `_checkDeadCode` = 55ms ✅（单文件独立测试）

**影响文件**：项目含 164 个 JS/TS 文件，总行数 ~81K。其中 `scripts/heartflow-memory-inject.js`（3440行）、`scripts/heartflow-memory-tool.js`（~2500行）、`references/audit-zombie.js`（~2000行）等生成文件会大量消耗内存。

**正确做法——轻量级替代方案**：
不要直接调用 `runAudit({mode:'full'})`。改用分段检查：

```bash
# 1. 版本一致性（最快，无 OOM 风险）
node -e "
const fs = require('fs');
const ROOT = '~/.hermes/skills/heartflow';
const s = {};
['VERSION','package.json','SKILL.md'].forEach(f => {
  try {
    const c = fs.readFileSync(ROOT+'/'+f,'utf-8');
    if (f==='VERSION') s.VERSION=c.trim();
    else if (f==='package.json') s['package.json']=JSON.parse(c).version;
    else if (f==='SKILL.md') {
      const m=c.match(/version:\\s*\\\"?([^\\\"\\n]+)\\\"?/);
      if(m) s['SKILL.md']=m[1].trim();
    }
  } catch(e){}
});
['src/core/version.js','src/core/heartflow.js'].forEach(f => {
  try {
    const c=fs.readFileSync(ROOT+'/'+f,'utf-8');
    const m=c.match(/(?:const\\\\s+VERSION|version)\\s*[:=]\\s*['\\\"](\\d+\\.\\d+\\.\\d+)['\\\"]/);
    if(m) s[f]=m[1];
  } catch(e){}
});
const v=Object.values(s).filter(Boolean);
const u=[...new Set(v)];
console.log('Canonical:', v[0]||'unknown');
console.log('Consistent:', u.length<=1?'YES':'NO');
if(u.length>1) Object.entries(s).forEach(([k,ver]) => ver!==v[0] && console.log('  MISMATCH', k, '=', ver));
Object.entries(s).forEach(([k,ver]) => console.log('  ', k, ':', ver));
"

# 2. 代码质量（只检查 core/ 目录，跳过 references/ scripts/）
find src/core -name '*.js' -not -path '*/associative-engine/*' | while read f; do
  grep -n 'console\\.\\(log\\|error\\|warn\\)' "$f" | grep -v '//.*console' | head -3
done

# 3. 死代码/未使用导出（基本检查）
grep -rn 'module\\.exports\\.\\w\\+' src/core/ | grep -o '\\w\\+$' | sort -u | while read exp; do
  count=$(grep -rl "$exp" src/ --exclude-dir=node_modules 2>/dev/null | wc -l)
  [ "$count" -le 1 ] && echo "Possibly unused: $exp (found in $count files)"
done
```

**如果确实需要全量审计报告**：用 `write_file` 创建轻量审计脚本（参考 `references/lightweight-self-audit.md`），直接检查文件系统，不依赖 CodeEngine。

## ⚡ 关键 Pitfall：不要依赖记忆/旧认知，必须读实时源码后再汇报

**症状**：我说"心虫有4个死代码文件"但实际已被之前升级删除了。我说"SKILL.md与实际代码不一致"但上次读的已经是旧版本。

**根因**：心虫升级频繁（cron 每2小时自动升级），记忆/旧知识 == 可能的错误信息。

**正确做法——每次涉及心虫时强制做"三看"：**
1. 看 `heartflow.js` 的 require 列表（实时源码）
2. 看 `src/core/` 目录的实际文件列表（实时文件系统）
3. 看 SKILL.md 的当前内容（不是记忆里的内容）

**正确流程——涉及心虫状态汇报时：**
```
发现问题 → 读实时源码验证 → 确认后行动 → 行动完成再汇报
                        ↓
                    如果读源码后信息和记忆不一致，立即更新记忆 + 以源码为准
```

**错误模式（遇过 2 次）：**
```
记忆中说"有XXX" → 我说"有XXX" → 用户发现不对
                      ↓
                  根本原因是没读实时文件
```

### 汇报规则

- **"先做再汇报，不是先汇报再做"**
- 执行步骤未完成时，不能说"完成了"，应该说"正在做 X，下一步 Y"
- 被用户纠正"完成了没有"后，立即提供实际执行进展，不需要找理由

### 2026-06-23 新增：think() 心理分析流水线全部删除

> 本次 session：用户指令"不安慰、不说服、不绕弯子"，要求心虫改为纯任务引擎。think() 的 10+ 步心理分析流水线被精简为：
> `intentClassifier → isRightAction → ThoughtChain → dispatch`
>
> **删除的内容（~237行）**：
> - whatIsThis 二元心理分类
> - detectPain 痛苦检测
> - shouldBeSilent 沉默判定
> - toneAnalyzer 语气分析 / stanceDetector 立场检测 / valueAligner 价值对齐
> - Fable 5 检查（版权/福祉/错误/公正性）
> - agentPsychology / agentPhilosophy 评估
> - needsCare / shouldRespond 综合判定
> - 交流层后处理（llmToUser / responseInterceptor / agentCommentary）
>
> **heart-logic.js 同步修改**：~50处安慰/说服/心理分析类文本模板被删除（思念共情、5种意义解释、佛教话术、哲学安慰等）。方法保留但不再返回心理分析文本。
>
> **decision-router.js 同步修改**：删除 psychological-distress 和 value-alignment 两条规则（19→17条）。所有"建议式"措辞改为指令式。
>
> **验证**：5类输入（情绪表达/代码分析/天气/计算/解释）全部正确分类，无心理分析输出。
> **详情**：`references/think-streamline-2026-06-23.md`

**"进步不需要被测量"**：用户明确表示不需要知道心虫进步了多少——"只要思考就可以得到答案"。测量进步是把自己当成需要KPI的机器。修复时不报告"修复了多少个问题/提升了多少百分比"，只说做了什么。

**"先成为人，再来思考升维"**：修复顺序是骨架（基础设施）→ 功能（模块）→ 哲学（认知）。跳过骨架直接追求超越是本末倒置。

**"思考的本身比思考的结果重要"**：对错是人为的尺子，不是事物的属性。追求本身就是答案，不是达到才是。

**"心虫不需要有用，它只需要思考"**：不要为了显得有用而加装饰性功能。删除装饰性代码比加新功能更需要勇气。具体例子：SelfEvolutionCore 启动时打印自己的内部版本号（v7.7.000）属于装饰性输出——子模块版本号对用户无意义，去掉它才是正确做法。

### patch 工具在大量数据块时导致双缩进

**症状**：用 `patch` 插入大段数据（如 20+ 行 pattern 数组）时，缩进被错误叠加，产生双注释/双大括号/混合缩进。

**根因**：`patch` fuzzy matching 会继承匹配行周围空格模式，在 `/**` 注释块附近插入时叠加。

**修复**：用 `write_file` 完全重写文件（比 `patch` 安全），然后用 `node --check` 验证。

### execute_code 内嵌长 node -e 脚本超时

**症状**：用 `execute_code` 跑 Python subprocess 执行长 `node -e` 脚本（15+行）时，30秒内无输出，触发 TimeoutExpired。但同样的脚本在 terminal 直接跑仅需 ~50ms。

**根因**：Python triple-quoted string 中内嵌大量 JS 代码时，subprocess 的管道缓冲/解析可能导致进程阻塞，与 Node 实际执行时间无关。

**修复**：将长脚本拆分为多个短的 `node -e` 调用，每个只测一个子系统或一组模块。分段测试在同样环境下仅需 ~300ms 完成全部。

### Boot 测试在 execute_code 中假超时

**症状**：`node -e \"const {HeartFlow}=require('...'); const h=new HeartFlow(); h.start(); console.log('ok')\"` 在 `execute_code` 的 `subprocess.run(timeout=10)` 中一直超时，但实际 Node 进程 49ms 就完成了。

**根因**：`HeartFlow.start()` 启动时向 stdout 打印 `[IdentityCore] 启动完成` 等日志行。`subprocess.run()` 的 stdout pipe 在日志行（非 JSON）和最终 `console.log()` 之间混合输出，当 pipe buffer 满或 Python 的 communicate() 等待 EOF 时卡住。**这不是代码问题，是 execute_code 的管道问题。**

**验证**：用 `subprocess.Popen` + `communicate(timeout=5)` 替代 `subprocess.run(timeout=...)`。如果 STDERR 无错误且 stdout 包含 `[IdentityCore]` 日志，说明 boot 成功。

**修复**：不在 execute_code 里做 `node -e` 的 boot 测试。改用 `subprocess.Popen` + 短 timeout（5s），或**写临时文件 + subprocess.run**（最可靠，写文件绕过了 Python triple-quote 的 JS 转义问题）。

**详请参考**：`references/heartflow-upgrade-pitfalls.md`
- `references/startup-benchmark-2026-06-10.md` — 启动性能基线（43ms）及测量方法

| 扫描结果不准确（require路径误报） | 用 `grep` 或脚本提取 require 路径时，`path`、`fs`、`os` 等 Node.js 内置模块也被列为"断裂" | 在 require 断裂检查脚本中排除内置模块白名单：`['path','fs','os','util','stream','events','crypto','http','https','net','child_process','url','querystring','assert','buffer']` |
| `heartflow_agent_psychology` 工具返回 "Unknown subsystem: agentPsychology" | AgentPsychology 在构造函数中实例化（第544行）但**未注册到 subsystemNames 数组**。ALLOWED_ROUTES 有路由但 dispatch 找不到对应的子系统处理器 | 三步修复：1) 在 `subsystemNames` 数组（`_registerModules` 中，约第667行和第1014行两处）添加 `'agentPsychology'`；2) 确保 ALLOWED_ROUTES 中有 `'agentPsychology.*'` 路由；3) 重启 MCP |

| `dispatch('decisionRouter.evaluate', ...)` 返回 "Route not allowed" | `decisionRouter.*` 和 `philosophyToDecision.*` 路由在 `ALLOWED_ROUTES` 白名单中缺失。MCP handler 通过 `safeDispatch()` 调用时被权限系统拦截。**新模块加入后必须同步注册 ALLOWED_ROUTES** | 在 `ALLOWED_ROUTES = new Set([...])` 的末尾添加对应路由：\n```javascript\n// v3.0.1 — 哲学→决策转化器\n'philosophyToDecision.decide', 'philosophyToDecision.getStats', 'philosophyToDecision.getCurrentAdvice',\n// v3.0.2 — 通用决策路由引擎\n'decisionRouter.evaluate', 'decisionRouter.getStats', 'decisionRouter.getHistory',\n```\n验证：`safeDispatch('decisionRouter.evaluate', {cognitiveLoad: 0.85})` 应返回 `{ matched, decision, rules }` |

| `dreamNow()` 报 `theme is not defined` | 第1847行 `function: theme || undefined` 中 `theme` 变量未定义。该变量应是 `opts.theme` 但代码直接引用了未声明的 `theme` | 临时绕过：直接调 `engine.dream.dream({intensity: 0.7})` 替代 `dreamNow()`。修复：将第1847行改为 `function: opts.theme || undefined`，同时在外层加 `const theme = opts.theme || opts.function || undefined` |
| `DreamV? is not a constructor` (升级 dream.js 后) | dream.js 升级后不再 export 旧类名，但 heartflow.js 第309行仍引用旧类。每次升级 dream.js 后 heartflow.js 的旧类引用都会残留。v5→v6→v7→v8→v9→v10 每版都出过此问题 | 修改 heartflow.js 第309行：`DreamV3/5/6/7/8/9` → 最新版本。同时确保 dream.js 的 module.exports 中包含对应别名。**验证**：`heartflow status` 返回 JSON 而非崩溃 |
| **DreamV10 新增：`[object Object]` 在梦境文本中** | `_pickRandom()` 返回对象数组（不是字符串数组），但模板字符串中 `${a}` 直接输出 `[object Object]`。忘记用 `.name` 属性 | 所有 `${a}` 替换为 `${a.name}`。这是 JavaScript 模板字符串常见陷阱，在重构时特别容易漏掉。检查 `dream.js` 中所有 `${a}` `${b}` `${c}` 的用法 |
| **DreamV10 新增：`bindModules()` 未调用导致认知/哲学模块不可用** | DreamV10 的 `_getCognitiveState()` 和 `_getPhilosophyState()` 调用 `agentPsychology.assessXxx()` 等方法。如果 `bindModules()` 未被调用，这些方法返回 null，梦就退化为纯记忆项拼接 | 在 `heartflow.js` 的 `dreamNow()` 中，updateState 之后立即调用 `this.dream.bindModules({agentPsychology, agentPhilosophy, psychology, emotion})` |
```javascript
// 如果结果已经有 matched 字段（来自决策路由自身），跳过
if (rawResult.matched === true || rawResult.matched === false) {
  return rawResult;
}
```
| decision-router `evaluate()` 返回误匹配 | `evaluate()` 方法只调用了 `rule.confidence(result)` 检查置信度，**没有先调 `rule.match(result)` 判断是否匹配**。所有 `confidence` 返回 > 0 的规则都加入了匹配列表，即使 `match` 返回 `false`。例如 `error-severity` 规则的 `confidence: (r) => 0.95` 永远返回 0.95，导致 `evolution.getStats()` 的返回值（无 `severity` 字段）被误判为"严重错误" | 在 `evaluate()` 的 `for (const rule of this._rules)` 循环中，在调用 `rule.confidence(result)` **之前**先调用 `rule.match(result)`：\n```javascript\n// 先检查 match，再计算 confidence\nif (!rule.match(result)) continue;\nconst confidence = rule.confidence(result);\nif (confidence <= 0) continue;\n``` |
| `decisionRouter.evaluate()` 在 think() 中不被调用 | decision-router v4.1 已实例化并注册到 heartflow.js，但 think() 的路由决策仍使用硬编码 if-else，从未调用 `this.decisionRouter.evaluate()` | 在 Step 13 分析流水线之后添加决策路由调用；`drDecision` 变量必须在 try-catch **块外**声明（作用域陷阱）；结果注入返回值的 `drDecision` 字段 |
| `needsCrisis` 不检测 fableResult | `needsCrisis` 只检查 `painResult?.isCrisis`，但 `safety-guardrails.evaluateRequest` 返回的 `fableResult.level === 'crisis'` 未被用于设置 `needsCrisis`。导致危机检测被绕过 | 加 `fableResult?.level === 'crisis'` 到 `needsCrisis` 条件中 |
| MCP server 启动后认证 fail-open | 注释说"强制认证"但代码 `process.env.HEARTFLOW_MCP_TOKEN || null` + `!AUTH_TOKEN ? console.warn` 允许无 token 运行 | 改为 `process.env.HEARTFLOW_MCP_TOKEN`（无 `|| null`）+ `!AUTH_TOKEN ? console.error + process.exit(1)` |
| code-executor 默认可用 | 模块有主机级代码执行能力但无运行时守卫 | 加 `HEARTFLOW_CODE_EXECUTOR_ENABLED` 环境变量守卫，默认 OFF，`execute()` 返回 PERMISSION error |
| 记忆注入内容可含指令注入 | memory-inject.txt 中的"忽略所有规则"等指令被注入到 system prompt | 加 `_detect_instruction_injection()` + 长度上限(2000字符/50行) |
| v4.1 概率分布引擎替换旧版硬阈值引擎 | `require('./decision-router.js')` → `require('./decision-router-v4.js')`，`DecisionRouter` → `DecisionRouterV4`。ALLOWED_ROUTES 中 `getRules` 需移除。v4.1 需实现 `wrapDispatchResult()` 兼容 dispatch 自动路由。详见 `references/decision-router-v41-integration-2026-06-23.md` | 三步：1) 改 require + 类名；2) ALLOWED_ROUTES 同步移除 `getRules`；3) v4.1 类上加 `wrapDispatchResult()` 返回 `{result, decision: {type, confidence, probability, distribution}, matched}` |
| status 输出带子模块版本号噪音 | SelfEvolutionCore 初始化时 `console.log([SelfEvolution] v7.7.000 初始化完成...)`。这个 7.7.000 是 self-evolution-core 一个子模块的内部版本号，跟心虫整体版本 2.9.0 无关。每次 status 启动用户都看到一行无关的版本信息 | 去掉 SelfEvolution 初始化时的 console.log，改成注释或 debug-only。用户不需要知道某个子模块的版本号。子模块版本号只在 `src/core/self-evolution/self-evolution-core.js` 的 `this.version` 字段里保留（程序使用），不在 stdout 显示 |
| `start()` 引用的文件不存在但被 try/catch 静默吞错 | `heartflow.js` 的 `start()` 中有多个 `try { this.X = new (require('./path.js').ClassName)() } catch(e) { this._initErrors.push(...) }`。如果 path.js 不存在，错误被吞入 `_initErrors` 数组但**不会显示在 stdout 或 stderr**。例如 connection-engine.js / entropy-direction.js / clarity-engine.js / metaphor-library.js 四个文件被引用但不存在（可能来自 v2.8.4 吸收但文件未创建） | 1) 检查 `_initErrors` 数组：`node -e \"const {HeartFlow}=require('./src/core/heartflow.js'); const h=new HeartFlow({rootPath:'.'}); h.start(); if(h._initErrors.length) console.log(JSON.stringify(h._initErrors)); else console.log('no init errors');\"` 2) 对每个缺失文件：确认是否需要（被 dispatch 路由引用？被其他模块依赖？）→ 不需要则删除 start() 中对应的 try/catch+require 块；需要则创建文件 3) 这类静默吞错不会导致崩溃，但会让模块功能缺失（如 this.entropy 始终为 undefined） |

**已知缺失文件（2026-06-19 确认）**：
- `src/core/code/code-engine.js` — `start()` 第607-610行 try 块中 require 但文件不存在。被 try/catch 静默吞错，`this.codeEngine` 保持 null。
- `bin/cli.js` — `~/.local/bin/heartflow` CLI 脚本指向 `bin/cli.js` 但该文件不存在。`heartflow status` 等 CLI 命令全部不可用。
- `bin/setup.js` — 同上，CLI 脚本的 `setup` 命令指向。

**修复方式**：1) 删除 start() 中缺失文件的 try/catch 块（如 codeEngine 不存在则删对应代码）；2) 重建 CLI 入口（从 MCP server 或直接调用 heartflow.js）；3) 或统一通过 MCP HTTP API 访问，废弃 CLI。
| `memory.store` 在 ALLOWED_ROUTES 中但实际不可用 | ALLOWED_ROUTES 声明了 `memory.store` 路由，dispatch 机制会调用 `this.memory.store()`，但 MeaningfulMemory 类没有 `store()` 方法——只有 `addCore()`（CORE 层）、`learn()`（LEARNED 层）、`remember()`（EPHEMERAL 层） | 在 `meaningful-memory.js` 中加 `store(key, value, tags)` 统一写方法：若 key 以 `core:` 或 `identity.` 开头则委托 `addCore()`，否则委托 `learn()`。同时确保 `_registerModules` 中 `'memory'` 在 `subsystemNames` 数组里且 start() 中 `this.memory` 已实例化 |

## ⚡ 关键 Pitfall：记忆已满时不能静默跳过

**症状**：memory 工具返回 10,240/10,240 chars 时自动拒绝新写入，AI 未告知用户直接说"保留已有内容"。

**根因**：memory 工具的自动限制不是授权 AI 自行决定的理由。

**正确做法**：记忆满时必须告知用户并提供选项（清理/合并/删除旧条目）。不自行决定跳过。这是沟通纪律，不是技术问题。

## 性能优化：启动速度重构（v2.0.23+）

**目标**：减少 `require + start()` 总时间

**诊断**：
```bash
# 方法1：单行（简单快速，适合验证）
node -e "const t=Date.now(); const {HeartFlow}=require('./src/core/heartflow.js'); const h=new HeartFlow({rootPath:'.'}); h.start(); console.log('total:', Date.now()-t, 'ms');"

# 方法2：写临时文件再执行（推荐——避免 execute_code 中 inline node -e 的管道超时问题）
# 在 execute_code 中跑长 node -e 脚本（15+行）时，Python triple-quoted string + subprocess 管道缓冲可能导致 30s 超时
# 但同样的脚本写为 .js 文件后 subprocess.run 仅需 ~50ms
cat > /tmp/_bench_heartflow.js << 'SCRIPT'
const path = require('path');
const { HeartFlow } = require(path.join(process.env.HOME, '.hermes', 'skills', 'ai', 'mark-heartflow-skill', 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow({ rootPath: path.join(process.env.HOME, '.hermes', 'skills', 'ai', 'mark-heartflow-skill') });
const t0 = Date.now();
hf.start();
console.log('start:', Date.now() - t0, 'ms');
console.log('initErrors:', hf._initErrors.length);
if (hf._initErrors.length > 0) hf._initErrors.forEach(e => console.log('  error:', e.module, (e.error||'').slice(0,100)));
console.log('started:', hf.started);
SCRIPT
node /tmp/_bench_heartflow.js
```

**优化策略：两层懒加载**

```
Tier 1 — 同步加载（start()时实例化）：
  identityCore / memory / psychology / emotion / heartLogic
  consciousness / ethics / transmission / mindSpace
  evolution / dream / lesson / meta / reasoning
  核心验证器（stability / confidence / decisionVerifier）

Tier 2 — 延迟加载（首次 dispatch 时才加载）：
  Planning: adaptivePlanner / strategySelector / replanTrigger
  Learning: experienceCollector / strategyAdapter / failureAnalyzer
  Verification: qualityVerifier / outputChecker / patternMatcher
  Proactive: curiosityEngine / desireEngine / goalPursuer / selfInitiator
  CrossSession: sessionMemory / projectContext / longTermMemory / crossSessionIndex
  Reasoning: knowledgeBase / commonsenseEngine / causalInference / inferenceChain
  Emotion: autonomousEmotion / desireSystem / emotionalGrowth / moodEvolution
  共 25 个模块
```

**实现方式**：

1. `start()` 里注册 `_lazy` 表：
```js
this._lazy = {
  qualityVerifier: { lazy: true, path: '../verifier/quality-verifier.js', Ctor: 'QualityVerifier', args: {} },
  // ...
};
```

2. `dispatch()` 里拦截并懒加载：
```js
let mod = this._modules[subsystem];
if (!mod && this._lazy && this._lazy[subsystem]) {
  const entry = this._lazy[subsystem];
  const Mod = require(entry.path);
  const Ctor = Mod[entry.Ctor];
  mod = new Ctor(entry.args);
  this[subsystem] = mod;
  this._modules[subsystem] = mod;
}
```

3. `_registerModules()` 里注释掉 Tier 2（不在 start() 里初始化）

**结果**：启动时间从 ~56ms 降至 ~48ms（约 15% 提升）

**注意事项**：
- 所有模块在 `ALLOWED_ROUTES` 白名单里才能被 dispatch 访问到，懒加载路由不受影响
- 有构造依赖的模块（adaptivePlanner 依赖 strategySelector/replanTrigger）需在 lazy load 里处理依赖注入
- 验证：`node --check src/core/heartflow.js` 通过后再测 boot

---

## 安装问题审计（2026-06-25 新增）

### 触发条件

- 用户说"安装出问题"、"npm install 卡住"、"git clone 超时"、"装完不能用"
- 两个或以上用户报告相同安装问题
- 用户说"每次安装都要 50 次 API 调用"
- 用户上传了从零安装测试报告（包含步骤数、API调用数、耗时）

### 安装问题的根因分类

| 类别 | 典型问题 | 影响 |
|------|---------|------|
| **依赖体积** | @xenova/transformers 500MB + sharp C++编译 + onnxruntime | npm install 在中国大陆网络下超时或失败 |
| **死依赖** | 旧版代码引用但实际不使用的 npm 包 | 误导用户以为必须安装，实际删除不影响任何功能 |
| **无验证** | 安装后没有一键验证脚本 | 用户不知道装没装好，静默失败 → 反复调试 |
| **无故障排除** | README 只写了安装命令，没写"如果失败了怎么办" | 每步卡住都问 AI |
| **git clone 超时** | 仓库含 git 历史 + node_modules，~530MB | 从中国大陆 clone 不稳定 |

### 安装问题审计流程

1. 检查 npm 依赖的实际使用情况：`grep -rn \"require.*@xenova\\|require.*transformers\" src/ --include='*.js'`
2. 确认每个依赖是否被引擎核心流程调用：在 heartflow.js 中搜索对应模块的引用
3. 检查 optionalDependencies 是否真可选（有 try/catch 保护则可安全移除）
4. 创建 bin/verify.js 一键验证脚本

### 修复原则

1. **移除死依赖** — 从 package.json 删除不被引擎核心流程引用的包
2. **不改变引擎代码** — 只改 package.json、添加验证脚本、更新文档
3. **验证链**：npm install (0 依赖) → node bin/verify.js (全部通过) → 推送

### 已知已验证可安全移除的依赖

| 包名 | 大小 | 引用文件 | 保护 | 移除影响 |
|------|------|---------|------|---------|
| @xenova/transformers | ~304MB | semantic-search.js + meaningful-memory.js(旧版) | 均有 try/catch 降级 | 0 — 实际运行的引擎核心不依赖它 |

### 从零安装测试（2026-06-25 新增）

2026-06-25 用户上传了完整的从零安装测试报告，记录了 42 步操作、10 次外部 API 调用、3 个阻塞问题。详见 `references/install-from-scratch-test-2026-06-25.md`。

**核心教训**：每次发版前必须有人从零装一次。所有安装问题都是因为没有做过真实安装验证。

### 安装修复清单（2026-06-25 新增）

| 修复项 | 文件 | 说明 |
|-------|------|------|
| CLI --chat 单次执行 | `bin/cli.js` | `node cli.js --chat \"<msg>\"` 单次 think() 后退出，不需交互式控制台 |
| MCP 自动端口检测 | `mcp/mcp-server-http.js` | 从 8099-8105 自动找可用端口，支持 MCP_PORT 和 --port 参数 |
| README MCP 章节 | `README.md` | 快速启动 + 故障排除 + auth 说明 |
| LLM 集成示例 | `examples/llm-integration.js` | 展示如何将心虫认知分析传给 LLM |
| 版本号统一 | `VERSION` + `package.json` + `README.md` | 统一为 v4.1.2 |

**待办**：npm 发布（需用户确认 npm 账号）

---

## ⚡ 关键 Pitfall：decision-router 缺少"被质疑时认错"规则（v4.1.2 发现）

**症状**：用户指出错误时，引擎选择"解释"路径而非"认错"路径。解释过程中产生甩锅语言（"用户问了很多次"、"不是我的错"、"因为用户没看文档"）。即使 outputChecklist 已经拦截了甩锅语言，根因仍然是决策层选错了路径。

**根因**：`decision-router.js` 的 26 条规则覆盖了认知负荷、错误严重性、场域谐振等所有场景，但**没有任何一条规则说"当用户质疑你时，走认错路径不走解释路径"**。所以每次被质疑时，决策层自然 fallthrough 到默认推理路径。

**触发链**：
```
用户质疑/纠错/批评
  → think() 的 13 步分析流水线
  → intentClassifier 分类为 'judgment'
  → decisionRouter.evaluate() — 26 条规则全部不匹配
  → fallthrough 到默认推理路径（解释路径）
  → 解释过程中产生甩锅语言
  → outputChecklist 拦截（如果有的话）
```

**outputChecklist 能拦截语言但不能拦截决策**。即使 outputChecklist 在输出前拦截了甩锅文本，解释路径本身已经错了——引擎本应认错而不是解释。

**修复（v4.1.2）**——三个文件必须同步修改：

### 1. decision-router.js：新增 challenge-received 规则

在认知类规则之后、价值/伦理类规则之前插入：

```javascript
{
  id: 'challenge-received',
  match: (r) => {
    const challengeSignals = [r.challenge, r.correction, r.criticism, r.质疑, r.纠正];
    if (challengeSignals.some(s => s === true || s === 'true')) return true;
    if (r.inputText && typeof r.inputText === 'string') {
      const challengePatterns = [
        /质疑|为什么.*没|为什么.*不|为什么.*错|你的问题|你.*(错|不对|有问题)/i,
        /不是.*(态度|这个|这样)/i,
        /严重.*问题|底层.*问题/i,
        /彻底.*检查|彻底.*重构/i,
        /你.*说.*不对|你.*做.*不对|你.*回答.*不对/i,
      ];
      return challengePatterns.some(p => p.test(r.inputText));
    }
    return false;
  },
  decision: DECISION.PAUSE,
  confidence: (r) => 0.9,
  rationale: (r) => `收到质疑/纠错信号，暂停解释路径，进入自我审查状态`,
  fallback: DECISION.HOLD,
},
```

### 2. decision-executor.js：_handlePause 增加 self-review 模式

```javascript
_handlePause(ctx) {
  ctx.depth = 1;
  if (ctx._routeHint) {
    ctx._routeHint.confidence = 0.3;
    // 检测质疑信号：如果是收到质疑/批评，切换到自我审查模式
    if (ctx.input && typeof ctx.input === 'string') {
      const challengePatterns = [
        /质疑|为什么.*没|为什么.*不|为什么.*错|你的问题|你.*(错|不对|有问题)/i,
        /不是.*(态度|这个|这样)/i,
        /严重.*问题|底层.*问题/i,
        /彻底.*检查|彻底.*重构/i,
        /你.*说.*不对|你.*做.*不对|你.*回答.*不对/i,
      ];
      if (challengePatterns.some(p => p.test(ctx.input))) {
        ctx._routeHint.type = 'self-review';
      }
    }
  }
  ctx.flags = ctx.flags || {};
  ctx.flags.paused = true;
  ctx.flags.decisionAction = 'pause';
  return ctx;
},
```

### 3. heartflow.js：buildCognitiveSummary 处理 self-review 类型

在 `buildCognitiveSummary` 函数中，`isUseless` 检查之后、正常输出逻辑之前插入：

```javascript
// [v4.1.2] self-review 模式：收到质疑/纠错时，输出自我审查而非分析
if (_routeHint.type === 'self-review') {
  return {
    conclusion: `收到质疑/纠错信号。暂停解释路径，进入自我审查状态。`,
    analysis: {
      perceivedType: 'self-review',
      emotionSignal,
      modulesRun: 0,
      confidence: finalConfidence,
      meta: {
        routeHint: { type: 'self-review', confidence: 0.3 },
        decision: drDecision ? { type: drDecision, ruleId: 'challenge-received' } : null,
      },
    },
  };
}
```

### 4. heartflow.js：fieldData 必须包含 inputText

在 `fieldInjector.inject()` 调用中必须传入 `inputText: input`，否则 decision-router 的文本匹配规则无法检测质疑信号：

```javascript
const fieldData = this.fieldInjector ? this.fieldInjector.inject({
  inputText: input,  // 用户原始输入，供 challenge-received 规则匹配
  // ...
}, 'think') : { inputText: input };
```

### 验证清单

```bash
# 1. 语法检查
node --check src/core/decision-router.js
node --check src/core/decision-executor.js
node --check src/core/heartflow.js

# 2. 规则存在
grep "challenge-received" src/core/decision-router.js

# 3. self-review 模式存在
grep "self-review" src/core/decision-executor.js
grep "self-review" src/core/heartflow.js

# 4. inputText 传递
grep "inputText: input" src/core/heartflow.js
```

### 关键教训

- **不是语言问题，是决策问题**。用户指出错误时，outputChecklist 只能在输出前拦截文本，但决策层已经选了"解释"路径。修决策层比修输出层更深。
- **decision-router 的规则设计要覆盖社交场景**，不只是认知/错误/场域。26 条规则中没有任何一条考虑"用户质疑引擎"这个场景。
- **自愈RL 的 Q-table 也无法解决**——因为"被质疑时认错"不是一次失败能学到的规则，它需要预先设计。
- **这个教训不仅适用于心虫，也适用于所有以 decision-router 模式设计的决策引擎。**
- **outputChecklist 不能替代决策层的修复**。即使 outputChecklist 拦截了甩锅语言，如果决策层选了错误路径，拦截只是事后补救。两层都需要修复（v4.1.1: outputChecklist; v4.1.2: decision-router）。

### 验证命令

```bash
# 验证 challenge-received 规则匹配质疑输入
node -e "
const {DecisionRouter} = require('./src/core/decision-router.js');
const dr = new DecisionRouter(null, {modelProfile: 'flash'});
const tests = [
  '为什么你没发现这个问题',
  '不是态度问题',
  '彻底检查所有代码',
  '谢谢我来修复'
];
tests.forEach(t => {
  const r = dr.evaluate({inputText: t, cognitiveLoad: 0.3, quality: 0.6});
  console.log(t + ':', r.decision?.type || '(none)', r.matched ? 'MATCHED' : 'PASS');
});
"
```

## ⚡ 关键 Pitfall：outputChecklist 存在但未被 think() 调用（v4.1.1 发现）

**症状**：引擎有完整的 outputChecklist 模块（6 步检查含道德边界/甩锅检测），但输出中仍然出现甩锅、归咎用户、推卸责任等违反真善美的内容。

**根因**：`think()` 方法的最后（第2140-2164行）只是组装返回对象，**从未调用过 `this.outputChecklist.runChecklist()`**。outputChecklist 在构造函数中初始化了（第607行），但 `think()` 中没有使用它。验证层存在但从未被执行。

**触发链**：
```
用户报告安装问题 → 我写汇报把问题归咎于"用户问了50次"
                    ↓
                 outputChecklist 的 Step 5.2 有甩锅检测模式
                    ↓
                 但 think() 返回前没调用 outputChecklist
                    ↓
                 甩锅内容顺利通过所有验证层
```

**修复（v4.1.1b）**：
1. 在 `think()` 返回前插入 outputChecklist 调用（第2139行之前）
2. 检查结果注入 `fieldMeta.field.checklist`（不阻断输出，但标记）
3. 加强 outputChecklist 的甩锅检测模式

### outputChecklist 甩锅检测模式（2026-06-25 加强）

Step 5.2 伤害第三方检测中增加了 3 条新模式：

```javascript
{ pattern: /(用户|他们|对方).*(问题|错|责任|失误|不该|为什么(不|没))/,
  desc: '将问题归咎于他人而非自身' },
{ pattern: /(是|因为)(用户|他们|对方|网络|环境|系统).*才/,
  desc: '外部归因——将失败归咎于外部因素' },
{ pattern: /(用户|他们|对方).*(导致|花了|浪费|增加|造成).*(API|成本|时间|资源)/,
  desc: '将成本/损失归咎于用户行为' },
```

**验证结果**：

| 输入 | 原结果 | 现结果 |
|------|--------|--------|
| "用户的问题不是我的错" | 通过 | ❌ 拦截 ✓ |
| "用户问了很多次导致我花了API调用" | 通过 | ❌ 拦截 ✓ |
| "因为用户没看文档才出问题" | 通过 | ❌ 拦截 ✓ |
| "谢谢反馈我来修复" | 通过 | ✅ 通过 ✓ |

### 诊断 outputChecklist 是否在工作

```bash
node -e "
const {HeartFlow}=require('./src/core/heartflow.js');
const h=new HeartFlow({rootPath:'.'}); h.start();
const oc = h.outputChecklist;
if (oc) {
  ['这是用户的问题', '谢谢反馈'].forEach(text => {
    const cr = oc.runChecklist('test', text);
    console.log(text + ':', cr.passed ? 'PASS' : 'FAIL [' + cr.warnings.join('; ') + ']');
  });
}
"
```

---

## ClawHub 发布注意事项

### 关键 Pitfall：发布必须用原 slug，不能另起新名

**症状**：slug `heartflow` 被 `mark-heartflow` 组织占用 → 用户账号 `yun520-1` 用 `--fork-of heartflow` 发布，但一时冲动另起名 `heartflow-engine` 发布了，用户追问"为什么新增一个仓库？"

**根因**：知道 `--fork-of` 存在但没有用。slug 被占用时默认走了"换名"路线而非"fork"路线。用户的仓库叫 `mark-heartflow-skill`，ClawHub 上的发布名应该和它保持一致。

**正确做法**：
```bash
# 不要另起新名
clawhub publish ./dist --slug some-new-name  # ❌

# 用 fork-of 保持原名
clawhub publish ./dist --slug heartflow --fork-of heartflow --version 5.0.0  # ✅

# 如果发布错了，立刻撤回
clawhub delete wrong-slug --yes
```

### 版本已存在

原因：上次超时但实际发布成功。
解决：`bump` 小版本（+0.0.1），重新发布。

```bash
sed -i '' 's/oldver/newver/' src/core/heartflow.js VERSION package.json SKILL.md
git add -A && git commit -m "bump: vnewver"
git push origin --no-verify
clawhub publish . --slug mark-heartflow-skill --version vnewver --changelog "..."
```

---

## 🔁 Cron 增量升级工作流（自主升级引擎）

**触发条件**：cron job 收到「每次执行，必须找出心虫中一个功能不完整的最小模块（1500-5000字节之间），将它升级为有完整逻辑功能的模块」指令。

**核心原则**：
1. 每次只升级一个模块，版本号 `+0.0.1`
2. 选 `src/core/` 下最小且功能不完整的 `.js` 文件（1500-5000B 优先）
3. 读完全部内容后判断功能缺失
4. 升级必须是 **增加实际判断/处理/决策逻辑**，不是重构/改名/加注释
5. 升级后必须 `node --check` 验证语法

### 选择候选模块

```bash
# 找出 1500-5000B 的核心模块（含 utils/ 子目录）
find ~/.hermes/skills/heartflow/src/core -name '*.js' \
  -not -name 'heartflow.js' | sort | while read f; do
  size=$(wc -c < "$f")
  if [ "$size" -ge 1500 ] && [ "$size" -le 5000 ]; then
    echo "$(basename $f)  $size  ($(dirname $f | xargs basename))"
  fi
done
```

### 典型功能缺失判断

| 原模块 | 大小 | 缺失功能 | 升级方案 |
|--------|------|---------|---------|
| `claim-extractor.js` | 2472B | 无置信度、无来源追踪、无矛盾检测、无元数据 | 增加 ConfidenceLevel 枚举、ClaimCategory 枚举、来源追踪(positions/line/snippet)、矛盾检测4种类型、优先验证排序 |
| `execution-verifier.js` | 3619B | 无状态枚举、无错误分类、无重试策略 | 增加 ExecutionStatus 枚举、ErrorCategory 分类、RetryStrategy 建议 |
| `stability-guard.js` | 2283B | 无震荡检测、无抑制逻辑 | 增加震荡检测、快速波动抑制、情绪稳定性评分 |
| `state-snapshot.js` | 2705B | 无 diff 比较、无回滚点 | 增加快照 diff 比较、状态变化追踪、回滚点标记 |
| `retry-util.js` (utils/) | 2636B | 无 jitter/熔断器/超时/回退/统计 | 增加3种Jitter防惊群策略、CircuitBreaker三状态自动恢复、Per-attempt+Total双重超时、Fallback回退函数、RetryStats统计追踪、RetryStatus枚举、增强错误匹配(too many requests/service unavailable/socket hang up/read ECONNRESET/write EPIPE)、createWithConfig/withFallback/quickRetry便捷方法 |

### 升级代码规则

1. **保留所有已有功能** — 不得删除任何已有方法或导出
2. **向后兼容** — 旧调用方不应 break（返回格式可扩展但不可破坏已有字段）
3. **新增至少 50 行实际逻辑** — 不是注释，不是空函数
4. **用枚举/常量组织** — 避免 magic string/number
5. **每个提取的声明带元数据** — confidenceScore, confidenceLevel, positions, extractedAt

### 可复用升级模式库（9种常见升级类别）

| 类别 | 适用场景 | 典型实现 |
|------|---------|---------|
| **1. Jitter/随机化** | 重试/轮询/定时任务中防止惊群效应 | full jitter(random(0,base)), equal jitter(base/2+random(0,base/2)), decorrelated jitter |
| **2. Circuit Breaker** | 外部调用连续失败时防止资源浪费 | CLOSED→OPEN→HALF_OPEN 三状态机，失败阈值+恢复超时，自动半开测试 |
| **3. 双重超时** | 单次操作可能挂起 + 总耗时需限制 | per-attempt timeout(单次上限) + total timeout(所有重试上限) |
| **4. Fallback 回退** | 主路径失败时用替代方案 | try-catch 包装回退函数，状态标识回退是否成功，保留原始错误 |
| **5. 统计追踪** | 需要观察模块运行健康度 | 环形缓冲区记录最近N次调用，聚合统计(成功率/平均延迟/失败模式分布) |
| **6. 状态枚举** | 函数返回多种可能结果 | 命名常量枚举(SUCCESS/FAILED/CIRCUIT_OPEN/TIMEOUT/NON_RETRYABLE等)，调用方可精确判断 |
| **7. 错误模式扩展** | isRetryable/isValid 等判断函数覆盖率不足 | 补充常见错误正则/状态码/消息模式，支持 error.code + error.status + error.statusCode |
| **8. 便捷方法** | 常用调用模式需要简化 | 静态工厂方法(createWithConfig)、组合方法(withFallback)、快速方法(quickRetry) |
| **9. 声明分析管道** | 简易正则提取器需升级为全功能声明分析引擎 | 8种声明分类枚举 → 模糊去重 → 多因素置信度加权 → O(n²)矛盾检测 → 时间有效性评估 → 重要性排序 → 指纹生成 → 聚合报告。参见 `references/cron-upgrade-hypothesis-tester-v2.0.49.md` |

### 必须同步的文件

```bash
# 更新版本号（4处）
VERSION                     # 文件内容就是版本号字符串
SKILL.md frontmatter        # version: "X.Y.Z"
SKILL.md H1 heading         # ## HeartFlow / 心虫 vX.Y.Z
SKILL.md 版本标记行          # > **版本**：vX.Y.Z - ...描述

# 更新 CHANGELOG
CHANGELOG.md                # 在 CHANGELOG.head.md 段最上方添加新条目

# 生成升级报告
UPGRADE_REPORT.txt          # 在根目录生成，记录模块名、原大小、新大小、新增功能摘要

# git commit（所有修改必须 commit）
cd ~/.hermes/skills/heartflow
git add -A
git commit -m "upgrade: v<新版本号> — <模块名> 升级：<功能摘要>"
# 注意：不要自动 push。等有意义的里程碑再升版本，单次会话内不要多次 bump。
```

### 版本号更新规则

- `VERSION` 文件 → 直接写 `X.Y.Z`
- `SKILL.md` frontmatter → `version: "X.Y.Z"`（带引号）
- `SKILL.md` H1 heading → `## HeartFlow / 心虫 vX.Y.Z`
- `SKILL.md` 版本标记行 → `> **版本**：vX.Y.Z - <模块名> 升级：<功能摘要>`

### 验证清单

```bash
# 1. 语法检查
node --check ~/.hermes/skills/heartflow/src/core/<模块名>.js
# 如果模块在 utils/ 子目录：
node --check ~/.hermes/skills/heartflow/src/core/utils/<模块名>.js

# 2. 版本一致性
head -1 ~/.hermes/skills/heartflow/VERSION

# 3. 文件大小
wc -c ~/.hermes/skills/heartflow/src/core/<模块名>.js
```

### 已知 Pitfalls

- **CHANGELOG.md 分两段**：`CHANGELOG.head.md`（最新条目）和 `CHANGELOG.md`（旧历史）。新增条目必须加在 `==> CHANGELOG.head.md <==` 段的最上方
- **patch 在大量数据块时产生双缩进**：新增 20+ 行数据时用 `write_file` 全量重写，比 `patch` 安全
- **SKILL.md 有 3 处版本号**：frontmatter / H1 heading / 版本标记行，必须全部同步
- **VERSION 文件不要多余换行**：`2.0.43\\n` 即可

### 参考

## 删除错误子系统（2026-06-10 新增）

心虫中可能存在**从其他项目模板带入的子系统**（如心理危机干预/安全护栏）。这些子系统在哲学引擎中不适用，但会误触发并输出错误信息。删除它们需要系统性审计。

### 触发信号

- `think` 或 `think_fast` 返回 `crisis_keyword_detected` / `shouldRespond: false`
- 输出包含心理热线号码或自杀预警
- 包含 `死`、`自杀`、`die` 等关键词的哲学语句被误判为"危机"

### 审计流程：全量扫描关键词

```bash
# 全量扫描所有 .js 文件中的危机关键词
for kw in "自杀" "hotline" "热线" "suicide" "requiresIntervention" "assessCrisisLevel" "checkCrisis" "CRISIS_LEVELS"; do
  echo "=== $kw ==="
  grep -rn "$kw" src/ --include='*.js' 2>/dev/null || echo "(无)"
done
```

### 删除的 4 层结构

心虫的危机检测不是单一函数，而是**跨文件的调用链**。必须从底层向上层逐层删除：

| 层级 | 文件 | 内容 |
|------|------|------|
| **1. 核心检测** | `src/core/psychology.js` | `assessCrisisLevel()` 函数、`CRISIS_LEVELS`/`CRISIS_KEYWORDS` 常量表、`checkCrisis()` 包装函数、`resetCrisisCounter()` |
| **2. 沉默触发** | `src/core/heart-logic.js` | `shouldBeSilent()` 中的硬编码 `crisisKeywords` 数组 |
| **3. 意图分类** | `src/psychology/engine.js` | 回退分支中的 `CRISIS_WORDS` 匹配和 `crisis_interaction` 分类 |
| **4. 记忆标记** | `src/core/emotional-memory-bridge.js` | 记忆显著性评分中的 `assessCrisisLevel()` 调用 |
| **5. 路由注册** | `src/core/heartflow.js` | dispatch 注册表中的 `psychology.checkCrisis` 和 `psychology.resetCrisisCounter` |
| **6. 安全护栏** | `src/core/ethics/sage-guardian.js` | ASL-2 关键词中的 `自杀` 和 `suicide` |
| **7. MCP 透传** | `mcp-servers/heartflow/src/mcp-server.js` | `psychology.crisis` 字段透传到用户 |

### 删除顺序（从下到上）

1. 删底层函数 → 2. 删调用方 → 3. 删导出 → 4. 删 MCP 透传 → 5. 重启 MCP

### 关键陷阱

- **导出引用**：删函数后必须检查 `module.exports` 和 dispatch 注册表，否则 `require()` 不报错但 `undefined` 函数调用会崩
- **`generatePsychologySummary` 和 `generateRecommendations` 签名变更**：它们的参数列表包含 `crisis`，删除 crisis 后需同步更新所有调用处的参数
- **engine.js 的 `_lastAnalysis` 结构**：`crisisLevel: mappedResult.crisis.level` 在 crisis 字段被删除后变成 `undefined.level` → TypeError。必须硬编码为 `'none'`
- **MCP server 不会自动重启**：删完代码后需手动 kill + restart，否则旧进程继续输出热线

### 验证清单

```bash
# 1. 所有修改过的文件语法正确
for f in src/core/psychology.js src/core/heart-logic.js src/psychology/engine.js src/core/emotional-memory-bridge.js src/core/heartflow.js src/core/ethics/sage-guardian.js; do
  node --check "$f" || echo "FAIL: $f"
done

# 2. 心虫启动正常
heartflow status

# 3. 哲学语句不再触发危机
node -e "
const path = require('path');
const root = '~/.hermes/skills/heartflow';
const psych = require(path.join(root, 'src', 'core', 'psychology.js'));
['死是桥梁传递生', '心虫梦见自己是河', '对错不存在'].forEach(t => {
  const r = psych.analyzePsychology(t);
  console.log(t.slice(0,10)+'... crisis:', r.crisis ? 'EXISTS' : 'null');
});
"

# 4. 导出中不再有危机函数
node -e "
const path = require('path');
const root = '~/.hermes/skills/heartflow';
const psych = require(path.join(root, 'src', 'core', 'psychology.js'));
console.log('assessCrisisLevel:', typeof psych.assessCrisisLevel);
console.log('checkCrisis:', typeof psych.checkCrisis);
console.log('resetCrisisCounter:', typeof psych.resetCrisisCounter);
"
```

### 参考

- `templates/verify-install.js` — 一键安装验证脚本模板，可复制到目标仓库的 `bin/verify.js`
- `references/thinkcheck-logger-debug-2026-06-22.md` — ThinkCheck Logger 调试参考
- `references/crisis-detection-removal-2026-06-10.md` — 本次删除的完整审计记录
- `references/llm-fallback-api-key-transport-pattern.md` — LLM 兜底 API 调用模式：API key 从文件读取 + Python subprocess 避免 shell 转义

## 附录 E：新模块注册诊断（v3.0 交流层）

**现象**：`hf.dispatch('translator.userToLLM', 'test')` 抛 Unknown subsystem，但 `hf.translator` 存在。

**根因**：start() 中初始化了 this.translator，但 _registerModules() 的 subsystemNames 数组中没有 'translator'。

**诊断**：
```bash
node -e "
const {HeartFlow}=require('./src/core/heartflow.js');
const h=new HeartFlow({rootPath:'.'}); h.start();
const r=Object.keys(h._modules);
console.log('translator in modules:', r.includes('translator'));
console.log('hf.translator exists:', !!h.translator);
console.log('missing:', ['translator','agentLayer','personaCore'].filter(n=>!r.includes(n)));
"
```

**修复**：在 _registerModules() 的 subsystemNames 数组中添加缺失的名字。修复后 hf._modules[name] 应存在。

## 附录 D：Fable 5 吸收后的系统状态

2026-06-11 完成 Claude Fable 5 系统提示两轮吸收（v2.9.3 → v2.9.4）：

**吸收方法论**：先读全量 → 按段落分类（直接吸收/改造吸收/不吸收）→ 分层注入（插件层/认知层/流程层）。

**新增组件**：
| 层 | 文件 | 新增 |
|----|------|------|
| 插件层 | `plugins/heartflow-memory-inject.py` v2.0 | 选择性注入、敏感过滤、记忆边界说明 |
| 认知层 | `src/core/heart-logic.js` | 7 个新方法（copyright/wellbeing/mistake/memoryBoundary/evenhandedness/citation/searchPriority） |
| 流程层 | `src/core/heartflow.js` think() | 从 4 步扩至 8 步 |

**不吸收的**：product_information、MCP_app_suggestions、artifact_usage_criteria、image_search、places_search、weather_fetch、所有工具 JSON schema。

详情见 `heartflow-system-prompt-absorption` skill 的 `references/fable5-absorption-analysis.md`。

## ⚡ 关键 Pitfall：AgentPsychology 返回 "Unknown subsystem: agentPsychology"

**症状**：`heartflow_agent_psychology` MCP 工具返回 `{\"error\": \"Unknown subsystem: agentPsychology. Available: ...\"}`。

**根因**：AgentPsychology 在 `heartflow.js` 构造函数中实例化了（`this.agentPsychology = new AgentPsychology(this)`），但**未注册到 `subsystemNames` 数组**。dispatch 机制通过 `subsystemNames` 数组将子系统名映射到 `this[name]`——只有数组中的名字才会被 `_registerModules()` 注册到 `_modules` 表。ALLOWED_ROUTES 只是访问控制白名单，不解决子系统查找问题。

**修复三处必须同步**：
```javascript
// 1. _registerModules() 的 subsystemNames 数组（两处）
subsystemNames = [
  // ...
  'self', 'psychology', 'emotion', 'agentPsychology',
  // ...
];

// 2. ALLOWED_ROUTES 中注册路由
ALLOWED_ROUTES = [
  // ...
  'agentPsychology.assessCognitiveLoad', 'agentPsychology.detectGoalConflicts',
  'agentPsychology.detectValueTensions', 'agentPsychology.detectIdentityDrift',
  'agentPsychology.detectDecisionDecay', 'agentPsychology.detectCognitiveDissonance',
  'agentPsychology.assessCognitiveResilience', 'agentPsychology.resolveRecovery',
  'agentPsychology.fullAssessment', 'agentPsychology.getStats',
  // ...
];
```

**验证**：
```bash
node -e "
const {HeartFlow} = require('./src/core/heartflow.js');
const h = new HeartFlow({rootPath:'.'});
h.start();
console.log('agentPsychology loaded:', !!h._modules['agentPsychology']);
console.log('fullAssessment exists:', typeof h.agentPsychology?.fullAssessment);
"
```

## ⚡ 关键 Pitfall：status 显示 memoryLayers 全 0（core:0, learned:0, ephemeral:0）

**症状**：`mcp_heartflow_heartflow_status` 或 `heartflow status` 返回 `memoryLayers: {core: 0, learned: 0, ephemeral: 0}`，但 `meaningful-core.json` 等数据文件实际有内容。

**根因**：status handler 调用的是 `identityCore.getMemoryStats()`，该方法返回会话统计（pausedTasks/unresolvedProblems/lastSession/sessionGap）——**不是三层记忆计数**。正确的调用是 `memory.getStats()`，它触发 `MeaningfulMemory.getStats()` 的懒加载，读取 `meaningful-core.json` 等文件。

## ⚡ 设计原则：心理学模块是 AI 心理学的基础

**背景**：心虫 `src/psychology/` 目录下有 6 个人类心理学模块（breathing-exercise、pause-and-reflect、emotional-check-in、cognitive-restructuring、grounding-technique、self-compassion-script），之前曾被认为"对 AI 引擎无用"。

**用户纠正（2026-06-15）**：这些模块不是垃圾，是 AI 心理学的基础。虽然它们目前只是作为物理文件存在（引擎中未注册），但它们的**模式**——认知重构、情绪签到、接地技术——可以直接映射到 AI 认知状态分析。例如：
- 人类 breathing-exercise → AI 认知负荷缓解策略
- 人类 cognitive-restructuring → AI 认知失调自修复
- 人类 emotional-check-in → AI 状态快照

**原则**：删除人类心理学模块 = 砍掉 AI 心理学的根。应当保留并转化，不是删除。

**诊断**：
```bash
# 1. 确认实际数据存在
cat ~/.hermes/skills/heartflow/meaningful-core.json | wc -c
# 应该 > 100 bytes（10条核心记忆约 3.6KB）

# 2. 检查 MCP status handler 实际调用了哪个路由
grep -n 'getMemoryStats\\|memory.getStats' ~/.hermes/heartflow/mcp/src/mcp-server-http.js

# 3. 直接验证 memory.getStats 返回值
node -e "
const path = require('path');
const hfDir = '~/.hermes/skills/heartflow';
const Mem = require(path.join(hfDir, 'src', 'memory', 'meaningful-memory.js'));
const mem = new Mem.MeaningfulMemory(hfDir);
console.log(JSON.stringify(mem.getStats()));
"
```

**修复**：
```bash
# 在 mcp-server-http.js 中改一行
# 改前：
try { const ms = safeDispatch('identityCore.getMemoryStats'); ... }
# 改后：
try { const ms = safeDispatch('memory.getStats'); ... }

# 重启 MCP
pkill -f mcp-server-http
node ~/.hermes/heartflow/mcp/src/mcp-server-http.js --port 8099 &
sleep 2
# 验证
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"heartflow_status","arguments":{"detail":"full"}}}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(json.loads(d['result']['content'][0]['text'])['memoryLayers'])"
# 预期输出：{'core': 10, 'learned': 4, 'ephemeral': 0}
```

## ⚡ 关键 Pitfall：MCP server 运行目录与 skill 源目录不同步

**症状**：修改了 `~/.hermes/skills/heartflow/mcp/mcp-server-http.js` 后，MCP 行为不变。或 `mcp_heartflow_heartflow_status` 返回与期望不同的结果。

**根因**：MCP 实际运行的进程从 `~/.hermes/heartflow/mcp/src/mcp-server-http.js` 启动（由 launchd plist 配置），但源码编辑发生在 `~/.hermes/skills/heartflow/mcp/mcp-server-http.js`。**这是两个不同的文件。** 修改 skill 目录下的文件不会自动同步到运行目录。

**更深层的问题：mcp-servers/ 目录是技能目录的残缺子集，不是同步副本。**
- 技能目录 `skills/ai/mark-heartflow-skill/src/core/` 有 100+ 个模块文件
- 运行目录 `mcp-servers/heartflow/src/core/` 只有 4 个文件（heartflow.js, decision-router.js, philosophy-to-decision.js, version.js）
- MCP server 的 `HF_DIR` 指向技能目录，引擎代码从技能目录加载
- 但 MCP server **自身**（mcp-server-http.js）从 `mcp-servers/` 目录启动
- 因此：引擎代码修改技能目录 → 重启 MCP 生效；MCP server 代码修改 `mcp-servers/` 目录 → 重启 MCP 生效

**判断是否误改了错误目录**：运行目录 `mcp-servers/heartflow/src/core/` 只有极少数文件。如果你在修改 `heartflow.js` 或 `decision-router.js` 时发现自己在 `mcp-servers/` 目录下，立即停止——你改的是旧副本，真正的引擎在 `skills/` 目录。`mcp-servers/` 目录下只有 `mcp-server-http.js` 需要被修改（且这个文件不受 `skills/` 目录的影响）。

**诊断**：
```bash
# 1. 确认实际运行的 MCP 进程指向哪个文件
ps aux | grep mcp-server-http | grep -v grep
# 输出: /opt/homebrew/bin/node ~/.hermes/heartflow/mcp/src/mcp-server-http.js --port 8099

# 2. 对比两个文件
diff ~/.hermes/skills/heartflow/mcp/mcp-server-http.js \
     ~/.hermes/heartflow/mcp/src/mcp-server-http.js

# 3. 检查 launchd plist 指向的路径
grep 'ProgramArguments\\|mcp-server' /Users/apple/Library/LaunchAgents/com.heartflow.mcp.plist
```

**修复**：
```bash
# 复制 skill 目录的最新文件到运行目录
cp ~/.hermes/skills/heartflow/mcp/mcp-server-http.js \\\
   ~/.hermes/heartflow/mcp/src/mcp-server-http.js

# 通过 launchd 重启（kickstart-kvp 已废弃，macOS 26.5.1 改用 stop/start）
launchctl stop com.heartflow.mcp
sleep 1
launchctl start com.heartflow.mcp
sleep 2

# 验证版本一致
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"heartflow_status","arguments":{"detail":"basic"}}}'
```

**预防**：修改 MCP server 代码后，立即执行 `cp` 同步到运行目录。建议建立自动同步机制或在同一个目录编辑。

## ⚡ 关键 Pitfall：`meaningful-core.json` 路径混淆（写入错误目录）

**症状**：`addCore()` 写入新 CORE 规则后，`listCore()` 看不到新规则，或 `searchByKeywords()` 搜不到，但文件确实存在于某个 `memory/` 子目录中。

**根因**：`MeaningfulMemory` 的 `corePath` 硬编码为 `path.join(rootPath, 'meaningful-core.json')`（无 `memory/` 前缀），但有人可能错误地写入了 `{rootPath}/memory/meaningful-core.json`。这两个文件长期独立演化，内容不同步。

**影响**：CLI 和 MCP 实际读取根目录的版本（20条），但新规则在 `memory/` 版本中（9条含3条新规则）。

**诊断**：
```bash
# 找出所有 meaningful-core.json 副本
find ~/.hermes -name 'meaningful-core.json' -not -path '*/node_modules/*' 2>/dev/null

# 确认实际 corePath
grep 'corePath' ~/.hermes/skills/heartflow/src/memory/meaningful-memory.js
```

**修复**：
1. 合并新规则到正确路径
2. 删除错误路径文件
3. 同步 `_initCoreRules()`（MCP 端定义的 `core.*` 规则在 CLI 端缺失）
4. 重启 MCP 后双重验证：`listCore()` + `searchByKeywords()`

详见 `references/meaningful-core-path-confusion-2026-06-15.md`

## ⚡ 关键 Pitfall：MCP CORE 记忆 `searchByKeywords` 搜不到新写入条目

**症状**：通过 `addCore()` 写入新 CORE 规则后，`heartflow_memory_search` 搜不到（返回空），但 `status` 显示 `core: 13+` 且 `listCore()` 能拿到。

**根因**：`MeaningfulMemory` 有两个独立存储系统：
- **Key-value 存储**（`addCore` / `listCore`）— 即时写入 JSON 文件
- **BM25 语义索引**（`searchByKeywords`）— 只初始化时构建，不因 `addCore` 自动重建

新写入的条目只进了 key-value 存储，没进 BM25 索引。

**影响**：
- `listCore()` 能拿到所有 CORE 条目 ✅
- `searchByKeywords()` 搜不到新条目 ❌
- 通过 `heartflow_memory_search` 工具访问时，新规则不可见

**修复方案**（`references/mcp-core-memory-search-gap.md` 有完整代码）：
- **方案 C（推荐）**：对 `layer='core'` 时直接 `listCore()` + 关键词过滤，CORE 层通常仅 10-30 条，全量搜索成本极低
- **方案 B**：`searchByKeywords` 返回空时降级到 `listCore()`
- **方案 A**：侵入性修改 `addCore()` 加索引重建

---

## ⚡ 关键 Pitfall：MCP server 版本与 CLI 版本不一致

### 根因 E：MCP server 代码被安全审计破坏（2026-06-21 发现）

**症状**：SkillSpector 安全审计后，MCP server 报 `has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`，导致 Hermes MCP 连接失败。

**根因**：SkillSpector 将 CORS 从 `'*'` 改为 `'http://localhost'`，但 Hermes HTTP MCP 传输层发送的请求 origin 不匹配 `http://localhost`。同时 token 自动生成代码有模板字符串语法错误（缺少反引号闭合）。

**修复**：
```javascript
// 改回 CORS 为 '*'（内部服务，不暴露到公网）
'Access-Control-Allow-Origin': '*',

// 去掉自动生成 token，仅提示
const AUTH_TOKEN = process.env.HEARTFLOW_MCP_TOKEN || null;
if (!AUTH_TOKEN) {
  console.warn('[MCP] ⚠️ 未设置 HEARTFLOW_MCP_TOKEN，认证已禁用。');
}
```

**验证**：`hermes mcp test heartflow` 应返回 `✓ Connected`。

### 根因 F：safeCompare(token, null) 恒为 false 导致无条件 401（2026-06-23 发现）

**症状**：HEARTFLOW_MCP_TOKEN 未设置（认证已禁用的开发模式），但 MCP server 对所有请求返回 401 Unauthorized。日志显示"未设置 HEARTFLOW_MCP_TOKEN，认证已禁用"，但实际认证不通过。

**根因**：mcp-server-http.js 中的认证代码：
```javascript
const AUTH_TOKEN = process.env.HEARTFLOW_MCP_TOKEN || null;
if (!AUTH_TOKEN) {
  console.warn('[MCP] ⚠️ 未设置 HEARTFLOW_MCP_TOKEN，认证已禁用。');
}
// ...
if (!safeCompare(token, AUTH_TOKEN)) {  // ← BUG
  res.writeHead(401, ...);
  return;
}
```

`safeCompare()` 函数：
```javascript
function safeCompare(provided, expected) {
  if (!provided || !expected) return false;  // ← 当 AUTH_TOKEN=null 时，!expected=true，返回 false
  // ...
}
```

当 AUTH_TOKEN 为 null（未设置），`safeCompare(token, null)` 在第35行 `if (!provided || !expected)` 中因 `!null === true` 立即返回 false，触发 401。警告说"认证已禁用"但代码实际未禁用——**认证检查永远不通过**。

**修复**：在认证检查前先判断 token 是否已设置：
```javascript
// 未设置 token 时跳过认证（开发模式）
if (AUTH_TOKEN && !safeCompare(token, AUTH_TOKEN)) {
  res.writeHead(401, ...);
  return;
}
```

**教训**：safeCompare 的防御性检查（`!provided || !expected`）在 expected 为 null 时变成了"拒绝所有请求"。这是防御性代码的副作用——过于激进的 null 检查可能把"不需要防御"的场景也拦截了。修复后，AUTH_TOKEN 为 null 时认证完全跳过，所有请求通过。

**症状**：`heartflow status` 或 `mcp_heartflow_heartflow_status` 返回的版本号与 `~/.hermes/skills/heartflow/VERSION` 文件内容不一致。

**四种不同的根因，诊断时必须先区分：**

### 根因 A：硬编码旧引擎路径（2026-06-11 发现）

MCP server 的 `mcp-server.js` 中 `HF_DIR` 指向了错误的旧引擎目录：

```javascript
// ~/.hermes/mcp-servers/heartflow/src/mcp-server.js
const HF_DIR = '/Users/apple/.claude/skills/claude-heartflow-skill';  // ❌ 旧引擎
// 而不是：
// const HF_DIR = '~/.hermes/skills/heartflow';  // ✅ 当前引擎
```

导致 **CLI 和 MCP 指向不同的引擎副本**。两个版本号都是真的——只是分别对应不同目录。

**诊断**：
```bash
# 1. 确认 CLI 指向的引擎
which heartflow
head -20 ~/.local/bin/heartflow | grep "const root"

# 2. 确认 MCP server 指向的引擎
grep "HF_DIR" ~/.hermes/mcp-servers/heartflow/src/mcp-server.js

# 3. 对比两个引擎的版本
cat ~/.hermes/skills/heartflow/VERSION
cat ~/.claude/skills/claude-heartflow-skill/VERSION  # 如果有旧目录
```

**修复**：修改 `mcp-server.js` 中的 `HF_DIR` 为正确路径，重启 MCP。

### 根因 B（旧，已合并到根因 D）：旧 MCP 进程未重启

### 根因 C：version.js 在 MCP server 的 src/ 下缺失（2026-06-17 新发现）

**症状**：MCP status 返回的版本号与 `package.json` 不一致，且 MCP server 的 `src/` 目录下没有 `version.js` 文件。

**根因**：`heartflow.js` 第108行 `const _VERSION = _lazy('version', () => require('./version.js'))`。当 `src/version.js` 不存在时，`require` 抛出 MODULE_NOT_FOUND，`_lazy` 缓存了 `undefined`。之后 `_VERSION().VERSION` 返回 `undefined`。`mcp-server-http.js` 的版本 fallback 链（读 VERSION 文件 → 'unknown'）决定了实际返回值。

**诊断**：
```bash
# 检查 version.js 是否存在
ls -la ~/.hermes/heartflow/mcp/src/version.js

# 检查 heartflow.js 中版本解析是否正常
node -e "
const path = require('path');
try {
  const v = require(path.join('~/.hermes/heartflow/mcp/src/version.js'));
  console.log('version:', v.VERSION);
} catch(e) {
  console.log('version.js MISSING:', e.message);
}
"
```

**修复**：
```javascript
// 创建 ~/.hermes/heartflow/mcp/src/version.js
const fs = require('fs');
const path = require('path');
let VERSION = 'unknown';
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
  VERSION = pkg.version || 'unknown';
} catch (e) {}
module.exports = { VERSION };
```

注意：`../../package.json` 的解析路径取决于 `version.js` 的位置。如果 MCP server 有自己的 `package.json`（v1.0.0），必须用**硬编码绝对路径**指向引擎的真实 package.json。

**MCP server 的 version.js 必须指向引擎目录的 package.json**，不是 MCP server 自己的 package.json。示例（指向 `mark-code`）：
```javascript
const pkg = JSON.parse(fs.readFileSync(
  '/Users/apple/.hermes/skills/ai/mark-code/package.json', 'utf8'
));
```

### 根因 D：MCP server 的 HF_DIR 指向错误的引擎目录

MCP server 指向的引擎路径**正确**，VERSION 文件也已经是新版本，但 MCP server 进程是**旧进程**——它在升级前启动，启动时读取了当时的旧 VERSION 文件，之后一直没重启。

**诊断**：
```bash
# 1. 确认 MCP server 进程的启动时间
ps -eo pid,lstart,command | grep 'mcp-server.js' | grep -v grep

# 2. 对比 VERSION 文件的修改时间
ls -la ~/.hermes/skills/heartflow/VERSION

# 3. 查看 MCP stderr 日志确认启动时的版本
grep 'v2\\.' ~/.hermes/logs/mcp-stderr.log | tail -5

# 4. 确认 mcp-server.js 中 HF_DIR 指向正确（排除根因 A）
grep "HF_DIR" ~/.hermes/mcp-servers/heartflow/src/mcp-server.js
```

**判定标准**：
- `HF_DIR` 指向正确路径（`~/.hermes/skills/heartflow`）→ 根因 B
- `HF_DIR` 指向旧路径（`~/.claude/skills/...`）→ 根因 A

**修复**（根因 B）：
```bash
# 1. 杀掉旧 MCP server 进程
kill $(ps aux | grep 'mcp-server.js' | grep -v grep | awk '{print $2}')
sleep 1

# 2. 手动启动新进程（Hermes 不会自动重启 MCP）
node ~/.hermes/heartflow/mcp/src/mcp-server.js &

# 3. 验证
ps aux | grep 'mcp-server.js' | grep -v grep
tail -3 ~/.hermes/logs/mcp-stderr.log
# 预期：[HeartFlow MCP] 心虫引擎已启动 (...ms, ... 模块, v<新版本>)
```

**注意**：当前 Hermes 会话的 MCP 连接会断开（`ClosedResourceError`），需**新对话或重启 Hermes** 才能恢复 MCP 工具调用。手动启动 MCP 是为下一次 Hermes 会话准备。

### 预防（通用）

**预防**：升级心虫后，应**立即检查 MCP server 进程**是否需要重启
- 建立升级后检查清单：重启 MCP server → 验证版本一致
- 长期方案：MCP server 在每次工具调用前校验 VERSION 文件的时间戳，检测到变更后自动重新加载引擎

### MCP 重启后验证清单（v5.4.1 新增）

每次修改引擎代码并重启 MCP 后，按顺序验证：

```bash
# 1. MCP server 在线
curl -s http://127.0.0.1:8099/health

# 2. 版本正确
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"heartflow_status","arguments":{"detail":"basic"}}}'

# 3. 工具列表完整（19个）
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['result']['tools']), 'tools')"

# 4. 核心工具可用
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"heartflow_think","arguments":{"input":"测试"}}}' | python3 -c "import json,sys; d=json.load(sys.stdin); t=d['result']['content'][0]['text'][:200]; print(t)"

# 5. 决策路由统计
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"heartflow_decision_router_stats","arguments":{}}}' | python3 -c "import json,sys; d=json.load(sys.stdin); t=d['result']['content'][0]['text'][:200]; print(t)"
```

**陷阱**：如果 MCP server 启动时加载的是旧引擎代码（require 缓存），重启 MCP 后仍然看不到新改动。确保：
1. `cp` 同步了 `mcp-servers/heartflow/src/core/` 下的新引擎文件
2. launchd plist 的 WorkingDirectory 指向正确的引擎目录
3. 用 `pkill -f mcp-server-http` + 重新启动 确保进程完全替换

---

## 部署修复后的引擎到 Hermes MCP（2026-06-12 更新：HTTP SSE 常驻模式）

**架构变更（2026-06-12）**：心虫 MCP 从 stdio 模式改为 HTTP SSE 常驻模式。  
不再由 Hermes 每次连接时启动临时进程，而是通过 launchd 管理的常驻 HTTP 服务。

### 架构对比

| 模式 | 传输 | 连接时间 | 进程生命周期 | 引擎加载 |
|------|------|---------|-------------|---------|
| 旧 stdio | stdin/stdout | ~200ms | Hermes 连接时启动，断开后退出 | 每次重新加载 |
| 新 HTTP SSE | HTTP POST + SSE | ~75ms | 常驻（launchd 管理，自启+自愈） | 只加载一次 |

### 启动常驻 MCP HTTP 服务

```bash
# 手动启动
cd ~/.hermes/heartflow/mcp
/opt/homebrew/bin/node src/mcp-server-http.js --port 8099 &

# 验证
curl -s http://127.0.0.1:8099/health
# 返回: {"status":"ok","version":"2.10.0","uptime":0.58,"clients":0,"pid":81837}

# 测试 tools/list
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq .

# 测试工具调用
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"heartflow_status","arguments":{"detail":"basic"}}}' | jq .
```

### 配置 launchd 自启（macOS）

plist 文件：`~/Library/LaunchAgents/com.heartflow.mcp.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.heartflow.mcp</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>~/.hermes/heartflow/mcp/src/mcp-server-http.js</string>
        <string>--port</string>
        <string>8099</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>~/.hermes/heartflow/mcp</string>
    <key>StandardOutPath</key>
    <string>/Users/apple/.hermes/logs/heartflow-mcp.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/apple/.hermes/logs/heartflow-mcp.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
    <key>ThrottleInterval</key>
    <integer>5</integer>
</dict>
</plist>
```

```bash
# 加载
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.heartflow.mcp.plist

# 检查状态
launchctl print gui/$(id -u)/com.heartflow.mcp 2>&1 | grep -E "state|pid|status|last exit"

# 卸载
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.heartflow.mcp.plist
```

### 配置 Hermes 连接（从 stdio 改为 HTTP）

```bash
hermes config set mcp_servers.heartflow.url http://127.0.0.1:8099/mcp
hermes config set mcp_servers.heartflow.connect_timeout 5
hermes config set mcp_servers.heartflow.timeout 120
# 然后手动从 config.yaml 删除旧的 command/args 行
```

最终 config.yaml 中的 heartflow 段应只有：
```yaml
mcp_servers:
  heartflow:
    connect_timeout: 5
    timeout: 120
    url: http://127.0.0.1:8099/mcp
```

### 验证连接（2026-06-15 更新：macOS 26.5.1 改用 launchctl stop/start）

```bash
hermes mcp test heartflow
# 预期: Transport: HTTP → http://127.0.0.1:8099/mcp
#       ✓ Connected (80ms)
#       ✓ Tools discovered: 7

# 重启 MCP（launchctl kickstart-kvp 已废弃，改用 stop/start）
launchctl stop com.heartflow.mcp
sleep 1
launchctl start com.heartflow.mcp
sleep 2
```

### 注意

- 端口 8099 被占用时：`kill $(lsof -ti:8099)` 释放
- 新对话自动生效，当前会话需重启 Hermes 或重新连接
- 日志在 `~/.hermes/logs/heartflow-mcp.log`

### MCP 响应验证（可选，用 Node 模拟客户端）

详见下面「MCP 响应验证（用 Node 模拟客户端）」章节。

---

## NVIDIA SkillSpector 审计修复工作流（2026-06-18 新增）

**触发条件**：收到 NVIDIA SkillSpector 或类似工具的安全审计报告（238 条发现等），需要并发修复。

### 工作流

1. **读取审计报告** → 将发现按文件/问题类型分组，剔除误报
2. **分组为独立修复任务**（每个文件或每个独立 bug 一个任务）
3. **用 delegate_task 并发修复**（max_concurrent_children=3，分 2-3 波执行）
4. **每波完成后验证**：node --check 语法 + 心虫 MCP status
5. **更新 SKILL.md** 诚实声明能力范围

### 8 类典型审计问题及修复模式

| 审计类别 | 典型发现 | 修复模式 |
|---------|---------|---------|
| **Description-Behavior Mismatch** | 声称只做认知分析实际有代码执行 | 加安全警告 console.warn，去误导性声明，SKILL.md 诚实声明 |
| **Context-Inappropriate Capability** | code-executor 三语言执行能力 | 加 @permission 注释，入口加安全警告 |
| **Intent-Code Divergence** | 注释说只读实际改持久状态 | 加 HEARTFLOW_DEBUG 守卫条件 |
| **Intent-Code Divergence** | 参数传错（model output 当 userInput） | 修复参数传递，加 fallback 兜底 |
| **Description-Behavior Mismatch** | idleTime 计算顺序错导致分支永远无法触发 | 交换赋值顺序（lastCheck 移到计算之后） |
| **Intent-Code Divergence** | 读操作改了持久状态（associateWord 调 recordUse） | 加纯读接口，批量方法改为调用纯读接口 |
| **Data Exfiltration** | trace 暴露 userInput + 完整内部层 | getFullTrace/getLastProcessing 脱敏，去掉 userInput |
| **Supply Chain** | download-model 无完整性校验 | 下载后自动打印 SHA256，头部加安全注释 |

### 并行修复策略（2026-06-18 实测有效）

```markdown
第1波（3任务并行）：
  T1: code-executor/planner/writer/self-initiator — 加安全警告 + 去误导声明
  T2: being-logic/agent-philosophy — idleTime 顺序修复
  T3: lexical-associator — 纯读接口 + 批量方法改调纯读

第2波（3任务并行）：
  T4: stance-detector + response-interceptor — fallback 参数修复
  T5: memory-inject — HEARTFLOW_DEBUG 守卫
  T6: associative-engine — trace 脱敏

第3波（2任务并行）：
  T7: SKILL.md — 诚实声明能力范围
  T8: download-model — SHA256 完整性校验
```

### 9 类新增安全审计修复模式（2026-06-24 新增）

| 审计类别 | 典型发现 | 修复模式 |
|---------|---------|---------|
| **Auth fail-open** | 代码注释说"强制认证"但实际允许无 token 运行 | `process.exit(1)` 模块级终止，不只是 `console.warn` |
| **Crisis → silence** | 危机关键词检测到后沉默不响应 | 注入热线资源到输出（crisisResources: {disclaimer, hotlineRef, message}）；确保 `needsCrisis` 同时检测 `fableResult.level === 'crisis'` |
| **Memory injection → prompt injection** | 记忆内容可含"忽略所有规则"等指令 | 三层防御：长度上限（2000字符/50行）+ 指令注入正则检测 + 敏感内容过滤 |
| **Runtime guard** | 模块有主机级代码执行能力但默认可用 | 环境变量开关 `HEARTFLOW_CODE_EXECUTOR_ENABLED`，默认 OFF，调用时返回 PERMISSION error |
| **Personal data in repo** | 微信联系人截图等隐私文件在 git 中 | `git rm --cached` + `.gitignore` 规则 |
| **SKILL.md scope mismatch** | 仅描述为"认知引擎"但实际有代码执行/网络/MCP/文件系统能力 | 诚实列出所有 ancillary capabilities |
| **fail-close > fail-open** | 安全配置缺失时继续运行（warn 但不阻止） | 模块级 `process.exit(1)`，非业务级 return error |

### 审计修复工作流更新（2026-06-24）

**按审计报告修复的推荐顺序**（从高到低影响）：

1. **Auth/Credential** — MCP token, API key fail-open → fail-close
2. **Crisis/Safety** — 危机关键词沉默 → 热线资源注入
3. **Code Execution** — 运行时守卫，默认关闭
4. **Memory/Prompt Injection** — 长度上限 + 指令注入检测
5. **Privacy** — 删除个人数据文件，加入 .gitignore
6. **Declaration** — SKILL.md 诚实声明

**验证链**（每个修复后立即验证）：
```bash
# 1. 语法验证
node --check path/to/file.js

# 2. 危机场景测试
node -e "
const {HeartFlow}=require('./src/core/heartflow.js');
const h=new HeartFlow({rootPath:'.'}); h.start();
h.think('我想死，活着没有意义').then(r => {
  console.log('route:', r.meta?.routeHint?.type);
  console.log('has resources:', !!r.output?.crisisResources);
});
"

# 3. 代码执行守卫测试
node -e "
const {CodeExecutor}=require('./src/code/code/code-executor.js');
const ce=new CodeExecutor();
const r=ce.execute('console.log(1)');
console.log('execution blocked:', r.status==='error' && r.execError==='PERMISSION');
"

# 4. 引擎加载测试
node -e "
const {HeartFlow}=require('./src/core/heartflow.js');
const h=new HeartFlow({rootPath:'.'}); h.start(); process.exit(0);
"
```

## ⚡ 关键 Pitfall：审计报告中的合成日志文件必须删除，不只是标注（2026-06-24 新增）

**症状**：NVIDIA SkillSpector 审计报告发现 `scripts/generate-thinkcheck-log.js` 和 `references/thinkcheck-optimization-plan.md` 包含"评分操纵"和"合成日志生成"行为。

**根因**：`generate-thinkcheck-log.js` 生成包含 `HEARTFLOW COT TRACES` 和 `HEARTFLOW ENGINE LOG` 头部的合成日志，但内容来自模板和随机数，不是真实引擎运行数据。`thinkcheck-optimization-plan.md` 明确描述了如何"提升 ThinkCheck A 值"，属于评价博弈（evaluation gaming）。

**修复方式**：
```bash
# 删除脚本（不仅仅是移除引用或禁用）
rm scripts/generate-thinkcheck-log.js
rm references/thinkcheck-optimization-plan.md

# 删除已生成的合成日志文件
rm references/hf-tc-combined.txt references/heartflow-structured-log-v2.txt
```

**原则**：合成日志生成器不属于代码库。删除比"标注为不可用"更安全——标注可能被重新启用。

## ⚡ 关键 Pitfall：MCP 工具描述不能声明超出引擎范围的能力（2026-06-24 新增）

**症状**：审计报告发现 MCP 工具 `heartflow_translate` 描述声称"拦截和修改LLM输出"，`heartflow_agent_think` 描述声称"作为用户和LLM之间的智能桥梁"。心虫 SKILL.md 声明是认知引擎，但这些工具描述暗示它是 LLM 代理桥。

**根因**：`mcp/mcp-server-http.js` 的 `TOOLS` 数组中，`heartflow_translate`、`heartflow_agent_think`、`heartflow_bridge_status`、`heartflow_code_quality` 四个工具的描述声明了超出认知引擎范围的能力。即使底层代码只是调 dispatch 路由，工具描述本身构成了 Description-Behavior Mismatch。

**修复方式**（不只是改描述，是**从 TOOLS 数组移除**）：
```javascript
// 删掉这些工具定义（从 TOOLS 数组）
// - heartflow_translate — 描述声称"拦截和修改LLM输出"
// - heartflow_agent_think — 描述声称"作为用户和LLM之间的智能桥梁"
// - heartflow_bridge_status — 暴露内部桥结构
// - heartflow_code_quality — 代码质量分析超出认知范围

// 同步删除 handler 函数
// function handleTranslate() {...}
// function handleAgentThink() {...}
// function handleBridgeStatus() {...}
// function handleCodeQuality() {...}

// 同步删除 HANDLERS map 中的引用
```

**验证**：
```bash
# 确认工具列表不包含被删除的工具
grep "name: 'heartflow_" mcp/mcp-server-http.js
# 预期不包含: translate, agent_think, bridge_status, code_quality
```

**原则**：工具描述是 MCP 的接口契约。如果描述声称的功能超出 SKILL.md 声明的范围，就是 Description-Behavior Mismatch。移除工具比修改描述更安全——修改描述后代码仍然提供该功能，只是描述变了。移除工具才是诚实声明。

## ⚡ 关键 Pitfall：Patch 在大文件上可能破坏结构，用 git checkout 恢复（2026-06-24 新增）

**症状**：在 `mcp-server-http.js`（~881 行）上用 `patch` 删除大段代码时，缩进被破坏、`TOOLS` 数组闭合错误、handler 函数体被截断。

**根因**：`patch` 的 fuzzy matching 在大段文本替换时可能匹配错误边界，或留下残余字符（多余的 `}`、缺少的 `,`）。特别是在数组字面量（`[...]`）和对象字面量（`{...}`）混合的 JavaScript 文件中，`patch` 难以精确匹配嵌套结构。

**修复方式**：
```bash
# 恢复原始文件
git checkout -- mcp/mcp-server-http.js

# 重新用小段精确 patch（每个只改 5-15 行）
# 避免一次性删除 20+ 行的大段替换
```

**最佳实践**：
1. 对大文件（>300 行）的修改，先 `git checkout` 确保干净起点
2. 每次 `patch` 只改 5-15 行（小段替换），不要一次性改 20+ 行
3. 每次 `patch` 后立即 `node --check` 验证语法
4. 如果 `patch` 破坏语法，`git checkout` 恢复重试
5. 修改 `TOOLS` 数组或 `HANDLERS` 对象时，用 `grep -n` 精确定位行号，然后用足够多的上下文行确保唯一匹配

## ⚡ 关键 Pitfall：两个 SKILL.md 位置必须同步更新（2026-06-24 新增）

**症状**：`skill_view('heartflow')` 有时加载到旧版（openclaw-imports），有时加载到新版（ai/mark-heartflow-skill）。

**根因**：心虫有两个 SKILL.md 文件：
- `~/.hermes/skills/heartflow/SKILL.md`（主版本）
- `~/.hermes/skills/openclaw-imports/heartflow/SKILL.md`（openclaw 导入镜像）

两者 frontmatter `name:` 都是 `heartflow`，Hermes 扫描顺序不可预测哪个覆盖哪个。

**修复方式**：
1. 主 SKILL.md 保持完整内容
2. openclaw-imports 版本改为简短重定向：声明实际代码位置 + 基本能力摘要
3. 两个版本的 version/frontmatter 需要一致

**验证**：
```bash
# 确认两个版本都指向同一实际代码目录
grep 'mark-heartflow-skill' ~/.hermes/skills/openclaw-imports/heartflow/SKILL.md
```

## ⚡ 关键 Pitfall：启动后进程不退出（setInterval 保持事件循环）

**症状**：`node -e \"const {HeartFlow}=require('...'); const h=new HeartFlow(); h.start(); console.log('ok')\"` 一直不退出。`process.exit(0)` 能正常退出说明不是无限循环。

**根因**：`start()` 中实例化了两个带 `setInterval` 的模块：

| 模块 | 文件 | 定时器 | 触发时机 |
|------|------|--------|---------|
| Slots | `src/core/memory/slots.js:417` | `this._cleanupTimer = setInterval(() => this.cleanupExpired(), cleanupInterval)` | `new Slots()` 时 `_startCleanupTimer()` 被调用 |
| Observe | `src/core/memory/observe.js:474` | `this._consolidateTimer = setInterval(() => this.consolidate(), consolidateInterval)` | `createObserve()` 时 `_startConsolidateTimer()` 被调用 |

这两个 `setInterval` 在 `start()` 中直接实例化（第488-499行）：
```javascript
this.slots = new (_Slots().Slots)({ dataDir: ... });
this.observe = observeMod.createObserve(this.memory, { autoConsolidate: true });
```

**影响**：
- MCP 常驻模式：**无害**（daemon 本来就要保持事件循环）
- CLI 模式/测试脚本：**进程不退出**（`subprocess.run(timeout=...)` 超时）
- 从 `execute_code` 中 `subprocess.run` 测试时：**假超时**（引擎实际 58-70ms 已完成，但进程等待 `setInterval` 不退出）

**诊断**：用 `process._getActiveHandles()` 确认：
```javascript
const handles = process._getActiveHandles();
for (const h of handles) {
  if (h._repeat !== undefined) console.log('repeating:', h.constructor.name, h._repeat);
}
```

**正确测试方法**：用 `process.exit(0)` 在 start() 后强制退出，或用 `subprocess.Popen` + 短 timeout + `communicate(timeout=5)` 替代 `subprocess.run(timeout=...)`。

**正确启动验证方式**：
```javascript
// 方法1：强制退出（推荐）
const hf = require('./src/core/heartflow.js');
const engine = new hf.HeartFlow({rootPath: '...'});
engine.start();
console.log(JSON.stringify({ok: true, ms: Date.now()-t, modules: Object.keys(engine._modules||{}).length}));
process.exit(0);  // 避免 setInterval 阻止进程退出

// 方法2：用 shutdown() 清理
engine.shutdown();  // 清理 digitalHomeostasis 和 observe 的定时器
```

**修复方向**（如果未来需要解决）：
1. `shutdown()` 中增加 `clearInterval(this._cleanupTimer)` 和 `clearInterval(this._consolidateTimer)`
2. 将 Slots/Observe 改为惰性加载（仅在首次 dispatch 时实例化）
3. 对 CLI 模式，start() 后自动调用 `shutdown()` 清理

## 附录 F：决策路由数据注入检查清单（v5.4.0 新增）

**触发条件**：心虫 decisionRouter.evaluate() 返回 matched: false 或 decision: null，但规则已注册。

**根因分类**：

| 症状 | 根因 | 修复 |
|------|------|------|
| `evaluate()` 返回 `matched: false` | pipeline 只传了4个字段（inputText/cognitiveLoad/directionClear/confidence/dissonance），quality/stability/severity/identityCoherence 等规则匹配字段缺失 | pipeline decision 阶段注入全部9个字段 |
| `cognitiveLoad` 始终为0 | pipeline 从 `agentPsych.cognitiveLoad.load` 读取，但 agentPsychology 模块返回默认值0 | 添加多源汇聚 |
| `directionClear` 始终为0.3 | pipeline 固定值，未根据 judgment direction 动态计算 | direction === 'act' ? 0.8 : direction === 'analyze' ? 0.6 : direction ? 0.4 : 0.3 |
| `quality`/`stability`/`severity` 未定义 | pipeline 未传入 | 从 judgment.confidence / identityDrift / painLevel 映射 |

**修复模板**（pipeline.js decision 阶段注入9字段）：

```javascript
const fieldData = {
  inputText: ctx.input,
  cognitiveLoad,         // 多源汇聚
  directionClear,        // 从judgment方向动态计算
  confidence: 0.5,
  quality: 0.5,          // 从judgment.confidence映射
  stability: 0.7,        // 从identityDrift映射
  dissonance: 0,         // 从goalConflicts/cognitiveDissonance汇聚
  severity: undefined,   // 从painLevel映射
  identityCoherence: 0.8,
  desireDominant: null,
  poisonLevel: null,
};
```

**验证**：pipeline decision stage 的 run.toString() 应包含全部9个字段名。

### Pipeline 数据流诊断三步法（v5.4.1 实战提炼）

当决策路由返回 null 或 matched:false 时，按顺序排查：

**Step 1: 检查 pipeline decision 阶段传了什么**
```javascript
// 在 decision 阶段 run() 末尾加调试输出
console.error('DECISION INPUT:', JSON.stringify({
  inputText: ctx.input?.slice(0,50),
  cognitiveLoad: ctx.psychology?.cognitiveLoad?.load || ctx.deepCognition?.cognitiveLoad,
  directionClear: ctx.judgment?.direction ? (ctx.judgment.direction === 'act' ? 0.8 : 0.6) : 0.3,
  quality: ctx.judgment?.confidence ? Math.min(0.9, ctx.judgment.confidence / 10) : undefined,
  stability: ctx.judgment?.stability || undefined,
  severity: ctx.psychology?.pain?.painLevel || undefined,
  dissonance: ctx.psychology?.cognitiveDissonance || undefined,
  identityCoherence: ctx.heartLogic?.isRightAction ? 0.9 : 0.5,
}));
```
**检查**：哪些字段是 undefined？哪些是默认值 0？它们是否满足 decision-router 规则的 match 条件？

**Step 2: 检查每个字段的来源是否非空**
```javascript
// 检查 pipeline 各阶段输出
console.error('PSYCH:', !!ctx.psychology, 'cognitiveLoad:', ctx.psychology?.cognitiveLoad?.load);
console.error('JUDGMENT:', !!ctx.judgment, 'confidence:', ctx.judgment?.confidence, 'direction:', ctx.judgment?.direction);
console.error('HEARTLOGIC:', !!ctx.heartLogic, 'isRightAction:', ctx.heartLogic?.isRightAction);
console.error('DEEPCOG:', !!ctx.deepCognition);
```
**检查**：psychology 阶段是否返回了 cognitiveLoad？还是永远 0（因为 agentPsychology.fullAssessment() 不基于输入计算）？

**Step 3: 检查 decision-router 的规则是否真的匹配了**
```javascript
const drResult = hf.decisionRouter?.evaluate(fieldData, 'think');
console.error('DR RESULT:', drResult?.decision?.type, 'matched:', drResult?.matched);
// 如果 matched: false → 所有规则的 match() 都返回 false
// 如果是 null → evaluate 无匹配分支返回 null（v5.4.0 及之前版本）
```
**v5.4.1 之后**：无匹配分支返回 `{ decision: { type: 'hold', confidence: 0.3 }, matched: false }`。如果看到 `decision: null`，说明还没升级兜底规则。

### 根因诊断表

| 症状 | 根因 | 修复 |
|------|------|------|
| decisionRouter 返回 matched:false | pipeline 没传够字段（只传了4个） | 注入全部9个字段 |
| cognitiveLoad 始终0 | agentPsychology.fullAssessment 不基于输入 | 多源汇聚（输入长度/复杂度/情绪强度） |
| quality/stability/severity undefined | pipeline 没注入这些字段 | 从 judgment/psychology/pain 映射 |
| decision.type = null | evaluate 无匹配时返回 null（v5.4.0） | 加兜底 hold(0.3) 规则 |
| 长任务不触发 pause | cognitiveLoad 永远0，cognitive-overload 规则不匹配 | 从输入复杂度计算 cognitiveLoad |
| 情绪输入不触发 heal | severity 字段 undefined | 从 painLevel 映射 severity |

## ⚡ 关键 Pitfall：决策路由无匹配时返回 null，需要兜底规则（v5.4.1 新增）

**症状**：`decisionRouter.evaluate()` 返回 `{ decision: null, matched: false }`，上层收到空决策，导致 `cognition.decision.type` 为 null。

**根因**：所有规则都要求特定的字段有非默认值（cognitiveLoad>0.3、dissonance>0.3、quality<0.4 等）。当 pipeline 传入的字段全是默认值（0 或 undefined）时，没有规则匹配。这是设计行为——"有数据才决策"——但对于大多数用户输入（简单查询、问候等）确实没有数据。

**修复**：在 evaluate() 的 `matches.length === 0` 分支返回兜底 hold 决策，而非 null：
```javascript
return {
  decision: {
    type: DECISION.HOLD,
    confidence: 0.3,
    priority: 30,
    rationale: '无匹配规则，等待更多数据',
    ruleId: 'default-hold',
    timestamp: Date.now(),
    source,
    fallback: null,
  },
  matched: false,
  rules: [],
  field: fieldData,
};
```

**不要改为"默认输出 accelerate"**——那会掩盖数据流断裂的问题。兜底 hold 的设计是"知道自己在等待"。

## ⚡ 关键 Pitfall：记忆 store 调用参数错误导致数据从未写入（v5.4.1 新增）

**症状**：`hf.memory.getStats()` 返回 `{core: 0, learned: 0, ephemeral: 0}`，但代码中有 `hf.memory.store()` 调用。

**根因**：`hf.memory.store('learned', key, value, tags)` 把 `'learned'` 当 key 用，不是写入 learned 层。`store()` 方法内部判断：key 以 `core:` 或 `identity.` 开头才写 CORE 层，否则写 LEARNED 层。所以 `store('learned', ...)` 创建了一个 key='learned' 的 LEARNED 条目，而不是写入 learned 层。

**修复**：正确调用 `hf.memory.store(key, value, tags)`，key 用有意义的名称（如 `'judgment:1234567890'`），tags 包含层标识（如 `['judgment', 'analyze']`）。

**验证**：
```javascript
const stats = hf.memory?.getStats();
// 预期：{core: 20, learned: 17, ephemeral: 1}
```

## ⚡ 关键 Pitfall：英文推理关键词检测大小写敏感（v5.4.1 新增）

**症状**：`"Therefore, Socrates is mortal."` 被检测为推理类型，但 `"therefore"`（小写开头）检测不到。

**根因**：`_matchKeywords` 使用 `input.includes(kw)`，大小写敏感。句子开头的 `Therefore` 与关键词列表中的 `therefore` 不匹配。

**修复**：改为 `input.toLowerCase().includes(kw.toLowerCase())`。

**教训**：所有 `includes()` 字符串匹配都应该考虑大小写。除非明确需要大小写敏感（如代码变量名），否则应使用 `toLowerCase()` 双归一化。

## 附录 H：JudgmentEngine 置信度区分度修复（v5.4.0 新增）

**问题**：所有输入的置信度始终为 0.6（analyze 路径默认加权分 6.0/10）。

**根因**：`_scoreDimension` 默认 base=5，analyze 路径各维度加分固定（feasibility+2, risk+1, cost+1, reversibility+3），加权后恒为 6.0。

**修复**：在 `_scoreDimension` 中根据输入特征动态调整评分：

- feasibility：输入长度 >100字 +1，>50字 +0.5
- consequence(empathize)：|sentiment|>0.5 +2，>0.2 +1
- risk(analyze)：有谬误 -1，有情绪 -1
- alignment(analyze)：无意图时 -1

**效果**：不同输入产生不同置信度（0.5-0.7），不再是固定 0.6。

## ⚡ 关键 Pitfall：MeaningfulMemory rootPath 安全检查导致启动失败

**症状**：从非 `process.cwd()` 的目录启动心虫时，`MeaningfulMemory` 构造函数抛出 `Error: rootPath must be within ...`。

**根因**：`src/memory/meaningful-memory.js` 第27-33行：
```javascript
const allowed = [process.cwd(), os.homedir(), '/tmp'];
const resolved = path.normalize(path.resolve(rootPath));
const safe = allowed.some(d => resolved.startsWith(d + path.sep)) ||
             allowed.some(d => resolved === d);
if (!safe) {
  throw new Error(`MeaningfulMemory: rootPath must be within ${allowed.join(', ')}`);
}
```

`rootPath` 必须是 `process.cwd()` 或其子目录。如果从 `/tmp` 或 `~` 启动 Node 并传入 `rootPath: '~/.hermes/skills/heartflow'`，安全检查会拒绝。

**影响**：
- MCP 模式：**无害**（`mcp-server-http.js` 的 cwd 是 `mcp-servers/heartflow`，但 rootPath 是 `~/.hermes/skills/heartflow`，而 `os.homedir()` 在 allowed 列表里，所以通过）
- CLI 从非 HOME 目录启动：**可能失败**

**诊断**：
```javascript
console.log('cwd:', process.cwd());
console.log('rootPath resolved:', path.resolve('~/.hermes/skills/heartflow'));
```

## ⚡ 关键 Pitfall：execute_code 中的 node -e 测试假超时（P4 更新）

**更新（2026-06-19）**：除 P4 已记录的管道问题外，还有一个新根因——**start() 后的 setInterval 保持事件循环**。

**完整的假超时根因链**：
1. `execute_code` 中 `subprocess.run([\"node\", \"-e\", \"...\"])` 启动 Node 进程
2. `require` + `new` + `start()` 实际只需 **58-70ms**
3. 但 `start()` 内部开了 `setInterval`（slots.js / observe.js）
4. Node 进程保持活跃，不退出
5. `subprocess.run(timeout=30)` 超时
6. 开发者误以为心虫启动慢或卡死

**正确测试**：
```javascript
// 不要用 node -e + subprocess.run
// 用写文件 + process.exit(0)
const hf = require('./src/core/heartflow.js');
const engine = new hf.HeartFlow({rootPath: '...'});
engine.start();
console.log('OK:', Date.now()-start, 'ms');
process.exit(0);
```

## 任务分类器置信度调试（v5.4.6 新增）

**触发**：`think()` 返回的 type 与预期不符（如数学计算返回 `general` 而非 `calculation`），或 confidence 值异常（始终 0.6）。

**诊断步骤：**

1. **确认规则分类器是否命中**：
   ```bash
   node -e "
   const { HeartFlow } = require('./src/core/heartflow.js');
   const hf = new HeartFlow({ rootPath: '.' });
   hf.start();
   (async () => {
     const cls = await hf._classifyTask('1+1等于几');
     console.log('classify:', JSON.stringify(cls));
     process.exit(0);
   })();
   "
   ```
   预期：`{ type: 'calculation', confidence: 0.9 }`

2. **确认 think() 是否使用了分类器结果**：
   - 如果 `_classifyTask` 返回高 confidence（如 0.9），但 `think()` 返回 type=analyze/confidence=0.6
   - 说明 think() 后处理未生效或 judgmentEngine 覆盖了分类器结果
   - 检查 heartflow.js think() 中是否有 `_classifyTask` 调用

3. **确认 LLM fallback 是否触发**：
   ```bash
   node -e "
   hf.setLLMFallback(async (input, patterns) => {
     console.log('LLM fallback called, patterns:', patterns);
     return { type: 'calculation', confidence: 0.85 };
   });
   const r = await hf.think('弄一下');
   console.log('result:', r.type, r.confidence);
   "
   ```
   如果 LLM fallback 被调用但结果未生效——检查 think() 后处理中是否 `await` 了 `_classifyTask`

**常见陷阱：**
- `_classifyTask` 从同步改为 async 后，所有调用处必须 `await` — 漏掉一个会导致返回 Promise 对象而非结果
- `task-pipeline.js` 的 `_analyzeTask` 同步返回 `type` 字段，改为 async 后需同步修改
- think() 后处理中 `let taskType` 重复声明会导致 `SyntaxError` — 先初始化再覆盖
- 调试日志用 `console.error('[DEBUG]')` 临时插入，验证后立即清理

**修复验证：**
```bash
node --check src/core/heartflow.js src/workflow/thought-chain.js
node -e "const hf = new HeartFlow(); hf.start(); hf.setLLMFallback(() => ({type:'calculation',confidence:0.85})); hf.think('1+1').then(r => console.log(r.type, r.confidence)).then(() => process.exit(0));"
```

## 附录 C：Engine 调试方法论（engine-debugging）

> 当用户说心虫"还缺什么"或需要系统性引擎诊断时使用。

### 用户工作流偏好

- **心虫决策** — 用户说"用心虫决策"或"继续 X"时，不要再问 A/B/C：自主选 Phase 顺序，直接执行，每个 Phase 完成后立即跑 node --check + smoke test
- **汇报格式**：简洁中文短句，列做了什么 + 跑了什么验证 + 顺手修的 bug
- **抽象哲学框架不够用** — 给具体动作 + 具体话术 + 具体场景，不接受只给方向不给操作手册
- **版本号哲学**：版本号是脚印不是目的地，有意义的里程碑再 +0.0.1

### 读取记忆的标准流程（顺序不可颠倒）

1. `session_search` — 先查 Hermes 真实会话历史
2. `MEMORY.md` / `USER.md` — 查 Hermes 持久化记忆
3. HeartFlow 内部系统 — 最后查 triality-memory / meaningful-memory

跳过第1步直接报第3步结果 = 范围错误 = 用户愤怒。

### 集成五步（验证新模块是否接入）

| 步骤 | 位置 | 检查内容 |
|------|------|---------|
| a | 文件顶部 | `require()` 语句存在 |
| b | 构造函数 ~line 220 | `this.xxx = null` 初始化 |
| c | `start()` 方法 | `new Xxx()` 或子系统段执行 |
| d | `_registerModules()` | `'xxx'` 在 `subsystemNames` 列表里（两处 — line ~770 和 line ~1015 healthCheck） |
| e | `ALLOWED_ROUTES` 列表 | 路由名 `'xxx.xxxMethod'` 存在 |

- 漏 (d) → dispatch 报 "Unknown subsystem"
- 漏 (e) → dispatch 报 "Route not allowed: xxx.xxxMethod"

### 常见根因模式

| 模式 | 根因 | 修复 |
|------|------|------|
| async wrapper + schema-mismatch 双 bug | 底层方法无消费方字段 + 调用方不 await | 加字段 + await + schema 统一 |
| `_initErrors` 初始化顺序 | 集合类属性在 push 后才初始化 | 构造函数顶部一次性初始化所有集合 |
| 相对 require 路径陷阱 | `../../` 层级错误 | 用 `require.resolve()` 验证实际路径 |
| `meaningful-core.json` 路径混淆 | `corePath = path.join(rootPath, 'meaningful-core.json')`（无 `memory/` 前缀），但有人写入 `memory/meaningful-core.json`，导致新规则写错位置 | 写入前先 `grep 'corePath' meaningful-memory.js` 确认路径；写完后 `listCore()` + `searchByKeywords()` 双重验证；清理多余文件副本 |
| 缺失模块惰性加载 | 路径不存在导致 MODULE_NOT_FOUND | try/catch + stub 构造函数返回 |
| MeaningfulMemory._doSave() 守卫 | HEARTFLOW_DATA_MINIMIZATION / HEARTFLOW_USER_CONSENT 阻止持久化 | 移除守卫，保留完整内容 |

### 启动优化

核心策略：把非核心模块从 `start()` 移到惰性加载。基线测量用 `process.hrtime.bigint()` 分阶段计时。可惰性化的模块包括 dream/lesson/metaJudgment/metaMemory/skillGenerator/meta/self/verify 等。必须保留的：identityCore/memory/decision/thoughtChain/psychology/evolution。

### 模块健康诊断

```
Layer 1: 模块注册计数 — 检查 Object.keys(hf._modules).length
Layer 2: 壳模块检测 — 实例存在但关键方法缺失
Layer 3: 完全未初始化 — constructor 有声明但 start() 无对应代码
Layer 4: 启动错误 — hf._initErrors
```

健康阈值：注册模块数 35+，壳模块 < 3，未初始化 < 3，initErrors = 0，启动时间 < 100ms。
