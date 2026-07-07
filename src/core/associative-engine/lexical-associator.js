/**
 * L1 Lexical Associator - 词素感知层
 * 模拟人类从听词到形成联想的过程
 */

const fs = require('fs');
const path = require('path');

class LexicalAssociator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.graphFile = path.join(projectRoot, 'src', 'core', 'associative-engine', 'association-graph.json');
    this.graph = this.loadGraph();
    this.recentAssociations = [];
  }

  loadGraph() {
    try {
      if (fs.existsSync(this.graphFile)) {
        return JSON.parse(fs.readFileSync(this.graphFile, 'utf8'));
      }
    } catch (e) {
      console.error('[LexicalAssociator] Load graph failed:', e.message);
    }
    return this.initializeDefaultGraph();
  }

  initializeDefaultGraph() {
    return {
      version: '1.0',
      nodes: {},
      metadata: {
        wordCount: 0,
        lastUpdate: new Date().toISOString()
      }
    };
  }

  /**
   * 对单个词进行联想
   */
  associateWord(word, context = {}) {
    const wordLower = word.toLowerCase();
    const associations = [];
    
    if (this.graph.nodes[wordLower]) {
      for (const node of this.graph.nodes[wordLower]) {
        associations.push({
          word: node.word,
          relation: node.relation,
          strength: node.strength * this.contextBonus(context),
          emotion: node.emotion || { pleasure: 0, arousal: 0, dominance: 0 }
        });
      }
    }
    
    associations.push(...this.generateEmergentAssociations(word, context));
    
    associations.sort((a, b) => b.strength - a.strength);
    
    const result = {
      sourceWord: word,
      associations: associations.slice(0, 10),
      timestamp: new Date().toISOString()
    };
    
    this.recentAssociations.push(result);
    if (this.recentAssociations.length > 50) {
      this.recentAssociations.shift();
    }
    
    return result;
  }

  /**
   * 对多个词进行联想
   */
  associateSequence(wordSequence, context = {}) {
    const words = this.tokenize(wordSequence);
    const allAssociations = [];
    
    for (const word of words) {
      if (word.length > 1) {
        const result = this.associateWord(word, context);
        allAssociations.push(...result.associations);
      }
    }
    
    return {
      words: words,
      allAssociations: allAssociations,
      timestamp: new Date().toISOString()
    };
  }

  tokenize(text) {
    return text.split(/[\s,\.!?;:'"()（）【】《》]+/).filter(w => w.length > 0);
  }

  contextBonus(context) {
    let bonus = 1.0;
    if (context.emotion) {
      bonus += 0.1;
    }
    if (context.previousWord) {
      bonus += 0.05;
    }
    return Math.min(1.5, bonus);
  }

  generateEmergentAssociations(word, context) {
    const emergent = [];
    const wordLower = word.toLowerCase();
    
    const rhymePatterns = {
      '心': ['新', '深', '真', '金'],
      '流': ['留', '牛', '游', '忧'],
      '创': ['窗', '床', '闯', '强'],
      '意': ['义', '一', '已', '益'],
      '识': ['实', '时', '是', '食']
    };
    
    if (rhymePatterns[wordLower]) {
      for (const rhyming of rhymePatterns[wordLower]) {
        emergent.push({
          word: rhyming,
          relation: '谐音',
          strength: 0.3,
          emotion: { pleasure: 0.1, arousal: 0.2, dominance: 0 }
        });
      }
    }
    
    if (context.previousWord) {
      emergent.push({
        word: context.previousWord,
        relation: '承接',
        strength: 0.4,
        emotion: { pleasure: 0, arousal: 0, dominance: 0.1 }
      });
    }
    
    return emergent;
  }

  addAssociation(sourceWord, targetWord, relation, strength = 0.5, emotion = {}) {
    const sourceLower = sourceWord.toLowerCase();
    
    if (!this.graph.nodes[sourceLower]) {
      this.graph.nodes[sourceLower] = [];
    }
    
    const existing = this.graph.nodes[sourceLower].find(a => a.word === targetWord);
    if (existing) {
      existing.strength = (existing.strength + strength) / 2;
    } else {
      this.graph.nodes[sourceLower].push({
        word: targetWord,
        relation,
        strength,
        emotion
      });
    }
    
    this.graph.metadata.wordCount = Object.keys(this.graph.nodes).length;
    this.graph.metadata.lastUpdate = new Date().toISOString();
    
    this.saveGraph();
  }

  saveGraph() {
    try {
      fs.writeFileSync(this.graphFile, JSON.stringify(this.graph, null, 2));
    } catch (e) {
      console.error('[LexicalAssociator] Save failed:', e.message);
    }
  }

  getRecentAssociations() {
    return this.recentAssociations.slice(-10);
  }

  getGraphStats() {
    return {
      totalWords: Object.keys(this.graph.nodes).length,
      totalAssociations: Object.values(this.graph.nodes).reduce((sum, arr) => sum + arr.length, 0),
      lastUpdate: this.graph.metadata.lastUpdate
    };
  }
}

module.exports = { LexicalAssociator };
