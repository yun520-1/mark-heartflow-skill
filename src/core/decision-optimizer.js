/**
 * Decision Optimizer — 决策系统优化（基于量子 + 工程 + 认知公式）
 * 
 * 新增公式：
 *   1. 量子决策模型（量子概率 + 叠加态）
 *   2. 工程决策模型（多准则决策 + 权重优化）
 *   3. 认知决策模型（前景理论 + 累积前景理论）
 */

const { DecisionEngine } = require('./decision-engine.js');

class DecisionOptimizer {
  constructor(options = {}) {
    this.decisionEngine = new DecisionEngine();
    this.quantumEnabled = options.quantumEnabled || false;
    this.engineeringEnabled = options.engineeringEnabled || false;
    this.cognitiveEnabled = options.cognitiveEnabled || false;
  }

  /**
   * 量子决策模型（量子概率 + 叠加态）
   */
  quantumDecision(optionsList, context = {}) {
    if (!this.quantumEnabled) {
      return { error: 'Quantum decision is disabled' };
    }

    // 量子叠加态：每个选项是一个量子态
    const states = optionsList.map((opt, idx) => {
      const amplitude = this._calculateAmplitude(opt, context);
      return {
        option: opt,
        amplitude,
        probability: amplitude * amplitude,
        phase: Math.random() * 2 * Math.PI,
      };
    });

    // 量子测量：坍缩到某个选项
    const totalProbability = states.reduce((sum, s) => sum + s.probability, 0);
    let random = Math.random() * totalProbability;
    let selected = null;
    
    for (const state of states) {
      random -= state.probability;
      if (random <= 0) {
        selected = state;
        break;
      }
    }

    if (!selected) {
      selected = states[states.length - 1];
    }

    return {
      model: 'quantum',
      options: optionsList.length,
      states: states.map(s => ({
        option: s.option,
        amplitude: s.amplitude,
        probability: s.probability,
      })),
      selected: selected.option,
      quantumAdvantage: this._quantumAdvantage(states),
    };
  }

  /**
   * 计算量子振幅
   */
  _calculateAmplitude(option, context) {
    // 简化：基于选项的期望效用
    const utility = this._expectedUtility(option, context);
    return Math.sqrt(Math.abs(utility));
  }

  /**
   * 期望效用
   */
  _expectedUtility(option, context) {
    const { probability = 0.5, value = 0 } = option;
    return probability * value;
  }

  /**
   * 量子优势（量子干涉效应）
   */
  _quantumAdvantage(states) {
    // 量子干涉：振幅相加（可能 constructive 或 destructive）
    const classicalProbability = states.reduce((sum, s) => sum + s.probability, 0);
    
    // 量子概率（考虑相位）
    const quantumAmplitude = states.reduce((sum, s) => {
      return sum + s.amplitude * Math.cos(s.phase);
    }, 0);
    const quantumProbability = quantumAmplitude * quantumAmplitude;

    return {
      classical: classicalProbability,
      quantum: quantumProbability,
      advantage: quantumProbability - classicalProbability,
    };
  }

  /**
   * 工程决策模型（多准则决策 + 权重优化）
   */
  engineeringDecision(optionsList, criteria = [], weights = []) {
    if (!this.engineeringEnabled) {
      return { error: 'Engineering decision is disabled' };
    }

    // 检查输入
    if (!Array.isArray(optionsList) || optionsList.length === 0) {
      return { error: 'Options list is empty' };
    }

    if (!Array.isArray(criteria) || criteria.length === 0) {
      return { error: 'Criteria list is empty' };
    }

    // 默认权重（均匀）
    if (!Array.isArray(weights) || weights.length !== criteria.length) {
      weights = criteria.map(() => 1 / criteria.length);
    }

    // 多准则评分
    const scoredOptions = optionsList.map(option => {
      const scores = criteria.map((criterion, idx) => {
        const score = this._scoreOption(option, criterion);
        return {
          criterion,
          score,
          weight: weights[idx],
          weightedScore: score * weights[idx],
        };
      });

      const totalScore = scores.reduce((sum, s) => sum + s.weightedScore, 0);

      return {
        option,
        scores,
        totalScore,
        rank: 0, // 稍后排序
      };
    });

    // 排序
    scoredOptions.sort((a, b) => b.totalScore - a.totalScore);
    scoredOptions.forEach((opt, idx) => {
      opt.rank = idx + 1;
    });

    return {
      model: 'engineering',
      criteria,
      weights,
      options: scoredOptions,
      selected: scoredOptions[0].option,
      score: scoredOptions[0].totalScore,
    };
  }

  /**
   * 评分选项（基于准则）
   */
  _scoreOption(option, criterion) {
    // 简化：基于关键词匹配
    const optionText = JSON.stringify(option).toLowerCase();
    const criterionText = criterion.toLowerCase();
    
    if (optionText.includes(criterionText)) {
      return 1.0; // 完全匹配
    } else {
      return 0.5; // 部分匹配
    }
  }

  /**
   * 认知决策模型（前景理论 + 累积前景理论）
   */
  cognitiveDecision(optionsList, context = {}) {
    if (!this.cognitiveEnabled) {
      return { error: 'Cognitive decision is disabled' };
    }

    // 前景理论：价值函数
    const valuedOptions = optionsList.map(option => {
      const value = this._prospectTheoryValue(option, context);
      return {
        option,
        value,
        probability: option.probability || 0.5,
        weightedValue: value * (option.probability || 0.5),
      };
    });

    // 累积前景理论：权重函数
    const cumulativeValues = valuedOptions.map(opt => {
      const weight = this._cumulativeProspectWeight(opt.probability);
      return {
        ...opt,
        cumulativeWeight: weight,
        cumulativeValue: opt.value * weight,
      };
    });

    // 选择价值最高的选项
    cumulativeValues.sort((a, b) => b.cumulativeValue - a.cumulativeValue);

    return {
      model: 'cognitive',
      theory: 'cumulative_prospect_theory',
      options: cumulativeValues,
      selected: cumulativeValues[0].option,
      value: cumulativeValues[0].cumulativeValue,
    };
  }

  /**
   * 前景理论价值函数
   */
  _prospectTheoryValue(option, context) {
    const { outcome = 0, referencePoint = 0 } = option;
    const delta = outcome - referencePoint;
    
    // 价值函数：v(x) = x^α if x≥0, -λ*(-x)^β if x<0
    const alpha = 0.88; // 典型值
    const beta = 0.88;
    const lambda = 2.25; // 损失厌恶系数

    if (delta >= 0) {
      return Math.pow(delta, alpha);
    } else {
      return -lambda * Math.pow(-delta, beta);
    }
  }

  /**
   * 累积前景理论权重函数
   */
  _cumulativeProspectWeight(probability) {
    // 权重函数：w(p) = p^γ / (p^γ + (1-p)^γ)^(1/γ)
    const gamma = 0.61; // 典型值
    
    const numerator = Math.pow(probability, gamma);
    const denominator = Math.pow(numerator, 1/gamma) + Math.pow(1 - probability, gamma);
    
    return numerator / denominator;
  }

  /**
   * 混合决策（量子 + 工程 + 认知）
   */
  hybridDecision(optionsList, context = {}) {
    const results = {};

    // 量子决策
    if (this.quantumEnabled) {
      results.quantum = this.quantumDecision(optionsList, context);
    }

    // 工程决策
    if (this.engineeringEnabled) {
      results.engineering = this.engineeringDecision(
        optionsList,
        context.criteria || [],
        context.weights || []
      );
    }

    // 认知决策
    if (this.cognitiveEnabled) {
      results.cognitive = this.cognitiveDecision(optionsList, context);
    }

    // 投票机制（多数决）
    const votes = {};
    Object.values(results).forEach(result => {
      if (result.selected) {
        const key = JSON.stringify(result.selected);
        votes[key] = (votes[key] || 0) + 1;
      }
    });

    // 找到得票最多的选项
    let maxVotes = 0;
    let winner = null;
    
    Object.entries(votes).forEach(([key, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winner = JSON.parse(key);
      }
    });

    return {
      model: 'hybrid',
      results,
      votes,
      winner,
      confidence: maxVotes / Object.keys(results).length,
    };
  }
}

module.exports = { DecisionEngine: DecisionOptimizer };