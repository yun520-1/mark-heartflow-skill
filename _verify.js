const content = require('fs').readFileSync('/tmp/committed_index.js','utf8');
const checks = [
  ['CLICKBAIT_PATTERNS', content.includes('CLICKBAIT_PATTERNS = {')],
  ['checkClickbait function', content.includes('function checkClickbait(')],
  ['discriminate cb var', content.includes('const cb = checkClickbait(text)')],
  ['1-cb.score in scores', content.includes('1-cb.score')],
  ['clickbait: cb in dims', content.includes('clickbait: cb')],
  ['clickbait in summary', content.includes('点击诱饵')],
  ['checkClickbait in exports', content.includes('checkClickbait,')],
  ['d.clickbait?.count in entropy', content.includes('d.clickbait?.count')],
  ['!d.clickbait?.count in allClean', content.includes('!d.clickbait?.count')],
  ['40维度 comment', content.includes('40维度')],
];
checks.forEach(([name, pass]) => console.log(pass ? '✓' : '✗', name));
const failures = checks.filter(([,p]) => !p).length;
console.log(failures === 0 ? 'ALL 10 CHECKS PASSED' : failures + ' FAILURES');

// Count patterns
const zhCount = content.match(/'zh_|'zh_/g);
const enCount = content.match(/'en_|'en_/g);
console.log('ZH patterns:', zhCount ? zhCount.length : 'check');
console.log('EN patterns:', enCount ? enCount.length : 'check');

try {
  require('/tmp/committed_index.js');
  console.log('Syntax: OK');
} catch(e) {
  console.log('Syntax ERROR:', e.message);
}
