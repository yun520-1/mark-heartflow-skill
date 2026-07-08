/**
 * Formula Calculator — 公式计算器（v2.2.0 最终修复版）
 * 修复：自然常数 e 在 mathjs 求值中正确识别
 */

const { FormulaSearch } = require('./formula-search.js');
const math = require('mathjs');

// 自然常数 e（在 mathjs 里需要用 exp(1) 或显式定义）
const E_CONST = Math.E;

class FormulaCalculator {
  constructor(options = {}) {
    this.search = new FormulaSearch(options);
    this._math = math;
  }

  /**
   * 计算/求解公式
   */
  calculate(formulaId, values = {}) {
    const formula = this.search.getById(formulaId);
    if (!formula) {
      return { error: `公式 ${formulaId} 未找到` };
    }

    try {
      const formulaStr = formula.formula || '';
      
      // 检查是否是微分方程
      if (this._isDifferential(formulaStr)) {
        return this._solveDifferential(formula, values);
      }
      
      // 检查是否是矩阵公式
      if (this._isMatrix(formulaStr)) {
        return this._solveMatrix(formula, values);
      }

      // 普通公式求解
      const allValues = { ...values };
      const constants = formula.constants || {};
      for (const [key, constant] of Object.entries(constants)) {
        allValues[key] = constant.value;
      }

      // 提取变量名
      const varNames = this._extractVariables(formulaStr);
      const constNames = formula.constants ? Object.keys(formula.constants) : [];
      const allVars = [...varNames, ...constNames];

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
      const result = this._solveGeneric(formulaStr, targetVar, allValues);

      return {
        success: true,
        formula: formula.name,
        formulaId: formulaId,
        expression: formula.formula,
        values: values,
        result: result,
        targetVariable: targetVar,
        message: `求解 ${targetVar} = ${result}`
      };
    } catch (error) {
      return { error: `计算失败: ${error.message}` };
    }
  }

  _isDifferential(formulaStr) {
    return formulaStr.includes('dy/dx') || 
           formulaStr.includes('d²y/dx²') ||
           formulaStr.includes('∂') ||
           formulaStr.includes('d/dt') ||
           formulaStr.includes('d/dx');
  }

  _isMatrix(formulaStr) {
    return formulaStr.includes('det(') || 
           formulaStr.includes('inv(') ||
           formulaStr.includes('eig(') ||
           formulaStr.includes('matrix') ||
           formulaStr.includes('A^{-1}') ||
           formulaStr.includes('A^T');
  }

  /**
   * 求解微分方程（数值解）
   */
  _solveDifferential(formula, values) {
    const formulaStr = formula.formula || '';
    
    // 提取 ODE：dy/dx = f(x,y)
    const odeMatch = formulaStr.match(/dy\/dx\s*=\s*(.+)/i);
    if (odeMatch) {
      const fStr = odeMatch[1].trim();
      const x0 = values.x0 || 0;
      const y0 = values.y0 || 0;
      const xEnd = values.xEnd || 10;
      const steps = values.steps || 100;
      
      const h = (xEnd - x0) / steps;
      const result = { x: [], y: [] };
      let x = x0;
      let y = y0;
      
      for (let i = 0; i <= steps; i++) {
        result.x.push(x);
        result.y.push(y);
        
        // RK4 方法
        const scope = { x, y, e: E_CONST };
        const k1 = this._math.evaluate(fStr, scope);
        scope.x = x + h/2; scope.y = y + k1*h/2;
        const k2 = this._math.evaluate(fStr, scope);
        scope.x = x + h/2; scope.y = y + k2*h/2;
        const k3 = this._math.evaluate(fStr, scope);
        scope.x = x + h; scope.y = y + k3*h;
        const k4 = this._math.evaluate(fStr, scope);
        
        y = y + (h/6) * (k1 + 2*k2 + 2*k3 + k4);
        x = x + h;
      }
      
      return {
        success: true,
        method: 'RK4',
        result: result,
        message: `ODE 数值解（RK4，${steps} 步）`
      };
    }
    
    return { error: '暂不支持此微分方程类型' };
  }

  /**
   * 矩阵运算
   */
  _solveMatrix(formula, values) {
    const formulaStr = formula.formula || '';
    
    try {
      // 构建矩阵
      const matrices = {};
      for (const [key, val] of Object.entries(values)) {
        if (Array.isArray(val) && Array.isArray(val[0])) {
          matrices[key] = this._math.matrix(val);
        }
      }
      
      // 行列式：det(A)
      const detMatch = formulaStr.match(/det\((\w+)\)/);
      if (detMatch) {
        const matrixName = detMatch[1];
        if (matrices[matrixName]) {
          const detValue = this._math.det(matrices[matrixName]);
          return {
            success: true,
            operation: 'determinant',
            result: detValue,
            message: `det(${matrixName}) = ${detValue}`
          };
        }
      }
      
      // 逆矩阵：A^{-1}
      const invMatch = formulaStr.match(/(\w+)\^\{-1\}/);
      if (invMatch) {
        const matrixName = invMatch[1];
        if (matrices[matrixName]) {
          const invMatrix = this._math.inv(matrices[matrixName]);
          return {
            success: true,
            operation: 'inverse',
            result: invMatrix.toArray(),
            message: `逆矩阵已计算`
          };
        }
      }
      
      // 特征值（2x2 矩阵）
      for (const [key, val] of Object.entries(values)) {
        if (Array.isArray(val) && val.length === 2 && val[0].length === 2) {
          const A = val;
          const trace = A[0][0] + A[1][1];
          const det = A[0][0]*A[1][1] - A[0][1]*A[1][0];
          const lambda1 = (trace + Math.sqrt(trace**2 - 4*det)) / 2;
          const lambda2 = (trace - Math.sqrt(trace**2 - 4*det)) / 2;
          return {
            success: true,
            operation: 'eigenvalues',
            result: [lambda1, lambda2],
            message: `特征值: λ₁=${lambda1.toFixed(4)}, λ₂=${lambda2.toFixed(4)}`
          };
        }
      }
      
      return { error: '矩阵运算失败，请检查输入' };
    } catch (error) {
      return { error: `矩阵运算失败: ${error.message}` };
    }
  }

  /**
   * 通用求解：使用 mathjs（修复：e 常数正确传入）
   */
  _solveGeneric(formulaStr, targetVar, knownValues) {
    const [leftSide, rightSide] = formulaStr.split('=').map(s => s.trim());
    
    const scope = { e: E_CONST };
    for (const [key, val] of Object.entries(knownValues)) {
      if (key !== targetVar && val !== undefined) {
        scope[key] = val;
      }
    }
    
    // 情况1：目标变量在左边
    if (leftSide === targetVar) {
      return this._math.evaluate(rightSide, scope);
    }
    
    // 情况2：目标变量在右边，用数值法求解
    return this._numericSolve(formulaStr, targetVar, knownValues);
  }

  /**
   * 数值求解（通用）
   */
  _numericSolve(formulaStr, targetVar, knownValues) {
    const [left, right] = formulaStr.split('=').map(s => s.trim());
    
    const f = (x) => {
      const testScope = { ...knownValues, [targetVar]: x, e: E_CONST };
      try {
        const leftVal = this._math.evaluate(left, testScope);
        const rightVal = this._math.evaluate(right, testScope);
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
    const [leftSide, rightSide] = formula.formula.split('=').map(s => s.trim());
    
    const scope = { ...values, e: E_CONST };
    const leftValue = this._math.evaluate(leftSide, scope);
    const rightValue = this._math.evaluate(rightSide, scope);
    
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
   * 从公式字符串中提取变量名（排除自然常数 e）
   */
  _extractVariables(formulaStr) {
    try {
      const node = this._math.parse(formulaStr);
      const symbols = new Set();
      
      node.traverse((node) => {
        if (node.isSymbolNode) {
          const name = node.name;
          // 排除数学常数和函数名（包括自然常数 e）
          if (!['pi', 'e', 'i', 'sin', 'cos', 'tan', 'log', 'exp', 'sqrt', 'abs', 'pow', 'min', 'max', 'sum', 'mean', 'median'].includes(name)) {
            symbols.add(name);
          }
        }
      });
      
      return [...symbols];
    } catch (e) {
      // 降级：使用正则提取
      const cleaned = formulaStr.replace(/[^a-zA-Z0-9_+\-*/()=.,\s]/g, ' ');
      const tokens = cleaned.split(/[^a-zA-Z0-9_]+/).filter(Boolean);
      const varNames = new Set();
      for (const t of tokens) {
        if (/^[0-9.]+$/.test(t)) continue;
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t)) {
          // 排除自然常数 e
          if (t !== 'e') {
            varNames.add(t);
          }
        }
      }
      return [...varNames];
    }
  }
}

module.exports = { FormulaCalculator };
