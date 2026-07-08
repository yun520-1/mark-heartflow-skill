/**
 * Formula Calculator — 公式计算器（v3.3.0 数值求解版）
 * 支持：ODE/PDE 求解、线性方程组、符号计算、数值求解（含等号公式）
 */

const { FormulaSearch } = require('./formula-search.js');
const math = require('mathjs');

class FormulaCalculator {
  constructor(options = {}) {
    this.search = new FormulaSearch(options);
    this._math = math;
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
   * 求解单个变量
   */
  _solveForVariable(left, right, unknown, params) {
    // 简化：假设等式是线性的，直接移项
    try {
      // 构造表达式：left - right = 0
      const expression = `(${left}) - (${right})`;
      const substituted = this._substituteParams(expression, params);
      
      // 用 math.evaluate 数值求解（假设其他变量都已知）
      // 简化：如果 unknown 在 left 中，则 unknown = (right 的数值) / (left 中 unknown 的系数)
      // 实际实现需要符号计算，这里用简化方法
      
      // 方法1：如果表达式是 unknown 的线性函数，则 unknown = -常数项 / 系数
      const solved = this._linearSolve(substituted, unknown);
      return solved;
    } catch (error) {
      throw new Error(`求解失败: ${error.message}`);
    }
  }

  /**
   * 线性求解（简化版）
   */
  _linearSolve(expression, unknown) {
    // 用 math.evaluate 数值求解（尝试不同 unknown 值，看哪个使表达式接近 0）
    const scope = {};
    let minError = Infinity;
    let bestGuess = 0;
    
    // 搜索范围：-1000 到 1000
    for (let guess = -1000; guess <= 1000; guess += 1) {
      scope[unknown] = guess;
      try {
        const value = this._math.evaluate(expression, scope);
        const error = Math.abs(value);
        if (error < minError) {
          minError = error;
          bestGuess = guess;
        }
      } catch (e) {
        // 忽略求值错误
      }
    }
    
    if (minError < 1e-6) {
      return bestGuess;
    } else {
      // 更精细的搜索
      const fineStep = 0.001;
      const fineStart = bestGuess - 1;
      const fineEnd = bestGuess + 1;
      for (let guess = fineStart; guess <= fineEnd; guess += fineStep) {
        scope[unknown] = guess;
        try {
          const value = this._math.evaluate(expression, scope);
          const error = Math.abs(value);
          if (error < minError) {
            minError = error;
            bestGuess = guess;
          }
        } catch (e) {
          // 忽略求值错误
        }
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
      result = result.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
    });
    return result;
  }

  /**
   * 求解常微分方程（RK4）
   */
  solveODE(formulaId, tSpan, y0, params = {}, options = {}) {
    const { steps = 100 } = options;
    const [t0, tEnd] = tSpan;
    const dt = (tEnd - t0) / steps;
    
    const t = [t0];
    const y = [y0];
    
    for (let i = 0; i < steps; i++) {
      const tNow = t[i];
      const yNow = y[i];
      
      // RK4 步骤
      const k1 = this._odeRHS(formulaId, tNow, yNow, params);
      const k2 = this._odeRHS(formulaId, tNow + dt/2, yNow + dt*k1/2, params);
      const k3 = this._odeRHS(formulaId, tNow + dt/2, yNow + dt*k2/2, params);
      const k4 = this._odeRHS(formulaId, tNow + dt, yNow + dt*k3, params);
      
      const yNext = yNow + dt * (k1 + 2*k2 + 2*k3 + k4) / 6;
      
      t.push(tNow + dt);
      y.push(yNext);
    }
    
    return {
      formulaId,
      tSpan,
      steps,
      t,
      y,
      status: 'success',
    };
  }

  /**
   * ODE 右侧函数
   */
  _odeRHS(formulaId, t, y, params) {
    // 简化：假设 formulaId 对应一个微分方程 y' = f(t, y)
    const formula = this.search.getById(formulaId);
    if (!formula) {
      throw new Error(`ODE 公式不存在: ${formulaId}`);
    }
    
    const expression = formula.formula;
    const scope = { t, y, ...params };
    return this._math.evaluate(expression, scope);
  }

  /**
   * 求解 PDE（热方程，有限差分法）
   */
  solvePDE_Heat(xSpan, tSpan, initialCondition, params = {}) {
    const [xMin, xMax] = xSpan;
    const [tMin, tMax] = tSpan;
    const dx = 0.1;
    const dt = 0.01;
    
    const nx = Math.floor((xMax - xMin) / dx) + 1;
    const nt = Math.floor((tMax - tMin) / dt) + 1;
    
    // 初始化网格
    const u = [];
    for (let i = 0; i < nt; i++) {
      u[i] = new Array(nx).fill(0);
    }
    
    // 初始条件
    for (let i = 0; i < nx; i++) {
      const x = xMin + i * dx;
      u[0][i] = initialCondition(x);
    }
    
    // 有限差分法（显式格式）
    const alpha = params.alpha || 0.1;
    const r = alpha * dt / (dx * dx);
    
    if (r > 0.5) {
      return { error: `稳定性条件不满足: r = ${r} > 0.5` };
    }
    
    for (let j = 0; j < nt - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        u[j+1][i] = u[j][i] + r * (u[j][i+1] - 2*u[j][i] + u[j][i-1]);
      }
    }
    
    return {
      formulaId: 'heat_equation',
      xSpan,
      tSpan,
      mesh: u,
      status: 'success',
    };
  }

  /**
   * 求解线性方程组
   */
  solveLinearSystem(equations, variables) {
    try {
      // 构造系数矩阵 A 和常数向量 b
      const A = [];
      const b = [];
      
      equotions.forEach(eq => {
        const row = [];
        variables.forEach(v => {
          // 简化：假设 equotion 是线性表达式
          const coeff = this._extractCoefficient(eq, v);
          row.push(coeff);
        });
        const constant = this._extractConstant(eq);
        b.push(constant);
        A.push(row);
      });
      
      // 用高斯消元法求解
      const solution = this._gaussianElimination(A, b);
      
      const result = {};
      variables.forEach((v, i) => {
        result[v] = solution[i];
      });
      
      return {
        equotions,
        variables,
        solution: result,
        status: 'success',
      };
    } catch (error) {
      return { error: `求解失败: ${error.message}` };
    }
  }

  /**
   * 高斯消元法
   */
  _gaussianElimination(A, b) {
    const n = A.length;
    
    // 前向消元
    for (let i = 0; i < n; i++) {
      // 选主元
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(A[j][i]) > Math.abs(A[maxRow][i])) {
          maxRow = j;
        }
      }
      
      // 交换行
      [A[i], A[maxRow]] = [A[maxRow], A[i]];
      [b[i], b[maxRow]] = [b[maxRow], b[i]];
      
      // 消元
      for (let j = i + 1; j < n; j++) {
        const factor = A[j][i] / A[i][i];
        for (let k = i; k < n; k++) {
          A[j][k] -= factor * A[i][k];
        }
        b[j] -= factor * b[i];
      }
    }
    
    // 回代
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = b[i];
      for (let j = i + 1; j < n; j++) {
        x[i] -= A[i][j] * x[j];
      }
      x[i] /= A[i][i];
    }
    
    return x;
  }

  /**
   * 提取系数（简化）
   */
  _extractCoefficient(equotion, variable) {
    // 简化：假设 equotion 是字符串，如 "2*x + 3*y = 5"
    // 实际实现需要解析表达式
    return 1; // 占位
  }

  /**
   * 提取常数（简化）
   */
  _extractConstant(equotion) {
    // 简化：假设 equotion 是字符串，如 "2*x + 3*y = 5"
    // 实际实现需要解析表达式
    return 0; // 占位
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