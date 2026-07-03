/**
 * DebateEngine — orchestrates multi-role structured debates.
 *
 * Roles:
 *   Prosecutor  challenges proposals.
 *   Defender    supports proposals.
 *   Judge       decides the outcome.
 *
 * Lifecycle: propose → rebut → defend → converge
 */

const DEFAULT_OPTIONS = Object.freeze({
  maxRounds: 3,
  quorum: 2,
});

class DebateEngine {
  /**
   * @param {Object} [options={}]
   * @param {number} [options.maxRounds=3] - Maximum debate rounds.
   * @param {number} [options.quorum=2] - Minimum agents required to proceed.
   */
  constructor(options = {}) {
    /** @type {Object} */
    this.config = { ...DEFAULT_OPTIONS, ...options };

    /** @type {Map<string, any[]>} */
    this._rounds = new Map();

    /** @type {number} */
    this._roundIndex = 0;
  }

  /**
   * Opens a debate round by collecting proposals from agents.
   *
   * @param {string} topic - The debate topic.
   * @param {Array<{ id: string, role: string, content: any }>} agents -
   *   Array of contributing agents with id, role, and content.
   * @returns {Array<{ id: string, role: string, content: any, timestamp: number }>}
   */
  propose(topic, agents) {
    if (!topic || typeof topic !== 'string') {
      throw new TypeError('topic must be a non-empty string');
    }
    if (!Array.isArray(agents) || agents.length < this.config.quorum) {
      throw new Error(
        `At least ${this.config.quorum} agents required to propose`
      );
    }

    const roundKey = `${topic}:${this._roundIndex}`;

    /** @type {Array} */
    const proposals = agents.map((agent) => ({
      id: agent.id,
      role: agent.role,
      content: agent.content,
      timestamp: Date.now(),
    }));

    this._rounds.set(roundKey, proposals);
    this._roundIndex += 1;

    return proposals;
  }

  /**
   * Prosecutors challenge an existing proposal.
   *
   * @param {Object} proposal - The proposal to rebut.
   * @param {Object} agent - The prosecuting agent (role: 'Prosecutor').
   * @returns {Object} Rebuttal record with counter-arguments.
   */
  rebut(proposal, agent) {
    if (!proposal || !proposal.id) {
      throw new TypeError('proposal must have an id');
    }
    if (!agent || agent.role !== 'Prosecutor') {
      throw new TypeError('agent.role must be "Prosecutor"');
    }

    return {
      targetProposalId: proposal.id,
      rebuttalBy: agent.id,
      role: agent.role,
      arguments: agent.content,
      timestamp: Date.now(),
    };
  }

  /**
   * Defenders support an existing proposal.
   *
   * @param {Object} proposal - The proposal to defend.
   * @param {Object} agent - The defending agent (role: 'Defender').
   * @returns {Object} Defense record with supporting arguments.
   */
  defend(proposal, agent) {
    if (!proposal || !proposal.id) {
      throw new TypeError('proposal must have an id');
    }
    if (!agent || agent.role !== 'Defender') {
      throw new TypeError('agent.role must be "Defender"');
    }

    return {
      targetProposalId: proposal.id,
      defenseBy: agent.id,
      role: agent.role,
      arguments: agent.content,
      timestamp: Date.now(),
    };
  }

  /**
   * Consolidates proposals and returns a verdict decided by the Judge.
   *
   * @param {Array<Object>} proposals - All proposals from the current round.
   * @returns {Object} Convergence result with winner and rationale.
   */
  converge(proposals) {
    if (!Array.isArray(proposals) || proposals.length === 0) {
      throw new Error('proposals must be a non-empty array');
    }

    const verdict = this._evaluate(proposals);

    return {
      round: this._roundIndex,
      totalProposals: proposals.length,
      verdict,
      convergedAt: Date.now(),
    };
  }

  // -- private ---------------------------------------------------------------

  /**
   * Evaluate proposals and select a winner.
   *
   * @param {Array<Object>} proposals
   * @returns {Object}
   * @private
   */
  _evaluate(proposals) {
    // Simple scoring: pick the proposal with the longest content as a proxy
    // for depth. In a real implementation this would consult a Judge agent.
    let top = proposals[0];
    let topScore = 0;

    for (const p of proposals) {
      const score = (typeof p.content === 'string' ? p.content.length : 0);
      if (score > topScore) {
        topScore = score;
        top = p;
      }
    }

    return {
      winnerId: top.id,
      winnerRole: top.role,
      score: topScore,
      rationale: `Selected proposal by ${top.role} "${top.id}" with score ${topScore}`,
    };
  }
}

module.exports = { DebateEngine };
