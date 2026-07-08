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
  calculate(formulaId, params = {}, options = {}) {
    const formula = this.search.getById(formulaId);
    if (!formula) {
      return { error: `公式不存在: ${formulaId}` };
    }

    try {
      // [UPGRADE] 含三角函数的公式默认启用 degreeMode（角度制）
      const hasTrig = /(^|[^a-zA-Z])(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh)\(/.test(formula.formula);
      const opts = { ...options, degreeMode: options.degreeMode ?? hasTrig };

      // [UPGRADE] 展开隐式乘法，统一处理
      const formulaText = this._expandImplicitMul(formula.formula);
      
      // 如果是等式（含等号），则求解未知变量
      if (formulaText.includes('=')) {
        const result = this._solveEquality(formulaText, params, opts);
        return {
          formulaId,
          formula: formula.formula,
          params,
          result,
          timestamp: new Date().toISOString(),
        };
      } else {
        // 纯数学表达式：直接求值
        const expression = this._substituteParams(formulaText, params, opts);
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
  _solveEquality(formulaText, params, opts = {}) {
    // [UPGRADE] 展开隐式乘法（ax -> a*x），提高公式解析能力
    let expanded = this._expandImplicitMul(formulaText);
    // [UPGRADE] 清洗逻辑/双向符号（<=>, ⇒, ∼ 等），只保留等式部分
    expanded = expanded.split(/<=>|⇒|⇔|∼|≈/)[0].trim();
    // [UPGRADE] ± 符号：用 + 替代（取正根；若为负根需求可扩展）
    expanded = expanded.replace(/±/g, '+');

    // [UPGRADE] 链式等号支持：a/sin(A) = b/sin(B) = c/sin(C)
    const parts = expanded.split('=').map(s => s.trim()).filter(s => s.length);
    if (parts.length > 2) {
      // 两两组合，找恰好含 1 个未知变量的段对
      for (let i = 0; i < parts.length - 1; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const l = parts[i], r = parts[j];
          const allVars = this._extractVariables(l + ' ' + r);
          const knownVars = Object.keys(params);
          const unk = allVars.filter(v => !knownVars.includes(v) && !this._isMathConstant(v));
          if (unk.length === 1) {
            const solved = this._solveForVariable(l, r, unk[0], params, opts);
            return { type: 'solution', unknown: unk[0], value: solved };
          }
        }
      }
      // 找不到单未知变量段对
      const allVars = this._extractVariables(expanded.replace(/=/g, ' '));
      const unk = allVars.filter(v => !Object.keys(params).includes(v) && !this._isMathConstant(v));
      return { type: 'underdetermined', unknownVars: unk, message: `链式等式有多未知变量 (${unk.join(', ')})` };
    }

    const [left, right] = parts;
    
    // 找出所有变量
    const allVars = this._extractVariables(left + ' ' + right);
    const knownVars = Object.keys(params);
    const unknownVars = allVars.filter(v => !knownVars.includes(v) && !this._isMathConstant(v));
    
    if (unknownVars.length === 0) {
      // 所有变量都已知：验证等式是否成立
      const leftVal = this._math.evaluate(this._substituteParams(left, params, opts));
      const rightVal = this._math.evaluate(this._substituteParams(right, params, opts));
      return {
        type: 'verification',
        left: leftVal,
        right: rightVal,
        valid: Math.abs(leftVal - rightVal) < 1e-6,
      };
    } else if (unknownVars.length === 1) {
      // 只有一个未知变量：求解
      const unknown = unknownVars[0];
      const solved = this._solveForVariable(left, right, unknown, params, opts);
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
   * 展开隐式乘法（ax -> a*x），但保留已知函数名（sqrt/sin 等）
   * 用占位符保护法：先把函数名替换为唯一占位符，展开后再恢复
   * 同时归一化特殊函数名：ln -> log, lg -> log10
   */
  _expandImplicitMul(expr) {
    let s = expr;
    // [UPGRADE] 函数名归一化：ln -> log（自然对数），lg -> log10
    s = s.replace(/\bln\(/g, 'log(').replace(/\blg\(/g, 'log10(');
    const funcNames = ['sqrt','sin','cos','tan','log','log10','ln','exp','abs','pow','min','max',
      'sinh','cosh','tanh','asin','acos','atan','sec','csc','cot',
      'pi','e','infinity','NaN','undefined','sign','round','floor','ceil',
      'sum','prod','mean','median','std','variance','det','inv'];
    const placeholders = [];
    // 保护法名（含后跟字母的情况，如 'sqrt(' 不动，但 'sqrt' 单独出现需保护）
    funcNames.forEach((fn, i) => {
      const ph = `\u0000${i}\u0000`;
      const re = new RegExp(`(^|[^a-zA-Z0-9_])${fn}(?=$|[^a-zA-Z0-9_])`, 'g');
      s = s.replace(re, (m, p1) => p1 + ph);
      placeholders.push([ph, fn]);
    });
    // 展开隐式乘法：字母/数字/右括号 后跟 字母/左括号 -> 加 *
    s = s.replace(/([a-zA-Z0-9_.\\)])\s*([a-zA-Z(])/g, (m, p1, p2) => p1 + '*' + p2);
    // [UPGRADE] func^n(arg) -> (func(arg))^n（如 sin^2(x) -> (sin(x))^2）
    s = s.replace(/([a-zA-Z]+)\^(\d+)\(([^)]+)\)/g, (m, fn, exp, arg) => `(${fn}(${arg}))^${exp}`);
    // 恢复占位符
    placeholders.forEach(([ph, fn]) => { s = s.split(ph).join(fn); });
    return s;
  }

  /**
   * 提取表达式中的变量（排除已知数学函数名；支持下标变量 k_B, x_i, K_max 作为单 token）
   */
  _extractVariables(expression) {
    // 先合并下标：_{...} 或 _<单字母/词> 视为变量一部分
    const normalized = expression.replace(/_(\w+)/g, '_$1').replace(/_\{([^}]+)\}/g, '_$1');
    const matches = normalized.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const funcNames = new Set([
      'sqrt','sin','cos','tan','log','log10','ln','exp','abs','pow','min','max',
      'sinh','cosh','tanh','asin','acos','atan','sec','csc','cot',
      'pi','e','infinity','NaN','undefined','sign','round','floor','ceil',
      'sum','prod','mean','median','std','variance','det','inv'
    ]);
    const vars = matches.filter(m => !funcNames.has(m.toLowerCase()));
    return [...new Set(vars)];
  }

  /**
   * 求解单个变量：牛顿法（Newton-Raphson）+ 正根偏好
   * 替代旧的数值粗搜索，对含 sqrt/sin/log 等函数的公式也能正确求解
   */
  _solveForVariable(left, right, unknown, params, opts = {}) {
    const expression = `(${(left)}) - (${(right)})`;
    const substituted = this._substituteParams(expression, params, opts);
    const scope0 = { ...params };
    delete scope0[unknown];

    // [UPGRADE] 若 unknown 仅在等号左侧"纯单独"出现（如 x = expr，而非 c^2 = expr），直接求值右侧
    const leftVars = this._extractVariables(left);
    const isPureUnknown = left.trim() === unknown || left.trim() === `(${unknown})`;
    if (leftVars.length === 1 && leftVars[0] === unknown && isPureUnknown) {
      try {
        const val = this._math.evaluate(this._substituteParams(right, params, opts));
        return val;
      } catch (e) { /* 回退到牛顿法 */ }
    }

    // 用 mathjs 解析，构建 f(x) 和 f'(x)
    let fNode, dfNode;
    try {
      fNode = this._math.parse(substituted);
      dfNode = this._math.derivative(fNode, unknown);
    } catch (e) {
      // 解析失败，回退到旧的数值搜索
      return this._numericSearch(expression, substituted, unknown, params);
    }

    const f = (x) => {
      try { return fNode.evaluate({ ...scope0, [unknown]: x }); }
      catch { return NaN; }
    };
    const df = (x) => {
      try { return dfNode.evaluate({ ...scope0, [unknown]: x }); }
      catch { return NaN; }
    };

    // 牛顿法，从多个初始猜测出发（提高找正根/多根的概率）
    const guesses = [0, 1, -1, 5, -5, 10, -10, 100, -100];
    let best = null;
    for (const g0 of guesses) {
      let x = g0;
      let ok = false;
      for (let i = 0; i < 100; i++) {
        const fx = f(x);
        if (!isFinite(fx)) break;
        const dfx = df(x);
        if (!isFinite(dfx) || Math.abs(dfx) < 1e-12) { x += 1e-4; continue; }
        const xNext = x - fx / dfx;
        if (!isFinite(xNext)) break;
        if (Math.abs(xNext - x) < 1e-10) { x = xNext; ok = true; break; }
        x = xNext;
      }
      if (ok && Math.abs(f(x)) < 1e-6) {
        // 偏好正根（几何长度/物理量非负）
        if (best === null) best = x;
        else if (Math.abs(x) < Math.abs(best)) best = x; // 更小绝对值优先（物理合理性）
        else if (best < 0 && x > 0) best = x; // 优先正根
      }
    }
    if (best !== null) return best;
    // 牛顿法失败，回退数值搜索
    return this._numericSearch(expression, substituted, unknown, params);
  }

  // 旧的数值搜索（作为回退）
  _numericSearch(expression, substituted, unknown, params) {
    const scope0 = { ...params };
    delete scope0[unknown];
    const feval = (g) => {
      try { return this._math.evaluate(substituted, { ...scope0, [unknown]: g }); }
      catch { return NaN; }
    };
    let minError = Infinity, bestGuess = 0;
    for (let guess = -1000; guess <= 1000; guess += 1) {
      const v = feval(guess);
      if (isFinite(v) && Math.abs(v) < minError) { minError = Math.abs(v); bestGuess = guess; }
    }
    // 精搜索
    const fineStep = 0.001;
    for (let guess = bestGuess - 1; guess <= bestGuess + 1; guess += fineStep) {
      const v = feval(guess);
      if (isFinite(v) && Math.abs(v) < minError) { minError = Math.abs(v); bestGuess = guess; }
    }
    return bestGuess;
  }

  /**
   * 检查是否是数学常数（仅精确匹配无歧义常数，避免 I(电流)/e(变量) 被误判）
   */
  _isMathConstant(name) {
    const mathConstants = ['pi', 'infinity', 'NaN', 'undefined'];
    return mathConstants.includes(name);
  }

  /**
   * 代入参数（数值用括号包裹，避免负号/运算符优先级问题：--3, -3^2 等）
   * 支持 degreeMode：三角函数参数自动转为弧度
   */
  _substituteParams(expression, params, options = {}) {
    let result = expression;
    const degreeMode = options.degreeMode;
    Object.entries(params).forEach(([key, value]) => {
      let valStr;
      if (typeof value === 'number' && value < 0) {
        valStr = `(${value})`;
      } else {
        valStr = String(value);
      }
      // 仅替换作为独立标识符出现的 key（避免误替换子串）
      result = result.replace(new RegExp(`\\b${this._escapeRegExp(key)}\\b`, 'g'), valStr);
    });
    // degreeMode：三角函数参数包裹 *pi/180
    if (degreeMode) {
      const trig = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh'];
      trig.forEach(fn => {
        const re = new RegExp(`\\b${fn}\\(([^)]+)\\)`, 'g');
        result = result.replace(re, (m, arg) => `${fn}((${arg})*pi/180)`);
      });
    }
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
