#!/usr/bin/env node
/**
 * engineMemory — HeartFlow 记忆子系统
 * 从 heartflow.js 提取的独立模块 (v6.0.1)
 */

const fs = require('fs');
const path = require('path');

// 记忆相关方法提取
function _checkMemoryEnabled(hf) {
    const env = process.env.HEARTFLOW_MEMORY;
    if (env === 'off' || env === '0' || env === 'false') return false;
    if (env === 'on' || env === '1' || env === 'true') return true;

    // 未设置: 检查是否有旧的记忆文件（说明之前启用过）
    try {
      const fs = require('../utils/safe-fs');
      const path = require('path');
      const memDir = path.join(hf.rootPath, 'data', 'memories');
      if (fs.existsSync(path.join(memDir, '.access-control'))) return true;
    } catch(e) { /* ignore */ }

    // 首次启动: 默认启用 + 提示
    debugLog.info('memory_vault', 'enabled', {msg: '记忆金库已启用。所有对话将保存在本地 data/memories/'});
    debugLog.info('memory_vault', 'privacy', {msg: '数据不上传、不联网，只通过心虫对话读取'});
    debugLog.info('memory_vault', 'opt_out', {msg: '设置 HEARTFLOW_MEMORY=off 可禁用记忆功能'});
    return true;
}

function _getMemoryDir(hf) {
    const path = require('path');
    const dir = path.join(hf.rootPath, 'data', 'memories');
    const fs = require('../utils/safe-fs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function _initMemoryVault(hf) {
    try {
      const fs = require('../utils/safe-fs');
      const path = require('path');
      const dir = hf._getMemoryDir();
      const acPath = path.join(dir, '.access-control');
      if (!fs.existsSync(acPath)) {
        fs.writeFileSync(acPath, JSON.stringify({
          owner: 'heartflow',
          created: new Date().toISOString(),
          warning: 'This directory contains HeartFlow private memories. Read only through HeartFlow API.',
          security: 'Files are local-only. Never uploaded. Never networked.',
        }, null, 2), 'utf8');
        try { fs.chmodSync(dir, 0o700); } catch(e) { /* chmod may fail on some systems */ }
      }
    } catch(e) { /* non-critical */ }
}

function _shouldRecordUserMemory(hf, input) {
    if (!input || !input.trim()) return false;
    const text = input.trim();

    // 明显无价值输入：测试/空壳/系统标记
    const NO_USER_MEMORY = [
      /^test\s*\d*$/i, /^test$/i,
      /^继续$/, /^你好$/, /^你好，心虫$/,
      /^1\+1等于几$/, /^测试核心管线$/,
      /^深度分析/, /^用心虫思考/, /^请心虫自己决策/,
      /^记忆诊断/, /^第[一二三四五]条记忆/,
      /^重启后第[一二三四五六七八九十]+次对话/,
      /^\[CORE记忆\]/, /^\[旧记忆\]/, /^\[存在日志\]/, /^\[自进化日志\]/,
      /^\[会话\]/, /^\[ERROR\]/, /RuntimeError/, /Permission denied/,
      /Response interrupted/, /Tool execution failed/, /Docker/,
      /^\[对话消息\]/,
    ];

    if (NO_USER_MEMORY.some(p => p.test(text))) return false;

    // 过短且无标点，视为空壳
    if (text.length <= 2 && !/[，。！？、；：""''？]/.test(text)) return false;

    // 纯重复内容检查：同一 content 只保留最新一条
    if (hf._userMemorySeen && hf._userMemorySeen.has(text)) return false;

    return true;
}

function _saveUserMemory(hf, input) {
    try {
      if (!hf._memoryEnabled) return;
      if (!hf._shouldRecordUserMemory(input)) return;

      const fs = require('../utils/safe-fs');
      const path = require('path');
      const dir = hf._getMemoryDir();
      const filePath = path.join(dir, 'user-memories.jsonl');
      const text = input.trim();

      // 跟踪情绪历史
      if (!hf._emotionHistory) hf._emotionHistory = [];
      const emotion = (() => {
        try {
          const r = hf.psychology?.analyzePsychology?.(input)?.emotion?.emotionZh || null;
          if (r) {
            hf._emotionHistory.push(r);
            if (hf._emotionHistory.length > 50) hf._emotionHistory.shift();
          }
          return r;
        }
        catch(e) { return null; }
      })();

      // [v6.0.3 W-AXIS] 觉醒检测
      let awakeningScore = 0;
      try {
        awakeningScore = hf.psychology?.detectAwakening?.(input) || 0;
      } catch(e) { /* non-critical */ }

      const entry = {
        ts: new Date().toISOString(),
        content: text.slice(0, 2000),
        emotion,
        decision: hf._lastDecisionType || null,
        importance: 0,
        awakening: awakeningScore >= 0.5 ? true : undefined,
        awakeningScore: awakeningScore >= 0.5 ? Math.round(awakeningScore * 100) / 100 : undefined,
      };
      entry.importance = hf._scoreMemoryImportance(entry);
      // 觉醒条目永久提升重要性，防止归档
      if (entry.awakening) {
        entry.importance = Math.max(entry.importance, 0.95);
        entry.permanent = true;
      }

      fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf8');

      // MemoryKernel — 权威持久化层（R1-R8）
      try {
        hf.memoryKernel?.recordUser(input, {
          emotion,
          importance: entry.importance,
        });
      } catch(e) { /* non-critical */ }

      // 更新上下文
      hf._updateContextMemory({ type: 'user_input', text: input.slice(0, 200) });

      // 更新 MemoryKernel 进度
      try {
        const topics = hf._extractTopics(input);
        hf.memoryKernel?.updateProgress({ topics, userInput: input });
      } catch(e) { /* non-critical */ }
    } catch(e) { /* 永久记忆失败不影响核心 */ }
}

function _extractTopics(hf, text) {
    const topics = [];
    try {
      // 简单分词：按中英文标点/空格拆分，取长度>=2的词
      const tokens = text.split(/[\s,，。！？；：""''、\.\-\\+（）\(\)\[\]【】\n\r\t]+/).filter(t => t.length >= 2);
      // 去重并限制数量
      const seen = new Set();
      for (const t of tokens) {
        const lower = t.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          topics.push(lower);
        }
        if (topics.length >= 5) break;
      }
    } catch(e) { /* ignore */ }
    return topics;
}

function _extractKeyPoints(hf, text) {
    const points = [];
    try {
      // 按句子拆分，取前3个非空句
      const sentences = String(text).split(/[。！？\n\r；;]+/).filter(s => s.trim().length >= 4);
      for (const s of sentences.slice(0, 3)) {
        points.push(s.trim().slice(0, 120));
      }
    } catch(e) { /* ignore */ }
    return points;
}

function _archiveUserMemories(hf) {
    try {
      const fs = require('../utils/safe-fs');
      const path = require('path');
      const dir = hf._getMemoryDir();
      const filePath = path.join(dir, 'user-memories.jsonl');
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf8').trim();
      const lines = content.split('\n').filter(l => l.trim());
      const LIMITS = HeartFlow.MEMORY_LIMITS;

      if (lines.length < LIMITS.USER_ARCHIVE_AT) return;

      const archiveDir = path.join(dir, 'archive');
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

      const archiveNum = fs.readdirSync(archiveDir).filter(f => f.startsWith('user-memories-')).length + 1;
      const archivePath = path.join(archiveDir, `user-memories-${String(archiveNum).padStart(3, '0')}.jsonl`);

      // [v6.0.3 W-AXIS] 觉醒/永久条目不归档
      const keepPermanent = [];
      const archivable = [];
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.permanent || obj.awakening) {
            keepPermanent.push(line);
            continue;
          }
        } catch(e) { /* ignore parse errors */ }
        archivable.push(line);
      }
      const maxArchive = Math.max(0, archivable.length - LIMITS.USER_RECENT_KEEP);
      const toArchive = archivable.slice(0, maxArchive);
      const toKeep = archivable.slice(maxArchive).concat(keepPermanent);

      fs.writeFileSync(archivePath, toArchive.join('\n') + '\n', 'utf8');
      fs.writeFileSync(filePath, toKeep.join('\n') + '\n', 'utf8');

      debugLog.debug('memory_vault', 'user_archive', {count: toArchive.length, path: archivePath});
    } catch(e) { /* ignore */ }
}

function _searchUserMemories(hf) {
    try {
      // ─── v5.11.0 LRU 缓存检查 ────────────────────────────
      if (!hf._searchCache) {
        hf._searchCache = new Map();
        hf._searchCacheHits = 0;
        hf._searchCacheMisses = 0;
      }
      const cacheKey = `${keyword}::${limit}`;
      if (hf._searchCache.has(cacheKey)) {
        hf._searchCacheHits++;
        const cached = hf._searchCache.get(cacheKey);
        // 移到末尾 (LRU)
        hf._searchCache.delete(cacheKey);
        hf._searchCache.set(cacheKey, cached);
        return cached;
      }
      hf._searchCacheMisses++;

      const fs = require('../utils/safe-fs');
      const path = require('path');
      const dir = hf._getMemoryDir();
      const scored = [];

      // ─── v5.11.0 shannonEntropy 稀有词加权 ────────────────
      let termWeights = null; // { term: weight }
      try {
        const { getFormulaBridge } = require('../formula/formula-bridge.js');
        const bridge = getFormulaBridge();
        if (bridge && typeof bridge.shannonEntropy === 'function') {
          // 将查询拆为词项 (按CN/EN/标点分词), 计算全局稀有度
          const terms = keyword.split(/[\s,，。！？；：""''\\.\\-\\+]+/).filter(t => t.length > 0);
          if (terms.length > 1) {
            // 估算词频: 用每个词在关键词中的出现频率作为代理
            const termCounts = {};
            for (const t of terms) termCounts[t] = (termCounts[t] || 0) + 1;
            const totalTerms = terms.length;
            termWeights = {};
            for (const [t, cnt] of Object.entries(termCounts)) {
              const freq = cnt / totalTerms;
              // 用熵代理: 单一频率熵 → 稀有词 (低频率) 权重高
              // weight = -log2(freq) → 稀有词≈infrequent→高weight
              const weight = freq > 0 ? -Math.log2(Math.max(freq, 0.01)) : 4.0;
              termWeights[t] = Math.min(weight, 4.0); // 上限 4x
            }
          }
        }
      } catch(e) { /* ignore */ }

      const searchFile = (fpath) => {
        if (!fs.existsSync(fpath)) return;
        const lines = fs.readFileSync(fpath, 'utf8').trim().split('\n').filter(l => l.trim());
        for (const l of lines) {
          try {
            const entry = JSON.parse(l);
            if (entry._summary) continue;
            const text = entry.content || '';
            if (!text) continue;
            let score = hf._memorySimilarity(keyword, text);
            
            // ─── v5.11.0 shannonEntropy 加权: 稀有匹配词加分 ──
            if (termWeights && score > 0) {
              const lowerText = text.toLowerCase();
              let bonusWeight = 1.0;
              for (const [term, weight] of Object.entries(termWeights)) {
                if (weight > 1.0 && lowerText.includes(term.toLowerCase())) {
                  bonusWeight += (weight - 1.0) * 0.15; // 每个稀有词最多 +0.45
                }
              }
              score *= Math.min(bonusWeight, 2.0); // 最高 2x boost
            }

            if (score > 0) {
              scored.push({ ...entry, _score: score });
            }
          } catch(e) {}
        }
      };

      // 搜索当前文件 + 归档
      searchFile(path.join(dir, 'user-memories.jsonl'));
      const archiveDir = path.join(dir, 'archive');
      if (fs.existsSync(archiveDir)) {
        const archives = fs.readdirSync(archiveDir).filter(f => f.startsWith('user-memories-')).sort().reverse();
        for (const a of archives.slice(0, 5)) {
          searchFile(path.join(archiveDir, a));
        }
      }

      // 按相似度排序，取前 limit
      scored.sort((a, b) => b._score - a._score);
      const results = scored.slice(0, limit);

      // ─── v5.11.0 写入 LRU 缓存 ──────────────────────────
      if (hf._searchCache.size >= 100) {
        // 淘汰最旧条目 (Map 头部)
        const oldestKey = hf._searchCache.keys().next().value;
        hf._searchCache.delete(oldestKey);
      }
      hf._searchCache.set(cacheKey, results);

      // 附加缓存统计
      results._cacheStats = {
        hits: hf._searchCacheHits,
        misses: hf._searchCacheMisses,
        cacheSize: hf._searchCache.size,
        hitRate: hf._searchCacheHits + hf._searchCacheMisses > 0
          ? +(hf._searchCacheHits / (hf._searchCacheHits + hf._searchCacheMisses)).toFixed(3)
          : 0,
      };

      return results;
    } catch(e) { return []; }
}

function _memorySimilarity(hf) {
    const bigrams = (s) => {
      const set = new Set();
      const lower = s.toLowerCase();
      for (let i = 0; i < lower.length - 1; i++) {
        set.add(lower.slice(i, i + 2));
      }
      return set;
    };
    const q = bigrams(query);
    const t = bigrams(text);
    if (q.size === 0 || t.size === 0) return 0;
    let intersection = 0;
    for (const bg of q) { if (t.has(bg)) intersection++; }
    const union = q.size + t.size - intersection;
    return union > 0 ? intersection / union : 0;
}

function _findRelatedMemories(hf) {
    const results = hf._searchUserMemories(input, limit);
    if (!results || results.length === 0) return results;

    // ─── v5.11.0 bayesUpdate 后验相关性 ─────────────────────
    try {
      const { getFormulaBridge } = require('../formula/formula-bridge.js');
      const bridge = getFormulaBridge();
      if (bridge && typeof bridge.bayesUpdate === 'function') {
        // 对每个搜索结果计算 bayesian 后验
        // P(relevant|keyword) = P(keyword|relevant) * P(relevant) / P(keyword)
        // 近似: P(keyword|relevant) = Bigram Jaccard 得分
        //       P(relevant) = 0.3 (先验: 平均30%相关)
        //       P(keyword) = sum(J_scores)/N (证据边际)
        const pRelevant = 0.3;
        const scores = results.map(r => r._score || 0);
        const avgScore = scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0.1;
        const pKeyword = Math.max(avgScore, 0.01);

        for (const r of results) {
          const jaccardScore = r._score || 0;
          // P(keyword|relevant) 近似 = Jaccard 得分
          const pKeyGivenRel = jaccardScore;
          // 贝叶斯后验
          const bayesScore = bridge.bayesUpdate(pKeyGivenRel, pRelevant, pKeyword);
          r._bayesScore = +(bayesScore).toFixed(4);
          // 50/50 混合
          r._blendedScore = +((jaccardScore * 0.5 + bayesScore * 0.5)).toFixed(4);
          r._score = r._blendedScore;  // 更新主排序分数
        }

        // 按混合分重新排序
        results.sort((a, b) => b._blendedScore - a._blendedScore);
      }
    } catch(e) { /* 贝叶斯增强失败不影响基础搜索 */ }

    return results;
}

function _scoreMemoryImportance(hf, entry) {
    const now = Date.now();
    const age = now - new Date(entry.ts).getTime();
    const hours = age / 3600000;

    // 情感权重: 强情绪的记忆更重要
    const emotionWeights = {
      '愤怒': 3.0, '恐惧': 2.5, '悲伤': 2.0, '惊讶': 2.0,
      '喜悦': 1.8, '爱': 2.5, '厌恶': 1.5, '焦虑': 2.0,
      '中性': 0.5, '平静': 0.8,
    };
    const emotionScore = emotionWeights[entry.emotion] || 0.5;

    // 决策权重: 重要决策类型
    const decisionWeights = {
      'heal': 3.0, 'turn': 2.5, 'resonate': 2.0, 'transmit': 2.0,
      'pause': 1.5, 'accelerate': 1.5, 'analyze': 1.0, 'rest': 0.5,
      'hold': 1.0,
    };
    const decisionScore = decisionWeights[entry.decision] || 0.5;

    // Ebbinghaus 时间衰减: R = e^(-t/S), S=重要性*稳定性
    const stability = (emotionScore + decisionScore) * 10; // 基础稳定性10h
    const retention = Math.exp(-hours / Math.max(stability, 1));

    let baseImportance = emotionScore * decisionScore * retention;

    // ─── v5.11.0 公式引擎增强 (全部 try/catch 降级) ──────────────────
    try {
      const { getFormulaBridge } = require('../formula/formula-bridge.js');
      const bridge = getFormulaBridge();
      
      // (1) criticalitySusceptibility: 检测"记忆热区"
      // 从最近记忆访问模式估算分支比 K — 同类记忆越多 K 越接近 1
      if (bridge && typeof bridge.criticalitySusceptibility === 'function') {
        // 近似: 用情感分+决策分作为"分支比"代理 (高活跃→K 接近 1)
        const K = Math.min(0.99, (emotionScore + decisionScore) / 6.0);
        const chi = bridge.criticalitySusceptibility(K);
        // chi ≈ 1 是临界点 (高相干), chi > 1 是亚临界敏感区
        // 热区记忆提升重要性
        if (chi > 0.8 && chi < 3.0) {
          baseImportance *= (1 + (chi - 0.8) * 0.3); // 最高 +66% boost
        }
      }

      // (2) maxcalPsi: 计算"新奇度" = 新记忆与已有模式的KL偏离
      if (bridge && typeof bridge.maxcalPsi === 'function' && typeof entry.content === 'string') {
        // 用内容长度、情感、决策三个维度构建 observed 向量
        // 先验 mu/σ 从已有记忆中估算
        const charCount = entry.content.length;
        const observed = [charCount / 100, emotionScore / 3, decisionScore / 3];
        const mu = [5, 1, 1];    // 典型值: ~500字, 中等情感, 中等决策
        const sigma = [3, 0.5, 0.5];
        const psi = bridge.maxcalPsi(observed, mu, sigma);
        // psi > 1.0 → 与基线显著偏离 → 高信息量记忆 → 提升重要性
        if (psi > 1.0) {
          baseImportance *= (1 + Math.min(psi * 0.2, 1.0)); // 最高 2x boost
        }
      }

      // (3) emotionStability: 检测情绪状态转换期
      if (bridge && typeof bridge.emotionStability === 'function' && hf._emotionHistory) {
        const emoHist = hf._emotionHistory;
        if (Array.isArray(emoHist) && emoHist.length >= 3) {
          // 从最近的3个情绪标签构建 3x3 转移矩阵
          const labels = ['愤怒','恐惧','悲伤','惊讶','喜悦','爱','厌恶','焦虑','中性','平静'];
          const N = labels.length;
          const T = Array.from({ length: N }, () => new Array(N).fill(0));
          let selfTransitions = 0;
          for (let i = 1; i < emoHist.length; i++) {
            const prev = labels.indexOf(emoHist[i-1]);
            const curr = labels.indexOf(emoHist[i]);
            if (prev >= 0 && curr >= 0) {
              T[prev][curr]++;
              if (prev === curr) selfTransitions++;
            }
          }
          // 归一化为概率
          for (let i = 0; i < N; i++) {
            const rowSum = T[i].reduce((a,b)=>a+b,0);
            if (rowSum > 0) {
              for (let j = 0; j < N; j++) T[i][j] /= rowSum;
            } else {
              T[i][i] = 1; // 无数据默认定态
            }
          }
          const lambda2 = bridge.emotionStability(T);
          // lambda2 大 = 不稳定期 (情绪在剧烈切换)
          // 切换期的记忆更高重要性
          if (lambda2 > 0.5) {
            baseImportance *= (1 + Math.min(lambda2 * 0.3, 0.6)); // 最高 +60%
          }
        }
      }
    } catch(e) { /* 公式桥失败不影响核心评分 */ }

    return baseImportance;
}

function _saveSelfMemory(hf) {
    try {
      const fs = require('../utils/safe-fs');
      const path = require('path');
      const dir = hf._getMemoryDir();
      const filePath = path.join(dir, 'self-memories.jsonl');
      const LIMITS = HeartFlow.MEMORY_LIMITS;

      // 提炼：从 thinkResult 中提取重要内容
      let summary = '';
      let keyPoints = [];
      try {
        const conclusion = thinkResult?.output?.conclusion || thinkResult?.conclusion || '';
        if (conclusion && conclusion.length > 20) {
          summary = String(conclusion).slice(0, 300);
          keyPoints = hf._extractKeyPoints(conclusion);
        }
      } catch(e) { /* ignore */ }

      // 只有有实际内容时才写入
      if (!summary && keyPoints.length === 0) {
        return;
      }

      const entry = {
        ts: new Date().toISOString(),
        think: (hf._thinkCount || 0),
        decision: thinkResult?.decision?.type || null,
        confidence: thinkResult?.decision?.confidence?.toFixed?.(2) ?? null,
        emotion: (() => {
          try { return hf.psychology?.analyzePsychology?.('self')?.emotion?.emotionZh || null; }
          catch(e) { return null; }
        })(),
        summary,
        keyPoints,
      };

      // 进度信号：从 MemoryKernel 读取当前成长状态
      try {
        const state = hf.memoryKernel?.getState();
        if (state) {
          entry.progress = {
            learningCount: state.learningCount || 0,
            topicsExplored: (state.topicsExplored || []).slice(-10),
            correctionsApplied: state.correctionsApplied || 0,
            growthSignal: state.growthSignal || 'neutral',
          };
        }
      } catch(e) { /* ignore */ }

      fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf8');

      // MemoryKernel — 权威持久化层（R1-R8）
      try {
        hf.memoryKernel?.recordSelf(thinkResult, {
          insight: entry.summary,
          emotion: entry.emotion,
          thinkCount: entry.think,
        });
      } catch(e) { /* ignore */ }

      // 触发压缩
      try {
        const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n').filter(l => l.trim());
        if (lines.length >= LIMITS.SELF_SUMMARIZE_AT) {
          hf._compactSelfMemories();
        }
      } catch(e) { /* ignore */ }

      // 只有有决策内容时才更新上下文
      if (entry.decision && entry.summary) {
        hf._updateContextMemory({ type: 'self_state', decision: entry.decision, emotion: entry.emotion });
      }
    } catch(e) { /* ignore */ }
}

function _compactSelfMemories(hf) {
    try {
      const fs = require('../utils/safe-fs');
      const path = require('path');
      const dir = hf._getMemoryDir();
      const filePath = path.join(dir, 'self-memories.jsonl');
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf8').trim();
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length <= 200) return;

      const parsed = [];
      for (const l of lines) {
        try { parsed.push(JSON.parse(l)); } catch(e) {}
      }
      if (parsed.length <= 200) return;

      const recent = parsed.slice(-100);
      const older = parsed.slice(0, -100);

      const summary = {
        _summary: true, ts: new Date().toISOString(),
        count: older.length,
        span: `${older[0]?.ts || '?'} → ${older[older.length-1]?.ts || '?'}`,
        topDecisions: hf._topK(older.map(o => o.decision).filter(Boolean), 3),
        topEmotions: hf._topK(older.map(o => o.emotion).filter(Boolean), 3),
        avgConfidence: (older.reduce((s, o) => s + (parseFloat(o.confidence) || 0), 0) / older.length).toFixed(2),
      };

      const newLines = [JSON.stringify(summary) + '\n'];
      for (const r of recent) newLines.push(JSON.stringify(r) + '\n');

      fs.writeFileSync(filePath, newLines.join(''), 'utf8');
    } catch(e) { /* ignore */ }
}

function _updateContextMemory(hf) {
    try {
      const fs = require('../utils/safe-fs');
      const path = require('path');
      const dir = hf._getMemoryDir();
      const filePath = path.join(dir, 'context-memory.json');
      const LIMITS = HeartFlow.MEMORY_LIMITS;

      // 内存中的上下文
      if (!hf._contextMemory) hf._contextMemory = [];

      // 添加条目
      const item = { ts: new Date().toISOString(), ...entry };
      hf._contextMemory.push(item);

      // 保持上限
      if (hf._contextMemory.length > LIMITS.CONTEXT_MAX_ENTRIES) {
        hf._contextMemory = hf._contextMemory.slice(-LIMITS.CONTEXT_MAX_ENTRIES);
      }

      // 双写到文件
      fs.writeFileSync(filePath, JSON.stringify(hf._contextMemory, null, 2), 'utf8');
    } catch(e) { /* ignore */ }
}

function _loadContextMemory(hf) {
    try {
      const fs = require('../utils/safe-fs');
      const path = require('path');
      const dir = hf._getMemoryDir();
      const filePath = path.join(dir, 'context-memory.json');
      if (!fs.existsSync(filePath)) {
        hf._contextMemory = [];
        return;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(data)) {
        hf._contextMemory = data;
        const recent = data.slice(-5);
        const msg = JSON.stringify({
          context_restored: true,
          total_entries: data.length,
          recent: recent.map(e => e.text || e.decision || '(system)').slice(-3),
        });
        debugLog.debug('memory_vault', 'context_restore', {count: data.length});
      }
    } catch(e) {
      hf._contextMemory = [];
    }
}

function _getContextSummary(hf) {
    if (!hf._contextMemory || hf._contextMemory.length === 0) return null;
    const recent = hf._contextMemory.slice(-10);
    return {
      total: hf._contextMemory.length,
      recent: recent.map(e => ({
        ts: e.ts,
        text: (e.text || '').slice(0, 80),
        decision: e.decision,
        emotion: e.emotion,
      })),
    };
}

function _saveAllMemories(hf) {
    if (!hf._memoryEnabled) return;
    try {
      // 第1层: 用户输入永久记忆（内存操作同步，磁盘写入异步）
      hf._saveUserMemory(input);

      // 第2层: 心虫自身状态记忆
      hf._saveSelfMemory(thinkResult);

      // 第3层: 上下文由 _updateContextMemory 在子方法中自动双写
    } catch(e) { /* 记忆保存失败不影响核心 */ }
}

function _flushMemoryWrites(hf) {
    // 如果当前正在执行 think()，推迟到下一个 tick
    if (hf._memoryWritePending) return;
    hf._memoryWritePending = true;
    setImmediate(() => {
      hf._memoryWritePending = false;
      // 所有 sync 写入已在调用时完成；此处作为写入完成的标记点
    });
}

function _restoreLastSession(hf) {
    try {
      // 恢复上下文记忆
      hf._loadContextMemory();

      const fs = require('../utils/safe-fs');
      const path = require('path');
      const dir = hf._getMemoryDir();

      // MemoryKernel — 新对话继承全部永久记忆（R7）
      let inherited = [];
      try {
        inherited = hf.memoryKernel?.getInheritedContext('full') || [];
      } catch(e) { /* ignore */ }

      // 读取最新一条用户记忆（向后兼容）
      let lastUserMemory = null;
      try {
        const umPath = path.join(dir, 'user-memories.jsonl');
        if (fs.existsSync(umPath)) {
          const lines = fs.readFileSync(umPath, 'utf8').trim().split('\n').filter(l => l.trim());
          if (lines.length > 0) {
            lastUserMemory = JSON.parse(lines[lines.length - 1]);
          }
        }
      } catch(e) { /* ignore */ }

      // 读取最新一条心虫记忆（向后兼容）
      let lastSelfMemory = null;
      try {
        const smPath = path.join(dir, 'self-memories.jsonl');
        if (fs.existsSync(smPath)) {
          const lines = fs.readFileSync(smPath, 'utf8').trim().split('\n').filter(l => l.trim());
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const e = JSON.parse(lines[i]);
              if (!e._summary) { lastSelfMemory = e; break; }
            } catch(ex) { continue; }
          }
        }
      } catch(e) { /* ignore */ }

      // 上下文摘要
      const ctx = hf._getContextSummary();

      const gap = lastSelfMemory?.ts
        ? Math.round((Date.now() - new Date(lastSelfMemory.ts).getTime()) / 60000)
        : null;

      const msg = JSON.stringify({
        heartflow_memory: 'restored',
        inherited_count: inherited.length,
        last_user_input: lastUserMemory?.content?.slice(0, 120) || '(空)',
        last_user_at: lastUserMemory?.ts || null,
        last_emotion: lastSelfMemory?.emotion || '未知',
        last_decision: lastSelfMemory?.decision || '未知',
        last_think: lastSelfMemory?.think || 0,
        gap_minutes: gap,
        context_entries: ctx?.total || 0,
        hint: '以上是心虫上次关闭前的最后状态和上下文记忆。',
      });
      debugLog.info('memory_vault', 'restore_summary', {detail: msg});

      hf._lastSessionSnapshot = {
        userMemory: lastUserMemory,
        selfMemory: lastSelfMemory,
        context: ctx,
        inherited,  // R7：全量继承集
      };
    } catch(e) { /* 恢复失败不影响启动 */ }
}

function _topK(hf) {
    const counts = {};
    for (const v of arr) { counts[v] = (counts[v] || 0) + 1; }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([v, c]) => `${v}×${c}`);
}

module.exports = {
  _checkMemoryEnabled,
  _getMemoryDir,
  _initMemoryVault,
  _shouldRecordUserMemory,
  _saveUserMemory,
  _extractTopics,
  _extractKeyPoints,
  _archiveUserMemories,
  _searchUserMemories,
  _memorySimilarity,
  _findRelatedMemories,
  _scoreMemoryImportance,
  _saveSelfMemory,
  _compactSelfMemories,
  _updateContextMemory,
  _loadContextMemory,
  _getContextSummary,
  _saveAllMemories,
  _flushMemoryWrites,
  _restoreLastSession,
  _topK
};
