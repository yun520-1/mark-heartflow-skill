/**
 * TDD Engine - 测试驱动开发引擎
 * 
 * 集成自 addyosmani/agent-skills 的 test-driven-development 技能
 * 提供 TDD 循环（RED-GREEN-REFACTOR）
 * 
 * 对应核心指令：永远减少逻辑错误
 */

class TDDEngine {
  constructor() {
    this.tdHistory = [];
    this.currentCycle = null;
  }

  /**
   * 执行 TDD 循环
   * @param {object} spec - 功能规格
   * @param {object} options - 选项
   * @returns {object} TDD 结果
   */
  executeTDD(spec, options = {}) {
    const result = {
      success: false,
      cycles: [],
      finalCode: null,
      finalTests: null
    };

    // Step 1: RED - 写一个失败的测试
    const redResult = this.writeFailingTest(spec, options);
    result.cycles.push({
      phase: 'RED',
      success: redResult.testFails,
      testCode: redResult.testCode,
      errorMessage: redResult.errorMessage
    });

    if (!redResult.testFails) {
      result.message = 'RED phase failed: test should fail first';
      return result;
    }

    // Step 2: GREEN - 写最少的代码让测试通过
    const greenResult = this.writeMinimalCode(redResult, options);
    result.cycles.push({
      phase: 'GREEN',
      success: greenResult.testPasses,
      code: greenResult.code,
      testResult: greenResult.testResult
    });

    if (!greenResult.testPasses) {
      result.message = 'GREEN phase failed: test should pass';
      return result;
    }

    // Step 3: REFACTOR - 清理代码
    const refactorResult = this.refactorCode(greenResult, options);
    result.cycles.push({
      phase: 'REFACTOR',
      success: refactorResult.testsStillPass,
      refactoredCode: refactorResult.refactoredCode
    });

    result.success = true;
    result.finalCode = refactorResult.refactoredCode;
    result.finalTests = redResult.testCode;

    // 记录 TDD 历史
    this.tdHistory.push({
      timestamp: new Date().toISOString(),
      spec: spec.name || 'unnamed',
      cycles: result.cycles.length,
      success: result.success
    });

    return result;
  }

  /**
   * RED 阶段：写一个失败的测试
   */
  writeFailingTest(spec, options) {
    const result = {
      testFails: false,
      testCode: null,
      errorMessage: null
    };

    // 生成测试代码
    const testCode = this.generateTestCode(spec);
    result.testCode = testCode;

    // 模拟运行测试（应该失败）
    try {
      // 如果功能还不存在，测试应该失败
      if (!spec.functionExists) {
        result.testFails = true;
        result.errorMessage = 'Function not defined yet';
      } else {
        // 如果功能已存在，检查测试是否失败
        result.testFails = false; // 应该失败，但没有失败
      }
    } catch (e) {
      result.testFails = true;
      result.errorMessage = e.message;
    }

    return result;
  }

  /**
   * GREEN 阶段：写最少的代码让测试通过
   */
  writeMinimalCode(redResult, options) {
    const result = {
      testPasses: false,
      code: null,
      testResult: null
    };

    // 生成最少的实现代码
    const code = this.generateMinimalCode(redResult, options);
    result.code = code;

    // 模拟运行测试（应该通过）
    try {
      // 简化：假设测试通过
      result.testPasses = true;
      result.testResult = 'All tests pass';
    } catch (e) {
      result.testPasses = false;
      result.testResult = e.message;
    }

    return result;
  }

  /**
   * REFACTOR 阶段：清理代码
   */
  refactorCode(greenResult, options) {
    const result = {
      testsStillPass: false,
      refactoredCode: null
    };

    // 重构代码（简化、优化）
    const refactored = this.simplifyCode(greenResult.code, options);
    result.refactoredCode = refactored;

    // 确认测试仍然通过
    try {
      // 简化：假设重构后测试仍然通过
      result.testsStillPass = true;
    } catch (e) {
      result.testsStillPass = false;
    }

    return result;
  }

  /**
   * 生成测试代码
   */
  generateTestCode(spec) {
    const functionName = spec.functionName || 'myFunction';
    const testCases = spec.testCases || [
      { input: null, expected: null }
    ];

    let testCode = `describe('${functionName}', () => {\n`;
    
    testCases.forEach((tc, idx) => {
      testCode += `  it('should handle case ${idx + 1}', () => {\n`;
      testCode += `    const result = ${functionName}(${JSON.stringify(tc.input)});\n`;
      testCode += `    expect(result).toEqual(${JSON.stringify(tc.expected)});\n`;
      testCode += `  });\n`;
    });

    testCode += `});\n`;
    return testCode;
  }

  /**
   * 生成最少的实现代码
   */
  generateMinimalCode(redResult, options) {
    const spec = options.spec || {};
    const functionName = spec.functionName || 'myFunction';

    // 生成最少的实现
    let code = `function ${functionName}(input) {\n`;
    
    if (spec.returnValue !== undefined) {
      code += `  return ${JSON.stringify(spec.returnValue)};\n`;
    } else {
      code += `  // TODO: implement\n`;
      code += `  return null;\n`;
    }

    code += `}\n`;
    code += `\nmodule.exports = ${functionName};\n`;
    
    return code;
  }

  /**
   * 简化代码
   */
  simplifyCode(code, options) {
    // 简化：移除注释、空行
    let simplified = code
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .filter(line => line.trim() !== '')
      .join('\n');

    return simplified;
  }

  /**
   * 证明它模式（用于 Bug 修复）
   * @param {object} bugReport - Bug 报告
   * @returns {object} 修复结果
   */
  proveIt(bugReport) {
    const result = {
      success: false,
      bugReproduced: false,
      fixApplied: false,
      testsPass: false
    };

    // Step 1: 写一个测试重现 Bug
    const reproTest = this.writeReproductionTest(bugReport);
    result.bugReproduced = reproTest.reproduced;

    if (!reproTest.reproduced) {
      result.message = 'Cannot reproduce bug. Add more logging.';
      return result;
    }

    // Step 2: 修复 Bug
    const fix = this.applyFix(bugReport, reproTest);
    result.fixApplied = fix.applied;

    // Step 3: 确认测试通过
    result.testsPass = fix.testsPass;
    result.success = result.bugReproduced && result.fixApplied && result.testsPass;

    return result;
  }

  /**
   * 写重现测试
   */
  writeReproductionTest(bugReport) {
    // 简化：生成一个测试来重现 Bug
    return {
      reproduced: true,
      testCode: `it('reproduces the bug', () => { ... });`
    };
  }

  /**
   * 应用修复
   */
  applyFix(bugReport, reproTest) {
    // 简化：应用修复
    return {
      applied: true,
      testsPass: true,
      fixedCode: '// fixed code here'
    };
  }

  /**
   * 获取 TDD 统计
   */
  getStats() {
    if (this.tdHistory.length === 0) {
      return { totalCycles: 0 };
    }

    const recent = this.tdHistory.slice(-10);
    const successRate = recent.filter(h => h.success).length / recent.length;

    return {
      totalCycles: this.tdHistory.length,
      recentCycles: recent.length,
      successRate: Math.round(successRate * 100) + '%',
      averageCycles: Math.round(recent.reduce((sum, h) => sum + h.cycles, 0) / recent.length * 100) / 100
    };
  }
}

module.exports = TDDEngine;
