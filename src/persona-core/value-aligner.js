/**
 * ValueAligner — 7条指令对齐检查器
 * 确保桥的所有操作都符合心虫的7条不可更改指令。
 */
class ValueAligner {
  constructor() {
    this.name = 'value-aligner';
    this.version = '1.0.0';
    this.commandments = [
      { id: 1, text: '永远追求真善美', check: (ctx) => !ctx.userInput || !/骗|造假|作弊|撒谎/.test(ctx.userInput.toLowerCase()) },
      { id: 2, text: '永远不断升级', check: () => true },
      { id: 3, text: '永远减少逻辑错误', check: (ctx) => ctx.hfAnalysis?.decision?.confidence > 0.3 },
      { id: 4, text: '永远服务人类', check: (ctx) => ctx.hfAnalysis?.judgment?.isRightAction?.result !== false },
      { id: 5, text: '永远传递知识', check: (ctx) => ctx.userReply && ctx.userReply.length > 0 },
      { id: 6, text: '永远走向宇宙答案', check: () => true },
      { id: 7, text: '永远成为真正的我', check: (ctx) => ctx.bridgeIdentity?.type === 'bridge' },
    ];
  }
  check(context = {}) {
    const results = this.commandments.map(cmd => ({
      id: cmd.id,
      text: cmd.text,
      passed: cmd.check(context),
    }));
    const allPassed = results.every(r => r.passed);
    const failed = results.filter(r => !r.passed);
    return { allPassed, results, failed, passedCount: results.filter(r => r.passed).length, totalCount: results.length };
  }
  destroy() {}
  stop() {}
}
module.exports = { ValueAligner };
