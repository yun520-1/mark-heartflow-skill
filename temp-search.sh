#!/bin/bash
# 使用 cn-web-search 技能搜索最新理论

# 搜索 1: 自我意识现象学
echo "=== 搜索：自我意识现象学 最新研究 ==="
node -e "
const https = require('https');
const query = encodeURIComponent('自我意识现象学 2024 2025 最新研究 SEP Stanford');
https.get(\`https://api.allorigins.win/raw?url=https://www.bing.com/search?q=\${query}\`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.substring(0, 2000)));
}).on('error', e => console.error(e));
"
