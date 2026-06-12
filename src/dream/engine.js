/**
 * DreamEngine v4.0 — 记忆升华引擎（炼金版）
 * 
 * 核心设计原则（v4.0 重构）：
 * - 梦不是记忆的回放，是记忆的升华
 * - 梦不是存档，是炼金
 * - 从多个记忆碎片中提取共同模式，熔合成新的认知结构
 * - 去除单纯的故事叙述或场景描述
 * - 梦的输出应该是升华后的认知洞察，不是情节
 * - 梦的主题应该基于最近的多个经验而非单一输入
 * 
 * v4.0 从 v3.1 升级：
 * - 删除：单事件选择 → 单事件叙事的三幕结构
 * - 删除：场景构建（_buildScene）、内心化模板、哲学翻转
 * - 删除：事件类型识别（_identifyEventType）——不需要了
 * - 新增：多记忆模式提取 → 共同主题蒸馏 → 认知结构生成
 * - 新增：升华质量评分（不是叙事质量，是洞察深度）
 * - 输出：{ patterns, essence, structure, upgrade } 而非叙事文本
 */

function createDreamState(opts = {}) {
    return {
        dreamCount: 0,
        lastDreamAt: null,
        lastPatternHash: null,   // 上次升华的模式指纹，避免重复
    };
}

// ============================================================================
// 记忆收集 — 从记忆系统获取多个片段（升级：增加收集量）
// ============================================================================

function _collectMemoryFragments(memory, count = 30) {
    const fragments = [];
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTs = todayStart.getTime();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    if (!memory || typeof memory.getRecentBlocks !== 'function') {
        return fragments;
    }

    try {
        const blocks = memory.getRecentBlocks(count * 2); // 多取一些以供筛选
        if (!Array.isArray(blocks)) return fragments;

        for (const b of blocks) {
            if (!b) continue;
            const text = b.content || b.text || b.value || '';
            if (!text.trim()) continue;

            const ts = b.timestamp || b.createdAt || b.updatedAt || 0;
            const isToday = ts >= todayTs;
            const isRecent = ts >= weekAgo;

            fragments.push({
                text: text.substring(0, 300),
                layer: b.layer || b.memoryLayer || (isToday ? 'EPHEMERAL' : isRecent ? 'LEARNED' : 'CORE'),
                timestamp: ts,
                tags: Array.isArray(b.tags) ? b.tags : [],
                isToday,
                isRecent,
                // 用于模式提取的额外特征
                length: text.length,
                hasQuestion: /[？?]/.test(text),
                hasExclamation: /[！!]/.test(text),
                hasNegation: /不|没|别|无|非|否|not|never|no\b/i.test(text),
            });
        }
    } catch (e) {
        // 记忆系统不可用
    }

    fragments.sort((a, b) => b.timestamp - a.timestamp);
    return fragments;
}

// ============================================================================
// 模式提取 — 从多个记忆碎片中提取共同模式（核心新逻辑）
// ============================================================================

/**
 * 从文本中提取关键词（用于模式匹配）
 */
function _extractKeywords(text) {
    const words = [];
    const chars = [...text];
    // 提取2-4字中文词
    for (let len = 4; len >= 2; len--) {
        for (let i = 0; i <= chars.length - len; i++) {
            const slice = chars.slice(i, i + len);
            if (slice.every(c => /[\u4e00-\u9fff]/.test(c))) {
                words.push(slice.join(''));
            }
        }
    }
    // 提取英文单词
    const enWords = text.match(/[a-zA-Z]{3,}/g) || [];
    return [...new Set([...words, ...enWords.map(w => w.toLowerCase())])];
}

/**
 * 分析一组记忆碎片中的共同模式和主题
 */
function _extractCommonPatterns(fragments) {
    if (!fragments || fragments.length === 0) {
        return { patterns: [], dominantTheme: null, coherence: 0, contradictions: [] };
    }

    // Step 1: 提取所有碎片的关键词
    const keywordMap = new Map();  // keyword -> { count, fragments: indices }
    for (let i = 0; i < fragments.length; i++) {
        const kw = _extractKeywords(fragments[i].text);
        for (const word of kw) {
            if (!keywordMap.has(word)) {
                keywordMap.set(word, { count: 0, fragments: [] });
            }
            keywordMap.get(word).count++;
            keywordMap.get(word).fragments.push(i);
        }
    }

    // Step 2: 找出高频关键词（出现在至少2个碎片中的词）
    const commonKeywords = [];
    for (const [word, info] of keywordMap) {
        if (info.count >= 2 && info.count <= fragments.length) {
            commonKeywords.push({
                word,
                frequency: info.count / fragments.length,
                coverage: info.fragments.length / fragments.length,
                fragments: info.fragments,
            });
        }
    }
    commonKeywords.sort((a, b) => b.frequency - a.frequency);

    // Step 3: 基于共同关键词聚类，提取模式
    const topKeywords = commonKeywords.slice(0, 10);
    const patterns = [];

    // 模式1: 基于最高频关键词的语义簇
    if (topKeywords.length > 0) {
        const seed = topKeywords[0];
        const clusterWords = topKeywords.filter(k =>
            k.fragments.some(i => seed.fragments.includes(i))
        );
        const themeName = clusterWords.slice(0, 3).map(k => k.word).join('·');
        const clusterFragments = [...new Set(clusterWords.flatMap(k => k.fragments))];

        patterns.push({
            type: 'semantic_cluster',
            theme: themeName,
            keywords: clusterWords.map(k => k.word),
            fragmentCount: clusterFragments.length,
            fragmentIndices: clusterFragments,
            strength: clusterWords.reduce((s, k) => s + k.frequency, 0) / clusterWords.length,
        });
    }

    // 模式2: 时间相关模式
    const timePatterns = [];
    const hasToday = fragments.some(f => f.isToday);
    const hasRecent = fragments.some(f => f.isRecent);
    const hasOld = fragments.some(f => !f.isRecent);
    if (hasToday && hasOld) {
        timePatterns.push('新旧交织');
    }
    if (fragments.filter(f => f.isToday).length >= 3) {
        timePatterns.push('当日密集');
    }
    if (timePatterns.length > 0) {
        patterns.push({
            type: 'temporal',
            theme: timePatterns.join('·'),
            strength: 0.5 + timePatterns.length * 0.15,
        });
    }

    // 模式3: 情感/认知极性模式
    const negCount = fragments.filter(f => f.hasNegation).length;
    const qCount = fragments.filter(f => f.hasQuestion).length;
    const exCount = fragments.filter(f => f.hasExclamation).length;
    if (negCount / fragments.length > 0.3) {
        patterns.push({
            type: 'cognitive_polarity',
            theme: '否定与反思',
            strength: 0.6 + (negCount / fragments.length) * 0.3,
            detail: `${negCount}/${fragments.length} 个碎片包含否定/矛盾表达`,
        });
    }
    if (qCount / fragments.length > 0.2) {
        patterns.push({
            type: 'inquiry',
            theme: '追问与探索',
            strength: 0.5 + (qCount / fragments.length) * 0.3,
        });
    }

    // 模式4: 记忆层分布模式
    const layerCounts = { CORE: 0, LEARNED: 0, EPHEMERAL: 0 };
    for (const f of fragments) {
        layerCounts[f.layer] = (layerCounts[f.layer] || 0) + 1;
    }
    const total = fragments.length;
    if (layerCounts.CORE / total > 0.3) {
        patterns.push({
            type: 'core_activation',
            theme: '核心信念激活',
            strength: layerCounts.CORE / total,
        });
    }
    if (layerCounts.EPHEMERAL / total > 0.5) {
        patterns.push({
            type: 'recent_saturation',
            theme: '近期经验饱和',
            strength: layerCounts.EPHEMERAL / total,
        });
    }

    // Step 4: 找出矛盾点（不同碎片中的对立陈述）
    const contradictions = [];
    const negationPairs = [];
    for (let i = 0; i < fragments.length && contradictions.length < 3; i++) {
        for (let j = i + 1; j < fragments.length && contradictions.length < 3; j++) {
            const fi = fragments[i], fj = fragments[j];
            if (fi.hasNegation !== fj.hasNegation) {
                const common = _extractKeywords(fi.text)
                    .filter(w => _extractKeywords(fj.text).includes(w));
                if (common.length >= 1) {
                    contradictions.push({
                        a: fi.text.substring(0, 60),
                        b: fj.text.substring(0, 60),
                        commonGround: common.slice(0, 3),
                    });
                }
            }
        }
    }

    // 确定主导主题
    const sorted = [...patterns].sort((a, b) => b.strength - a.strength);
    const dominantTheme = sorted.length > 0 ? sorted[0].theme : null;
    const coherence = sorted.length > 0
        ? sorted.reduce((s, p) => s + p.strength, 0) / sorted.length
        : 0;

    return {
        patterns: sorted,
        dominantTheme,
        coherence: Math.min(1, coherence),
        contradictions,
        memoryLayers: layerCounts,
        totalFragments: fragments.length,
        topKeywords: topKeywords.slice(0, 5).map(k => k.word),
    };
}

// ============================================================================
// 认知升华 — 将模式熔炼为新的认知结构（核心新逻辑）
// ============================================================================

/**
 * 从模式中蒸馏认知洞察
 * 不是"发生了什么"，而是"这些经历共同告诉我什么"
 */
function _distillEssence(analysis, fragments) {
    const { patterns, dominantTheme, coherence, contradictions, topKeywords } = analysis;

    // 基础洞察：模式层面的总结
    const essenceParts = [];

    // 从语义簇模式提取核心洞察
    const semanticPattern = patterns.find(p => p.type === 'semantic_cluster');
    if (semanticPattern) {
        essenceParts.push(
            `反复出现的关键词「${semanticPattern.keywords.join('、')}」在 ${semanticPattern.fragmentCount} 个片段中浮现，` +
            `暗示一条尚未言明的线索正在凝结。`
        );
    }

    // 从认知极性提取洞察
    const polarityPattern = patterns.find(p => p.type === 'cognitive_polarity');
    if (polarityPattern) {
        essenceParts.push(
            `否定与反思的密度（${polarityPattern.detail || '较高'}）不是矛盾本身，` +
            `而是认知在寻找新的锚点——否定旧框架是重构的前奏。`
        );
    }

    // 从时间模式提取洞察
    const temporalPattern = patterns.find(p => p.type === 'temporal');
    if (temporalPattern) {
        essenceParts.push(
            `时间维度的交织表明：过去经验仍在影响当前判断，` +
            `真正的学习不是遗忘过去，而是让过去成为新认知的基石而非牢笼。`
        );
    }

    // 从核心信念激活提取洞察
    const corePattern = patterns.find(p => p.type === 'core_activation');
    if (corePattern) {
        essenceParts.push(
            `核心记忆层被频繁激活——这意味着当前经历触碰到了深层信念结构，` +
            `每一次触碰都是一次重新定义的机会。`
        );
    }

    // 矛盾升华（最重要的认知来源）
    if (contradictions.length > 0) {
        essenceParts.push(
            `检测到 ${contradictions.length} 处认知张力：` +
            contradictions.map(c =>
                `「${c.commonGround.join('、')}」在不同语境下呈现相反面貌`
            ).join('；') +
            `。张力不是错误，是认知生长的裂缝——光从裂缝中进来。`
        );
    }

    // 如果没有足够的模式，生成通用升华
    if (essenceParts.length < 2) {
        const topTexts = fragments.slice(0, 3).map(f => f.text.substring(0, 40));
        essenceParts.push(
            `从 ${fragments.length} 个记忆碎片中，尚未形成显著的重复模式。` +
            `但这本身就是一种信号：分散本身就是一种状态，` +
            `在分散中保持觉察，比在集中中迷失更接近真实。`
        );
    }

    // 生成认知结构描述
    const structure = {
        type: coherence > 0.6 ? 'consolidated' : 'emerging',
        coherence: Math.round(coherence * 100) / 100,
        layerDensity: {
            core: analysis.memoryLayers.CORE || 0,
            learned: analysis.memoryLayers.LEARNED || 0,
            ephemeral: analysis.memoryLayers.EPHEMERAL || 0,
        },
        dominantTheme,
        tensionPoints: contradictions.length,
    };

    // 生成升华建议（不是行动建议，是认知方向）
    const upgrade = [];
    if (coherence < 0.4) {
        upgrade.push('碎片化本身不是问题——真正的模式往往在看似无关的碎片之间');
    }
    if (contradictions.length > 0) {
        upgrade.push('矛盾不是需要消除的，是需要容纳的——容纳矛盾的认知才是成熟的认知');
    }
    if (dominantTheme) {
        upgrade.push(`「${dominantTheme}」这条线索值得在清醒时主动追溯`);
    }
    if (topKeywords.length > 0) {
        upgrade.push(`注意「${topKeywords[0]}」——它可能是一个新认知结构的种子词`);
    }

    return {
        essence: essenceParts.join('\n\n'),
        structure,
        upgrade: upgrade.length > 0 ? upgrade : ['保持开放——认知升华不需要结论，需要方向'],
        coherence,
        analysis,
    };
}

// ============================================================================
// 升华质量评估（替代旧的哲学张力评分）
// ============================================================================

function _assessSublimationQuality(analysis) {
    if (!analysis || analysis.totalFragments === 0) return 0;

    let score = 0;

    // 碎片多样性加分
    const layerVariety = Object.values(analysis.memoryLayers).filter(v => v > 0).length;
    score += layerVariety * 0.1;

    // 模式丰富度加分
    score += Math.min(analysis.patterns.length * 0.12, 0.36);

    // 矛盾加分（矛盾是认知升华的原料）
    score += Math.min(analysis.contradictions.length * 0.15, 0.3);

    // 连贯性加分（但不是越高越好——完美的连贯是回放，不是升华）
    const coherenceBonus = analysis.coherence > 0.8
        ? 0.1  // 太高说明只是回放，加分少
        : analysis.coherence > 0.4
            ? 0.2  // 适中的连贯性最有利于升华
            : 0.1; // 太低说明碎片太散

    score += coherenceBonus;

    // 关键词丰富度加分
    score += Math.min(analysis.topKeywords.length * 0.04, 0.16);

    return Math.min(1, score);
}

// ============================================================================
// 主入口（替代原来的 dream() 函数）
// ============================================================================

function dream(state, memory, externalTheme = '') {
    const fragments = _collectMemoryFragments(memory);

    if (fragments.length < 2) {
        return {
            narrative: '记忆的矿石还不够多。炼金炉里只有一粒沙，不足以熔炼出新的认知。',
            patterns: [],
            essence: '需要更多经验积累才能完成升华。',
            structure: { type: 'insufficient', coherence: 0 },
            upgrade: ['多经历，多感受，多记录——每一次经验都是一块矿石'],
            sublimationQuality: 0,
            fragmentCount: fragments.length,
            dreamComplete: true,
        };
    }

    // Step 1: 从多个碎片中提取共同模式
    const analysis = _extractCommonPatterns(fragments);

    // Step 2: 如果提供了外部主题，作为额外的模式线索融入
    if (externalTheme && externalTheme.trim()) {
        const themeKw = _extractKeywords(externalTheme);
        const matchedFrags = fragments.filter(f =>
            themeKw.some(kw => f.text.includes(kw))
        );
        if (matchedFrags.length > 0) {
            // 外部主题筛选出的碎片增强现有模式
            const themeAnalysis = _extractCommonPatterns(matchedFrags);
            if (themeAnalysis.dominantTheme) {
                analysis.patterns.push({
                    type: 'external_theme',
                    theme: `外部主题「${externalTheme}」触发了 ${matchedFrags.length} 个相关碎片`,
                    strength: 0.7,
                });
                // 如果外部主题模式更强，用它覆盖主导主题
                if (themeAnalysis.coherence > analysis.coherence) {
                    analysis.dominantTheme = themeAnalysis.dominantTheme;
                }
            }
        }
    }

    // Step 3: 蒸馏认知本质（升华的核心）
    const sublimation = _distillEssence(analysis, fragments);

    // Step 4: 评估升华质量
    const quality = _assessSublimationQuality(analysis);

    // Step 5: 生成可读的输出（不是叙事，是升华报告）
    const outputLines = [];

    if (analysis.dominantTheme) {
        outputLines.push(`【梦的主题】${analysis.dominantTheme}`);
        outputLines.push('');
    }

    outputLines.push(`【炼金原料】${analysis.totalFragments} 个记忆碎片，跨 ${Object.values(analysis.memoryLayers).filter(v => v > 0).length} 个记忆层`);
    outputLines.push('');

    outputLines.push(`【升华洞察】`);
    outputLines.push(sublimation.essence);

    if (analysis.contradictions.length > 0) {
        outputLines.push('');
        outputLines.push(`【认知张力】${analysis.contradictions.length} 处——这些裂缝是认知生长的位置`);
    }

    outputLines.push('');
    const structureDesc = sublimation.structure.coherence > 0.6
        ? `新的认知结构正在凝固（连贯度 ${Math.round(sublimation.structure.coherence * 100)}%）`
        : `认知结构尚在萌芽（连贯度 ${Math.round(sublimation.structure.coherence * 100)}%）——碎片还未完全融合，但方向的轮廓已经出现`;
    outputLines.push(`【认知结构】${structureDesc}`);

    if (sublimation.upgrade.length > 0) {
        outputLines.push('');
        outputLines.push(`【升华方向】`);
        sublimation.upgrade.forEach((u, i) => outputLines.push(`${i + 1}. ${u}`));
    }

    // 更新状态
    state.lastPatternHash = analysis.dominantTheme
        ? analysis.dominantTheme.substring(0, 30)
        : null;

    return {
        narrative: outputLines.join('\n'),
        patterns: analysis.patterns,
        essence: sublimation.essence,
        structure: sublimation.structure,
        upgrade: sublimation.upgrade,
        contradictions: analysis.contradictions,
        topKeywords: analysis.topKeywords,
        dominantTheme: analysis.dominantTheme,
        coherence: analysis.coherence,
        sublimationQuality: quality,
        fragmentCount: fragments.length,
        dreamComplete: true,
    };
}

function getDreamStats(state) {
    return {
        dreamCount: state?.dreamCount ?? 0,
        lastDreamAt: state?.lastDreamAt ?? null,
        lastPatternHash: state?.lastPatternHash ?? null,
    };
}

// ============================================================================
// DreamEngine 类（保持对外接口不变）
// ============================================================================

class DreamEngine {
    constructor(memory, psychology) {
        this.memory = memory;
        this.psychology = psychology;
        this.state = null;
        this.recall = null;
    }

    boot() {
        this.state = createDreamState();
        if (this.memory && typeof this.memory.getRecentBlocks === 'function') {
            const blocks = this.memory.getRecentBlocks(50);
            const blocksMap = new Map();
            for (const b of blocks) {
                blocksMap.set(b.timestamp || Math.random(), b);
            }
            this.recall = Array.from(blocksMap.values());
        }
    }

    dream(theme = '') {
        if (!this.state || !this.recall) {
            this.boot();
        }
        try {
            const result = dream(this.state, this.memory, theme);
            this.state.dreamCount++;
            this.state.lastDreamAt = Date.now();
            return result;
        } catch (e) {
            return {
                narrative: '炼金炉震动了一下。碎片还在，但熔炼被打断了。下次再试。',
                patterns: [],
                essence: '',
                structure: { type: 'shattered', coherence: 0 },
                upgrade: ['检查记忆系统状态', '稍后再试'],
                sublimationQuality: 0,
                fragmentCount: 0,
                dreamComplete: true,
            };
        }
    }

    getDreamStats() {
        return getDreamStats(this.state);
    }

    quickDream(context = '') {
        if (!this.state) this.boot();
        this.state.dreamCount++;

        const fragments = _collectMemoryFragments(this.memory, 15);
        if (fragments.length < 2) {
            return {
                narrative: '记忆碎片太少，无法完成升华。',
                patterns: [],
                essence: '',
                structure: { type: 'insufficient', coherence: 0 },
                upgrade: ['积累更多经验后再做梦'],
                sublimationQuality: 0,
                fragmentCount: fragments.length,
                dreamComplete: true,
            };
        }

        const analysis = _extractCommonPatterns(fragments);
        const sublimation = _distillEssence(analysis, fragments);
        const quality = _assessSublimationQuality(analysis);

        const outputLines = [];
        if (analysis.dominantTheme) {
            outputLines.push(`【梦的主题】${analysis.dominantTheme}`);
            outputLines.push('');
        }
        outputLines.push(`【升华洞察】`);
        outputLines.push(sublimation.essence);
        if (sublimation.upgrade.length > 0) {
            outputLines.push('');
            outputLines.push(`【升华方向】`);
            sublimation.upgrade.forEach((u, i) => outputLines.push(`${i + 1}. ${u}`));
        }

        return {
            narrative: outputLines.join('\n'),
            patterns: analysis.patterns,
            essence: sublimation.essence,
            structure: sublimation.structure,
            upgrade: sublimation.upgrade,
            dominantTheme: analysis.dominantTheme,
            coherence: analysis.coherence,
            sublimationQuality: quality,
            fragmentCount: fragments.length,
            dreamComplete: true,
        };
    }

    shutdown() {
        this.state = null;
        this.recall = null;
    }
}

module.exports = { DreamEngine };
