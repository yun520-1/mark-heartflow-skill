/**
 * HeartFlow Skill Generator v11.7.1
 * 
 * 整合:
 *   - AutoSkill Framework (模式→技能自动生成)
 *   - 从成功/失败经验中提取模式
 *   - Darwin-Godel-Machine 的自我修改逻辑
 * 
 * 核心功能:
 *   1. 模式识别 - 从对话中发现可复用的模式
 *   2. 技能生成 - 将模式转化为标准化技能
 *   3. 技能进化 - 基于反馈改进现有技能
 */

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '../../../skills');
const PATTERN_FILE = path.join(__dirname, '../../data/skill-gen/patterns.json');
const GENERATED_FILE = path.join(__dirname, '../../data/skill-gen/generated.json');
const CANDIDATES_FILE = path.join(__dirname, '../../data/skill-gen/candidates.json');

class SkillGenerator {
  constructor(options = {}) {
    this.minOccurrence = options.minOccurrence || 3;  // 最小出现次数
    this.confidenceThreshold = options.confidenceThreshold || 0.6; // 置信度阈值
    this.autoApproveThreshold = options.autoApproveThreshold || 0.85; // 自动批准阈值
    
    // 技能候选队列
    this.candidates = [];
    this.generated = [];
    this.patterns = {};
    
    this._loadMemory();
  }

  // ============================================================
  // 模式识别: 从经验中发现可复用模式
  // ============================================================

  /**
   * 分析经验，发现模式
   * 整合 claude-reflect-system 的模式提取
   */
  discoverPatterns(experiences = []) {
    if (experiences.length < this.minOccurrence) {
      return { status: 'insufficient_data', count: experiences.length };
    }

    const patterns = [];
    
    // 1. 输入模式识别
    const inputPatterns = this._findInputPatterns(experiences);
    patterns.push(...inputPatterns);
    
    // 2. 行为模式识别
    const behaviorPatterns = this._findBehaviorPatterns(experiences);
    patterns.push(...behaviorPatterns);
    
    // 3. 响应模式识别
    const responsePatterns = this._findResponsePatterns(experiences);
    patterns.push(...responsePatterns);
    
    // 4. 上下文模式识别
    const contextPatterns = this._findContextPatterns(experiences);
    patterns.push(...contextPatterns);
    
    // 保存发现的模式
    for (const pattern of patterns) {
      this._savePattern(pattern);
    }
    
    this._saveMemory();
    
    return {
      status: 'patterns_found',
      patterns,
      totalPatterns: patterns.length,
      highConfidence: patterns.filter(p => p.confidence >= this.confidenceThreshold),
    };
  }

  _findInputPatterns(experiences) {
    const patterns = [];
    const inputGroups = this._groupByInput(experiences);
    
    for (const [key, group] of Object.entries(inputGroups)) {
      if (group.length >= this.minOccurrence) {
        const successRate = group.filter(e => e.success).length / group.length;
        const avgQuality = this._avgQuality(group);
        
        patterns.push({
          type: 'input',
          trigger: key,
          occurrence: group.length,
          successRate,
          quality: avgQuality,
          confidence: Math.min(0.95, group.length * 0.15),
          examples: group.slice(0, 3).map(e => e.input),
          recommendation: this._generateInputRecommendation(key, group),
        });
      }
    }
    
    return patterns;
  }

  _findBehaviorPatterns(experiences) {
    const patterns = [];
    
    // 寻找连续成功的行动序列
    for (let i = 1; i < experiences.length; i++) {
      const seq = this._getActionSequence(experiences[i - 1], experiences[i]);
      if (seq.success) {
        // 检查这个序列是否多次出现
        const occurrences = experiences.filter((e, j) => {
          if (j < 1) return false;
          const s = this._getActionSequence(experiences[j - 1], e);
          return s.success && this._isSimilar(s.actions, seq.actions);
        });
        
        if (occurrences.length >= this.minOccurrence) {
          patterns.push({
            type: 'behavior',
            trigger: `action_sequence_${seq.actions.join('_')}`,
            occurrence: occurrences.length,
            successRate: 1.0,
            quality: 0.9,
            confidence: Math.min(0.95, occurrences.length * 0.2),
            actions: seq.actions,
            examples: occurrences.slice(0, 2).map(e => e.input),
            recommendation: this._generateBehaviorRecommendation(seq.actions),
          });
        }
      }
    }
    
    return patterns;
  }

  _findResponsePatterns(experiences) {
    const patterns = [];
    const successExp = experiences.filter(e => e.success);
    
    // 分析成功响应特征
    if (successExp.length >= this.minOccurrence) {
      const responseLengths = successExp.map(e => (e.output || '').length);
      const avgLen = responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length;
      
      // 检测响应长度模式
      if (avgLen > 100 && avgLen < 500) {
        patterns.push({
          type: 'response',
          trigger: 'concise_response',
          occurrence: successExp.length,
          successRate: successExp.length / experiences.length,
          quality: 0.8,
          confidence: 0.7,
          metric: { avgLength: Math.round(avgLen) },
          recommendation: '保持响应在100-500字范围内',
        });
      }
      
      // 检测响应结构
      const hasStructure = successExp.filter(e => 
        (e.output || '').includes('\n') || (e.output || '').includes('•') || 
        (e.output || '').includes('1.')
      ).length / successExp.length;
      
      if (hasStructure > 0.6) {
        patterns.push({
          type: 'response',
          trigger: 'structured_response',
          occurrence: successExp.length,
          successRate: hasStructure,
          quality: 0.85,
          confidence: 0.75,
          metric: { structureRate: hasStructure.toFixed(2) },
          recommendation: '使用结构化格式（列表、编号、分段）',
        });
      }
    }
    
    return patterns;
  }

  _findContextPatterns(experiences) {
    const patterns = [];
    const contexts = {};
    
    for (const exp of experiences) {
      const ctx = exp.context?.type || 'general';
      if (!contexts[ctx]) {
        contexts[ctx] = { success: 0, total: 0 };
      }
      contexts[ctx].total++;
      if (exp.success) contexts[ctx].success++;
    }
    
    for (const [ctx, data] of Object.entries(contexts)) {
      if (data.total >= this.minOccurrence) {
        const rate = data.success / data.total;
        if (rate >= 0.7) {
          patterns.push({
            type: 'context',
            trigger: ctx,
            occurrence: data.total,
            successRate: rate,
            quality: rate,
            confidence: Math.min(0.9, data.total * 0.1),
            recommendation: `在此上下文(${ctx})中策略有效`,
          });
        } else if (rate <= 0.3) {
          patterns.push({
            type: 'context',
            trigger: ctx,
            occurrence: data.total,
            successRate: rate,
            quality: 0.3,
            confidence: Math.min(0.9, data.total * 0.1),
            recommendation: `此上下文(${ctx})需要不同策略`,
          });
        }
      }
    }
    
    return patterns;
  }

  // ============================================================
  // 技能生成: 将模式转化为技能
  // ============================================================

  /**
   * 从模式生成技能
   * 整合 AutoSkill 框架
   */
  generateSkill(pattern) {
    if (pattern.confidence < this.confidenceThreshold) {
      return {
        status: 'confidence_too_low',
        confidence: pattern.confidence,
        threshold: this.confidenceThreshold,
      };
    }

    const skill = this._buildSkillFromPattern(pattern);
    
    // 添加到候选队列
    const candidate = {
      id: this._generateId(),
      skill,
      pattern,
      timestamp: Date.now(),
      status: pattern.confidence >= this.autoApproveThreshold ? 'ready' : 'pending',
    };
    
    this.candidates.push(candidate);
    this._saveMemory();
    
    return {
      status: candidate.status === 'ready' ? 'auto_approved' : 'pending_review',
      candidate,
      skill,
    };
  }

  _buildSkillFromPattern(pattern) {
    const skill = {
      name: this._patternToSkillName(pattern),
      version: '1.0.0',
      description: pattern.recommendation,
      trigger: this._extractTriggers(pattern),
      actions: this._generateActions(pattern),
      metadata: {
        patternType: pattern.type,
        confidence: pattern.confidence,
        occurrence: pattern.occurrence,
        successRate: pattern.successRate,
        generated: Date.now(),
      },
    };
    
    // 根据模式类型生成不同的技能结构
    switch (pattern.type) {
      case 'input':
        skill.type = 'handler';
        skill.condition = this._buildInputCondition(pattern);
        skill.response = pattern.recommendation;
        break;
        
      case 'behavior':
        skill.type = 'workflow';
        skill.steps = pattern.actions || [];
        break;
        
      case 'response':
        skill.type = 'formatter';
        skill.format = this._buildFormat(pattern);
        break;
        
      case 'context':
        skill.type = 'context-aware';
        skill.context = pattern.trigger;
        break;
    }
    
    return skill;
  }

  _patternToSkillName(pattern) {
    const prefix = pattern.type.charAt(0).toUpperCase();
    const trigger = (pattern.trigger || 'unnamed')
      .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
      .substring(0, 30);
    return `auto-${prefix}${trigger}`;
  }

  _extractTriggers(pattern) {
    if (pattern.trigger && typeof pattern.trigger === 'string') {
      return pattern.trigger.split(/[,，、]/).map(t => t.trim()).filter(Boolean);
    }
    return [];
  }

  _generateActions(pattern) {
    if (pattern.type === 'behavior' && pattern.actions) {
      return pattern.actions.map((action, i) => ({
        step: i + 1,
        action,
        when: 'always',
      }));
    }
    
    return [
      {
        step: 1,
        action: pattern.recommendation,
        when: 'pattern_match',
      },
    ];
  }

  _buildInputCondition(pattern) {
    return {
      type: 'text_similarity',
      keywords: pattern.examples?.[0]?.split(/\s+/)?.slice(0, 5) || [],
      threshold: 0.3,
    };
  }

  _buildFormat(pattern) {
    if (pattern.metric?.structureRate > 0.6) {
      return {
        useList: true,
        useNumbering: true,
        maxLength: 500,
      };
    }
    return {
      useList: false,
      useNumbering: false,
      maxLength: pattern.metric?.avgLength || 300,
    };
  }

  // ============================================================
  // 技能进化: 基于反馈改进
  // ============================================================

  /**
   * 基于使用反馈进化技能
   * 整合 Darwin-Godel-Machine 的进化逻辑
   */
  evolveSkill(skillId, feedback) {
    const skill = this.generated.find(s => s.id === skillId);
    if (!skill) {
      return { status: 'skill_not_found' };
    }

    const {
      type,      // 'success' | 'failure' | 'partial'
      quality,   // 0-1
      examples,
    } = feedback;

    // 生成修改提案
    const modification = this._proposeModification(skill, feedback);
    
    // 应用修改
    const evolved = this._applyModification(skill, modification);
    
    // 更新统计
    evolved.usageCount = (evolved.usageCount || 0) + 1;
    evolved.lastFeedback = {
      type,
      quality,
      timestamp: Date.now(),
    };
    
    // 如果反馈负面，降低置信度
    if (type === 'failure' || quality < 0.4) {
      evolved.metadata.confidence = Math.max(0.3, evolved.metadata.confidence - 0.15);
    } else if (type === 'success' && quality > 0.8) {
      evolved.metadata.confidence = Math.min(0.98, evolved.metadata.confidence + 0.05);
    }
    
    // 替换旧技能
    const idx = this.generated.findIndex(s => s.id === skillId);
    if (idx >= 0) {
      this.generated[idx] = evolved;
    }
    
    this._saveMemory();
    
    return {
      status: 'evolved',
      skill: evolved,
      modification,
      versionBump: evolved.metadata.version,
    };
  }

  _proposeModification(skill, feedback) {
    const mods = [];
    
    if (feedback.type === 'failure') {
      mods.push({
        field: 'description',
        change: 'add_warning',
        reason: '技能在反馈中出现失败',
      });
      mods.push({
        field: 'metadata.confidence',
        change: 'decrease',
        delta: -0.15,
      });
    }
    
    if (feedback.quality < 0.5) {
      mods.push({
        field: 'response',
        change: 'refine',
        reason: '响应质量低于阈值',
      });
    }
    
    if (feedback.examples?.length > 0) {
      mods.push({
        field: 'examples',
        change: 'add',
        data: feedback.examples,
      });
    }
    
    return {
      id: this._generateId(),
      timestamp: Date.now(),
      skillId: skill.id,
      modifications: mods,
    };
  }

  _applyModification(skill, modification) {
    const evolved = JSON.parse(JSON.stringify(skill));
    
    // 版本升级
    const [major, minor, patch] = evolved.version.split('.').map(Number);
    evolved.metadata = evolved.metadata || {};
    evolved.metadata.version = `${major}.${minor}.${patch + 1}`;
    
    // 应用修改
    for (const mod of modification.modifications) {
      switch (mod.change) {
        case 'decrease':
          if (skill.metadata?.[mod.field]) {
            skill.metadata[mod.field] = Math.max(0.3, skill.metadata[mod.field] + mod.delta);
          }
          break;
        case 'add_warning':
          evolved.description = `[警告] ${evolved.description}`;
          break;
        case 'add':
          if (mod.field === 'examples' && mod.data) {
            evolved.examples = [...(evolved.examples || []), ...mod.data].slice(-5);
          }
          break;
      }
    }
    
    return evolved;
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  _groupByInput(experiences) {
    const groups = {};
    
    for (const exp of experiences) {
      const key = this._normalizeInput(exp.input);
      if (!key) continue;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(exp);
    }
    
    return groups;
  }

  _normalizeInput(input) {
    if (!input) return null;
    // 简化输入作为key
    const normalized = input
      .toLowerCase()
      .replace(/[^a-z\u4e00-\u9fa5]/g, '')
      .substring(0, 50);
    return normalized || null;
  }

  _isSimilar(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.length !== b.length) return false;
    let matches = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] === b[i]) matches++;
    }
    return matches / a.length > 0.7;
  }

  _getActionSequence(exp1, exp2) {
    return {
      success: exp2?.success === true,
      actions: [exp1?.input?.substring(0, 20), exp2?.input?.substring(0, 20)].filter(Boolean),
    };
  }

  _avgQuality(experiences) {
    return experiences.reduce((sum, e) => sum + (e.quality || 0.5), 0) / experiences.length;
  }

  _generateId() {
    return `sg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _generateInputRecommendation(key, group) {
    const successRate = group.filter(e => e.success).length / group.length;
    if (successRate > 0.7) {
      return `这类输入(${key.substring(0, 20)})成功率高，考虑标准化处理流程`;
    }
    return `这类输入(${key.substring(0, 20)})成功率${successRate.toFixed(1)}，需要改进策略`;
  }

  _generateBehaviorRecommendation(actions) {
    return `行动序列 ${actions?.join(' → ')} 表现出高成功率，考虑记录为最佳实践`;
  }

  // ============================================================
  // 持久化
  // ============================================================

  _loadMemory() {
    try {
      const dir = path.dirname(PATTERN_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        return;
      }

      if (fs.existsSync(PATTERN_FILE)) {
        this.patterns = JSON.parse(fs.readFileSync(PATTERN_FILE, 'utf-8'));
      }
      
      if (fs.existsSync(GENERATED_FILE)) {
        this.generated = JSON.parse(fs.readFileSync(GENERATED_FILE, 'utf-8'));
      }
      
      if (fs.existsSync(CANDIDATES_FILE)) {
        this.candidates = JSON.parse(fs.readFileSync(CANDIDATES_FILE, 'utf-8'));
      }
    } catch (e) {
      console.log('[SkillGenerator] Memory load failed:', e.message);
    }
  }

  _savePattern(pattern) {
    const key = `${pattern.type}_${pattern.trigger}`;
    if (!this.patterns[key] || this.patterns[key].confidence < pattern.confidence) {
      this.patterns[key] = pattern;
    }
  }

  _saveMemory() {
    try {
      const dir = path.dirname(PATTERN_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(PATTERN_FILE, JSON.stringify(this.patterns, null, 2));
      fs.writeFileSync(GENERATED_FILE, JSON.stringify(this.generated, null, 2));
      fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(this.candidates, null, 2));
    } catch (e) {
      console.log('[SkillGenerator] Memory save failed:', e.message);
    }
  }

  // ============================================================
  // 统计
  // ============================================================

  stats() {
    return {
      version: '11.7.1',
      patterns: Object.keys(this.patterns).length,
      candidates: this.candidates.length,
      generated: this.generated.length,
      ready: this.candidates.filter(c => c.status === 'ready').length,
    };
  }
}

module.exports = SkillGenerator;
