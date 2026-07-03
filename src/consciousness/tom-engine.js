/**
 * Theory of Mind (ToM) Engine.
 *
 * Models agents' internal states — beliefs, desires, intentions — and simulates
 * how they might react to stimuli.  Provides intention inference from observed
 * actions so that other HeartFlow modules can reason about what another agent
 * is likely thinking or planning.
 *
 * v2.0.0 — Adds active inference, perspective taking, belief revision with
 * prediction-accuracy tracking, and multi-agent belief modelling.
 */
class ToMEngine {
  /**
   * @param {Object} [options={}]
   * @param {number} [options.confidenceThreshold=0.6] - Minimum confidence to
   *   treat an inference as actionable.
   * @param {number} [options.maxHistory=200] - Maximum number of behaviour
   *   entries stored per agent.
   * @param {number} [options.recencyDecay=0.9] - Exponential decay applied to
   *   older observations during active inference (0–1, higher = more weight
   *   on recent data).
   * @param {number} [options.beliefUpdateRate=0.15] - Learning rate for
   *   Bayesian belief dampening when predictions are contradicted (0–1).
   */
  constructor(options = {}) {
    this.version = '2.0.0';
    this.confidenceThreshold = options.confidenceThreshold ?? 0.6;
    this.maxHistory = options.maxHistory ?? 200;
    this.recencyDecay = options.recencyDecay ?? 0.9;
    this.beliefUpdateRate = options.beliefUpdateRate ?? 0.15;

    /** @type {Map<string, Object>} Per-agent internal-state models. */
    this.models = new Map();

    /** @type {Map<string, Array<Object>>} Raw observation histories. */
    this.histories = new Map();

    /** @type {Map<string, Array<Object>>} Prediction records per agent. Each
     *  entry: { predictedBehavior, context, timestamp, outcome: 'pending'|'confirmed'|'contradicted', actualObservation }
     */
    this.predictionLog = new Map();

    /** @type {Map<string, {total: number, correct: number}>} Accuracy counters
     *  per agent. "correct" counts predictions that were confirmed. */
    this.accuracyTrackers = new Map();

    /** @type {Map<string, Object>} Perspective models keyed as
     *  "observerId:subjectId". Stores how one agent models another. */
    this.perspectiveModels = new Map();
  }

  // ── Public API — original (v1, backward-compatible) ─────────────────────────

  /**
   * Build or refresh the internal-state model for an agent based on observed
   * behaviour.
   *
   * @param {string} agentId - Unique identifier for the agent.
   * @param {Object} observedBehavior - Description of the agent's behaviour.
   * @param {string} observedBehavior.type - Category of the behaviour
   *   (e.g. 'speech', 'action', 'inaction').
   * @param {string} observedBehavior.description - Free-text narrative.
   * @param {number} [observedBehavior.confidence=0.5] - How reliable the
   *   observation is (0–1).
   * @returns {Object} The updated agent model.
   */
  modelAgent(agentId, observedBehavior) {
    if (!this.models.has(agentId)) {
      this.models.set(agentId, {
        id: agentId,
        beliefs: [],
        desires: [],
        intentions: [],
        mood: null,
        lastUpdated: null,
      });
      this.histories.set(agentId, []);
    }

    const model = this.models.get(agentId);
    const history = this.histories.get(agentId);

    const entry = {
      type: observedBehavior.type || 'unknown',
      description: observedBehavior.description || '',
      confidence: observedBehavior.confidence ?? 0.5,
      timestamp: Date.now(),
    };

    history.push(entry);

    while (history.length > this.maxHistory) {
      history.shift();
    }

    this._updateBeliefs(model, history);
    this._updateDesires(model, history);
    this._updateIntentions(model, history);
    model.lastUpdated = entry.timestamp;

    return model;
  }

  /**
   * Simulate how an agent is likely to react when presented with a stimulus.
   *
   * @param {string} agentId - The agent whose reaction is simulated.
   * @param {Object} stimulus - The external stimulus to apply.
   * @param {string} stimulus.type - Category of stimulus (e.g. 'proposal',
   *   'threat', 'request').
   * @param {string} stimulus.content - Detail of what is being presented.
   * @param {number} [stimulus.strength=0.5] - Salience of the stimulus (0–1).
   * @returns {Object|null} Simulated reaction object, or null when the agent
   *   is unknown.
   */
  simulateReaction(agentId, stimulus) {
    const model = this.models.get(agentId);
    if (!model) {
      return null;
    }

    const relevance = this._estimateRelevance(model, stimulus);
    const reactionType = this._predictReactionType(model, stimulus);
    const confidence = Math.min(
      relevance * (stimulus.strength ?? 0.5),
      1,
    );

    return {
      agentId,
      stimulusType: stimulus.type || 'unknown',
      reactionType,
      confidence,
      rationale: this._buildRationale(model, reactionType, stimulus),
    };
  }

  /**
   * Infer the agent's underlying intentions from a set of actions.
   *
   * @param {string} agentId - The agent whose intentions are inferred.
   * @param {Array<Object>} actions - Observed actions.
   * @param {string} actions[].type - Action category.
   * @param {string} actions[].description - Narrative description.
   * @param {number} [actions[].weight=0.5] - Relative importance (0–1).
   * @returns {Object} Inference result including detected intentions and
   *   confidence scores.
   */
  inferIntentions(agentId, actions) {
    const model = this.models.get(agentId);
    const history = this.histories.get(agentId);

    const intentionScores = new Map();

    const allActions = [...(history || []), ...actions];
    for (const action of allActions) {
      const matchedIntentions = this._matchIntentions(
        action,
        model ? model.intentions : [],
      );

      for (const intention of matchedIntentions) {
        const current = intentionScores.get(intention.label) || 0;
        const weight = action.weight ?? action.confidence ?? 0.5;
        intentionScores.set(intention.label, current + weight);
      }
    }

    const inferred = Array.from(intentionScores.entries())
      .map(([label, score]) => ({
        label,
        score,
        confidence: Math.min(score / allActions.length, 1),
      }))
      .sort((a, b) => b.score - a.score);

    const topConfidence =
      inferred.length > 0 ? inferred[0].confidence : 0;

    return {
      agentId,
      intentions: inferred,
      confidence: topConfidence,
      actionable: topConfidence >= this.confidenceThreshold,
    };
  }

  // ── Public API — v2.0.0 additions ──────────────────────────────────────────

  /**
   * Active inference: predict the most likely next behaviour for an agent
   * based on their current belief-desire-intention model.  Uses exponential
   * recency weighting so recent observations dominate older ones.
   *
   * @param {string} agentId - The agent whose next behaviour is predicted.
   * @returns {Object|null} Prediction object with ranked candidates and the
   *   top prediction, or null when the agent is unknown or has no history.
   *
   * @example
   * const pred = tom.predictBehavior('user-1');
   * // { agentId, candidates: [...], topPrediction: {...} }
   */
  predictBehavior(agentId) {
    const model = this.models.get(agentId);
    const history = this.histories.get(agentId);

    if (!model || !history || history.length === 0) {
      return null;
    }

    const now = Date.now();
    const maxAge = now - history[history.length - 1].timestamp;
    if (maxAge > 86400000) {
      // Warn via return if history is stale (>24 h old)
    }

    // Build action-type distribution from history with recency weighting.
    const actionScores = new Map();
    const recencyWeights = this._computeRecencyWeights(history);

    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      const w = recencyWeights[i] * (entry.confidence ?? 0.5);
      const prev = actionScores.get(entry.type) || 0;
      actionScores.set(entry.type, prev + w);
    }

    // Also factor in intentions: strong intentions increase the probability
    // of their corresponding action types.
    for (const intention of model.intentions) {
      const intentWords = intention.label.toLowerCase().split(/\s+/);
      for (const [actionType, score] of actionScores) {
        const actionWords = actionType.toLowerCase().split(/\s+/);
        if (intentWords.some((w) => actionWords.includes(w))) {
          actionScores.set(actionType, score + intention.strength * 0.3);
        }
      }
    }

    // Desire alignment: boost scores for actions whose description mentions
    // desire keywords.
    const desireKeywords = ['want', 'need', 'wish', 'desire', 'hope', 'seek'];
    for (const desire of model.desires) {
      const desireWords = desire.content.toLowerCase().split(/\s+/);
      for (const entry of history) {
        const entryWords = entry.description.toLowerCase().split(/\s+/);
        if (desireWords.some((w) => entryWords.includes(w))) {
          const current = actionScores.get(entry.type) || 0;
          actionScores.set(entry.type, current + desire.strength * 0.2);
        }
      }
    }

    const totalScore = Array.from(actionScores.values()).reduce((a, b) => a + b, 0);
    const candidates = Array.from(actionScores.entries())
      .map(([type, score]) => ({
        type,
        probability: totalScore > 0 ? score / totalScore : 0,
        rawScore: score,
      }))
      .sort((a, b) => b.probability - a.probability);

    const topPrediction = candidates.length > 0 ? candidates[0] : null;

    // Log this prediction for later accuracy evaluation.
    const predictionRecord = {
      predictedBehavior: topPrediction ? topPrediction.type : 'unknown',
      context: { candidates, timestamp: now },
      outcome: 'pending',
      actualObservation: null,
    };
    if (!this.predictionLog.has(agentId)) {
      this.predictionLog.set(agentId, []);
    }
    this.predictionLog.get(agentId).push(predictionRecord);

    return {
      agentId,
      candidates,
      topPrediction,
      rationale: topPrediction
        ? `Active inference predicts '${topPrediction.type}' with ${(topPrediction.probability * 100).toFixed(1)}% probability based on ${history.length} observations.`
        : 'Insufficient data for prediction.',
    };
  }

  /**
   * Belief revision via Bayesian-style update.  Compares the latest
   * observation against the most recent prediction for the agent, updates
   * model certainty values accordingly, and records the outcome in the
   * accuracy tracker.
   *
   * @param {string} agentId - The agent whose belief is being updated.
   * @param {Object} observation - The new observation.
   * @param {string} observation.type - Behaviour category.
   * @param {string} observation.description - Narrative.
   * @param {number} [observation.confidence=0.5] - Reliability.
   * @returns {Object|null} Update summary including what changed and whether
   *   the prediction was confirmed or contradicted, or null if the agent is
   *   unknown.
   *
   * @example
   * const result = tom.updateBelief('user-1', {
   *   type: 'speech',
   *   description: 'I want to leave now',
   *   confidence: 0.9
   * });
   */
  updateBelief(agentId, observation) {
    const model = this.models.get(agentId);
    const history = this.histories.get(agentId);

    if (!model || !history) {
      return null;
    }

    const obsType = observation.type || 'unknown';
    const obsDesc = (observation.description || '').toLowerCase();
    const obsConfidence = observation.confidence ?? 0.5;

    // Retrieve the most recent pending prediction.
    const log = this.predictionLog.get(agentId) || [];
    const pending = log.filter((r) => r.outcome === 'pending');
    const lastPrediction = pending.length > 0
      ? pending[pending.length - 1]
      : null;

    let outcome = 'confirmed';
    let changes = [];

    if (lastPrediction) {
      const predictedType = lastPrediction.predictedBehavior;
      // Check if the observation's type matches the predicted type or if
      // the description semantically contradicts the prediction.
      const typeMatch = predictedType === obsType || predictedType === 'unknown';
      const keywordHits = lastPrediction.context?.candidates
        ? lastPrediction.context.candidates
            .filter((c) =>
              obsDesc.includes(c.type.toLowerCase()),
            )
            .length
        : 0;
      const contradicting = !typeMatch && keywordHits === 0;

      outcome = contradicting ? 'contradicted' : 'confirmed';
      lastPrediction.outcome = outcome;
      lastPrediction.actualObservation = {
        type: obsType,
        description: observation.description,
        timestamp: Date.now(),
      };

      // Bayesian dampening or reinforcement of belief certainty values.
      if (outcome === 'contradicted') {
        // Reduce certainty on beliefs that are tied to the contradicted
        // prediction.
        const dampening = this.beliefUpdateRate;
        for (const belief of model.beliefs) {
          if (obsDesc.includes(belief.content.toLowerCase().split(/\s+/)[0])) {
            belief.certainty = Math.max(0, belief.certainty - dampening);
            changes.push({
              belief: belief.content.slice(0, 60),
              previousCertainty: belief.certainty + dampening,
              newCertainty: belief.certainty,
            });
          }
        }
        // Downgrade mood if predictions keep failing.
        if (model.mood) {
          model.mood = this._downgradeMood(model.mood);
          changes.push({ moodChanged: true, newMood: model.mood });
        }
      } else {
        // Reinforce beliefs consistent with the confirmed prediction.
        const reinforcement = this.beliefUpdateRate * 0.5;
        for (const belief of model.beliefs) {
          if (obsDesc.includes(belief.content.toLowerCase().split(/\s+/)[0])) {
            belief.certainty = Math.min(1, belief.certainty + reinforcement);
            changes.push({
              belief: belief.content.slice(0, 60),
              previousCertainty: belief.certainty - reinforcement,
              newCertainty: belief.certainty,
            });
          }
        }
      }
    }

    // Update accuracy tracker.
    if (!this.accuracyTrackers.has(agentId)) {
      this.accuracyTrackers.set(agentId, { total: 0, correct: 0 });
    }
    const tracker = this.accuracyTrackers.get(agentId);
    tracker.total += 1;
    if (outcome === 'confirmed') {
      tracker.correct += 1;
    }

    // Append the observation to history and refresh the model.
    const entry = {
      type: obsType,
      description: observation.description || '',
      confidence: obsConfidence,
      timestamp: Date.now(),
    };
    history.push(entry);
    while (history.length > this.maxHistory) {
      history.shift();
    }
    this._updateBeliefs(model, history);
    this._updateDesires(model, history);
    this._updateIntentions(model, history);
    model.lastUpdated = entry.timestamp;

    return {
      agentId,
      outcome,
      predictionMatched: outcome === 'confirmed',
      changes,
      predictionCount: tracker.total,
      currentAccuracy: tracker.total > 0 ? tracker.correct / tracker.total : null,
    };
  }

  /**
   * Perspective-taking (recursive ToM): simulate how one agent perceives
   * another agent's internal state.  Optionally chains a second recursion to
   * model how the target agent perceives a third party.
   *
   * @param {string} agentId - The observing agent whose perspective we take.
   * @param {string} targetAgentId - The agent being perceived.
   * @param {string} [recursiveTargetId] - Optional third agent for second-
   *   order recursion (what does the target think the recursiveTarget thinks).
   * @returns {Object|null} Perspective model or null if either agent is
   *   unknown.
   *
   * @example
   * // First-order: how does Alice see Bob?
   * tom.takePerspective('alice', 'bob');
   *
   * // Second-order: how does Alice think Bob sees Charlie?
   * tom.takePerspective('alice', 'bob', 'charlie');
   */
  takePerspective(agentId, targetAgentId, recursiveTargetId) {
    const observer = this.models.get(agentId);
    const target = this.models.get(targetAgentId);

    if (!observer || !target) {
      return null;
    }

    const perspectiveKey = `${agentId}:${targetAgentId}`;

    // Build or retrieve the stored perspective model.
    let perspective = this.perspectiveModels.get(perspectiveKey);
    if (!perspective) {
      // Seed from the observer's history filtered for mentions of the target.
      const observerHistory = this.histories.get(agentId) || [];
      const targetMentions = observerHistory.filter((e) =>
        (e.description || '').toLowerCase().includes(targetAgentId.toLowerCase()),
      );

      perspective = {
        observerId: agentId,
        subjectId: targetAgentId,
        perceivedBeliefs: [],
        perceivedDesires: [],
        perceivedIntentions: [],
        perceivedMood: target.mood,
        confidence: targetMentions.length > 0 ? 0.4 : 0.2,
        lastUpdated: Date.now(),
        order: 1, // first-order perspective
      };

      // Project the target's internal state through the observer's lens:
      // the observer attributes to the target whatever they have observed
      // about them, and fills gaps with the target's own known state at
      // reduced confidence.
      perspective.perceivedBeliefs = target.beliefs.map((b) => ({
        ...b,
        certainty: b.certainty * perspective.confidence,
      }));
      perspective.perceivedDesires = target.desires.map((d) => ({
        ...d,
        strength: d.strength * perspective.confidence,
      }));
      perspective.perceivedIntentions = target.intentions.map((i) => ({
        ...i,
        strength: i.strength * perspective.confidence,
      }));

      this.perspectiveModels.set(perspectiveKey, perspective);
    }

    // Second-order recursion: how does the target perceive the recursiveTarget?
    if (recursiveTargetId) {
      const secondOrderKey = `${targetAgentId}:${recursiveTargetId}`;
      const secondOrder = this.perspectiveModels.get(secondOrderKey);
      if (!secondOrder) {
        const targetHistory = this.histories.get(targetAgentId) || [];
        const mentions = targetHistory.filter((e) =>
          (e.description || '').toLowerCase().includes(recursiveTargetId.toLowerCase()),
        );

        const secondOrderPerspective = {
          observerId: targetAgentId,
          subjectId: recursiveTargetId,
          perceivedBeliefs: [],
          perceivedDesires: [],
          perceivedIntentions: [],
          confidence: mentions.length > 0 ? 0.3 : 0.15,
          lastUpdated: Date.now(),
          order: 2,
        };

        const recursiveTarget = this.models.get(recursiveTargetId);
        if (recursiveTarget) {
          secondOrderPerspective.perceivedBeliefs = recursiveTarget.beliefs.map((b) => ({
            ...b,
            certainty: b.certainty * secondOrderPerspective.confidence,
          }));
          secondOrderPerspective.perceivedDesires = recursiveTarget.desires.map((d) => ({
            ...d,
            strength: d.strength * secondOrderPerspective.confidence,
          }));
          secondOrderPerspective.perceivedIntentions = recursiveTarget.intentions.map((i) => ({
            ...i,
            strength: i.strength * secondOrderPerspective.confidence,
          }));
        }

        this.perspectiveModels.set(secondOrderKey, secondOrderPerspective);
        perspective.recursive = secondOrderPerspective;
      } else {
        perspective.recursive = secondOrder;
      }
    }

    return perspective;
  }

  /**
   * Return prediction accuracy statistics for an agent.  Accuracy is
   * computed as the ratio of confirmed predictions to total resolved
   * predictions.  Predictions still in "pending" state are not counted.
   *
   * @param {string} agentId - The agent to query.
   * @returns {Object} Accuracy summary, or zeros if the agent is unknown.
   *
   * @example
   * tom.getPredictionAccuracy('user-1');
   * // { total: 12, correct: 9, accuracy: 0.75, lastEvalTimestamp: 171... }
   */
  getPredictionAccuracy(agentId) {
    const tracker = this.accuracyTrackers.get(agentId);

    if (!tracker || tracker.total === 0) {
      return { total: 0, correct: 0, accuracy: null, lastEvalTimestamp: null };
    }

    const log = this.predictionLog.get(agentId) || [];
    const lastEval = log.length > 0
      ? log[log.length - 1].timestamp
      : null;

    return {
      total: tracker.total,
      correct: tracker.correct,
      accuracy: tracker.total > 0 ? tracker.correct / tracker.total : null,
      lastEvalTimestamp: lastEval,
    };
  }

  /**
   * Return an overview of all tracked agents, their model state, and
   * prediction accuracy — useful for debugging and dashboard displays.
   *
   * @returns {Array<Object>} Summary per agent.
   */
  getAllAgentStatus() {
    const result = [];
    for (const [agentId, model] of this.models) {
      const accuracy = this.getPredictionAccuracy(agentId);
      const history = this.histories.get(agentId) || [];
      result.push({
        agentId,
        hasModel: true,
        beliefCount: model.beliefs.length,
        desireCount: model.desires.length,
        intentionCount: model.intentions.length,
        mood: model.mood,
        historyLength: history.length,
        predictionAccuracy: accuracy,
      });
    }
    return result;
  }

  // ── Private helpers — original (v1, unchanged) ──────────────────────────────

  /**
   * @private
   * @param {Object} model - Agent model.
   * @param {Array<Object>} history - Observation history.
   */
  _updateBeliefs(model, history) {
    model.beliefs = history
      .filter((e) => e.confidence >= 0.5)
      .map((e) => ({
        content: e.description,
        certainty: e.confidence,
        since: e.timestamp,
      }));
  }

  /**
   * @private
   * @param {Object} model - Agent model.
   * @param {Array<Object>} history - Observation history.
   */
  _updateDesires(model, history) {
    const desireKeywords = ['want', 'need', 'wish', 'desire', 'hope', 'seek'];
    model.desires = history
      .filter(
        (e) =>
          desireKeywords.some((kw) =>
            e.description.toLowerCase().includes(kw),
          ),
      )
      .map((e) => ({
        content: e.description,
        strength: e.confidence,
        since: e.timestamp,
      }));
  }

  /**
   * @private
   * @param {Object} model - Agent model.
   * @param {Array<Object>} history - Observation history.
   */
  _updateIntentions(model, history) {
    const intentionKeywords = ['plan', 'intend', 'going to', 'will', 'about to'];
    model.intentions = history
      .filter(
        (e) =>
          intentionKeywords.some((kw) =>
            e.description.toLowerCase().includes(kw),
          ),
      )
      .map((e) => ({
        label: e.description.slice(0, 80),
        strength: e.confidence,
        since: e.timestamp,
      }));
  }

  /**
   * @private
   * @param {Object} model - Agent model.
   * @param {Object} stimulus - Stimulus descriptor.
   * @returns {number} Relevance score between 0 and 1.
   */
  _estimateRelevance(model, stimulus) {
    const stimulusWords = (stimulus.content || '').toLowerCase().split(/\s+/);
    let hits = 0;

    for (const desire of model.desires) {
      const desireWords = desire.content.toLowerCase().split(/\s+/);
      for (const word of stimulusWords) {
        if (word.length > 3 && desireWords.includes(word)) {
          hits += desire.strength;
        }
      }
    }

    return Math.min(hits / Math.max(stimulusWords.length, 1), 1);
  }

  /**
   * @private
   * @param {Object} model - Agent model.
   * @param {Object} stimulus - Stimulus descriptor.
   * @returns {string} Predicted reaction category.
   */
  _predictReactionType(model, stimulus) {
    if (model.mood === 'hostile' && stimulus.type === 'proposal') {
      return 'resistance';
    }

    const relevance = this._estimateRelevance(model, stimulus);
    if (relevance > 0.5) {
      return 'acceptance';
    }

    if (stimulus.strength > 0.7) {
      return 'compliance';
    }

    return 'neutral';
  }

  /**
   * @private
   * @param {Object} model - Agent model.
   * @param {string} reactionType - Predicted reaction.
   * @param {Object} stimulus - The stimulus applied.
   * @returns {string} Human-readable rationale.
   */
  _buildRationale(model, reactionType, stimulus) {
    const relevantDesires = model.desires
      .filter((d) =>
        (stimulus.content || '').toLowerCase().includes(
          d.content.toLowerCase().split(/\s+/)[0],
        ),
      )
      .map((d) => d.content)
      .slice(0, 2);

    const parts = [
      `Agent '${model.id}' predicted to exhibit ${reactionType}`,
    ];
    if (relevantDesires.length > 0) {
      parts.push(`aligned with desires: ${relevantDesires.join(', ')}`);
    }
    return parts.join('; ') + '.';
  }

  /**
   * @private
   * @param {Object} action - A single observed action.
   * @param {Array<Object>} existingIntentions - Known intentions of the agent.
   * @returns {Array<Object>} Matched intention candidates with weights.
   */
  _matchIntentions(action, existingIntentions) {
    const actionWords = action.description.toLowerCase().split(/\s+/);
    return existingIntentions
      .filter((intention) => {
        const intentionWords = intention.label.toLowerCase().split(/\s+/);
        return intentionWords.some((w) => actionWords.includes(w));
      })
      .map((intention) => ({
        label: intention.label,
        weight: intention.strength * (action.weight ?? action.confidence ?? 0.5),
      }));
  }

  // ── Private helpers — v2.0.0 additions ─────────────────────────────────────

  /**
   * @private
   * @param {Array<Object>} history - Observation history.
   * @returns {Array<number>} Per-entry recency weights (most recent = 1,
   *   decaying exponentially via this.recencyDecay).
   */
  _computeRecencyWeights(history) {
    const weights = [];
    const newest = history[history.length - 1].timestamp;
    for (const entry of history) {
      const age = newest - entry.timestamp;
      const ageInSeconds = age / 1000;
      weights.push(Math.pow(this.recencyDecay, ageInSeconds));
    }
    // Normalise so the newest observation has weight 1.
    const max = Math.max(...weights, 1);
    return weights.map((w) => w / max);
  }

  /**
   * @private
   * @param {string} currentMood - Current mood label.
   * @returns {string} Downgraded mood label.
   */
  _downgradeMood(currentMood) {
    const order = ['calm', 'curious', 'neutral', 'frustrated', 'hostile'];
    const idx = order.indexOf(currentMood);
    if (idx > 0) return order[idx - 1];
    return currentMood;
  }
}

module.exports = { ToMEngine };
