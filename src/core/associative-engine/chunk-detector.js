/**
 * L2 Chunk Detector - 短语整合层
 * 识别成语、俗语、诗词引用
 */

const fs = require('fs');
const path = require('path');

class ChunkDetector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.idiomFile = path.join(projectRoot, 'src', 'core', 'associative-engine', 'idiom-story-db.json');
    this.idiomDB = this.loadIdiomDB();
    this.detectedChunks = [];
  }

  loadIdiomDB() {
    try {
      if (fs.existsSync(this.idiomFile)) {
        return JSON.parse(fs.readFileSync(this.idiomFile, 'utf8'));
      }
    } catch (e) {
      console.error('[ChunkDetector] Load idiom DB failed:', e.message);
    }
    return this.initializeDefaultIdiomDB();
  }

  initializeDefaultIdiomDB() {
    return {
      version: '1.0',
      idioms: {},
      poetry: {},
      proverbs: {},
      metadata: {
        lastUpdate: new Date().toISOString()
      }
    };
  }

  /**
   * 检测词序列中的语块
   */
  detectChunks(wordSequence) {
    const words = this.tokenize(wordSequence);
    const chunks = [];
    
    for (let i = 0; i < words.length; i++) {
      const idiom = this.detectIdiomAt(words, i);
      if (idiom) {
        chunks.push(idiom);
        i += idiom.length - 1;
        continue;
      }
      
      const poetry = this.detectPoetryAt(words, i);
      if (poetry) {
        chunks.push(poetry);
        continue;
      }
      
      const proverb = this.detectProverbAt(words, i);
      if (proverb) {
        chunks.push(proverb);
      }
    }
    
    const result = {
      originalText: wordSequence,
      chunks: chunks,
      tokenCount: words.length,
      timestamp: new Date().toISOString()
    };
    
    this.detectedChunks.push(result);
    if (this.detectedChunks.length > 30) {
      this.detectedChunks.shift();
    }
    
    return result;
  }

  tokenize(text) {
    return text.split(/[\s,\.!?;:'"()（）【】《》]+/).filter(w => w.length > 0);
  }

  detectIdiomAt(words, startIndex) {
    for (let len = 4; len >= 2; len--) {
      if (startIndex + len > words.length) continue;
      
      const phrase = words.slice(startIndex, startIndex + len).join('');
      
      if (this.idiomDB.idioms[phrase]) {
        return {
          type: 'idiom',
          text: phrase,
          length: len,
          data: this.idiomDB.idioms[phrase],
          startIndex
        };
      }
      
      const reversed = phrase.split('').reverse().join('');
      if (this.idiomDB.idioms[reversed]) {
        return {
          type: 'idiom',
          text: phrase,
          length: len,
          data: this.idiomDB.idioms[reversed],
          startIndex
        };
      }
    }
    return null;
  }

  detectPoetryAt(words, startIndex) {
    for (let len = 5; len >= 2; len--) {
      if (startIndex + len > words.length) continue;
      
      const phrase = words.slice(startIndex, startIndex + len).join('');
      
      if (this.idiomDB.poetry[phrase]) {
        return {
          type: 'poetry',
          text: phrase,
          length: len,
          data: this.idiomDB.poetry[phrase],
          startIndex
        };
      }
    }
    return null;
  }

  detectProverbAt(words, startIndex) {
    for (let len = 6; len >= 2; len--) {
      if (startIndex + len > words.length) continue;
      
      const phrase = words.slice(startIndex, startIndex + len).join('');
      
      if (this.idiomDB.proverbs[phrase]) {
        return {
          type: 'proverb',
          text: phrase,
          length: len,
          data: this.idiomDB.proverbs[phrase],
          startIndex
        };
      }
    }
    return null;
  }

  /**
   * 检索成语的典故
   */
  retrieveIdiomStory(chunk) {
    if (!chunk || chunk.type !== 'idiom') {
      return null;
    }
    
    const idiom = chunk.text;
    
    if (this.idiomDB.idioms[idiom]) {
      return {
        idiom: idiom,
        story: this.idiomDB.idioms[idiom].story || '无典故记录',
        meaning: this.idiomDB.idioms[idiom].meaning || '',
        origin: this.idiomDB.idioms[idiom].origin || '',
        narrativeSeed: this.idiomDB.idioms[idiom].narrativeSeed || null
      };
    }
    
    return null;
  }

  /**
   * 将激活的典故作为叙事种子
   */
  extractNarrativeSeeds(chunks) {
    const seeds = [];
    
    for (const chunk of chunks) {
      if (chunk.type === 'idiom' && chunk.data?.narrativeSeed) {
        seeds.push({
          type: 'idiom',
          text: chunk.text,
          seed: chunk.data.narrativeSeed
        });
      }
      
      if (chunk.type === 'poetry' && chunk.data?.narrativeSeed) {
        seeds.push({
          type: 'poetry',
          text: chunk.text,
          seed: chunk.data.narrativeSeed
        });
      }
    }
    
    return seeds;
  }

  addIdiom(idiom, story, meaning, origin, narrativeSeed) {
    this.idiomDB.idioms[idiom] = {
      story,
      meaning,
      origin,
      narrativeSeed
    };
    this.idiomDB.metadata.lastUpdate = new Date().toISOString();
    this.saveIdiomDB();
  }

  addPoetry(poetry, content, author, era, narrativeSeed) {
    this.idiomDB.poetry[poetry] = {
      content,
      author,
      era,
      narrativeSeed
    };
    this.idiomDB.metadata.lastUpdate = new Date().toISOString();
    this.saveIdiomDB();
  }

  saveIdiomDB() {
    try {
      fs.writeFileSync(this.idiomFile, JSON.stringify(this.idiomDB, null, 2));
    } catch (e) {
      console.error('[ChunkDetector] Save failed:', e.message);
    }
  }

  getRecentChunks() {
    return this.detectedChunks.slice(-10);
  }

  getIdiomCount() {
    return Object.keys(this.idiomDB.idioms).length;
  }
}

module.exports = { ChunkDetector };
