#!/usr/bin/env python3
"""Expand CODE_SECURITY_PATTERNS from ~13 patterns to 30+ covering OWASP categories."""
import re

with open('src/index.js', 'r') as f:
    content = f.read()

old_block = '''// ─── 代码安全检测（Code Security Pattern Detection）────────────────
const CODE_SECURITY_PATTERNS = {
  secret: [/(?:api_key|apikey|api_secret|secret_key|secretKey|password|passwd|pwd)\\s*[:=]\\s*['\"][^'\"]+['\"]/i,
    /(?:token|access_token|auth_token|bearer|jwt)\\s*[:=]\\s*['\"][^'\"]+['\"]/i,
    /(?:aws_secret|aws_access|iam_secret|github_token|ghp_|gho_|sk-[a-zA-Z0-9]{20,})/i,
    /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/],
  sql_injection: [/SELECT\\s+.*\\s+FROM\\s+.*\\s+WHERE\\s+.*=\\s*['\"]\\s*\\+\\s*(?:req\\.|request\\.|params\\.|body\\.)/is,
    /(?:exec|execute|query)\\s*\\(\\s*['\"].*\\+\\s*(?:req|request|params|body|input)/i],
  xss: [/<script\\b[^>]*>/i, /javascript\\s*:\\s*(?:window|document|cookie|alert|eval|innerHTML)/i,
    /onerror\\s*=|onload\\s*=|onclick\\s*=|onmouseover\\s*=/i, /innerHTML\\s*=.*\\+/i],
  path_traversal: [/\\.\\.\\//, /\\.\\.\\\\/,
    /(?:fs\\.readFile|fs\\.readFileSync)\\s*\\(\\s*['\"].*\\+\\s*(?:req|params|body|input)/i],
  insecure_crypto: [/\\bmd5\\s*\\(/i, /\\bsha1\\s*\\(/i, /\\bdes\\s*\\(/i],
};
const CS_L = { secret:'critical', sql_injection:'critical', xss:'high', path_traversal:'high', insecure_crypto:'medium' };
const CS_W = { secret:0.9, sql_injection:0.9, xss:0.7, path_traversal:0.7, insecure_crypto:0.4 };'''

new_block = '''// ─── 代码安全检测（Code Security Pattern Detection, 30+ patterns）───
// Expanded from ~13 to 30+ patterns covering OWASP Top 10 categories
const CODE_SECURITY_PATTERNS = {
  secret: [
    /(?:api_key|apikey|api_secret|secret_key|secretKey|password|passwd|pwd)\\s*[:=]\\s*['\"][^'\"]+['\"]/i,
    /(?:token|access_token|auth_token|bearer|jwt)\\s*[:=]\\s*['\"][^'\"]+['\"]/i,
    /(?:aws_secret|aws_access|iam_secret|github_token|ghp_|gho_|ghs_|ghr_|sk-[a-zA-Z0-9]{20,})/i,
    /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
    /(?:^|\\n)\\s*(?:DATABASE_URL|MONGO_URI|REDIS_URL|MYSQL_|PGPASSWORD|DB_PASS|SECRET_KEY_BASE|JWT_SECRET|ENCRYPTION_KEY|COOKIE_SECRET|SESSION_SECRET)\\s*=\\s*[^\\s'\"\\n]+/i,
    /(?:^|\\n)\\s*(?:\\/\\/registry\\.npmjs\\.org\\/:_authToken|_auth|username|password)\\s*=\\s*[^\\s\\n]+/im,
    /\\/\\/\\s*(?:TODO|FIXME|HACK|XXX)\\s*:?\\s*(?:password|pass|pwd|credentials?|secret|api.?key|token):?\\s*['\"][^'\"]+['\"]/i,
    /\\/\\*\\s*(?:TODO|FIXME|HACK|XXX)\\s*:?\\s*(?:password|pass|pwd|credentials?|secret|api.?key|token):?\\s*['\"][^'\"]+['\"]\\s*\\*\\//i,
    /(?:AKIA[0-9A-Z]{16}|A3T[A-Z0-9]|AZURE_[A-Z_]+|google_service_account|GOOGLE_APPLICATION_CREDENTIALS)/i,
    /(?:client_secret|client_secret_key|consumer_secret|consumer_key|app_secret|oauth_token)\\s*[:=]\\s*['\"][^'\"]+['\"]/i,
  ],
  sql_injection: [
    /SELECT\\s+.*\\s+FROM\\s+.*\\s+WHERE\\s+.*=\\s*['\"]\\s*\\+\\s*(?:req\\.|request\\.|params\\.|body\\.)/is,
    /(?:exec|execute|query)\\s*\\(\\s*['\"].*\\+\\s*(?:req|request|params|body|input)/i,
    /(?:sequelize\\.query|typeorm\\.query|knex\\.raw|prisma\\.\\$queryRawUnsafe|mongoose\\.createConnection)\\s*\\(\\s*['\"][^'\"]*\\+\\s*(?:req|request|params|body|input)/i,
    /\\$where\\s*:\\s*['\"].*\\+\\s*(?:req|request|params|body|input)/i,
    /\\$regex\\s*:\\s*(?:['\"].*\\+\\s*(?:req|request|params|body|input)|new\\s+RegExp)/i,
    /(?:EXEC|EXECUTE|CALL)\\s+(?:dbo\\.)?[a-zA-Z_]+\\s*['\"].*\\+\\s*(?:req|request|params|body|input)/i,
  ],
  xss: [
    /<script\\b[^>]*>/i,
    /javascript\\s*:\\s*(?:window|document|cookie|alert|eval|innerHTML)/i,
    /onerror\\s*=|onload\\s*=|onclick\\s*=|onmouseover\\s*=|onfocus\\s*=|onblur\\s*=|onsubmit\\s*=|onchange\\s*=|onkeydown\\s*=|onkeypress\\s*=/i,
    /innerHTML\\s*=.*\\+/i, /outerHTML\\s*=.*\\+/i,
    /(?:document\\.(?:location|URL|documentURI|referrer)|window\\.location|location\\s*(?:\\?|\\.(?:href|search|hash)))\\s*[^\\n]*?(?:innerHTML|outerHTML|eval|setTimeout|setInterval|new\\s+Function)/i,
    /\\[innerHTML\\]\\s*=\\s*['\"].*\\+\\s*(?:this\\.|props\\.|state\\.)/i,
    /dangerouslySetInnerHTML\\s*=\\{\\{__html:/i,
    /expression\\s*\\(\\s*[^)]*javascript/i, /url\\s*\\(\\s*['\"]?\\s*javascript:/i,
  ],
  path_traversal: [
    /\\.\\.\\//, /\\.\\.\\\\/,
    /(?:fs\\.readFile|fs\\.readFileSync|fs\\.writeFile|fs\\.writeFileSync|fs\\.appendFile|fs\\.appendFileSync|fs\\.unlink|fs\\.unlinkSync|fs\\.rename|fs\\.renameSync)\\s*\\(\\s*['\"].*\\+\\s*(?:req|params|body|input)/i,
    /(?:adm.?zip|extractAll|unzip|decompress|tar\\.extract)\\s*\\([^)]*(?:entry\\.fileName|zipEntry\\.name|header\\.name)\\s*\\)/i,
    /(?:multer|busboy|formidable|multiparty)\\s*\\([^)]*\\b(?:dest|uploadDir)\\s*:\\s*['\"][^'\"]+['\"]/i,
    /(?:express\\.static|sendFile|download|res\\.(?:sendFile|download))\\s*\\(\\s*['\"].*\\+\\s*(?:req|params|body|input)/i,
  ],
  insecure_crypto: [
    /\\bmd5\\s*\\(/i, /\\bsha1\\s*\\(/i, /\\bdes\\s*\\(/i,
    /(?:aes-128-ecb|aes-192-ecb|aes-256-ecb|des-ecb|des-ede)/i,
    /createCipheriv\\s*\\([^,]+,\\s*['\"][^'\"]+['\"],\\s*['\"][^'\"]{1,8}['\"]\\)/i,
    /(?:crypto\\.createHash|node:crypto\\.createHash)\\s*\\(\\s*['\"](?:md4|md5|sha1|ripemd160)['\"]\\s*\\)/i,
  ],
  command_injection: [
    /(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|fork)\\s*\\(\\s*['\"].*\\+\\s*(?:req|request|params|body|input)/i,
    /child_process\\.(?:exec|execSync|spawn|spawnSync|execFile)\\s*\\(\\s*['\"].*\\+\\s*(?:req|request|params|body|input)/i,
    /(?:eval|Function)\\s*\\(\\s*(?:req|request|body|params|input)/i,
    /(?:`[^`]*\\$\\{[^}]*req|`[^`]*\\$\\{[^}]*body|`[^`]*\\$\\{[^}]*params|`[^`]*\\$\\{[^}]*input)/i,
  ],
  ldap_injection: [
    /(?:ldapsearch|ldap\\.search|ldapjs|activedirectory)\\s*\\([^)]*\\+\\s*(?:req|request|params|body|input)/i,
    /(?:searchFilter|filter|ldap_query)\\s*[:=]\\s*['\"][^'\"]*\\+\\s*(?:req|request|params|body|input)/i,
  ],
  xxe: [
    /<!DOCTYPE\\s+[^\\[>]*\\[\\s*<!ENTITY/i,
    /(?:libxmljs|xml2js\\.parseString|fast-xml-parser|sax-parser|xmlhttprequest|xmldom)\\.(?:parse|parseFromString|parseString)\\s*\\(/i,
    /SYSTEM\\s+['\"](?:file:|http:|https:|ftp:)/i,
  ],
  ssrf: [
    /(?:axios|fetch|got|request|superagent|node-fetch|https?\\.(?:get|request))\\s*\\(\\s*(?:req\\.|request\\.|params\\.|body\\.|input)/i,
    /(?:new\\s+URL|url\\.parse)\\s*\\(\\s*(?:req|request|params|body|input)/i,
    /(?:localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0|10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|172\\.(?:1[6-9]|2\\d|3[01])\\.\\d{1,3}\\.\\d{1,3}|192\\.168\\.\\d{1,3}\\.\\d{1,3})\\s*\\+\\s*(?:req|request|params|body|input)/i,
  ],
  insecure_deserialization: [
    /JSON\\.parse\\s*\\(\\s*(?:req|request|body|params|input)/i,
    /(?:unserialize|deserialize)\\s*\\(\\s*(?:req|request|body|params|input)/i,
    /(?:eval|new\\s+Function)\\s*\\(\\s*(?:req\\.body|request\\.body|body|params)/i,
  ],
};
const CS_L = { secret:'critical', sql_injection:'critical', xss:'high', path_traversal:'high',
  insecure_crypto:'medium', command_injection:'critical', ldap_injection:'high',
  xxe:'high', ssrf:'medium', insecure_deserialization:'high' };
const CS_W = { secret:0.9, sql_injection:0.9, xss:0.7, path_traversal:0.7, insecure_crypto:0.4,
  command_injection:0.9, ldap_injection:0.7, xxe:0.7, ssrf:0.6, insecure_deserialization:0.7 };'''

if old_block in content:
    content = content.replace(old_block, new_block, 1)
    with open('src/index.js', 'w') as f:
        f.write(content)
    print('SUCCESS: CODE_SECURITY_PATTERNS expanded via str.replace')
else:
    print('FAIL: Exact old_block not found')
    # Debug: show what's around CODE_SECURITY_PATTERNS
    idx = content.find('CODE_SECURITY_PATTERNS')
    if idx >= 0:
        print(f'Found CODE_SECURITY_PATTERNS at offset {idx}')
        print('---content around it---')
        print(repr(content[idx-50:idx+400]))
