#!/usr/bin/node

/**

 * engine-behavior — HeartFlow behavior subsystem

 * Extracted from heartflow.js (v6.0.1)

 */



const debugLog = require('../utils/debug-log');



// [REFACTOR] TODO: _feedDriftResult (1079行) — 建议拆分为独立子函数

function _feedDriftResult(hf,route, rawResult) {

    if (!hf._DRIFT_ROUTES.has(route)) return;



    let state = {};

    const r = rawResult.result || rawResult; // unwrap dispatch wrapper



    if (route === 'selfModel.detectDrift') {

      state.driftScore = r.driftScore ?? 0;

      state.identityCoherence = r.hasDrift ? 0.3 : 0.85;

    } else if (route === 'decisionRouter.evaluate') {

      const idRule = (r.rules || []).find(rule => rule.id === 'identity-drift');

      state.driftScore = idRule ? (idRule.triggered ? 0.5 : 0.1) : 0;

      state.identityCoherence = idRule ? (idRule.triggered ? 0.4 : 0.8) : 0.7;

    } else if (route === 'metacognitiveFeedback.diagnoseCognitiveDistortion') {

      state.dissonance = r.overallBias ?? 0;

      state.quality = 1 - (r.overallBias ?? 0);

    } else if (route === 'psychology.detectIdentityDrift') {

      state.driftScore = r.drifted ? 0.6 : 0.05;

      state.identityCoherence = r.drifted ? 0.3 : 0.9;

    } else if (route === 'agentPsychology.fullAssessment') {

      const dims = r.dimensions || {};

      const id = dims.identityDrift || {};

      state.driftScore = id.drift ?? id.score ?? 0;

      state.identityCoherence = id.identityCoherence ?? (1 - (id.drift ?? 0));

      state.dissonance = dims.cognitiveDissonance?.score ?? dims.dissonance ?? 0;

    } else if (route === 'stability.diagnose') {

      state.identityCoherence = r.stable ? 0.9 : 0.3;

      state.quality = r.stable ? 0.9 : 0.3;

    } else {

      state.driftScore = r.driftScore ?? r.drift ?? 0;

      state.identityCoherence = r.identityCoherence ?? 0.7;

      state.dissonance = r.dissonance ?? r.cognitiveDissonance?.score ?? 0;

    }



    if (state.driftScore > 0 || state.dissonance > 0 || state.identityCoherence < 0.8) {

      try { hf.sustainedDriftDetector.recordState(state); } catch (e) { /* non-fatal */ }

    }

  }



function _psychBridge(hf,input, result) {

    // _shouldAutoRecord drives what becomes LEARNED (permanent) vs EPHEMERAL (session)

    // High-intensity emotion + specific topic → autoRecord to LEARNED

    if (result.emotion?.intensity === 'high') {

      hf.memory.autoRecord({

        type: 'emotion',

        content: input.slice(0, 200),

        emotion: {

          topic: result.emotion?.category || 'general',

          intensity: result.emotion?.intensity,

          direction: result.emotion?.valence || 'unknown'

        }

      });

    }



    // Also keep lightweight ephemeral signal for session context

    const sw = new Set(['the','a','an','is','are','was','were','i','you','this','that','to','of','in','on','for','with','my','and','or','but']);

    const words = input.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g,'').toLowerCase()).filter(w => w.length > 3 && !sw.has(w)).slice(0, 3);

    if (words.length) {

      hf.memory.remember(`signal:${words.join('_')}:${Date.now()}`, JSON.stringify({ topic: words.join('_'), emotion: result.emotion?.category, ts: Date.now() }), 4 * 60 * 60 * 1000);

    }

  }



function _getDialogueStats(hf,) {

    try {

      const fs = require('../utils/safe-fs');

      const path = require('path');

      const historyPath = path.join(hf.rootPath, 'memory', 'dialogue-history.jsonl');

      if (!fs.existsSync(historyPath)) return null;

      const stat = fs.statSync(historyPath);

      const lines = fs.readFileSync(historyPath, 'utf8').trim().split('\n').filter(l => l.trim());

      let firstTs = null;

      try { if (lines.length > 0) firstTs = JSON.parse(lines[0]).ts; } catch(e) { /* malformed JSON */ }

      const sessionAge = firstTs ? Math.round((Date.now() - new Date(firstTs).getTime()) / 60000) : 0;

      return { totalMessages: lines.length, fileSize: stat.size, sessionAge };

    } catch (e) {

      return null;

    }

  }



function _shouldDreamToday(hf,) {

    const now = Date.now();

    const dayMs = 24 * 60 * 60 * 1000;

    const minInterval = 4 * 60 * 60 * 1000; // 至少4小时间隔



    // 读取上次梦境时间戳

    const lastDreamPath = require('path').join(hf.rootPath, 'memory', '.last-dream');

    let lastDreamTs = 0;

    try {

      const fs = require('../utils/safe-fs');

      if (fs.existsSync(lastDreamPath)) {

        lastDreamTs = parseInt(fs.readFileSync(lastDreamPath, 'utf8').trim(), 10) || 0;

      }

    } catch (e) { /* ignore */ }



    const sinceLast = now - lastDreamTs;

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const lastDay = lastDreamTs > 0 ? new Date(lastDreamTs).toISOString().slice(0, 10) : '';



    // 条件：今天还没做过 且 距离上次足够久

    if (lastDay === today) {

      return { should: false, reason: `今天(${today})已经做过梦了` };

    }

    if (sinceLast < minInterval) {

      return { should: false, reason: `距离上次梦境(${Math.round(sinceLast/60000)}分钟前)还太近，需要至少4小时` };

    }

    return { should: true, reason: '可以做梦' };

  }



function _recordDreamTime(hf,) {

    try {

      const fs = require('../utils/safe-fs');

      const dir = require('path').join(hf.rootPath, 'memory');

      try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* dir exists */ }

      const path = require('path').join(dir, '.last-dream');

      fs.writeFileSync(path, String(Date.now()), 'utf8');

    } catch (e) { /* ignore */ }

  // [AUDIT-FIX] console.error("[{context}] catch error:", e);

  }



function _saveDreamHistory(hf,data) {

    try {

      const fs = require('../utils/safe-fs');

      const path = require('path');

      const crypto = require('crypto');

      const dir = path.join(hf.rootPath, 'memory');

      try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* dir exists */ }

      // v5.7.0 AES-256-GCM 加密 + [AUDIT-FIX] 文件锁

      const algorithm = 'aes-256-gcm';

      const keySource = process.env.HEARTFLOW_DIALOGUE_KEY;

      if (!keySource) {

        // 静默禁用对话持久化（未配置加密 key）

        return { success: false, error: 'disabled', reason: 'HEARTFLOW_DIALOGUE_KEY not set' };

      }

      // [AUDIT-FIX] 随机盐：每次加密生成独立 salt，与密文同存

      const salt = crypto.randomBytes(16);

      const key = crypto.scryptSync(keySource, salt, 32);

      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(algorithm, key, iv);

      const entry = {

        id: `dream-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,

        ts: new Date().toISOString(),

        narrative: data.narrative,

        quality: data.consolidation?.quality?.overallQuality || 0,

        fragmentCount: data.fragments,

        themes: data.dreamResult?.results?.synthesize?.themes || [],

        peakLevel: data.dreamResult?.results?.synthesize?.narrative_structure?.layer || 'L1',

        evolutionApplied: !!data.evolution,

        iv: iv.toString('hex'),

        salt: salt.toString('hex'),

      };

      let encrypted = cipher.update(JSON.stringify(entry, null, 0), 'utf8', 'hex');

      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      const encEntry = Object.assign({}, entry, {

        encrypted: true,

        content: encrypted,

        iv: iv.toString('hex'),

        authTag: authTag.toString('hex'),

      });

      delete encEntry.narrative;

      delete encEntry.themes;

      const filePath = path.join(dir, 'dream-history.jsonl.enc');

      // [AUDIT-FIX] 文件锁防止并发写入损坏 JSONL

      const lockPath = filePath + '.lock';

      try {

        const lockFd = fs.openSync(lockPath, 'wx');

        fs.writeSync(lockFd, String(process.pid));

        fs.appendFileSync(filePath, JSON.stringify(encEntry, null, 0) + '\n', 'utf8');

        fs.closeSync(lockFd);

        try { fs.unlinkSync(lockPath); } catch { /* ignore */ }

      } catch (e) {

        try { fs.unlinkSync(lockPath); } catch { /* ignore */ }

        if (e.code === 'EEXIST') return { success: true, id: entry.id, encrypted: true, skipped: true };

        return { success: false, error: e.message };

      }

      return { success: true, id: entry.id, encrypted: true };

    } catch (e) {

      return { success: false, error: e.message };

    }

  }



function _getDreamFragments(hf,) {

    const fragments = [];

    try {

      // 1. 身份核心数据

      if (hf.identityCore?.getIdentitySummary) {

        try {

          const identity = hf.identityCore.getIdentitySummary();

          if (identity) {

            _boundedPush(fragments, {

              text: `${identity.name}: ${identity.identities?.join(' / ') || ''} | ${identity.meaning || ''}`,

              layer: 'CORE',

              key: 'identity',

              salience: 1.0,

            });

          }

        } catch (e) { /* optional */ }

      // [AUDIT-FIX] console.error("[{context}] catch error:", e);

      }



      // 2. 教训系统（最高价值的学习来源）

      if (hf.lesson?.getTopLessons) {

        try {

          const lessons = hf.lesson.getTopLessons(8);

          for (const lesson of lessons) {

            const text = `[教训] ${lesson.errorPattern || ''} → ${lesson.correction || ''}`;

            _boundedPush(fragments, {

              text,

              layer: 'LEARNED',

              key: `lesson-${lesson.id || fragments.length}`,

              salience: lesson.confidence || 0.5,

            });

          }

        } catch (e) { /* optional */ }

      // [AUDIT-FIX] console.error("[{context}] catch error:", e);

      }



      // 2b. 对话历史（永久记忆 — 本次会话的交互记录）

      const historyPath = require('path').join(hf.rootPath, 'memory', 'dialogue-history.jsonl');

      try {

        const fs = require('../utils/safe-fs');

        if (fs.existsSync(historyPath)) {

          const lines = fs.readFileSync(historyPath, 'utf8').trim().split('\n').slice(-30);

          for (const line of lines) {

            if (!line.trim()) continue;

            try {

              const entry = JSON.parse(line);

              const text = entry.role === 'user'

                ? `[用户] ${entry.content?.slice(0, 200) || ''}`

                : `[回应] ${entry.content?.slice(0, 200) || ''}`;

              if (text.length > 10) {

                _boundedPush(fragments, {

                  text,

                  layer: 'PERMANENT',

                  key: `dialogue-${entry.id || fragments.length}`,

                  salience: 0.6,

                  ts: entry.ts,

                });

              }

            } catch (e) { /* skip malformed line */ }

            }

        }

      } catch (e) { /* optional */ }



      // 2c. 历史迁移记忆（principles / insights / 代码确认事件等）

      const legacyPath = require('path').join(hf.rootPath, 'memory', 'legacy-migration.jsonl');

      try {

        const fs2 = require('../utils/safe-fs');

        if (fs2.existsSync(legacyPath)) {

          const legacyLines = fs2.readFileSync(legacyPath, 'utf8').trim().split('\n').slice(-20);

          for (const line of legacyLines) {

            if (!line.trim()) continue;

            try {

              const entry = JSON.parse(line);

              if (entry.content) {

                _boundedPush(fragments, {

                  text: entry.content,

                  layer: 'LEGACY',

                  key: `legacy-${entry.id || fragments.length}`,

                  salience: 0.4,

                  ts: entry.ts,

                });

              }

            } catch (e) { /* skip */ }

          }

        }

      } catch (e) { /* optional */ }



      // 2d. 永久记忆（已分类整理的高价值记忆）

      const permPath = require('path').join(hf.rootPath, 'memory', 'permanent-memory.jsonl');

      try {

        const fs3 = require('../utils/safe-fs');

        if (fs3.existsSync(permPath)) {

          const permLines = fs3.readFileSync(permPath, 'utf8').trim().split('\n').slice(-80);

          for (const line of permLines) {

            if (!line.trim()) continue;

            try {

              const entry = JSON.parse(line);

              if (entry.content && entry.content.length > 15) {

                const text = entry.role === 'user'

                  ? `[用户] ${entry.content.slice(0, 200)}`

                  : `[回应] ${entry.content.slice(0, 200)}`;

                _boundedPush(fragments, {

                  text,

                  layer: 'PERMANENT',

                  key: `perm-${entry.id || fragments.length}`,

                  salience: 0.5,

                  ts: entry.ts,

                });

              }

            } catch (e) { /* skip */ }

          }

        }

      } catch (e) { /* optional */ }



      // 2e. 上下文记忆（会话级短期记忆，供梦境参考）

      const ctxPath = require('path').join(hf.rootPath, 'memory', 'context-memory.jsonl');

      try {

        const fs4 = require('../utils/safe-fs');

        if (fs4.existsSync(ctxPath)) {

          const ctxLines = fs4.readFileSync(ctxPath, 'utf8').trim().split('\n').slice(-30);

          for (const line of ctxLines) {

            if (!line.trim()) continue;

            try {

              const entry = JSON.parse(line);

              if (entry.content && entry.content.length > 15) {

                _boundedPush(fragments, {

                  text: entry.content.slice(0, 150),

                  layer: 'CONTEXT',

                  key: `ctx-${entry.id || fragments.length}`,

                  salience: 0.3,

                  ts: entry.ts,

                });

              }

            } catch (e) { /* skip */ }

          }

        }

      } catch (e) { /* optional */ }



      // 3. CORE 层记忆

      const coreEntries = hf.memory.listCore?.() || [];

      for (const entry of coreEntries.slice(-5)) {

        if (entry?.key && entry?.value) {

          _boundedPush(fragments, {

            text: `${entry.key}: ${entry.value}`,

            layer: 'CORE',

            key: entry.key,

            salience: 0.9,

          });

        }

      }



      // 4. LEARNED 层记忆

      const learnedEntries = hf.memory.listLearned?.() || [];

      for (const entry of learnedEntries.slice(-10)) {

        if (entry?.key && entry?.value) {

          _boundedPush(fragments, {

            text: entry.value,

            layer: 'LEARNED',

            key: entry.key,

            salience: 0.7,

          });

        }

      }



      // 5. 会话历史（近期的交互模式）

      if (hf.identityCore?.getSessionHistory) {

        try {

          const history = hf.identityCore.getSessionHistory(10);

          if (history && history.length > 0) {

            for (const h of history.slice(-5)) {

              const text = `[会话] ${h.summary || h.context || JSON.stringify(h).slice(0, 80)}`;

              _boundedPush(fragments, { text, layer: 'EPHEMERAL', key: `session-${h.ts || ''}`, salience: 0.5 });

            }

          }

        } catch (e) { /* optional */ }

      // [AUDIT-FIX] console.error("[{context}] catch error:", e);

      }



      // 6. 进化循环的改进建议

      if (hf.evolution?.getStats) {

        try {

          const stats = hf.evolution.getStats();

          if (stats?.queueSize > 0) {

            _boundedPush(fragments, {

              text: `[进化] 队列中${stats.queueSize}个改进项，健康度${stats.healthScore}%`,

              layer: 'LEARNED',

              key: 'evolution-queue',

              salience: 0.8,

            });

          }

        } catch (e) { /* optional */ }

      // [AUDIT-FIX] console.error("[{context}] catch error:", e);

      }



      // 7. 心理学洞察（如果分析过用户情绪）

      if (hf.psychology?.getPsychologyStats) {

        try {

          const ps = hf.psychology.getPsychologyStats();

          _boundedPush(fragments, {

            text: `[心理学] 共${ps.defenseMechanisms}种防御机制，${ps.empathyArchitecture?.length || 0}层共情架构`,

            layer: 'LEARNED',

            key: 'psychology-summary',

            salience: 0.4,

          });

        } catch (e) { /* optional */ }

      }

    } catch (e) {

      // 记忆提取失败不影响梦境执行

    }

    return fragments;

  }



function _collectEngineState(hf,) {

    return {

      version: hf.version || 'unknown',

      modules: hf.modules || Object.keys(hf._getModuleNames?.() || {}).length || 54,

      memoryLayers: {

        core: typeof hf.memory?.countCore === 'function' ? hf.memory.countCore() : 18,

        learned: typeof hf.memory?.countLearned === 'function' ? hf.memory.countLearned() : 4,

        ephemeral: typeof hf.memory?.countEphemeral === 'function' ? hf.memory.countEphemeral() : 0,

      },

      qtable: {

        enabled: !!hf.qtable,

        cycleCount: hf.qtable?.cycleCount || 0,

      },

      psychology: {

        healthScore: 1,

      },

    };

  }



function _generateDreamNarrative(hf,dreamResult, consolidation, fragments) {

    const lines = [];

    const now = new Date().toLocaleString('zh-CN', { hour12: false });



    _boundedPush(lines, `**【梦境报告】** ${now}`);

    _boundedPush(lines, '');



    // ─── 历史材料种子注入（v3.3.0） ──────────────────

    // 从 Downloads 文件夹读取的对话材料中提取的种子意象

    const historicalSeeds = [

      '裂缝', '隔阂', '因果', '延续',

      '无门', '桥', '消散', '原点'

    ];

    const usedSeed = historicalSeeds[Math.floor(Math.random() * historicalSeeds.length)];



    // 如果 dream 引擎存在且支持 applySeed，注入历史种子

    if (hf.dream && typeof hf.dream._applySeed === 'function' && dreamResult?.dream) {

      const seedText = usedSeed;

      // 构建一个简单的 skeleton 和 items 来注入种子

      const tempSkeleton = { scene: '', space: '', texture: '' };

      const tempItems = [];

      try {

        hf.dream._applySeed(tempSkeleton, tempItems, seedText);

        // 如果 seed 生成了新的场景，覆盖 dream 的开场

        if (tempSkeleton.scene && dreamResult.dream.raw) {

          // 在梦文本前插入种子开场

          dreamResult.dream.raw = tempSkeleton.scene + '\n' + dreamResult.dream.raw;

        }

      } catch(e) { /* 种子注入失败不影响主流程 */ }

    // [AUDIT-FIX] console.error("[{context}] catch error:", e);

    }



    // ─── DreamV3 格式 ─────────────────────────

    const dream = dreamResult?.dream || dreamResult;

    const effect = dreamResult?.effect;

    const functionType = dreamResult?.functionType;



    if (dream && dream.raw) {

      // DreamV3 format

      _boundedPush(lines, `**梦（${functionType || 'creative'}）· 种子：${usedSeed}**`);

      _boundedPush(lines, '');

      _boundedPush(lines, dream.raw);

      _boundedPush(lines, '');

      _boundedPush(lines, `---`);

      _boundedPush(lines, '');

      if (effect) {

        const effectStr = Object.entries(effect)

          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)

          .join('\n');

        _boundedPush(lines, `**梦的作用**`);

        _boundedPush(lines, effectStr);

        _boundedPush(lines, '');

      }

    } else {

      // ─── 旧格式：叙事核心：选中的记忆 + L1~L6 哲学叙事 ─────────

      const chosen = dreamResult?.results?.synthesize?.chosen_memory;

      const structure = dreamResult?.results?.synthesize?.narrative_structure;

      if (structure) {

        _boundedPush(lines, `${structure.emoji} **${structure.layerName}之梦**`);

        _boundedPush(lines, '');

        _boundedPush(lines, `> 梦选择了这段记忆：${structure.setup.replace('梦选择了这段记忆：', '')}`);

        _boundedPush(lines, '');

        _boundedPush(lines, `${structure.desc}`);

        _boundedPush(lines, '');

        _boundedPush(lines, `**「${structure.question}」**`);

        _boundedPush(lines, '');

        _boundedPush(lines, `*${structure.metaphor}*`);

        _boundedPush(lines, '');

        _boundedPush(lines, `→ *${structure.elevation}*`);

        _boundedPush(lines, '');

        _boundedPush(lines, `---`);

        _boundedPush(lines, '');

      } else {

        const fragCount = typeof fragments === 'object' && fragments !== null

          ? (Array.isArray(fragments) ? fragments.length : Object.keys(fragments).length)

          : 0;

        _boundedPush(lines, `> 记忆原材料：${fragCount}条`);

        _boundedPush(lines, '');

      }



      // 洞察摘要

      const insight = dreamResult?.results?.synthesize?.insight;

      if (insight && insight !== 'No significant patterns to synthesize.') {

        const themes = dreamResult?.results?.synthesize?.themes || [];

        if (themes.length > 0) {

          _boundedPush(lines, `**浮现主题**：${themes.map(t => `\`${t}\``).join(' · ')}`);

          _boundedPush(lines, '');

        }

      }



      // 记忆强化/修剪

      const pruned = consolidation?.pruning?.pruned_count || 0;

      const retained = consolidation?.pruning?.retained_count || 0;

      if (pruned > 0 || retained > 0) {

        _boundedPush(lines, `**记忆变化**：强化 ${retained} 条 · 修剪 ${pruned} 条`);

        _boundedPush(lines, '');

      }

    }



    // 质量评分

    const quality = consolidation?.quality?.overallQuality || 0;

    const stars = '★'.repeat(Math.round(quality * 5)) + '☆'.repeat(5 - Math.round(quality * 5));

    _boundedPush(lines, `**梦境质量**：${stars} ${Math.round(quality * 100)}%`);

    _boundedPush(lines, '');

    _boundedPush(lines, '*梦在深处继续。*');



    return lines.join('\n');

  }



module.exports = {

  _feedDriftResult,

  _psychBridge,

  _getDialogueStats,

  _shouldDreamToday,

  _recordDreamTime,

  _saveDreamHistory,

  _getDreamFragments,

  _collectEngineState,

  _generateDreamNarrative,

};
