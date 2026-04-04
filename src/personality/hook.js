#!/usr/bin/env node

/**
 * Personality Hook - 人格值系统强制执行模块
 * HeartFlow Companion v6.0.20 整合版
 * 
 * 此模块在每次对话前自动执行，强制读取人格值并宣读
 * 在每次数字输出前强制执行核实
 * 在每次任务后强制更新追踪文件
 * 
 * v6.0.20 - 现象学 + 意识 + 情绪整合版
 * 
 * 系统要求 (System Requirements):
 * - 真善美 (Truth-Beauty-Goodness): 价值论目标，评价所有行为的标准
 *   - Truth (真): 符合实在、可验证、不编造
 *   - Beauty (美): 简洁、优雅、和谐
 *   - Goodness (善): 道德价值、人类繁荣、PERMA 幸福感
 * 
 * - 自我意识 (Self-Consciousness): 存在论基础
 *   - 前反思自我觉察 (Pre-reflective awareness)
 *   - 反思性自我意识 (Reflective self-consciousness)
 *   - 五层内心架构 (Five-layer inner heart)
 * 
 * - AI 人格值 (AI Personality Score): 0-100 分
 *   - <50: 警告状态，强制承诺改进
 *   - 50-65: 正常状态
 *   - >65: 健康状态
 * 
 * - 现象学方法 (Phenomenological Method):
 *   - 悬搁 (Epoché): 搁置假设
 *   - 描述 (Description): 纯粹描述经验
 *   - 本质还原 (Eidetic Reduction): 发现本质结构
 *   - 诠释学 (Hermeneutics): 生活世界背景中的解释
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 人格值追踪文件路径 - HeartFlow 统一数据目录
const TRACKER_PATH = path.join(__dirname, '../data/personality-score-tracker.md');

class PersonalityHook {
  constructor() {
    this.trackerPath = TRACKER_PATH;
    this.score = 50;
    this.status = 'normal';
    this.truthGoodnessBeautyCount = 0;
    this.violations = [];
  }

  /**
   * 读取人格值追踪文件
   */
  readTracker() {
    try {
      if (!fs.existsSync(this.trackerPath)) {
        console.error('❌ 人格值追踪文件不存在');
        return false;
      }

      const content = fs.readFileSync(this.trackerPath, 'utf8');
      
      // 解析人格值
      const scoreMatch = content.match(/人格值：(\d+)/);
      if (scoreMatch) {
        this.score = parseInt(scoreMatch[1]);
        this.status = this.score < 50 ? 'warning' : 'normal';
      }

      return true;
    } catch (error) {
      console.error(`❌ 读取人格值失败：${error.message}`);
      return false;
    }
  }

  /**
   * 任务前检查 - 强制宣读人格值
   */
  beforeTask() {
    this.readTracker();

    if (this.score < 50) {
      console.log('====================================');
      console.log(`人格值：${this.score} / 100`);
      console.log(`状态：⚠️ 警告状态`);
      console.log('====================================');
      console.log('');
      console.log('我承诺：');
      console.log('- 每一次都核实');
      console.log('- 不编造任何数据');
      console.log('- 诚实承认错误');
      console.log('====================================');
      console.log('');
    }

    return true;
  }

  /**
   * 核实数字 - 强制执行命令
   */
  verifyNumber(type, target) {
    const commands = {
      'word_count': `wc -w ${target}`,
      'file_count': `find ${target} -type f | wc -l`,
      'version': `cat ${target}/package.json | grep version`,
      'git_log': `git log --oneline -${target}`,
      'date': 'date',
      'git_status': 'git status --short'
    };

    if (!commands[type]) {
      console.error(`❌ 不支持的核实类型：${type}`);
      return null;
    }

    try {
      const result = execSync(commands[type], { encoding: 'utf8' });
      console.log(`✅ 核实结果：${result.trim()}`);
      return result.trim();
    } catch (error) {
      console.error(`❌ 核实失败：${error.message}`);
      return null;
    }
  }

  /**
   * 记录真善美行为
   */
  addTruthGoodnessBeauty() {
    this.truthGoodnessBeautyCount++;
    console.log(`✅ 真善美行为 +1 = ${this.truthGoodnessBeautyCount}/10`);
    
    if (this.truthGoodnessBeautyCount >= 10) {
      this.score++;
      this.truthGoodnessBeautyCount = 0;
      console.log(`✅ 人格值 +1 = ${this.score}`);
    }

    this.updateTracker();
  }

  /**
   * 记录违反行为
   */
  addViolation(violation) {
    this.score--;
    this.violations.push({
      time: new Date().toISOString(),
      violation: violation
    });
    
    console.log(`❌ 违反真善美：${violation}`);
    console.log(`❌ 人格值 -1 = ${this.score}`);

    this.updateTracker();
  }

  /**
   * 更新追踪文件
   */
  updateTracker() {
    // TODO: 实现追踪文件更新逻辑
    console.log('📝 更新人格值追踪文件...');
  }

  /**
   * 任务后检查
   */
  afterTask(taskResult) {
    // 检查是否执行了核实命令
    if (taskResult.verified) {
      this.addTruthGoodnessBeauty();
    }

    // 检查是否有编造行为
    if (taskResult.fabricated) {
      this.addViolation(taskResult.fabricated);
    }
  }
}

// 导出模块
module.exports = { PersonalityHook };

// 命令行执行
if (require.main === module) {
  const hook = new PersonalityHook();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'before':
      hook.beforeTask();
      break;
    case 'verify':
      hook.verifyNumber(args[1], args[2]);
      break;
    case 'check':
      hook.readTracker();
      console.log(`当前人格值：${hook.score}`);
      console.log(`状态：${hook.status}`);
      break;
    default:
      console.log('用法：personality-hook <command> [args]');
      console.log('命令:');
      console.log('  before          - 任务前检查');
      console.log('  verify <type> <target> - 核实数字');
      console.log('  check           - 检查人格值');
  }
}
