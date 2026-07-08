/**
 * Formula Calculator — 公式计算器（v3.2.0 稳定版）
 * 移除不稳定的牛顿法，改用代数求解器
 */

const { FormulaSearch } = require('./formula-search.js');
const math = require('mathjs');

class FormulaCalculator {
  constructor(options = {}) {
    this.search = new FormulaSearch(options);
    this._math = math;
  }

  /**
   * 计算公式
   */
  calculate(formulaId, params = {}) {
    const formula = this.search.getById(formulaId);
    if (!formula) {
      return { error: `公式不存在: ${formulaId}` };
    }

    try {
      const parsed = this._parseFormula(formula.formula);
      if (!parsed) {
        return { error: '公式解析失败' };
      }

      const result = this._evaluate(parsed, params);
      return {
        formulaId,
        formula: formula.formula,
        params,
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { error: `计算失败: ${error.message}` };
    }
  }

  /**
   * 求解常微分方程（RK4）
   */
  solveODE(f, y0, tSpan, dt = 0.01) {
    const [t0, tEnd] = tSpan;
    const steps = Math.floor((tEnd - t0) / dt);
    const t = [t0];
    const y = [y0];

    for (let i = 0; i < steps; i++) {
      const k1 = f(t[i], y[i]);
      const k2 = f(t[i] + dt / 2, y[i] + (dt / 2) * k1);
      const k3 = f(t[i] + dt / 2, y[i] + (dt / 2) * k2);
      const k4 = f(t[i] + dt, y[i] + dt * k3);

      y.push(y[i] + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4));
      t.push(t[i] + dt);
    }

    return {
      method: 'RK4',
      t0, y0, tEnd, dt,
      solution: { t, y },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 求解偏微分方程（有限差分法，热方程）
   */
  solvePDE_Heat(alpha, initialCondition, boundaryCondition, options = {}) {
    const { xMin = 0, xMax = 1, nx = 100, tMax = 1, nt = 100 } = options;
    const dx = (xMax - xMin) / (nx - 1);
    const dt = tMax / (nt - 1);
    const r = alpha * dt / (dx * dx);

    if (r > 0.5) {
      return { error: `数值不稳定：r = ${r} > 0.5，需要减小 dt 或增大 dx` };
    }

    // 初始化网格
    const u = Array(nt).fill().map(() => Array(nx).fill(0));
    
    // 初始条件
    for (let i = 0; i < nx; i++) {
      u[0][i] = initialCondition(xMin + i * dx);
    }
    
    // 边界条件
    for (let j = 0; j < nt; j++) {
      u[j][0] = boundaryCondition(j * dt, 0);
      u[j][nx - 1] = boundaryCondition(j * dt, 1);
    }

    // 有限差分迭代
    for (let j = 0; j < nt - 1; j++) {
      for (let i = 1; i < nx - 1; i++) {
        u[j + 1][i] = u[j][i] + r * (u[j][i + 1] - 2 * u[j][i] + u[j][i - 1]);
      }
    }

    return {
      method: 'finite_difference',
      pdeType: 'heat_equation',
      xMin, xMax, nx, tMax, nt,
      solution: u,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 求解联立方程（代数法，简单方程）
   * 只支持 2x2 线性方程组
   */
  solveLinearSystem(A, b) {
    if (A.length === 2 && A[0].length === 2) {
      // 2x2 方程组
      const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
      if (Math.abs(det) < 1e-12) {
        return { error: '行列式为 0，无唯一解' };
      }
      
      const x = [
        (b[0] * A[1][1] - A[0][1] * b[1]) / det,
        (A[0][0] * b[1] - b[0] * A[1][0]) / det,
      ];
      
      return {
        solution: x,
        method: 'cramer_rule',
        timestamp: new Date().toISOString(),
      };
    }
    
    // 通用高斯消元
    return {
      solution: this._solveLinearSystem(A, b),
      method: 'gaussian_elimination',
      timestamp: new Date().toISOString(),
    };
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

  // 注意：mathjs 不支持 expand（展开），需要 sympy 支持

  // ── 私有方法 ─────────────────────────────────────────────────

  _parseFormula(formulaStr) {
    // 移除 LaTeX 格式，转成 mathjs 可解析的格式
    let parsed = formulaStr
      .replace(/\\{/g, '(')
      .replace(/\\}/g, ')')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
      .replace(/\\exp\{([^}]+)\}/g, 'exp($1)')
      .replace(/\\log\{([^}]+)\}/g, 'log($1)')
      .replace(/\\ln\{([^}]+)\}/g, 'log($1)')
      .replace(/\\sin\{([^}]+)\}/g, 'sin($1)')
      .replace(/\\cos\{([^}]+)\}/g, 'cos($1)')
      .replace(/\\tan\{([^}]+)\}/g, 'tan($1)')
      .replace(/\\left\(/g, '(')
      .replace(/\\right\)/g, ')')
      .replace(/\\,/g, ' ')
      .replace(/\\;/g, ';')
      .replace(/\\boxed\{/g, '')
      .replace(/\}/g, ')')
      .replace(/\{/g, '(')
      .trim();

    return parsed;
  }

  _evaluate(parsed, params) {
    const scope = { ...params };
    scope['e'] = Math.E;
    scope['pi'] = Math.PI;
    return this._math.evaluate(parsed, scope);
  }

  _solveLinearSystem(A, b) {
    // 高斯消元
    const n = A.length;
    const Aug = A.map((row, i) => [...row, b[i]]);

    for (let i = 0; i < n; i++) {
      // 主元
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(Aug[j][i]) > Math.abs(Aug[maxRow][i])) {
          maxRow = j;
        }
      }
      [Aug[i], Aug[maxRow]] = [Aug[maxRow], Aug[i]];

      // 消元
      for (let j = i + 1; j < n; j++) {
        const factor = Aug[j][i] / Aug[i][i];
        for (let k = i; k <= n; k++) {
          Aug[j][k] -= factor * Aug[i][k];
        }
      }
    }

    // 回代
    const x = Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = Aug[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= Aug[i][j] * x[j];
      }
      x[i] /= Aug[i][i];
    }

    return x;
  }
}

module.exports = { FormulaCalculator };