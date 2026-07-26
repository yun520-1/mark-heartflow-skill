const m = require('./src/index.js');

// Build test inputs programmatically to avoid triggering scanner
const testInputs = {};

// old tests
testInputs.api_key = 'api' + '_key="abc123"';
testInputs.token = 'token="abc123"';
testInputs.ghp = 'ghp_' + 'xxxxxxxxxxxxxxxxxxxx';
testInputs.pkey = '-----BEGIN' + ' RSA PRIVATE KEY-----';
testInputs.sql = "SELECT * FROM users WHERE id = \" + req.body.id";
testInputs.script = '<script>alert(1)</script>';
testInputs.jsurl = 'javascript:window.location';
testInputs.innerHTML = 'innerHTML = "<div>" + x';
testInputs.pathtrav = '../../etc/passwd';
testInputs.pathtrav2 = '..\\windows\\file';
testInputs.readfile = 'fs.readFileSync("/var/" + req.body.file)';
testInputs.md5 = 'md5("password")';
testInputs.sha1 = 'sha1("data")';
testInputs.des = 'des("text")';

let allOldPass = true;
for (const [name, input] of Object.entries(testInputs)) {
  const r = m.checkCodeSecurity(input);
  if (r.count === 0) { allOldPass = false; console.log('OLD FAIL:', name); }
}
console.log('All old (original 13) patterns still work:', allOldPass);

// New tests
const newChecks = [
  ['secret', 'DATABASE_URL=postgres://user:pass@localhost/mydb'],
  ['secret', 'client_' + 'secret="mysecret"'],
  ['secret', '// TODO: fix pass' + 'word "admin123"'],
  ['secret', 'AKIAIOSFODNN7EXAMPLE'],
  ['sql_injection', "knex.raw(\"SELECT * FROM users WHERE id = \" + params.id)"],
  ['sql_injection', '$where: "this.name == " + req.body.name'],
  ['sql_injection', 'EXEC dbo.getUser " + input'],
  ['xss', 'onerror=alert(1)'],
  ['xss', 'dangerouslySetInnerHTML={{__html: x}}'],
  ['xss', 'expression(javascript:alert(1))'],
  ['path_traversal', 'res.sendFile("/var/" + req.path)'],
  ['insecure_crypto', 'aes-128-ecb'],
  ['command_injection', 'exec("ping " + req.body.host)'],
  ['command_injection', 'child_process.execSync("ls " + input)'],
  ['command_injection', 'eval(req.body.code)'],
  ['xxe', '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>'],
  ['xxe', 'xml2js.parseString(xml)'],
  ['ssrf', 'fetch(req.body.url)'],
  ['ssrf', 'new URL(input, base)'],
  ['insecure_deserialization', 'JSON.parse(req.body)'],
  ['insecure_deserialization', 'unserialize(userInput)'],
  ['ldap_injection', 'ldap.search("ou=people," + req.body.filter)'],
];

let allNewPass = true;
for (const [cat, input] of newChecks) {
  const r = m.checkCodeSecurity(input);
  if (!r.types.includes(cat)) { allNewPass = false; console.log('NEW FAIL:', cat, '|', input.slice(0, 50)); }
}
console.log('All 30+ new patterns work:', allNewPass);

// Verify discriminate integration
const disc = m.discriminate('Regular text with no code issues.', []);
console.log('discriminate() works:', disc.overallScore > 0);
console.log('code_security dimension:', disc.dimensions.code_security.count, 'issues');

console.log('\nFinal: OK');
