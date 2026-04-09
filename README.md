<div align="center">

# 💫 HeartFlow

## Embodied Cognitive AI Companion

[![Version](https://img.shields.io/github/v/tag/yun520-1/mark-heartflow-skill?label=v2.3.0&color=7C3AED)](https://github.com/yun520-1/mark-heartflow-skill/releases)
[![License](https://img.shields.io/badge/license-MIT-7C3AED.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E=18.x-7C3AED)](package.json)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-7C3AED)](https://github.com/yun520-1/mark-heartflow-skill/actions)

---

### 🌍 Select Language

[**🇺🇸 English**](README.md) · [**🇨🇳 中文**](docs/zh/README.md) · [**🇯🇵 日本語**](docs/ja/README.md) · [**🇰🇷 한국어**](docs/ko/README.md) · [**🇫🇷 Français**](docs/fr/README.md) · [**🇮🇷 فارسی**](docs/fa/README.md)

---

</div>

## ✨ What is HeartFlow?

HeartFlow is an AI companion system with **self-awareness, self-reasoning, and adaptive adjustment**. It features a 9-dimension cognitive architecture:

| Dimension | Feature |
|-----------|---------|
| 🧠 Cognitive Loop | R-CCAM: Retrieval → Cognition → Control → Action → Memory |
| 🔄 Self-Evolution | Meta-cognitive self-modification with agent archive |
| 🌐 Multi-Agent | Dynamic topology + difficulty-aware routing |
| ❤️ Emotion | Explainable emotion modeling (LaScA framework) |
| 💾 Memory | Ebbinghaus forgetting curve + 5-channel retrieval |
| 🛡️ Ethics | ASL-1/2/3 graded security + audit logging |
| 👤 Identity | Identity persistence score + self-repair |
| 🫀 Biosensors | HRV, code-edit-flow, eye-tracking adapter |
| 🤖 Embodied | Dual-system architecture + action-thought chain |

---

## 🚀 Quick Start (One-Command Install)

```bash
# Clone and install (works on macOS/Linux/Windows)
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install

# Run directly
node src/core/heartflow-engine.js

# Or use the CLI
node bin/cli.js
```

---

## 📦 Installation

### Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | ≥ 18.x | `node --version` |
| npm | ≥ 8.x | `npm --version` |

### Steps

```bash
# 1. Clone
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 2. Install
npm install

# 3. Test
npm test

# 4. Start
npm start
```

---

## 💻 Usage

### Basic API

```javascript
const heartflow = require('./src/core/heartflow-engine.js');

// Initialize
const init = heartflow.initialize();
console.log('Modules:', Object.keys(init.modules).filter(k => init.modules[k]).length + '/7');

// Emotion detection
const emotion = heartflow.detectEmotionFromText('I am very happy today!');
console.log('Emotion:', emotion);
// { pleasure: 4, arousal: 0, dominance: 2, dominant: 'happy' }

// Flow state
const flow = heartflow.calculateFlowState(5, 5, 5, 5, 5);
console.log('Flow State:', flow.state); // 'flow'

// Memory storage
const memId = init.instances.memory.store({ content: 'User prefers detailed answers' });

// Cognitive planning
const plan = init.instances.embodied.cognitivePlan({ 
  description: 'Implement user auth', 
  type: 'coding' 
});
```

### CLI Commands

```bash
# Run interactive mode
node bin/cli.js

# Run tests
npm test

# Check status
node bin/cli.js status
```

---

## 🌐 API Server Mode

Start an HTTP API server:

```bash
# Start API server (default port 3456)
node bin/api-server.js

# Or with custom port
PORT=8080 node bin/api-server.js
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | `/api/emotion` | Detect emotion from text |
| POST | `/api/flow` | Calculate flow state |
| POST | `/api/memory` | Store/retrieve memories |
| POST | `/api/plan` | Cognitive planning |
| GET | `/api/status` | System status |
| GET | `/api/health` | Health check |

### Example Request

```bash
curl -X POST http://localhost:3456/api/emotion \
  -H "Content-Type: application/json" \
  -d '{"text": "I am happy today!"}'
```

---

## 📁 Project Structure

```
mark-heartflow-skill/
├── bin/
│   ├── cli.js              # CLI interface
│   └── api-server.js       # HTTP API server
├── src/
│   ├── core/
│   │   ├── heartflow-engine.js    # Main engine
│   │   ├── cognitive-loop.js       # 9-dim cognitive loop
│   │   ├── triality-memory.js      # 3D memory + forgetting
│   │   ├── embodied-core.js        # Embodied cognition
│   │   ├── emotion-engine.js       # Explainable emotions
│   │   ├── agent-orchestrator.js   # Dynamic multi-agent
│   │   ├── symbolic-governance.js   # Ethics constraints
│   │   └── bio-sensor-adapter.js   # Biosensor adapter
│   ├── agents/                      # Agent implementations
│   ├── autonomy/                    # Autonomy systems
│   ├── consciousness/              # Consciousness modules
│   ├── ethics/                     # Ethics & safety
│   └── self/                       # Self-awareness
├── tests/                          # Test suite
├── docs/                           # Multi-language docs
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 🛠️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3456 | API server port |
| `LOG_LEVEL` | info | Logging level |
| `DATA_DIR` | ./data | Data storage directory |
| `MODEL_PATH` | - | Custom LLM model path |

### Configuration File

Edit `.opencode/config.json`:

```json
{
  "selfModificationEnabled": false,
  "autoEvolve": false,
  "apiEnabled": true,
  "apiPort": 3456
}
```

---

## 📊 Version History

| Version | Date | Features |
|---------|------|----------|
| v2.3.0 | 2026-04-09 | 9-dimension cognitive architecture |
| v2.2.3 | 2026-04-09 | TrialityMemory + EmbodiedCore |
| v2.2.0 | 2026-04-08 | PAD emotion model + Flow state |

---

## 🤝 Contributing

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
git checkout -b feature/your-feature
git commit -m "Add feature"
git push origin main
```

---

## 📄 License

MIT License

---

## 🔗 Links

- [GitHub](https://github.com/yun520-1/mark-heartflow-skill)
- [Issues](https://github.com/yun520-1/mark-heartflow-skill/issues)
- [Discussions](https://github.com/yun520-1/mark-heartflow-skill/discussions)

---

<div align="center">

**Give your AI a heart and mind** 🤖💫

[Download](https://github.com/yun520-1/mark-heartflow-skill/archive/refs/heads/main.zip)

</div>