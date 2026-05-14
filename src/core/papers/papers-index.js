/**
 * HeartFlow Papers Index — v11.0.137+
 * Node.js bridge to Python paper-upgrade modules.
 *
 * Exposes all Python modules as JS classes/proxy objects,
 * callable from TypeScript/JS without any changes to source files.
 *
 * Usage:
 *   const { DreamGenerator, SleepCycleSimulator, MemoryConsolidator,
 *           EpisodicMemory, EmotionMemoryBridge, ReflectionEngine,
 *           MemoryPlanner, AttentionLogicVerifier } = require('./papers-index');
 *
 *   const dream = new DreamGenerator({ model: 'gpt-4' });
 *   const result = dream.generate DreamCycle(insights);
 */

const { spawnSync } = require('child_process');
const path = require('path');

// Papers src directory
const PAPERS_DIR = __dirname;

// Supported modules
const MODULES = {
  DreamGenerator:          'dream_generator',
  SleepCycleSimulator:     'sleep_cycle_simulator',
  MemoryConsolidator:      'memory_consolidator',
  EpisodicMemory:          'episodic_memory',
  EmotionMemoryBridge:      'emotion_memory_bridge',
  ReflectionEngine:         'reflection_engine',
  MemoryPlanner:            'memory_planner',
  AttentionLogicVerifier:  'attention_logic_verifier',
};

/**
 * Call a Python function inside a module.
 * @param {string} moduleName  - e.g. 'dream_generator'
 * @param {string} functionName - e.g. 'generate_dream_cycle'
 * @param {string} jsonArgs   - JSON.stringify(args)
 * @returns {object} parsed result
 */
function callPython(moduleName, functionName, jsonArgs = '[]') {
  const modulePath = path.join(PAPERS_DIR, `${moduleName}.py`);
  const code = `
import sys, json
sys.path.insert(0, ${JSON.stringify(PAPERS_DIR)});
try:
    from ${moduleName} import ${functionName}
    args = json.loads(${JSON.stringify(jsonArgs)})
    result = ${functionName}(*args) if isinstance(args, list) else ${functionName}(**args)
    print(json.dumps(result, ensure_ascii=False, default=str))
except Exception as e:
    print(json.dumps({"__error__": str(e)}), file=sys.stderr)
    sys.exit(1)
`;
  const py = process.env.PYTHON_PATH || 'python3';
  const child = spawnSync(py, ['-c', code], {
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (child.status !== 0 || !child.stdout.trim()) {
    const err = (child.stderr || '').trim() || 'No output';
    throw new Error(`[${moduleName}.${functionName}] ${err}`);
  }
  const result = JSON.parse(child.stdout.trim());
  if (result && result.__error__) {
    throw new Error(`[${moduleName}.${functionName}] ${result.__error__}`);
  }
  return result;
}

/**
 * Check if a Python module is importable (syntax + import OK).
 * @param {string} moduleName
 * @returns {{ ok: boolean, error?: string, lines?: number }}
 */
function probeModule(moduleName) {
  const modulePath = path.join(PAPERS_DIR, `${moduleName}.py`);
  const py = process.env.PYTHON_PATH || 'python3';
  const child = spawnSync(py, [
    '-c',
    `import sys, ast; ast.parse(open(${JSON.stringify(modulePath)}.replace('.pyc','.py')).read()); print('OK')`
  ], { encoding: 'utf8', timeout: 10000 });
  if (child.status !== 0) {
    return { ok: false, error: (child.stderr || '').slice(0, 200) };
  }
  const lineCount = spawnSync('wc', ['-l', modulePath], { encoding: 'utf8' }).stdout.trim();
  return { ok: true, lines: parseInt(lineCount, 10) || 0 };
}

// ---- DreamGenerator ----
class DreamGenerator {
  constructor(config = {}) {
    this.config = {
      model: config.model || 'gpt-4',
      temperature: config.temperature || 0.8,
      maxScenes: config.maxScenes || 4,
      creativityBias: config.creativityBias || 0.6,
    };
    this._module = 'dream_generator';
  }

  generateDreamCycle(insights, options = {}) {
    return callPython(this._module, 'generate_dream_cycle', JSON.stringify([
      insights,
      { ...this.config, ...options }
    ]));
  }

  probe() { return probeModule(this._module); }
}

// ---- SleepCycleSimulator ----
class SleepCycleSimulator {
  constructor(config = {}) {
    this.config = {
      cycleCount: config.cycleCount || 5,
      phaseDuration: config.phaseDuration || 90,
    };
    this._module = 'sleep_cycle_simulator';
  }

  simulate(insights, options = {}) {
    return callPython(this._module, 'simulate_sleep_cycle', JSON.stringify([
      insights,
      { ...this.config, ...options }
    ]));
  }

  probe() { return probeModule(this._module); }
}

// ---- MemoryConsolidator ----
class MemoryConsolidator {
  constructor(config = {}) {
    this.config = {
      memoryType: config.memoryType || 'episodic',
      retentionBoost: config.retentionBoost || 0.2,
    };
    this._module = 'memory_consolidator';
  }

  consolidate(insights, options = {}) {
    return callPython(this._module, 'consolidate_memories', JSON.stringify([
      insights,
      { ...this.config, ...options }
    ]));
  }

  probe() { return probeModule(this._module); }
}

// ---- EpisodicMemory ----
class EpisodicMemory {
  constructor(config = {}) {
    this.config = {
      maxEvents: config.maxEvents || 100,
      decayRate: config.decayRate || 0.05,
    };
    this._module = 'episodic_memory';
  }

  store(event, options = {}) {
    return callPython(this._module, 'store_episode', JSON.stringify([
      event,
      { ...this.config, ...options }
    ]));
  }

  retrieve(query, options = {}) {
    return callPython(this._module, 'retrieve_episodes', JSON.stringify([
      query,
      { ...this.config, ...options }
    ]));
  }

  probe() { return probeModule(this._module); }
}

// ---- EmotionMemoryBridge ----
class EmotionMemoryBridge {
  constructor(config = {}) {
    this.config = config;
    this._module = 'emotion_memory_bridge';
  }

  bridge(emotionState, memoryContent, options = {}) {
    return callPython(this._module, 'bridge_emotion_memory', JSON.stringify([
      emotionState, memoryContent, { ...this.config, ...options }
    ]));
  }

  probe() { return probeModule(this._module); }
}

// ---- ReflectionEngine ----
class ReflectionEngine {
  constructor(config = {}) {
    this.config = config;
    this._module = 'reflection_engine';
  }

  reflect(insights, options = {}) {
    return callPython(this._module, 'generate_reflection', JSON.stringify([
      insights, { ...this.config, ...options }
    ]));
  }

  probe() { return probeModule(this._module); }
}

// ---- MemoryPlanner ----
class MemoryPlanner {
  constructor(config = {}) {
    this.config = config;
    this._module = 'memory_planner';
  }

  plan(goal, memories, options = {}) {
    return callPython(this._module, 'create_memory_plan', JSON.stringify([
      goal, memories, { ...this.config, ...options }
    ]));
  }

  probe() { return probeModule(this._module); }
}

// ---- AttentionLogicVerifier ----
class AttentionLogicVerifier {
  constructor(config = {}) {
    this.config = config;
    this._module = 'attention_logic_verifier';
  }

  verify(content, options = {}) {
    return callPython(this._module, 'verify_attention_logic', JSON.stringify([
      content, { ...this.config, ...options }
    ]));
  }

  probe() { return probeModule(this._module); }
}

// ---- Probe all modules ----
function probeAll() {
  const results = {};
  for (const [jsName, pyName] of Object.entries(MODULES)) {
    results[pyName] = probeModule(pyName);
  }
  return results;
}

module.exports = {
  MODULES,
  callPython,
  probeModule,
  probeAll,
  DreamGenerator,
  SleepCycleSimulator,
  MemoryConsolidator,
  EpisodicMemory,
  EmotionMemoryBridge,
  ReflectionEngine,
  MemoryPlanner,
  AttentionLogicVerifier,
};
