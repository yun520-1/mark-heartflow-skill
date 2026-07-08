/**
 * CodevBench Loader — 代码生成评估数据加载器
 * 用于增强心虫的代码生成能力
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

class CodevBenchLoader {
  constructor(options = {}) {
    this.dataDir = options.dataDir || '/tmp/CodevBench';
    this.initialized = false;
    this.data = null;
  }

  /**
   * 初始化加载器
   */
  async init() {
    if (this.initialized) return;

    try {
      // 加载 CSV 数据
      const csvPath = path.join(this.dataDir, 'data.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      
      const records = await new Promise((resolve, reject) => {
        parse(csvContent, { columns: true, skip_empty_lines: true }, (err, output) => {
          if (err) reject(err);
          else resolve(output);
        });
      });

      this.data = records;
      console.log(`✅ 已加载 CodevBench 数据: ${this.data.length} 条`);
      this.initialized = true;
    } catch (error) {
      console.error('初始化失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取代码生成任务
   */
  async getTask(taskId) {
    if (!this.initialized) {
      await this.init();
    }

    const task = this.data.find(t => t.inputs === taskId);
    if (!task) {
      return { error: `任务不存在: ${taskId}` };
    }

    return {
      taskId: task.inputs,
      inputs: task.inputs,
      targets: task.targets,
      blockType: task.block_type,
      scenario: task.scenario,
    };
  }

  /**
   * 搜索任务（基于关键词）
   */
  async searchTasks(query, options = {}) {
    const { topK = 10 } = options;
    
    if (!this.initialized) {
      await this.init();
    }

    // 简单关键词匹配
    const results = this.data.map(task => {
      const text = `${task.inputs} ${task.targets} ${task.scenario}`;
      const score = this._keywordScore(query, text);
      return { ...task, score };
    });

    // 排序并返回 topK
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * 关键词评分
   */
  _keywordScore(query, text) {
    const queryTokens = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    
    let score = 0;
    queryTokens.forEach(qt => {
      if (textLower.includes(qt)) {
        score += 1;
      }
    });

    return score;
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    if (!this.initialized) {
      await this.init();
    }

    const stats = {
      total: this.data.length,
      blockTypes: {},
      scenarios: {},
    };

    this.data.forEach(task => {
      // 统计 block_type
      const blockType = task.block_type || 'unknown';
      stats.blockTypes[blockType] = (stats.blockTypes[blockType] || 0) + 1;
      
      // 统计 scenario
      const scenario = task.scenario || 'unknown';
      stats.scenarios[scenario] = (stats.scenarios[scenario] || 0) + 1;
    });

    return stats;
  }
}

module.exports = { CodevBenchLoader };