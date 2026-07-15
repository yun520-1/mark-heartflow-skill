/**
 * EduEngine — 感知情感课程模式 (v1.0.0)
 *
 * 职责：
 * 1. 切换 HeartFlow 到教育模式
 * 2. 根据学段/年级适配输出复杂度
 * 3. 管理课程会话（lesson_id, student_id, class_id）
 * 4. 隐私隔离：教育数据与普通数据分开存储
 */

const fs = require('../utils/safe-fs');
const path = require('path');

class EduEngine {
  constructor(hf) {
    this.hf = hf;
    this.enabled = false;
    this._currentLesson = null;
    this._studentProfile = null;
    this._classId = null;
    this._gradeLevel = null; // 'primary' | 'middle' | 'high' | 'university'
    this._storagePath = null;
  }

  /**
   * 初始化教育模式
   * @param {object} config
   * @param {string} config.classId - 班级ID
   * @param {string} config.studentId - 学生ID（可选，学生端）
   * @param {string} config.gradeLevel - 学段: primary/middle/high/university
   * @param {string} config.storagePath - 教育数据存储路径
   */
  init(config = {}) {
    try {
      this._classId = config.classId || null;
      this._gradeLevel = config.gradeLevel || 'primary';
      this._storagePath = config.storagePath || path.join(this.hf.rootPath, 'data', 'edu');
      
      // 确保存储目录存在
      if (!fs.existsSync(this._storagePath)) {
        fs.mkdirSync(this._storagePath, { recursive: true });
      }
      
      // 初始化学生档案（如果提供 studentId）
      if (config.studentId) {
        this._studentProfile = this._loadOrCreateProfile(config.studentId);
      }
      
      this.enabled = true;
      return { ok: true, mode: 'edu', gradeLevel: this._gradeLevel };
    } catch (e) {
      this.enabled = false;
      return { ok: false, error: e.message };
    }
  }

  /**
   * 进入课程模式
   * @param {string} lessonId - 课时ID，如 "L01"
   * @param {string} lessonName - 课时名称
   */
  enterLesson(lessonId, lessonName = '') {
    this._currentLesson = {
      id: lessonId,
      name: lessonName,
      startedAt: new Date().toISOString(),
    };
    return { ok: true, lesson: this._currentLesson };
  }

  /**
   * 退出课程模式
   */
  exitLesson() {
    if (!this._currentLesson) return { ok: true };
    
    const lesson = this._currentLesson;
    this._currentLesson = null;
    
    // 生成课后报告
    const report = this._generateLessonReport(lesson);
    this._saveReport(report);
    
    return { ok: true, report };
  }

  /**
   * 处理学生输入（教育模式简化版）
   * @param {string} input - 学生输入
   * @param {object} options
   * @returns {object} 教育模式输出
   */
  async processInput(input, options = {}) {
    if (!this.enabled) {
      return { ok: false, error: 'EduEngine not initialized' };
    }

    const result = {
      ok: true,
      lessonId: this._currentLesson?.id,
      studentId: this._studentProfile?.id,
      timestamp: new Date().toISOString(),
    };

    // 根据学段选择处理方式
    switch (this._gradeLevel) {
      case 'primary':
        result.analysis = this._processPrimary(input, options);
        break;
      case 'middle':
        result.analysis = await this._processMiddle(input, options);
        break;
      case 'high':
        result.analysis = await this._processHigh(input, options);
        break;
      case 'university':
        result.analysis = await this._processUniversity(input, options);
        break;
      default:
        result.analysis = this._processPrimary(input, options);
    }

    // 记录到学生档案
    if (this._studentProfile) {
      this._appendToProfile(result);
    }

    return result;
  }

  /**
   * 小学：简化情绪检测（4种基本情绪 + 身体信号）
   * @private
   */
  _processPrimary(input, options) {
    // 使用本地 PsychologyEngine，简化输出
    const psych = this.hf.psychology.analyzePsychology(input);
    const emotion = psych.emotion || {};
    
    // 映射到 4 种基本情绪
    const basicEmotions = ['开心', '难过', '生气', '害怕'];
    const primaryEmotion = this._mapToBasicEmotion(psych);
    const intensity = Math.round((emotion.intensity || 0) * 10); // 0-10 刻度
    
    return {
      type: 'basic_emotion',
      emotion: primaryEmotion,
      intensity,
      bodySignals: this._extractBodySignals(input),
      vocabulary: this._extractEmotionWords(input),
      suggestion: this._getPrimarySuggestion(primaryEmotion, intensity),
    };
  }

  /**
   * 初中：触发链 + 模式识别
   * @private
   */
  async _processMiddle(input, options) {
    // 本地：触发链提取
    const triggerChain = this._extractTriggerChain(input);
    
    // LLM：深层分析（需求、防御）
    let deepAnalysis = null;
    if (this.hf.llmOrchestrator?.enabled) {
      deepAnalysis = await this.hf.semanticExpand(input, {
        emotion: { emotionZh: triggerChain.emotion },
        history: this._getRecentHistory(3),
      });
    }

    return {
      type: 'trigger_chain',
      chain: triggerChain,
      deepAnalysis: deepAnalysis?._meta?.method === 'llm' ? deepAnalysis : null,
      suggestion: this._getMiddleSuggestion(triggerChain),
    };
  }

  /**
   * 高中：认知模式 + 家族系统
   * @private
   */
  async _processHigh(input, options) {
    const triggerChain = this._extractTriggerChain(input);
    
    let deepAnalysis = null;
    if (this.hf.llmOrchestrator?.enabled) {
      deepAnalysis = await this.hf.semanticExpand(input, {
        emotion: { emotionZh: triggerChain.emotion },
        history: this._getRecentHistory(5),
        awakening: { score: triggerChain.awakeningScore || 0 },
      });
    }

    return {
      type: 'deep_cognition',
      chain: triggerChain,
      deepAnalysis: deepAnalysis?._meta?.method === 'llm' ? deepAnalysis : null,
      familyPatterns: this._detectFamilyPatterns(input),
      suggestion: this._getHighSuggestion(deepAnalysis),
    };
  }

  /**
   * 大学：存在整合 + 全档案分析
   * @private
   */
  async _processUniversity(input, options) {
    const fullHistory = this._getFullHistory();
    const triggerChain = this._extractTriggerChain(input);
    
    let deepAnalysis = null;
    if (this.hf.llmOrchestrator?.enabled) {
      deepAnalysis = await this.hf.semanticExpand(input, {
        emotion: { emotionZh: triggerChain.emotion },
        history: fullHistory.slice(-10),
        awakening: { score: triggerChain.awakeningScore || 0 },
      });
    }

    return {
      type: 'existential_analysis',
      chain: triggerChain,
      deepAnalysis: deepAnalysis?._meta?.method === 'llm' ? deepAnalysis : null,
      lifeThemes: this._extractLifeThemes(fullHistory),
      suggestion: this._getUniversitySuggestion(deepAnalysis),
    };
  }

  /**
   * 班级统计（教师端）
   * @param {string} lessonId
   * @returns {object} 匿名班级统计
   */
  getClassStatistics(lessonId) {
    if (!this._classId) {
      return { ok: false, error: 'No class context' };
    }

    const classDir = path.join(this._storagePath, 'classes', this._classId);
    if (!fs.existsSync(classDir)) {
      return { ok: true, data: { total: 0, records: [] } };
    }

    // 聚合所有学生的匿名数据
    const studentDirs = fs.readdirSync(classDir).filter(f => f.startsWith('stu_'));
    const allRecords = [];
    
    for (const stuDir of studentDirs) {
      const profilePath = path.join(classDir, stuDir, 'profile.json');
      if (fs.existsSync(profilePath)) {
        const profile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
        // 只聚合匿名数据
        if (profile.records && profile.records.length > 0) {
          const lastRecord = profile.records[profile.records.length - 1];
          allRecords.push({
            emotion: lastRecord.analysis?.emotion || 'unknown',
            intensity: lastRecord.analysis?.intensity || 0,
            type: lastRecord.analysis?.type || 'unknown',
          });
        }
      }
    }

    // 计算统计
    const stats = this._computeClassStats(allRecords);
    
    return {
      ok: true,
      classId: this._classId,
      lessonId,
      totalStudents: studentDirs.length,
      recordsCount: allRecords.length,
      statistics: stats,
    };
  }

  /**
   * 获取学生个人报告
   * @param {string} studentId
   * @returns {object}
   */
  getStudentReport(studentId) {
    const profile = this._loadOrCreateProfile(studentId);
    
    if (!profile.records || profile.records.length === 0) {
      return {
        ok: true,
        studentId,
        message: '还没有记录，开始第一次心虫对话吧！',
        data: null,
      };
    }

    // 生成个人报告
    const recentRecords = profile.records.slice(-10);
    const emotionTrend = this._computeEmotionTrend(recentRecords);
    const vocabularyGrowth = this._computeVocabularyGrowth(profile.records);
    
    return {
      ok: true,
      studentId,
      totalRecords: profile.records.length,
      emotionTrend,
      vocabularyGrowth,
      recentEmotions: recentRecords.slice(-5).map(r => r.analysis?.emotion),
      suggestion: this._getPersonalSuggestion(profile),
    };
  }

  // ─── 私有方法 ─────────────────────────────────────────

  _loadOrCreateProfile(studentId) {
    const profileDir = path.join(this._storagePath, 'classes', this._classId || 'default');
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }
    
    const profilePath = path.join(profileDir, `${studentId}.json`);
    if (fs.existsSync(profilePath)) {
      return JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
    }
    
    // 创建新档案
    const profile = {
      id: studentId,
      classId: this._classId,
      gradeLevel: this._gradeLevel,
      createdAt: new Date().toISOString(),
      records: [],
      vocabulary: [],
      emotionHistory: [],
    };
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2), 'utf-8');
    return profile;
  }

  _appendToProfile(result) {
    if (!this._studentProfile) return;
    
    this._studentProfile.records.push(result);
    this._studentProfile.emotionHistory.push({
      timestamp: result.timestamp,
      emotion: result.analysis?.emotion,
      intensity: result.analysis?.intensity,
    });
    
    // 更新词汇
    if (result.analysis?.vocabulary) {
      for (const word of result.analysis.vocabulary) {
        if (!this._studentProfile.vocabulary.includes(word)) {
          this._studentProfile.vocabulary.push(word);
        }
      }
    }
    
    // 持久化
    const profilePath = path.join(this._storagePath, 'classes', this._classId || 'default', `${this._studentProfile.id}.json`);
    fs.writeFileSync(profilePath, JSON.stringify(this._studentProfile, null, 2), 'utf-8');
  }

  _saveReport(report) {
    const reportsDir = path.join(this._storagePath, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const reportPath = path.join(reportsDir, `${report.lessonId}_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  }

  _mapToBasicEmotion(psych) {
    // 简化 PAD 到 4 种基本情绪
    const emotion = psych.emotion || {};
    const p = emotion.pleasure || 0;
    const a = emotion.arousal || 0;
    
    if (p > 0.3 && a > 0.3) return '开心';
    if (p < -0.3 && a > 0.3) return '生气';
    if (p < -0.3 && a < -0.3) return '难过';
    if (p < 0 && a > 0.5) return '害怕';
    return '平静';
  }

  _extractBodySignals(input) {
    // 简单的身体信号关键词检测
    const bodyMap = {
      '手': '手部',
      '心跳': '心脏',
      '胸口': '胸口',
      '肚子': '腹部',
      '肩膀': '肩膀',
      '喉咙': '喉咙',
      '头': '头部',
      '腿': '腿部',
    };
    
    const signals = [];
    for (const [keyword, part] of Object.entries(bodyMap)) {
      if (input.includes(keyword)) {
        signals.push({ part, keyword });
      }
    }
    return signals;
  }

  _extractEmotionWords(input) {
    // 提取情绪相关词汇
    const emotionWords = [
      '开心', '难过', '生气', '害怕', '紧张', '兴奋', '平静',
      'happy', 'sad', 'angry', 'scared', 'nervous', 'excited', 'calm'
    ];
    return emotionWords.filter(w => input.toLowerCase().includes(w.toLowerCase()));
  }

  _extractTriggerChain(input) {
    // 简化版触发链：基于规则提取
    const segments = input.split(/[，。！？；\n]+/).filter(s => s.trim());
    
    return {
      event: segments[0] || input.slice(0, 20),
      thought: segments[1] || '未明确',
      emotion: this._mapToBasicEmotion(this.hf.psychology.analyzePsychology(input)),
      behavior: segments[segments.length - 1] || '未明确',
      links: segments.slice(0, 4),
    };
  }

  _getRecentHistory(n) {
    if (!this._studentProfile?.emotionHistory) return [];
    return this._studentProfile.emotionHistory.slice(-n).map(e => e.emotion);
  }

  _getFullHistory() {
    if (!this._studentProfile?.emotionHistory) return [];
    return this._studentProfile.emotionHistory.map(e => e.emotion);
  }

  _detectFamilyPatterns(input) {
    // 家族模式关键词检测
    const familyKeywords = ['妈妈', '爸爸', '爷爷', '奶奶', '家里', '家庭', '父母'];
    const mentioned = familyKeywords.filter(k => input.includes(k));
    if (mentioned.length === 0) return null;
    
    return {
      mentioned,
      patternType: 'family_related',
      suggestion: '检测到与家庭相关的内容，建议进一步探索家庭情绪模式。',
    };
  }

  _extractLifeThemes(history) {
    // 从全历史中提取高频情绪主题
    const emotionCounts = {};
    for (const e of history) {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    }
    return Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));
  }

  _computeClassStats(records) {
    const emotionCounts = {};
    let totalIntensity = 0;
    
    for (const r of records) {
      emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
      totalIntensity += r.intensity || 0;
    }
    
    return {
      emotionDistribution: emotionCounts,
      averageIntensity: records.length > 0 ? totalIntensity / records.length : 0,
      totalRecords: records.length,
    };
  }

  _computeEmotionTrend(records) {
    return records.slice(-7).map(r => ({
      date: r.timestamp?.split('T')[0] || 'unknown',
      emotion: r.analysis?.emotion,
      intensity: r.analysis?.intensity,
    }));
  }

  _computeVocabularyGrowth(records) {
    return {
      totalWords: records.length,
      uniqueWords: new Set(records.flatMap(r => r.analysis?.vocabulary || [])).size,
    };
  }

  _generateLessonReport(lesson) {
    return {
      lessonId: lesson.id,
      lessonName: lesson.name,
      startedAt: lesson.startedAt,
      endedAt: new Date().toISOString(),
      studentId: this._studentProfile?.id,
      classId: this._classId,
      recordsInLesson: this._studentProfile?.records?.filter(
        r => r.timestamp >= lesson.startedAt
      ).length || 0,
    };
  }

  _getPrimarySuggestion(emotion, intensity) {
    const suggestions = {
      '开心': '保持这份好心情，和身边的人分享！',
      '难过': '难过是正常的。试试和信任的人说说，或者画出来。',
      '生气': '生气时，试试深呼吸——吸气 4 秒，屏住 4 秒，呼气 6 秒。',
      '害怕': '害怕时，告诉自己：我现在是安全的。试试把脚平放在地上。',
      '平静': '平静是一种很好的状态。享受它。',
    };
    return suggestions[emotion] || '关注你的身体感受，它在告诉你一些事情。';
  }

  _getMiddleSuggestion(chain) {
    if (!chain) return '继续探索你的情绪链条。';
    return `你的情绪链条是：${chain.links?.join(' → ') || '待完善'}。注意"想法"环节——它常常是改变情绪的关键。`;
  }

  _getHighSuggestion(analysis) {
    if (!analysis) return '继续观察你的思维模式。';
    return '你的思维模式正在被看见。下一步：尝试用证据检验法挑战那些自动化的想法。';
  }

  _getUniversitySuggestion(analysis) {
    if (!analysis) return '继续探索你的存在模式。';
    return '你正在整合16年的情感数据。下一步：选择你想要保留的模式，选择你想要改变的模式。';
  }

  getStats() {
    return {
      enabled: this.enabled,
      gradeLevel: this._gradeLevel,
      classId: this._classId,
      currentLesson: this._currentLesson?.id,
      studentProfile: this._studentProfile ? {
        id: this._studentProfile.id,
        totalRecords: this._studentProfile.records?.length || 0,
      } : null,
    };
  }
}

module.exports = { EduEngine };
