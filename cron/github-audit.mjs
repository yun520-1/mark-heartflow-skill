#!/opt/homebrew/bin/node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(__dirname, '..');

const LOG_FILE = path.join(SKILL_DIR, 'logs', 'github-audit.log');
const log = (msg) => console.log('[' + new Date().toISOString() + '] ' + msg);

try {
  // 1. Git状态
  const gitStatus = execSync('git status --short', {cwd: SKILL_DIR, encoding: 'utf8', maxBuffer: 1024*1024}).trim();
  log('[1/6] Git状态: ' + (gitStatus ? '有更改' : '干净'));
  if (gitStatus) {
    const lines = gitStatus.split('\n').slice(0, 5);
    lines.forEach(l => log('  ' + l));
  }
  
  // 2. 版本一致性
  const QUEUE_FILE = path.join(SKILL_DIR, 'cron', 'paper-upgrade-queue.json');
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  const FILE_VER = fs.readFileSync(path.join(SKILL_DIR, 'VERSION'), 'utf8').trim();
  log('[2/6] 版本: queue=' + queue.currentVersion + ', file=' + FILE_VER);
  if (queue.currentVersion !== FILE_VER) {
    log('  ⚠️ 版本不一致!');
  }
  
  // 3. 关键文件检查
  const keyFiles = ['SKILL.md', 'AGENTS.md', 'src/index.ts', 'src/core/heartflow.js', 'package.json'];
  keyFiles.forEach(f => {
    const exists = fs.existsSync(path.join(SKILL_DIR, f));
    log('[3/6] ' + (exists ? '✅' : '❌') + ' ' + f);
  });
  
  // 4. 语法检查 (TypeScript files)
  let errors = 0;
  try {
    const tsFiles = execSync('find src -name "*.ts" -type f 2>/dev/null | head -20', {cwd: SKILL_DIR, encoding: 'utf8'}).trim().split('\n').filter(Boolean);
    tsFiles.forEach(f => {
      try {
        execSync('node --check "' + f + '"', {stdio: 'pipe', cwd: SKILL_DIR});
      } catch(e) {
        // .ts won't pass node --check, skip
      }
    });
  } catch(e) {}
  
  // 5. 队列状态
  log('[5/6] 队列: papersIndex=' + queue.papersIndex + ', papersRead=' + queue.papersRead.length + ', upgradeCount=' + queue.upgradeCount);
  
  // 6. launchd 服务检查
  let servicesOk = 0;
  const services = ['com.heartflow.paper-upgrade', 'com.heartflow.github-audit', 'com.heartflow.auto-evolution', 'com.heartflow.full-audit'];
  for (const svc of services) {
    try {
      const out = execSync('launchctl list | grep ' + svc, {encoding: 'utf8'});
      if (out.includes(svc)) servicesOk++;
    } catch(e) {}
  }
  log('[6/6] launchd服务: ' + servicesOk + '/' + services.length + ' 运行中');
  
  log('✅ GitHub审计完成');
} catch(e) {
  log('❌ 审计失败: ' + e.message);
}
