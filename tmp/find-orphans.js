const fs = require('fs');
const path = require('path');
const hf = fs.readFileSync('src/core/heartflow.js', 'utf8');
const orphans = [];
const walk = (dir) => {
  fs.readdirSync(dir, {withFileTypes:true}).forEach(e => {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith('.js')) {
      const content = fs.readFileSync(f, 'utf8');
      const lines = content.split('\n').length;
      if (lines < 20) return;
      const bn = path.basename(f, '.js');
      if (!hf.includes(bn)) {
        orphans.push({file: f.replace(/^src\//,''), lines, refs: (content.match(/require\(/g)||[]).length});
      }
    }
  });
};
walk('src');
orphans.sort((a,b)=>b.lines-a.lines);
console.log('Top 20 orphans by line count:');
orphans.slice(0,20).forEach(o => console.log(o.lines+' lines\t'+o.file+' ('+o.refs+' reqs)'));
console.log('\nTotal orphans (>20 lines):', orphans.length);
