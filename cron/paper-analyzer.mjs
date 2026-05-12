/**
 * HeartFlow Paper Analyzer v0.13.11
 * 从论文中提取代码模式和算法
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SKILL_DIR = '/Users/apple/.hermes/skills/ai/mark-heartflow-skill';
const PAPERS_DIR = '/Users/apple/Downloads/daima';
const OUTPUT_DIR = join(SKILL_DIR, 'cron', 'analyzed');

mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * 论文分析器 - 提取代码模式和算法思想
 */
export class PaperAnalyzer {
    constructor() {
        this.patterns = {
            // 代码模式
            algorithms: [
                /for\s*\([^)]+\)\s*{[\s\S]*?}/g,
                /while\s*\([^)]+\)\s*{[\s\S]*?}/g,
                /if\s*\([^)]+\)\s*{[\s\S]*?}/g,
                /function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?}/g,
                /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*{[\s\S]*?}/g,
                /class\s+\w+\s*{[\s\S]*?constructor[\s\S]*?}/g
            ],
            // 架构模式
            architecture: [
                /EventBus|event\s*bus|pub\s*sub/i,
                /Factory|factory\s*pattern/i,
                /Observer|observer\s*pattern/i,
                /Middleware|middleware/i,
                /Pipeline|pipeline/i,
                /State\s*Machine|state\s*machine/i
            ],
            // AI/ML模式
            aiPatterns: [
                /ReAct|react\s+reasoning/i,
                /Reflexion|reflexion/i,
                /Self\s*Refine|self\s*refine/i,
                /Chain\s*of\s*Thought|cot/i,
                /Tree\s*of\s*Thoughts|tot/i,
                /Memory\s*Layer|memory\s*layer/i,
                /Working\s*Memory|working\s*memory/i,
                /Episodic\s*Memory|episodic\s*memory/i,
                /Semantic\s*Memory|semantic\s*memory/i
            ]
        };
    }

    /**
     * 分析论文文本
     * @param {string} text - 论文文本
     * @param {string} paperName - 论文名
     * @returns {object} 分析结果
     */
    analyze(text, paperName) {
        const result = {
            paper: paperName,
            timestamp: new Date().toISOString(),
            algorithms: [],
            architecture: [],
            aiPatterns: [],
            codeSnippets: [],
            insights: []
        };

        // 提取算法相关文本
        for (const pattern of this.patterns.aiPatterns) {
            const matches = text.match(new RegExp(pattern, 'gi'));
            if (matches) {
                result.aiPatterns.push(...new Set(matches));
            }
        }

        // 提取架构模式
        for (const pattern of this.patterns.architecture) {
            const matches = text.match(new RegExp(pattern, 'gi'));
            if (matches) {
                result.architecture.push(...new Set(matches));
            }
        }

        // 提取代码片段 (寻找类似代码的文本块)
        const codeBlocks = text.match(/```[\s\S]*?```/g);
        if (codeBlocks) {
            result.codeSnippets = codeBlocks.map(block => 
                block.replace(/```\w*\n?/g, '').trim()
            ).filter(s => s.length > 20);
        }

        // 提取关键段落（AI相关）
        const paragraphs = text.split(/\n\n+/);
        for (const para of paragraphs) {
            if (para.length > 100 && para.length < 1000) {
                const hasAI = this.patterns.aiPatterns.some(p => p.test(para));
                const hasArch = this.patterns.architecture.some(p => p.test(para));
                if (hasAI || hasArch) {
                    result.insights.push({
                        text: para.substring(0, 500),
                        types: {
                            ai: hasAI,
                            architecture: hasArch
                        }
                    });
                }
            }
        }

        return result;
    }

    /**
     * 生成升级代码
     * @param {object} analysis - 分析结果
     * @returns {string} 生成的代码
     */
    generateUpgradeCode(analysis) {
        const code = [];
        code.push(`/**
 * HeartFlow v0.13.11 Upgrade Module
 * Source: ${analysis.paper}
 * Generated: ${analysis.timestamp}
 */`);

        code.push('');
        code.push('// AI Patterns Detected:');
        for (const pattern of analysis.aiPatterns) {
            code.push(`//   - ${pattern}`);
        }

        code.push('');
        code.push('// Architecture Patterns Detected:');
        for (const pattern of analysis.architecture) {
            code.push(`//   - ${pattern}`);
        }

        if (analysis.codeSnippets.length > 0) {
            code.push('');
            code.push('// Code Snippets:');
            for (let i = 0; i < Math.min(3, analysis.codeSnippets.length); i++) {
                code.push(`// --- Snippet ${i + 1} ---`);
                code.push(analysis.codeSnippets[i].substring(0, 500));
            }
        }

        code.push('');
        code.push('export const upgrade_v0_13_11 = {');
        code.push(`    version: "v0.13.11",`);
        code.push(`    source: "${analysis.paper}",`);
        code.push(`    patterns: ${JSON.stringify(analysis.aiPatterns)},`);
        code.push(`    insights: ${analysis.insights.length},`);
        code.push('    apply: function(core) {');
        code.push('        // 应用升级逻辑');
        code.push('        return { success: true };');
        code.push('    }');
        code.push('};');

        return code.join('\n');
    }
}

/**
 * 运行论文分析
 */
export async function runPaperUpgrade() {
    const queuePath = join(SKILL_DIR, 'cron', 'paper-upgrade-queue.json');
    const queue = JSON.parse(readFileSync(queuePath, 'utf-8'));
    
    const analyzer = new PaperAnalyzer();
    const papersToRead = 2;
    let processed = 0;

    console.log(`[PaperAnalyzer] Starting upgrade cycle...`);
    console.log(`[PaperAnalyzer] Current version: ${queue.currentVersion}`);
    console.log(`[PaperAnalyzer] Target version: ${queue.nextVersion}`);

    for (let i = queue.papersIndex; i < queue.papers.length && processed < papersToRead; i++) {
        const paper = queue.papers[i];
        
        if (queue.papersRead.includes(paper)) {
            continue;
        }

        const paperPath = join(PAPERS_DIR, paper);
        
        // 尝试使用nano-pdf提取文本
        let text = '';
        try {
            const { execSync } = await import('child_process');
            if (existsSync('/opt/homebrew/bin/nano-pdf')) {
                text = execSync(`nano-pdf "${paperPath}" 2>/dev/null`, { 
                    encoding: 'utf-8',
                    maxBuffer: 1024 * 1024 * 10
                }).substring(0, 50000);
            } else if (existsSync('/usr/local/bin/pdftotext')) {
                text = execSync(`pdftotext "${paperPath}" - 2>/dev/null`, { 
                    encoding: 'utf-8',
                    maxBuffer: 1024 * 1024 * 10
                }).substring(0, 50000);
            }
        } catch (e) {
            console.log(`[PaperAnalyzer] Failed to extract text from ${paper}: ${e.message}`);
        }

        if (!text) {
            console.log(`[PaperAnalyzer] No text extracted from ${paper}`);
            continue;
        }

        // 分析论文
        const analysis = analyzer.analyze(text, paper);
        
        // 保存分析结果
        const analysisPath = join(OUTPUT_DIR, `${paper}.analysis.json`);
        writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
        console.log(`[PaperAnalyzer] Analyzed: ${paper}`);
        console.log(`[PaperAnalyzer]   - AI Patterns: ${analysis.aiPatterns.length}`);
        console.log(`[PaperAnalyzer]   - Architecture: ${analysis.architecture.length}`);
        console.log(`[PaperAnalyzer]   - Code Snippets: ${analysis.codeSnippets.length}`);

        // 生成升级代码
        const upgradeCode = analyzer.generateUpgradeCode(analysis);
        const upgradePath = join(OUTPUT_DIR, `${paper}.upgrade.js`);
        writeFileSync(upgradePath, upgradeCode);

        // 更新队列
        queue.papersRead.push(paper);
        queue.papersIndex = i + 1;
        processed++;
    }

    // 检查是否触发升级
    if (queue.papersRead.length % 5 === 0 && queue.papersRead.length > 0) {
        console.log(`[PaperAnalyzer] Triggering version upgrade!`);
        
        // 创建升级文件
        const upgradeVersion = queue.nextVersion;
        const upgradeDir = join(SKILL_DIR, 'upgrades', upgradeVersion);
        mkdirSync(upgradeDir, { recursive: true });
        
        // 生成主升级模块
        const mainUpgrade = `
/**
 * HeartFlow ${upgradeVersion} Upgrade
 * Papers processed: ${queue.papersRead.length}
 * Upgrade date: ${new Date().toISOString()}
 */

// 本次升级整合的论文分析
export const papers = ${JSON.stringify(queue.papersRead.slice(-5), null, 2)};

// 升级逻辑
export function applyUpgrade(core) {
    // 整合论文中的算法和模式
    return {
        success: true,
        version: "${upgradeVersion}",
        changes: []
    };
}
`;
        writeFileSync(join(upgradeDir, 'index.js'), mainUpgrade);
        
        // 更新版本
        const [major, minor, patch] = queue.nextVersion.replace('v', '').split('.');
        queue.currentVersion = queue.nextVersion;
        queue.nextVersion = `v${major}.${minor}.${parseInt(patch) + 1}`;
        queue.lastUpgradeDate = new Date().toISOString();
        queue.upgradeCount++;
    }

    // 保存队列
    writeFileSync(queuePath, JSON.stringify(queue, null, 2));
    console.log(`[PaperAnalyzer] Cycle complete. Progress: ${queue.papersRead.length}/${queue.papers.length}`);
    
    return queue;
}

// 如果直接运行
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runPaperUpgrade().catch(console.error);
}

export default { PaperAnalyzer, runPaperUpgrade };
