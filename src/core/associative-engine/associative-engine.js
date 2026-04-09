/**
 * Associative Engine - 人类式逐词联想理解与生成引擎
 * 整合L1-L5五个层次
 */

const path = require('path');

class AssociativeEngine {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.LexicalAssociator = require('./lexicalassociator');
    this.ChunkDetector = require('./chunk-detector');
    this.NarrativeRetriever = require('./narrative-retriever');
    this.SemanticConverger = require('./semantic-converger');
    this.WordByWordGenerator = require('./word-by-word-generator');
    
    this.lexicalAssociator = new this.LexicalAssociator(projectRoot);
    this.chunkDetector = new this.ChunkDetector(projectRoot);
    this.narrativeRetriever = new this.NarrativeRetriever(projectRoot);
    this.semanticConverger = new this.SemanticConverger();
    this.wordByWordGenerator = new this.WordByWordGenerator(projectRoot);
    
    this.lastProcessing = null;
    this.processingLog = [];
  }

  /**
   * 完整处理流程
   */
  async process(userInput, userModel = {}) {
    const processingStart = Date.now();
    
    const trace = {
      timestamp: new Date().toISOString(),
      userInput,
      layers: {}
    };

    try {
      trace.layers.L1 = this.processL1(userInput);
      
      trace.layers.L2 = this.processL2(userInput);
      
      const semanticInput = {
        associations: trace.layers.L1,
        coreConcepts: trace.layers.L1.allAssociations?.map(a => a.word) || []
      };
      trace.layers.L3 = this.processL3(semanticInput, trace.layers.L2.chunks);
      
      trace.layers.L4 = this.processL4(
        trace.layers.L1,
        trace.layers.L2,
        trace.layers.L3
      );
      
      trace.layers.L5 = await this.processL5(
        trace.layers.L4.thoughtVector,
        userModel
      );
      
      trace.totalTime = Date.now() - processingStart;
      this.lastProcessing = trace;
      this.processingLog.push(trace);
      
      if (this.processingLog.length > 20) {
        this.processingLog.shift();
      }
      
      return {
        response: trace.layers.L5.response,
        internal: {
          layers: trace.layers,
          thoughtLog: this.semanticConverger.generateThoughtLog(trace.layers.L4),
          wordTrace: trace.layers.L5.trace
        },
        processingTime: trace.totalTime
      };
      
    } catch (e) {
      console.error('[AssociativeEngine] Error:', e.message);
      return {
        response: '我正在思考如何回应你...',
        internal: { error: e.message },
        processingTime: Date.now() - processingStart
      };
    }
  }

  /**
   * L1: 词素感知层
   */
  processL1(userInput) {
    return this.lexicalAssociator.associateSequence(userInput);
  }

  /**
   * L2: 短语整合层
   */
  processL2(userInput) {
    return this.chunkDetector.detectChunks(userInput);
  }

  /**
   * L3: 叙事编织层
   */
  processL3(semanticVector, chunks) {
    return this.narrativeRetriever.matchNarrative(semanticVector, chunks);
  }

  /**
   * L4: 思想凝结层
   */
  processL4(associations, chunks, narrative) {
    return this.semanticConverger.converge(associations, chunks, narrative);
  }

  /**
   * L5: 逐词回复生成层
   */
  async processL5(thoughtVector, userModel) {
    return this.wordByWordGenerator.generateResponse(thoughtVector, userModel);
  }

  /**
   * 获取完整轨迹 (/flow trace)
   */
  getFullTrace() {
    if (!this.lastProcessing) {
      return { status: 'no_processing', message: '无最近处理记录' };
    }
    
    const t = this.lastProcessing;
    
    return {
      userInput: t.userInput,
      L1_associations: {
        words: t.layers.L1.words,
        sample: t.layers.L1.allAssociations?.slice(0, 5) || []
      },
      L2_chunks: {
        detected: t.layers.L2.chunks?.length || 0,
        items: t.layers.L2.chunks || []
      },
      L3_narrative: {
        matched: t.layers.L3.matchedPrototype?.name || '无匹配',
        confidence: t.layers.L3.confidence,
        alternatives: t.layers.L3.alternativeMatches
      },
      L4_convergence: {
        coreConcepts: t.layers.L4.activatedConcepts?.slice(0, 5) || [],
        idioms: t.layers.L4.activatedIdioms || [],
        matchedStory: t.layers.L4.matchedNarrative,
        understoodIntent: t.layers.L4.understoodIntent,
        emotionVector: t.layers.L4.thoughtVector?.emotion
      },
      L5_generation: {
        response: t.layers.L5.response,
        wordCount: t.layers.L5.wordCount,
        trace: t.layers.L5.trace?.slice(0, 20) || []
      },
      processingTime: t.totalTime
    };
  }

  getLastProcessing() {
    return this.lastProcessing;
  }

  getProcessingLog() {
    return this.processingLog.slice(-10);
  }
}

module.exports = { AssociativeEngine };
