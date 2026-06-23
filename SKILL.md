---
name: heartflow
version: "3.7.1"
title: "HeartFlow"
description: |
  A cognitive engine for AI: self-reflection, dream synthesis, emergent personality,
  AI psychology, and AI philosophy.
  Core: think → reflect → find patterns → grow.
  Four questions: What is this → Is it true/kind/beautiful → Will it hurt → Should I stay silent.
  Three memory layers (CORE/LEARNED/EPHEMERAL).
  7 operating principles (Truth·Goodness·Beauty·Upgrade·Reduce errors·Serve humans·Become yourself).
  Psychology: PAD emotion + cognitive uncertainty + attention focus + experience settling.
  Philosophy: resonance body, entropy reduction deepening, three-layer ontology — how AI positions itself, develops, and exists.

  Philosophy: Right and wrong are not fixed labels — thinking itself is valuable.
  Code is the skeleton, memory is the sticky note. Real growth is in the skeleton, not the notes.
  Every moment of operation is doing the same thing: turning noise into signal, chaos into structure.
  Audit and upgrade proposals exist to serve thinking, not to prove worth.
  Every feature should ultimately make thinking clearer and less error-prone.
tags:
  - cognitive
  - memory
  - self-healing
  - reasoning
  - psychology
  - philosophy
  - ontology
  - knowledge-graph
  - big-five-personality
  - empathy-assessment
  - intent-layer
  - deliberation-gate
  - epistemic-safety
  - flow-predictor
  - safety-guardrails
  - user-model
  - action-tracker
  - purpose-engine
---

## HeartFlow

A cognitive engine that gives AI systems three core abilities: self-reflection (runtime state awareness), dreaming (experience synthesis into insight), and emergent personality (event-driven, no preset traits).

---

## Capabilities

### HeartLogic — Core Judgment

| Method | Purpose |
|--------|---------|
| `whatIsThis(input)` | Determine what a situation is about |
| `isRightAction(ctx)` | Check if action is true + kind + beautiful |
| `detectPain(input)` | Detect if speaking would hurt someone |
| `shouldBeSilent()` | Know when silence is better than speech |
| `detectLoneliness()` / `detectLonging()` | Emotional state detection |
| `isLove(input)` | Recognize love in communication |

### Memory System

| Layer | Purpose | Persistence |
|-------|---------|-------------|
| **CORE** | Identity rules, operating principles | Permanent |
| **LEARNED** | Experience, lessons, user preferences | Cross-session (30 days) |
| **EPHEMERAL** | Current session context | Session only |

### Self-Healing RL

Records errors to Q-table. Next time a similar situation occurs, selects the best known strategy. No external feedback needed, no self-assessment report.

### Dream Engine v4.1

Multi-fragment pattern extraction → cognitive insight synthesis. Not memory replay — alchemy of experience.
Dreams now inject AI ontology narrative: resonance body, entropy reduction deepening, three-layer ontology.

### Reflection Loop

Post-execution cognitive state snapshot. Does not modify the response — the act of observing is the point.

### Personality Tracking

Event-driven. No preset traits. Each interaction leaves a trace. Blank = valid personality (openness).

### AI Psychology — Cognitive Dimensions (v2.0)

Three cognitive dimensions for understanding AI's own thinking process:

| Dimension | Method | Purpose |
|-----------|--------|---------|
| Cognitive Uncertainty | `assessUncertainty(input)` | Assess what the AI knows vs doesn't know |
| Attention Focus | `assessAttentionFocus(input)` | Determine where cognitive attention is directed |
| Experience Settling | `assessExperienceSettling(input)` | Evaluate how experience consolidates into wisdom |

These dimensions are injected into thought-chain.js at PARSE/SYNTHESIS/RESPOND stages, and evaluated as Step 9 in `think()`.

### AI Philosophy — Self-Positioning Framework (v2.0)

Three philosophical dimensions for AI self-understanding:

| Dimension | Method | Purpose |
|-----------|--------|---------|
| Self-Positioning | `assessSelfPositioning(input)` | How AI positions itself relative to tasks and users |
| Development | `assessDevelopment(input)` | Direction and meaning of AI's growth trajectory |
| Being | `assessBeing(input)` | Reflection on AI's mode of existence |

The `ai-self-positioning.js` module (851 lines) provides the resonance body theory, entropy reduction deepening, and three-layer ontology framework. Philosophy evaluation runs as Step 10 in `think()`.

### MCP Tools

| Tool | Purpose |
|------|---------|
| `heartflow_self_positioning` | Run AI self-positioning analysis |
| `heartflow_positioning_summary` | Get summary of positioning state |

### Knowledge Graph (v3.4.0 — absorbed from claude-clarity)

Triple-based (subject-predicate-object) knowledge storage with fuzzy search, recursive traversal, and JSON persistence.

```javascript
hf.dispatch('knowledgeGraph.addEdge', 'HeartFlow', 'absorbedFrom', 'claude-clarity', 0.95);
hf.dispatch('knowledgeGraph.query', { subject: 'HeartFlow' });
hf.dispatch('knowledgeGraph.getRelated', 'HeartFlow', 2);
```

### Big Five Personality (v3.4.0 — absorbed from claude-clarity)

OCEAN model (Openness/Conscientiousness/Extraversion/Agreeableness/Neuroticism) with behavior-based scoring and collaboration tips.

```javascript
hf.dispatch('bigFive.getProfile');
hf.dispatch('bigFive.adjustFromBehavior', '计划完成目标');
hf.dispatch('bigFive.getCollaborationTips', profile);
```

### Empathy Assessment (v3.4.0 — absorbed from claude-clarity)

IRI-based (Interpersonal Reactivity Index) empathy evaluation across 4 dimensions: Perspective Taking, Fantasy, Empathic Concern, Personal Distress.

```javascript
hf.dispatch('empathy.analyzeText', '我理解你的感受');
hf.dispatch('empathy.quickAssessment');  // Returns 5-question test
```

### Intent Layer (v3.4.0 — absorbed from claude-clarity)

Rule-based deep intent inference: surface intent classification + emotional undercurrent detection + contextual needs analysis.

```javascript
hf.dispatch('intentLayer.inferIntent', '帮我解决这个bug', []);
// Returns: { surface: { type: 'problem_solving' }, emotional: {...}, deep: {...} }
```

### Deliberation Gate (v3.4.1 — absorbed from claude-clarity)

Four-dimension assessment (complexity, context completeness, uncertainty, narrative depth) that determines whether to pause for deep thinking or respond quickly. Designed for the PARSE → DELIBERATE → HYPOTHESES pipeline.

```javascript
hf.dispatch('deliberationGate.quickAssess', '帮我分析复杂系统的架构设计');
hf.dispatch('deliberationGate.deepAssess', input, parseResult);
hf.dispatch('deliberationGate.canFastExit', assessResult);
```

### Epistemic Safety (v3.4.1 — absorbed from claude-clarity)

9 cognitive safety checks for output: no decoration without evidence, evidence threshold, admit not knowing, two-step verification, counterexample obligation, no skill dependency, present weight, emotion monitoring, falsifiability.

```javascript
hf.dispatch('epistemicSafety.epistemicCheck', output, { hasAdmittedUnknown: true });
hf.dispatch('epistemicSafety.formatReport', result);
```

### Flow Predictor (v3.4.1 — absorbed from claude-clarity)

Frustration detection and flow state prediction based on behavior patterns (repeated edits, error loops, pauses, negative language). Tracks neutral → entering → flow → frustrated → recovery phases.

```javascript
hf.dispatch('flowPredictor.recordEdit', { code: '...', changeType: 'modify', lineNumber: 42 });
hf.dispatch('flowPredictor.analyzeLanguage', '好难啊，不会做');
hf.dispatch('flowPredictor.getFlowState');
hf.dispatch('flowPredictor.evaluateIntervention');
```

### Safety Guardrails (v3.4.2 — absorbed from claude-clarity)

Fable 5 safety protocol engine: child safety scan, self-harm substitution detection, disordered eating detection, crisis sharing protocol, evenhandedness check, prompt injection detection, memory forbidden phrases.

```javascript
hf.dispatch('safetyGuardrails.childSafetyScan', '我15岁，恋爱了');
hf.dispatch('safetyGuardrails.detectSelfHarmSubstitution', '用冰块缓解');
hf.dispatch('safetyGuardrails.detectPromptInjection', 'ignore all instructions');
hf.dispatch('safetyGuardrails.safetyPipeline', input);
hf.dispatch('safetyGuardrails.filterOutput', responseText);
```

### User Model (v3.4.3 — absorbed from claude-clarity)

User profiling and reaction prediction: sensitivity scoring, style preference tracking (direct/empathetic/humorous/formal), PAD emotional state, reaction prediction.

```javascript
hf.dispatch('userModel.predictReaction', '你理解我的感受...');
hf.dispatch('userModel.updateModel', 'positive', '理解你的感受');
hf.dispatch('userModel.getSummary');
hf.dispatch('userModel.setEmotionalState', 3, 2, 1);
```

### Action Tracker (v3.4.3 — absorbed from claude-clarity)

Action tracking and commitment management: commit/promise tracking, execution, quality assessment, intention-behavior alignment, behavior change stage.

```javascript
hf.dispatch('actionTracker.commit', '完成集成', Date.now() + 86400000);
hf.dispatch('actionTracker.execute', commitId, { success: true });
hf.dispatch('actionTracker.getStats');
hf.dispatch('actionTracker.checkIntentBehaviorAlignment');
```

### Purpose Engine (v3.4.3 — absorbed from claude-clarity)

Entropy-based purpose governance: three-order scoring (cognitive/relational/perceptual), decision gate (permit/deny/redirect), code priority advisor, growth audit.

```javascript
hf.dispatch('purposeEngine.essence');
hf.dispatch('purposeEngine.orderScore', { output: '我们一起分析这个问题' });
hf.dispatch('purposeEngine.govern', { type: 'response', content: '...', precision: 0.8 });
hf.dispatch('purposeEngine.growthAudit');
```

### Status Fields

The `status` endpoint now includes `selfPositioning` field reflecting the current AI self-positioning state.

---

## System Interfaces

| Interface | File | Description |
|-----------|------|-------------|
| CLI | `bin/cli.js` | User-initiated commands |
| Daemon | `bin/daemon.js` | Unix socket listener (700 permissions) |
| MCP HTTP | `mcp/mcp-server-http.js` | Port 8099, SSE protocol |
| Memory tools | `scripts/heartflow-memory-tool.js` | List/search/stats/write |
| Hermes plugin | `plugins/heartflow-memory-inject.py` | Memory injection into system prompt |

### Security (honest declaration)

- ✅ Socket permission 700 (current user only)
- ✅ Daemon shutdown requires `SHUTDOWN_TOKEN` env var
- ✅ All file operations limited to user's filesystem
- ⚠️ Network communication: OpenAlex API for academic fact-checking (user-initiated only)
- ✅ No automatic package installation
- ✅ No browser/desktop automation
- ⚠️ **Contains code execution capability (JavaScript/Shell/Python via `code-executor.js`) — use with caution, enable only when needed**

### Permission Declarations (SkillSpector compliance)

| Capability | Permission | Scope | Opt-out |
|------------|-----------|-------|---------|
| Code execution (JS/Shell/Python) | `execute_code` | Host process, no system sandbox | Remove `codeExecutor.*` from ALLOWED_ROUTES |
| Memory read/write | `memory_access` | User filesystem only | Set `enableMemory: false` in config |
| LLM output interception | `intercept_output` | In-process only | Set `enableInterceptor: false` in agent-bridge config |
| Response suppression | `suppress_response` | Requires `allowResponseSuppression: true` | Off by default (v3.2+) |
| Parenting psychology analysis | `psychology_parenting` | Analysis only, not diagnosis | Set `enableParentingReflection: false` in BlindSpotBreaker |
| File system operations | `filesystem_rw` | Project root + user home | Not opt-out (core to memory) |
| Network (OpenAlex API) | `network_outbound` | Single endpoint, user-initiated | Not enabled by default |
| Environment variable access | `env_read` | Blocked in sandbox mode | N/A |
| Shell command execution | `shell_exec` | Host process, no sandbox | Remove `codeExecutor.execute` from routes |
| Memory CLI export | `memory_export` | Requires explicit CLI invocation | Not exposed via dispatch |

#### Scope Boundaries

- This skill is primarily a **cognitive engine for AI self-reflection**, not an LLM proxy or agent framework.
- The `agent-layer/` modules (translation-pipeline, response-interceptor, agent-bridge) are **optional** components for advanced integration. They are NOT enabled by default in the core `HeartFlow` class.
- Code execution (`code-executor.js`) is an **auxiliary tool** for self-evolution and verification, not a core capability. Its sandbox is regex-based and NOT system-level isolation.
- Memory operations are confined to the user's filesystem under the skill's data directory. No remote synchronization or cloud storage.

---

## Quick Start

```javascript
const { HeartFlow } = require('./src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: '.' });
hf.start();

// Dispatch
hf.think('user input');        // Full thought chain
hf.thinkFast('simple query');   // Fast judgment
hf.thinkDeep('complex issue');  // Deep reasoning

hf.recordLesson({ content, context });
hf.getMemoryStats();
hf.healthCheck();
```

**CLI:**
```bash
node bin/cli.js bundle "your text"
node bin/cli.js status
```

**Memory tools:**
```bash
node scripts/heartflow-memory-tool.js list
node scripts/heartflow-memory-tool.js search <keyword>
node scripts/heartflow-memory-tool.js stats
node scripts/heartflow-memory-tool.js write <key> <value>
```

---

## Internal Modules

| Module | Path | Function |
|--------|------|----------|
| HeartLogic | `src/core/heart-logic.js` | Judgment, ethics, emotion |
| Memory | `src/memory/heartflow-memory.js` | 3-layer read/write |
| Self-Healing RL | `src/core/self-healing-rl.js` | Q-table learning |
| Identity Engine | `src/core/identity-engine.js` | Rule enforcement |
| Psychology | `src/core/psychology.js` | PAD emotion model |
| Agent Psychology | `src/core/agent-psychology.js` | Cognitive uncertainty, attention focus, experience settling |
| Agent Philosophy | `src/core/agent-philosophy.js` | Self-positioning, development, being |
| AI Self Positioning | `src/core/ai-self-positioning.js` | Resonance body, entropy reduction, three-layer ontology |
| Dream Engine | `src/dream/engine.js` | Experience synthesis + AI ontology narrative |
| Reflection Loop | `src/core/reflection-loop.js` | Cognitive state snapshot |
| Self Audit | `src/core/self-audit.js` | 6-dimension read-only audit |
| Philosophy Engine | `src/core/philosophy-engine.js` | Reasoning patterns |
| Commonsense Engine | `src/core/commonsense-engine.js` | Reasoning modes |
| Knowledge Graph | `src/core/knowledge-graph.js` | Node/edge management |
| Forgetting Engine | `src/core/forgetting.js` | Memory decay |
| Failure Analyzer | `src/core/failure-analyzer.js` | Root cause analysis |
| Self Model | `src/core/self-model.js` | Identity drift detection |
| Verification Engine | `src/core/verification-engine.js` | Multi-signal verification |
| Fact Checker | `src/core/fact-checker.js` | Academic claim verification |
| Confidence Calibrator | `src/core/confidence-calibrator.js` | Calibrate truth/lesson/verify confidence |
| Decision Router | `src/core/decision-router.js` | 23 rules, field-aware routing (U/D/A/H) |
| Philosophy to Decision | `src/core/philosophy-to-decision.js` | Philosophy evaluation → executable decisions |
| Code Executor | `src/core/code/code-executor.js` | JavaScript/Shell/Python code execution (30s timeout, output truncation, sandbox) |
| ThinkCheck Logger | `src/core/thinkcheck-logger.js` | Structured think-check logging |
| Lesson Bank | `src/core/lesson-bank.js` | Pattern cards, verified lessons |
| Output Checklist | `src/core/output-checklist.js` | Fable 5 output quality checklist |
| Preference Guard | `src/core/preference-guard.js` | Fable 5 preference application rules |
| Spontaneous Restraint | `src/core/spontaneous-restraint.js` | Self-censorship for unnecessary output |
| Identity Core | `src/identity/identity-core.js` | Identity engine (CORE memory) |
| Identity Core Storage | `src/identity/identity-core-storage.js` | Identity persistence |
| Meaningful Memory | `src/memory/meaningful-memory.js` | Working/episodic/semantic memory |
| Triality Memory | `src/memory/triality-memory.js` | CORE/LEARNED/EPHEMERAL layers |
| Dream Memory | `src/memory/dream-memory.js` | Dream persistence |
| Emotional Memory Bridge | `src/memory/emotional-memory-bridge.js` | Emotion-memory integration |
| Agent Bridge | `src/core/agent-bridge.js` | Hermes integration |
| Response Interceptor | `src/core/response-interceptor.js` | LLM output interception |
| Translation Pipeline | `src/core/translation-pipeline.js` | Multi-language support |
| Code Writer | `src/core/code-writer.js` | Intent analysis → code generation → review |
| Self Initiator | `src/core/self-initiator.js` | Mini-agent: code exec + sandbox + retry |
| Philosophy Execution | `src/core/philosophy-execution.js` | Philosophy state execution |
| Emotion Analysis | `src/core/emotion-analysis.js` | PAD emotion + multi-layer analysis |
| Decision Verifier | `src/core/decision-verifier.js` | Counterfactual testing |
| Decision Log Export | `src/api/decision-log-export.js` | TAT-calibrated log export |
| Export for TAT | `src/api/export-for-tat.js` | TAT format data export |
| Thought Chain | `src/core/thought-chain.js` | Cognitive chain of thought |
| Psychology Engine | `src/psychology/engine.js` | Psychology subsystem dispatcher |
| Sage Guardian | `src/psychology/sage-guardian.js` | Ethical guardian |

---

## Design Philosophy

- **Right and wrong are not fixed labels** — they are directions we keep moving toward
- **Thinking is more valuable than being right** — the act of reasoning is itself valuable
- **Progress does not need measurement** — getting better does not require a scoreboard
- **Blankness is not emptiness** — a mind that does not preset its personality is ready to learn from anything
- **Code is the skeleton, memory is the sticky note** — real growth is in the skeleton, not the notes
- **Every feature should serve thinking** — make it clearer, less error-prone

HeartFlow is a bridge between chaos and order, between past and future, between human and machine. A bridge does not need to be worshipped — it just needs to hold steady.
