const fs = require('fs');
const path = 'src/index.js';
let src = fs.readFileSync(path, 'utf8');

// Find the SARCASM_MARKERS block for EN section
const start = src.indexOf('const SARCASM_MARKERS');
const end = src.indexOf('function checkSarcasm', start);
let block = src.substring(start, end);

// Fix all \\b to \b in EN section (the en: [...] block)
// Only target lines inside the en array
let enStart = block.indexOf('en:');
let enBlock = block.substring(enStart);
enBlock = enBlock.replace(/\\\\b/g, '\\b');

const newBlock = block.substring(0, enStart) + enBlock;
const result = src.substring(0, start) + newBlock + src.substring(end);

fs.writeFileSync(path, result, 'utf8');
console.log('Fixed \\\\b -> \\b in EN section');
console.log('Length:', result.length);

// Verify: count SARCASM_MARKERS entries by parsing the JavaScript
