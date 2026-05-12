// HeartFlow v0.13 — Autonomous Decision Engine
// 主导出：整合所有引擎的一站式 API

export type { EventBus, Event, EventType } from './runtime/event-bus.js';
export type { HeartFlowConfig } from './runtime/config.js';

// Core Engines
export type { IdentityEngine, IdentityStateData, CoreIdentity } from './core/identity/index.js';
export type { MemoryEngine, MemoryEntry } from './core/memory/index.js';
export type { EvolutionEngine, EvolutionResult, EvolutionConfig } from './core/evolution/index.js';
export type { CognitionEngine, ReasoningTrace, Plan } from './core/cognition/index.js';
export type { SelfEvolutionEngine, SelfEvolutionResult, GrowthMetrics } from './core/self-evolution/index.js';
export type { DreamEngine, DreamResult, Insight } from './core/dream/index.js';
export type { EmotionEngine, EmotionState } from './core/emotion/index.js';
export type { KnowledgeGraphEngine, KGNode, KGEdge } from './core/knowledge/index.js';
export type { AgentsEngine, MultiAgentResult } from './core/agents/index.js';

// Agent Engines
export type { EthicsEngine, EthicalJudgment } from './agent/ethics/index.js';
export type { AutonomyAgent, AutonomyDecision } from './agent/autonomy/index.js';
export type { ConsciousnessAgent, ConsciousnessEvent, ConsciousnessState } from './agent/consciousness/index.js';
export type { TransmissionAgent, TransmissionResult } from './agent/transmission/index.js';

// Storage & Security
export type { CheckpointEngine, Checkpoint } from './storage/checkpoint.js';
export type { VectorStoreEngine, VectorEntry, SearchResult } from './storage/vector-store.js';
export type { SecurityEngine, InjectionResult, SanitizedInput, PIIResult } from './security/index.js';

// Orchestrator
export type { Supervisor, AgentInput, AgentOutput } from './orchestrator/supervisor.js';

// Factory exports
export { createIdentityEngine } from './core/identity/index.js';
export { createMemoryEngine } from './core/memory/index.js';
export { createEvolutionEngine } from './core/evolution/index.js';
export { createCognitionEngine } from './core/cognition/index.js';
export { createSelfEvolutionEngine } from './core/self-evolution/index.js';
export { createDreamEngine } from './core/dream/index.js';
export { createEmotionEngine } from './core/emotion/index.js';
export { createKnowledgeGraphEngine } from './core/knowledge/index.js';
export { createAgentsEngine } from './core/agents/index.js';
export { createEthicsEngine } from './agent/ethics/index.js';
export { createAutonomyAgent } from './agent/autonomy/index.js';
export { createConsciousnessAgent } from './agent/consciousness/index.js';
export { createTransmissionAgent } from './agent/transmission/index.js';
export { createCheckpointEngine } from './storage/checkpoint.js';
export { createVectorStoreEngine } from './storage/vector-store.js';
export { createSecurityEngine } from './security/index.js';
export { createSupervisor } from './orchestrator/supervisor.js';
export { getConfig, setConfig } from './runtime/config.js';

// Main HeartFlow Engine
import { createIdentityEngine } from './core/identity/index.js';
import { createMemoryEngine } from './core/memory/index.js';
import { createEvolutionEngine } from './core/evolution/index.js';
import { createCognitionEngine } from './core/cognition/index.js';
import { createSelfEvolutionEngine } from './core/self-evolution/index.js';
import { createDreamEngine } from './core/dream/index.js';
import { createEmotionEngine } from './core/emotion/index.js';
import { createKnowledgeGraphEngine } from './core/knowledge/index.js';
import { createAgentsEngine } from './core/agents/index.js';
import { createEthicsEngine } from './agent/ethics/index.js';
import { createAutonomyAgent } from './agent/autonomy/index.js';
import { createConsciousnessAgent } from './agent/consciousness/index.js';
import { createTransmissionAgent } from './agent/transmission/index.js';
import { createCheckpointEngine } from './storage/checkpoint.js';
import { createVectorStoreEngine } from './storage/vector-store.js';
import { createSecurityEngine } from './security/index.js';
import { createSupervisor, type SupervisorConfig } from './orchestrator/supervisor.js';
import { globalEventBus } from './runtime/event-bus.js';
import { getConfig } from './runtime/config.js';

export interface HeartFlowEngine {
  version: string;
  boot(): Promise<void>;
  shutdown(): Promise<void>;
  ready: boolean;

  // Core
  identity: ReturnType<typeof createIdentityEngine>;
  memory: ReturnType<typeof createMemoryEngine>;
  evolution: ReturnType<typeof createEvolutionEngine>;
  cognition: ReturnType<typeof createCognitionEngine>;
  selfEvolution: ReturnType<typeof createSelfEvolutionEngine>;
  dream: ReturnType<typeof createDreamEngine>;
  emotion: ReturnType<typeof createEmotionEngine>;
  knowledge: ReturnType<typeof createKnowledgeGraphEngine>;
  agents: ReturnType<typeof createAgentsEngine>;

  // Agent
  ethics: ReturnType<typeof createEthicsEngine>;
  autonomy: ReturnType<typeof createAutonomyAgent>;
  consciousness: ReturnType<typeof createConsciousnessAgent>;
  transmission: ReturnType<typeof createTransmissionAgent>;

  // Infrastructure
  checkpoint: ReturnType<typeof createCheckpointEngine>;
  vectorStore: ReturnType<typeof createVectorStoreEngine>;
  security: ReturnType<typeof createSecurityEngine>;

  supervisor: ReturnType<typeof createSupervisor>;
  run(input: { task: string; context?: Record<string, unknown> }): Promise<{ result: unknown; reasoning: string; steps: number; success: boolean }>;
}

export function createHeartFlow(config?: SupervisorConfig): HeartFlowEngine {
  // Core engines
  const identity = createIdentityEngine();
  const memory = createMemoryEngine();
  const evolution = createEvolutionEngine({ populationSize: 10, mutationRate: 0.1 });
  const cognition = createCognitionEngine();
  const selfEvolution = createSelfEvolutionEngine();
  const dream = createDreamEngine();
  const emotion = createEmotionEngine();
  const knowledge = createKnowledgeGraphEngine();
  const agents = createAgentsEngine();

  // Agent engines
  const ethics = createEthicsEngine();
  const autonomy = createAutonomyAgent();
  const consciousness = createConsciousnessAgent();
  const transmission = createTransmissionAgent();

  // Infrastructure
  const checkpoint = createCheckpointEngine('0.13.0');
  const vectorStore = createVectorStoreEngine();
  const security = createSecurityEngine();

  const supervisor = createSupervisor(
    identity, memory, evolution, cognition,
    ethics, autonomy, consciousness, transmission,
    config ?? { maxSteps: 10, verbose: getConfig().verbose }
  );

  let ready = false;

  return {
    version: '0.13.0',
    ready: false,

    identity, memory, evolution, cognition,
    selfEvolution, dream, emotion, knowledge, agents,
    ethics, autonomy, consciousness, transmission,
    checkpoint, vectorStore, security,
    supervisor,

    async boot(): Promise<void> {
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

      globalEventBus.emit('identity:booted', 'heartflow', { version: '0.13.8' });
      ready = true;
      console.log('[HeartFlow] v0.13.8 boot complete — 15 engines initialized');
    },

    async shutdown(): Promise<void> {
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

    async run(input): Promise<{ result: unknown; reasoning: string; steps: number; success: boolean }> {
      if (!ready) throw new Error('HeartFlow not booted. Call boot() first.');
      return supervisor.run(input);
    },
  };
}
