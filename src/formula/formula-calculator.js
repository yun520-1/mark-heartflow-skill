/**
 * Formula Calculator — 公式计算器（v3.0.0 完整版）
 * 支持：ODE/PDE 求解、联立方程、符号计算
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
   * 求解联立方程（牛顿法）
   */
  solveSystem(equations, variables, initialGuess = {}, options = {}) {
    const { maxIter = 100, tolerance = 1e-6 } = options;
    
    // 初始猜测
    let x = variables.map(v => initialGuess[v] || 0);
    let iter = 0;
    let error = Infinity;

    while (iter < maxIter && error > tolerance) {
      // 计算残差
      const F = variables.map(v => {
        const eq = equations[v];
        const scope = {};
        variables.forEach((v2, i) => { scope[v2] = x[i]; });
        return this._math.evaluate(eq, scope);
      });

      // 计算雅可比矩阵（数值近似）
      const J = variables.map((v1, i1) => 
        variables.map((v2, i2) => {
          const h = 1e-6;
          const xPlus = [...x];
          xPlus[i2] += h;
          const scopePlus = {};
          variables.forEach((v3, i3) => { scopePlus[v3] = xPlus[i3]; });
          const fPlus = this._math.evaluate(equations[v1], scopePlus);
          
          const scopeOrig = {};
          variables.forEach((v3, i3) => { scopeOrig[v3] = x[i3]; });
          const fOrig = this._math.evaluate(equations[v1], scopeOrig);
          
          return (fPlus - fOrig) / h;
        })
      );

      // 解线性方程组 J * dx = -F
      try {
        const dx = this._solveLinearSystem(J, F.map(f => -f));
        variables.forEach((v, i) => {
          x[i] += dx[i];
        });
        
        error = Math.sqrt(F.reduce((sum, f) => sum + f * f, 0));
        iter++;
      } catch (e) {
        return { error: `牛顿法失败: ${e.message}` };
      }
    }

    const solution = {};
    variables.forEach((v, i) => { solution[v] = x[i]; });
    
    return {
      solution,
      iterations: iter,
      finalError: error,
      converged: error <= tolerance,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 符号计算：简化
   */
  simplify(expression) {
    try {
      const node = this._math.parse(expression);
      const simplified = node.simplify();
      return {
        original: expression,
        simplified: simplified.toString(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { error: `简化失败: ${error.message}` };
    }
  }

  /**
   * 符号计算：展开
   */
  expand(expression) {
    try {
      const node = this._math.parse(expression);
      const expanded = node.expand();
      return {
        original: expression,
        expanded: expanded.toString(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { error: `展开失败: ${error.message}` };
    }
  }

  // ── 私有方法 ─────────────────────────────────────────────────────

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
      .replace(/\\left\{/g, '(')
      .replace(/\\right\}/g, ')')
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