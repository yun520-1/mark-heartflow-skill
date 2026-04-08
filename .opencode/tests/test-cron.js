const fs = require('fs');
const path = require('path');
const { initializeState, saveState } = require('../memory/init.js');
const { generateReport } = require('../memory/report-generator.js');

const TEST_FILE = path.join(__dirname, 'test_cron_state.json');
let pass=0, fail=0;
function t(n,fn){try{fn();console.log('✅',n);pass++}catch(e){console.log('❌',n,e.message);fail++}}

console.log('🧪 定时任务测试...\n');

t('初始化状态', ()=>{
  const state = initializeState(TEST_FILE);
  if (!state.version) throw 'E';
});

t('更新会话时间', ()=>{
  const state = initializeState(TEST_FILE);
  const old = state.last_session;
  state.last_session = new Date().toISOString();
  if (old === state.last_session) throw '未更新';
});

t('增加会话次数', ()=>{
  const state = initializeState(TEST_FILE);
  state.total_sessions += 1;
  saveState(TEST_FILE, state);
  const s2 = initializeState(TEST_FILE);
  if (s2.total_sessions < 1) throw 'E';
});

t('生成报告', ()=>{
  const state = initializeState(TEST_FILE);
  const report = generateReport(state);
  if (!report.includes('心流')) throw 'E';
});

t('保存状态', ()=>{
  const state = initializeState(TEST_FILE);
  state.personality.authenticity = 7.5;
  const ok = saveState(TEST_FILE, state);
  if (!ok) throw 'E';
});

t('验证保存', ()=>{
  const state = initializeState(TEST_FILE);
  if (state.personality.authenticity !== 7.5) throw 'E';
});

if (fs.existsSync(TEST_FILE)) fs.unlinkSync(TEST_FILE);
console.log(`\n结果：${pass}通过，${fail}失败`);
process.exit(fail>0?1:0);
