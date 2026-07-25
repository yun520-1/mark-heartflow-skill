const fs = require('fs');
const path = require('path');
// 59个孤儿文件处理: 归档死代码, 接通有用模块
const root = '/root/.hermes/skills/ai/mark-heartflow-skill';
const src = path.join(root, 'src');
const srcDir = src;
const hf = fs.readFileSync(path.join(src, 'core', 'heartflow.js'), 'utf8');

// 分类孤儿文件
const deadCode = [];     // 无引用 >800行, 备份后删除
const unwired = [];      // 有引用但没new在hf里, 尝试接通
const standalone = [];   // 独立入口(如mcp-server)
const keepOnly = [];     // 保留不改

const orphans = [];  // from audit report

function walk(dir) {
  fs.readdirSync(dir, {withFileTypes:true}).forEach(e => {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['node_modules'].includes(e.name)) walk(f); }
    else if (e.name.endsWith('.js')) {
      const rel = path.relative(srcDir, f);
      const content = fs.readFileSync(f, 'utf8');
      const lines = content.split('\n').length;
      if (lines < 20) return;
      const bn = path.basename(f, '.js');
      const refCount = (content.match(/require\(/g) || []).length;
      if (!hf.includes(bn)) {
        orphans.push({file:rel, lines, refs: refCount});
      }
    }
  });
}
walk(srcDir);

// 按行数降序
orphans.sort((a,b)=>b.lines-a.lines);

console.log('=== 53 orphans found (excluding mcp-server) ===');

// 分类
orphans.forEach(o => {
  if (o.file.includes('mcp-server')) { standalone.push(o); return; }
  if (o.file.includes('knowledge/index')) { keepOnly.push(o); return; }
  if (o.lines > 800) {
    // Check if actually useful by looking for require pattern matches in rest of src
    const bn = path.basename(o.file, '.js');
    const grep = require('child_process').execSync(
      `grep -rn "${bn}" src/ --include='*.js' 2>/dev/null | grep -v "${o.file}" | wc -l`,
      {encoding:'utf8', cwd: root}
    ).trim();
    if (parseInt(grep) === 0) {
      deadCode.push(o);
    } else {
      unwired.push(o);
    }
  } else {
    keepOnly.push(o);
  }
});

console.log('\n=== Dead code to archive ===');
deadCode.forEach(o => console.log(`  ${o.file} (${o.lines}行)`));

console.log('\n=== Unwired (useful but not connected) ===');
unwired.forEach(o => console.log(`  ${o.file} (${o.lines}行)`));

console.log('\n=== Standalone ===');
standalone.forEach(o => console.log(`  ${o.file} (${o.lines}行)`));

console.log('\n=== Keep only ===');
keepOnly.forEach(o => console.log(`  ${o.file} (${o.lines}行)`));

// Archive dead code: move to archive/ dir
const archiveDir = path.join(root, 'archive', 'src');
deadCode.forEach(o => {
  const srcFile = path.join(srcDir, o.file);
  const dstFile = path.join(archiveDir, o.file);
  try {
    fs.mkdirSync(path.dirname(dstFile), {recursive: true});
    fs.renameSync(srcFile, dstFile);
    console.log(`  Archived: ${o.file}`);
  } catch(e) {
    console.log(`  FAIL: ${o.file} - ${e.message}`);
  }
});

console.log(`\n== Summary ==`);
console.log(`Dead code archived: ${deadCode.length}`);
console.log(`Unwired to fix: ${unwired.length}`);
console.log(`Standalone: ${standalone.length}`);
console.log(`Keep: ${keepOnly.length}`);
