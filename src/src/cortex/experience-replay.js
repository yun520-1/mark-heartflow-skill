/**
 * Experience Replay - 反馈循环机制
 * 从反思报告中提取模式，生成技能修改建议
 * 
 * v2.2.1 升级内容:
 * - 新增 DataIntegrityError/SelfHealAction/PatternOscillation 状态枚举
 * - 新增 validateReportIntegrity() 数据完整性校验
 * - 新增 detectOscillation() 震荡检测（防止模式反复切换）
 * - 新增 selfHealCorruptedFile() 自愈修复逻辑
 * - 新增 retryWithFallback() 重试策略
 * - 新增 agePatterns() 模式衰减（旧模式优先级降低）
 * - 新增 selfDiagnostic() 自诊断模式
 */

const fs = require('fs');
const { atomicWrite } = require('../utils/atomic-write');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// 状态枚举
// ═══════════════════════════════════════════════════════════════════════════════

/** 数据完整性错误类型 */
const DataIntegrityError = {
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_TYPE: 'INVALID_TYPE',
  CORRUPTED_JSON: 'CORRUPTED_JSON',
  STALE_DATA: 'STALE_DATA',
  EMPTY_REPORT: 'EMPTY_REPORT',
  CYCLE_DETECTED: 'CYCLE_DETECTED'
};

/** 自愈动作类型 */
const SelfHealAction = {
  REBUILD_FILE: 'REBUILD_FILE',
  TRUNCATE_ENTRY: 'TRUNCATE_ENTRY',
  CLEAR_AND_RETRY: 'CLEAR_AND_RETRY',
  RECOVER_FROM_BACKUP: 'RECOVER_FROM_BACKUP',
  RESET_PATTERN: 'RESET_PATTERN',
  FALLBACK_TO_DEFAULTS: 'FALLBACK_TO_DEFAULTS'
};

/** 模式震荡类型 */
const PatternOscillation = {
  NONE: 'NONE',
  SOFT: 'SOFT',       // 模式在2个状态间来回切换
  HARD: 'HARD',       // 模式在3+个状态间快速切换
  RECOVERED: 'RECOVERED'  // 已从震荡中恢复
};

/** 文件操作重试配置 */
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 200,
  BACKOFF_FACTOR: 2
};

/** 震荡检测参数 */
const OSCILLATION_CONFIG = {
  WINDOW_SIZE: 10,       // 检测窗口（最近的N次记录）
  SOFT_THRESHOLD: 4,     // 2状态切换 ≥4次 → 软震荡
  HARD_THRESHOLD: 6,     // 状态变更 ≥6次 → 硬震荡
  DECAY_HALF_LIFE: 7     // 模式衰减半衰期（天）
};

// ═══════════════════════════════════════════════════════════════════════════════
// ExperienceReplay 类
// ═══════════════════════════════════════════════════════════════════════════════

class ExperienceReplay {
  constructor(projectRoot) {
    // [P2] 路径验证 - 防止路径遍历
    if (!projectRoot || typeof projectRoot !== 'string') {
      throw new Error('[ExperienceReplay] Invalid projectRoot');
    }
    const resolvedRoot = path.resolve(projectRoot);
    const normalizedPath = path.normalize(resolvedRoot);
    if (normalizedPath !== resolvedRoot || !path.isAbsolute(resolvedRoot)) {
      throw new Error('[ExperienceReplay] Invalid projectRoot path');
    }

    this.projectRoot = resolvedRoot;
    this.reportFile = path.join(resolvedRoot, 'logs', 'reflect-reports.json');
    this.suggestionFile = path.join(resolvedRoot, 'logs', 'skill-suggestions.json');
    this.patternFile = path.join(resolvedRoot, '.opencode', 'memory', 'experience-patterns.json');

    this.patterns = this.loadPatterns();
    this.knownPatterns = this.initializeKnownPatterns();
    // 震荡检测缓存
    this._oscillationCache = {};
    // 自诊断计数
    this._diagnosticCount = 0;
  }

  /**
   * 加载已存储的模式
   * 含自修复：检测JSON损坏时自动重建
   */
  loadPatterns() {
    const raw = this.readFileWithIntegrityCheck(this.patternFile);
    if (raw === null) {
      return { patterns: [], lastUpdate: null };
    }
    try {
      const parsed = JSON.parse(raw);
      // 验证结构完整性
      const validation = this.validateReportIntegrity(parsed, 'patternFile');
      if (!validation.valid) {
        // [PROD] 生产环境移除 console.warn: console.warn('[ExperienceReplay] Pattern file integrity check failed:', validation.error);
        if (validation.severity === 'critical') {
          return this.selfHealCorruptedFile('patternFile');
        }
        // 轻度损坏：修复并继续
        return this.repairPartialPatterns(parsed);
      }
      return parsed;
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn('[ExperienceReplay] loadPatterns failed:', e.message);
      return this.selfHealCorruptedFile('patternFile');
    }
  }

  /**
   * 带完整性检查的文件读取
   * @param {string} filePath - 文件路径
   * @returns {string|null} 文件内容，损坏时返回null
   */
  readFileWithIntegrityCheck(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      const stats = fs.statSync(filePath);
      // 空文件检测
      if (stats.size === 0) {
        // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] Empty file detected: ${filePath}`);
        return null;
      }
      // 过大文件检测（>10MB视为异常）
      if (stats.size > 10 * 1024 * 1024) {
        // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] Abnormally large file (${stats.size}B): ${filePath}`);
        return null;
      }
      return fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] readFileWithIntegrityCheck failed for ${filePath}:`, e.message);
      return null;
    }
  }

  /**
   * 验证数据完整性
   * @param {*} data - 待验证的数据
   * @param {string} source - 数据来源标识
   * @returns {{ valid: boolean, error: string|null, severity: string|null }}
   */
  validateReportIntegrity(data, source) {
    if (data === null || data === undefined) {
      return { valid: false, error: `${source} 数据为空`, severity: 'critical' };
    }
    if (typeof data !== 'object' || Array.isArray(data)) {
      // 允许顶层是数组（如报告列表）
      if (Array.isArray(data)) {
        // 验证数组中的每个元素
        for (let i = 0; i < Math.min(data.length, 5); i++) {
          if (typeof data[i] !== 'object' || data[i] === null) {
            return { valid: false, error: `${source}[${i}] 不是有效对象`, severity: 'warning' };
          }
        }
        return { valid: true, error: null, severity: null };
      }
      return { valid: false, error: `${source} 不是对象或数组`, severity: 'critical' };
    }

    // 检查模式文件结构
    if (source === 'patternFile' || source === 'pattern') {
      if (!Array.isArray(data.patterns)) {
        return { valid: false, error: 'patternFile.patterns 缺少或不是数组', severity: 'warning' };
      }
      // 检查每条模式的必要字段
      for (let i = 0; i < data.patterns.length; i++) {
        const p = data.patterns[i];
        if (!p.key || typeof p.key !== 'string') {
          return { valid: false, error: `patterns[${i}] 缺少 key 字段`, severity: 'warning' };
        }
        if (p.occurrence !== undefined && typeof p.occurrence !== 'number') {
          return { valid: false, error: `patterns[${i}].occurrence 类型错误`, severity: 'warning' };
        }
      }
    }

    return { valid: true, error: null, severity: null };
  }

  /**
   * 自修复损坏的模式文件
   * @param {string} source - 损坏的数据源
   * @returns {Object} 修复后的默认数据
   */
  selfHealCorruptedFile(source) {
    const healAction = SelfHealAction.FALLBACK_TO_DEFAULTS;
    // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] Self-healing ${source} via ${healAction}`);

    // 尝试从备份恢复
    try {
      const backupFile = this.patternFile + '.bak';
      if (fs.existsSync(backupFile)) {
        const backupContent = fs.readFileSync(backupFile, 'utf8');
        const backupData = JSON.parse(backupContent);
        const validation = this.validateReportIntegrity(backupData, 'backup');
        if (validation.valid) {
          // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] Recovered ${source} from backup`);
          return backupData;
        }
      }
    } catch (e) {
      // 备份不可用，继续默认值
    }

    // 创建备份并重建
    try {
      if (fs.existsSync(this.patternFile)) {
        // 保留原始文件作为 .corrupted 备份
        const corruptedPath = this.patternFile + '.corrupted';
        fs.renameSync(this.patternFile, corruptedPath);
        // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] Moved corrupted ${source} to ${corruptedPath}`);
      }
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] Failed to backup corrupted file:`, e.message);
    }

    return { patterns: [], lastUpdate: null };
  }

  /**
   * 修复部分损坏的模式数据
   * @param {Object} partialData - 部分损坏的数据
   * @returns {Object} 修复后的数据
   */
  repairPartialPatterns(partialData) {
    const repaired = { patterns: [], lastUpdate: partialData.lastUpdate || null };

    if (Array.isArray(partialData.patterns)) {
      for (const p of partialData.patterns) {
        if (p && typeof p === 'object' && p.key) {
          repaired.patterns.push({
            key: p.key,
            skill_area: p.skill_area || 'unknown',
            occurrence: typeof p.occurrence === 'number' ? p.occurrence : 1,
            firstSeen: p.firstSeen || new Date().toISOString(),
            lastSeen: p.lastSeen || new Date().toISOString(),
            // 新增：振荡状态追踪
            oscillation: p.oscillation || PatternOscillation.NONE,
            oscillationCount: typeof p.oscillationCount === 'number' ? p.oscillationCount : 0,
            // 新增：修复标记
            repaired: true
          });
        }
      }
    }

    // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] Repaired patterns: ${repaired.patterns.length} valid entries`);
    return repaired;
  }

  async savePatterns() {
    const saveWithRetry = async (attempt = 0) => {
      try {
        // 确保目录存在
        const dir = path.dirname(this.patternFile);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // 先写备份
        const backupContent = JSON.stringify(this.patterns, null, 2);
        try {
          if (fs.existsSync(this.patternFile)) {
            fs.writeFileSync(this.patternFile + '.bak', backupContent);
          }
        } catch (e) {
          // 备份失败不影响主写入
        }
        await atomicWrite(this.patternFile, backupContent);
        return true;
      } catch (e) {
        if (attempt < RETRY_CONFIG.MAX_RETRIES) {
          const delay = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt);
          // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] savePatterns attempt ${attempt + 1} failed, retrying in ${delay}ms:`, e.message);
          await new Promise(r => setTimeout(r, delay));
          return saveWithRetry(attempt + 1);
        }
        // [PROD] 生产环境移除 console.error: console.error(`[ExperienceReplay] savePatterns failed after ${RETRY_CONFIG.MAX_RETRIES} retries:`, e.message);
        return false;
      }
    };

    await saveWithRetry();
  }

  initializeKnownPatterns() {
    return {
      negative_emotion: {
        trigger: ['沮丧', '挫败', '失望', '泄气', 'frustrated', 'sad'],
        skill_area: 'emotion-regulation',
        suggestion: '当检测到用户负面情绪时，增加共情语句使用频率',
        priority: 'high'
      },
      frequent_interrupt: {
        trigger: ['中断', '打断', '离开', 'interrupt', 'leave'],
        skill_area: 'interrupt-handler',
        suggestion: '优化上下文恢复逻辑，减少重复询问',
        priority: 'high'
      },
      unclear_task: {
        trigger: ['模糊', '不确定', '怎么', '如何', 'unclear', 'how'],
        skill_area: 'task-decomposition',
        suggestion: '当任务不明确时，主动进行澄清和分解',
        priority: 'medium'
      },
      flow_block: {
        trigger: ['无法进入', '分心', '效率低', 'cannot focus', 'distracted'],
        skill_area: 'flow引导',
        suggestion: '简化任务步骤，降低认知负荷',
        priority: 'medium'
      }
    };
  }

  /**
   * 从经验更新技能
   */
  updateSkillFromExperience() {
    const reports = this.loadReports();

    if (reports.length === 0) {
      return {
        success: false,
        reason: 'no_reports',
        message: '暂无反思报告可分析'
      };
    }

    const latestReport = reports[reports.length - 1];

    // 验证最新报告的完整性
    const reportValidation = this.validateReportIntegrity(latestReport, 'report');
    if (!reportValidation.valid) {
      if (reportValidation.severity === 'critical') {
        return {
          success: false,
          reason: 'corrupted_report',
          message: `最新报告损坏: ${reportValidation.error}`
        };
      }
      // 轻度问题：修复并继续
      if (!latestReport.improvements) latestReport.improvements = [];
    }

    // 震荡检测：检查最近N个报告中模式是否在反复切换
    const oscillationResult = this.detectOscillation(reports);
    if (oscillationResult.type !== PatternOscillation.NONE) {
      // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] Oscillation detected: ${oscillationResult.type}, dampening pattern activation`);
    }

    const patterns = this.identifyPatterns(latestReport);

    // 震荡场景下减少模式生成
    const effectivePatterns = oscillationResult.type === PatternOscillation.HARD
      ? this.dampenOscillatingPatterns(patterns, oscillationResult)
      : patterns;

    if (effectivePatterns.length === 0) {
      return {
        success: true,
        message: '未发现需要修改的问题模式',
        patterns: []
      };
    }

    const suggestions = this.generateSkillSuggestions(effectivePatterns);

    this.saveSuggestions(suggestions);
    this.updateExperiencePatterns(effectivePatterns);

    return {
      success: true,
      patterns: effectivePatterns,
      suggestions: suggestions,
      message: `发现 ${effectivePatterns.length} 个可改进模式${patterns.length !== effectivePatterns.length ? `（震荡抑制 ${patterns.length - effectivePatterns.length} 个）` : ''}，已生成技能修改建议`
    };
  }

  /**
   * 检测模式震荡
   * 分析最近N个报告中相同模式是否在反复出现/消失
   * @param {Array} reports - 报告列表
   * @returns {{ type: string, oscillatingPatterns: string[], stateSequence: string[] }}
   */
  detectOscillation(reports) {
    const window = reports.slice(-OSCILLATION_CONFIG.WINDOW_SIZE);
    if (window.length < 4) {
      return { type: PatternOscillation.NONE, oscillatingPatterns: [], stateSequence: [] };
    }

    const oscillatingPatterns = [];
    const patternStates = {};

    // 对每个已知模式，追踪其在最近报告中的存在状态
    for (const [patternKey] of Object.entries(this.knownPatterns)) {
      const stateSequence = [];

      for (const report of window) {
        const improvements = report.improvements || [];
        const area = improvements.some(imp => {
          const areaStr = (imp.area || '').toLowerCase();
          const sugStr = (imp.suggestion || '').toLowerCase();
          return areaStr.includes(patternKey) || sugStr.includes(patternKey);
        });
        stateSequence.push(area ? 1 : 0);
      }

      // 计算状态切换次数
      let transitions = 0;
      for (let i = 1; i < stateSequence.length; i++) {
        if (stateSequence[i] !== stateSequence[i - 1]) {
          transitions++;
        }
      }

      if (transitions >= OSCILLATION_CONFIG.HARD_THRESHOLD) {
        patternStates[patternKey] = { transitions, type: PatternOscillation.HARD, stateSequence };
        oscillatingPatterns.push(patternKey);
      } else if (transitions >= OSCILLATION_CONFIG.SOFT_THRESHOLD) {
        patternStates[patternKey] = { transitions, type: PatternOscillation.SOFT, stateSequence };
        oscillatingPatterns.push(patternKey);
      }
    }

    if (oscillatingPatterns.length === 0) {
      return { type: PatternOscillation.NONE, oscillatingPatterns: [], stateSequence: [] };
    }

    // 确定整体震荡类型
    const hasHard = Object.values(patternStates).some(s => s.type === PatternOscillation.HARD);
    const overallType = hasHard ? PatternOscillation.HARD : PatternOscillation.SOFT;

    // 更新缓存
    this._oscillationCache = {
      type: overallType,
      oscillatingPatterns,
      detectedAt: new Date().toISOString(),
      patternStates
    };

    return {
      type: overallType,
      oscillatingPatterns,
      stateSequence: oscillatingPatterns.map(k => patternStates[k].stateSequence)
    };
  }

  /**
   * 震荡抑制：对震荡模式降权或过滤
   * @param {Array} patterns - 检测到的模式
   * @param {Object} oscillationResult - 震荡检测结果
   * @returns {Array} 抑制后的模式列表
   */
  dampenOscillatingPatterns(patterns, oscillationResult) {
    return patterns.filter(p => {
      if (oscillationResult.oscillatingPatterns.includes(p.key)) {
        // 检查历史：如果这个模式已经被检测到多次震荡，完全抑制
        const existing = this.patterns.patterns?.find(ex => ex.key === p.key);
        if (existing && existing.oscillationCount >= 2) {
          // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] Suppressing oscillating pattern: ${p.key} (count: ${existing.oscillationCount})`);
          return false;
        }
        // 首次震荡：降低优先级
        p.priority = p.priority === 'high' ? 'medium' : 'low';
        p.dampened = true;
        return true;
      }
      return true;
    });
  }

  /**
   * 模式衰减：根据最后出现时间降低优先级
   * 超过半衰期未出现的模式，occurrence 减半
   */
  agePatterns() {
    if (!this.patterns.patterns || this.patterns.patterns.length === 0) return;

    const now = Date.now();
    const halfLifeMs = OSCILLATION_CONFIG.DECAY_HALF_LIFE * 24 * 60 * 60 * 1000;
    let agedCount = 0;

    for (const pattern of this.patterns.patterns) {
      if (!pattern.lastSeen) continue;
      const lastSeen = new Date(pattern.lastSeen).getTime();
      const elapsed = now - lastSeen;

      if (elapsed > halfLifeMs) {
        // 超过半衰期：occurrence 减半
        const decayCycles = Math.floor(elapsed / halfLifeMs);
        for (let i = 0; i < decayCycles; i++) {
          pattern.occurrence = Math.max(1, Math.floor(pattern.occurrence / 2));
        }
        agedCount++;
      }
    }

    if (agedCount > 0) {
      // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] Aged ${agedCount} patterns (half-life: ${OSCILLATION_CONFIG.DECAY_HALF_LIFE}d)`);
      this.patterns.lastUpdate = new Date().toISOString();
      this.savePatterns();
    }
  }

  /**
   * 自诊断：检查系统内部一致性
   * @returns {Object} 诊断报告
   */
  selfDiagnostic() {
    this._diagnosticCount++;
    const issues = [];
    const warnings = [];

    // 1. 检查模式文件完整性
    const patternRaw = this.readFileWithIntegrityCheck(this.patternFile);
    if (patternRaw === null) {
      warnings.push({ component: 'patternFile', issue: '文件不可读或为空', severity: 'warning' });
    } else {
      try {
        const parsed = JSON.parse(patternRaw);
        const validation = this.validateReportIntegrity(parsed, 'pattern');
        if (!validation.valid) {
          issues.push({ component: 'patternFile', issue: validation.error, severity: validation.severity });
        }
      } catch (e) {
        issues.push({ component: 'patternFile', issue: `JSON解析失败: ${e.message}`, severity: 'critical' });
      }
    }

    // 2. 检查建议文件完整性
    const suggestionRaw = this.readFileWithIntegrityCheck(this.suggestionFile);
    if (suggestionRaw === null) {
      warnings.push({ component: 'suggestionFile', issue: '文件不可读或为空', severity: 'info' });
    }

    // 3. 检查震荡缓存
    if (this._oscillationCache.type && this._oscillationCache.type !== PatternOscillation.NONE) {
      warnings.push({
        component: 'oscillationDetector',
        issue: `检测到模式震荡: ${this._oscillationCache.type}`,
        severity: this._oscillationCache.type === PatternOscillation.HARD ? 'warning' : 'info',
        details: this._oscillationCache
      });
    }

    // 4. 检查模式计数异常
    if (this.patterns.patterns) {
      for (const p of this.patterns.patterns) {
        if (p.occurrence > 100) {
          warnings.push({
            component: 'patternCounter',
            issue: `模式 "${p.key}" 出现次数异常高 (${p.occurrence})，可能计数溢出`,
            severity: 'warning'
          });
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      diagnosticCount: this._diagnosticCount,
      healthy: issues.length === 0,
      issues,
      warnings,
      patternCount: this.patterns.patterns?.length || 0,
      oscillationStatus: this._oscillationCache.type || PatternOscillation.NONE
    };
  }

  /**
   * 加载报告
   * 含重试机制和数据完整性校验
   */
  loadReports() {
    const loadWithFallback = (attempt = 0) => {
      try {
        const raw = this.readFileWithIntegrityCheck(this.reportFile);
        if (raw === null) return [];

        const reports = JSON.parse(raw);

        // 验证报告数组结构
        if (!Array.isArray(reports)) {
          // [PROD] 生产环境移除 console.warn: console.warn('[ExperienceReplay] loadReports: 报告文件顶层不是数组，尝试修复');
          // 尝试将单个报告包装为数组
          if (reports && typeof reports === 'object') {
            return [reports];
          }
          return [];
        }

        return reports;
      } catch (e) {
        if (attempt < RETRY_CONFIG.MAX_RETRIES) {
          const delay = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt);
          // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] loadReports attempt ${attempt + 1} failed, retrying in ${delay}ms:`, e.message);
          return loadWithFallback(attempt + 1);
        }
        // [PROD] 生产环境移除 console.error: console.error('[ExperienceReplay] loadReports failed after retries:', e.message);
        return [];
      }
    };

    return loadWithFallback();
  }

  /**
   * 识别问题模式
   */
  identifyPatterns(report) {
    const foundPatterns = [];

    const improvements = report.improvements || [];

    for (const [patternKey, patternDef] of Object.entries(this.knownPatterns)) {
      for (const improvement of improvements) {
        const area = improvement.area?.toLowerCase() || '';
        const suggestion = improvement.suggestion?.toLowerCase() || '';

        const matchesTrigger = patternDef.trigger.some(t =>
          area.includes(t) || suggestion.includes(t)
        );

        if (matchesTrigger) {
          // 检查是否已存在相同模式（避免重复）
          const existing = foundPatterns.find(p => p.key === patternKey);
          if (existing) {
            existing.occurrence = (existing.occurrence || 1) + 1;
            continue;
          }

          foundPatterns.push({
            key: patternKey,
            ...patternDef,
            source_improvement: improvement,
            occurrence: 1,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    for (const pattern of foundPatterns) {
      const existing = this.patterns.patterns?.find(p => p.key === pattern.key);
      if (existing) {
        pattern.occurrence = (existing.occurrence || 0) + 1;
        // 检查振荡状态
        if (existing.oscillation && existing.oscillation !== PatternOscillation.NONE) {
          pattern.oscillation = existing.oscillation;
        }
      }
    }

    return foundPatterns;
  }

  /**
   * 生成技能修改建议
   */
  generateSkillSuggestions(patterns) {
    const suggestions = [];
    const { randomBytes } = require('crypto');

    for (const pattern of patterns) {
      // 生成唯一建议ID
      const suggestionId = `suggestion-${Date.now()}-${randomBytes(4).toString('hex')}`;
      const suggestion = {
        suggestionId,
        pattern: pattern.key,
        skill_area: pattern.skill_area,
        current_issue: pattern.suggestion,
        proposed_change: this.generateProposedChange(pattern),
        priority: pattern.priority,
        timestamp: new Date().toISOString(),
        // 新增：震荡信息（如果有）
        oscillation: pattern.oscillation || PatternOscillation.NONE,
        dampened: pattern.dampened || false
      };

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  /**
   * 生成具体的修改方案
   */
  generateProposedChange(pattern) {
    const changeTemplates = {
      'emotion-regulation': {
        file: '.opencode/skills/emotion-regulation/SKILL.md',
        changes: [
          '当用户输入包含负面情绪关键词时，在响应开始处增加共情语句',
          '示例: "我能感受到你的沮丧，让我们一起看看..."',
          '增加情绪检测的敏感度'
        ]
      },
      'interrupt-handler': {
        file: '.opencode/skills/interrupt-handler/SKILL.md',
        changes: [
          '优化上下文恢复逻辑',
          '用户返回后，先用一句话概括之前的对话内容',
          '减少"我们刚才说到哪里了"这类重复询问'
        ]
      },
      'task-decomposition': {
        file: '.opencode/skills/task-decomposition/SKILL.md',
        changes: [
          '当检测到任务模糊时，主动询问澄清问题',
          '使用"你是指...吗?"句式确认需求',
          '将大任务分解为3-5个子步骤'
        ]
      },
      'flow引导': {
        file: '.opencode/skills/flow引导/SKILL.md',
        changes: [
          '降低任务复杂度，减少步骤数',
          '增加即时反馈频率',
          '在用户完成每个子任务后给予鼓励'
        ]
      }
    };

    return changeTemplates[pattern.skill_area] || {
      file: '未知',
      changes: ['需要人工审查确定修改方案']
    };
  }

  /**
   * 保存建议
   * 含重试机制
   */
  async saveSuggestions(suggestions) {
    const saveWithRetry = async (attempt = 0) => {
      try {
        let allSuggestions = [];
        const raw = this.readFileWithIntegrityCheck(this.suggestionFile);
        if (raw !== null) {
          try {
            allSuggestions = JSON.parse(raw);
            if (!Array.isArray(allSuggestions)) {
              // [PROD] 生产环境移除 console.warn: console.warn('[ExperienceReplay] saveSuggestions: 建议文件不是数组，重建');
              allSuggestions = [];
            }
          } catch (e) {
            // [PROD] 生产环境移除 console.warn: console.warn('[ExperienceReplay] saveSuggestions: 建议文件损坏，重建');
            // 保留损坏文件作为备份
            try {
              fs.renameSync(this.suggestionFile, this.suggestionFile + '.corrupted');
            } catch (renameErr) {
              // 忽略重命名失败
            }
            allSuggestions = [];
          }
        }

        allSuggestions.push(...suggestions);
        if (allSuggestions.length > 100) {
          allSuggestions = allSuggestions.slice(-100);
        }

        const dir = path.dirname(this.suggestionFile);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        await atomicWrite(this.suggestionFile, JSON.stringify(allSuggestions, null, 2));
        return true;
      } catch (e) {
        if (attempt < RETRY_CONFIG.MAX_RETRIES) {
          const delay = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt);
          // [PROD] 生产环境移除 console.warn: console.warn(`[ExperienceReplay] saveSuggestions attempt ${attempt + 1} failed, retrying in ${delay}ms:`, e.message);
          await new Promise(r => setTimeout(r, delay));
          return saveWithRetry(attempt + 1);
        }
        throw new Error(`[ExperienceReplay] saveSuggestions failed after ${RETRY_CONFIG.MAX_RETRIES} retries: ${e.message}`);
      }
    };

    await saveWithRetry();
  }

  /**
   * 更新经验模式
   * 含震荡状态记录
   */
  updateExperiencePatterns(patterns) {
    for (const pattern of patterns) {
      const existing = this.patterns.patterns?.findIndex(p => p.key === pattern.key);

      if (existing >= 0) {
        this.patterns.patterns[existing].occurrence = pattern.occurrence;
        this.patterns.patterns[existing].lastSeen = pattern.timestamp;

        // 更新震荡状态
        if (pattern.oscillation) {
          this.patterns.patterns[existing].oscillation = pattern.oscillation;
          this.patterns.patterns[existing].oscillationCount =
            (this.patterns.patterns[existing].oscillationCount || 0) + 1;
        }
      } else {
        this.patterns.patterns = this.patterns.patterns || [];
        this.patterns.patterns.push({
          key: pattern.key,
          skill_area: pattern.skill_area,
          occurrence: pattern.occurrence,
          firstSeen: pattern.timestamp,
          lastSeen: pattern.timestamp,
          oscillation: pattern.oscillation || PatternOscillation.NONE,
          oscillationCount: pattern.oscillation ? 1 : 0
        });
      }
    }

    this.patterns.lastUpdate = new Date().toISOString();
    this.savePatterns();

    // 每次更新后执行模式衰减
    this.agePatterns();
  }

  /**
   * 打印建议
   */
  printSuggestions(result) {
    return;
  }

  /**
   * 运行完整流程
   */
  run() {
    const result = this.updateSkillFromExperience();
    this.printSuggestions(result);
    return result;
  }

  /**
   * 获取历史建议
   */
  getHistory() {
    try {
      const raw = this.readFileWithIntegrityCheck(this.suggestionFile);
      if (raw === null) return [];
      return JSON.parse(raw);
    } catch (e) {
      // [PROD] 生产环境移除 console.warn: console.warn('[ExperienceReplay] getHistory failed:', e.message);
      return [];
    }
  }

  /**
   * 获取已知模式
   */
  getPatterns() {
    return this.patterns;
  }
}

/**
 * CLI 入口
 */
if (require.main === module) {
  const replay = new ExperienceReplay(process.cwd());
  replay.run();
}

module.exports = {
  ExperienceReplay,
  DataIntegrityError,
  SelfHealAction,
  PatternOscillation,
  RETRY_CONFIG,
  OSCILLATION_CONFIG
};
