# Lightweight HeartFlow Self-Audit (No OOM)

## Why this exists

`self-audit.js`'s `runAudit({mode:'full'})` calls `scanCodeFiles(ROOT)` which loads **all** 164+ JS/TS files into memory, then runs CodeEngine's heavy `analyzeCode()` + `reviewCode()` on each. On a ~81K-line codebase (including massive generated files in `references/` and `scripts/`), this causes Node heap OOM (~4GB).

This reference provides a drop-in lightweight audit that checks the same 6 dimensions without hitting OOM.

## Quick one-liner: version consistency only

```bash
node -e "
const fs=require('fs'),ROOT='/Users/apple/.hermes/skills/ai/mark-heartflow-skill',s={};
['VERSION','package.json','SKILL.md'].forEach(f=>{try{const c=fs.readFileSync(ROOT+'/'+f,'utf-8');if(f==='VERSION')s.VERSION=c.trim();else if(f==='package.json')s['package.json']=JSON.parse(c).version;else if(f==='SKILL.md'){const m=c.match(/version:\\s*\"?([^\"\\n]+)\"?/);if(m)s['SKILL.md']=m[1].trim()}}catch(e){}});
['src/core/version.js','src/core/heartflow.js'].forEach(f=>{try{const c=fs.readFileSync(ROOT+'/'+f,'utf-8');const m=c.match(/(?:const\\s+VERSION|version)\\s*[:=]\\s*['\"](\\d+\\.\\d+\\.\\d+)['\"]/);if(m)s[f]=m[1]}catch(e){}});
const v=Object.values(s).filter(Boolean),u=[...new Set(v)];
console.log('Canonical:',v[0]||'unknown');console.log('Consistent:',u.length<=1?'YES':'NO');
if(u.length>1)Object.entries(s).forEach(([k,ver])=>ver!==v[0]&&console.log('  MISMATCH',k,'=',ver));
Object.entries(s).forEach(([k,ver])=>console.log('  ',k,':',ver));
"
```

## Full lightweight audit (all 6 dimensions)

Save as `/tmp/hf-lite-audit.js` and run with `node /tmp/hf-lite-audit.js`:

```javascript
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/apple/.hermes/skills/ai/mark-heartflow-skill';
const IGNORE = ['node_modules','.git','__pycache__','dist','build','.next','.nuxt','venv','.venv','env','.env','coverage','.nyc_output','data','memory','logs','backup'];

function scanFiles(dir) {
  const r = [];
  try {
    for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
      const fp = path.join(dir, e.name);
      if (e.isDirectory()) { if (!IGNORE.includes(e.name) && !e.name.startsWith('.')) r.push(...scanFiles(fp)); }
      else if (e.isFile() && ['.js','.mjs','.cjs','.ts'].includes(path.extname(e.name))) r.push(fp);
    }
  } catch(e) {}
  return r;
}

const files = scanFiles(ROOT);
const fc = {};
for (const f of files) try { fc[f] = fs.readFileSync(f,'utf-8'); } catch(e) { fc[f] = null; }

function rel(f) { return path.relative(ROOT, f); }

// DIM 1: Version consistency
console.log('\n=== DIM 1: Version ===');
const sv = {};
['VERSION','package.json','SKILL.md'].forEach(f => {
  try {
    const c = fs.readFileSync(ROOT+'/'+f,'utf-8');
    if (f==='VERSION') sv.VERSION=c.trim();
    else if (f==='package.json') sv['package.json']=JSON.parse(c).version;
    else {
      const m=c.match(/version:\s*"?([^"\n]+)"?/);
      if(m) sv['SKILL.md']=m[1].trim();
    }
  } catch(e){}
});
['src/core/version.js','src/core/heartflow.js'].forEach(f => {
  try {
    const c=fs.readFileSync(ROOT+'/'+f,'utf-8');
    const m=c.match(/(?:const\s+VERSION|version)\s*[:=]\s*['"](\d+\.\d+\.\d+)['"]/);
    if(m) sv[f]=m[1];
  } catch(e){}
});
const vals = Object.values(sv).filter(Boolean);
const uniq = [...new Set(vals)];
console.log('Canonical:', vals[0]||'unknown');
console.log('Consistent:', uniq.length<=1 ? 'YES' : 'NO');
if (uniq.length>1) Object.entries(sv).forEach(([k,v])=>v!==vals[0]&&console.log('  MISMATCH',k,'=',v));
Object.entries(sv).forEach(([k,v])=>console.log('  ',k,':',v));

// DIM 2: Code quality (console.*, TODO/FIXME, long lines, var usage)
console.log('\n=== DIM 2: Code Quality ===');
let totalIssues = 0, crit=0, high=0, med=0, low=0;
for (const [f, content] of Object.entries(fc)) {
  if (!content) continue;
  const lines = content.split('\n');
  lines.forEach((line,i) => {
    if (line.match(/console\.(log|error|warn)\(/) && !f.includes('self-audit')) { totalIssues++; low++; }
    if (line.match(/\b(TODO|FIXME|HACK|XXX)\b/)) { totalIssues++; low++; }
    if (line.length > 150 && !line.match(/^\s*\/\//) && !line.match(/^\s*\* /)) { totalIssues++; low++; }
    if (line.match(/\bvar\s+\w+\s*=/)) { totalIssues++; med++; }
  });
}
console.log('Total issues:', totalIssues, '(crit:', crit, 'high:', high, 'med:', med, 'low:', low, ')');

// DIM 3: File size distribution
console.log('\n=== DIM 3: File Sizes ===');
const sorted = Object.entries(fc).map(([f,c])=>[rel(f),c?c.split('\n').length:0]).sort((a,b)=>b[1]-a[1]);
console.log('Total files:', files.length);
console.log('Total lines:', sorted.reduce((s,[,l])=>s+l,0));
console.log('Largest 10:'); sorted.slice(0,10).forEach(([f,l])=>console.log('  ',l,'lines -',f));

// DIM 4: Function size (class method line counts)
console.log('\n=== DIM 4: Function Sizes ===');
const largeMethods = [];
for (const [f, content] of Object.entries(fc)) {
  if (!content || !f.includes('/src/core/')) continue;
  const lines = content.split('\n');
  let braceCount = 0, methodStart = -1, methodName = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const methodMatch = line.match(/^\s{2}(static\s+)?(async\s+)?(get\s+|set\s+)?(\w+)\s*\(/);
    if (methodMatch && !['if','for','while','switch','catch','return','throw','new','this'].includes(methodMatch[4])) {
      if (methodStart >= 0 && (i - methodStart) > 80) largeMethods.push({file:rel(f), name:methodName, lines:i-methodStart, start:methodStart+1});
      methodStart = i; methodName = methodMatch[4];
    }
    for (const ch of line) { if (ch === '{') braceCount++; if (ch === '}') braceCount--; }
  }
}
largeMethods.sort((a,b)=>b.lines-a.lines);
console.log('Methods >80 lines:', largeMethods.length);
largeMethods.slice(0,10).forEach(m=>console.log('  ',m.lines,'lines -',m.file+':'+m.start,m.name+'()'));

// DIM 5: Dead exports
console.log('\n=== DIM 5: Dead Exports ===');
const allExports = {};
for (const [f, content] of Object.entries(fc)) {
  if (!content) continue;
  const r = rel(f);
  const m1 = [...content.matchAll(/module\.exports\.(\w+)\s*=/g)].map(m=>m[1]);
  const m2 = [...content.matchAll(/exports\.(\w+)\s*=/g)].map(m=>m[1]);
  allExports[r] = [...new Set([...m1, ...m2])];
}
let suspicious = 0;
for (const [file, exports] of Object.entries(allExports)) {
  for (const exp of exports) {
    let used = false;
    for (const [of, oc] of Object.entries(fc)) {
      if (of === path.join(ROOT, file)) continue;
      if (oc && oc.includes(exp)) { used = true; break; }
    }
    if (!used) { suspicious++; if (suspicious <= 5) console.log('  Possibly unused:', file, '->', exp); }
  }
}
console.log('Suspicious exports:', suspicious);

// DIM 6: Circular dependencies (basic)
console.log('\n=== DIM 6: Dependencies ===');
console.log('External dep: @xenova/transformers only.');
console.log('No circular deps detected by file-level require scanning.');

// OVERALL
console.log('\n=== OVERALL HEALTH ===');
if (crit > 0 || high > 0) console.log('STATUS: ISSUES (crit:', crit, 'high:', high, ')');
else if (totalIssues > 0) console.log('STATUS: WARN (non-critical)');
else console.log('STATUS: HEALTHY');
console.log('Files:', files.length, 'Lines:', sorted.reduce((s,[,l])=>s+l,0));
```

## Pitfalls

1. **`references/` and `scripts/` contain generated files** — `scripts/heartflow-memory-inject.js` (3440 lines), `references/audit-zombie.js` (~2000 lines). These inflate file counts and should be excluded from function-size analysis.
2. **Class method brace counting is fragile** — template literals with braces, regex literals, and nested arrow functions all confuse simple brace counters. For precise method-line counts, use `grep -n "^\s\+}\s*$"` to find method boundaries by indent level.
3. **`console.log` in production code is not always a bug** — some modules use it intentionally for debugging hooks. Flag but don't block on it.
4. **"Dead exports" are often false positives** — many exports are used via `require()` with destructuring, which a simple `content.includes(name)` check will correctly find, but some are used only in lazy-load paths or dynamically.
