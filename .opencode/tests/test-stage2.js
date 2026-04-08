const { getRecentFiles, getGitStatus } = require('../memory/environment-sensor.js');
const { switchMode, getAllModes } = require('../memory/mode-switcher.js');
const { collectFeedback } = require('../memory/feedback-collector.js');

let pass=0, fail=0;
function t(n,fn){try{fn();console.log('✅',n);pass++}catch(e){console.log('❌',n,e.message);fail++}}

console.log('🧪 第二阶段测试...\n');

t('环境感知 - 获取文件', ()=>{
  const files = getRecentFiles(process.cwd(), 3);
  if (!Array.isArray(files)) throw 'E';
});

t('环境感知 - Git 状态', ()=>{
  const status = getGitStatus(process.cwd());
  if (!('hasChanges' in status)) throw 'E';
});

t('模式切换 - 有效模式', ()=>{
  const state = { current_mode: 'buddy', session_progress: { rounds: 5 } };
  const result = switchMode(state, 'coach');
  if (!result.success) throw 'E';
  if (!result.progressRetained) throw '进度未保留';
});

t('模式切换 - 无效模式', ()=>{
  const result = switchMode({ current_mode: 'buddy' }, 'invalid');
  if (result.success) throw '应失败';
});

t('获取所有模式', ()=>{
  const modes = getAllModes();
  if (modes.length !== 3) throw '模式数量错误';
});

t('反馈收集 - 高分', ()=>{
  const state = { personality: { growth: 6, autonomy: 5, introspection: 7 }, feedback_history: [] };
  const result = collectFeedback(state, 9, '很好');
  if (state.personality.growth <= 6) throw '成长未增加';
});

t('反馈收集 - 低分', ()=>{
  const state = { personality: { growth: 6, autonomy: 5, introspection: 7 }, feedback_history: [] };
  collectFeedback(state, 4, '需改进');
  if (state.personality.introspection <= 7) throw '自省未增加';
});

console.log(`\n结果：${pass}通过，${fail}失败`);
process.exit(fail>0?1:0);
