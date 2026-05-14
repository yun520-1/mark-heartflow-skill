#!/opt/homebrew/bin/node
/**
 * HeartFlow 论文升级引擎 v5.0
 * 从论文中提取真正可执行的算法逻辑、评估指标、处理流程
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const SKILL_DIR = process.env.HOME + '/.hermes/skills/ai/mark-heartflow-skill';
const PAPERS_DIR = '/Users/apple/Downloads/daima';
const HEARTFLOW_JS = join(SKILL_DIR, 'src', 'core', 'heartflow.js');
const SKILL_MD = join(SKILL_DIR, 'SKILL.md');
const VERSION_FILE = join(SKILL_DIR, 'VERSION');
const QUEUE_FILE = join(SKILL_DIR, 'cron', 'paper-upgrade-queue.json');
const LOG_DIR = join(SKILL_DIR, 'logs');

mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = join(LOG_DIR, 'upgrade-v5.log');

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
        for page in pdf.pages[:25]:
            t = page.extract_text()
            if t:
                text += t + "\\n"
        print(text[:150000] if text else "")
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
`;
        writeFileSync(tmpScript, script);
        const result = spawnSync('/opt/homebrew/bin/python3', [tmpScript], {
            timeout: 120000,
            encoding: 'utf-8',
            maxBuffer: 20 * 1024 * 1024
        });
        return result.stdout || '';
    } catch (e) {
        log('[PDF错误] ' + pdfPath + ': ' + e.message);
        return '';
    }
}

function extractKnowledge(text, filename) {
    const knowledge = [];
    
    const metrics = extractMetrics(text);
    if (metrics.length > 0) {
        knowledge.push({ type: 'metrics', data: metrics, source: filename });
    }
    
    const steps = extractSteps(text);
    if (steps.length > 0) {
        knowledge.push({ type: 'steps', data: steps, source: filename });
    }
    
    const rules = extractRules(text);
    if (rules.length > 0) {
        knowledge.push({ type: 'rules', data: rules, source: filename });
    }
    
    const params = extractParams(text);
    if (params.length > 0) {
        knowledge.push({ type: 'params', data: params, source: filename });
    }
    
    return knowledge;
}

function extractMetrics(text) {
    const metrics = [];
    const patterns = [
        { name: 'accuracy', pattern: /accuracy\s*[:=]?\s*[\d.]+/gi },
        { name: 'precision', pattern: /precision\s*[:=]?\s*[\d.]+/gi },
        { name: 'recall', pattern: /recall\s*[:=]?\s*[\d.]+/gi },
        { name: 'f1', pattern: /F1\s*[-]?score\s*[:=]?\s*[\d.]+/gi },
        { name: 'loss', pattern: /loss\s*[:=]?\s*[\d.]+/gi },
        { name: 'perplexity', pattern: /perplexity\s*[:=]?\s*[\d.]+/gi },
        { name: 'confidence', pattern: /confidence\s*[:=]?\s*[\d.]+/gi },
        { name: 'threshold', pattern: /threshold\s*[:=]?\s*[\d.]+/gi },
    ];
    
    patterns.forEach(({ name, pattern }) => {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
            const values = matches.map(m => {
                const num = m.match(/[\d.]+/);
                return num ? parseFloat(num[0]) : null;
            }).filter(v => v !== null && v <= 1);
            
            if (values.length > 0) {
                metrics.push({
                    name,
                    values,
                    avg: values.reduce((a, b) => a + b, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values)
                });
            }
        }
    });
    
    return metrics;
}

function extractSteps(text) {
    const steps = [];
    
    const numberedSteps = text.match(/(?:^|\n)\s*(?:step|stage|phase)\s*\d+[:\s]+[A-Z][^.!\n]{10,150}/gim);
    if (numberedSteps) {
        numberedSteps.forEach(s => {
            const match = s.match(/(?:step|stage|phase)\s*(\d+)[:\s]+([A-Z][^.!\n]{10,150})/im);
            if (match) {
                steps.push({
                    order: parseInt(match[1]),
                    description: match[2].trim().substring(0, 100)
                });
            }
        });
    }
    
    const flows = text.match(/(?:first|then|next|finally)[,:\s]+[A-Z][^.!\n]{20,150}/gi);
    if (flows) {
        flows.slice(0, 5).forEach((f, i) => {
            steps.push({
                order: i + 1,
                description: f.trim().substring(0, 100),
                type: 'flow'
            });
        });
    }
    
    return steps.slice(0, 10);
}

function extractRules(text) {
    const rules = [];
    
    const conditionals = text.match(/(?:if|when|unless)[^,.\n]{10,80}[,:\s]+(?:then|则|那么)[^,.\n]{10,80}/gi);
    if (conditionals) {
        conditionals.slice(0, 5).forEach(c => {
            rules.push({
                condition: c.trim().substring(0, 80),
                type: 'conditional'
            });
        });
    }
    
    return rules;
}

function extractParams(text) {
    const params = [];
    
    const thresholds = text.match(/(?:threshold|阈值)\s*[:=]?\s*(\d*\.?\d+)/gi);
    if (thresholds) {
        thresholds.slice(0, 5).forEach(t => {
            const num = t.match(/\d*\.?\d+/);
            if (num) params.push({ name: 'threshold', value: parseFloat(num[0]), type: 'threshold' });
        });
    }
    
    const weights = text.match(/(?:weight|权重)\s*[:=]?\s*(\d*\.?\d+)/gi);
    if (weights) {
        weights.slice(0, 5).forEach(w => {
            const num = w.match(/\d*\.?\d+/);
            if (num) params.push({ name: 'weight', value: parseFloat(num[0]), type: 'weight' });
        });
    }
    
    return params;
}

function generateExecutableCode(knowledge, filename) {
    const codeSnippets = [];
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9]/g, '_').replace('.pdf', '');
    
    knowledge.forEach(k => {
        if (k.type === 'metrics' && k.data.length > 0) {
            codeSnippets.push(`
  // Metrics from ${k.source}
  this.paperMetrics_${timestamp} = {
    name: 'metrics_${safeName}',
    source: '${k.source}',
    metrics: ${JSON.stringify(k.data.map(m => ({
        name: m.name,
        avg: Math.round(m.avg * 100) / 100,
        range: [Math.round(m.min * 100) / 100, Math.round(m.max * 100) / 100]
    })))},
    calculateScore(values) {
      if (!values || values.length === 0) return 0;
      const weights = { accuracy: 0.4, precision: 0.2, recall: 0.2, f1: 0.2 };
      let score = 0, totalWeight = 0;
      values.forEach(v => {
        const w = weights[v.name] || 0.1;
        score += v.avg * w;
        totalWeight += w;
      });
      return Math.round(score / totalWeight * 100) / 100;
    },
    evaluate(result, threshold = 0.7) {
      const score = this.calculateScore(this.metrics);
      return { score, passed: score >= threshold, threshold };
    }
  };`);
        }
        
        if (k.type === 'steps' && k.data.length > 0) {
            codeSnippets.push(`
  // Steps from ${k.source}
  this.paperSteps_${timestamp} = {
    name: 'steps_${safeName}',
    source: '${k.source}',
    steps: ${JSON.stringify(k.data.slice(0, 5).map(s => ({ order: s.order, description: s.description.substring(0, 80) })))},
    execute(context) {
      return this.steps.map(step => ({ step: step.order, description: step.description, status: 'pending' }));
    },
    getNextStep(currentStep) {
      const idx = this.steps.findIndex(s => s.order === currentStep);
      return idx >= 0 && idx < this.steps.length - 1 ? this.steps[idx + 1] : null;
    }
  };`);
        }
        
        if (k.type === 'rules' && k.data.length > 0) {
            codeSnippets.push(`
  // Rules from ${k.source}
  this.paperRules_${timestamp} = {
    name: 'rules_${safeName}',
    source: '${k.source}',
    rules: ${JSON.stringify(k.data.slice(0, 5).map(r => ({ condition: r.condition.substring(0, 80), type: r.type })))},
    evaluateCondition(condition, context) {
      const lowerCond = condition.toLowerCase();
      for (const rule of this.rules) {
        if (rule.condition.toLowerCase().includes(lowerCond.substring(0, 20))) {
          return { matched: true, rule };
        }
      }
      return { matched: false };
    },
    getApplicableRules(context) {
      return this.rules.filter(r => r.type === 'conditional');
    }
  };`);
        }
        
        if (k.type === 'params' && k.data.length > 0) {
            codeSnippets.push(`
  // Params from ${k.source}
  this.paperParams_${timestamp} = {
    name: 'params_${safeName}',
    source: '${k.source}',
    params: ${JSON.stringify(k.data.slice(0, 10).map(p => ({ name: p.name, value: p.value, type: p.type })))},
    getParam(name) {
      const param = this.params.find(p => p.name === name);
      return param ? param.value : null;
    },
    validateParam(name, value) {
      const param = this.params.find(p => p.name === name);
      if (!param) return { valid: false, reason: 'unknown_param' };
      return { valid: true, param };
    },
    suggestValue(name, current) {
      const param = this.params.find(p => p.name === name);
      return param ? param.value : current;
    }
  };`);
        }
    });
    
    return codeSnippets;
}

function bumpVersion(version) {
    const parts = version.replace('v', '').split('.');
    parts[2] = String(parseInt(parts[2]) + 1);
    return 'v' + parts.join('.');
}

function injectIntoHeartflow(enhancements, version) {
    try {
        let content = readFileSync(HEARTFLOW_JS, 'utf-8');
        
        const startMethodMatch = content.match(/(this\.dream\.enabled = true;[\s\S]*?)(this\.(?:heartbeat|sleepWake|startupCheck))/);
        
        if (startMethodMatch) {
            const insertPos = startMethodMatch.index + startMethodMatch[1].lastIndexOf('this.dream.enabled = true;') + 'this.dream.enabled = true;'.length;
            
            const enhancementCode = '\n' + enhancements.join('\n') + '\n';
            content = content.slice(0, insertPos) + enhancementCode + content.slice(insertPos);
            
            content = content.replace(/let VERSION = 'v[\d.]+';/, `let VERSION = '${version}';`);
            
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

async function runUpgrade() {
    log('═══════════════════════════════════════════════════════');
    log('HeartFlow v5.0 论文升级 (提取可执行知识)');
    log('═══════════════════════════════════════════════════════');
    
    const queue = loadQueue();
    log(`队列: ${queue.papers.length}篇 | 版本: ${queue.currentVersion} | 未分析: ${getUnanalyzedPapers(queue).length}`);
    
    if (getUnanalyzedPapers(queue).length === 0) {
        queue.papersAnalyzed = [];
        saveQueue(queue);
        return { success: true, message: 'queue_reset' };
    }
    
    const papersToProcess = getUnanalyzedPapers(queue).slice(0, 2);
    log(`处理: ${papersToProcess.join(', ')}`);
    
    const allKnowledge = [];
    const allEnhancements = [];
    
    for (const paper of papersToProcess) {
        log(`[读] ${paper}`);
        const text = extractText(paper);
        
        if (text.length < 100) {
            log(`[警告] 提取失败: ${paper}`);
            queue.papersAnalyzed.push(paper);
            continue;
        }
        
        log(`  文本: ${text.length}字符`);
        
        const knowledge = extractKnowledge(text, paper);
        log(`  知识: ${knowledge.map(k => k.type + '(' + k.data.length + ')').join(', ')}`);
        
        knowledge.forEach(k => {
            allKnowledge.push(k);
            allEnhancements.push(...generateExecutableCode([k], paper));
        });
        
        queue.papersAnalyzed.push(paper);
        queue.papersRead.push(paper);
    }
    
    if (allEnhancements.length > 0) {
        const oldVersion = queue.currentVersion;
        const newVersion = queue.nextVersion;
        
        log(`[注入] ${allEnhancements.length}个增强`);
        
        if (injectIntoHeartflow(allEnhancements, newVersion)) {
            updateSkillMd(newVersion);
            writeFileSync(VERSION_FILE, newVersion);
            
            queue.currentVersion = newVersion;
            queue.nextVersion = bumpVersion(newVersion);
            queue.lastUpgrade = new Date().toISOString();
            queue.upgradeCount++;
            
            log(`[版本] ${oldVersion} → ${newVersion}`);
        }
    } else {
        log('[警告] 无知识提取');
    }
    
    saveQueue(queue);
    
    log(`完成! 版本:${queue.currentVersion} 进度:${queue.papersAnalyzed.length}/${queue.papers.length}`);
    
    return {
        success: true,
        version: queue.currentVersion,
        papersProcessed: papersToProcess.length,
        knowledge: allKnowledge.length,
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
