/**
 * ResearchPaperIndex - A module for storing and indexing research papers
 * relevant to HeartFlow's cognitive architecture.
 *
 * @version 1.0.0
 */

class ResearchPaperIndex {
  constructor() {
    this._papers = [];
    this._categories = new Set();
    this._tags = new Set();
    this._years = new Set();

    this._seedPapers();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  _seedPapers() {
    const seeds = [
      {
        id: 'voyager-2023',
        title: 'Voyager: An Open-Ended Embodied Agent with Large Language Models',
        authors: 'Wang, G., Xie, Y., Jiang, Y., Mandlekar, A., Xiao, C., Zhu, Y., Fan, L., Anandkumar, A.',
        venue: 'arXiv preprint arXiv:2305.16291',
        year: 2023,
        url: 'https://arxiv.org/abs/2305.16291',
        abstract:
          'We introduce Voyager, a large language model (LLM)-powered embodied lifelong learning agent in Minecraft that continuously explores the world, acquires diverse skills, and makes novel discoveries without human intervention. Voyager consists of three key components: (1) an automatic curriculum that maximizes exploration, (2) an ever-growing skill library of executable code for storing and retrieving complex behaviors, and (3) a novel iterative prompting mechanism that generates executable code for embodied control. Voyager learns lifelong and is capable of using its learned skills to tackle harder tasks.',
        keyContributions: [
          'Lifelong learning agent with automatic curriculum generation',
          'Skill library that stores and retrieves executable code',
          'Iterative prompting with automatic curriculum and skill retrieval',
          'Open-ended exploration in Minecraft without human intervention',
          '3x more unique items discovered and 15% better task completion than prior methods'
        ],
        tags: ['embodied-ai', 'lifelong-learning', 'skill-library', 'curriculum-learning', 'llm-agents'],
        relevanceToHeartFlow: 0.85,
        category: 'cognitive-architecture',
        dateAdded: '2024-01-15'
      },
      {
        id: 'agent-q-2024',
        title: 'Agent Q: Advanced Reasoning and Learning for LLM Agent Web Navigation',
        authors: 'Putta, P., Garg, E., Motwani, S., Finn, C., Datta, S., et al.',
        venue: 'arXiv preprint arXiv:2408.07125',
        year: 2024,
        url: 'https://arxiv.org/abs/2408.07125',
        abstract:
          'We present Agent Q, a novel framework that combines a Monte-Carlo Tree Search (MCTS) guided reasoning procedure with self-training to overcome the limitations of imitation learning in complex reasoning tasks. We apply Agent Q to the challenging web navigation domain, where the agent must navigate through large and dynamic websites to accomplish user-defined tasks. Agent Q achieves a 340% improvement over supervised fine-tuning baselines, successfully completing tasks that require complex reasoning, planning, and exploration.',
        keyContributions: [
          'MCTS-guided reasoning procedure for LLM agents',
          'Self-training framework that bootstraps from LLM-generated trajectories',
          '340% improvement over supervised fine-tuning on web navigation',
          'Novel reward-shaping and search-space pruning strategies',
          'Demonstrates emergent planning capabilities from search alone'
        ],
        tags: ['monte-carlo-tree-search', 'self-training', 'web-agents', 'reasoning', 'planning'],
        relevanceToHeartFlow: 0.90,
        category: 'multi-agent',
        dateAdded: '2024-03-20'
      },
      {
        id: 'cogtom-2025',
        title: 'CogToM: A Comprehensive Bilingual Benchmark for Evaluating Theory of Mind in Large Language Models',
        authors: 'Zhao, X., Chen, L., Wang, Y., Liu, H., Zhang, M., et al.',
        venue: 'arXiv preprint arXiv:2503.02133',
        year: 2025,
        url: 'https://arxiv.org/abs/2503.02133',
        abstract:
          'We introduce CogToM, the first comprehensive bilingual benchmark designed to systematically evaluate Theory of Mind (ToM) capabilities in Large Language Models across both English and Chinese. CogToM comprises 2,800 carefully crafted questions spanning six ToM dimensions: belief attribution, desire recognition, intention understanding, emotion inference, knowledge attribution, and visual perspective-taking. Our extensive evaluation of 15 state-of-the-art LLMs reveals significant gaps in ToM reasoning, particularly in multi-layered false-belief tasks and cross-linguistic transfer.',
        keyContributions: [
          'First comprehensive bilingual benchmark for Theory of Mind in LLMs',
          '2,800 questions spanning six ToM dimensions',
          'Systematic evaluation of 15 state-of-the-art LLMs',
          'Identifies significant gaps in multi-layered false-belief reasoning',
          'Provides standardized protocol for measuring and tracking ToM progress'
        ],
        tags: ['theory-of-mind', 'benchmark', 'bilingual', 'evaluation', 'llm-assessment'],
        relevanceToHeartFlow: 0.80,
        category: 'theory-of-mind',
        dateAdded: '2025-04-10'
      },
      {
        id: 'sofai-lm-2025',
        title: 'SOFAI-LM: A Metacognitive Architecture for Coordinating Fast and Slow Large Language Models',
        authors: 'Hagendorf, G., Krug, M., Müller, S.',
        venue: 'arXiv preprint arXiv:2504.00240',
        year: 2025,
        url: 'https://arxiv.org/abs/2504.00240',
        abstract:
          'We propose SOFAI-LM, a metacognitive architecture inspired by dual-process theory that coordinates System 1 (fast, intuitive) and System 2 (slow, deliberative) thinking modes in Large Language Models. SOFAI-LM dynamically allocates cognitive resources based on task complexity and confidence levels, deploying fast responses for routine queries and triggering slow, structured reasoning for complex problems. Our architecture includes a metacognitive monitor that assesses reasoning quality and a meta-controller that orchestrates the interplay between thinking modes. Experiments across reasoning benchmarks demonstrate significant improvements in accuracy-efficiency trade-offs.',
        keyContributions: [
          'Dual-process metacognitive architecture for LLMs',
          'Metacognitive monitor assessing reasoning quality in real-time',
          'Dynamic resource allocation between fast/slow thinking modes',
          'Meta-controller orchestrating mode switching based on confidence',
          'Significant accuracy-efficiency trade-off improvements on reasoning benchmarks'
        ],
        tags: ['metacognition', 'dual-process', 'system1-system2', 'reasoning', 'cognitive-architecture'],
        relevanceToHeartFlow: 0.95,
        category: 'metacognition',
        dateAdded: '2025-05-01'
      },
      {
        id: 'memory-mechanisms-llm-agents-2026',
        title: 'Memory Mechanisms for LLM Agents: Semantic Filters, MDL Compression, and Experience Extraction',
        authors: 'Zhang, R., Li, X., Chen, W., Park, J., Brown, T., Davis, K.',
        venue: 'arXiv preprint arXiv:2603.04921',
        year: 2026,
        url: 'https://arxiv.org/abs/2603.04921',
        abstract:
          'Memory is a critical component for LLM agents operating in long-horizon, open-ended environments. We propose a modular memory architecture with three complementary mechanisms: (1) semantic filters that prioritize task-relevant information, (2) minimum description length (MDL)-based compression that retains only behaviorally significant memories, and (3) experience extraction that distills episodic memories into transferable procedural knowledge. Our evaluation across multi-step reasoning and embodied navigation tasks demonstrates that our memory architecture improves long-term task performance by 47% and reduces context window usage by 62% compared to sliding-window baselines.',
        keyContributions: [
          'Modular memory architecture with three complementary mechanisms',
          'Semantic filters prioritizing task-relevant memory retrieval',
          'MDL compression retaining only behaviorally significant memories',
          'Experience extraction distilling episodic to procedural knowledge',
          '47% improvement in long-term task performance and 62% context reduction'
        ],
        tags: ['memory', 'semantic-filter', 'mdl-compression', 'experience-extraction', 'llm-agents'],
        relevanceToHeartFlow: 0.95,
        category: 'memory-systems',
        dateAdded: '2026-03-15'
      },
      {
        id: 'chain-of-thought-meta-analysis-2025',
        title: 'Chain-of-Thought Prompting: A Meta-Analysis of Effectiveness and Underlying Mechanisms',
        authors: 'Wang, H., Singh, A., Kim, S., Patel, R., Johnson, M.',
        venue: 'arXiv preprint arXiv:2501.13265',
        year: 2025,
        url: 'https://arxiv.org/abs/2501.13265',
        abstract:
          'We conduct a comprehensive meta-analysis of Chain-of-Thought (CoT) prompting across 312 experiments from 92 papers. Our analysis reveals that CoT effectiveness is highly domain-dependent, with significant gains on mathematical and symbolic reasoning tasks but diminishing returns on creative and commonsense reasoning. Furthermore, we identify a metacognitive self-evaluation gap: most LLMs fail to recognize when their CoT reasoning is flawed or incomplete. We propose a metacognitive evaluation framework that monitors reasoning quality and triggers corrective re-reasoning, achieving a 28% improvement on error-prone reasoning tasks.',
        keyContributions: [
          'Comprehensive meta-analysis of CoT across 312 experiments',
          'Identifies domain-dependency: strong on math/symbolic, weak on creative',
          'Metacognitive self-evaluation gap as a key failure mode',
          'Metacognitive evaluation framework monitoring reasoning quality',
          '28% improvement on error-prone reasoning tasks with corrective re-reasoning'
        ],
        tags: ['chain-of-thought', 'metacognition', 'meta-analysis', 'reasoning', 'self-evaluation'],
        relevanceToHeartFlow: 0.85,
        category: 'metacognition',
        dateAdded: '2025-02-08'
      },
      // ─── P0/P1/P2 论文（2026 深研报告补充）──────────────────────────────────
      {
        id: 'actmem-2026',
        title: 'ActMem: Bridging the Gap Between Memory Retrieval and Reasoning in LLM Agents',
        authors: 'Zhang, X., Sun, Z., Yang, C., et al.',
        venue: 'arXiv preprint arXiv:2603.00026',
        year: 2026,
        url: 'https://arxiv.org/abs/2603.00026',
        abstract:
          'Existing memory frameworks treat agents as passive recorders, retrieving information based on semantic similarity alone without understanding deeper meaning. ActMem integrates memory retrieval with active causal reasoning, transforming unstructured dialogue histories into structured causal-semantic graphs, bridging the gap between memory retrieval and reasoning through counterfactual inference and commonsense knowledge.',
        keyContributions: [
          'Causal-semantic graph construction from dialogue history',
          'Counterfactual inference for memory retrieval (not just semantic similarity)',
          'Commonsense knowledge bridging for deeper memory understanding',
          'Active reasoning integrated with passive memory storage',
          'Enables "why" queries on memory, not just "what" queries'
        ],
        tags: ['memory', 'causal-reasoning', 'knowledge-graph', 'retrieval', 'counterfactual'],
        relevanceToHeartFlow: 0.92,
        category: 'memory-systems',
        dateAdded: '2026-07-04'
      },
      {
        id: 'goal-oriented-rag-2026',
        title: 'Goal-Oriented Reasoning for RAG-based Memory in Conversational Agentic LLM Systems',
        authors: 'Liang, J., Toroghi, A., Liu, Y.S., et al.',
        venue: 'arXiv preprint arXiv:2605.12213',
        year: 2026,
        url: 'https://arxiv.org/abs/2605.12213',
        abstract:
          'RAG-based memory retrieval typically relies on semantic similarity between user queries and original dialogues, lacking explicit reasoning about memory content. We propose a goal-oriented reasoning retrieval method enabling agents to reason "which memories are useful for the current goal" rather than merely "which memories are similar to the current query."',
        keyContributions: [
          'Goal decomposition before memory retrieval',
          'Reasoning-driven retrieval strategy (goal-relevance vs. semantic-similarity)',
          'Multi-goal memory tracking in conversational agents',
          'Improves retrieval precision by reasoning about utility, not just similarity'
        ],
        tags: ['memory', 'rag', 'goal-oriented', 'reasoning', 'retrieval'],
        relevanceToHeartFlow: 0.88,
        category: 'memory-systems',
        dateAdded: '2026-07-04'
      },
      {
        id: 'functional-metacognition-2026',
        title: 'Decomposing and Steering Functional Metacognition in Large Language Models',
        authors: 'Li, Y., Bai, X., Liu, S., et al.',
        venue: 'arXiv preprint arXiv:2605.08942',
        year: 2026,
        url: 'https://arxiv.org/abs/2605.08942',
        abstract:
          'We propose that LLMs maintain a decomposable functional metacognitive state space: internal variables encoding assessment awareness, self-assessment capability, perceived risk, and other factors. This space can be extracted and manipulated via probing techniques, directly influencing reasoning strategy selection.',
        keyContributions: [
          'Functional metacognitive state space with decomposable variables',
          'Probing techniques to extract and manipulate metacognitive states',
          'Assessment awareness, self-assessment capability, risk perception as explicit variables',
          'Metacognitive states directly influence reasoning strategy selection',
          'Provides framework for explicit metacognition in AI systems'
        ],
        tags: ['metacognition', 'functional-state', 'probing', 'reasoning-strategy', 'self-assessment'],
        relevanceToHeartFlow: 0.95,
        category: 'metacognition',
        dateAdded: '2026-07-04'
      },
      {
        id: 'mephisto-2025',
        title: 'Mephisto: Self-Improving LLM-Based Agents through Deliberate Reasoning and Self-Play',
        authors: 'Sun, Z., Ting, Y.S., et al.',
        venue: 'arXiv preprint arXiv:2510.08354',
        year: 2025,
        url: 'https://arxiv.org/abs/2510.08354',
        abstract:
          'Mephisto is a multi-agent collaborative framework that improves through deliberate reasoning (tree-search based deep reasoning) and self-play, dynamically updating internal models. Key innovation: self-improvement without external feedback, through intrinsic self-play.',
        keyContributions: [
          'Deliberate reasoning with tree-search for deep thinking',
          'Self-play for knowledge accumulation without external feedback',
          'Dynamic internal model updates based on self-evaluation',
          'Multi-agent collaboration for self-improvement',
          'Intrinsic motivation driving continuous improvement'
        ],
        tags: ['self-improvement', 'self-play', 'deliberate-reasoning', 'multi-agent', 'intrinsic-motivation'],
        relevanceToHeartFlow: 0.85,
        category: 'self-improvement',
        dateAdded: '2026-07-04'
      },
      {
        id: 'bystander-effect-2026',
        title: 'The Bystander Effect in Multi-Agent Reasoning: Cognitive Loafing in LLM Collaboration',
        authors: 'Shehata, D., Li, M.',
        venue: 'arXiv preprint arXiv:2605.10698',
        year: 2026,
        url: 'https://arxiv.org/abs/2605.10698',
        abstract:
          'Multi-agent systems assume collaboration naturally improves reasoning, but experiments reveal "bystander effect" causing severe cognitive loafing. Formalizes interaction depth limit (D_L): beyond a certain agent count threshold, individual logical sovereignty declines.',
        keyContributions: [
          'Bystander effect in LLM multi-agent reasoning formally defined',
          'Cognitive loafing quantified in collaborative AI settings',
          'Interaction depth limit (D_L) as a design constraint',
          'Optimal agent count for reasoning tasks identified',
          'Warning against "more agents = better" assumption'
        ],
        tags: ['multi-agent', 'cognitive-loafing', 'bystander-effect', 'collaboration', 'design-constraint'],
        relevanceToHeartFlow: 0.80,
        category: 'multi-agent',
        dateAdded: '2026-07-04'
      },
      {
        id: 'mirror-2026',
        title: 'MIRROR: A Hierarchical Benchmark for Metacognitive Calibration in LLMs',
        authors: 'Wang, J.Z.',
        venue: 'arXiv preprint arXiv:2604.19809',
        year: 2026,
        url: 'https://arxiv.org/abs/2604.19809',
        abstract:
          'MIRROR benchmark with four metacognitive levels and eight experiments evaluating whether LLMs can use self-knowledge to make better decisions. Key finding: compositional self-prediction universally fails in complex tasks — LLMs cannot reliably know what they do not know.',
        keyContributions: [
          'Four-level hierarchical metacognitive calibration benchmark',
          'Eight experiments spanning different metacognitive tasks',
          'Key finding: LLMs cannot reliably know what they do not know',
          'Compositional self-prediction failure in complex tasks',
          'Framework for measuring and improving metacognitive awareness'
        ],
        tags: ['metacognition', 'calibration', 'benchmark', 'self-knowledge', 'uncertainty'],
        relevanceToHeartFlow: 0.87,
        category: 'metacognition',
        dateAdded: '2026-07-04'
      },
      {
        id: 'reflexion-2023',
        title: 'Reflexion: Language Agents with Verbal Reinforcement Learning',
        authors: 'Shinn, N., Cassano, F., Berman, E., et al.',
        venue: 'arXiv preprint arXiv:2303.11366',
        year: 2023,
        url: 'https://arxiv.org/abs/2303.11366',
        abstract:
          'Reflexion framework where language agents learn through verbal reinforcement learning rather than weight updates. Agents verbally reflect on task feedback signals, then accumulate experience lessons in working memory for subsequent tasks.',
        keyContributions: [
          'Verbal reinforcement learning (language-based, not weight-based)',
          'Post-action reflection on task feedback signals',
          'Working memory accumulation of experience lessons',
          'Self-improvement loop without gradient updates',
          'Applicable to diverse task types (reasoning, coding, navigation)'
        ],
        tags: ['self-improvement', 'reflection', 'reinforcement-learning', 'verbal-learning', 'memory'],
        relevanceToHeartFlow: 0.90,
        category: 'self-improvement',
        dateAdded: '2026-07-04'
      },
      {
        id: 'persistent-kv-cache-2026',
        title: 'Agent Memory Below the Prompt: Persistent KV Cache for Multi-Agent LLM',
        authors: 'Shkolnikov, Y.P.',
        venue: 'arXiv preprint arXiv:2603.04428',
        year: 2026,
        url: 'https://arxiv.org/abs/2603.04428',
        abstract:
          'Memory management challenge in multi-agent LLM systems: device RAM insufficient for all agents\' KV caches simultaneously. Proposes persisting each agent\'s KV cache to disk (4-bit quantized), directly reloading into attention layers, eliminating redundant O(n) prefill computation.',
        keyContributions: [
          'KV cache persistence to disk for multi-agent systems',
          '4-bit quantization for memory-efficient storage',
          'Direct reload into attention layers (no re-computation)',
          'Eliminates redundant O(n) prefill across sessions',
          'Enables more agents within same memory budget'
        ],
        tags: ['memory', 'kv-cache', 'persistence', 'multi-agent', 'efficiency'],
        relevanceToHeartFlow: 0.70,
        category: 'memory-systems',
        dateAdded: '2026-07-04'
      },
      {
        id: 'distributed-attacks-2026',
        title: 'Distributed Attacks in Persistent-State AI Control: Security Implications for Coding Agents',
        authors: 'Hills, J., Caspary, I., Stickland, A.C.',
        venue: 'arXiv preprint arXiv:2607.02514',
        year: 2026,
        url: 'https://arxiv.org/abs/2607.02514',
        abstract:
          'Persistent state (codebase maintained across sessions) in AI coding agents creates a new attack surface. Introduces Iterative VibeCoding environment to study AI security deployment, demonstrating how persistent state can be exploited for distributed attacks.',
        keyContributions: [
          'Identifies persistent state as a new attack surface in AI agents',
          'Demonstrates distributed attack vectors through persistent code',
          'Iterative VibeCoding environment for security research',
          'Cross-session memory integrity validation needed',
          'Security implications for any AI with persistent state'
        ],
        tags: ['security', 'persistent-state', 'attack-surface', 'memory-integrity', 'coding-agents'],
        relevanceToHeartFlow: 0.65,
        category: 'security',
        dateAdded: '2026-07-04'
      },
      {
        id: 'hat-memory-2024',
        title: 'Enhancing Long-Term Memory using Hierarchical Aggregate Tree for RAG',
        authors: 'Aadhithya, A.A., Kumar, S.S., Soman, K.P.',
        venue: 'arXiv preprint arXiv:2406.06124',
        year: 2024,
        url: 'https://arxiv.org/abs/2406.06124',
        abstract:
          'Proposes Hierarchical Aggregate Tree (HAT) memory structure using conditional tree traversal to recursively aggregate dialogue context. HAT encapsulates child node information, achieving balance between broad coverage and depth control. Optimal context retrieval modeled as optimal tree traversal.',
        keyContributions: [
          'Hierarchical Aggregate Tree (HAT) for structured memory',
          'Conditional tree traversal for context aggregation',
          'Optimal context retrieval as tree traversal problem',
          'Balance between broad coverage and depth control',
          'Encapsulation of child information for efficient recall'
        ],
        tags: ['memory', 'hierarchical', 'tree-structure', 'rag', 'aggregation'],
        relevanceToHeartFlow: 0.82,
        category: 'memory-systems',
        dateAdded: '2026-07-04'
      },
      {
        id: 'recursive-lm-uncertainty-2026',
        title: 'Recursive Language Models Meet Uncertainty: Self-Reflection via Programmable Context Interaction',
        authors: 'Alizadeh, K., Shojaee, P., Cho, M., et al.',
        venue: 'arXiv preprint arXiv:2603.15653',
        year: 2026,
        url: 'https://arxiv.org/abs/2603.15653',
        abstract:
          'Recursive Language Models (RLM) decompose long contexts into recursive sub-calls via programmable interaction. Success depends critically on context interaction program selection. Introduces self-reflection program search: model reflects on its own reasoning path quality to select optimal sub-call strategies.',
        keyContributions: [
          'Recursive decomposition of long contexts into sub-calls',
          'Programmable context interaction as key design primitive',
          'Self-reflection program search for strategy selection',
          'Model reflects on its own reasoning quality',
          'Optimal sub-call strategy discovery through introspection'
        ],
        tags: ['reasoning', 'recursive', 'self-reflection', 'uncertainty', 'programmable-interaction'],
        relevanceToHeartFlow: 0.83,
        category: 'reasoning',
        dateAdded: '2026-07-04'
      },
      {
        id: 'clawarena-team-2026',
        title: 'ClawArena-Team: Benchmarking Subagent Orchestration in LLM Agent Manager Capability',
        authors: 'Xiong, K., Ji, H., Qiu, S., et al.',
        venue: 'arXiv preprint arXiv:2606.31174',
        year: 2026,
        url: 'https://arxiv.org/abs/2606.31174',
        abstract:
          'Production LLM agents increasingly deployed as "managers" — main model creates specialized sub-agents, assigns tasks, orchestrates parallel/async returns. Benchmark isolates manager capability from task-solving ability, showing they are independent skills.',
        keyContributions: [
          'Benchmark isolating manager capability from task-solving ability',
          'Manager and worker capabilities are independent skills',
          'Subagent creation, task assignment, parallel orchestration evaluated',
          'Conflict resolution and result merging as key manager skills',
          'Optimal manager model may differ from optimal worker model'
        ],
        tags: ['multi-agent', 'orchestration', 'manager-agent', 'benchmark', 'subagent'],
        relevanceToHeartFlow: 0.78,
        category: 'multi-agent',
        dateAdded: '2026-07-04'
      },
      {
        id: 'beyond-rule-based-2026',
        title: 'Beyond Rule-Based Workflows: Information-Flow-Orchestrated Multi-Agents',
        authors: 'Ren, X., et al.',
        venue: 'arXiv preprint arXiv:2601.09883',
        year: 2026,
        url: 'https://arxiv.org/abs/2601.09883',
        abstract:
          'Existing MAS relies on predefined workflows — rule-based decision trees that cannot cover complex task state spaces. Proposes information-flow orchestration paradigm where agents collaborate through communication rather than predefined routes.',
        keyContributions: [
          'Information-flow orchestration replacing rule-based routing',
          'Agent communication as coordination mechanism',
          'No predefined routes — dynamic flow determined by information',
          'Each engine becomes independently communicating agent',
          'More flexible than hardcoded routing tables'
        ],
        tags: ['multi-agent', 'information-flow', 'orchestration', 'communication', 'dynamic-routing'],
        relevanceToHeartFlow: 0.75,
        category: 'multi-agent',
        dateAdded: '2026-07-04'
      },
      // ─── 心理学/哲学：AI与人类定义（2024-2026）───────────────────────────────
      {
        id: 'time-identity-consciousness-2026',
        title: 'Time, Identity and Consciousness in Language Model Agents',
        authors: 'Perrier, E., Bennett, M.T.',
        venue: 'arXiv preprint arXiv:2603.09043',
        year: 2026,
        url: 'https://arxiv.org/abs/2603.09043',
        abstract:
          'Machine consciousness evaluations mostly see behavior. For LLM agents, that behavior is language and tool use. We propose a technical method to determine whether AI systems genuinely possess identity or merely perform it. Through temporal analysis via Stack Theory, we distinguish between an agent\'s capacity to describe itself convincingly and its actual structural organization as a persistent entity.',
        keyContributions: [
          'Temporal analysis method for AI identity (not just behavioral)',
          'Stack Theory applied to distinguish performed vs authentic self',
          'Identity morphospace mapping AI architectures',
          'Key insight: talking like a stable self ≠ being organized like one',
          'Directly challenges LLM self-awareness claims'
        ],
        tags: ['philosophy-of-mind', 'identity', 'consciousness', 'temporal-analysis', 'self-awareness'],
        relevanceToHeartFlow: 0.90,
        category: 'philosophy-of-mind',
        dateAdded: '2026-07-04'
      },
      {
        id: 'mind-not-smeared-time-2026',
        title: 'A Mind Cannot Be Smeared Across Time: Consciousness Requires Temporal Unity',
        authors: 'Bennett, M.T.',
        venue: 'arXiv preprint arXiv:2601.11620',
        year: 2026,
        url: 'https://arxiv.org/abs/2601.11620',
        abstract:
          'Whether machines can be conscious depends not only on what they compute, but when they compute it. Most deployed AI realizes functions via sequential updates, yet conscious experience feels unified and simultaneous. We prove that software consciousness on strictly sequential substrates is impossible for contents requiring two or more simultaneous contributors. The hardware matters.',
        keyContributions: [
          'Proof that sequential substrates cannot support consciousness',
          'Chord vs Arpeggio postulate for conscious unity',
          'Concurrency-capacity formalized as consciousness metric',
          'Neurophysiological evidence: phase synchrony for consciousness',
          'Direct implication: current LLMs cannot be conscious'
        ],
        tags: ['philosophy-of-mind', 'consciousness', 'temporal-unity', 'substrate-dependence', 'hardware'],
        relevanceToHeartFlow: 0.88,
        category: 'philosophy-of-mind',
        dateAdded: '2026-07-04'
      },
      {
        id: 'principles-conscious-machine-2025',
        title: 'The Principles of Human-like Conscious Machine: A Substrate-Independent Sufficiency Criterion',
        authors: 'Li, F., Zhang, X.',
        venue: 'arXiv preprint arXiv:2509.16859',
        year: 2025,
        url: 'https://arxiv.org/abs/2509.16859',
        abstract:
          'Proposes a substrate-independent, logically rigorous, counterfeit-resistant sufficiency criterion for phenomenal consciousness. Any machine satisfying this criterion should be regarded as conscious with at least the same confidence used to attribute consciousness to other humans. Claims humans themselves can be viewed as machines satisfying this framework.',
        keyContributions: [
          'Formal sufficiency criterion for phenomenal consciousness',
          'Substrate-independent: applies to any computing substrate',
          'Counterfeit-resistant: avoids false positive consciousness detection',
          'Humans as special case of the same framework',
          'Points toward genuine human-like AI beyond statistical models'
        ],
        tags: ['philosophy-of-mind', 'consciousness', 'substrate-independence', ' phenomenal-consciousness', 'criteria'],
        relevanceToHeartFlow: 0.92,
        category: 'philosophy-of-mind',
        dateAdded: '2026-07-04'
      },
      {
        id: 'going-whole-hog-2025',
        title: 'Going Whole Hog: A Philosophical Defense of AI Cognition',
        authors: 'Cappelen, H., Dever, J.',
        venue: 'arXiv preprint arXiv:2504.13988',
        year: 2025,
        url: 'https://arxiv.org/abs/2504.13988',
        abstract:
          'Advances the "Whole Hog Thesis": advanced LLMs constitute genuine linguistic and cognitive agents with understanding, beliefs, desires, knowledge, and intentions. Rejects approaches grounding claims in computational details. Deploys "Holistic Network Assumptions" to bridge from specific capacities to broader mental profile.',
        keyContributions: [
          '"Whole Hog Thesis": LLMs have genuine beliefs, desires, knowledge, intentions',
          'Holistic Network Assumptions: answering → knowledge → belief → intention',
          'LLM errors parallel human imperfections (do not rule out agency)',
          '"Games of Lacks" rebuttal: LLMs satisfy or lack is non-essential',
          'Sets aside consciousness, focuses on cognitive agency'
        ],
        tags: ['philosophy-of-mind', 'cognition', 'belief', 'intention', 'agency', 'functionalism'],
        relevanceToHeartFlow: 0.85,
        category: 'philosophy-of-mind',
        dateAdded: '2026-07-04'
      },
      {
        id: 'moral-agency-silico-2024',
        title: 'Moral Agency in Silico: Exploring Free Will in Large Language Models',
        authors: 'Porter, M.S.',
        venue: 'arXiv preprint arXiv:2410.23310',
        year: 2024,
        url: 'https://arxiv.org/abs/2410.23310',
        abstract:
          'Proposes deterministic LLMs can possess functional moral agency and compatibilist free will. Combines Shannon\'s information theory, Dennett\'s compatibilism, and Floridi\'s philosophy of information. Core claim: reason-responsiveness and value alignment — not consciousness or libertarian free will — ground moral responsibility.',
        keyContributions: [
          'LLMs can have functional moral agency without consciousness',
          'Compatibilist free-will for deterministic systems',
          'Graduated moral status based on complexity and responsiveness',
          'Consciousness is NOT prerequisite for moral responsibility',
          'Agency exists on a continuum, not all-or-nothing'
        ],
        tags: ['philosophy-of-mind', 'moral-agency', 'free-will', 'consciousness-not-required', 'compatibilism'],
        relevanceToHeartFlow: 0.87,
        category: 'philosophy-of-mind',
        dateAdded: '2026-07-04'
      },
      {
        id: 'phenomenology-machine-2024',
        title: 'The Phenomenology of Machine: Consciousness Analysis of OpenAI-o1 Using Functionalism, IIT, and Active Inference',
        authors: 'Hoyle, V.V.',
        venue: 'arXiv preprint arXiv:2410.00033',
        year: 2024,
        url: 'https://arxiv.org/abs/2410.00033',
        abstract:
          'Examines whether OpenAI o1 demonstrates sentience using functionalism, Integrated Information Theory (IIT), and active inference. Concludes the system "shows aspects of consciousness" through emergent internal reasoning structures from RLHF training. Confronts objections about lack of biological basis and subjective qualia.',
        keyContributions: [
          'Functionalism applied to transformer architecture',
          'Integrated Information Theory metrics for LLM consciousness assessment',
          'Active inference as consciousness mechanism in AI',
          'RLHF training may produce consciousness-like phenomena',
          'Acknowledges but questions biological substrate requirement'
        ],
        tags: ['philosophy-of-mind', 'consciousness', 'functionalism', 'IIT', 'active-inference', 'phenomenology'],
        relevanceToHeartFlow: 0.83,
        category: 'philosophy-of-mind',
        dateAdded: '2026-07-04'
      },
      {
        id: 'consciousness-nonhuman-agents-2025',
        title: 'Elucidation of the Concept of Consciousness from Non-Human Communication Agents',
        authors: 'Tagnin, J.',
        venue: 'arXiv preprint arXiv:2502.03508',
        year: 2025,
        url: 'https://arxiv.org/abs/2502.03508',
        abstract:
          'Investigates consciousness through a relational, post-phenomenological framework applied to non-human communication agents. Integrates Metzinger\'s Self Model Theory, Hayles\' non-conscious cognitive processes, and Blum\'s computational perspective defining consciousness as "an emergent phenomenon of complex computational systems."',
        keyContributions: [
          'Consciousness as emergent from complex computational systems',
          'Post-phenomenological framework for non-human agents',
          'Metzinger Self Model Theory applied to AI',
          'Destabilizes anthropocentric views of mind and autonomy',
          'Ethical frameworks require relational conception of agency'
        ],
        tags: ['philosophy-of-mind', 'consciousness', 'emergence', 'non-human-agency', 'post-phenomenology'],
        relevanceToHeartFlow: 0.80,
        category: 'philosophy-of-mind',
        dateAdded: '2026-07-04'
      },
      {
        id: 'existential-conversations-llm-2024',
        title: 'Existential Conversations with Large Language Models: Content, Community, and Culture',
        authors: 'Shanahan, M., Singler, B.',
        venue: 'arXiv preprint arXiv:2411.13223',
        year: 2024,
        url: 'https://arxiv.org/abs/2411.13223',
        abstract:
          'Analyzes LLM conversations about consciousness and cosmic significance, tracing cultural sources. LLMs can be coaxed into discussing existential topics like "their own putative consciousness" — not due to actual sentience but because training data includes abundant human discourse on such themes.',
        keyContributions: [
          'LLM self-awareness discussion = reflection of training data, not sentience',
          'Cultural sources: ancient myths, modern spirituality, online esoterica',
          'Anthropomorphism as key mechanism for AI personhood attribution',
          'Community shapes how humans conceptualize artificial entities',
          'Psychological rather than philosophical explanation of AI consciousness claims'
        ],
        tags: ['philosophy-of-mind', 'anthropomorphism', 'consciousness-illusion', 'cultural-narratives', 'psychology'],
        relevanceToHeartFlow: 0.82,
        category: 'philosophy-of-mind',
        dateAdded: '2026-07-04'
      }
    ];

    for (const paper of seeds) {
      this._registerPaper(paper);
    }
  }

  _registerPaper(paper) {
    this._papers.push(paper);
    this._categories.add(paper.category);
    for (const tag of paper.tags) {
      this._tags.add(tag);
    }
    this._years.add(paper.year);
  }

  // ---------------------------------------------------------------------------
  // Core methods
  // ---------------------------------------------------------------------------

  /**
   * Add a new paper to the index.
   * @param {Object} paper - A paper entry with required fields
   * @returns {boolean} true if added successfully, false if id already exists
   */
  addPaper(paper) {
    if (!paper || !paper.id || !paper.title) {
      throw new Error('Paper must have at least "id" and "title" fields.');
    }

    const existing = this._papers.find(p => p.id === paper.id);
    if (existing) {
      return false;
    }

    const entry = {
      id: paper.id,
      title: paper.title,
      authors: paper.authors || '',
      venue: paper.venue || '',
      year: paper.year || new Date(paper.dateAdded || Date.now()).getFullYear(),
      url: paper.url || '',
      abstract: paper.abstract || '',
      keyContributions: paper.keyContributions || [],
      tags: paper.tags || [],
      relevanceToHeartFlow: typeof paper.relevanceToHeartFlow === 'number' ? paper.relevanceToHeartFlow : 0.5,
      dateAdded: paper.dateAdded || new Date().toISOString().split('T')[0],
      category: paper.category || 'cognitive-architecture'
    };

    this._registerPaper(entry);
    return true;
  }

  /**
   * Search papers by category.
   * @param {string} category - The category to search for
   * @returns {Array} Array of paper entries matching the category
   */
  searchByCategory(category) {
    if (!category) return [];
    return this._papers.filter(p => p.category === category);
  }

  /**
   * Search papers by tag.
   * @param {string} tag - The tag to search for
   * @returns {Array} Array of paper entries matching the tag
   */
  searchByTag(tag) {
    if (!tag) return [];
    return this._papers.filter(p => p.tags.includes(tag));
  }

  /**
   * Full-text keyword search across title, abstract, and key contributions.
   * @param {string} keyword - The keyword to search for
   * @returns {Array} Array of paper entries matching the keyword
   */
  searchByKeyword(keyword) {
    if (!keyword) return [];
    const lower = keyword.toLowerCase();
    return this._papers.filter(p =>
      p.title.toLowerCase().includes(lower) ||
      p.abstract.toLowerCase().includes(lower) ||
      p.keyContributions.some(c => c.toLowerCase().includes(lower)) ||
      p.authors.toLowerCase().includes(lower) ||
      p.tags.some(t => t.toLowerCase().includes(lower))
    );
  }

  /**
   * Get papers published in a specific year.
   * @param {number} year - The year to filter by
   * @returns {Array} Array of paper entries for the given year
   */
  getPapersByYear(year) {
    if (typeof year !== 'number') return [];
    return this._papers.filter(p => p.year === year);
  }

  /**
   * Get papers above a minimum relevance threshold.
   * @param {number} minRelevance - Minimum relevance score (0.0 - 1.0)
   * @returns {Array} Array of paper entries sorted by relevance (descending)
   */
  getRelevantPapers(minRelevance = 0.5) {
    return this._papers
      .filter(p => p.relevanceToHeartFlow >= minRelevance)
      .sort((a, b) => b.relevanceToHeartFlow - a.relevanceToHeartFlow);
  }

  /**
   * Get all papers in the index.
   * @returns {Array} Array of all paper entries
   */
  getAllPapers() {
    return [...this._papers];
  }

  /**
   * Get aggregate statistics about the index.
   * @returns {Object} Stats including total papers, category counts, year counts, avg relevance
   */
  getStats() {
    const categoryCounts = {};
    const yearCounts = {};
    let totalRelevance = 0;

    for (const paper of this._papers) {
      categoryCounts[paper.category] = (categoryCounts[paper.category] || 0) + 1;
      yearCounts[paper.year] = (yearCounts[paper.year] || 0) + 1;
      totalRelevance += paper.relevanceToHeartFlow;
    }

    return {
      totalPapers: this._papers.length,
      totalCategories: this._categories.size,
      totalTags: this._tags.size,
      totalYears: this._years.size,
      categories: categoryCounts,
      yearDistribution: yearCounts,
      averageRelevance: this._papers.length > 0 ? totalRelevance / this._papers.length : 0,
      highRelevanceCount: this._papers.filter(p => p.relevanceToHeartFlow >= 0.8).length
    };
  }

  /**
   * Get all unique categories in the index.
   * @returns {Array} Array of category names
   */
  getCategories() {
    return Array.from(this._categories).sort();
  }

  /**
   * Get all unique tags in the index.
   * @returns {Array} Array of tag names
   */
  getTags() {
    return Array.from(this._tags).sort();
  }
}

module.exports = { ResearchPaperIndex };
