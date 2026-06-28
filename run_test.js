
const { LogicReasoning } = require('/Users/apple/.hermes/skills/ai/mark-heartflow-skill//src/reasoning/logic-reasoning.js');
const lr = new LogicReasoning();
const fs = require('fs');

// BigBench 50
const bb = JSON.parse(fs.readFileSync('bigbench_50.json', 'utf-8'));
let bbCorrect = 0, bbTotal = 0, bbFails = [];
for (const q of bb) {
  const input = q.question + '\n' + q.choices.map((c, i) => String.fromCharCode(65+i) + '. ' + c).join('\n');
  const result = lr.selectAnswer(input);
  const answer = q.answer;
  const answerLetter = typeof answer === 'number' ? String.fromCharCode(65+answer) : answer;
  const pass = result && result.selectedAnswer === answerLetter;
  if (pass) bbCorrect++; else bbFails.push(q.id + ' got=' + (result?result.selectedAnswer:'null') + ' exp=' + answerLetter);
  bbTotal++;
}
console.log('BigBench 50:', bbCorrect + '/' + bbTotal + '=' + Math.round(bbCorrect/bbTotal*100) + '%');
if (bbFails.length) console.log('  FAILS:', bbFails.join(', '));
