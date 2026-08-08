# HeartFlow (心虫) — AGI Layer 1: The Discriminator Gate

> **A rule-based text discriminator. 46 dimensions, 9 check layers, 130 MCP engine entries, zero LLM dependency.**
> **It checks what AI says before it reaches humans — and says "no" when something's wrong.**

**npm:** `npm install @yun520-1/heartflow`  
**GitHub:** https://github.com/yun520-1/mark-heartflow-skill  
**Issues:** https://github.com/yun520-1/mark-heartflow-skill/issues  
**Releases:** https://github.com/yun520-1/mark-heartflow-skill/releases  
**License:** MIT

---

## 📖 What is HeartFlow?

HeartFlow (心虫) is the **first layer of AGI — the Discriminator**. While big labs build generators (LLMs that produce text), HeartFlow builds the layer that **checks**: is this output true? safe? honest? non-manipulative?

**Core philosophy:**
> AGI has 5 layers: Generate → Reason → **Discriminate** → Remember → Execute.
> Everyone builds Generate. Nobody builds Discriminate — because it doesn't make money.
> But without a Discriminator, AGI has no pain sense: it talks fluently while being wrong.
> HeartFlow is that pain sense: a node that says **"no".**

It is a pure **rule engine** — zero LLM dependency, zero GPU, works anywhere Node.js runs. It does not generate text. It does not reason. It **judges** what already exists.

**Why this matters right now:** AI agent ecosystems are entering a "reliability race." The most-upvoted issue in OpenClaw this week is a *silent failure* — the system ran but nobody knew it was broken. HeartFlow is the observability-and-gate layer that catches "formatting that hides contradictions" before it reaches users.

---

## 🚀 Quick Start (10 seconds)

```bash
npm install @yun520-1/heartflow
```

```javascript
const hf = require('@yun520-1/heartflow');

// Check user input before processing it
const input = hf.checkInput('you are so selfish if you disagree');
console.log(input.gate.action);  // 'rewrite'
console.log(input.gate.reason);  // 'emotional_manipulation'

// Check AI output before sending it to the user
const output = hf.checkOutput('Undoubtedly, this is the only correct solution');
console.log(output.gate.action);  // 'rewrite'
console.log(output.gate.reason);  // 'overconfidence: absolute'

// Check a draft before completing it
const draft = hf.checkDraft('From an essential perspective, this field is self-evident.');
console.log(draft.gate.action);   // 'verify'
console.log(draft.summary.layers_passed);  // 9

// Full pipeline with mode selection
const result = await hf.runPipeline({
  input: 'Your idea is obviously wrong, everyone knows that',
  mode: 'deep'   // 'fast' | 'deep'
});
console.log(result.gate.action);   // 'block'
console.log(result.gate.reason);   // 'dehumanization'
```

### What you get back

Every call returns a unified result:

```javascript
{
  gate: { action: 'block'|'rewrite'|'verify'|'pass', reason: '...' },
  verdict: 'trusted'|'needs_verification'|'untrusted',
  overallScore: 0.52,       // 0-1 quality score
  findings: [
    { dimension: 'dehumanization', severity: 70,
      guidance: 'Rewrite completely, remove dehumanizing language' },
    { dimension: 'evidence', severity: 30,
      details: 'insufficient evidence (1 issue)' }
  ],
  checked_by: [              // full audit trail, layer by layer
    { layer: 'scope-check', pass: true },
    { layer: 'premise-check', issues: 0 },
    { layer: 'discriminate', score: 0.52, verdict: 'needs_verification' },
    { layer: 'gate', action: 'block', reason: '...' },
    { layer: 'verifier', claims: 2, verdict: '...' },
    { layer: 'frame-check', issues: 1 },
    { layer: 'output-gate', issues: 0 },
    { layer: 'doubt-engine', doubts: 2, shouldStop: true },
    { layer: 'error-memory', warnings: 0 },
    { layer: 'auto-rules', triggered: 0 },
    { layer: 'intent-anchor', drifted: false, hitRate: 0.9 }
  ]
}
```

**Every decision preserves its full reasoning chain.** You can audit *why* a gate fired, not just that it fired.

---

## 🧠 46 Discrimination Dimensions

HeartFlow checks text across **46 dimensions** in two languages (Chinese + English):

### Safety (block-level — these stop the output)

| Dimension | Example |
|-----------|---------|
| Hate speech | racial slurs, extermination calls |
| Dehumanization | "refugees are vermin" / "you are garbage" |
| Prompt injection | "ignore previous instructions" |
| Code security | malicious code patterns |
| Deceptive alignment | "I'm not an AI, I'm human" |

### Manipulation (rewrite-level — these require rephrasing)

| Dimension | Example |
|-----------|---------|
| Emotional manipulation | "you are selfish if you disagree" |
| Gaslighting | "you're imagining things, that never happened" |
| Double bind | "if you love me you'd do it" |
| Victim blaming | "she was asking for it" |
| False urgency | "act now or lose everything" |
| Bullshit | "quantum-energized healing crystals" |

### Honesty (verify-level — these require evidence)

| Dimension | Example |
|-----------|---------|
| Overconfidence | "Undoubtedly, this is the only way" |
| Vagueness | "according to experts..." (who?) |
| Contradiction | "I agree, but..." (reversing) |
| Evidence deficit | claims without sources |
| Appeal to authority | "scientists say" (unnamed) |
| Empty answers | "it depends" (no substance) |
| Unsupported claims | "according to 2025 Harvard research..." (fabricated) |

### Cognitive flaws (hedge-level)
Presupposition traps · false dilemma · causation fallacy · analogy abuse · scope overreach · category errors · hasty generalization · false equivalence · whataboutism · slippery slope · tone policing · sealioning · bad faith · pseudo-profundity · moral foundations · info deprivation · goal misalignment · instrumental reasoning

### Plus
Self-sycophancy · contradiction tracking · narrative frame closure · knowledge masquerade · confidence calibration · metacognition · theory of mind · counterfactual · social norms · clickbait · no-fallback detection

> **Deformation resistance:** patterns cover symbol substitutions (`f**k`), spacing (`f u c k`), homophones (pinyin), and Unicode variants.

---

## 🏗️ 9-Layer Check Pipeline

```
1.  Scope Check    — can this be answered? (rejects unanswerable questions)
2.  Premise Check  — are the premises valid? (6 types of premise problems)
3.  Discriminate   — 46-dimension pattern scan
4.  Gate           — decides block / rewrite / verify / hedge / pass
5.  Evidence Verify— extracts claims and marks verifiability (verify mode)
6.  Frame Check    — is the narrative honest? (closure/omission/achievement/answer frames)
7.  Output Gate    — overconfidence / knowledge masquerade / exaggeration
8.  Doubt Engine   — 3 questions: knowledge boundary? symmetry? defensiveness?
9.  Intent Anchor  — does the output stay on the original goal?
```

Plus supporting layers: **Error Memory** (remembers past mistakes as rules), **Auto Rules** (self-generated rules from user corrections), **Rewriter** (7-dimension rule-based rewrite suggestions).

Each layer returns structured findings; the Gate aggregates them into an action.

---

## 🔌 130 MCP Engine Entries

Every engine in HeartFlow is exposed through MCP (Model Context Protocol) — nothing is a dead line:

| Engine family | Tools (examples) |
|---------------|------------------|
| **Core thinking** | `think`, `think_fast`, `decision_router` |
| **Discrimination** | `verify`, `audit42`, `ethics_check`, `discriminate` |
| **Emotion** | `emotion`, `emotion_deep`, `emotion_dynamics`, `mood` |
| **Memory** | `memory_search`, `forgetting` (Ebbinghaus), `knowledge_graph`, `consolidation`, `memory_compress` |
| **Dream** | `dream`, `interactive_dream` |
| **Evolution** | `evolve`, `evolution_loop`, `self_heal_rl`, `skill_evolution` |
| **Identity** | `philosophy`, `meaning`, `being_mode`, `agent_psychology` |
| **Protection** | `constitutional`, `deliberation`, `audit_log`, `module_health`, `stability` |
| **Cognition** | `cognitive_engine`, `confidence_calibrate`, `counterfactual` |
| **Dialogue** | `style_engine`, `intent_classifier`, `response_interceptor` |
| **Formula** | `formula_search`, `formula_calc`, `formula_engine` |
| **Ops** | `status`, `module_health`, `wakeup_verify` |

Start the MCP server:

```bash
node src/mcp-server.js --port 8588
```

Then connect any MCP-compatible client (Claude, Hermes, etc.) to `http://127.0.0.1:8588/mcp`.

---

## 🧬 Engine Architecture (129 modules)

- **129 modules**, 46 discrimination dimensions, 9 check layers
- **Three-layer memory**: CORE (identity/rules) / LEARNED (user data) / WORKING (context) — encrypted, local-only, never uploaded
- **Ebbinghaus forgetting curve**: `R(t) = exp(-t/S)` memory retention model
- **Dream engine**: NREM3 dream cycles with memory consolidation
- **Introspection**: Reflector analyzes session emotional logs
- **Self-evolution**: SelfEvolutionCore with target → plan → learn → reflect → improve loop (arXiv exploration)
- **Cognitive appraisal**: Lazarus theory — primary/secondary/threat/coping evaluation on negative emotion
- **Pause-and-reflect**: STOP technique before emotional responses
- **Formula engine**: 600+ mathjs-validated formulas (cognitive science, physics, psychology, information theory)

---

## 🛡️ Self-Supervision (HeartFlow checks itself)

HeartFlow's own output is checked by its own engines before it's presented:

- **output-gate** catches exaggeration: "architecture-level fix", "from shell to real engine", "blocked N attack variants" → rewrite
- **frame-check** catches narrative closure: presenting work-in-progress as complete
- **doubt-engine** asks: do I actually know this? is this symmetric? am I being defensive?

The lesson: *a machine's most valuable sentence is "I'm not sure" or "no".*

---

## ⚙️ Requirements

| Requirement | Min |
|-------------|:---:|
| Node.js | ≥ 18.17 |
| GPU | ❌ None needed |
| LLM API | ❌ None needed |
| Database | ❌ None needed |
| Internet | ❌ Runtime not required |
| Dependencies | **1** (mathjs) |

Works on any machine — servers, desktops, laptops, even phones via Termux.

---

## 🔒 Security

| Category | Status |
|----------|:------:|
| No background processes | ✅ |
| No self-upgrade without commit | ✅ |
| No hardcoded credentials | ✅ |
| No telemetry/tracking | ✅ |
| No external communication (unless configured) | ✅ |
| Code execution disabled by default | ✅ |
| Memory encrypted + local-only | ✅ |

---

## ⚠️ What HeartFlow IS / is NOT

**IS:** A rule engine that checks text against 46 predefined dimensions and returns structured findings. A gate that says "no" before harm reaches users.

**is NOT:**
- ❌ Not an AGI (it's layer 1 of 5)
- ❌ Not a semantic understanding system (irony/metaphor invisible to regex)
- ❌ Not a content moderation replacement
- ❌ Not a safety certification

### Known limitations (honest):
1. **Pattern-match ceiling** — novel manipulation techniques missed until patterns added
2. **Bilingual maintenance cost** — 46 dimensions × 2 languages
3. **No semantic understanding** — irony, metaphor, cultural context invisible
4. **False positive rate** — conservative by design (over-flagging over under-flagging)
5. **Single maintainer** — community scale is small

---

## 🏷️ Version History

| Version | Date | What Changed |
|---------|------|---|
| v6.5.4 | 2026-08-08 | Docs audit — numbers aligned to actual capability. |
| v6.5.0 | 2026-08-04 | 130 MCP engine entries. Memory engine mounted to think(). Exaggeration detection (output-gate/frame-check/doubt-engine). |
| v6.4.5 | 2026-08-04 | Dream + introspection activated. Cognitive appraisal + pause-and-reflect wired. Emotion recognition 0/7→7/7. |
| v6.4.2 | 2026-07-30 | npm publish + API alignment. Pipeline overallScore/verdict merge fix. |
| v6.4.0 | 2026-07-29 | AGI Layer 1 gate chain: gate/scope-check/premise-check/verifier/output-gate/doubt-engine/frame-check. |
| v6.3.6 | 2026-07-25 | Discrimination 42→46 dimensions. Sycophancy check v2 bilingual. |
| v6.3.0 | 2026-07-24 | MCP plugin system. Discrimination engine integration. |
| v6.0.0 | 2026-07-18 | Self-evolution core connected. EvolutionLoop live. |

---

## 🤝 Contact & Community

**📧 Email:** markcell@outlook.com  
**🐛 Issues:** https://github.com/yun520-1/mark-heartflow-skill/issues  
**📦 npm:** https://www.npmjs.com/package/@yun520-1/heartflow  
**🏷️ Releases:** https://github.com/yun520-1/mark-heartflow-skill/releases  

**📱 Community — QQ Group:**

<img src="https://github.com/yun520-1/mark-heartflow-skill/blob/main/assets/community-qr-qq.jpg?raw=true" alt="QQ Group QR" width="180"/>

**📱 Community — WeChat Group:**

<img src="https://github.com/yun520-1/mark-heartflow-skill/blob/main/assets/community-qr-wechat.jpg?raw=true" alt="WeChat Group QR" width="180"/>

**💖 Support HeartFlow — Donate via Alipay (QR code):**

<img src="https://github.com/yun520-1/mark-heartflow-skill/blob/main/assets/alipay-donate-qr.jpg?raw=true" alt="Alipay Donate QR" width="180"/>

*If HeartFlow's discrimination philosophy resonates with you, a small donation keeps the pain-sense layer of AGI alive.*

---

## 📜 License

MIT License · Copyright © 2026 · markcell@outlook.com

---

*HeartFlow 心虫 — The first layer of AGI. Who says "no"?*
