const m = require('./src/index.js');

// Test LDAP patterns specifically
const ldapTests = [
  'ldap.search("ou=people," + req.body.filter)',
  'searchFilter = "(uid=" + input + ")"',
  'ldap_query = "(uid=" + params.uid + ")"',
  'activeDirectory.find("(&(objectClass=user)(sAMAccountName=" + req.body.username + "))"',
  'const filter = "(cn=" + userInput + ")"',
  'ldapjs.search("dc=example,dc=com", "(uid=" + req.body.uid + ")")',
];

console.log('=== LDAP Injection Tests ===');
for (const t of ldapTests) {
  const r = m.checkCodeSecurity(t);
  console.log(r.count > 0 ? 'HIT  ' : 'MISS ', '| types:', JSON.stringify(r.types), '|', t.slice(0, 55));
}

// Also test whether the pattern matches raw variable name "input" at all
console.log('\n=== Variable Name Tests ===');
const varTests = [
  '" + input + "',
  '" + req.body.x + "',
  '" + params.x + "',
  '" + body.x + "',
];
for (const t of varTests) {
  const p = /(?:searchFilter|filter|ldap_query)\s*[:=]\s*['\"][^'\"]*\+\s*(?:req|request|params|body|input)/i;
  console.log(t.match(p) ? 'HIT' : 'MISS', '|', t);
}
