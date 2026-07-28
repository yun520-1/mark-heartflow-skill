const { HeartFlow } = require('./src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: '.', silent: true });
hf.start();
setTimeout(async () => {
  try {
    const r = await hf.think('test memory write for heartflow');
    console.log('think OK');
    const fs = require('fs');
    const log = fs.readFileSync('logs/reflect.log', 'utf8');
    const lines = log.trim().split('\n');
    console.log('reflect.log lines:', lines.length);
    console.log('last line:', lines[lines.length-1].slice(0, 200));
  } catch (e) {
    console.log('ERROR:', e.message);
    console.log(e.stack.split('\n').slice(0, 5).join('\n'));
  }
  process.exit(0);
}, 4000);
