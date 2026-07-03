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
