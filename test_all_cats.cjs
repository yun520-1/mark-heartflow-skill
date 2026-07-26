const m = require('./src/index.js');
const checks = {
  secret: [
    'password="hunter2"',
    'ghp_xxxxxxxxxxxxxxxxxxxx',
    '-----BEGIN RSA PRIVATE KEY-----',
    'DATABASE_URL=postgres://user:pass@host/db',
    'AKIAIOSFODNN7EXAMPLE',
    'client_secret="abc123"',
    '// TODO: fix password "admin123"',
  ],
  sql_injection: [
    'SELECT * FROM users WHERE id = " + req.body.id',
    'exec("SELECT * FROM " + params.table)',
    'knex.raw("SELECT * FROM users WHERE id = " + params.id)',
    '$where: "this.name == " + req.body.name',
    'EXEC dbo.getUser " + input',
  ],
  xss: [
    '<script>alert(1)</script>',
    'javascript:alert(1)',
    'onerror=alert(1)',
    'innerHTML = "<div>" + userInput',
    'dangerouslySetInnerHTML={{__html: x}}',
    'expression(javascript:alert(1))',
  ],
  path_traversal: [
    '../../etc/passwd',
    '..\\windows\\win.ini',
    'fs.readFileSync("/var/" + req.params.file)',
    'res.sendFile("/var/" + req.path)',
  ],
  insecure_crypto: [
    'md5("pass")',
    'sha1("data")',
    'des("text")',
    'aes-128-ecb',
  ],
  command_injection: [
    'exec("ping " + req.body.host)',
    'child_process.execSync("ls " + input)',
    'eval(req.body.code)',
    'new Function(req.body.script)',
    '`ping ${req.body.host}`',
  ],
  ldap_injection: [
    'ldap.search("ou=people," + filter)',
    'searchFilter = "(uid=" + input + ")"',
  ],
  xxe: [
    '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>',
    'xml2js.parseString(xml)',
    'SYSTEM "http://evil.com/xxx"',
  ],
  ssrf: [
    'fetch(req.body.url)',
    'new URL(input, base)',
    'localhost:8080 + req.body.path',
  ],
  insecure_deserialization: [
    'JSON.parse(req.body)',
    'unserialize(userInput)',
    'eval(req.body.data)',
  ],
};

let allPass = true;
for (const [cat, inputs] of Object.entries(checks)) {
  let detected = false;
  for (const input of inputs) {
    const r = m.checkCodeSecurity(input);
    if (r.types.includes(cat)) { detected = true; break; }
  }
  const status = detected ? 'PASS' : 'FAIL';
  if (!detected) allPass = false;
  console.log(status, '|', cat, '(' + inputs.length + ' tested)');
}
console.log('\nAll categories work:', allPass ? 'YES' : 'SOME FAILED');
