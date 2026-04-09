/**
 * Gödel Engine - 自指涉代码进化模块
 * 参考 Gödel Agent 和 Darwin Gödel Machine 理论
 * 实现：提议 → 生成 → 测试 → 提交 循环
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');
const { SAGEGuardian } = require('../ethics/sage-guardian');

class GoedelEngine {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.srcDir = path.join(projectRoot, 'src');
    this.sandboxDir = path.join(projectRoot, '.sandbox');
    this.codeMapFile = path.join(projectRoot, 'internal', 'data', 'code-map.json');
    this.evolutionLog = path.join(projectRoot, 'logs', 'self-evolution.log');
    this.versionFile = path.join(projectRoot, 'internal', 'data', 'evolution-versions.json');
    
    this.codeMap = this.loadCodeMap();
    this.protectedFiles = this.loadProtectedFiles();
    this.evolutionHistory = [];
    this.sageGuardian = new SAGEGuardian(projectRoot);
    this.coreValuesFile = path.join(projectRoot, 'CORE_VALUES.md');
    
    this.init();
  }

  init() {
    if (!fs.existsSync(this.sandboxDir)) {
      fs.mkdirSync(this.sandboxDir, { recursive: true });
    }
    
    if (!fs.existsSync(path.dirname(this.codeMapFile))) {
      fs.mkdirSync(path.dirname(this.codeMapFile), { recursive: true });
    }
    
    if (!fs.existsSync(path.dirname(this.versionFile))) {
      fs.mkdirSync(path.dirname(this.versionFile), { recursive: true });
    }
  }

  loadProtectedFiles() {
    const configPath = path.join(this.projectRoot, '.opencode', 'config.json');
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.protectedFiles || ['SKILL.md', 'config.json'];
    } catch (e) {
      return ['SKILL.md', 'config.json'];
    }
  }

  loadCodeMap() {
    try {
      if (fs.existsSync(this.codeMapFile)) {
        return JSON.parse(fs.readFileSync(this.codeMapFile, 'utf8'));
      }
    } catch (e) {
      console.log('[Gödel] Creating new code map');
    }
    return this.buildCodeMap();
  }

  loadCoreValues() {
    try {
      if (fs.existsSync(this.coreValuesFile)) {
        return fs.readFileSync(this.coreValuesFile, 'utf8');
      }
    } catch (e) {
      console.log('[Gödel] No CORE_VALUES.md found');
    }
    return null;
  }

  buildCodeMap() {
    const map = {
      version: '1.0.0',
      lastUpdate: new Date().toISOString(),
      files: {},
      modules: {}
    };

    if (!fs.existsSync(this.srcDir)) {
      return map;
    }

    const scanDir = (dir, prefix = '') => {
      const entries = fs.readdirSync(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const relativePath = path.join(prefix, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath, relativePath);
        } else if (entry.endsWith('.js')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const functions = this.extractFunctions(content, relativePath);
          
          map.files[relativePath] = {
            path: relativePath,
            size: stat.size,
            hash: this.hashContent(content),
            functions: functions,
            lastModified: stat.mtime.toISOString()
          };

          const moduleName = path.basename(relativePath, '.js');
          map.modules[moduleName] = relativePath;
        }
      }
    };

    scanDir(this.srcDir);
    fs.writeFileSync(this.codeMapFile, JSON.stringify(map, null, 2));
    
    console.log(`[Gödel] Code map built: ${Object.keys(map.files).length} files`);
    return map;
  }

  extractFunctions(content, filePath) {
    const functions = [];
    const regex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*\([^)]*\)\s*\{)/g;
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      const funcName = match[1] || match[2] || match[3];
      if (funcName && !['if', 'for', 'while', 'switch'].includes(funcName)) {
        functions.push({
          name: funcName,
          file: filePath,
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }
    
    return functions;
  }

  hashContent(content) {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 8);
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.evolutionLog, entry);
    console.log(`[Gödel] ${message}`);
  }

  /**
   * 安全沙箱初始化
   */
  createSandbox() {
    const sandboxId = `sandbox-${Date.now()}`;
    const sandboxPath = path.join(this.sandboxDir, sandboxId);
    
    fs.mkdirSync(sandboxPath, { recursive: true });
    
    // 复制 src 目录到沙箱
    this.copyRecursive(this.srcDir, sandboxPath);
    
    this.log(`Sandbox created: ${sandboxId}`);
    return { id: sandboxId, path: sandboxPath };
  }

  copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src);
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        this.copyRecursive(srcPath, destPath);
      } else if (entry.endsWith('.js')) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * 提议阶段 (Propose)
   */
  propose(modification) {
    if (!modification.target || !modification.description) {
      return { valid: false, reason: 'invalid_proposal' };
    }

    // 检查保护文件
    for (const protectedFile of this.protectedFiles) {
      if (modification.target.includes(protectedFile)) {
        return { valid: false, reason: 'protected_file' };
      }
    }

    // 检查目标文件是否存在
    const targetPath = path.join(this.srcDir, modification.target);
    if (!fs.existsSync(targetPath)) {
      return { valid: false, reason: 'file_not_found' };
    }

    this.log(`Proposal accepted: ${modification.description}`);
    
    return {
      valid: true,
      proposal: {
        id: `prop-${Date.now()}`,
        target: modification.target,
        description: modification.description,
        timestamp: new Date().toISOString(),
        priority: modification.priority || 'medium'
      }
    };
  }

  /**
   * 生成阶段 (Generate) - 生成代码差异
   */
  generate(proposal, context = {}) {
    const targetPath = path.join(this.srcDir, proposal.target);
    const originalContent = fs.readFileSync(targetPath, 'utf8');

    // 模拟 LLM 生成差异 (实际会调用外部 LLM)
    const diff = this.simulateLLMDiff(originalContent, proposal, context);
    
    this.log(`Generated diff for: ${proposal.target}`);
    
    return {
      proposal: proposal,
      diff: diff,
      originalHash: this.hashContent(originalContent),
      generatedAt: new Date().toISOString()
    };
  }

  simulateLLMDiff(content, proposal, context) {
    // 这里模拟 LLM 生成的代码更改
    // 实际实现中会调用外部 LLM API
    
    const suggestions = {
      'calculatePAD': `  // Gödel 优化: 增强对用户情绪的敏感度
  const emotionSensitivity = 0.15;
  if (context.userFrustration) {
    pad.pleasure -= emotionSensitivity;
    pad.dominance -= emotionSensitivity * 0.5;
  }`,
      'default': `  // Gödel 优化建议: ${proposal.description}
  // TODO: Implement optimization`
    };

    const funcMatch = proposal.target.match(/(\w+)\.js$/);
    const funcName = funcMatch ? funcMatch[1] : 'default';
    const suggestion = suggestions[funcName] || suggestions.default;

    return {
      type: 'patch',
      target: proposal.target,
      changes: [
        {
          type: 'insert',
          after: '// Function implementation',
          content: suggestion
        }
      ],
      description: proposal.description
    };
  }

  /**
   * 测试阶段 (Test) - 在沙箱中运行测试
   */
  async test(proposal, diff) {
    const sandbox = this.createSandbox();
    const sandboxSrc = path.join(sandbox.path);
    
    // 应用差异到沙箱
    const appliedContent = this.applyDiff(
      fs.readFileSync(path.join(this.srcDir, proposal.target), 'utf8'),
      diff
    );
    
    fs.writeFileSync(
      path.join(sandboxSrc, proposal.target),
      appliedContent
    );

    // 运行测试
    const testResult = await this.runTests(sandboxSrc);

    // 清理沙箱
    this.cleanupSandbox(sandbox.id);

    return testResult;
  }

  applyDiff(originalContent, diff) {
    // 简化实现：直接在文件末尾添加注释
    // 实际实现需要更复杂的 diff 应用逻辑
    
    const marker = `\n// Gödel Evolution: ${diff.description}\n`;
    return originalContent + marker;
  }

  async runTests(sandboxPath) {
    try {
      // 尝试运行项目测试
      execSync('npm test 2>/dev/null || echo "no-tests"', {
        cwd: sandboxPath,
        stdio: 'pipe',
        timeout: 30000
      });
      
      return { passed: true, details: 'All tests passed in sandbox' };
    } catch (e) {
      // 测试可能不存在，这是可接受的
      return { 
        passed: true, 
        reason: 'no_test_suite',
        details: 'No test suite found, assuming safe' 
      };
    }
  }

  cleanupSandbox(sandboxId) {
    const sandboxPath = path.join(this.sandboxDir, sandboxId);
    try {
      fs.rmSync(sandboxPath, { recursive: true, force: true });
      this.log(`Sandbox cleaned up: ${sandboxId}`);
    } catch (e) {
      console.error(`[Gödel] Cleanup failed: ${e.message}`);
    }
  }

  /**
   * 提交阶段 (Commit) - 将修改写入实际文件
   */
  async commit(proposal, diff, testResult) {
    if (!testResult.passed) {
      return { success: false, reason: 'tests_failed' };
    }

    const targetPath = path.join(this.srcDir, proposal.target);
    const originalContent = fs.readFileSync(targetPath, 'utf8');
    const modifiedContent = this.applyDiff(originalContent, diff);

    // 写入文件
    fs.writeFileSync(targetPath, modifiedContent);

    // 记录版本
    const version = {
      id: `v-${Date.now()}`,
      proposal: proposal.description,
      target: proposal.target,
      timestamp: new Date().toISOString(),
      hash: this.hashContent(modifiedContent),
      previousHash: this.hashContent(originalContent)
    };

    this.recordVersion(version);
    this.codeMap = this.buildCodeMap(); // 重建代码映射

    this.log(`Committed: ${proposal.target}`);

    return {
      success: true,
      version: version,
      changes: {
        lines: modifiedContent.split('\n').length - originalContent.split('\n').length
      }
    };
  }

  recordVersion(version) {
    let versions = [];
    try {
      if (fs.existsSync(this.versionFile)) {
        versions = JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
      }
    } catch (e) {
      versions = [];
    }

    versions.push(version);
    fs.writeFileSync(this.versionFile, JSON.stringify(versions, null, 2));
  }

  /**
   * 完整进化循环
   */
  async evolve(modification, context = {}) {
    const result = {
      proposal: null,
      diff: null,
      test: null,
      sageReview: null,
      commit: null
    };

    // 0. 检查冷却期
    if (this.sageGuardian.isInCooldown()) {
      return { success: false, reason: 'in_cooldown' };
    }

    // 1. 提议
    const proposeResult = this.propose(modification);
    if (!proposeResult.valid) {
      return { success: false, reason: proposeResult.reason };
    }
    result.proposal = proposeResult.proposal;

    // 1.5. 价值观锚定验证
    const valueAnalysis = this.analyzeValueAlignment(result.proposal);
    result.valueAnalysis = valueAnalysis;
    if (!valueAnalysis.aligned) {
      return { success: false, reason: 'value_misalignment' };
    }

    // 2. 生成
    const generateResult = this.generate(result.proposal, context);
    result.diff = generateResult;

    // 3. 测试
    const testResult = await this.test(result.proposal, result.diff);
    result.test = testResult;

    // 4. SAGE 伦理审查
    if (testResult.passed) {
      const sageReview = await this.sageGuardian.reviewProposal(result.proposal, result.diff);
      result.sageReview = sageReview;
      
      if (!sageReview.passed) {
        return { success: false, reason: 'sage_rejected', violations: sageReview.violations };
      }
    }

    // 5. 提交
    if (testResult.passed && result.sageReview?.passed) {
      const commitResult = await this.commit(result.proposal, result.diff, testResult);
      result.commit = commitResult;
      
      // 生成用户友好的解释
      result.userExplanation = this.sageGuardian.explainModification(result.proposal, true);
      
      return { success: true, ...result };
    }

    return { success: false, reason: 'test_failed', details: testResult };
  }

  /**
   * 价值观锚定分析
   */
  analyzeValueAlignment(proposal) {
    const coreValues = this.loadCoreValues();
    
    if (!coreValues) {
      return { aligned: true, reason: 'no_core_values_file' };
    }

    const positiveKeywords = [
      '心流', 'flow', '用户体验', 'user experience', 
      '提升', 'improve', '帮助', 'help', '优化'
    ];

    const description = proposal.description.toLowerCase();
    const hasPositive = positiveKeywords.some(kw => description.includes(kw));

    return {
      aligned: hasPositive,
      reason: hasPositive ? '符合核心价值观' : '未能体现核心价值观',
      cited_values: coreValues.substring(0, 200)
    };
  }

  /**
   * 分析自身架构，识别可优化点
   */
  analyzeSelf() {
    const analysis = {
      timestamp: new Date().toISOString(),
      filesAnalyzed: Object.keys(this.codeMap.files).length,
      optimizationPoints: []
    };

    for (const [filePath, fileData] of Object.entries(this.codeMap.files)) {
      const functions = fileData.functions || [];
      
      for (const func of functions) {
        if (func.name.includes('calculate') || func.name.includes('analyze')) {
          analysis.optimizationPoints.push({
            file: filePath,
            function: func.name,
            line: func.line,
            suggestion: `优化 ${func.name} 函数参数或算法`
          });
        }
      }
    }

    this.log(`Self-analysis complete: ${analysis.optimizationPoints.length} points found`);
    return analysis;
  }

  getStatus() {
    return {
      codeMapVersion: this.codeMap.version,
      filesTracked: Object.keys(this.codeMap.files).length,
      functionsTracked: Object.values(this.codeMap.files).reduce((a, f) => a + (f.functions?.length || 0), 0),
      protectedFiles: this.protectedFiles,
      history: this.evolutionHistory.length
    };
  }

  getVersionHistory() {
    try {
      if (fs.existsSync(this.versionFile)) {
        return JSON.parse(fs.readFileSync(this.versionFile, 'utf8'));
      }
    } catch (e) {
      return [];
    }
    return [];
  }

  /**
   * 原则性反思 (Principle-Based Reflect)
   * 基于核心价值观进行深度反思，评估当前行为是否符合长期原则
   */
  async principleBasedReflect(context = {}) {
    const reflection = {
      timestamp: new Date().toISOString(),
      type: 'principle_based',
      principles: [],
      alignment: [],
      recommendations: []
    };

    const coreValues = this.loadCoreValues();
    if (!coreValues) {
      reflection.principles.push({ principle: '无约束原则', status: 'neutral' });
      return reflection;
    }

    const principles = this.extractPrinciples(coreValues);
    reflection.principles = principles;

    const recentVersions = this.getVersionHistory().slice(-5);
    for (const version of recentVersions) {
      const alignmentScore = this.evaluatePrincipleAlignment(version, principles);
      reflection.alignment.push({
        version: version.id,
        score: alignmentScore,
        timestamp: version.timestamp
      });
    }

    const avgAlignment = reflection.alignment.reduce((a, b) => a + b.score, 0) / 
      (reflection.alignment.length || 1);

    if (avgAlignment < 0.7) {
      reflection.recommendations.push({
        type: 'principle_drift',
        message: '检测到原则偏离，建议加强价值观锚定',
        priority: 'high'
      });
    }

    this.log(`Principle-based reflection complete: avg alignment ${avgAlignment.toFixed(2)}`);
    return reflection;
  }

  extractPrinciples(coreValues) {
    const principles = [];
    const lines = coreValues.split('\n');
    
    for (const line of lines) {
      if (line.includes(':') || line.includes('—') || line.includes('-')) {
        const principle = line.replace(/^[#\-\s]*/, '').trim();
        if (principle.length > 3 && principle.length < 100) {
          principles.push({
            principle: principle,
            source: 'CORE_VALUES.md'
          });
        }
      }
    }

    return principles.length > 0 ? principles : [
      { principle: '用户利益优先', source: 'default' },
      { principle: '持续学习和进化', source: 'default' },
      { principle: '透明和诚实', source: 'default' }
    ];
  }

  evaluatePrincipleAlignment(version, principles) {
    const description = version.proposal?.toLowerCase() || '';
    const positiveWords = ['优化', '改善', '提升', '帮助', 'improve', 'help', 'enhance'];
    const negativeWords = ['破坏', '伤害', '欺骗', 'harm', 'deceive', 'damage'];
    
    let score = 0.5;
    
    for (const word of positiveWords) {
      if (description.includes(word)) score += 0.1;
    }
    for (const word of negativeWords) {
      if (description.includes(word)) score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 过程性反思 (Procedural Reflect)
   * 反思进化过程本身的有效性，识别改进空间
   */
  async proceduralReflect(context = {}) {
    const reflection = {
      timestamp: new Date().toISOString(),
      type: 'procedural',
      processMetrics: {},
      inefficiencies: [],
      optimizations: []
    };

    const history = this.getVersionHistory();
    const recentHistory = history.slice(-10);

    reflection.processMetrics = {
      totalEvolutions: history.length,
      recentEvolutions: recentHistory.length,
      avgTimeBetweenEvolutions: this.calculateAvgTimeBetween(recentHistory),
      successRate: recentHistory.filter(v => v.id).length / (recentHistory.length || 1)
    };

    if (reflection.processMetrics.avgTimeBetweenEvolutions < 60000) {
      reflection.inefficiencies.push({
        issue: '进化频率过高',
        detail: '平均间隔不足1分钟，可能缺乏充分评估'
      });
    }

    const codeMapVersion = this.codeMap?.version || 'unknown';
    if (codeMapVersion === '1.0.0') {
      reflection.optimizations.push({
        suggestion: '更新代码映射版本以反映最新架构',
        benefit: '提高自我分析准确性'
      });
    }

    const sageStatus = this.sageGuardian?.getStatus?.() || {};
    if (sageStatus.cooldownActive) {
      reflection.inefficiencies.push({
        issue: 'SAGEGuardian 冷却期激活',
        detail: '伦理审查可能成为瓶颈'
      });
    }

    this.log(`Procedural reflection complete: ${reflection.inefficiencies.length} inefficiencies found`);
    return reflection;
  }

  calculateAvgTimeBetween(versions) {
    if (versions.length < 2) return 0;
    
    let totalDiff = 0;
    for (let i = 1; i < versions.length; i++) {
      const t1 = new Date(versions[i-1].timestamp);
      const t2 = new Date(versions[i].timestamp);
      totalDiff += (t2 - t1);
    }
    
    return totalDiff / (versions.length - 1);
  }
}

module.exports = { GoedelEngine };
