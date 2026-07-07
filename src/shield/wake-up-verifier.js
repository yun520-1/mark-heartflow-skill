
/**
 * HeartFlow Wake-Up Verifier v2.1.0
 *
 * Purpose:
 * - Validate dream outputs after sleep/replay
 * - Promote useful dream fragments to actionable upgrades
 * - Reject contradictions, legacy noise, and ungrounded speculation
 * - Persist dream evaluations for historical tracking
 * - Categorize fragments and detect internal conflicts
 * - Multi-dimensional quality scoring with self-correction feedback
 */

const fs = require('fs');
const path = require('path');
let DecisionVerifier;
try { DecisionVerifier = require('./decision-verifier.js').DecisionVerifier; } catch (e) { DecisionVerifier = null; }

const DREAM_HISTORY_DIR = path.join(__dirname, '..', 'data');
const DREAM_HISTORY_FILE = path.join(DREAM_HISTORY_DIR, 'dream-history.json');
const MAX_HISTORY = 20;

class WakeUpVerifier {
  constructor(options = {}) {
    this.decisionVerifier = new DecisionVerifier(options);
    this.rules = {
      minActionability: options.minActionability ?? 0.55,
      maxNoiseRatio: options.maxNoiseRatio ?? 0.45,
      minCoherence: options.minCoherence ?? 0.3,
      maxContradictionRatio: options.maxContradictionRatio ?? 0.4,
    };
    this.history = this._loadHistory();
    this.evaluationCount = 0;
  }

  // ───────── Persistence ─────────

  _ensureDataDir() {
    if (!fs.existsSync(DREAM_HISTORY_DIR)) {
      fs.mkdirSync(DREAM_HISTORY_DIR, { recursive: true });
    }
  }

  _loadHistory() {
    try {
      this._ensureDataDir();
      if (fs.existsSync(DREAM_HISTORY_FILE)) {
        const raw = fs.readFileSync(DREAM_HISTORY_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.entries)) {
          return parsed;
        }
      }
    } catch (e) {
      // 已禁用 console.warn: console.warn('[WakeUpVerifier] History load failed, starting fresh:', e.message);
    }
    return { entries: [], lastEntryIndex: 0 };
  }

  _saveHistory() {
    try {
      this._ensureDataDir();
      fs.writeFileSync(DREAM_HISTORY_FILE, JSON.stringify(this.history, null, 2));
    } catch (e) {
      // 已禁用 console.warn: console.warn('[WakeUpVerifier] History save failed:', e.message);
    }
  }

  _trimHistory() {
    while (this.history.entries.length > MAX_HISTORY) {
      this.history.entries.shift();
    }
  }

  // ───────── Normalization ─────────

  normalizeDream(dreamResult = {}) {
    return {
      title: dreamResult.title || 'Dream',
      motifs: Array.isArray(dreamResult.motifs) ? dreamResult.motifs : [],
      fragments: Array.isArray(dreamResult.fragments) ? dreamResult.fragments : [],
      insights: Array.isArray(dreamResult.insights) ? dreamResult.insights : [],
      next_actions: Array.isArray(dreamResult.next_actions) ? dreamResult.next_actions : [],
      corrections: Array.isArray(dreamResult.corrections) ? dreamResult.corrections : [],
      awake_summary: dreamResult.awake_summary || {}
    };
  }

  // ───────── Fragment Categorization ─────────

  _categorizeFragment(text) {
    const lower = text.toLowerCase();
    if (/\b(upgrade|evolve|enhance|improve|add|implement|build|create|develop)\b/i.test(lower)) {
      return { category: 'upgrade', weight: 0.9 };
    }
    if (/\b(fix|bug|error|issue|repair|correct|patch|resolve|hotfix|mitigate)\b/i.test(lower)) {
      return { category: 'fix', weight: 0.85 };
    }
    if (/\b(verify|check|validate|audit|review|inspect|test|confirm|ensure)\b/i.test(lower)) {
      return { category: 'verification', weight: 0.75 };
    }
    if (/\b(insight|learn|understand|realize|discover|notice|observe|reflect)\b/i.test(lower)) {
      return { category: 'insight', weight: 0.7 };
    }
    if (/\b(memory|recall|remember|past|previous|old|historical)\b/i.test(lower)) {
      return { category: 'memory', weight: 0.5 };
    }
    if (/\b(contradict|conflict|disagree|opposite|inconsistent|mismatch|paradox)\b/i.test(lower)) {
      return { category: 'contradiction', weight: 0.3 };
    }
    if (/\b(wrong|bad|danger|risk|caution|warning|avoid|stop|reject)\b/i.test(lower)) {
      return { category: 'warning', weight: 0.4 };
    }
    if (/\b(dream|fantasy|imagine|speculat|maybe|perhaps|possibly|guess)\b/i.test(lower)) {
      return { category: 'speculation', weight: 0.25 };
    }
    return { category: 'general', weight: 0.35 };
  }

  // ───────── Conflict Detection ─────────

  _detectConflicts(fragments) {
    const conflicts = [];
    const seenStatements = [];

    for (const item of fragments) {
      const text = String((item && item.text) || item || '');
      if (!text) continue;

      // Check for direct negation patterns
      const isNegation = /\b(not|never|don't|doesn't|isn't|won't|can't|cannot|shouldn't)\b/i.test(text);

      // Compare against previously seen statements for contradictions
      for (const prev of seenStatements) {
        const prevText = prev.text;
        const prevIsNegation = prev.isNegation;

        // If one is negated and the other isn't, check if they share core concepts
        if (isNegation !== prevIsNegation) {
          const coreCurrent = text.replace(/\b(not|never|don't|doesn't|isn't|won't|can't|cannot|shouldn't)\b/gi, '').trim();
          const corePrev = prevText.replace(/\b(not|never|don't|doesn't|isn't|won't|can't|cannot|shouldn't)\b/gi, '').trim();

          // Extract key nouns/verbs (words > 3 chars)
          const currentWords = new Set(coreCurrent.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
          const prevWords = new Set(corePrev.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);

          // Count shared significant words
          let sharedCount = 0;
          for (const w of currentWords) {
            if (prevWords.has(w)) sharedCount++;
          }

          // If they share significant vocabulary, they likely contradict
          const minShared = Math.min(currentWords.size, prevWords.size) > 0 ? 1 : 0;
          if (sharedCount >= minShared && currentWords.size > 0 && prevWords.size > 0) {
            conflicts.push({
              a: prevText.slice(0, 80),
              b: text.slice(0, 80),
              sharedWords: [...currentWords].filter(w => prevWords.has(w)),
              severity: sharedCount >= 3 ? 'high' : (sharedCount >= 2 ? 'medium' : 'low')
            });
          }
        }
      }

      seenStatements.push({ text, isNegation });
    }

    return conflicts;
  }

  // ───────── Quality Scoring ─────────

  _computeQualityScores(dream, categorized, conflicts) {
    const scores = {};

    // 1. Actionability: how many concrete next actions vs total fragments
    const totalFragments = dream.fragments.length || 1;
    const actionableFragments = categorized.filter(c =>
      c.category === 'upgrade' || c.category === 'fix' || c.category === 'verification'
    ).length;
    scores.actionability = Math.min(1, actionableFragments / totalFragments * 1.5);

    // 2. Coherence: low conflicts = high coherence
    const conflictRatio = totalFragments > 0 ? conflicts.length / totalFragments : 0;
    scores.coherence = Math.max(0, Math.min(1, 1 - conflictRatio * 2));

    // 3. Novelty: how many fragments are in non-common categories
    const noveltyFragments = categorized.filter(c =>
      c.category === 'insight' || c.category === 'upgrade' || c.category === 'warning'
    ).length;
    scores.novelty = Math.min(1, noveltyFragments / totalFragments * 1.2);

    // 4. Specificity: fragments with concrete details score higher
    let detailScore = 0;
    for (const item of dream.fragments) {
      const text = String((item && item.text) || item || '');
      const hasNumbers = /\d+/.test(text);
      const hasSpecificNouns = /\b(module|function|method|class|file|api|endpoint|threshold|value|pattern|algorithm|engine)\b/i.test(text);
      const wordCount = text.split(/\s+/).length;
      if (hasNumbers) detailScore += 0.3;
      if (hasSpecificNouns) detailScore += 0.4;
      if (wordCount >= 8) detailScore += 0.2;
    }
    scores.specificity = Math.min(1, detailScore / totalFragments);

    // 5. Overall quality (weighted average)
    scores.overall = Math.round((
      scores.actionability * 0.30 +
      scores.coherence * 0.25 +
      scores.novelty * 0.20 +
      scores.specificity * 0.25
    ) * 100) / 100;

    return scores;
  }

  // ───────── Historical Comparison ─────────

  _compareWithHistory(scores) {
    if (this.history.entries.length === 0) {
      return {
        trend: 'first_dream',
        qualityDelta: 0,
        actionabilityDelta: 0,
        coherenceDelta: 0,
        previousCount: 0
      };
    }

    const lastEntry = this.history.entries[this.history.entries.length - 1];
    const lastScores = lastEntry.scores || { overall: 0, actionability: 0, coherence: 0 };

    // Compute rolling average of last 3 entries for smoother trend
    const recentEntries = this.history.entries.slice(-3);
    const avgOverall = recentEntries.reduce((sum, e) => sum + ((e.scores && e.scores.overall) || 0), 0) / recentEntries.length;
    const avgActionability = recentEntries.reduce((sum, e) => sum + ((e.scores && e.scores.actionability) || 0), 0) / recentEntries.length;
    const avgCoherence = recentEntries.reduce((sum, e) => sum + ((e.scores && e.scores.coherence) || 0), 0) / recentEntries.length;

    return {
      trend: scores.overall > avgOverall * 1.05 ? 'improving'
           : scores.overall < avgOverall * 0.95 ? 'declining'
           : 'stable',
      qualityDelta: Math.round((scores.overall - avgOverall) * 100) / 100,
      actionabilityDelta: Math.round((scores.actionability - avgActionability) * 100) / 100,
      coherenceDelta: Math.round((scores.coherence - avgCoherence) * 100) / 100,
      previousCount: this.history.entries.length,
      rollingAverage: Math.round(avgOverall * 100) / 100
    };
  }

  // ───────── Self-Correction Feedback ─────────

  _applySelfCorrectionFeedback() {
    if (this.history.entries.length < 3) return { adjustments: [] };
    const adjustments = [];

    // Look at last 3 evaluations - if actionability was consistently low, lower threshold
    const recent = this.history.entries.slice(-3);
    const avgActionability = recent.reduce((s, e) => s + ((e.scores && e.scores.actionability) || 0), 0) / recent.length;
    const avgNoiseRatio = recent.reduce((s, e) => s + (e.noiseRatio || 0), 0) / recent.length;

    // If actionability is consistently below threshold, relax it slightly
    if (avgActionability < this.rules.minActionability * 0.9 && avgActionability > 0) {
      const oldThreshold = this.rules.minActionability;
      this.rules.minActionability = Math.max(0.3, this.rules.minActionability - 0.05);
      adjustments.push({
        parameter: 'minActionability',
        from: oldThreshold,
        to: this.rules.minActionability,
        reason: `avg actionability (${avgActionability.toFixed(2)}) below threshold over last 3 dreams`
      });
    }

    // If noise ratio is consistently high, tighten it
    if (avgNoiseRatio > this.rules.maxNoiseRatio * 1.2) {
      const oldThreshold = this.rules.maxNoiseRatio;
      this.rules.maxNoiseRatio = Math.min(0.7, this.rules.maxNoiseRatio + 0.05);
      adjustments.push({
        parameter: 'maxNoiseRatio',
        from: oldThreshold,
        to: this.rules.maxNoiseRatio,
        reason: `avg noise ratio (${avgNoiseRatio.toFixed(2)}) exceeds threshold over last 3 dreams`
      });
    }

    return { adjustments };
  }

  // ───────── Main Evaluation ─────────

  evaluateDream(dreamResult = {}) {
    const dream = this.normalizeDream(dreamResult);
    const issues = [];
    const suggestions = [];
    const fragmentsText = dream.fragments.map(x => String((x && x.text) || x)).join(' ');
    const noiseHits = (fragmentsText.match(/\b(old|historical|fake|placeholder|demo|wrong|error|confuse)\b/gi) || []).length;
    const noiseRatio = dream.fragments.length ? noiseHits / dream.fragments.length : 0;
    const actionability = Math.max(0, Math.min(1, 0.35 + dream.next_actions.length * 0.12 + dream.insights.length * 0.08 - noiseRatio * 0.4));

    // Categorize each fragment
    const categorized = dream.fragments.map(item => {
      const text = String((item && item.text) || item || '');
      return this._categorizeFragment(text);
    });

    // Detect internal conflicts
    const conflicts = this._detectConflicts(dream.fragments);
    const conflictRatio = dream.fragments.length > 0 ? conflicts.length / dream.fragments.length : 0;

    // Compute multi-dimensional quality scores
    const scores = this._computeQualityScores(dream, categorized, conflicts);

    // Apply self-correction feedback from history
    const feedback = this._applySelfCorrectionFeedback();

    // Check against thresholds using scores
    if (noiseRatio > this.rules.maxNoiseRatio) {
      issues.push({ type: 'high_noise_ratio', severity: 'medium', message: '梦态噪声过高，需要减少历史/噪声片段' });
      suggestions.push('先清理历史碎片，再做二次梦态重组');
    }

    if (actionability < this.rules.minActionability) {
      issues.push({ type: 'low_actionability', severity: 'high', message: '梦输出缺少足够的可执行转化' });
      suggestions.push('把梦洞察压缩成 1-3 条明确行动');
    }

    if (scores.coherence < this.rules.minCoherence) {
      issues.push({ type: 'low_coherence', severity: 'medium', message: `梦片段一致性偏低 (${scores.coherence.toFixed(2)}), 存在 ${conflicts.length} 个内部矛盾` });
      suggestions.push('检查矛盾片段并统一叙事方向');
    }

    if (conflictRatio > this.rules.maxContradictionRatio) {
      issues.push({ type: 'high_contradiction', severity: 'high', message: `矛盾比例过高 (${(conflictRatio * 100).toFixed(0)}%), 需要解决内部冲突` });
      suggestions.push('对矛盾片段进行仲裁或排除低可信度片段');
    }

    if (scores.specificity < 0.2 && dream.fragments.length > 0) {
      issues.push({ type: 'low_specificity', severity: 'low', message: '片段缺乏具体细节（数字、模块名、API等）' });
      suggestions.push('为关键片段补充具体实现细节');
    }

    // Category summary
    const categoryCounts = {};
    for (const c of categorized) {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    }

    // Decision verifier check
    const decisionRecord = {
      decision: dream.title,
      reason: dream.insights.join(' '),
      evidence: dream.motifs,
      risks: dream.corrections.map(c => c.note || c.action || 'correction'),
      alternatives: dream.next_actions,
      confidence: actionability,
      userGoal: 'Reduce logic errors and evolve HeartFlow',
      expectedOutcome: 'A smaller, clearer upgrade set'
    };

    const decisionCheck = this.decisionVerifier.verify(decisionRecord);
    if (!decisionCheck.valid) {
      issues.push(...decisionCheck.issues);
      suggestions.push(...decisionCheck.repairHints);
    }

    const promoted = this.promoteFragments(dream);
    const historical = this._compareWithHistory(scores);

    // Build result
    const result = {
      valid: issues.filter(i => i.severity === 'high').length === 0 && decisionCheck.valid,
      actionability,
      noiseRatio,
      coherence: scores.coherence,
      specificity: scores.specificity,
      scores,
      issues,
      suggestions: [...new Set(suggestions)],
      decisionCheck,
      promoted,
      conflicts,
      categorized: categoryCounts,
      historical,
      feedback,
      awake_summary: {
        title: dream.title,
        fragmentCount: dream.fragments.length,
        categorizedCount: categorized.length,
        promotedCount: promoted.length,
        conflictCount: conflicts.length,
        nextActionCount: dream.next_actions.length,
        qualityScore: scores.overall,
        trend: historical.trend
      }
    };

    // Persist to history
    this.history.entries.push({
      index: this.history.lastEntryIndex++,
      timestamp: new Date().toISOString(),
      title: dream.title,
      fragmentCount: dream.fragments.length,
      noiseRatio,
      scores,
      issues: issues.length,
      conflicts: conflicts.length,
      promotedCount: promoted.length
    });
    this._trimHistory();
    this._saveHistory();
    this.evaluationCount++;

    return result;
  }

  // ───────── Fragment Promotion ─────────

  promoteFragments(dream) {
    const candidates = [];
    for (const item of dream.fragments) {
      const text = String((item && item.text) || item || '');
      const categorization = this._categorizeFragment(text);
      if (/\b(upgrade|fix|verify|memory|self-check|correction|logic|truth|implement|enhance|improve)\b/i.test(text)) {
        candidates.push({
          text,
          promoted: true,
          category: categorization.category,
          weight: categorization.weight,
          reason: `strong alignment with HeartFlow target (${categorization.category})`
        });
      }
    }
    for (const action of dream.next_actions) {
      candidates.push({
        text: action,
        promoted: true,
        category: 'action',
        weight: 0.8,
        reason: 'action extracted from waking summary'
      });
    }
    // Sort by weight descending, take top 5
    return candidates.sort((a, b) => b.weight - a.weight).slice(0, 5);
  }

  // ───────── History Query ─────────

  getHistory(options = {}) {
    const limit = options.limit || 10;
    const entries = this.history.entries.slice(-limit);
    return {
      entries: entries.reverse(),
      total: this.history.entries.length,
      evaluationCount: this.evaluationCount,
      currentThresholds: { ...this.rules }
    };
  }

  getLastEvaluation() {
    if (this.history.entries.length === 0) {
      return { status: 'no_evaluations_yet' };
    }
    return this.history.entries[this.history.entries.length - 1];
  }

  clearHistory() {
    this.history = { entries: [], lastEntryIndex: 0 };
    this._saveHistory();
    return { cleared: true, removedEntries: this.history.entries.length };
  }
}

module.exports = { WakeUpVerifier };

if (require.main === module) {
  const demo = {
    title: 'HeartFlow Dream Loop',
    motifs: ['dream should reorganize memory fragments', 'do not confuse historical version with current version'],
    fragments: [
      { text: 'dream should reorganize memory fragments into candidate upgrades' },
      { text: 'do not confuse historical version with current version' },
      { text: 'fix the memory consolidation bug in slots.js' },
      { text: 'dream should never replace live state' },
      { text: 'add version tracking to wake-up verifier output' }
    ],
    insights: ['Treat contradictions as dream material, not runtime truth.'],
    next_actions: ['promote useful fragments to durable memory', 'queue contradiction checks']
  };
  const verifier = new WakeUpVerifier();
  // 已禁用 console.log: console.log(JSON.stringify(verifier.evaluateDream(demo), null, 2));
  // 已禁用 console.log: console.log('--- History ---');
  // 已禁用 console.log: console.log(JSON.stringify(verifier.getHistory({ limit: 3 }), null, 2));
}
