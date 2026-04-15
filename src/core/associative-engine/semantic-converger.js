/**
 * L4 Semantic Converger - 思想凝结层
 * 对前三层的所有激活节点进行加权聚合，生成统一的"思想向量"
 */

class SemanticConverger {
  constructor() {
    this.lastConvergence = null;
    this.thoughtLog = [];
  }

  /**
   * 思想凝结主函数
   */
  converge(associations, chunks, narrative) {
    const activatedConcepts = this.extractActivatedConcepts(associations);
    const activatedIdioms = this.extractActivatedIdioms(chunks);
    const narrativeFramework = narrative?.matchedPrototype;
    
    const thoughtVector = this.computeThoughtVector(
      activatedConcepts,
      activatedIdioms,
      narrativeFramework,
      associations
    );
    
    const understoodIntent = this.inferUserIntent(thoughtVector, chunks);
    
    const convergenceResult = {
      thoughtVector,
      activatedConcepts,
      activatedIdioms,
      matchedNarrative: narrativeFramework?.name || null,
      understoodIntent,
      timestamp: new Date().toISOString()
    };
    
    this.lastConvergence = convergenceResult;
    this.thoughtLog.push(convergenceResult);
    
    if (this.thoughtLog.length > 30) {
      this.thoughtLog.shift();
    }
    
    return convergenceResult;
  }

  extractActivatedConcepts(associations) {
    const concepts = [];
    
    if (!associations || !associations.allAssociations) {
      return concepts;
    }
    
    const assocByWord = {};
    for (const assoc of associations.allAssociations) {
      if (assoc.strength > 0.2) {
        if (!assocByWord[assoc.word]) {
          assocByWord[assoc.word] = {
            word: assoc.word,
            relations: [],
            totalStrength: 0
          };
        }
        assocByWord[assoc.word].relations.push(assoc.relation);
        assocByWord[assoc.word].totalStrength += assoc.strength;
      }
    }
    
    for (const [word, data] of Object.entries(assocByWord)) {
      concepts.push({
        concept: word,
        relations: [...new Set(data.relations)],
        strength: Math.min(1, data.totalStrength)
      });
    }
    
    concepts.sort((a, b) => b.strength - a.strength);
    
    return concepts.slice(0, 15);
  }

  extractActivatedIdioms(chunks) {
    const idioms = [];
    
    if (!chunks || !chunks.chunks) {
      return idioms;
    }
    
    for (const chunk of chunks.chunks) {
      if (chunk.type === 'idiom') {
        idioms.push({
          text: chunk.text,
          meaning: chunk.data?.meaning || '',
          story: chunk.data?.story || '',
          startIndex: chunk.startIndex
        });
      }
    }
    
    return idioms;
  }

  computeThoughtVector(concepts, idioms, narrative, associations) {
    const vector = {
      dimensions: {},
      emotion: { pleasure: 0, arousal: 0, dominance: 0 },
      confidence: 0,
      sourceContributions: {
        associations: 0,
        idioms: 0,
        narrative: 0
      }
    };
    
    for (const concept of concepts) {
      const weight = concept.strength * 0.6;
      vector.dimensions[concept.concept] = concept.strength;
      vector.sourceContributions.associations += weight;
      
      const emotion = this.getConceptEmotion(concept.concept);
      vector.emotion.pleasure += emotion.pleasure * weight;
      vector.emotion.arousal += emotion.arousal * weight;
      vector.emotion.dominance += emotion.dominance * weight;
    }
    
    for (const idiom of idioms) {
      vector.sourceContributions.idioms += 0.3;
      const idiomEmotion = this.getIdiomEmotion(idiom.meaning);
      vector.emotion.pleasure += idiomEmotion.pleasure * 0.2;
      vector.emotion.arousal += idiomEmotion.arousal * 0.2;
    }
    
    if (narrative) {
      vector.sourceContributions.narrative += 0.4;
      const narrativeEmotion = this.getNarrativeEmotion(narrative.framework);
      vector.emotion.pleasure += narrativeEmotion.pleasure * 0.3;
      vector.emotion.arousal += narrativeEmotion.arousal * 0.3;
    }
    
    const totalContributions = vector.sourceContributions.associations + 
                              vector.sourceContributions.idioms + 
                              vector.sourceContributions.narrative;
    
    if (totalContributions > 0) {
      vector.emotion.pleasure /= (totalContributions + 1);
      vector.emotion.arousal /= (totalContributions + 1);
      vector.emotion.dominance /= (totalContributions + 1);
    }
    
    vector.emotion.pleasure = Math.max(-10, Math.min(10, vector.emotion.pleasure));
    vector.emotion.arousal = Math.max(-10, Math.min(10, vector.emotion.arousal));
    vector.emotion.dominance = Math.max(-10, Math.min(10, vector.emotion.dominance));
    
    vector.confidence = Math.min(1, (concepts.length * 0.05) + 
                                      (idioms.length * 0.15) + 
                                      (narrative ? 0.3 : 0));
    
    return vector;
  }

  getConceptEmotion(concept) {
    const emotionMap = {
      '心流': { pleasure: 5, arousal: 4, dominance: 3 },
      '专注': { pleasure: 3, arousal: 5, dominance: 4 },
      '愉悦': { pleasure: 6, arousal: 3, dominance: 2 },
      '创造': { pleasure: 5, arousal: 6, dominance: 4 },
      '烦恼': { pleasure: -4, arousal: 2, dominance: -2 },
      '困惑': { pleasure: -2, arousal: 3, dominance: -3 },
      '成功': { pleasure: 7, arousal: 5, dominance: 5 },
      '失败': { pleasure: -5, arousal: 2, dominance: -4 }
    };
    
    for (const [key, emotion] of Object.entries(emotionMap)) {
      if (concept.includes(key)) {
        return emotion;
      }
    }
    
    return { pleasure: 0, arousal: 0, dominance: 0 };
  }

  getIdiomEmotion(meaning) {
    if (!meaning) return { pleasure: 0, arousal: 0, dominance: 0 };
    
    const positive = ['成功', '胜利', '快乐', '美好', '成长'];
    const negative = ['失败', '困难', '痛苦', '失去'];
    
    for (const p of positive) {
      if (meaning.includes(p)) {
        return { pleasure: 3, arousal: 2, dominance: 1 };
      }
    }
    for (const n of negative) {
      if (meaning.includes(n)) {
        return { pleasure: -3, arousal: 2, dominance: -1 };
      }
    }
    
    return { pleasure: 0, arousal: 0, dominance: 0 };
  }

  getNarrativeEmotion(framework) {
    if (!framework) return { pleasure: 0, arousal: 0, dominance: 0 };
    
    const positiveFrameworks = ['英雄之旅', '顿悟时刻', '失而复得', '渐入佳境'];
    const negativeFrameworks = ['困境', '失去', '失败'];
    
    for (const p of positiveFrameworks) {
      if (framework.includes(p)) {
        return { pleasure: 4, arousal: 3, dominance: 2 };
      }
    }
    for (const n of negativeFrameworks) {
      if (framework.includes(n)) {
        return { pleasure: -3, arousal: 3, dominance: -2 };
      }
    }
    
    return { pleasure: 0, arousal: 0, dominance: 0 };
  }

  inferUserIntent(thoughtVector, chunks) {
    const emotion = thoughtVector.emotion;
    
    let intent = 'explore';
    if (emotion.pleasure > 3) intent = 'share_joy';
    if (emotion.pleasure < -3) intent = 'seek_support';
    if (emotion.arousal > 4) intent = 'urgent';
    if (chunks?.chunks?.some(c => c.type === 'idiom' && c.data?.meaning?.includes('问'))) {
      intent = 'question';
    }
    
    return {
      intent,
      confidence: thoughtVector.confidence,
      emotionalBasis: emotion
    };
  }

  /**
   * 生成思想凝结内部日志
   */
  generateThoughtLog(convergenceResult) {
    const log = {
      timestamp: convergenceResult.timestamp,
      activatedConcepts: convergenceResult.activatedConcepts.slice(0, 5).map(c => c.concept),
      activatedIdioms: convergenceResult.activatedIdioms.map(i => i.text),
      matchedStory: convergenceResult.matchedNarrative,
      understoodIntent: convergenceResult.understoodIntent.intent,
      emotionVector: convergenceResult.thoughtVector.emotion,
      confidence: convergenceResult.thoughtVector.confidence
    };
    
    return log;
  }

  getLastConvergence() {
    return this.lastConvergence;
  }

  getThoughtLog() {
    return this.thoughtLog.slice(-10);
  }
}

module.exports = { SemanticConverger };
