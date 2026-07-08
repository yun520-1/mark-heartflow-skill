/**
 * 自动化测试：EmpathyResponderOptimized
 * 
 * 测试目标：
 * 1. 检索模型工作
 * 2. LLM 后备工作（需要 mock）
 * 3. 默认回应工作
 */

const { EmpathyResponderOptimized } = require('../src/emotion/empathy-responder-optimized.js');

// 测试 1：检索模型工作
function testRetrievalModel() {
  console.log('=== 测试 1：检索模型工作 ===');
  
  const responder = new EmpathyResponderOptimized({ useLLM: false });
  const response = responder.generate('我最近心里有些不太舒服');
  
  console.assert(
    typeof response === 'string' && response.length > 0,
    '测试 1 失败：应该返回非空回应'
  );
  console.log('✅ 测试 1 通过');
}

// 测试 2：默认回应工作
function testDefaultResponse() {
  console.log('=== 测试 2：默认回应工作 ===');
  
  // 用无效模型路径，强制默认回应
  const responder = new EmpathyResponderOptimized({ 
    modelPath: '/invalid/path.json',
    useLLM: false 
  });
  const response = responder.generate('任意消息');
  
  console.assert(
    typeof response === 'string' && response.length > 0,
    '测试 2 失败：应该返回默认回应'
  );
  console.log('✅ 测试 2 通过');
}

// 测试 3：LLM 后备（mock）
async function testLLMFallback() {
  console.log('=== 测试 3：LLM 后备（mock） ===');
  
  // Mock fetch 返回成功
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '我理解你的感受。' } }],
      }),
    };
  };

  const responder = new EmpathyResponderOptimized({ 
    llmApiKey: 'test-key',
    useLLM: true 
  });
  // 强制检索失败
  responder.model = { responses: [] };
  const response = await responder.generate('测试消息');

  // 恢复 fetch
  global.fetch = originalFetch;

  console.assert(
    response === '我理解你的感受。',
    '测试 3 失败：应该返回 LLM 生成的回应'
  );
  console.log('✅ 测试 3 通过');
}

// 运行所有测试
async function runAllTests() {
  console.log('=== 运行所有测试 ===');
  
  try {
    testRetrievalModel();
    testDefaultResponse();
    await testLLMFallback();
    
    console.log('\n=== 所有测试通过 ✅ ===');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ 测试失败：', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testRetrievalModel,
  testDefaultResponse,
  testLLMFallback,
};
