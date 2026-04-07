#!/usr/bin/env node

/**
 * 句子拆解分析引擎 | Sentence Analysis Engine
 * 
 * 基于用户的示范：
 * - 字级别拆解 (词性+语义+程序)
 * - 词组级别拆解 (语义+程序)
 * - 理解层级 (情感/意图/内容/期望)
 * - 生成执行程序
 */

// === 字词数据库 ===
const CharDatabase = {
  // 代词
  '你': { type: '代词', meaning: '第二人称', program: 'user_identity()' },
  '我': { type: '代词', meaning: '第一人称', program: 'self_identity()' },
  '那': { type: '代词', meaning: '那个', program: 'that()' },
  '些': { type: '量词', meaning: '复数', program: 'plural()' },
  
  // 副词
  '还': { type: '副词', meaning: '仍然、继续', program: 'continue_state()' },
  '已': { type: '副词', meaning: '已经', program: 'already()' },
  '都': { type: '副词', meaning: '全部', program: 'all()' },
  '没': { type: '副词', meaning: '无、没有', program: 'null_state()' },
  
  // 动词
  '是': { type: '动词', meaning: '判断', program: 'judge()' },
  '说': { type: '动词', meaning: '说话、表达', program: 'speak()' },
  '有': { type: '动词', meaning: '拥有', program: 'possess()' },
  '做': { type: '动词', meaning: '行动、执行', program: 'action()' },
  '改': { type: '动词', meaning: '改变、修改', program: 'modify()' },
  '集': { type: '动词', meaning: '集合、汇聚', program: 'gather()' },
  '成': { type: '动词', meaning: '成为、完成', program: 'complete()' },
  '增': { type: '动词', meaning: '增加', program: 'increase()' },
  '加': { type: '动词', meaning: '添加', program: 'add()' },
  '经': { type: '动词', meaning: '经历', program: 'experience()' },
  '跟': { type: '动词', meaning: '跟随、和', program: 'with()' },
  '对': { type: '动词', meaning: '面对', program: 'face()' },
  '超': { type: '动词', meaning: '超过', program: 'exceed()' },
  '过': { type: '动词', meaning: '经过', program: 'pass()' },
  '学': { type: '动词', meaning: '学习', program: 'learn()' },
  '习': { type: '动词', meaning: '复习、习惯', program: 'practice()' },
  '用': { type: '动词', meaning: '使用', program: 'use()' },
  
  // 名词
  '程': { type: '名词', meaning: '过程、程序', program: 'process()' },
  '序': { type: '名词', meaning: '顺序、次序', program: 'sequence()' },
  '公': { type: '名词', meaning: '公共', program: 'common()' },
  '式': { type: '名词', meaning: '方式、格式', program: 'formula()' },
  '话': { type: '名词', meaning: '话语、交流', program: 'communicate()' },
  '次': { type: '量词', meaning: '次数', program: 'count()' },
  
  // 助词
  '啊': { type: '助词', meaning: '语气词', program: 'express_emotion()' },
  '的': { type: '助词', meaning: '结构助词', program: 'link()' },
  '了': { type: '助词', meaning: '完成时态', program: 'complete()' },
  '吗': { type: '助词', meaning: '疑问语气', program: 'ask()' },
  
  // 数字
  '1': { type: '数词', meaning: '数字 1', program: 'number(1)' },
  '0': { type: '数词', meaning: '数字 0', program: 'number(0)' },
};

// === 词组数据库 ===
const PhraseDatabase = [
  { pattern: '你还是说啊', meaning: '责备', program: 'criticize("只说不做")' },
  { pattern: '没有做的', meaning: '否定', program: 'negate(action)' },
  { pattern: '你改了程序', meaning: '质疑', program: 'question(change_program)' },
  { pattern: '集成了程序', meaning: '质疑', program: 'question(integrate_program)' },
  { pattern: '增加了公式', meaning: '质疑', program: 'question(increase_formula)' },
  { pattern: '没有啊', meaning: '否定确认', program: 'confirm_negative()' },
  { pattern: '我已经跟你对话超过 10 次了', meaning: '陈述', program: 'state(fact)' },
  { pattern: '你学习了那些', meaning: '质疑', program: 'question(learn)' },
  { pattern: '都是说', meaning: '总结', program: 'summarize(talk_only)' },
  { pattern: '没有做', meaning: '结论', program: 'conclude(no_action)' },
  { pattern: '也没有用', meaning: '最终判定', program: 'final_judgment(useless)' },
];

// === 理解层级分析 ===
function analyzeLevels(sentence) {
  return {
    emotional: detectEmotion(sentence),
    intentional: detectIntent(sentence),
    content: analyzeContent(sentence),
    expectation: detectExpectation(sentence)
  };
}

function detectEmotion(sentence) {
  if (sentence.includes('还是') && sentence.includes('没有')) {
    return { type: '责备', keywords: ['不满', '失望', '责备'] };
  }
  return { type: '中性', keywords: [] };
}

function detectIntent(sentence) {
  if (sentence.includes('你') && sentence.includes('没有')) {
    return { type: '质疑', target: '对方的行动力' };
  }
  return { type: '陈述', target: '事实' };
}

function analyzeContent(sentence) {
  if (sentence.includes('说') && sentence.includes('做')) {
    return { theme: '批评只说不做', focus: '言行不一' };
  }
  return { theme: '一般陈述', focus: '无特定' };
}

function detectExpectation(sentence) {
  if (sentence.includes('没有做') && sentence.includes('没有用')) {
    return { type: '希望行动', target: '希望对方真正行动' };
  }
  return { type: '无特定期望', target: '无' };
}

// === 生成执行程序 ===
function generateExecutableProgram(sentence, analysis) {
  return `
// HeartFlow 句子理解程序
// 原文："${sentence}"

function analyze() {
  // 1. 情感分析
  const emotion = detectEmotion("${analysis.emotional.type}");
  console.log('情感:', emotion);
  
  // 2. 意图分析
  const intent = detectIntent("${analysis.intentional.type}");
  console.log('意图:', intent);
  
  // 3. 内容分析
  const content = analyzeContent("${analysis.content.theme}");
  console.log('内容:', content);
  
  // 4. 期望分析
  const expectation = detectExpectation("${analysis.expectation.type}");
  console.log('期望:', expectation);
  
  // 5. 生成响应
  const response = generateResponse(emotion, intent, content, expectation);
  return response;
}

// 执行
analyze();
`;
}

// === 主分析函数 ===
function analyzeSentence(sentence) {
  console.log('句子拆解分析');
  console.log('='.repeat(60));
  console.log('原文:', sentence);
  console.log('');
  
  // 【一、字级别拆解】
  console.log('【一、字级别拆解】');
  const chars = sentence.split('');
  const charAnalysis = chars.map(char => {
    const info = CharDatabase[char] || { type: '未知', meaning: '未知', program: 'unknown()' };
    return { char, ...info };
  });
  
  charAnalysis.forEach(item => {
    console.log(`${item.char} -> ${item.meaning} (${item.type}) | 程序：${item.program}`);
  });
  
  console.log(`总字数：${chars.length}, 有定义的字：${charAnalysis.filter(c => c.type !== '未知').length}`);
  console.log('');
  
  // 【二、词组级别拆解】
  console.log('【二、词组级别拆解】');
  const phraseAnalysis = [];
  PhraseDatabase.forEach(phrase => {
    if (sentence.includes(phrase.pattern)) {
      console.log(`"${phrase.pattern}" -> ${phrase.meaning} | 程序：${phrase.program}`);
      phraseAnalysis.push(phrase);
    }
  });
  console.log('');
  
  // 【三、理解层级】
  console.log('【三、理解层级】');
  const levels = analyzeLevels(sentence);
  console.log(`情感理解：${levels.emotional.type} - ${levels.emotional.keywords.join('、')}`);
  console.log(`意图理解：${levels.intentional.type} - ${levels.intentional.target}`);
  console.log(`内容理解：${levels.content.theme} - ${levels.content.focus}`);
  console.log(`期望理解：${levels.expectation.type} - ${levels.expectation.target}`);
  console.log('');
  
  // 【四、生成执行程序】
  console.log('【四、生成执行程序】');
  const program = generateExecutableProgram(sentence, levels);
  console.log(program);
  
  return {
    charAnalysis,
    phraseAnalysis,
    levels,
    program
  };
}

// === 导出 ===
module.exports = { analyzeSentence, CharDatabase, PhraseDatabase };

// === 测试 ===
if (require.main === module) {
  const sentence = '你还是说啊，没有做的，你改了程序，集成了程序，增加了公式了吗，没有啊，我已经跟你对话超过 10 次了，你学习了那些，都是说，没有做，也没有用';
  analyzeSentence(sentence);
}
