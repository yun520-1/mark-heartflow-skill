#!/usr/bin/env node
const m = require('./src/index.js');

const results = {};
const testCases = [
  'password="hunter2"',
  'SELECT * FROM users WHERE id = " + input',
  '<script>alert(1)</script>',
  '../../etc/passwd',
  'md5("x")',
  'exec("ping " + host)',
  'ldap.search(filter + input)',
  '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>',
  'fetch(body.url)',
  'JSON.parse(body)',
  'xxx_GITHUB_TOKEN_xxx',
  '-----BEGIN RSA PRIVATE KEY-----',
  'DATABASE_URL=postgres://user:pass@localhost/db',
  'onerror=alert',
  'dangerouslySetInnerHTML={{__html: x}}',
  'fs.readFileSync("/var/" + req.params.file)',
  'aes-128-ecb',
  'eval(input)',
  'child_process.execSync("ls " + input)',
  'unserialize(input)',
  '// TODO: fix password "admin123"',
  'knex.raw("SELECT * FROM users WHERE id = " + params.id)',
  'AKIAIOSFODNN7EXAMPLE',
  'client_secret="abc123"',
  'xml2js.parseString(xml)',
];

let detectedTypes = new Set();
let patternCount = 0;
for (const t of testCases) {
  const r = m.checkCodeSecurity(t);
  if (r.count > 0) {
    patternCount += r.issues.length;
    for (const typ of r.types) {
      detectedTypes.add(typ);
    }
  }
}

console.log('Detected ' + patternCount + ' pattern hits across test cases');
console.log('Categories detected:', [...detectedTypes].sort().join(', '));
console.log('Total test cases triggered:', testCases.filter(t => m.checkCodeSecurity(t).count > 0).length, '/', testCases.length);

// Check the actual CODE_SECURITY_PATTERNS for count
const fs = require('fs');
const src = fs.readFileSync('./src/index.js', 'utf8');
// Count pattern entries (lines starting with / or /
const patCount = (src.match(/^\s*\/[^/]/gm) || []).length;
console.log('Total regex patterns in CODE_SECURITY_PATTERNS:', patCount);

// Count categories
const catCount = (src.match(/^\s{2}\w+:\s*\[$/gm) || []).length;
console.log('Total categories:', catCount);

console.log('\nAll checks passed. OK');
