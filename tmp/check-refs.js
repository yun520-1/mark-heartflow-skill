const { execSync } = require('child_process');
const path = require('path');
const cwd = '/root/.hermes/skills/ai/mark-heartflow-skill';

function run(cmd) {
  try { return execSync(cmd, {encoding:'utf8', cwd}).trim(); } catch(e) { return ''; }
}

const files = [
  'cortex/self-evolution/self-evolution-core.js',
  'reasoning/associative-engine/lexical-associator.js',
  'cortex/reflector.js',
  'workflow/pipeline-config.js',
  'reasoning/associative-engine/narrative-retriever.js',
  'cortex/reflection-loop.js',
  'workflow/task-pipeline.js',
  'cortex/self-evolution/meta-learning.js',
  'reasoning/associative-engine/word-by-word-generator.js',
  'core/cognitive-appraisal.js',
  'memory/emotional-memory-bridge.js',
  'core/boot-check.js',
  'shield/wake-up-verifier.js',
  'memory/memory-index.js',
  'cortex/experience-replay.js',
  'core/assertions.js',
  'memory/forgetting.js',
  'formula/formula-calculator.js',
];

console.log('LINES\tREFS\tSTATUS\tFILE');
for (const f of files) {
  const bn = path.basename(f, '.js');
  const lines = run('wc -l < src/' + f);
  const refs = run("grep -rn '" + bn + "' src/ --include='*.js' 2>/dev/null | grep -v " + f + " | grep -v '/test/' | wc -l");
  let status = 'ORPHAN';
  if (parseInt(refs) > 0) status = 'INDIRECT';
  else {
    const ex = run("grep -c 'module.exports' src/" + f + " 2>/dev/null");
    if (parseInt(ex) > 0) status = 'HAS_EXPORTS';
  }
  console.log(lines + '\t' + refs + '\t' + status + '\t' + f);
}
console.log('\nTotal: ' + run('find src/ -name "*.js" 2>/dev/null | wc -l'));
