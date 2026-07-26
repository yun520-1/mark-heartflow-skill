const m = require('./src/index.js');

console.log('=== Debug: secret - TODO comment ===');
const t1 = '// TODO: fix password "admin123"';
console.log('input:', JSON.stringify(t1));
console.log('match:', t1.match(/\/\/\s*(?:TODO|FIXME|HACK|XXX)\s*:?\s*(?:password|pass|pwd|credentials?|secret|api.?key|token):?\s*['\"][^'\"]+['\"]/i));

console.log('\n=== Debug: xxe - xml2js.parseString ===');
const t2 = 'xml2js.parseString(xml)';
console.log('input:', JSON.stringify(t2));
const p = /(?:libxmljs|xml2js\.parseString|fast-xml-parser|sax-parser|xmlhttprequest|xmldom)\.(?:parse|parseFromString|parseString)\s*\(/i;
console.log('match:', t2.match(p));

console.log('\n=== Debug: xxe - SYSTEM ===');
const t3 = '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>';
const p2 = /SYSTEM\s+['\"](?:file:|http:|https:|ftp:)/i;
console.log('input:', JSON.stringify(t3));
console.log('match:', t3.match(p2));

console.log('\n=== Debug: insecure_deserialization - unserialize ===');
const t4 = 'unserialize(userInput)';
console.log('input:', JSON.stringify(t4));
const p3 = /(?:unserialize|deserialize)\s*\(\s*(?:req|request|body|params|input)/i;
console.log('match:', t4.match(p3));
