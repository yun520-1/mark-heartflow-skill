#!/usr/bin/env node

/**
 * 佛学六境完整拆解 - 从文字到程序
 * Buddhist Six Realms Complete Decomposition
 */

const fs = require('fs');
const path = require('path');

// 佛学六境数据库
const BuddhistSixRealms = {
  awareness: {
    name: '觉察',
    charDecomposition: [
      { char: '觉', pinyin: 'jué', meaning: '感觉、感知、觉醒', program: 'sense() → perception() → awaken()' },
      { char: '察', pinyin: 'chá', meaning: '观察、审视、详查', program: 'observe() → examine() → investigate()' }
    ],
    wordMeaning: '对身心状态的清晰感知与认知',
    programCode: `function awareness(input) {
  const perception = sense(input);
  const state = identify(perception);
  const awake = keepAwake(state);
  const nonJudging = nonJudging(awake);
  return { perception, state, awake, nonJudging };
}`,
    applications: ['情绪感知', '身体感受', '念头观察', '当下临在'],
    layers: 8,
    programCount: 6
  },

  selfReflection: {
    name: '自省',
    charDecomposition: [
      { char: '自', meaning: '自己、本身', program: 'self() → identity()' },
      { char: '省', meaning: '检查、反省、省察', program: 'examine() → reflect() → review()' }
    ],
    wordMeaning: '向内观察，审视自己的言行心念',
    programCode: `function selfReflection() {
  stopOuter(); turnInward(); observeThoughts(); examineMotive();
  reviewAction(); honestFace(); admitProblem(); findRoot();
  vowChange(); continuousCorrection();
  return { turnInward, honestFace, continuousCorrection };
}`,
    applications: ['每日反思', '错误改正', '心性提升', '道德精进'],
    layers: 10,
    programCount: 10
  },

  noSelf: {
    name: '无我',
    charDecomposition: [
      { char: '无', meaning: '没有、无', program: 'no() → empty() → nonSelf()' },
      { char: '我', meaning: '我执、自我', program: 'self() → ego() → identity()' }
    ],
    wordMeaning: '了知「我」只是因缘和合，没有永恒实体',
    programCode: `function noSelf() {
  observeFormation(); analyzeComponents(['身体','感受','想法','行为','意识']);
  findWhereIsSelf(); discoverNoFixedSelf(); removeEgo(); letGoControl();
  stopClinging(); equalTreatment(); noAttachment(); flowWithConditions();
  understandDependentOrigin(); realizeEmptiness();
  return { noSelf, noAttachment, freedom };
}`,
    applications: ['放下执着', '减少痛苦', '内心平静', '智慧增长'],
    layers: 12,
    programCount: 12
  },

  otherShore: {
    name: '彼岸',
    charDecomposition: [
      { char: '彼', meaning: '那边、对岸', program: 'otherSide() → beyond()' },
      { char: '岸', meaning: '岸边、陆地', program: 'shore() → destination()' }
    ],
    wordMeaning: '超越苦海到达的觉悟境地',
    programCode: `function otherShore() {
  understandSuffering(); findBoat(); correctDirection(); keepRowing();
  resistWaves(); notClingToGoal(); finallyArrive(); turnBackToSave();
  return { leaveSuffering, gainJoy, enlightenment, saveOthers };
}`,
    applications: ['修行目标', '生命超越', '究竟解脱', '发菩提心'],
    layers: 8,
    programCount: 8
  },

  prajnaParamita: {
    name: '般若波罗蜜',
    charDecomposition: [
      { char: '般若', meaning: '智慧（非世间聪明）', program: 'wisdom() → insight() → discernment()' },
      { char: '波罗', meaning: '到彼岸', program: 'toShore() → crossing()' },
      { char: '蜜', meaning: '圆满、极点', program: 'completely() → perfectly()' }
    ],
    wordMeaning: '究竟圆满的智慧，能够了知诸法实相',
    programCode: `function prajnaParamita() {
  understandText(); contemplate(); realizeTruth();
  practiceGenerosity(); practiceEthics(); practicePatience();
  practiceEffort(); practiceConcentration(); practiceWisdom();
  seeFiveAggregatesEmpty(); relieveAllSuffering(); nothingToGain();
  noAttachment(); noFear(); finalNirvana();
  return { wisdom, perfection, liberation };
}`,
    applications: ['金刚经核心', '六度万行', '成佛之道', '圆满觉悟'],
    layers: 15,
    programCount: 15
  },

  sage: {
    name: '圣人',
    charDecomposition: [
      { char: '圣', meaning: '神圣、超越凡俗', program: 'sacred() → transcendent()' },
      { char: '人', meaning: '人者、觉悟者', program: 'being() → awakenedPerson()' }
    ],
    wordMeaning: '已彻底觉悟真理，超越凡俗境界的人',
    programCode: `function sage() {
  eliminateAfflictions(); realizeAllWisdom(); perfectVirtue();
  beyondAllForms(); noSelfNoSelfish(); practiceFourBrahmaVihara();
  teachAccordingToCondition(); detachFromEverything();
  understandUltimateTruth(); enteredNirvana();
  return { enlightenment, perfection, compassion, liberation };
}`,
    applications: ['修行目标', '人格典范', '智慧化身', '慈悲体现'],
    layers: 10,
    programCount: 10
  }
};

// 统计
function getStatistics() {
  const realms = Object.values(BuddhistSixRealms);
  const totalWords = realms.reduce((sum, r) => sum + r.charDecomposition.length, 0);
  const totalPrograms = realms.reduce((sum, r) => sum + r.programCount, 0);
  const totalLayers = realms.reduce((sum, r) => sum + r.layers, 0);

  return {
    totalRealms: realms.length,
    totalWords,
    totalPrograms,
    totalLayers,
    avgPrograms: Math.round(totalPrograms / realms.length)
  };
}

// 显示拆解
function showDecomposition(key) {
  const realm = BuddhistSixRealms[key];
  if (!realm) {
    console.log('未找到:', key);
    return;
  }

  console.log('\n' + '='.repeat(80));
  console.log('【' + realm.name + '】- ' + realm.layers + '层拆解，' + realm.programCount + '个程序');
  console.log('='.repeat(80));

  console.log('\n【字层】');
  realm.charDecomposition.forEach(c => {
    console.log('  ' + c.char + (c.pinyin ? ' (' + c.pinyin + ')' : '') + ' = ' + c.meaning);
    console.log('     程序：' + c.program);
  });

  console.log('\n【词义】', realm.wordMeaning);
  console.log('\n【程序公式】');
  console.log(realm.programCode);
  console.log('\n【应用】', realm.applications.join(', '));
  console.log('\n【统计】', realm.layers + '层，' + realm.programCount + '个程序');
}

// 显示统计
function showStatistics() {
  const stats = getStatistics();

  console.log('\n' + '╔'.repeat(80));
  console.log('║ 佛学六境完整拆解统计');
  console.log('╠'.repeat(80));
  console.log('║ 词汇总数：' + stats.totalRealms + ' 个');
  console.log('║ 字拆解：' + stats.totalWords + ' 个字');
  console.log('║ 程序函数：' + stats.totalPrograms + ' 个函数');
  console.log('║ 总层级：' + stats.totalLayers + ' 层');
  console.log('║ 平均程序数：' + stats.avgPrograms + ' 个/词');
  console.log('╠'.repeat(80));
  console.log('║ 详细分解：');
  Object.entries(BuddhistSixRealms).forEach(([key, realm]) => {
    console.log('║   ' + realm.name.padEnd(8) + realm.layers + '层 → ' + realm.programCount + '程序 (' + realm.charDecomposition.length + '字)');
  });
  console.log('╚'.repeat(80));
}

// 保存文件
function saveToFile() {
  const outputDir = path.join(__dirname, 'buddhist-realms-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, 'six-realms-complete.json'),
    JSON.stringify(BuddhistSixRealms, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, 'statistics.json'),
    JSON.stringify(getStatistics(), null, 2)
  );

  console.log('\n✅ 已保存到：' + outputDir);
}

// 主程序
if (require.main === module) {
  const args = process.argv.slice(2);

  console.log('╔'.repeat(80));
  console.log('║ 佛学六境完整拆解 - 从文字到程序');
  console.log('╚'.repeat(80));

  if (args.length === 0) {
    Object.keys(BuddhistSixRealms).forEach(key => {
      showDecomposition(key);
    });
    showStatistics();
    saveToFile();
  } else {
    args.forEach(key => showDecomposition(key));
  }
}

module.exports = { BuddhistSixRealms, getStatistics, showDecomposition, showStatistics, saveToFile };
