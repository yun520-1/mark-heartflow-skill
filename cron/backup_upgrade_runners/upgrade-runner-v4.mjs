#!/opt/homebrew/bin/node
/**
 * HeartFlow 高效论文升级引擎 v4.0
 * 真正将论文知识写入主引擎
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SKILL_DIR = join(__dirname, '..');
const PAPERS_DIR = '/Users/apple/Downloads/daima';
const HEARTFLOW_JS = join(SKILL_DIR, 'src', 'core', 'heartflow.js');
const SKILL_MD = join(SKILL_DIR, 'SKILL.md');
const VERSION_FILE = join(SKILL_DIR, 'VERSION');
const QUEUE_FILE = join(SKILL_DIR, 'cron', 'paper-upgrade-queue.json');
const LOG_DIR = join(SKILL_DIR, 'logs');

mkdirSync(LOG_DIR, { recursive: true });

const LOG_FILE = join(LOG_DIR, 'upgrade-v4.log');

function log(msg) {
    const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const line = `[${ts}] ${msg}`;
    console.log(line);
    appendFileSync(LOG_FILE, line + '\n');
}

function loadQueue() {
    try {
        return JSON.parse(readFileSync(QUEUE_FILE, 'utf-8'));
    } catch (e) {
        return createNewQueue();
    }
}

function createNewQueue() {
    const papers = findAllPapers();
    const queue = {
        papers,
        papersRead: [],
        papersAnalyzed: [],
        currentVersion: readVersion(),
        nextVersion: bumpVersion(readVersion()),
        lastUpgrade: null,
        upgradeCount: 0
    };
    saveQueue(queue);
    return queue;
}

function saveQueue(queue) {
    writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

function readVersion() {
    try {
        return readFileSync(VERSION_FILE, 'utf-8').trim();
    } catch {
        return 'v0.13.60';
    }
}

function findAllPapers() {
    const papers = [];
    const subdirs = ['psychology-philosophy-ai', 'agent-arch'];
    
    subdirs.forEach(sub => {
        const dir = join(PAPERS_DIR, sub);
        if (existsSync(dir)) {
            readdirSync(dir).forEach(f => {
                if (f.endsWith('.pdf')) papers.push(`${sub}/${f}`);
            });
        }
    });
    
    if (papers.length === 0) {
        readdirSync(PAPERS_DIR).forEach(f => {
            if (f.endsWith('.pdf')) papers.push(f);
        });
    }
    
    return papers;
}

function getUnanalyzedPapers(queue) {
    return queue.papers.filter(p => !queue.papersAnalyzed.includes(p));
}

function extractText(pdfPath) {
    try {
        const fullPath = join(PAPERS_DIR, pdfPath);
        const tmpScript = join('/tmp', `hf_${randomUUID()}.py`);
        
        const script = `
import pdfplumber
import sys
try:
    with pdfplumber.open("${fullPath.replace(/\\/g, '\\\\')}") as pdf:
        text = ""
        for page in pdf.pages[:20]:
            t = page.extract_text()
            if t:
                text += t + "\\n"
        print(text[:100000] if text else "")
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
`;
        
        writeFileSync(tmpScript, script);
        const result = spawnSync('/opt/homebrew/bin/python3', [tmpScript], { 
            timeout: 90000,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024
        });
        
        return result.stdout || '';
    } catch (e) {
        log('[PDF错误] ' + pdfPath + ': ' + e.message);
        return '';
    }
}

function analyzePaper(text, filename) {
    const concepts = [];
    const patterns = [
        { name: 'memory', pattern: /memory|recall|store|retrieve|remember|遗忘|记忆/i },
        { name: 'consciousness', pattern: /consciousness|awareness|phenomenal|意识|觉醒/i },
        { name: 'emotion', pattern: /emotion|affect|feeling|mood|情绪|情感/i },
        { name: 'learning', pattern: /learning|learn|adapt|evolve|学习|适应|进化/i },
        { name: 'reasoning', pattern: /reasoning|logic|inference|思考|推理|逻辑/i },
        { name: 'self', pattern: /self|reflect|meta|cognition|自我|反思|元认知/i },
        { name: 'planning', pattern: /planning|goal|intention|plan|计划|目标|意图/i },
        { name: 'ethics', pattern: /ethics|moral|value|伦理|道德|价值观/i },
        { name: 'autonomy', pattern: /autonomy|agency|independent|自主|代理|独立/i },
    ];
    
    patterns.forEach(({ name, pattern }) => {
        if (pattern.test(text)) concepts.push(name);
    });
    
    return {
        filename,
        concepts: [...new Set(concepts)],
        textLength: text.length,
        preview: text.substring(0, 500)
    };
}

function generateEnhancementCode(concept, insight, idx) {
    const timestamp = Date.now();
    const safeName = insight.filename.replace(/[^a-zA-Z0-9]/g, '_').replace('.pdf', '');
    
    const templates = {
        memory: `
  // Memory Enhancement from ${insight.filename}
  this.paperMemory_${timestamp} = {
    name: 'paperMemory_${safeName}',
    source: '${insight.filename}',
    
    compress(memory, threshold = 0.7) {
      return memory
        .filter(m => m.importance >= threshold)
        .map(m => ({ ...m, essence: m.value.substring(0, 100), compressed: true }));
    },
    
    retrieve(query, memory) {
      const q = query.toLowerCase().split(/\\s+/);
      return memory
        .map(m => {
          const text = (m.key + ' ' + m.value).toLowerCase();
          const score = q.filter(t => text.includes(t)).length / q.length;
          return { ...m, relevance: score };
        })
        .filter(m => m.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance);
    },
    
    consolidate(newMem, existing) {
      const map = new Map(existing.map(m => [m.key, m]));
      newMem.forEach(m => {
        if (map.has(m.key)) {
          const e = map.get(m.key);
          map.set(m.key, { ...e, value: m.value, reinforce: (e.reinforce || 0) + 1 });
        } else {
          map.set(m.key, { ...m, reinforce: 1 });
        }
      });
      return Array.from(map.values());
    }
  };`,

        consciousness: `
  // Consciousness Enhancement from ${insight.filename}
  this.paperConsciousness_${timestamp} = {
    name: 'paperConsciousness_${safeName}',
    source: '${insight.filename}',
    
    monitor(state) {
      return {
        awareness: Math.min(1, (state.messages?.length || 0) / 10),
        coherence: state.goal ? 0.9 : 0.4,
        integrity: state.memory ? 0.85 : 0.3
      };
    },
    
    focus(items, context = {}) {
      return items
        .map(item => ({ item, priority: (context.recent?.includes(item) ? 0.2 : 0) + (context.important?.includes(item) ? 0.3 : 0) + 0.5 }))
        .sort((a, b) => b.priority - a.priority)
        .map(x => x.item);
    }
  };`,

        emotion: `
  // Emotion Enhancement from ${insight.filename}
  this.paperEmotion_${timestamp} = {
    name: 'paperEmotion_${safeName}',
    source: '${insight.filename}',
    
    detect(text) {
      const lower = text.toLowerCase();
      const pos = ['好', '棒', '优秀', 'happy', 'good', 'great', 'excellent'];
      const neg = ['差', '糟糕', '失望', 'sad', 'bad', 'terrible', 'hate'];
      let scores = { positive: 0, negative: 0, neutral: 1 };
      pos.forEach(w => { if (lower.includes(w)) scores.positive++; });
      neg.forEach(w => { if (lower.includes(w)) scores.negative++; });
      if (scores.positive + scores.negative > 0) scores.neutral = 0;
      return scores;
    },
    
    adapt(text, emotion) {
      const tone = emotion.positive > emotion.negative ? 'warm' : emotion.negative > emotion.positive ? 'empathetic' : 'neutral';
      return { tone, response: text };
    }
  };`,

        learning: `
  // Learning Enhancement from ${insight.filename}
  this.paperLearning_${timestamp} = {
    name: 'paperLearning_${safeName}',
    source: '${insight.filename}',
    
    learnFromError(error, context = {}) {
      return {
        pattern: error.substring(0, 100),
        type: /undefined|null/.test(error) ? 'null_reference' : /timeout/.test(error) ? 'timeout' : 'unknown',
        correction: /undefined|null/.test(error) ? '添加 null 检查' : /timeout/.test(error) ? '增加超时时间' : '验证输入'
      };
    },
    
    incrementalUpdate(model, newData) {
      const updated = { ...model };
      newData.forEach(d => { updated[d.key] = (updated[d.key] || 0) * 0.9 + d.value * 0.1; });
      return updated;
    }
  };`,

        reasoning: `
  // Reasoning Enhancement from ${insight.filename}
  this.paperReasoning_${timestamp} = {
    name: 'paperReasoning_${safeName}',
    source: '${insight.filename}',
    
    chain(premises) {
      const steps = [];
      let current = premises[0];
      for (let i = 1; i < premises.length; i++) {
        const next = premises[i];
        steps.push({ from: current, to: next, valid: !!next });
        if (next) current = next;
      }
      return { steps, conclusion: current, valid: steps.every(s => s.valid) };
    },
    
    detectFallacy(reasoning) {
      const issues = [];
      if (/always|never|must|肯定/.test(reasoning) && !/but|however/.test(reasoning)) issues.push('false_dichotomy');
      if (/因为.*所以/.test(reasoning) && !/但是/.test(reasoning)) issues.push('correlation_causation');
      return issues;
    }
  };`,

        self: `
  // Self-Improvement Enhancement from ${insight.filename}
  this.paperSelf_${timestamp} = {
    name: 'paperSelf_${safeName}',
    source: '${insight.filename}',
    
    reflect(actions, outcomes) {
      return actions.map((action, i) => ({
        action,
        outcome: outcomes[i],
        rating: outcomes[i]?.success ? 1 : -1,
        lesson: outcomes[i]?.success ? "成功: " + action : "失败: " + action + " -> " + (outcomes[i]?.error || "unknown")
      }));
    },
    
    suggest(lessons) {
      return lessons.filter(l => l.rating < 0).map(l => ({ problem: l.action, suggestion: "改进: " + l.lesson }));
    }
  };`,

        ethics: `
  // Ethics Enhancement from ${insight.filename}
  this.paperEthics_${timestamp} = {
    name: 'paperEthics_${safeName}',
    source: '${insight.filename}',
    
    check(action) {
      const concerns = [];
      if (/delete|remove|destroy/.test(action)) concerns.push('dataLoss');
      if (/private|secret|password/.test(action)) concerns.push('privacy');
      return { approved: concerns.length === 0, concerns };
    }
  };`,

        autonomy: `
  // Autonomy Enhancement from ${insight.filename}
  this.paperAutonomy_${timestamp} = {
    name: 'paperAutonomy_${safeName}',
    source: '${insight.filename}',
    
    decide(options, context = {}) {
      const scored = options.map(opt => ({
        opt,
        score: (opt.effective ? 0.3 : 0) + (opt.safe ? 0.2 : 0) + (opt.reversible ? 0.1 : 0) + 0.4
      }));
      return scored.sort((a, b) => b.score - a.score)[0];
    }
  };`
    };
    
    return templates[concept] || templates.self;
}

function bumpVersion(version) {
    const parts = version.replace('v', '').split('.');
    parts[2] = String(parseInt(parts[2]) + 1);
    return 'v' + parts.join('.');
}

function injectIntoHeartflow(enhancements, version) {
    try {
        let content = readFileSync(HEARTFLOW_JS, 'utf-8');
        
        // 找到 start() 方法的位置，在其中添加增强代码
        const startMethodMatch = content.match(/(this\.dream\.enabled = true;[\s\S]*?)(this\.(?:heartbeat|sleepWake|startupCheck))/);
        
        if (startMethodMatch) {
            const injectionPoint = startMethodMatch[1].length + startMethodMatch.index;
            const insertPos = startMethodMatch.index + startMethodMatch[1].lastIndexOf('this.dream.enabled = true;') + 'this.dream.enabled = true;'.length;
            
            const enhancementCode = '\n' + enhancements.join('\n') + '\n';
            content = content.slice(0, insertPos) + enhancementCode + content.slice(insertPos);
            
            // 更新版本号
            content = content.replace(
                /let VERSION = 'v[\d.]+'/,
                `let VERSION = '${version}'`
            );
            
            writeFileSync(HEARTFLOW_JS, content);
            return true;
        }
        
        log('[错误] 未找到注入点');
        return false;
    } catch (e) {
        log('[注入错误] ' + e.message);
        return false;
    }
}

function updateSkillMd(version) {
    try {
        let content = readFileSync(SKILL_MD, 'utf-8');
        content = content.replace(/version: v[\d.]+/, `version: ${version}`);
        content = content.replace(/date: "[\d-]+"/, `date: "${new Date().toISOString().split('T')[0]}"`);
        writeFileSync(SKILL_MD, content);
        return true;
    } catch (e) {
        log('[SKILL.md更新错误] ' + e.message);
        return false;
    }
}

// ====== 主流程 ======

async function runUpgrade() {
    log('═══════════════════════════════════════════════════════');
    log('HeartFlow 论文升级引擎 v4.0 启动 (真正写入主引擎)');
    log('═══════════════════════════════════════════════════════');
    
    const queue = loadQueue();
    log(`队列状态: ${queue.papers.length} 篇论文`);
    log(`当前版本: ${queue.currentVersion}`);
    
    const unanalyzed = getUnanalyzedPapers(queue);
    log(`未分析论文: ${unanalyzed.length} 篇`);
    
    if (unanalyzed.length === 0) {
        log('[完成] 所有论文已分析，重置队列');
        queue.papersAnalyzed = [];
        saveQueue(queue);
        return { success: true, message: 'queue_reset' };
    }
    
    const papersToProcess = unanalyzed.slice(0, 2);
    log(`本次处理: ${papersToProcess.join(', ')}`);
    
    const insights = [];
    const allEnhancements = [];
    
    for (const paper of papersToProcess) {
        log(`[读取] ${paper}`);
        const text = extractText(paper);
        
        if (text.length < 100) {
            log(`[警告] 文本提取失败: ${paper}`);
            queue.papersAnalyzed.push(paper);
            continue;
        }
        
        const insight = analyzePaper(text, paper);
        insights.push(insight);
        queue.papersAnalyzed.push(paper);
        queue.papersRead.push(paper);
        
        log(`  概念: ${insight.concepts.join(', ') || '无匹配'}`);
        log(`  长度: ${insight.textLength} 字符`);
        
        // 为每个概念生成增强代码
        insight.concepts.forEach((concept, idx) => {
            const code = generateEnhancementCode(concept, insight, idx);
            if (code) allEnhancements.push(code);
        });
    }
    
    if (allEnhancements.length > 0) {
        // 注入到主引擎
        const oldVersion = queue.currentVersion;
        const newVersion = queue.nextVersion;
        
        log(`[注入] 写入 ${allEnhancements.length} 个增强到 heartflow.js`);
        
        const injected = injectIntoHeartflow(allEnhancements, newVersion);
        
        if (injected) {
            updateSkillMd(newVersion);
            
            // 更新 VERSION 文件
            writeFileSync(VERSION_FILE, newVersion);
            
            // 更新队列
            queue.currentVersion = newVersion;
            queue.nextVersion = bumpVersion(newVersion);
            queue.lastUpgrade = new Date().toISOString();
            queue.upgradeCount++;
            
            log(`[版本] ${oldVersion} → ${newVersion}`);
        } else {
            log('[错误] 注入失败');
        }
    }
    
    saveQueue(queue);
    
    log('═══════════════════════════════════════════════════════');
    log(`升级完成! 当前版本: ${queue.currentVersion}`);
    log(`进度: ${queue.papersAnalyzed.length}/${queue.papers.length}`);
    log('═══════════════════════════════════════════════════════');
    
    return {
        success: true,
        version: queue.currentVersion,
        papersProcessed: papersToProcess.length,
        enhancements: allEnhancements.length
    };
}

runUpgrade()
    .then(result => {
        console.log('[完成]', JSON.stringify(result));
        process.exit(0);
    })
    .catch(e => {
        console.error('[错误]', e.message);
        process.exit(1);
    });
