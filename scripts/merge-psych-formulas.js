#!/usr/bin/env node
/**
 * 合并 formulas_psych_philosophy.json → formulas.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname + '/..';
const mainPath = path.join(ROOT, 'formulas', 'formulas.json');
const psychPath = path.join(ROOT, 'formulas', 'formulas_psych_philosophy.json');

const main = JSON.parse(fs.readFileSync(mainPath, 'utf-8'));
const psych = JSON.parse(fs.readFileSync(psychPath, 'utf-8'));

console.log(`主库：${main.formulas.length}`);
console.log(`心理/哲学：${psych.formulas.length}`);

const idSet = new Set(main.formulas.map(f => f.id));
let added = 0;
let dupe = 0;

psych.formulas.forEach(f => {
  if (idSet.has(f.id)) { dupe++; return; }
  idSet.add(f.id);
  main.formulas.push(f);
  added++;
});

console.log(`新增：${added}，重复：${dupe}`);
console.log(`合并后：${main.formulas.length}`);

// 更新 metadata
main.metadata.version = '6.2.0';
main.metadata.last_updated = new Date().toISOString().slice(0, 10);
main.metadata.total_formulas = main.formulas.length;
main.metadata.categories = [...new Set(main.formulas.map(f => f.category))];

fs.writeFileSync(mainPath, JSON.stringify(main, null, 2), 'utf-8');
console.log(`✅ 已保存 ${mainPath}`);

// 统计
const cats = {};
main.formulas.forEach(f => { cats[f.category] = (cats[f.category] || 0) + 1; });
console.log('\n分类统计：');
Object.entries(cats).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`  ${c}: ${n}`));
