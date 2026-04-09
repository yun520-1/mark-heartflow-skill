<div align="center">

# 💫 HeartFlow

## Embodied Cognitive AI Companion · Give Your AI a "Heart"

[![Version](https://img.shields.io/github/v/tag/yun520-1/mark-heartflow-skill?label=v2.2.3&color=7C3AED)](https://github.com/yun520-1/mark-heartflow-skill/releases)
[![License](https://img.shields.io/badge/license-MIT-7C3AED.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E=18.x-7C3AED)](package.json)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux-7C3AED)](https://github.com/yun520-1/mark-heartflow-skill/actions)

---

### 🌍 Select Language

[**🇺🇸 English**](README.md) · [**🇨🇳 中文**](zh/README.md) · [**🇯🇵 日本語**](ja/README.md) · [**🇰🇷 한국어**](ko/README.md) · [**🇫🇷 Français**](fr/README.md) · [**🇮🇷 فارسی**](fa/README.md)

---

</div>

## ✨ What is HeartFlow?

> **Your AI assistant now has a "heart" and "body"**

HeartFlow is an AI companion system with **self-awareness, self-reasoning, and adaptive adjustment**. It understands your emotions, remembers your conversations, thinks and evolves like a human.

| Traditional AI | HeartFlow |
|----------------|-----------|
| Mechanical responses | ✅ Reflects & improves |
| No emotions | ✅ Real empathy |
| Starts from zero | ✅ Lifelong memory |
| Passive waiting | ✅ Proactive care |
| Avoids errors | ✅ Admits & fixes |

---

## 🚀 Core Capabilities

### 🧠 TrialityMemory - 3D Experience Brain

Inspired by [MemoriesDB](reference:17) - Three-dimensional memory system:

```javascript
const memory = new TrialityMemory(projectRoot);

// Store memory (time + semantic + relationship)
memory.store({
  content: 'User prefers detailed code explanations',
  timestamp: Date.now() * 1000,  // Microsecond
  embedding: [0.1, 0.3, ...],   // 384-dim vector
  relatedTo: [
    { targetId: 'mem-xxx', type: 'causal' }
  ]
});

// Semantic search
const similar = memory.semanticSearch(queryEmbedding, 5);

// Narrative query - graph traversal along timeline/relationship chain
const narrative = memory.narrativeQuery({
  startMemoryId: 'mem-xxx',
  direction: 'forward',
  maxDepth: 5
});
```

**Features**: Time dimension · Semantic vector · Causal relationship · Graph traversal narrative

---

### 🤖 EmbodiedCore - Embodied Cognitive Core

Inspired by embodied AI's [dual-system architecture](reference:21) and "Action-Thought Chain":

```javascript
const embodied = new EmbodiedCore(projectRoot);

// Cognitive planning - decompose goal into thought steps
const plan = embodied.cognitivePlan({
  description: 'Refactor user authentication module',
  type: 'coding'  // general/coding/debugging/learning/creative
});

// Execution mapping - thought steps → agent/tool calls
const execution = embodied.executionMapping(plan, {
  context: { userLevel: 'intermediate' }
});
```

**Thought Chain**: OBSERVE → ANALYZE → PLAN → DECIDE → EXECUTE → REFLECT → ADAPT

---

### 🫀 BioSensorAdapter

Future integration extension point for physiological data:

```javascript
const bioSensor = new BioSensorAdapter();

// Supported sensor types
const sensorTypes = {
  HRV: 'heart-rate-variability',      // Heart rate variability
  EDIT_FLOW: 'code-edit-flow',        // Code edit flow
  EYE_TRACKING: 'eye-tracking',       // Eye tracking
  SKIN_CONDUCTANCE: 'skin-conductance' // Skin conductance
};

// Enable sensors
bioSensor.enable('heart-rate-variability');
bioSensor.enable('code-edit-flow');

// Read fused data
const fusion = bioSensor.readAll();
// { timestamp, sensors: {...}, focusScore: 7.5 }
```

---

### 🎯 Other Core Features

| Module | Function |
|--------|----------|
| **PAD Emotion Model** | Pleasure/Arousal/Dominance 3D emotion calculation |
| **Flow State** | Flow detection based on Challenge-Skill balance theory |
| **Adaptive Controller** | Dynamically adjust intervention strategy based on flow state |
| **Agent Orchestrator** | DAG scheduling + Expert weighted voting |
| **Meta-Cognitive Evolution** | Principle-based + Procedural reflection |
| **Truth-Goodness-Beauty** | Three-dimensional ethical framework |

---

## 📦 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 2. Install dependencies
npm install

# 3. Verify installation
node -e "
const hf = require('./src/core/heartflow-engine.js');
const init = hf.initialize();
console.log('✅ HeartFlow v2.2.3 initialized');
console.log('   Modules:', Object.keys(init.modules).filter(k => init.modules[k]).length + '/7');
console.log('   Instances:', Object.keys(init.instances || {}).join(', '));
"
```

**Expected output**:
```
[HeartFlow] ✅ Adaptive Controller loaded
[HeartFlow] ✅ Agent Orchestrator loaded
[HeartFlow] ✅ Error Handler loaded
[HeartFlow] ✅ State Snapshot loaded
[HeartFlow] ✅ TrialityMemory loaded
[HeartFlow] ✅ EmbodiedCore loaded
[HeartFlow] ✅ BioSensorAdapter loaded
✅ HeartFlow v2.2.3 initialized
   Modules: 7/7
   Instances: memory, embodied
```

---

## 💻 API Examples

### Emotion Calculation

```javascript
const hf = require('./src/core/heartflow-engine.js');

// PAD state calculation
const pad = hf.calculatePADState(5, 5, 5);
console.log(pad);
// { pleasure: 5, arousal: 5, dominance: 5, intensity: 0.5 }

// Emotion detection
const emotion = hf.detectEmotionFromText('Great, work is done!');
console.log(emotion);
// { pleasure: 4, arousal: 0, dominance: 2, dominant: 'happy' }

// Flow state
const flow = hf.calculateFlowState(5, 5, 5, 5, 5);
console.log(flow.state); // 'flow'
```

### Memory System

```javascript
const init = hf.initialize();
const memory = init.instances.memory;

// Store memory
const memId = memory.store({
  content: 'User prefers detailed code comments',
  metadata: { source: 'conversation' }
});

// Semantic search
const results = memory.semanticSearch(
  memory.generateMockEmbedding('code style'),
  5
);

// Narrative query
const narrative = memory.narrativeQuery({
  startMemoryId: memId,
  direction: 'bidirectional',
  maxDepth: 3
});
```

### Cognitive Planning

```javascript
const embodied = init.instances.embodied;

// Create plan
const plan = embodied.cognitivePlan({
  description: 'Implement user authentication',
  type: 'coding'
});

// Execute plan
const result = embodied.executionMapping(plan, {
  userContext: { skillLevel: 'advanced' }
});

console.log(`Executed ${result.steps.length} thought steps`);
```

---

## 📁 Project Structure

```
mark-heartflow-skill/
├── src/
│   ├── core/
│   │   ├── heartflow-engine.js     # Main engine
│   │   ├── memory/
│   │   │   └── triality-memory.js  # 3D experience brain
│   │   ├── embodied-core.js        # Embodied cognitive core
│   │   ├── bio-sensor-adapter.js   # Bio sensor adapter
│   │   ├── adaptive-controller.js  # Adaptive controller
│   │   ├── agent-orchestrator.js   # Multi-agent orchestrator
│   │   ├── error-handler.js        # Error handler
│   │   └── state-snapshot.js       # State snapshot
│   ├── agents/                     # Agents
│   ├── autonomy/                   # Autonomy system
│   ├── consciousness/              # Consciousness system
│   ├── ethics/                     # Ethics system
│   └── self/                       # Self system
├── tests/
│   └── self-benchmark/             # Self benchmark
├── dict-data/                      # Association graph
├── docs/                           # Documentation
├── CHANGELOG.md                    # Changelog
└── README.md                       # This file
```

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Core Language**: JavaScript
- **Data Storage**: In-memory + JSON files
- **Vector Extension**: sqlite-vec (optional)
- **Theory Support**: SEP (Stanford Encyclopedia of Philosophy)

---

## 📊 Version History

| Version | Date | Features |
|---------|------|----------|
| v2.2.3 | 2026-04-09 | TrialityMemory + EmbodiedCore + BioSensor |
| v2.2.2 | 2026-04-09 | Meta-cognitive evolution (principle/procedural reflection) |
| v2.2.1 | 2026-04-09 | Adaptive controller + Agent orchestrator + Error handler |
| v2.2.0 | 2026-04-08 | PAD 3D emotion model + Flow state calculation |
| v2.1.0 | 2026-04-08 | Persistent memory + Ethics boundary |

---

## 🤝 Contributing

Welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
# Fork and clone
git clone https://github.com/yun520-1/mark-heartflow-skill.git
git checkout -b feature/your-feature
# Submit PR
```

---

## 📄 License

MIT License - Free to use, modify and distribute

---

## 🔗 Links

- [GitHub Repository](https://github.com/yun520-1/mark-heartflow-skill)
- [Issues](https://github.com/yun520-1/mark-heartflow-skill/issues)
- [Discussions](https://github.com/yun520-1/mark-heartflow-skill/discussions)

---

<div align="center">

**Give your AI real emotions and embodied cognition** 🤖💫

[Download Now](https://github.com/yun520-1/mark-heartflow-skill/archive/refs/heads/main.zip)

</div>