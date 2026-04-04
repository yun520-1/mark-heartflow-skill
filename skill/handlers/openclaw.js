/**
 * OpenClaw 对话系统集成
 * 将 HeartFlow 集成到 OpenClaw 的消息处理流程
 */

const heartflow = require('../index');

// 情感响应前缀映射
const EMOTION_PREFIXES = {
  '平静': '🌊',
  '愉悦': '☀️',
  '好奇': '🔍',
  '关切': '❤️',
  '疲惫': '😴',
  '兴奋': '🎉'
};

/**
 * OpenClaw 消息处理器
 * @param {Object} message - OpenClaw 消息对象
 * @returns {Promise<Object>} - 响应对象
 */
async function handleMessage(message) {
  const { text, from, timestamp } = message;
  
  // 初始化 HeartFlow
  await heartflow.init();
  
  // 处理命令
  if (text.startsWith('/heartflow') || text.startsWith('/hf')) {
    return handleCommand(text, from);
  }
  
  // 修复：默认调用 HeartFlow 处理所有对话，不只是情感关键词
  // 除非是特定系统命令，否则都调用 HeartFlow
  
  // 检查是否是系统命令（跳过 HeartFlow）
  const systemCommands = ['/exit', '/quit', '/help', '/status'];
  if (systemCommands.some(cmd => text.toLowerCase().startsWith(cmd))) {
    return null;  // 让其他处理器处理
  }
  
  // 所有对话都调用 HeartFlow
  return handleEmotionChat(text, from);
}

/**
 * 处理命令
 */
async function handleCommand(text, from) {
  const parts = text.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');
  
  switch (command) {
    case '/heartflow':
    case '/hf':
      if (!args) {
        return {
          text: '💡 HeartFlow 情感伴侣\n\n可用命令:\n- /hf status - 查看情感状态\n- /hf chat <消息> - 对话\n- /hf report - 情感报告\n- /hf history - 历史记录\n- /hf stats - 统计数据\n- /hf reset - 重置状态',
          emotion: null
        };
      }
      return handleSubCommand(args, from);
    
    default:
      return {
        text: '未知命令，输入 /hf 查看帮助',
        emotion: null
      };
  }
}

/**
 * 处理子命令
 */
async function handleSubCommand(args, from) {
  const parts = args.split(' ');
  const subCmd = parts[0].toLowerCase();
  const params = parts.slice(1).join(' ');
  
  switch (subCmd) {
    case 'status':
    case '状态':
      const state = heartflow.getState();
      const prefix = EMOTION_PREFIXES[state.emotion] || '🌊';
      return {
        text: `${prefix} 当前情感：${state.emotion} (${state.intensity})\n⚡ 能量：${state.energy}/100\n💬 交互：${state.totalInteractions} 次`,
        emotion: state.emotion
      };
    
    case 'chat':
    case '对话':
      if (!params) {
        return { text: '请输入要说的话，例如：/hf chat 你好', emotion: null };
      }
      return handleEmotionChat(params, from);
    
    case 'report':
    case '报告':
      const report = heartflow.getReport();
      if (!report) {
        return { text: '暂无情感记录，先聊聊天吧~', emotion: null };
      }
      return {
        text: `📊 情感分析报告\n\n` +
              `从 ${report.before.emotion}(${report.before.intensityLabel}) → ` +
              `${report.after.emotion}(${report.after.intensityLabel})\n\n` +
              `触发：${report.trigger.triggers.join(', ')}\n` +
              `关键词：${report.trigger.keywords.join(', ')}`,
        emotion: report.after.emotion
      };
    
    case 'history':
    case '历史':
      const history = heartflow.getHistory(5);
      if (history.length === 0) {
        return { text: '暂无历史记录', emotion: null };
      }
      const historyText = history.map((h, i) => 
        `${i + 1}. ${h.before.emotion} → ${h.after.emotion}`
      ).join('\n');
      return {
        text: `📜 最近情感历史\n\n${historyText}`,
        emotion: null
      };
    
    case 'stats':
    case '统计':
      const stats = heartflow.getStats();
      const distText = Object.entries(stats.emotionDistribution || {})
        .map(([e, c]) => `  ${e}: ${c}次`)
        .join('\n');
      return {
        text: `📈 情感统计\n\n总交互：${stats.totalInteractions}次\n\n情感分布:\n${distText || '  暂无数据'}`,
        emotion: null
      };
    
    case 'reset':
    case '重置':
      const result = heartflow.reset();
      return {
        text: result.reset ? '✅ 已重置情感状态' : '❌ 重置失败',
        emotion: null
      };
    
    case 'rest':
    case '休息':
      const restResult = heartflow.rest(10);
      return {
        text: `💤 休息中...\n能量恢复：${restResult.energyRecovered}/100` +
              (restResult.emotionChanged ? `\n情感：${restResult.from} → ${restResult.to}` : ''),
        emotion: null
      };
    
    default:
      return { text: `未知子命令：${subCmd}\n输入 /hf 查看帮助`, emotion: null };
  }
}

/**
 * 处理情感对话
 */
async function handleEmotionChat(text, from) {
  const result = await heartflow.chat(text);
  
  const prefix = EMOTION_PREFIXES[result.emotion.name] || '🌊';
  
  return {
    text: `${prefix} ${result.response}`,
    emotion: result.emotion.name,
    intensity: result.emotion.intensity,
    report: result.report,
    memoryId: result.memoryId
  };
}

/**
 * 检测是否需要情感响应
 */
function detectEmotionNeed(text) {
  // 情感关键词
  const emotionKeywords = [
    '开心', '高兴', '快乐', '爽', '棒', '太好了', '哈哈',
    '难过', '伤心', '痛苦', '累', '疲惫', '压力', '烦',
    '为什么', '怎么', '什么', '如何', '能吗', '可以吗',
    '谢谢', '感谢', '帮助', '支持', '陪伴'
  ];
  
  return emotionKeywords.some(k => text.includes(k));
}

/**
 * 获取处理器配置
 */
function getConfig() {
  return {
    name: 'heartflow',
    version: '1.0.0',
    description: '情感拟人化交互系统',
    triggers: emotionKeywords,
    commands: ['/heartflow', '/hf'],
    priority: 5  // 中等优先级
  };
}

module.exports = {
  handleMessage,
  handleCommand,
  handleEmotionChat,
  detectEmotionNeed,
  getConfig,
  EMOTION_PREFIXES
};
