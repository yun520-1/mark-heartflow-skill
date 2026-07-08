/**
 * Formula Calculator — 公式计算器（v1.0.5 支持常数版）
 * 
 * 功能: 自动检测要求解哪个变量，并求解
 * 新增: 支持公式中的常数（constants）
 */

const { FormulaSearch } = require('./formula-search.js');

class FormulaCalculator {
  constructor(options = {}) {
    this.search = new FormulaSearch(options);
  }

  /**
   * 计算公式结果
   * 智能检测：自动求解未提供的变量
   */
  calculate(formulaId, values) {
    const formula = this.search.getById(formulaId);
    if (!formula) {
      return { error: `公式 ${formulaId} 未找到` };
    }

    try {
      // 获取公式所有变量（不包括常数）
      const allVars = [
        ...(formula.variables ? Object.keys(formula.variables) : []),
        ...(formula.constants ? Object.keys(formula.constants) : [])
      ];
      
      // 去重
      const uniqueVars = [...new Set(allVars)];
      // 获取公式常数，并合并到 values 中
      const constants = formula.constants || {};
      const allValues = { ...values };
      for (const [key, constant] of Object.entries(constants)) {
        allValues[key] = constant.value;
      }
      
      // 检查哪个变量未提供
      const missingVars = uniqueVars.filter(v => allValues[v] === undefined);
      const providedVars = uniqueVars.filter(v => allValues[v] !== undefined);

      if (missingVars.length === 0) {
        // 所有变量都已提供，验证等式是否成立
        return this.validateEquality(formula, allValues);
      }

      if (missingVars.length > 1) {
        return { error: `缺少变量值: ${missingVars.join(', ')}。请提供除了一个变量外的所有变量值。` };
      }

      // 只有一个变量未提供，求解它
      const targetVar = missingVars[0];
      const result = this.solveForVariable(formula, targetVar, allValues);

      return {
        formula: formula.name,
        formulaId: formulaId,
        expression: formula.formula,
        values: values,
        result: result,
        unit: formula.variables[targetVar].unit,
        targetVariable: targetVar,
        message: `求解 ${formula.variables[targetVar].name}`
      };
    } catch (error) {
      return { error: `计算失败: ${error.message}` };
    }
  }

  /**
   * 验证等式是否成立
   */
  validateEquality(formula, values) {
    const [leftSide, rightSide] = formula.formula.split('=').map(s => s.trim());
    
    // 计算公式两边
    const leftValue = this.evaluateExpression(leftSide, values);
    const rightValue = this.evaluateExpression(rightSide, values);

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

  /**
   * 求解目标变量
   */
  solveForVariable(formula, targetVar, values) {
    // 牛顿第二定律: F = m * a
    if (formula.id === 'newton_second_law') {
      const F = values['F'];
      const m = values['m'];
      const a = values['a'];
      
      if (targetVar === 'a') return F / m;
      if (targetVar === 'F') return m * a;
      if (targetVar === 'm') return F / a;
    }

    // 欧姆定律: V = I * R
    if (formula.id === 'ohm_law') {
      const V = values['V'];
      const I = values['I'];
      const R = values['R'];
      
      if (targetVar === 'V') return I * R;
      if (targetVar === 'I') return V / R;
      if (targetVar === 'R') return V / I;
    }

    // 一元二次方程: x = (-b ± √(b² - 4ac)) / (2a)
    if (formula.id === 'quadratic_formula') {
      const a = values['a'];
      const b = values['b'];
      const c = values['c'];
      const discriminant = b * b - 4 * a * c;
      if (discriminant < 0) {
        throw new Error('方程无实数根');
      }
      const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      return { x1, x2 };
    }

    // 勾股定理: a² + b² = c²
    if (formula.id === 'pythagorean_theorem') {
      const a = values['a'];
      const b = values['b'];
      const c = values['c'];
      
      if (targetVar === 'c') return Math.sqrt(a * a + b * b);
      if (targetVar === 'a') return Math.sqrt(c * c - b * b);
      if (targetVar === 'b') return Math.sqrt(c * c - a * a);
    }

    // 质能方程: E = m * c²
    if (formula.id === 'einstein_mass_energy') {
      const c = values['c'];  // 常数，已从 constants 合并
      const E = values['E'];
      const m = values['m'];
      
      if (targetVar === 'E') return m * c * c;
      if (targetVar === 'm') return E / (c * c);
    }

    throw new Error(`无法求解公式 ${formula.id}，需要符号计算支持`);
  }

  /**
   * 计算表达式的值
   */
  evaluateExpression(expression, values) {
    // 替换变量为数值
    let evalExpression = expression;
    for (const [key, value] of Object.entries(values)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      evalExpression = evalExpression.replace(regex, value);
    }

    // 安全计算
    return this.safeEval(evalExpression);
  }

  /**
   * 安全计算数学表达式
   */
  safeEval(expression) {
    // 移除空格
    expression = expression.replace(/\s/g, '');
    
    // 替换数学运算符
    expression = expression.replace(/×/g, '*');
    expression = expression.replace(/÷/g, '/');
    
    // 验证表达式（只允许数字、运算符、括号、小数点、字母（函数名））
    const allowedChars = /^[0-9+\-*/().eE\s*a-zA-Z,.]+$/;
    if (!allowedChars.test(expression)) {
      throw new Error('表达式包含不允许的字符');
    }

    // 使用 Function 构造函数（比 eval 安全一些）
    try {
      const fn = new Function('return ' + expression);
      return fn();
    } catch (error) {
      throw new Error('表达式计算失败: ' + error.message);
    }
  }

  /**
   * 批量计算
   */
  batchCalculate(formulaId, valuesList) {
    const results = [];
    for (const values of valuesList) {
      const result = this.calculate(formulaId, values);
      results.push(result);
    }
    return results;
  }
}

module.exports = { FormulaCalculator };
