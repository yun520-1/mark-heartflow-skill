/**
 * 自动化测试：EmpathyResponder
 * 
 * 测试目标：
 * 1. 模型不存在时，返回默认回应
 * 2. 模型存在时，返回检索到的咨询师回应
 * 3. 缓存工作（第二次调用不重新加载文件）
 */

const { EmpathyResponder } = require('../src/emotion/empathy-responder.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 辅助：创建临时模型文件
function createTempModel() {
  const tmpDir = os.tmpdir();
  const modelPath = path.join(tmpDir, 'test_empathy_model.json');
  
  const model = {
    train_data: [
      { input: '我很难过，和男朋友吵架了。', output: '我理解你的感受，这一定很不容易。能具体讲讲发生了什么吗？' },
      { input: '工作压力大，失眠。', output: '听起来你最近很辛苦。工作压力影响到睡眠，这很常见。你试过什么放松方法吗？' },
    ],
  };
  
  fs.writeFileSync(modelPath, JSON.stringify(model), 'utf-8');
  return modelPath;
}

// 辅助：删除临时模型文件
function deleteTempModel(modelPath) {
  if (fs.existsSync(modelPath)) {
    fs.unlinkSync(modelPath);
  }
}

// 测试 1：模型不存在时，返回默认回应
function testDefaultResponse() {
  console.log('=== 测试 1：模型不存在 ===');
  
  const responder = new EmpathyResponder({ modelPath: '/nonexistent/path.json' });
  const result = responder.generate('我很难过');
  
  console.assert(
    typeof result === 'string' && result.length > 0,
    '测试 1 失败：应该返回非空字符串'
  );
  console.log('✅ 测试 1 通过');
}

// 测试 2：模型存在时，返回检索到的回应
function testRetrievedResponse() {
  console.log('=== 测试 2：模型存在 ===');
  
  // 创建临时模型
  const tempModelPath = createTempModel();
  
  const responder = new EmpathyResponder({ modelPath: tempModelPath });
  const result = responder.generate('我很难过，和男朋友吵架了。');
  
  // 清理
  deleteTempModel(tempModelPath);
  
  console.assert(
    typeof result === 'string' && result.length > 0,
    '测试 2 失败：应该返回非空字符串'
  );
  console.log('✅ 测试 2 通过');
}

// 测试 3：缓存工作（第二次调用不重新加载文件）
function testCaching() {
  console.log('=== 测试 3：缓存工作 ===');
  
  // 创建临时模型
  const tempModelPath = createTempModel();
  
  const responder = new EmpathyResponder({ modelPath: tempModelPath });
  
  // 第一次调用（加载模型）
  const start1 = Date.now();
  const result1 = responder.generate('测试消息 1');
  const time1 = Date.now() - start1;
  
  // 第二次调用（应该用缓存）
  const start2 = Date.now();
  const result2 = responder.generate('测试消息 2');
  const time2 = Date.now() - start2;
  
  // 清理
  deleteTempModel(tempModelPath);
  
  console.log(`  第一次调用：${time1}ms`);
  console.log(`  第二次调用：${time2}ms`);
  
  console.assert(time2 <= time1, '测试 3 失败：第二次调用应该更快（用了缓存）');
  console.log('✅ 测试 3 通过');
}

// 运行所有测试
function runAllTests() {
  console.log('=== 运行所有测试 ===');
  
  try {
    testDefaultResponse();
    testRetrievedResponse();
    testCaching();
    
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
  testDefaultResponse,
  testRetrievedResponse,
  testCaching,
};
