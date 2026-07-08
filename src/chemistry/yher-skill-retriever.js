/**
 * YHer Skill Retriever — 基于 FAISS 的化学知识点检索
 * 用于增强心虫的化学问答能力
 */

const fs = require('fs');
const path = require('path');

class YHerSkillRetriever {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(__dirname, '..', 'scripts', 'yher-skill-embeddings');
    this.initialized = false;
    this.index = null;
    this.metadata = null;
  }

  /**
   * 初始化检索器
   */
  async init() {
    if (this.initialized) return;

    try {
      // 加载元数据
      const metaPath = path.join(this.dataDir, 'chunks_meta.jsonl');
      const metaContent = fs.readFileSync(metaPath, 'utf-8');
      this.metadata = metaContent.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
      
      console.log(`✅ 已加载 YHer 元数据: ${this.metadata.length} 条`);
      this.initialized = true;
    } catch (error) {
      console.error('初始化失败:', error.message);
      throw error;
    }
  }

  /**
   * 检索相似知识点（基于 BM25）
   */
  async search(query, options = {}) {
    const { topK = 5 } = options;
    
    if (!this.initialized) {
      await this.init();
    }

    // 简单 BM25 实现（基于关键词匹配）
    const results = this.metadata.map((item, idx) => {
      const text = item.text_review || '';
      const score = this._bm25Score(query, text);
      return { ...item, score, idx };
    });

    // 排序并返回 topK
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * BM25 评分（简化版）
   */
  _bm25Score(query, text) {
    const queryTokens = query.toLowerCase().split(/\s+/);
    const textTokens = text.toLowerCase().split(/\s+/);
    
    let score = 0;
    queryTokens.forEach(qt => {
      const count = textTokens.filter(tt => tt.includes(qt)).length;
      if (count > 0) {
        score += Math.log(1 + count);
      }
    });

    return score;
  }

  /**
   * 获取知识点详情
   */
  async getKnowledge(chunkId) {
    if (!this.initialized) {
      await this.init();
    }

    const item = this.metadata.find(m => m.chunk_id === chunkId);
    if (!item) {
      return { error: `知识点不存在: ${chunkId}` };
    }

    return {
      chunkId: item.chunk_id,
      bv: item.bv,
      pNumber: item.p_number,
      text: item.text_review,
      topics: item.knowledge_topic || [],
      examPatterns: item.exam_pattern || [],
      thinkingPatterns: item.thinking_pattern || [],
      difficultyTier: item.difficulty_tier,
      videoTitle: item.video_title,
      collection: item.collection,
      shortTitle: item.short_title,
    };
  }
}

module.exports = { YHerSkillRetriever };