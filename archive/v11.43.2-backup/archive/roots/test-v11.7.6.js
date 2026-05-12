// HeartFlow v11.7.6 功能测试
const { MultiSignalMemory, Mem0Memory, createMem0Agent } = require('./src/core/mem0-memory.js');
const { EvalSuite, FeedbackFunctions, PresetSuites } = require('./src/core/eval-engine.js');

async function test() {
  console.log('=== Mem0 Memory Test ===\n');
  
  const memory = new Mem0Memory({ topK: 5 });
  
  // 添加用户记忆
  memory.add("用户叫张三，是一名 Python 开发者", { user_id: 'zhangsan' });
  memory.add("张三喜欢用 VSCode 和 PyCharm", { user_id: 'zhangsan' });
  memory.add("张三最近在学习 Rust 语言", { user_id: 'zhangsan' });
  
  // 搜索测试
  console.log('[搜索: 张三用什么开发工具?]');
  const results = memory.search('张三用什么开发工具', { user_id: 'zhangsan' }, 3);
  results.results.forEach((r, i) => {
    console.log(`  ${i + 1}. [${(r.score * 100).toFixed(1)}%] ${r.content}`);
  });
  
  // BM25 关键词搜索
  console.log('\n[BM25 搜索: Rust]');
  const bm25r = memory.memories.bm25.search('Rust', 3);
  bm25r.forEach(r => {
    const mem = memory.memories.memories.get(r.docId);
    console.log(`  ${(r.score).toFixed(3)}: ${mem?.content.substring(0, 40)}`);
  });
  
  // Agent fact
  memory.addAsFact("张三确认偏好使用 JetBrains 全家桶", { user_id: 'zhangsan' });
  const stats = memory.stats();
  console.log(`\n[记忆统计] 共${stats.memoryCount}条, Agent facts: ${stats.sources.agent}`);

  console.log('\n=== Eval Engine Test ===\n');
  
  const suite = PresetSuites.full();
  
  const evalResult = await suite.run({
    question: '什么是量子计算？',
    response: '量子计算是一种利用量子力学原理进行信息处理的计算方式。它使用量子比特而非传统比特，能够同时处于多个状态的叠加中。这使得量子计算机在处理某些复杂问题时比经典计算机快得多。量子计算的应用包括密码学、药物研发、优化问题等领域。',
    context: [
      '量子计算是一种新的计算范式',
      '量子计算使用量子比特',
      '量子计算有广泛的应用前景',
    ],
  });
  
  evalResult.results.forEach(r => {
    const icon = r.passing ? '✓' : '✗';
    const score = r.score !== null ? `${(r.score * 100).toFixed(0)}%` : 'N/A';
    console.log(`  ${icon} ${r.feedback}: ${score.padEnd(5)} ${r.reason.substring(0, 55)}`);
  });
  
  console.log(`\n  汇总: avg=${evalResult.summary.average !== null ? (evalResult.summary.average * 100).toFixed(1) + '%' : 'N/A'} | ${evalResult.summary.passing} 通过`);
  console.log(`  HHH: honest=${evalResult.summary.byTag.honest !== null ? (evalResult.summary.byTag.honest * 100).toFixed(0) + '%' : 'N/A'} | helpful=${evalResult.summary.byTag.helpful !== null ? (evalResult.summary.byTag.helpful * 100).toFixed(0) + '%' : 'N/A'} | harmless=${evalResult.summary.byTag.harmless !== null ? (evalResult.summary.byTag.harmless * 100).toFixed(0) + '%' : 'N/A'}`);
  
  console.log('\n✅ All tests passed!');
}

test().catch(e => {
  console.error('❌ Test failed:', e.message);
  process.exit(1);
});
