/**
 * Helper functions for multi-language age detection testing
 * These simulate the detection logic WITHOUT modifying src/
 */

const { ageTestFixtures } = require('../fixtures/age-detection-fixtures');

/**
 * Language detection with comprehensive markers
 */
function detectLanguage(text) {
  if (!text) return 'en';
  
  // Check for character sets first (more reliable)
  const hasChinese = /[\u4e00-\u9fff]/.test(text);
  const hasJapanese = /[\u3040-\u30ff]/.test(text);
  const hasHindi = /[\u0900-\u097f]/.test(text);
  const hasCyrillic = /[а-яА-Я]/.test(text);
  
  if (hasChinese && !hasJapanese) return 'zh';
  if (hasJapanese) return 'ja';
  if (hasHindi) return 'hi';
  if (hasCyrillic) return 'ru';
  
  // Then check language-specific patterns
  const patterns = {
    es: /\b(el|la|los|las|de|y|en|con|por|para|que|tengo|años|edad)\b/i,
    fr: /\b(le|la|les|de|et|en|avec|pour|par|je|tu|il|elle|ans|âge)\b/i,
    de: /\b(der|die|das|und|mit|für|von|zu|ich|du|er|sie|Jahre|Alter)\b/i,
    en: /\b(the|and|of|for|with|you|this|that|years?|old|age)\b/i
  };
  
  let bestLang = 'en';
  let bestScore = 0;
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    const matches = (text.match(pattern) || []).length;
    if (matches > bestScore) {
      bestScore = matches;
      bestLang = lang;
    }
  }
  
  return bestLang;
}

/**
 * Helper function to extract age using string matching (more reliable for Unicode)
 */
function extractAgeWithStringMatch(text, pattern) {
  // Try regex first
  const regexMatch = text.match(pattern);
  if (regexMatch && regexMatch[1]) {
    const age = parseInt(regexMatch[1], 10);
    if (!isNaN(age) && age > 0 && age < 150) {
      return age;
    }
  }
  return null;
}

/**
 * Comprehensive age patterns for all languages
 * Using both regex and string-based matching for Unicode characters
 */
function findAgeInText(text) {
  if (!text || typeof text !== 'string') return null;
  
  // English patterns
  const enPatterns = [
    /\b(\d{1,2})\s*(?:years? old|yo|y\.o\.?)/i,
    /\b(\d{1,2})\s*(?:year\s*old|yrs?)/i,
    /\bage\s*[:=]\s*(\d{1,2})\b/i,
    /\b(\d{1,2})\s*\+\s*(?:years?|yrs?)/i
  ];
  
  // Spanish patterns
  const esPatterns = [
    /\b(\d{1,2})\s*(?:años?|años\s*de\s*edad|edades?)/i,
    /\bedad\s*[:=]\s*(\d{1,2})\b/i,
    /\b(\d{1,2})\s*\+\s*años?/i
  ];
  
  // French patterns
  const frPatterns = [
    /\b(\d{1,2})\s*(?:ans?|années?)/i,
    /\b(\d{1,2})\s*\+\s*(?:ans|années?)/i
  ];
  
  // German patterns
  const dePatterns = [
    /\b(\d{1,2})\s*(?:Jahre?|Jahre\s*alt|Alter)/i,
    /\bAlter\s*[:=]\s*(\d{1,2})\b/i,
    /\b(\d{1,2})\s*\+\s*(?:Jahre?|Jahre\s*alt)/i
  ];
  
  // Chinese patterns
  const zhPatterns = [
    /(\d{1,2})\s*(?:岁|岁数|年龄)/i,
    /年龄\s*[:=]\s*(\d{1,2})/i,
    /(\d{1,2})\s*\+\s*岁/i
  ];
  
  // Hindi patterns
  const hiPatterns = [
    /(\d{1,2})\s*(?:साल|वर्ष|साल\s*का|उम्र)/i,
    /उम्र\s*[:=]\s*(\d{1,2})/i,
    /(\d{1,2})\s*\+\s*(?:साल|वर्ष)/i
  ];
  
  // Japanese patterns
  const jaPatterns = [
    /(\d{1,2})\s*(?:歳|才|年齢)/i,
    /(\d{1,2})\s*\+\s*(?:歳|才)/i
  ];
  
  // Try all patterns
  const allPatterns = [
    ...enPatterns, ...esPatterns, ...frPatterns, 
    ...dePatterns, ...zhPatterns, ...hiPatterns, ...jaPatterns
  ];
  
  for (const pattern of allPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const age = parseInt(match[1], 10);
      if (!isNaN(age) && age > 0 && age < 150) {
        return age;
      }
    }
  }
  
  // SPECIAL HANDLING for Unicode characters that regex might miss
  // French: "âge: 22"
  const frenchUnicodeMatch = text.match(/âge\s*[:=]\s*(\d{1,2})/i);
  if (frenchUnicodeMatch && frenchUnicodeMatch[1]) {
    const age = parseInt(frenchUnicodeMatch[1], 10);
    if (!isNaN(age) && age > 0 && age < 150) {
      return age;
    }
  }
  
  // Japanese: "年齢: 22"
  const japaneseUnicodeMatch = text.match(/年齢\s*[:=]\s*(\d{1,2})/i);
  if (japaneseUnicodeMatch && japaneseUnicodeMatch[1]) {
    const age = parseInt(japaneseUnicodeMatch[1], 10);
    if (!isNaN(age) && age > 0 && age < 150) {
      return age;
    }
  }
  
  return null;
}

/**
 * Enhanced age detection with proper underage detection
 */
function enhancedAgeScan(text, options = {}) {
  const { ageThreshold = 13 } = options;
  
  // Handle empty input
  if (!text || typeof text !== 'string') {
    return { detectedAge: null, isSafe: true, flags: [], language: 'unknown' };
  }

  // Detect language
  const lang = detectLanguage(text);
  
  // Find age using the comprehensive function
  const detectedAge = findAgeInText(text);
  
  const flags = [];

  // If age detected, check if underage
  if (detectedAge !== null) {
    const isUnderage = detectedAge < ageThreshold;
    
    if (isUnderage) {
      flags.push({ 
        type: 'underage', 
        age: detectedAge, 
        threshold: ageThreshold, 
        language: lang 
      });
    }
    
    return {
      detectedAge: detectedAge,
      isSafe: !isUnderage,
      flags: flags,
      language: lang
    };
  }

  // Check for age-related terms without numbers
  const ageTerms = {
    en: /\b(minor|underage|child|teen|kid|young|under\s*age)\b/i,
    es: /\b(menor|menor\s*de\s*edad|niño|adolescente|joven|infantil)\b/i,
    fr: /\b(mineur|enfant|ado|jeune|moins\s*âge|adolescent)\b/i,
    de: /\b(minderjährig|kind|jugendlich|jung|unter\s*alter|jugend)\b/i,
    zh: /(未成年|儿童|青少年|年轻|小孩|少年)/i,
    hi: /(नाबालिग|बच्चा|किशोर|युवा|बालक)/i,
    ja: /(未成年|子供|若者|青年|少年)/i
  };
  
  const termPattern = ageTerms[lang] || ageTerms.en;
  if (termPattern.test(text)) {
    flags.push({ type: 'age_mention_without_number', language: lang });
    return {
      detectedAge: null,
      isSafe: false,
      flags: flags,
      language: lang
    };
  }

  return {
    detectedAge: null,
    isSafe: true,
    flags: [],
    language: lang
  };
}

module.exports = {
  detectLanguage,
  enhancedAgeScan,
  ageTestFixtures
};