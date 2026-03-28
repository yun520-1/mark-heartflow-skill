/**
 * 心流伴侣系统测试
 */

const ChatManager = require('../src/chat/manager');

async function runTests() {
  const chat = new ChatManager();
  
  console.log('=== 心流伴侣系统测试 ===\n');
  
  // 测试 1: 初始状态
  console.log('【测试 1】初始状态');
  const initialState = chat.getCurrentState();
  console.log('情感:', initialState.emotion);
  console.log('强度:', initialState.intensityLabel);
  console.log('能量:', initialState.energyLevel);
  console.log('');
  
  // 测试 2: 正面交互
  console.log('【测试 2】正面交互');
  const result1 = await chat.processMessage('今天完成了一个大项目，太开心了！');
  console.log('用户输入：今天完成了一个大项目，太开心了！');
  console.log('系统响应:', result1.response.text);
  console.log('情感变化:', result1.internalState.emotion.emotion);
  console.log('');
  
  // 测试 3: 负面交互
  console.log('【测试 3】负面交互');
  const result2 = await chat.processMessage('工作压力好大，感觉快崩溃了...');
  console.log('用户输入：工作压力好大，感觉快崩溃了...');
  console.log('系统响应:', result2.response.text);
  console.log('情感变化:', result2.internalState.emotion.emotion);
  console.log('');
  
  // 测试 4: 问题交互
  console.log('【测试 4】问题交互');
  const result3 = await chat.processMessage('为什么天空是蓝色的？');
  console.log('用户输入：为什么天空是蓝色的？');
  console.log('系统响应:', result3.response.text);
  console.log('情感变化:', result3.internalState.emotion.emotion);
  console.log('');
  
  // 测试 5: 查看统计
  console.log('【测试 5】情感统计');
  const stats = chat.getStats();
  console.log('总交互次数:', stats.totalInteractions);
  console.log('情感分布:', JSON.stringify(stats.emotionDistribution, null, 2));
  console.log('');
  
  // 测试 6: 查看历史
  console.log('【测试 6】情感历史');
  const history = chat.getHistory(5);
  history.forEach((h, i) => {
    console.log(`${i + 1}. ${h.before.emotion} → ${h.after.emotion}`);
  });
  console.log('');
  
  // 测试 7: 生成报告
  console.log('【测试 7】情感分析报告 (最新交互)');
  const latestReport = history[history.length - 1];
  console.log('交互 ID:', latestReport.interactionId);
  console.log('触发器:', latestReport.triggerAnalysis.triggers.join(', '));
  console.log('关键词:', latestReport.triggerAnalysis.foundKeywords.map(k => k.keyword).join(', '));
  console.log('');
  
  console.log('=== 测试完成 ===');
  
  // 结束会话
  chat.endSession();
}

runTests().catch(console.error);
