#!/usr/bin/env node
/**
 * HeartFlow 自动运行器
 * 每 30 分钟执行一次：记忆保存/状态检查/报告生成
 */

const fs = require('fs');
const path = require('path');
const { initializeState, saveState } = require('./memory/init.js');
const { generateReport } = require('./memory/report-generator.js');
const { getGitStatus, calculateWorkDuration } = require('./memory/environment-sensor.js');

const MEMORY_FILE = path.join(__dirname, 'memory', 'heartflow_state.json');
const LOG_FILE = path.join(__dirname, 'auto-runner.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(line.trim());
}

function run() {
  log('🔄 HeartFlow 自动运行开始');
  
  try {
    // 1. 初始化/读取状态
    const state = initializeState(MEMORY_FILE);
    log(`当前状态：会话 ${state.total_sessions}, 模式 ${state.current_mode}`);
    
    // 2. 更新会话时间
    state.last_session = new Date().toISOString();
    state.total_sessions += 1;
    
    // 3. 检查 Git 状态
    const gitStatus = getGitStatus(process.cwd());
    if (gitStatus.hasChanges) {
      log(`Git 变更：${gitStatus.changedFiles} 个文件`);
    }
    
    // 4. 计算工作时长
    const minutes = calculateWorkDuration(state.last_session);
    log(`工作时长：${minutes} 分钟`);
    
    // 5. 生成报告
    const report = generateReport(state);
    log('报告生成成功');
    
    // 6. 保存状态
    const success = saveState(MEMORY_FILE, state);
    if (success) {
      log('状态保存成功');
    } else {
      log('⚠️ 状态保存失败，静默降级');
    }
    
    log('✅ HeartFlow 自动运行完成');
  } catch (error) {
    log(`❌ 错误：${error.message}`);
  }
}

// 立即执行一次
run();

// 每 30 分钟执行一次
setInterval(run, 30 * 60 * 1000);

log('⏰ 定时任务已启动 (每 30 分钟)');
