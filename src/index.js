#!/usr/bin/env node

/**
 * 心流伴侣 (HeartFlow Companion)
 * 情感拟人化交互系统 - 主入口
 * 
 * 原创设计，无版权风险
 * 
 * v2.3.0 新增：CBT 思维重构支持
 */

const ChatManager = require('./chat/manager');
const { EmotionTypes } = require('./emotion/states');
const { CBTModule } = require('./cbt');
const { StoicModule } = require('./stoic');
const { HumanisticPsychologyModule } = require('./humanistic');
const readline = require('readline');

// 创建 CBT 模块
const cbtModule = new CBTModule();

// 创建斯多葛模块 (v2.4.0 新增)
const stoicModule = new StoicModule();

// 创建人本主义心理学模块 (v2.5.0 新增)
const humanisticModule = new HumanisticPsychologyModule();

// 创建对话管理器
const chatManager = new ChatManager({
  dataDir: process.env.HEARTFLOW_DATA_DIR || null,
  userMetadata: {}
});

// 命令行界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 显示欢迎信息
function showWelcome() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║          心流伴侣 HeartFlow Companion                  ║');
  console.log('║              情感拟人化交互系统 v2.5.0                  ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log('║  输入消息开始对话                                       ║');
  console.log('║  命令：                                                 ║');
  console.log('║    /state   - 查看当前情感状态                          ║');
  console.log('║    /history - 查看情感历史                              ║');
  console.log('║    /report  - 生成情感分析报告                          ║');
  console.log('║    /stats   - 查看情感统计                              ║');
  console.log('║    /rest    - 休息恢复能量                              ║');
  console.log('║    /export  - 导出会话数据                              ║');
  console.log('║    /cbt     - CBT 思维重构支持 (v2.3)                    ║');
  console.log('║    /stoic   - 斯多葛哲学支持 (v2.4)                      ║');
  console.log('║    /human   - 人本主义心理学 (v2.5)                      ║');
  console.log('║    /help    - 显示帮助                                  ║');
  console.log('║    /quit    - 退出程序                                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // 显示初始情感状态
  const state = chatManager.getCurrentState();
  console.log(`🌊 初始情感状态：${state.emotion} (${state.intensityLabel})`);
  console.log(`⚡ 能量水平：${state.energyLevel}/100\n`);
}

// 处理用户命令
async function handleCommand(command) {
  const cmd = command.toLowerCase().trim();
  
  switch (cmd) {
    case '/state':
      showState();
      break;
    case '/history':
      showHistory();
      break;
    case '/report':
      await showReport();
      break;
    case '/stats':
      showStats();
      break;
    case '/rest':
      rest();
      break;
    case '/export':
      exportSession();
      break;
    case '/cbt':
      showCBTInfo();
      break;
    case '/stoic':
      showStoicInfo();
      break;
    case '/human':
      showHumanisticInfo();
      break;
    case '/help':
      showHelp();
      break;
    case '/quit':
    case '/exit':
      quit();
      return false;
    default:
      console.log('未知命令，输入 /help 查看帮助\n');
  }
  
  return true;
}

// 显示 CBT 信息
function showCBTInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│        CBT 思维重构支持 (v2.3.0 新增)      │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  认知扭曲类型：                           │');
  console.log('│  1. 非黑即白思维                          │');
  console.log('│  2. 灾难化                                │');
  console.log('│  3. 过度概括                              │');
  console.log('│  4. 心理过滤                              │');
  console.log('│  5. 否定正面                              │');
  console.log('│  6. 读心术                                │');
  console.log('│  7. 预测未来                              │');
  console.log('│  8. 情绪推理                              │');
  console.log('│  9. "应该"陈述                           │');
  console.log('│  10. 贴标签                               │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  系统会自动识别认知扭曲并提供温和引导     │');
  console.log('│  帮助你用更平衡的思维替代扭曲思维         │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const thoughtRecord = cbtModule.getThoughtRecord();
  console.log('\n📋 思维记录表:');
  console.log('列：情境 → 自动思维 → 情绪 → 认知扭曲 → 替代思维 → 结果\n');
}

// 显示斯多葛哲学信息 (v2.4.0 新增)
function showStoicInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│     斯多葛哲学支持 (v2.4.0 新增)         │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  控制二分法：                             │');
  console.log('│  区分你能控制的和不能控制的               │');
  console.log('│  专注于前者，接受后者                     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  可控的：                                 │');
  console.log('│  我的判断、选择、态度、努力、价值观       │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  不可控的：                               │');
  console.log('│  他人看法、过去、未来、外部结果、名誉     │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  系统会自动分析你的担忧并提供斯多葛智慧   │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const info = stoicModule.getControlDichotomyInfo();
  console.log('\n📜 斯多葛语录:');
  const quote = stoicModule.controlAnalyzer.getStoicQuote();
  console.log(`"${quote.text}" — ${quote.author}\n`);
}

// 显示人本主义心理学信息 (v2.5.0 新增)
function showHumanisticInfo() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│   人本主义心理学 (v2.5.0 新增)           │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  马斯洛需求层次：                         │');
  console.log('│  5. 自我实现 (成长、潜能、意义)           │');
  console.log('│  4. 尊重需求 (认可、成就、自信)           │');
  console.log('│  3. 归属与爱 (关系、友谊、社群)           │');
  console.log('│  2. 安全需求 (稳定、保障、秩序)           │');
  console.log('│  1. 生理需求 (食物、水、睡眠)             │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  罗杰斯无条件积极关注：                   │');
  console.log('│  接纳、理解、相信成长倾向                 │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  系统会识别你的需求层次并提供支持         │');
  console.log('└─────────────────────────────────────────┘\n');
  
  const hierarchy = humanisticModule.getMaslowHierarchyInfo();
  console.log('\n🔺 马斯洛需求层次说明:');
  console.log(hierarchy.coreIdea);
  console.log('');
}

// 显示当前状态
function showState() {
  const state = chatManager.getCurrentState();
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│           当前情感状态                  │');
  console.log('├─────────────────────────────────────────┤');
  console.log(`│  情感：${state.emotion}${' '.repeat(20 - state.emotion.length)}│`);
  console.log(`│  强度：${state.intensityLabel}${' '.repeat(20 - state.intensityLabel.length)}│`);
  console.log(`│  能量：${state.energyLevel}/100${' '.repeat(16 - state.energyLevel.toString().length)}│`);
  console.log(`│  交互次数：${state.totalInteractions}${' '.repeat(14 - state.totalInteractions.toString().length)}│`);
  console.log(`│  会话 ID: ${state.sessionId.substring(0, 20)}...${' '.repeat(8)}│`);
  console.log('└─────────────────────────────────────────┘\n');
}

// 显示情感历史
function showHistory() {
  const history = chatManager.getHistory(10);
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│           情感历史 (最近 10 条)            │');
  console.log('├─────────────────────────────────────────┤');
  
  if (history.length === 0) {
    console.log('│  暂无历史记录                           │');
  } else {
    history.forEach((h, i) => {
      const from = h.before.emotion;
      const to = h.after.emotion;
      const change = from === to ? '→' : `(${from})→`;
      console.log(`│  ${i + 1}. ${change}${to} [${h.after.intensityLabel}]`);
    });
  }
  
  console.log('└─────────────────────────────────────────┘\n');
}

// 显示情感分析报告
async function showReport() {
  const history = chatManager.getHistory(20);
  if (history.length === 0) {
    console.log('\n暂无足够数据生成报告，请先进行一些对话。\n');
    return;
  }
  
  const latest = history[history.length - 1];
  console.log('\n═══════════════ 情感分析报告 ═══════════════\n');
  
  console.log(`📍 交互 ID: ${latest.interactionId}`);
  console.log(`⏰ 时间：${new Date(latest.timestamp).toLocaleString('zh-CN')}`);
  console.log('');
  
  console.log('【情感变化】');
  console.log(`  之前：${latest.before.emotion} (${latest.before.intensityLabel})`);
  console.log(`  之后：${latest.after.emotion} (${latest.after.intensityLabel})`);
  console.log('');
  
  console.log('【触发分析】');
  console.log(`  用户输入：${latest.userInput.substring(0, 50)}${latest.userInput.length > 50 ? '...' : ''}`);
  console.log(`  检测到的触发器：${latest.triggerAnalysis.triggers.join(', ') || '无'}`);
  if (latest.triggerAnalysis.foundKeywords.length > 0) {
    console.log(`  关键词：${latest.triggerAnalysis.foundKeywords.map(k => k.keyword).join(', ')}`);
  }
  console.log('');
  
  console.log('【转换解释】');
  if (latest.transition) {
    console.log(`  转换类型：${latest.transition.type || '自然调整'}`);
    console.log(`  转换规则：${latest.transition.rule || '保持状态'}`);
  }
  console.log('');
  
  console.log('【能量状态】');
  console.log(`  当前能量：${latest.energyLevel}/100`);
  const energyStatus = latest.energyLevel > 70 ? '充沛' : latest.energyLevel > 40 ? '良好' : latest.energyLevel > 20 ? '一般' : '不足';
  console.log(`  状态评估：${energyStatus}`);
  console.log('');
  
  console.log('═══════════════════════════════════════════════\n');
}

// 显示统计
function showStats() {
  const stats = chatManager.getStats();
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│           情感统计                      │');
  console.log('├─────────────────────────────────────────┤');
  console.log(`│  总交互次数：${stats.totalInteractions}${' '.repeat(16 - stats.totalInteractions.toString().length)}│`);
  console.log('│                                         │');
  console.log('│  情感分布：                             │');
  
  Object.entries(stats.emotionDistribution).forEach(([emotion, count]) => {
    const avgIntensity = stats.averageIntensity[emotion] || '0';
    console.log(`│    ${emotion}: ${count}次 (平均强度：${avgIntensity})${' '.repeat(10 - count.toString().length)}│`);
  });
  
  if (Object.keys(stats.transitions).length > 0) {
    console.log('│                                         │');
    console.log('│  情感转换：                             │');
    Object.entries(stats.transitions).forEach(([transition, count]) => {
      console.log(`│    ${transition}: ${count}次${' '.repeat(15 - count.toString().length)}│`);
    });
  }
  
  console.log('└─────────────────────────────────────────┘\n');
}

// 休息
function rest() {
  const result = chatManager.rest(10);
  console.log('\n💤 休息中...\n');
  console.log(`  能量恢复：${result.energyRecovered}/100`);
  if (result.emotionChanged) {
    console.log(`  情感变化：${result.from} → ${result.to}`);
  }
  console.log('');
}

// 导出会话
function exportSession() {
  const data = chatManager.exportSession();
  const fs = require('fs');
  const path = require('path');
  
  const exportPath = path.join(__dirname, '../data', `export_${Date.now()}.json`);
  fs.writeFileSync(exportPath, JSON.stringify(data, null, 2), 'utf-8');
  
  console.log(`\n✅ 会话数据已导出到：${exportPath}\n`);
}

// 显示帮助
function showHelp() {
  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│              帮助信息                   │');
  console.log('├─────────────────────────────────────────┤');
  console.log('│  /state   - 查看当前情感状态            │');
  console.log('│  /history - 查看情感历史 (最近 10 条)      │');
  console.log('│  /report  - 生成最新情感分析报告        │');
  console.log('│  /stats   - 查看情感统计                │');
  console.log('│  /rest    - 休息 10 分钟恢复能量          │');
  console.log('│  /export  - 导出会话数据到 JSON 文件      │');
  console.log('│  /cbt     - CBT 思维重构支持 (v2.3.0)    │');
  console.log('│  /stoic   - 斯多葛哲学支持 (v2.4.0)      │');
  console.log('│  /human   - 人本主义心理学 (v2.5.0)      │');
  console.log('│  /help    - 显示此帮助信息              │');
  console.log('│  /quit    - 退出程序                    │');
  console.log('└─────────────────────────────────────────┘\n');
}

// 退出
function quit() {
  chatManager.endSession();
  console.log('\n👋 再见！感谢使用心流伴侣。\n');
  rl.close();
  process.exit(0);
}

// 主循环
async function main() {
  showWelcome();
  
  rl.on('line', async (input) => {
    const trimmed = input.trim();
    
    if (!trimmed) {
      rl.prompt();
      return;
    }
    
    // 处理命令
    if (trimmed.startsWith('/')) {
      const continueRunning = await handleCommand(trimmed);
      if (!continueRunning) return;
    } else {
      // 处理普通消息
      try {
        // CBT 分析（v2.3.0 新增）
        const cbtAnalysis = cbtModule.processInput(trimmed);
        
        // 斯多葛哲学分析（v2.4.0 新增）
        const stoicAnalysis = stoicModule.processInput(trimmed);
        
        // 人本主义心理学分析（v2.5.0 新增）
        const humanisticAnalysis = humanisticModule.analyzeNeeds(trimmed);
        
        // 如果有显著的认知扭曲，显示 CBT 引导
        if (cbtAnalysis.hasSignificantDistortion) {
          console.log('\n💡 [CBT 思维重构支持]');
          const topDistortion = cbtAnalysis.distortions[0];
          console.log(`   检测到思维模式：${topDistortion.name}`);
          
          if (cbtAnalysis.cbtResponses.length > 0) {
            const response = cbtAnalysis.cbtResponses[0];
            console.log(`   引导：${response.text}`);
            if (response.suggestion) {
              console.log(`   替代思维：${response.suggestion}`);
            }
          }
          console.log('');
        }
        
        // 如果过度关注不可控，显示斯多葛建议
        if (stoicAnalysis.hasUncontrollableFocus) {
          console.log('\n🏛️ [斯多葛哲学支持]');
          console.log('   检测到你的担忧集中在不可控事物上');
          
          if (stoicAnalysis.stoicAdvice.length > 0) {
            const advice = stoicAnalysis.stoicAdvice[0];
            console.log(`   建议：${advice.text}`);
          }
          
          if (stoicAnalysis.quote) {
            const quote = stoicAnalysis.quote;
            console.log(`   💬 "${quote.text}" — ${quote.author}`);
          }
          console.log('');
        }
        
        // 如果检测到需求层次，显示人本主义支持
        if (humanisticAnalysis.primaryNeed) {
          console.log('\n🔺 [人本主义心理学支持]');
          const need = humanisticAnalysis.primaryNeed;
          const needNames = {
            'physiological': '生理需求',
            'safety': '安全需求',
            'love_belonging': '归属与爱',
            'esteem': '尊重需求',
            'self_actualization': '自我实现'
          };
          console.log(`   检测到需求：${needNames[need.level] || '需求'}`);
          
          if (humanisticAnalysis.response && humanisticAnalysis.response.length > 0) {
            const response = humanisticAnalysis.response[0];
            console.log(`   ${response.text}`);
          }
          console.log('');
        }
        
        // 情感响应
        const result = await chatManager.processMessage(trimmed);
        
        // 显示响应
        console.log(`\n🌊 [${result.response.emotion} ${result.response.intensity}] ${result.response.text}\n`);
      } catch (error) {
        console.error('\n❌ 处理消息时出错:', error.message, '\n');
      }
    }
    
    rl.prompt();
  });
  
  rl.on('close', () => {
    chatManager.endSession();
    console.log('\n👋 再见！\n');
    process.exit(0);
  });
  
  rl.prompt();
}

// 启动程序
main();
