/**
 * Formula Calculator — 公式计算器（v1.1.0 通用求解版）
 *
 * 功能: 代入数值计算公式结果
 * 实现: 使用 mathjs 通用求解（支持 1149+ 公式）
 */

const { FormulaSearch } = require('./formula-search.js');

class FormulaCalculator {
  constructor(options = {}) {
    this.search = new FormulaSearch(options);
    this._math = null;
  }

  _getMath() {
    if (!this._math) {
      this._math = require('mathjs');
    }
    return this._math;
  }

  /**
   * 从公式字符串中提取变量名
   * "F = m * a" => ["F", "m", "a"]
   */
  _extractVariables(formulaStr) {
    // 去掉等号左右两边的空格，取所有字母数字组合（变量名）
    const cleaned = formulaStr.replace(/[^a-zA-Z0-9_+\-*/()=.,\s]/g, ' ');
    // 提取所有纯字母变量名（至少1个字母，不包含数字开头）
    const tokens = cleaned.split(/[^a-zA-Z0-9_]+/).filter(Boolean);
    const varNames = new Set();
    for (const t of tokens) {
      // 排除纯数字、已知数学常数名、mathjs 内置函数名
      if (/^[0-9.]+$/.test(t)) continue;
      // 排除 mathjs 内置函数名
      if (['sin','cos','tan','log','exp','sqrt','abs','pow','min','max','sum','mean','median'].includes(t)) continue;
      // 只保留纯字母或字母+数字结尾的标识符
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t)) {
        varNames.add(t);
      }
    }
    return [...varNames];
  }

  /**
   * 计算公式
   */
  calculate(formulaId, values = {}) {
    const formula = this.search.getById(formulaId);
    if (!formula) {
      return { error: `公式 ${formulaId} 未找到` };
    }

    try {
      // 合并常数到 values
      const allValues = { ...values };
      const constants = formula.constants || {};
      for (const [key, constant] of Object.entries(constants)) {
        allValues[key] = constant.value;
      }

      // 获取所有变量名（从 formula 字符串自动解析）
      const formulaStr = formula.formula || '';
      const varNames = this._extractVariables(formulaStr);
      const constNames = formula.constants ? Object.keys(formula.constants) : [];
      const allVars = [...varNames, ...constNames];

      // 检查哪个变量未提供
      const missingVars = allVars.filter(v => allValues[v] === undefined);
      const providedVars = allVars.filter(v => allValues[v] !== undefined);

      if (missingVars.length === 0) {
        return this._validateEquality(formula, allValues);
      }

      if (missingVars.length > 1) {
        return {
          error: `缺少变量值: ${missingVars.join(', ')}。请提供除了一个变量外的所有变量值。`
        };
      }

      const targetVar = missingVars[0];
      const result = this._solveGeneric(formula, targetVar, allValues);

      return {
        success: true,
        formula: formula.name,
        formulaId: formulaId,
        expression: formula.formula,
        values: values,
        result: result,
        targetVariable: targetVar,
        message: `求解 ${targetVar}`
      };
    } catch (error) {
      return { error: `计算失败: ${error.message}` };
    }
  }

  /**
   * 通用求解：使用 mathjs
   */
  _solveGeneric(formula, targetVar, knownValues) {
    const math = this._getMath();

    const formulaStr = formula.formula || formula;
    const [leftSide, rightSide] = formulaStr.split('=').map(s => s.trim());

    // 构建 scope（排除目标变量）
    const scope = {};
    for (const [key, val] of Object.entries(knownValues)) {
      if (key !== targetVar && val !== undefined) {
        scope[key] = val;
      }
    }

    // 情况1：目标变量在左边
    if (leftSide === targetVar) {
      return math.evaluate(rightSide, scope);
    }

    // 情况2：目标变量在右边，用数值法求解
    return this._numericSolve(formulaStr, targetVar, knownValues);
  }

  /**
   * 数值求解（通用）
   */
  _numericSolve(formulaStr, targetVar, knownValues) {
    const math = this._getMath();

    const [left, right] = formulaStr.split('=').map(s => s.trim());

    const f = (x) => {
      const testScope = { ...knownValues, [targetVar]: x };
      try {
        const leftVal = math.evaluate(left, testScope);
        const rightVal = math.evaluate(right, testScope);
        return leftVal - rightVal;
      } catch (e) {
        return NaN;
      }
    };

    // 找符号变化区间
    let low = -1e6, high = 1e6;
    let fLow = f(low);
    let fHigh = f(high);

    if (fLow * fHigh > 0) {
      // 尝试更多区间
      for (let e = -10; e <= 10; e++) {
        const mid = Math.pow(10, e);
        const fMid = f(mid);
        if (fLow * fMid <= 0) {
          high = mid;
          fHigh = fMid;
          break;
        }
        if (fMid * fHigh <= 0) {
          low = mid;
          fLow = fMid;
          break;
        }
        low = mid;
        fLow = fMid;
      }
    }

    if (fLow * fHigh > 0) {
      throw new Error(`无法数值求解 ${targetVar}，方程可能无实数根`);
    }

    // 二分法
    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      const fMid = f(mid);

      if (Math.abs(fMid) < 1e-10) {
        return mid;
      }

      if (fLow * fMid <= 0) {
        high = mid;
        fHigh = fMid;
      } else {
        low = mid;
        fLow = fMid;
      }
    }

    return (low + high) / 2;
  }

  /**
   * 验证等式是否成立
   */
  _validateEquality(formula, values) {
    const math = this._getMath();
    const [leftSide, rightSide] = formula.formula.split('=').map(s => s.trim());

    const leftValue = math.evaluate(leftSide, values);
    const rightValue = math.evaluate(rightSide, values);

    const tolerance = 1e-6;
    const valid = Math.abs(leftValue - rightValue) < tolerance;

    return {
      formula: formula.name,
      formulaId: formula.id,
      expression: formula.formula,
      values: values,
      leftValue: leftValue,
      rightValue: rightValue,
      valid: valid,
      message: valid ? '等式成立' : '等式不成立'
    };
  }
}

module.exports = { FormulaCalculator };
