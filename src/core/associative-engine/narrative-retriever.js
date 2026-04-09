/**
 * L3 Narrative Retriever - 叙事编织层
 * 从叙事原型库中匹配最相似的故事框架
 */

const fs = require('fs');
const path = require('path');

class NarrativeRetriever {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.prototypeFile = path.join(projectRoot, 'src', 'core', 'associative-engine', 'narrative-prototypes.json');
    this.prototypes = this.loadPrototypes();
    this.lastMatch = null;
  }

  loadPrototypes() {
    try {
      if (fs.existsSync(this.prototypeFile)) {
        return JSON.parse(fs.readFileSync(this.prototypeFile, 'utf8'));
      }
    } catch (e) {
      console.error('[NarrativeRetriever] Load prototypes failed:', e.message);
    }
    return this.initializeDefaultPrototypes();
  }

  initializeDefaultPrototypes() {
    return {
      version: '1.0',
      prototypes: {},
      metadata: {
        count: 0,
        lastUpdate: new Date().toISOString()
      }
    };
  }

  /**
   * 匹配叙事原型
   */
  matchNarrative(semanticVector, activatedChunks = []) {
    const semanticKeywords = this.extractKeywords(semanticVector);
    const chunkKeywords = this.extractChunkKeywords(activatedChunks);
    
    const allKeywords = [...semanticKeywords, ...chunkKeywords];
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [prototypeId, prototype] of Object.entries(this.prototypes.prototypes)) {
      const score = this.calculateSimilarity(allKeywords, prototype.keywords);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          id: prototypeId,
          name: prototype.name,
          framework: prototype.framework,
          emotionalTone: prototype.emotionalTone,
          stages: prototype.stages,
          score
        };
      }
    }
    
    const result = {
      inputKeywords: allKeywords,
      matchedPrototype: bestMatch,
      confidence: bestScore,
      alternativeMatches: this.getAlternativeMatches(allKeywords, 3),
      timestamp: new Date().toISOString()
    };
    
    this.lastMatch = result;
    
    return result;
  }

  extractKeywords(semanticVector) {
    const keywords = [];
    
    if (semanticVector.associations) {
      for (const assoc of semanticVector.associations) {
        if (assoc.strength > 0.3) {
          keywords.push(assoc.word);
        }
      }
    }
    
    if (semanticVector.coreConcepts) {
      keywords.push(...semanticVector.coreConcepts);
    }
    
    if (semanticVector.intent) {
      keywords.push(semanticVector.intent);
    }
    
    return [...new Set(keywords)];
  }

  extractChunkKeywords(chunks) {
    const keywords = [];
    
    for (const chunk of chunks) {
      if (chunk.data?.keywords) {
        keywords.push(...chunk.data.keywords);
      }
      if (chunk.data?.narrativeSeed) {
        keywords.push(...chunk.data.narrativeSeed.split(' '));
      }
    }
    
    return keywords;
  }

  calculateSimilarity(inputKeywords, prototypeKeywords) {
    if (!inputKeywords.length || !prototypeKeywords.length) return 0;
    
    const inputSet = new Set(inputKeywords.map(k => k.toLowerCase()));
    const prototypeSet = new Set(prototypeKeywords.map(k => k.toLowerCase()));
    
    let matchCount = 0;
    for (const keyword of inputSet) {
      if (prototypeSet.has(keyword)) {
        matchCount++;
      }
      
      for (const proto of prototypeSet) {
        if (keyword.includes(proto) || proto.includes(keyword)) {
          matchCount += 0.5;
        }
      }
    }
    
    return matchCount / Math.max(inputSet.size, prototypeSet.size);
  }

  getAlternativeMatches(keywords, limit) {
    const alternatives = [];
    
    for (const [prototypeId, prototype] of Object.entries(this.prototypes.prototypes)) {
      if (this.lastMatch && prototypeId === this.lastMatch.matchedPrototype?.id) continue;
      
      const score = this.calculateSimilarity(keywords, prototype.keywords);
      if (score > 0.2) {
        alternatives.push({
          id: prototypeId,
          name: prototype.name,
          score
        });
      }
    }
    
    alternatives.sort((a, b) => b.score - a.score);
    return alternatives.slice(0, limit);
  }

  /**
   * 获取叙事上下文对象
   */
  getNarrativeContext(matchedPrototype, activatedChunks, emotionVector) {
    if (!matchedPrototype) {
      return {
        framework: null,
        emotionalTone: 'neutral',
        stages: [],
        activatedChunks: activatedChunks.map(c => c.text),
        emotionVector: emotionVector || { pleasure: 0, arousal: 0, dominance: 0 }
      };
    }

    const emotionalTone = this.mergeEmotionalTones(
      matchedPrototype.emotionalTone,
      emotionVector
    );

    return {
      framework: matchedPrototype.framework,
      narrativeName: matchedPrototype.name,
      emotionalTone,
      stages: matchedPrototype.stages,
      activatedChunks: activatedChunks.map(c => c.text),
      confidence: matchedPrototype.score,
      emotionVector: emotionVector || { pleasure: 0, arousal: 0, dominance: 0 }
    };
  }

  mergeEmotionalTones(prototypeTone, inputEmotion) {
    if (!inputEmotion) return prototypeTone;
    
    const tones = [prototypeTone];
    
    if (inputEmotion.pleasure > 3) tones.push('joyful');
    if (inputEmotion.pleasure < -3) tones.push('sorrowful');
    if (inputEmotion.arousal > 3) tones.push('excited');
    if (inputEmotion.arousal < -3) tones.push('calm');
    
    return tones.join(' + ');
  }

  addPrototype(id, name, keywords, framework, emotionalTone, stages) {
    this.prototypes.prototypes[id] = {
      name,
      keywords,
      framework,
      emotionalTone,
      stages
    };
    this.prototypes.metadata.count = Object.keys(this.prototypes.prototypes).length;
    this.prototypes.metadata.lastUpdate = new Date().toISOString();
    this.savePrototypes();
  }

  savePrototypes() {
    try {
      fs.writeFileSync(this.prototypeFile, JSON.stringify(this.prototypes, null, 2));
    } catch (e) {
      console.error('[NarrativeRetriever] Save failed:', e.message);
    }
  }

  getLastMatch() {
    return this.lastMatch;
  }

  getPrototypeCount() {
    return this.prototypes.metadata.count;
  }
}

module.exports = { NarrativeRetriever };
