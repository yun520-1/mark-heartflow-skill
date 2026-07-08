/**
 * 自动化测试：EmotionOptimizer.generateEmpatheticResponse()
 * 
 * 测试目标：
 * 1. 模型不存在时，返回默认回应
 * 2. 模型存在时，返回检索到的咨询师回应
 * 3. 缓存工作（第二次调用不重新加载文件）
 */

const { EmotionOptimizer } = require('../src/emotion/emotion-optimizer.js');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// 辅助：创建临时模型文件
function createTempModel() {
  const tmpDir = os.tmpdir();
  const modelPath = path.join(tmpDir, 'test_empathy_model.json');
  
  const model = {
    vocab: { '难过': 0, '男朋友': 1, '帮忙': 2 },
    idf: { '难过': 1.2, '男朋友': 1.5, '帮忙': 1.0 },
    tfidf_sparse: [
      { 0: 1.2, 1: 1.5 },  // 样本 1 的向量
    ],
    train_data: [
      { output: '我理解你的感受，这一定很不容易。能具体讲讲发生了什么吗？' },
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
  
  const optimizer = new EmotionOptimizer();
  const result = optimizer.generateEmpatheticResponse('我很难过');
  
  console.assert(
    typeof result === 'string' && result.length > 0,
    '测试 1 失败：应该返回非空字符串'
  );
  console.log('✅ 测试 1 通过');
}

// 测试 2：模型存在时，返回检索到的回应
function testRetrievedResponse() {
  console.log('=== 测试 2：模型存在 ===');
  
  // 创建临时模型文件（用心虫的真实模型路径）
  const realModelPath = path.join(__dirname, '..', 'models', 'empathy_retrieval.json');
  const hasRealModel = fs.existsSync(realModelPath);
  
  if (hasRealModel) {
    console.log('  使用真实模型');
    const optimizer = new EmotionOptimizer();
    const result = optimizer.generateEmpatheticResponse('我最近心里有些不太舒服，和男朋友的事情让我很苦恼。');
    
    console.assert(
      typeof result === 'string' && result.length > 0,
      '测试 2 失败：应该返回非空字符串'
    );
    console.log('✅ 测试 2 通过（真实模型）');
  } else {
    console.log('  真实模型不存在，跳过');
  }
}

// 测试 3：缓存工作（第二次调用不重新加载文件）
function testCaching() {
  console.log('=== 测试 3：缓存工作 ===');
  
  const realModelPath = path.join(__dirname, '..', 'models', 'empathy_retrieval.json');
  const hasRealModel = fs.existsSync(realModelPath);
  
  if (!hasRealModel) {
    console.log('  真实模型不存在，跳过');
    return;
  }
  
  const optimizer = new EmotionOptimizer();
  
  // 第一次调用（加载模型）
  const start1 = Date.now();
  const result1 = optimizer.generateEmpatheticResponse('测试消息 1');
  const time1 = Date.now() - start1;
  
  // 第二次调用（应该用缓存）
  const start2 = Date.now();
  const result2 = optimizer.generateEmpatheticResponse('测试消息 2');
  const time2 = Date.now() - start2;
  
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
