
const { LogicReasoning } = require("./src/reasoning/logic-reasoning.js");
const lr = new LogicReasoning();
const fs = require("fs");
const tests = JSON.parse(fs.readFileSync("bigbench_50.json", "utf-8"));
let correct = 0, total = 0, fails = [];
for (const q of tests) {
  const input = q.question + "\n" + q.choices.map((c, i) => String.fromCharCode(65+i) + ". " + c).join("\n");
  const result = lr.selectAnswer(input);
  const answerLetter = typeof q.answer === "number" ? String.fromCharCode(65+q.answer) : q.answer;
  const pass = result && result.selectedAnswer === answerLetter;
  if (pass) correct++; else fails.push(q.id + ": got=" + (result?result.selectedAnswer:"null") + " exp=" + answerLetter);
  total++;
}
console.log("BigBench:", correct + "/" + total + "=" + Math.round(correct/total*100) + "%");
if (fails.length) console.log("FAILS:", fails.join(", "));
