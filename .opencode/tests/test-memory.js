const fs = require('fs');
const path = require('path');
const { initializeState } = require('../memory/init.js');
const { generateReport } = require('../memory/report-generator.js');
const TEST = path.join(__dirname, 'test.json');
let pass=0, fail=0;
function t(n,fn){try{fn();console.log('✅',n);pass++}catch(e){console.log('❌',n,e.message);fail++}}
console.log('🧪 测试开始...\n');
t('初始化',()=>{if(fs.existsSync(TEST))fs.unlinkSync(TEST);const s=initializeState(TEST);if(!fs.existsSync(TEST))throw'E'});
t('读取',()=>{const s=initializeState(TEST);if(!s.personality)throw'E'});
t('更新',()=>{const s=initializeState(TEST);s.total_sessions=5;fs.writeFileSync(TEST,JSON.stringify(s))});
t('验证',()=>{const s=initializeState(TEST);if(s.total_sessions!==5)throw'E'});
t('报告',()=>{const s=initializeState(TEST);const r=generateReport(s);if(!r.includes('心流'))throw'E'});
t('损坏恢复',()=>{fs.writeFileSync(TEST,'bad');const s=initializeState(TEST);if(!s.version)throw'E'});
if(fs.existsSync(TEST))fs.unlinkSync(TEST);
console.log(`\n结果：${pass}通过，${fail}失败`);
process.exit(fail>0?1:0);
