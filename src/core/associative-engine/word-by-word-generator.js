/**
 * L5 Word-by-Word Generator - 逐词回复生成层
 * 模拟人类说话过程，逐词生成回复
 */

const fs = require('fs');
const path = require('path');

class WordByWordGenerator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.stateFile = path.join(projectRoot, '.opencode', 'memory', 'word-gen-trace.json');
    this.currentTrace = [];
    this.vocabulary = this.loadVocabulary();
  }

  loadVocabulary() {
    return {
      common: ['我', '你', '他', '她', '它', '是', '在', '有', '和', '了', '这', '那', '也', '都', '就', '要', '可以', '知道', '认为', '觉得'],
      emotional: ['开心', '难过', '感动', '担心', '放心', '期待', '感谢', '理解', '支持', '相信'],
      flow: ['心流', '专注', '沉浸', '创造', '体验', '状态', '进入', '保持', '感受'],
      transition: ['但是', '而且', '所以', '因为', '虽然', '如果', '不过', '其实', '然后']
    };
  }

  /**
   * 生成回复
   */
  generateResponse(thoughtVector, userModel = {}, maxLength = 200) {
    this.currentTrace = [];
    
    const responseState = {
      generatedWords: [],
      thoughtVector,
      userModel,
      completed: false
    };
    
    this.recordTrace('start', { thoughtVector: thoughtVector.dimensions, emotion: thoughtVector.emotion });
    
    const firstWord = this.selectFirstWord(thoughtVector);
    responseState.generatedWords.push(firstWord);
    this.recordTrace('select_first_word', { word: firstWord });
    
    while (!responseState.completed && this.getLength(responseState.generatedWords) < maxLength) {
      const nextWord = await this.predictNextWord(responseState);
      responseState.generatedWords.push(nextWord);
      
      this.recordTrace('predict_next', { 
        word: nextWord, 
        currentSequence: responseState.generatedWords.join('').slice(-30)
      });
      
      if (this.shouldStop(responseState)) {
        responseState.completed = true;
      }
      
      await this.delay(10);
    }
    
    const finalResponse = responseState.generatedWords.join('');
    this.recordTrace('complete', { response: finalResponse });
    
    this.saveTrace();
    
    return {
      response: finalResponse,
      wordCount: responseState.generatedWords.length,
      trace: this.currentTrace
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  selectFirstWord(thoughtVector) {
    const emotion = thoughtVector.emotion;
    const concepts = Object.keys(thoughtVector.dimensions);
    
    if (emotion.pleasure > 2) {
      return this.pickFrom(['我理解', '我能感受到', '很高兴', '真是'])[0];
    }
    
    if (emotion.pleasure < -2) {
      return this.pickFrom(['我理解', '很遗憾', '我明白', '没关系'])[0];
    }
    
    if (concepts.length > 0) {
      return concepts[0];
    }
    
    return this.pickFrom(this.vocabulary.common)[0];
  }

  pickFrom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  async predictNextWord(state) {
    const currentSeq = state.generatedWords.join('');
    const lastWord = state.generatedWords[state.generatedWords.length - 1];
    const thoughtDims = state.thoughtVector.dimensions;
    
    if (currentSeq.length < 5) {
      if (this.isFunctionWord(lastWord)) {
        return this.selectContentWord(thoughtDims);
      }
      return this.pickFrom(this.vocabulary.common)[0];
    }
    
    if (currentSeq.endsWith('。') || currentSeq.endsWith('！') || currentSeq.endsWith('？')) {
      if (Object.keys(thoughtDims).length > 0) {
        const topConcept = Object.entries(thoughtDims)
          .sort((a, b) => b[1] - a[1])[0]?.[0];
        if (topConcept) return topConcept;
      }
      return this.pickFrom(['希望', '相信', '期待', '感谢'])[0];
    }
    
    if (Math.random() < 0.3) {
      return this.pickFrom(this.vocabulary.transition)[0];
    }
    
    if (Math.random() < 0.2) {
      return this.pickFrom(this.vocabulary.emotional)[0];
    }
    
    return this.selectContentWord(thoughtDims);
  }

  isFunctionWord(word) {
    const functionWords = ['是', '在', '有', '和', '了', '的', '也', '就', '要', '可以'];
    return functionWords.includes(word);
  }

  selectContentWord(thoughtDims) {
    const concepts = Object.keys(thoughtDims);
    
    if (concepts.length > 0) {
      const weighted = concepts.sort((a, b) => thoughtDims[b] - thoughtDims[a]);
      const selected = weighted[Math.floor(Math.random() * Math.min(3, weighted.length))];
      if (selected) return selected;
    }
    
    return this.pickFrom(this.vocabulary.flow)[0];
  }

  shouldStop(state) {
    const words = state.generatedWords;
    if (words.length < 3) return false;
    
    const lastChars = words.slice(-2).join('');
    if (lastChars.endsWith('。') || lastChars.endsWith('！') || lastChars.endsWith('？')) {
      return true;
    }
    
    if (words.length > 30 && Math.random() < 0.3) {
      return true;
    }
    
    return false;
  }

  getLength(words) {
    return words.join('').length;
  }

  recordTrace(step, data) {
    this.currentTrace.push({
      step,
      data,
      timestamp: Date.now(),
      sequence: this.currentTrace.length + 1
    });
  }

  saveTrace() {
    try {
      const dir = path.dirname(this.stateFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const traceData = {
        trace: this.currentTrace,
        finalResponse: this.currentTrace.find(t => t.step === 'complete')?.data?.response || '',
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(this.stateFile, JSON.stringify(traceData, null, 2));
    } catch (e) {
      console.error('[WordByWordGenerator] Save failed:', e.message);
    }
  }

  getLastTrace() {
    return this.currentTrace;
  }

  getFormattedTrace() {
    return this.currentTrace.map(t => {
      if (t.step === 'start') {
        return `[逐词生成] 开始 - 思想向量: ${JSON.stringify(t.data.thoughtVector).slice(0, 50)}...`;
      }
      if (t.step === 'select_first_word') {
        return `[逐词生成] 选择首词: ${t.data.word}`;
      }
      if (t.step === 'predict_next') {
        return `[逐词生成] ${t.sequence}: ${t.data.word} (当前: ${t.data.currentSequence}...)`;
      }
      if (t.step === 'complete') {
        return `[逐词生成] 完成: ${t.data.response}`;
      }
      return '';
    }).filter(Boolean).join('\n');
  }
}

module.exports = { WordByWordGenerator };
