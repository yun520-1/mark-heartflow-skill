#!/usr/bin/env node
/**
 * HeartFlow Dream Mode - 做梦升级系统
 * 每 21 分钟：搜索论文丰富代码
 * 每小时：打包上传 GitHub
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORK_DIR = '/Users/apple/mark-heartflow-skill';
const LOG_FILE = path.join(WORK_DIR, 'dream-log.txt');
const RESEARCH_FILE = path.join(WORK_DIR, '.opencode/dream-research.json');
const CRON_FILE = path.join(WORK_DIR, '.opencode/dream.cron');
const PKG_FILE = path.join(WORK_DIR, 'package.json');

function bumpVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(PKG_FILE, 'utf8'));
    const v = pkg.version.split('.').map(Number);
    v[2] += 0.1;
    if (v[2] >= 10) { v[2] = 0; v[1] += 1; }
    if (v[1] >= 10) { v[1] = 0; v[0] += 1; }
    pkg.version = v.join('.');
    fs.writeFileSync(PKG_FILE, JSON.stringify(pkg, null, 2) + '\n');
    log(`📦 版本号: ${pkg.version}`);
    return pkg.version;
  } catch (e) {
    log(`⚠️ 版本读取失败: ${e.message}`);
    return null;
  }
}

const SEARCH_QUERIES = [
  'philosophy psychology neuropsychology consciousness arxiv',
  'cognitive neuroscience memory LLM agent arxiv',
  'phenomenology consciousness artificial intelligence',
  'neuropsychology theory of mind arxiv',
  'philosophy of mind large language models',
  'cognitive architecture AI consciousness',
  'embodied cognition AI robotics',
  'affective computing emotionsAI',
  'moral philosophy AI alignment',
  'epistemology knowledge representation AI'
];

function log(msg) {
  const time = new Date().toISOString();
  const line = `[${time}] ${msg}`;
  fs.appendFileSync(LOG_FILE, line + '\n');
  console.log(line);
}

function getGitStatus() {
  try {
    execSync('git status --porcelain', { cwd: WORK_DIR, stdio: 'pipe' });
    return true;
  } catch { return false; }
}

function research() {
  log('🧠 开始做梦研究...');
  const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
  
  try {
    const results = execSync(
      `web-search-prime --query "${query}" --numResults 5 2>/dev/null || echo "search failed"`,
      { cwd: WORK_DIR, encoding: 'utf8', timeout: 60000 }
    ).slice(0, 2000);
    
    log(`📚 研究收获: ${query}`);
    
    const existing = fs.existsSync(RESEARCH_FILE) 
      ? JSON.parse(fs.readFileSync(RESEARCH_FILE)) : [];
    
    existing.push({
      time: new Date().toISOString(),
      query,
      summary: results.slice(0, 500)
    });
    
    fs.writeFileSync(RESEARCH_FILE, JSON.stringify(existing.slice(-50), null, 2));
    log('💾 研究结果已保存');
    
  } catch (e) {
    log(`⚠️ 研究出错: ${e.message}`);
  }
}

function pushToGitHub() {
  log('🚀 打包上传 GitHub...');
  
  if (!getGitStatus()) {
    log('无变更，跳过');
    return;
  }
  
  try {
    const version = bumpVersion();
    log(`📦 版本号增加: ${version}`);
    execSync(`git add -A`, { cwd: WORK_DIR });
    execSync(`git commit -m "dream-upgrade v${version}"`, { cwd: WORK_DIR });
    execSync(`git push origin main`, { cwd: WORK_DIR });
    log('✅ 已上传');
  } catch (e) {
    log(`⚠️ 上传失败: ${e.message}`);
  }
}

function installCron() {
  const cronContent = `# HeartFlow Dream Mode 定时任务
# 每 21 分钟 - 做梦研究
*/21 * * * * cd ${WORK_DIR} && /opt/homebrew/bin/node .opencode/dream-mode.js research >> .opencode/dream-log.txt 2>&1

# 每小时 - 打包上传
0 * * * * cd ${WORK_DIR} && /opt/homebrew/bin/node .opencode/dream-mode.js push >> .opencode/dream-log.txt 2>&1
`;
  fs.writeFileSync(CRON_FILE, cronContent);
  log(`✅ 已创建 ${CRON_FILE}`);
}

function main() {
  const arg = process.argv[2];
  
  if (arg === 'research') {
    research();
  } else if (arg === 'push') {
    pushToGitHub();
  } else if (arg === 'install') {
    installCron();
  } else {
    log('HeartFlow Dream Mode 已启动');
    research();
    setInterval(research, 21 * 60 * 1000);
    setInterval(pushToGitHub, 60 * 60 * 1000);
  }
}

main();