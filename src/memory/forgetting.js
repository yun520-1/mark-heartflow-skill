/**
 * Forgetting Engine — Visual Compression Inspired Memory Decay
 * 
 * DeepSeek-OCR paper insight: "Human memory decay over time ≈ visual perception 
 * degradation over spatial distance — both exhibit progressive information loss."
 * 
 * This module implements a biological forgetting curve for HeartFlow memories:
 * - Recent memories: high fidelity (low compression, high recall)
 * - Distant memories: compressed (progressive degradation, like reading text from afar)
 * - Very old memories: highly compressed (abstracted, blurred, but structurally preserved)
 * 
 * Compression ratios inspired by DeepSeek-OCR:
 * - <10x compression: ~97% precision
 * - 10-12x compression: ~90% precision
 * - 20x compression: ~60% precision
 */

const fs = require('fs');
const path = require('path');

/**
 * Memory forgetting levels based on age
 * Each level applies progressive "visual blur" to the memory content
 */
const FORGETTING_LEVELS = {
  // Recent: < 1 hour — full fidelity
  RECENT: { maxAge: 3600000, compression: 1, precision: 1.0, label: 'vivid' },
  // Short-term: 1-24 hours — minor compression
  SHORT_TERM: { maxAge: 86400000, compression: 4, precision: 0.95, label: 'clear' },
  // Medium-term: 1-7 days — moderate compression
  MEDIUM_TERM: { maxAge: 604800000, compression: 10, precision: 0.90, label: 'faded' },
  // Long-term: 7-30 days — significant compression
  LONG_TERM: { maxAge: 2592000000, compression: 16, precision: 0.75, label: 'blurred' },
  // Archive: > 30 days — maximum compression (like reading text from far away)
  ARCHIVE: { maxAge: Infinity, compression: 20, precision: 0.60, label: 'abstract' }
};

/**
 * Calculate forgetting level based on timestamp
 * @param {number} timestamp - Unix timestamp in ms
 * @returns {object} Level descriptor
 */
function getForgettingLevel(timestamp) {
  const age = Date.now() - timestamp;
  
  if (age < FORGETTING_LEVELS.RECENT.maxAge) return FORGETTING_LEVELS.RECENT;
  if (age < FORGETTING_LEVELS.SHORT_TERM.maxAge) return FORGETTING_LEVELS.SHORT_TERM;
  if (age < FORGETTING_LEVELS.MEDIUM_TERM.maxAge) return FORGETTING_LEVELS.MEDIUM_TERM;
  if (age < FORGETTING_LEVELS.LONG_TERM.maxAge) return FORGETTING_LEVELS.LONG_TERM;
  return FORGETTING_LEVELS.ARCHIVE;
}

/**
 * Apply "visual blur" compression to memory content
 * This simulates how text becomes unreadable when viewed from far away
 * 
 * @param {object} memory - Memory entry with content and timestamp
 * @returns {object} Compressed memory with forgetting metadata
 */
function compressMemory(memory) {
  const level = getForgettingLevel(memory.timestamp || Date.now());
  
  // Calculate compressed representation
  const compressed = {
    id: memory.id,
    timestamp: memory.timestamp,
    forgettingLevel: level.label,
    compression: level.compression,
    precision: level.precision,
    // Content gets "abstracted" based on compression level
    content: abstractContent(memory.content, level.compression),
    // Preserve key structural elements (like word shapes at distance)
    preserved: preserveStructure(memory.content, level.compression)
  };
  
  return compressed;
}

/**
 * Abstract content based on compression ratio
 * High compression = more abstraction, like reading blurred text
 */
function abstractContent(content, compression) {
  if (!content || typeof content !== 'string') return content;
  
  if (compression <= 1) return content; // No abstraction for recent memories
  
  // For moderate compression: keep first letter of each "important" word
  if (compression <= 10) {
    const words = content.split(/\s+/);
    const abstracted = words.map((word, i) => {
      // Keep words that are < 4 chars (they're still readable when blurred)
      if (word.length <= 3) return word;
      // For longer words, keep first letter
      return word[0] + (i % 3 === 0 ? '..' : '.');
    });
    return abstracted.join(' ');
  }
  
  // For high compression: keep only key structural words
  if (compression <= 16) {
    const words = content.split(/\s+/);
    const keyWords = words.filter(w => w.length > 3).slice(0, Math.ceil(words.length / 4));
    return '[ ' + keyWords.join(' ') + ' ]';
  }
  
  // For very high compression: just preserve the "shape" of the memory
  return '[ memory trace ]';
}

/**
 * Preserve structural elements (like word shapes visible from afar)
 */
function preserveStructure(content, compression) {
  if (!content || typeof content !== 'string') return {};
  
  return {
    length: content.length,
    wordCount: content.split(/\s+/).length,
    // First and last words are often most memorable (serial position effect)
    firstWord: content.split(/\s+/)[0],
    lastWord: content.split(/\s+/).pop(),
    // Estimated semantic density
    semanticDensity: content.length / content.split(/\s+/).length
  };
}

/**
 * Attempt to retrieve a compressed memory (with loss)
 * Returns the best-effort reconstruction based on available information
 */
function retrieveWithForgetting(memory) {
  const level = getForgettingLevel(memory.timestamp || Date.now());
  
  return {
    id: memory.id,
    timestamp: memory.timestamp,
    forgettingLevel: level.label,
    precision: level.precision,
    content: memory.content,
    preserved: memory.preserved,
    // Reconstruction hint based on precision
    reconstructionConfidence: level.precision,
    retrievalNote: level.precision < 0.8 
      ? `Memory is ${level.label} — reconstruction with ${Math.round(level.precision * 100)}% confidence`
      : null
  };
}

/**
 * Check if a memory should be "forgotten" (deleted from active storage)
 * Based on DeepSeek-OCR finding: 20x compression still retains ~60% structure
 * If precision drops below threshold, memory becomes "noise"
 */
function shouldForget(memory, threshold = 0.3) {
  const level = getForgettingLevel(memory.timestamp || Date.now());
  return level.precision < threshold;
}

/**
 * Consolidate multiple memories of the same "event" into an abstracted summary
 * Like how detailed experiences become generalized memories over time
 */
function consolidateMemories(memories) {
  if (!memories || memories.length === 0) return null;
  if (memories.length === 1) return memories[0];
  
  const timestamps = memories.map(m => m.timestamp || 0);
  const avgTimestamp = timestamps.reduce((a, b) => a + b, 0) / timestamps.length;
  
  // Extract common themes/patterns
  const allContent = memories.map(m => m.content || '').join(' ');
  const words = allContent.split(/\s+/);
  const wordFreq = {};
  words.forEach(w => { if (w.length > 3) wordFreq[w] = (wordFreq[w] || 0) + 1; });
  
  // Keep most frequent meaningful words
  const keyThemes = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(e => e[0]);
  
  return {
    id: `consolidated-${Date.now()}`,
    timestamp: avgTimestamp,
    forgettingLevel: 'consolidated',
    compression: 25,
    precision: 0.5,
    content: `[Consolidated memory of ${memories.length} related experiences: ${keyThemes.join(', ')}]`,
    preserved: {
      memoryCount: memories.length,
      themes: keyThemes,
      timeSpan: Math.max(...timestamps) - Math.min(...timestamps)
    }
  };
}

module.exports = {
  FORGETTING_LEVELS,
  getForgettingLevel,
  compressMemory,
  abstractContent,
  preserveStructure,
  retrieveWithForgetting,
  shouldForget,
  consolidateMemories
};
