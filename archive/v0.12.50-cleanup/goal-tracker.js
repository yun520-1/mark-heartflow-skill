/**
 * HeartFlow 独立目标追踪器 v11.17.2
 * 不依赖外部monitor，直接写文件
 * 用法: node goal-tracker.js [list|add|update|report]
 */

const fs = require('fs');
const path = require('path');

const GOALS_FILE = path.join(__dirname, 'data/goals.json');
const LOG_FILE = path.join(__dirname, 'data/goal-log.md');

// 确保data目录存在
const dataDir = path.dirname(GOALS_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function loadGoals() {
  try {
    if (fs.existsSync(GOALS_FILE)) {
      return JSON.parse(fs.readFileSync(GOALS_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { goals: [], version: '11.17.2', lastUpdated: Date.now() };
}

function saveGoals(data) {
  data.lastUpdated = Date.now();
  fs.writeFileSync(GOALS_FILE, JSON.stringify(data, null, 2));
}

function log(msg) {
  const entry = `\n## ${new Date().toLocaleString('zh-CN')} — v11.17.2\n\n${msg}\n`;
  fs.appendFileSync(LOG_FILE, entry);
}

// ── 命令处理 ──────────────────────────────────────────

const cmd = process.argv[2] || 'report';

if (cmd === 'list') {
  const data = loadGoals();
  console.log('\n📋 当前目标列表\n');
  data.goals.filter(g => g.status === 'active').forEach(g => {
    const daysLeft = Math.ceil((g.deadline - Date.now()) / 86400000);
    console.log(`  [${g.id}] ${g.name} — ${g.progress}% ${daysLeft > 0 ? `剩余${daysLeft}天` : '已逾期'}`);
    console.log(`       ${g.description}\n`);
  });
  console.log(`共 ${data.goals.filter(g => g.status === 'active').length} 个活跃目标\n`);
}

else if (cmd === 'add') {
  const name = process.argv[3];
  const desc = process.argv[4] || '';
  const days = parseInt(process.argv[5]) || 7;
  if (!name) { console.log('用法: node goal-tracker.js add <名称> <描述> <天数>'); process.exit(1); }
  const data = loadGoals();
  const goal = {
    id: Date.now(),
    name,
    description: desc,
    progress: 0,
    status: 'active',
    createdAt: Date.now(),
    deadline: Date.now() + days * 86400000,
    subtasks: [],
    reflections: []
  };
  data.goals.push(goal);
  saveGoals(data);
  console.log(`✅ 目标已添加: ${name}`);
  log(`**新增目标**: ${name}\n**描述**: ${desc}\n**截止**: ${days}天后`);
}

else if (cmd === 'update') {
  const id = parseInt(process.argv[3]);
  const progress = parseInt(process.argv[4]);
  if (!id || isNaN(progress)) { console.log('用法: node goal-tracker.js update <id> <进度>'); process.exit(1); }
  const data = loadGoals();
  const goal = data.goals.find(g => g.id === id);
  if (!goal) { console.log(`找不到目标 #${id}`); process.exit(1); }
  goal.progress = Math.min(100, Math.max(0, progress));
  if (progress >= 100) goal.status = 'completed';
  saveGoals(data);
  console.log(`✅ 目标 #${id} 更新: ${progress}%`);
  log(`**更新目标**: ${goal.name}\n**进度**: ${progress}%`);
}

else if (cmd === 'report') {
  const data = loadGoals();
  const active = data.goals.filter(g => g.status === 'active');
  const overdue = active.filter(g => g.deadline < Date.now());
  const avg = active.length > 0 ? Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length) : 0;
  const completed = data.goals.filter(g => g.status === 'completed').length;

  console.log('\n📊 心虫目标报告\n');
  console.log(`  活跃目标: ${active.length}`);
  console.log(`  已逾期:   ${overdue.length}`);
  console.log(`  已完成:   ${completed}`);
  console.log(`  平均进度: ${avg}%`);
  console.log('');

  if (overdue.length > 0) {
    console.log('  ⚠️  逾期目标:');
    overdue.forEach(g => console.log(`     - ${g.name} (${g.progress}%)`));
    console.log('');
  }

  // 写入日志
  log(`**报告生成**\n**活跃**: ${active.length} | **逾期**: ${overdue.length} | **完成**: ${completed} | **均进度**: ${avg}%`);

  if (active.length === 0) {
    console.log('  💡 建议: 没有活跃目标，用 `node goal-tracker.js add` 新建一个\n');
  } else if (avg < 30) {
    console.log('  💡 建议: 进度偏低，聚焦最重要的目标\n');
  } else if (avg > 80) {
    console.log('  💡 建议: 快要完成了，考虑设定下一阶段目标\n');
  }
}

else if (cmd === 'init') {
  // 初始化默认目标
  const data = loadGoals();
  if (data.goals.length === 0) {
    const defaults = [
      { name: 'LanguageHonesty接入主循环', description: 'processInput调用validateOutput，检测绝对判断词', days: 1 },
      { name: '模块接入率提升', description: 'GoalTracker等未用模块接入实际调用链', days: 3 },
      { name: '验证机制独立化', description: 'pre-upgrade-verify不依赖自检结果', days: 7 }
    ];
    defaults.forEach(d => {
      data.goals.push({
        id: Date.now() + Math.random(),
        name: d.name,
        description: d.description,
        progress: 0,
        status: 'active',
        createdAt: Date.now(),
        deadline: Date.now() + d.days * 86400000,
        subtasks: [],
        reflections: []
      });
    });
    saveGoals(data);
    console.log('✅ 初始化了3个默认目标');
    log('**目标系统初始化**\n' + defaults.map(g => `- ${g.name}: ${g.description}`).join('\n'));
  } else {
    console.log('目标已存在，跳过初始化');
  }
}
