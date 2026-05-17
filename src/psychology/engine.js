/**
 * PsychologyEngine — AI Psychological Perception
 * 
 * Perceives: intent, emotion, needs, defenses from user input.
 * 
 * v0.16: Clean, minimal implementation with measurable outputs.
 * No over-claiming. Every output is traceable to code.
 */

class PsychologyEngine {
  constructor(memory) {
    this.memory = memory;
    
    // Psychological dimension weights (can be tuned)
    this.weights = {
      intent: 0.4,      // What user is trying to accomplish
      emotion: 0.3,    // Emotional state signal
      needs: 0.2,      // Unmet needs signal
      defenses: 0.1,   // Resistance/defensiveness signal
    };
    
    // Emotion keywords for quick categorization
    this.emotionMap = this._buildEmotionMap();
  }

  _buildEmotionMap() {
    return {
      positive: {
        high: ['happy', 'excited', 'thrilled', 'delighted', 'joyful', 'grateful', 'pleased', 'satisfied', 'optimistic', 'great', 'love', 'amazing', 'awesome', 'wonderful', 'fantastic'],
        medium: ['content', 'comfortable', 'relaxed', 'calm', 'curious', 'interested', 'engaged', 'good', 'nice'],
        low: ['okay', 'fine', 'neutral', 'mildly interested'],
      },
      negative: {
        high: ['frustrated', 'angry', 'furious', 'devastated', 'overwhelmed', 'panicked', 'terrified'],
        medium: ['annoyed', 'upset', 'disappointed', 'worried', 'anxious', 'sad', 'confused'],
        low: ['uneasy', 'bored', 'tired', 'mildly frustrated'],
      },
      neutral: ['okay', 'fine', 'whatever', 'alright', 'so-so'],
    };
  }

  /**
   * Main entry point: perceive psychological signals from input
   * 
   * @param {string} input - Raw user input
   * @returns {object} Psychological perception result
   */
  perceive(input) {
    if (!input || typeof input !== 'string') {
      return { intent: null, emotion: null, needs: [], defenses: [], confidence: 0 };
    }

    const lower = input.toLowerCase();
    const words = lower.split(/\s+/);
    
    // 1. Detect emotion
    const emotion = this._detectEmotion(lower, words, input);
    
    // 2. Infer intent
    const intent = this._inferIntent(lower, words, input);
    
    // 3. Detect unmet needs
    const needs = this._detectNeeds(lower, words);
    
    // 4. Detect defenses
    const defenses = this._detectDefenses(lower, words);
    
    // 5. Compute overall confidence
    const confidence = this._computeConfidence(emotion, intent, needs, defenses);
    
    return {
      intent,
      emotion,
      needs,
      defenses,
      confidence,
      raw_signals: { wordCount: words.length, charCount: input.length },
    };
  }

  _detectEmotion(lower, words, rawInput) {
    let maxIntensity = 0;
    let category = 'neutral';
    let intensity = 'low';
    let detected = [];

    // Check for emotional words
    for (const [cat, intensities] of Object.entries(this.emotionMap)) {
      for (const [level, keywords] of Object.entries(intensities)) {
        for (const kw of keywords) {
          if (lower.includes(kw)) {
            detected.push({ keyword: kw, level });
            if (cat === 'positive' && level === 'high') { maxIntensity = 3; category = cat; intensity = level; }
            else if (cat === 'negative' && level === 'high') { maxIntensity = 3; category = cat; intensity = level; }
            else if (maxIntensity < 2) { maxIntensity = 2; category = cat; intensity = level; }
            else if (maxIntensity < 1) { maxIntensity = 1; category = cat; intensity = level; }
          }
        }
      }
    }

    // Check for punctuation emotion signals
    const exclamationCount = (lower.match(/!/g) || []).length;
    const questionCount = (lower.match(/\?/g) || []).length;
    const capsRatio = (rawInput.match(/[A-Z]/g) || []).length / Math.max(lower.length, 1);

    let punctuationSignal = 'neutral';
    if (exclamationCount >= 2) punctuationSignal = 'excited';
    else if (questionCount >= 3) punctuationSignal = 'confused_or_seeking';
    else if (capsRatio > 0.3 && lower.length < 50) punctuationSignal = 'intense';

    return {
      category,
      intensity,
      signals: detected.slice(0, 3),
      punctuation: punctuationSignal,
    };
  }

  _inferIntent(lower, words, raw) {
    // Intent categories with keyword patterns
    const intentPatterns = {
      information_seeking: {
        patterns: ['what is', 'how to', 'why does', 'when did', 'where is', 'who is', 'explain', 'tell me', 'find', 'search', 'how do i', 'what do i', 'can i', '?'],
        confidence: 0.85,
      },
      task_execution: {
        patterns: ['do it', 'make it', 'create', 'write', 'run', 'execute', 'build', 'build me', 'fix', 'solve', 'implement', 'make me', 'create me'],
        confidence: 0.85,
      },
      troubleshooting: {
        patterns: ['not working', 'error', 'bug', 'failed', 'broken', 'doesn\'t work', 'can\'t', 'unable to', 'issue'],
        confidence: 0.8,
      },
      collaboration: {
        patterns: ['we', 'together', 'let\'s', 'help me', 'work on', 'collaborate', 'share', 'discuss'],
        confidence: 0.7,
      },
      reflection: {
        patterns: ['think about', 'consider', 'reflect', 'analyze', 'evaluate', 'assess', 'review'],
        confidence: 0.7,
      },
      emotional_support: {
        patterns: ['feel', 'upset', 'frustrated', 'sad', 'stressed', 'worried', 'overwhelmed', 'i\'m feeling'],
        confidence: 0.6,
      },
      opinion_seeking: {
        patterns: ['what do you think', 'your opinion', 'should i', 'would you', 'is it better', 'which is'],
        confidence: 0.7,
      },
    };

    let bestIntent = 'unknown';
    let bestScore = 0;

    for (const [intentName, config] of Object.entries(intentPatterns)) {
      let matchCount = 0;
      for (const pattern of config.patterns) {
        if (lower.includes(pattern)) matchCount++;
      }
      const score = (matchCount / config.patterns.length) * config.confidence;
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intentName;
      }
    }

    return {
      category: bestIntent,
      confidence: Math.min(bestScore, 1),
    };
  }

  _detectNeeds(lower, words) {
    const needs = [];
    
    const needPatterns = [
      { need: 'clarity', patterns: ['confused', 'unclear', 'don\'t understand', 'what do you mean', '?'], weight: 1.0 },
      { need: 'efficiency', patterns: ['too slow', 'takes too long', 'quick', 'fast', 'efficient', 'automate'], weight: 0.8 },
      { need: 'reliability', patterns: ['keeps breaking', 'unreliable', 'buggy', 'error', 'crash'], weight: 1.0 },
      { need: 'understanding', patterns: ['explain', 'why', 'how', 'tell me', 'show me'], weight: 0.7 },
      { need: 'autonomy', patterns: ['do it for me', 'just', 'automatically', 'without me'], weight: 0.6 },
      { need: 'recognition', patterns: ['i want', 'i need', 'i\'ve been', 'finally', 'finally'], weight: 0.5 },
    ];

    for (const { need, patterns, weight } of needPatterns) {
      let matchCount = 0;
      for (const pattern of patterns) {
        if (lower.includes(pattern)) matchCount++;
      }
      if (matchCount > 0) {
        needs.push({ need, confidence: Math.min(matchCount / patterns.length * weight, 1) });
      }
    }

    // Sort by confidence
    needs.sort((a, b) => b.confidence - a.confidence);
    return needs.slice(0, 4);
  }

  _detectDefenses(lower, words) {
    const defenses = [];
    
    const defensePatterns = [
      { defense: 'dismissal', patterns: ['whatever', 'i don\'t care', 'doesn\'t matter', 'not important'], weight: 1.0 },
      { defense: 'deflection', patterns: ['you don\'t understand', 'that\'s not what i', 'nevermind', 'forget it'], weight: 0.9 },
      { defense: 'hostility', patterns: ['stupid', 'useless', 'terrible', 'worst', 'hate'], weight: 1.0 },
      { defense: 'evasion', patterns: ['i don\'t know', 'not sure', 'maybe', 'could be'], weight: 0.5 },
      { defense: 'justification', patterns: ['but i', 'i was just', 'i thought', 'it\'s not my fault'], weight: 0.6 },
    ];

    for (const { defense, patterns, weight } of defensePatterns) {
      let matchCount = 0;
      for (const pattern of patterns) {
        if (lower.includes(pattern)) matchCount++;
      }
      if (matchCount > 0) {
        defenses.push({ defense, confidence: Math.min(matchCount / patterns.length * weight, 1) });
      }
    }

    return defenses;
  }

  _computeConfidence(emotion, intent, needs, defenses) {
    // Simple confidence: how many signals did we detect
    const emotionSignals = emotion.signals.length + (emotion.punctuation !== 'neutral' ? 1 : 0);
    const intentScore = intent.confidence;
    const needSignals = needs.length;
    const defenseSignals = defenses.length;
    
    const totalSignals = emotionSignals + (intentScore > 0 ? 1 : 0) + needSignals + defenseSignals;
    
    // Map to 0-1
    return Math.min(totalSignals / 6, 1.0);
  }

  /**
   * Convenience wrapper: analyze text and return perception
   */
  analyzePsychology(input) {
    const result = this.perceive(input);
    return result;
  }

  /**
   * Classify input into broad categories
   */
  classify(input) {
    const result = this.perceive(input);
    
    // Derive top-level category from intent
    let category = result.intent.category;
    if (!category || category === 'unknown') {
      category = result.emotion.category === 'positive' ? 'positive_interaction'
               : result.emotion.category === 'negative' ? 'negative_interaction'
               : 'neutral';
    }
    
    return {
      category,
      emotion: result.emotion.category,
      confidence: result.confidence,
    };
  }
}

module.exports = { PsychologyEngine };
