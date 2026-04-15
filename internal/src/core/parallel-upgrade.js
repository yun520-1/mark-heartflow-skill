/**
 * 并行升级引擎 | Parallel Upgrade Engine
 * 
 * 版本：v6.1.61
 * 创建时间：2026-04-06
 * 
 * 核心功能：
 * - 多分支并行开发
 * - 同时转换多个理论
 * - 加速代码生成
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { theoryToCode, batchConvert } = require('./theory-to-code');

// ============================================================================
// 并行任务管理
// ============================================================================

class ParallelUpgradeEngine {
  constructor() {
    this.tasks = [];
    this.results = [];
    this.maxConcurrent = 3; // 最多 3 个并行任务
  }
  
  /**
   * 添加任务
   */
  addTask(name, fn) {
    this.tasks.push({
      name,
      fn,
      status: 'pending',
      result: null,
      error: null
    });
    return this;
  }
  
  /**
   * 执行所有任务 (并行)
   */
  async executeAll() {
    const chunks = this.chunkTasks(this.tasks, this.maxConcurrent);
    
    for (const chunk of chunks) {
      const promises = chunk.map(task => this.executeTask(task));
      await Promise.all(promises);
    }
    
    return this.results;
  }
  
  /**
   * 执行单个任务
   */
  async executeTask(task) {
    task.status = 'running';
    console.log(`🔄 执行：${task.name}`);
    
    try {
      const result = await task.fn();
      task.status = 'completed';
      task.result = result;
      this.results.push({ name: task.name, success: true, result });
      console.log(`✅ 完成：${task.name}`);
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      this.results.push({ name: task.name, success: false, error: error.message });
      console.log(`❌ 失败：${task.name} - ${error.message}`);
    }
  }
  
  /**
   * 分块 (用于控制并发数)
   */
  chunkTasks(tasks, size) {
    const chunks = [];
    for (let i = 0; i < tasks.length; i += size) {
      chunks.push(tasks.slice(i, i + size));
    }
    return chunks;
  }
  
  /**
   * 生成报告
   */
  generateReport() {
    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;
    
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(0) : 0,
      details: this.results
    };
  }
}

// ============================================================================
// 理论转换任务
// ============================================================================

/**
 * 创建理论转换任务
 */
function createTheoryConvertTask(docPath, outputDir) {
  return {
    name: `转换理论：${path.basename(docPath)}`,
    fn: async () => {
      const result = theoryToCode(docPath, outputDir);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result;
    }
  };
}

/**
 * 批量理论转换
 */
function batchTheoryConvert(docsDir, outputDir) {
  const engine = new ParallelUpgradeEngine();
  
  try {
    const files = fs.readdirSync(docsDir)
      .filter(f => f.endsWith('.md'));
    
    console.log(`发现 ${files.length} 个理论文档`);
    console.log('');
    
    for (const file of files) {
      const docPath = path.join(docsDir, file);
      const task = createTheoryConvertTask(docPath, outputDir);
      engine.addTask(task.name, task.fn);
    }
  } catch (error) {
    console.log(`❌ 扫描失败：${error.message}`);
    return { success: false, error: error.message };
  }
  
  return engine;
}

// ============================================================================
// Git 分支管理
// ============================================================================

/**
 * 创建特性分支
 */
function createFeatureBranch(featureName) {
  const branchName = `feature/${featureName}`;
  
  try {
    execSync(`git checkout -b ${branchName}`, {
      cwd: path.join(__dirname, '../..'),
      stdio: 'pipe'
    });
    return { success: true, branch: branchName };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 合并分支到 main
 */
function mergeToMain(branchName) {
  try {
    execSync('git checkout main', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'pipe'
    });
    
    execSync(`git merge ${branchName} --no-ff`, {
      cwd: path.join(__dirname, '../..'),
      stdio: 'pipe'
    });
    
    return { success: true, message: `合并 ${branchName} 到 main` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 并行分支开发
 */
function parallelFeatureDevelopment(features) {
  const engine = new ParallelUpgradeEngine();
  
  for (const feature of features) {
    engine.addTask(
      `分支：${feature.name}`,
      async () => {
        // 创建分支
        const branchResult = createFeatureBranch(feature.name);
        if (!branchResult.success) throw new Error(branchResult.error);
        
        // 执行开发任务
        const devResult = await feature.develop();
        
        // 提交
        execSync('git add -A && git commit -m "Feature: ' + feature.name + '"', {
          cwd: path.join(__dirname, '../..'),
          stdio: 'pipe'
        });
        
        // 返回 main
        execSync('git checkout main', {
          cwd: path.join(__dirname, '../..'),
          stdio: 'pipe'
        });
        
        return { branch: branchResult.branch, devResult };
      }
    );
  }
  
  return engine;
}

// ============================================================================
// 主函数
// ============================================================================

/**
 * 执行并行升级
 */
async function executeParallelUpgrade(config) {
  const {
    convertTheories = true,
    parallelBranches = false,
    features = []
  } = config;
  
  const mainEngine = new ParallelUpgradeEngine();
  
  // 任务 1: 理论转换
  if (convertTheories) {
    const docsDir = path.join(__dirname, '../docs/theories');
    const outputDir = path.join(__dirname, '../src/theories');
    
    if (fs.existsSync(docsDir)) {
      const convertEngine = batchTheoryConvert(docsDir, outputDir);
      await convertEngine.executeAll();
      
      const report = convertEngine.generateReport();
      console.log('');
      console.log('📊 理论转换报告:');
      console.log(`   总数：${report.total}`);
      console.log(`   成功：${report.successful}`);
      console.log(`   失败：${report.failed}`);
      console.log(`   成功率：${report.successRate}%`);
      console.log('');
    }
  }
  
  // 任务 2: 并行分支开发
  if (parallelBranches && features.length > 0) {
    const featureEngine = parallelFeatureDevelopment(features);
    await featureEngine.executeAll();
    
    const report = featureEngine.generateReport();
    console.log('');
    console.log('📊 分支开发报告:');
    console.log(`   总数：${report.total}`);
    console.log(`   成功：${report.successful}`);
    console.log(`   失败：${report.failed}`);
    console.log(`   成功率：${report.successRate}%`);
    console.log('');
  }
  
  return mainEngine.generateReport();
}

// ============================================================================
// CLI 入口
// ============================================================================

if (require.main === module) {
  const action = process.argv[2];
  
  if (action === 'convert') {
    const docsDir = process.argv[3] || path.join(__dirname, '../docs/theories');
    const outputDir = process.argv[4] || path.join(__dirname, '../src/theories');
    
    console.log('');
    console.log('🚀 理论→代码批量转换');
    console.log('====================================');
    console.log(`输入：${docsDir}`);
    console.log(`输出：${outputDir}`);
    console.log('');
    
    const engine = batchTheoryConvert(docsDir, outputDir);
    
    engine.executeAll().then(() => {
      const report = engine.generateReport();
      console.log('');
      console.log('====================================');
      console.log('转换完成');
      console.log(`成功：${report.successful}/${report.total}`);
      console.log('');
    });
  } else {
    console.log('');
    console.log('并行升级引擎');
    console.log('');
    console.log('用法:');
    console.log('  node scripts/parallel-upgrade.js convert [docsDir] [outputDir]');
    console.log('');
  }
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  ParallelUpgradeEngine,
  createTheoryConvertTask,
  batchTheoryConvert,
  createFeatureBranch,
  mergeToMain,
  parallelFeatureDevelopment,
  executeParallelUpgrade
};
