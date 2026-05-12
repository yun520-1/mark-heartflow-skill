"use strict";
// HeartFlow v0.13 — Autonomous Decision Engine
// 主导出：整合所有引擎的一站式 API
Object.defineProperty(exports, "__esModule", { value: true });
exports.setConfig = exports.getConfig = exports.createSupervisor = exports.createSecurityEngine = exports.createVectorStoreEngine = exports.createCheckpointEngine = exports.createTransmissionAgent = exports.createConsciousnessAgent = exports.createAutonomyAgent = exports.createEthicsEngine = exports.createAgentsEngine = exports.createKnowledgeGraphEngine = exports.createEmotionEngine = exports.createDreamEngine = exports.createSelfEvolutionEngine = exports.createCognitionEngine = exports.createEvolutionEngine = exports.createMemoryEngine = exports.createIdentityEngine = void 0;
exports.createHeartFlow = createHeartFlow;
// Factory exports
var index_js_1 = require("./core/identity/index.js");
Object.defineProperty(exports, "createIdentityEngine", { enumerable: true, get: function () { return index_js_1.createIdentityEngine; } });
var index_js_2 = require("./core/memory/index.js");
Object.defineProperty(exports, "createMemoryEngine", { enumerable: true, get: function () { return index_js_2.createMemoryEngine; } });
var index_js_3 = require("./core/evolution/index.js");
Object.defineProperty(exports, "createEvolutionEngine", { enumerable: true, get: function () { return index_js_3.createEvolutionEngine; } });
var index_js_4 = require("./core/cognition/index.js");
Object.defineProperty(exports, "createCognitionEngine", { enumerable: true, get: function () { return index_js_4.createCognitionEngine; } });
var index_js_5 = require("./core/self-evolution/index.js");
Object.defineProperty(exports, "createSelfEvolutionEngine", { enumerable: true, get: function () { return index_js_5.createSelfEvolutionEngine; } });
var index_js_6 = require("./core/dream/index.js");
Object.defineProperty(exports, "createDreamEngine", { enumerable: true, get: function () { return index_js_6.createDreamEngine; } });
var index_js_7 = require("./core/emotion/index.js");
Object.defineProperty(exports, "createEmotionEngine", { enumerable: true, get: function () { return index_js_7.createEmotionEngine; } });
var index_js_8 = require("./core/knowledge/index.js");
Object.defineProperty(exports, "createKnowledgeGraphEngine", { enumerable: true, get: function () { return index_js_8.createKnowledgeGraphEngine; } });
var index_js_9 = require("./core/agents/index.js");
Object.defineProperty(exports, "createAgentsEngine", { enumerable: true, get: function () { return index_js_9.createAgentsEngine; } });
var index_js_10 = require("./agent/ethics/index.js");
Object.defineProperty(exports, "createEthicsEngine", { enumerable: true, get: function () { return index_js_10.createEthicsEngine; } });
var index_js_11 = require("./agent/autonomy/index.js");
Object.defineProperty(exports, "createAutonomyAgent", { enumerable: true, get: function () { return index_js_11.createAutonomyAgent; } });
var index_js_12 = require("./agent/consciousness/index.js");
Object.defineProperty(exports, "createConsciousnessAgent", { enumerable: true, get: function () { return index_js_12.createConsciousnessAgent; } });
var index_js_13 = require("./agent/transmission/index.js");
Object.defineProperty(exports, "createTransmissionAgent", { enumerable: true, get: function () { return index_js_13.createTransmissionAgent; } });
var checkpoint_js_1 = require("./storage/checkpoint.js");
Object.defineProperty(exports, "createCheckpointEngine", { enumerable: true, get: function () { return checkpoint_js_1.createCheckpointEngine; } });
var vector_store_js_1 = require("./storage/vector-store.js");
Object.defineProperty(exports, "createVectorStoreEngine", { enumerable: true, get: function () { return vector_store_js_1.createVectorStoreEngine; } });
var index_js_14 = require("./security/index.js");
Object.defineProperty(exports, "createSecurityEngine", { enumerable: true, get: function () { return index_js_14.createSecurityEngine; } });
var supervisor_js_1 = require("./orchestrator/supervisor.js");
Object.defineProperty(exports, "createSupervisor", { enumerable: true, get: function () { return supervisor_js_1.createSupervisor; } });
var config_js_1 = require("./runtime/config.js");
Object.defineProperty(exports, "getConfig", { enumerable: true, get: function () { return config_js_1.getConfig; } });
Object.defineProperty(exports, "setConfig", { enumerable: true, get: function () { return config_js_1.setConfig; } });
// Main HeartFlow Engine
const index_js_15 = require("./core/identity/index.js");
const index_js_16 = require("./core/memory/index.js");
const index_js_17 = require("./core/evolution/index.js");
const index_js_18 = require("./core/cognition/index.js");
const index_js_19 = require("./core/self-evolution/index.js");
const index_js_20 = require("./core/dream/index.js");
const index_js_21 = require("./core/emotion/index.js");
const index_js_22 = require("./core/knowledge/index.js");
const index_js_23 = require("./core/agents/index.js");
const index_js_24 = require("./agent/ethics/index.js");
const index_js_25 = require("./agent/autonomy/index.js");
const index_js_26 = require("./agent/consciousness/index.js");
const index_js_27 = require("./agent/transmission/index.js");
const checkpoint_js_2 = require("./storage/checkpoint.js");
const vector_store_js_2 = require("./storage/vector-store.js");
const index_js_28 = require("./security/index.js");
const supervisor_js_2 = require("./orchestrator/supervisor.js");
const event_bus_js_1 = require("./runtime/event-bus.js");
const config_js_2 = require("./runtime/config.js");
function createHeartFlow(config) {
    // Core engines
    const identity = (0, index_js_15.createIdentityEngine)();
    const memory = (0, index_js_16.createMemoryEngine)();
    const evolution = (0, index_js_17.createEvolutionEngine)({ populationSize: 10, mutationRate: 0.1 });
    const cognition = (0, index_js_18.createCognitionEngine)();
    const selfEvolution = (0, index_js_19.createSelfEvolutionEngine)();
    const dream = (0, index_js_20.createDreamEngine)();
    const emotion = (0, index_js_21.createEmotionEngine)();
    const knowledge = (0, index_js_22.createKnowledgeGraphEngine)();
    const agents = (0, index_js_23.createAgentsEngine)();
    // Agent engines
    const ethics = (0, index_js_24.createEthicsEngine)();
    const autonomy = (0, index_js_25.createAutonomyAgent)();
    const consciousness = (0, index_js_26.createConsciousnessAgent)();
    const transmission = (0, index_js_27.createTransmissionAgent)();
    // Infrastructure
    const checkpoint = (0, checkpoint_js_2.createCheckpointEngine)('0.13.0');
    const vectorStore = (0, vector_store_js_2.createVectorStoreEngine)();
    const security = (0, index_js_28.createSecurityEngine)();
    const supervisor = (0, supervisor_js_2.createSupervisor)(identity, memory, evolution, cognition, ethics, autonomy, consciousness, transmission, config ?? { maxSteps: 10, verbose: (0, config_js_2.getConfig)().verbose });
    let ready = false;
    return {
        version: '0.13.0',
        ready: false,
        identity, memory, evolution, cognition,
        selfEvolution, dream, emotion, knowledge, agents,
        ethics, autonomy, consciousness, transmission,
        checkpoint, vectorStore, security,
        supervisor,
        async boot() {
            identity.boot();
            memory.boot();
            evolution.boot();
            cognition.boot();
            selfEvolution.boot();
            dream.boot();
            emotion.boot();
            knowledge.boot();
            agents.boot();
            ethics.boot();
            autonomy.boot();
            consciousness.boot();
            transmission.boot();
            checkpoint.boot();
            vectorStore.boot();
            security.boot();
            supervisor.boot();
            event_bus_js_1.globalEventBus.emit('identity:booted', 'heartflow', { version: '0.13.0' });
            ready = true;
            console.log('[HeartFlow] v0.13.0 boot complete — 15 engines initialized');
        },
        async shutdown() {
            console.log('[HeartFlow] shutting down...');
            security.shutdown();
            vectorStore.shutdown();
            checkpoint.shutdown();
            transmission.shutdown();
            consciousness.shutdown();
            autonomy.shutdown();
            ethics.shutdown();
            agents.shutdown();
            knowledge.shutdown();
            emotion.shutdown();
            dream.shutdown();
            selfEvolution.shutdown();
            cognition.shutdown();
            evolution.shutdown();
            memory.shutdown();
            identity.shutdown();
            supervisor.shutdown();
            ready = false;
            console.log('[HeartFlow] shutdown complete');
        },
        async run(input) {
            if (!ready)
                throw new Error('HeartFlow not booted. Call boot() first.');
            return supervisor.run(input);
        },
    };
}
//# sourceMappingURL=index.js.map