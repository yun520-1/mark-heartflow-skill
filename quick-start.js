#!/usr/bin/env node

/**
 * HeartFlow Companion - 快速开始向导
 * Quick Start Wizard
 */

const readline = require('readline');
const HeartFlow = require('./src/index.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 颜色
const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// 欢迎信息
function printWelcome() {
  console.log(`
${colors.cyan}╔═══════════════════════════════════════════════════════════╗
║                                                   ║
║   🌊  HeartFlow Companion  快速开始向导           ║
║       Quick Start Wizard                          ║
║                                                   ║
║       不是工具，是伙伴 | Not a tool, but a partner ║
║                                                   ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
`);
}

// 问题列表
const questions = [
  {
    key: 'name',
    question: '你好！我是 HeartFlow，你的情感陪伴伙伴。\n首先，我该怎么称呼你？',
    validate: (input) => input.length > 0
  },
  {
    key: 'mood',
    question: '很高兴认识你，{name}！😊\n今天心情怎么样？(可以用一个词描述)',
    validate: (input) => input.length > 0
  },
  {
    key: 'expectation',
    question: '明白了，你今天感觉{mood}。\n你希望 HeartFlow 在哪些方面帮助你？\n1) 情感倾诉  2) 压力疏导  3) 自我探索  4) 随便聊聊\n(输入数字 1-4)',
    validate: (input) => ['1', '2', '3', '4'].includes(input)
  }
];

// 主流程
async function main() {
  printWelcome();
  
  const answers = {};
  
  for (const q of questions) {
    const question = q.question.replace('{name}', answers.name || '').replace('{mood}', answers.mood || '');
    
    const answer = await new Promise((resolve) => {
      rl.question(`${colors.blue}${question}${colors.reset}\n> `, resolve);
    });
    
    answers[q.key] = answer;
  }
  
  // 根据期望给出回应
  const expectations = {
    '1': '情感倾诉',
    '2': '压力疏导',
    '3': '自我探索',
    '4': '随便聊聊'
  };
  
  console.log(`\n${colors.green}✓ 好的，我记住了！${colors.reset}\n`);
  console.log(`我会成为你的${expectations[answers.expectation]}伙伴。`);
  console.log(`随时可以和我说说话，分享你的喜怒哀乐。😊\n`);
  
  // 创建 HeartFlow 实例
  const companion = new HeartFlow({
    userId: answers.name,
    language: 'zh-CN'
  });
  
  // 开始对话
  console.log(`${colors.yellow}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.yellow}现在，想和我聊些什么呢？(输入 "quit" 退出)${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  
  // 对话循环
  while (true) {
    const input = await new Promise((resolve) => {
      rl.question(`${colors.blue}你:${colors.reset} `, resolve);
    });
    
    if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
      console.log(`\n${colors.green}很高兴和你聊天！随时欢迎回来。😊${colors.reset}\n`);
      break;
    }
    
    // 生成回应
    try {
      const response = await companion.empathize(input);
      
      console.log(`\n${colors.cyan}HeartFlow:${colors.reset} ${response.text}\n`);
      
      // 显示情感分析（如果有）
      if (response.emotion) {
        console.log(`${colors.yellow}[情感分析]${colors.reset} ${response.emotion.state} (强度：${response.emotion.intensity})\n`);
      }
    } catch (e) {
      console.log(`\n${colors.yellow}HeartFlow:${colors.reset} 抱歉，我刚才没理解你的意思。能再说一遍吗？\n`);
    }
  }
  
  rl.close();
}

// 运行
main().catch(console.error);
