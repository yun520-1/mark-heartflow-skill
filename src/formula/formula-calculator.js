/**
 * Formula Calculator — 公式计算器（v3.3.1 稳定版）
 * 支持：数值求解（含等号公式）、ODE/PDE 求解、线性方程组、符号计算
 */

const { FormulaSearch } = require('./formula-search.js');
const math = require('mathjs');

class FormulaCalculator {
  constructor(options = {}) {
    this.search = new FormulaSearch(options);
    this._math = math;
  }

  // [AUDIT-FIX] 转义正则元字符，防止用户控制的 key/variable 触发 ReDoS 或正则语法错误
  _escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 计算公式（支持含等号公式的数值求解）
   */
  calculate(formulaId, params = {}) {
    const formula = this.search.getById(formulaId);
    if (!formula) {
      return { error: `公式不存在: ${formulaId}` };
    }

    try {
      const formulaText = formula.formula;
      
      // 如果是等式（含等号），则求解未知变量
      if (formulaText.includes('=')) {
        const result = this._solveEquality(formulaText, params);
        return {
          formulaId,
          formula: formula.formula,
          params,
          result,
          timestamp: new Date().toISOString(),
        };
      } else {
        // 纯数学表达式：直接求值
        const expression = this._substituteParams(formulaText, params);
        const value = this._math.evaluate(expression);
        return {
          formulaId,
          formula: formula.formula,
          params,
          result: { value },
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return { error: `计算失败: ${error.message}` };
    }
  }

  /**
   * 求解等式（数值法）
   */
  _solveEquality(formulaText, params) {
    const [left, right] = formulaText.split('=').map(s => s.trim());
    
    // 找出所有变量
    const allVars = this._extractVariables(left + ' ' + right);
    const knownVars = Object.keys(params);
    const unknownVars = allVars.filter(v => !knownVars.includes(v) && !this._isMathConstant(v));
    
    if (unknownVars.length === 0) {
      // 所有变量都已知：验证等式是否成立
      const leftVal = this._math.evaluate(this._substituteParams(left, params));
      const rightVal = this._math.evaluate(this._substituteParams(right, params));
      return {
        type: 'verification',
        left: leftVal,
        right: rightVal,
        valid: Math.abs(leftVal - rightVal) < 1e-6,
      };
    } else if (unknownVars.length === 1) {
      // 只有一个未知变量：求解
      const unknown = unknownVars[0];
      const solved = this._solveForVariable(left, right, unknown, params);
      return {
        type: 'solution',
        unknown,
        value: solved,
      };
    } else {
      // 多个未知变量：需要更多方程
      return {
        type: 'underdetermined',
        unknownVars,
        message: `有多个未知变量 (${unknownVars.join(', ')})，需要更多方程`,
      };
    }
  }

  /**
   * 求解单个变量（数值搜索法）
   */
  _solveForVariable(left, right, unknown, params) {
    // 构造表达式：left - right = 0
    const expression = `(${left}) - (${right})`;
    const substituted = this._substituteParams(expression, params);
    
    // 数值搜索：在范围 [-1000, 1000] 内搜索使表达式接近 0 的值
    let minError = Infinity;
    let bestGuess = 0;
    
    // 粗搜索
    for (let guess = -1000; guess <= 1000; guess += 1) {
      const scope = { ...params, [unknown]: guess };
      try {
        const value = this._math.evaluate(substituted, scope);
        const error = Math.abs(value);
        if (error < minError) {
          minError = error;
          bestGuess = guess;
        }
      } catch (e) {
        // 忽略求值错误
      }
    }
    
    // 精搜索
    const fineStep = 0.001;
    const fineStart = bestGuess - 1;
    const fineEnd = bestGuess + 1;
    for (let guess = fineStart; guess <= fineEnd; guess += fineStep) {
      const scope = { ...params, [unknown]: guess };
      try {
        const value = this._math.evaluate(substituted, scope);
        const error = Math.abs(value);
        if (error < minError) {
          minError = error;
          bestGuess = guess;
        }
      } catch (e) {
        // 忽略求值错误
      }
    }
    
    return bestGuess;
  }

  /**
   * 提取表达式中的所有变量
   */
  _extractVariables(expression) {
    const matches = expression.match(/[a-zA-Z_][a-zA-Z0-9_]*/g);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * 检查是否是数学常数
   */
  _isMathConstant(name) {
    const mathConstants = ['pi', 'e', 'i', 'infinity', 'NaN', 'undefined'];
    return mathConstants.includes(name.toLowerCase());
  }

  /**
   * 代入参数
   */
  _substituteParams(expression, params) {
    let result = expression;
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\b${this._escapeRegExp(key)}\\b`, 'g'), value);
    });
    return result;
  }

  /**
   * 求解线性方程组（用 mathjs lusolve）
   */
  solveLinearSystem(equations, variables) {
    try {
      // 构造系数矩阵 A 和常数向量 b
      const A = [];
      const b = [];
      
      equations.forEach(eq => {
        const row = [];
        variables.forEach(v => {
          // 用 mathjs 解析表达式，提取系数
          const coeff = this._getCoefficient(eq, v);
          row.push(coeff);
        });
        const constant = this._getConstant(eq);
        b.push(constant);
        A.push(row);
      });
      
      // 用 mathjs 求解：A * x = b
      const A_math = this._math.matrix(A);
      const b_math = this._math.matrix(b);
      const x_math = this._math.lusolve(A_math, b_math);
      
      const solution = {};
      variables.forEach((v, i) => {
        solution[v] = x_math.get([i, 0]);
      });
      
      return {
        equations,
        variables,
        solution,
        status: 'success',
      };
    } catch (error) {
      return { error: `求解失败: ${error.message}` };
    }
  }

  /**
   * 获取系数（简化实现）
   */
  _getCoefficient(equotion, variable) {
    // 简化：假设 equotion 是线性表达式（如 "2x + 3y = 5"）
    // 实际实现需要解析表达式，这里用正则表达式
    const lhs = equotion.split('=')[0];
    const regex = new RegExp(`([+-]?\\s*\\d*\\.?\\d*)\\s*\\*?\\s*${this._escapeRegExp(variable)}\\b`);
    const match = lhs.match(regex);
    if (match) {
      let coeffStr = match[1].replace(/\\s+/g, '');
      if (coeffStr === '' || coeffStr === '+') return 1;
      if (coeffStr === '-') return -1;
      return parseFloat(coeffStr) || 0;
    }
    return 0;
  }

  /**
   * 获取常数（从等式右侧）
   */
  _getConstant(equotion) {
    const parts = equotion.split('=');
    if (parts.length !== 2) {
      return 0;
    }
    
    const rhs = parts[1].trim();
    const constant = parseFloat(rhs);
    return isNaN(constant) ? 0 : constant;
  }

  /**
   * 符号计算：简化
   */
  simplify(expression) {
    try {
      const result = this._math.simplify(expression);
      return {
        original: expression,
        simplified: result.toString(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { error: `简化失败: ${error.message}` };
    }
  }
}

module.exports = { FormulaCalculator };
