/**
 * 环境感知模块
 * 感知代码文件变化、Git 状态、工作时间
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 感知最近修改的文件
function getRecentFiles(dir, limit = 5) {
  try {
    const files = [];
    const scan = (d) => {
      if (!fs.existsSync(d)) return;
      fs.readdirSync(d).forEach(f => {
        const full = path.join(d, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory() && !f.startsWith('.') && f !== 'node_modules') {
          scan(full);
        } else if (stat.isFile() && /\.(js|ts|py|md|json)$/.test(f)) {
          files.push({ path: full, mtime: stat.mtimeMs });
        }
      });
    };
    scan(dir);
    return files.sort((a,b) => b.mtime - a.mtime).slice(0, limit);
  } catch (e) {
    return [];
  }
}

// 获取 Git 状态
function getGitStatus(dir) {
  try {
    const status = execSync('git status --porcelain', { cwd: dir, encoding: 'utf-8' });
    const lines = status.trim().split('\n').filter(l => l);
    return {
      hasChanges: lines.length > 0,
      changedFiles: lines.length,
      raw: lines
    };
  } catch (e) {
    return { hasChanges: false, changedFiles: 0, raw: [] };
  }
}

// 计算工作时长
function calculateWorkDuration(sessionStart) {
  const now = Date.now();
  const start = new Date(sessionStart).getTime();
  const minutes = Math.round((now - start) / 60000);
  return minutes;
}

// 生成环境报告
function generateEnvironmentReport(dir, sessionStart) {
  const recentFiles = getRecentFiles(dir, 3);
  const gitStatus = getGitStatus(dir);
  const workMinutes = calculateWorkDuration(sessionStart);

  let report = '🔍 环境感知报告\n\n';
  report += `工作时长：${workMinutes} 分钟\n`;
  
  if (recentFiles.length > 0) {
    report += '\n最近编辑:\n';
    recentFiles.forEach(f => {
      const name = path.basename(f.path);
      report += `  - ${name}\n`;
    });
  }

  if (gitStatus.hasChanges) {
    report += `\nGit 变更：${gitStatus.changedFiles} 个文件未提交\n`;
    if (workMinutes >= 25) {
      report += '\n💡 建议：已经工作 25 分钟了，要不要提交一下进度？\n';
    }
  }

  if (workMinutes >= 25) {
    report += '\n⏰ 提醒：连续工作 25 分钟，站起来活动一下吧！\n';
  }

  return report;
}

module.exports = { getRecentFiles, getGitStatus, calculateWorkDuration, generateEnvironmentReport };
