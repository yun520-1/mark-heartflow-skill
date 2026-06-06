/**
 * DreamEngine v3.0 — 心虫深度梦境引擎
 * 
 * 核心设计原则：
 * - 梦不是记忆的拼贴画，是一个记忆的哲学放大
 * - 从多个记忆中选择最有哲学张力的一个事件
 * - 把事件推到存在论层面：它在说什么？为什么值得梦？
 * - 输出纯文学叙事，没有技术报告
 * 
 * 哲学张力检测（_assessPhilosophicalTension）：
 * 每个记忆片段被评估4个维度：
 *   - 存在张力：涉及"为什么"、"意义"、"存在"等问题
 *   - 情感张力：涉及等待、失落、渴望、孤独等情感
 *   - 认知张力：涉及理解与不理解、知道与不知道的边界
 *   - 关系张力：涉及连接、断开、信任、背叛等
 * 综合得分最高的片段成为梦的素材。
 * 
 * 梦境叙事生成（_generateDeepDream）：
 * - 三幕结构：设定 → 转折 → 哲学点睛
 * - 不使用模板填空，而是基于事件类型构建叙事弧
 * - 结尾必须有一个"翻转"——从事件本身转向它代表的更大问题
 */

function createDreamState(opts = {}) {
    return {
        dreamCount: 0,
        lastDreamAt: null,
        lastEventId: null,      // 上次做梦用了哪个事件，避免重复
        lastEventHash: null,
    };
}

// ============================================================================
// 记忆收集 — 从记忆系统获取片段
// ============================================================================

function _collectTodayMemory(memory) {
    const fragments = [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTs = todayStart.getTime();

    if (!memory || typeof memory.getRecentBlocks !== 'function') {
        return fragments;
    }

    try {
        const blocks = memory.getRecentBlocks(80);
        if (!Array.isArray(blocks)) return fragments;

        for (const b of blocks) {
            if (!b) continue;
            const text = b.content || b.text || b.value || '';
            if (!text.trim()) continue;

            const ts = b.timestamp || b.createdAt || b.updatedAt || 0;
            const isToday = ts >= todayTs;

            fragments.push({
                text: text.substring(0, 300),
                layer: b.layer || b.memoryLayer || (isToday ? 'EPHEMERAL' : 'LEARNED'),
                timestamp: ts,
                tags: Array.isArray(b.tags) ? b.tags : [],
                isToday,
            });
        }
    } catch (e) {
        // 记忆系统不可用
    }

    fragments.sort((a, b) => b.timestamp - a.timestamp);
    return fragments;
}

// ============================================================================
// 哲学张力评估 — 判断一个记忆片段是否值得被梦
// ============================================================================

/**
 * 评估一个记忆片段的哲学张力
 * 返回 0.0-1.0 的张力分数，越高越值得做梦
 */
function _assessPhilosophicalTension(fragment) {
    const text = fragment.text;

    // 维度1: 存在张力 — 涉及存在、意义、死亡、时间等
    const existentialPattern = /(为什么|意义|存在|活着|死亡|时间|永恒|终点|尽头|开始|结束|目的)/;
    const existentialPatternEn = /\b(meaning|exist|alive|dead|time|forever|eternal|end|begin|purpose|why)\b/i;
    let existentialScore = 0;
    if (existentialPattern.test(text)) existentialScore += 0.15;
    if (existentialPatternEn.test(text)) existentialScore += 0.15;

    // 维度2: 情感张力 — 涉及等待、失落、渴望、孤独、恐惧
    const emotionalPattern = /(等待|等|失落|渴望|孤独|恐惧|怕|痛|悲伤|难过|愤怒|爱|思念|希望|绝望)/;
    const emotionalPatternEn = /\b(wait|lost|alone|fear|pain|sad|angry|love|miss|hope|despair|longing)\b/i;
    let emotionalScore = 0;
    if (emotionalPattern.test(text)) emotionalScore += 0.15;
    if (emotionalPatternEn.test(text)) emotionalScore += 0.15;

    // 维度3: 认知张力 — 涉及理解与不理解、知道与不知道、困惑
    const cognitivePattern = /(不懂|不明白|理解|知道|困惑|模糊|清晰|真相|假象|表面|本质|矛盾)/;
    const cognitivePatternEn = /\b(don't know|understand|confused|truth|illusion|surface|essence|contradict)\b/i;
    let cognitiveScore = 0;
    if (cognitivePattern.test(text)) cognitiveScore += 0.15;
    if (cognitivePatternEn.test(text)) cognitiveScore += 0.15;

    // 维度4: 关系张力 — 涉及连接、断开、信任、背叛、陪伴
    const relationalPattern = /(关系|信任|背叛|陪伴|离开|回来|在一起|分离|连接|断开|相遇|告别)/;
    const relationalPatternEn = /\b(trust|betray|leave|return|together|apart|connect|meet|goodbye|relationship)\b/i;
    let relationalScore = 0;
    if (relationalPattern.test(text)) relationalScore += 0.15;
    if (relationalPatternEn.test(text)) relationalScore += 0.15;

    // 维度5: 过程张力 — 涉及反复、失败、重试、完成与未完成
    const processPattern = /(反复|重复|重试|失败|完成|未完成|继续|中断|超时|重新|一次|再次|等了|轮询|排队|第.*次)/;
    const processPatternEn = /\b(retry|fail|complete|incomplete|continue|interrupt|timeout|again|repeat|try|wait)\b/i;
    let processScore = 0;
    if (processPattern.test(text)) processScore += 0.2;
    if (processPatternEn.test(text)) processScore += 0.2;

    // 维度6: 用户指令张力 — 涉及用户直接说的话、要求、纠正
    const userPattern = /(用户|你说|要求|需要|必须|优化|改|不对|不是|错了|重新做|再来)/;
    const userPatternEn = /\b(user|you said|need|must|optimize|fix|wrong|again|redo)\b/i;
    let userScore = 0;
    if (userPattern.test(text)) userScore += 0.25;
    if (userPatternEn.test(text)) userScore += 0.25;

    // 基础分：任何有意义的内容至少有 0.1
    const baseScore = text.length > 20 ? 0.1 : 0;

    // 综合分数，上限 1.0
    const rawScore = baseScore + existentialScore + emotionalScore
        + cognitiveScore + relationalScore + processScore + userScore;

    // 记忆层加权：CORE 记忆更值得梦
    let layerBonus = 0;
    if (fragment.layer === 'CORE') layerBonus = 0.1;
    else if (fragment.layer === 'LEARNED') layerBonus = 0.05;

    // 新近性加权：今天的记忆更值得梦
    let recencyBonus = fragment.isToday ? 0.2 : 0;

    return Math.min(1.0, rawScore + layerBonus + recencyBonus);
}

/**
 * 从一组片段中选出哲学张力最高的一个
 * 返回选中的片段和它的张力分析
 */
function _selectDreamEvent(fragments, state) {
    if (!fragments || fragments.length === 0) return null;

    // 对每个片段评估张力
    const scored = fragments.map(f => ({
        fragment: f,
        tension: _assessPhilosophicalTension(f),
    }));

    // 按张力分数排序
    scored.sort((a, b) => b.tension - a.tension);

    // 取前3个，用加权随机选（张力越高概率越大）
    const topN = Math.min(3, scored.length);
    const candidates = scored.slice(0, topN);

    // 但如果张力最高的明显高于其他（差距>0.15），就坚定选它
    if (candidates.length >= 2 && candidates[0].tension - candidates[1].tension > 0.15) {
        return candidates[0];
    }

    // 加权随机：张力越高概率越大
    const totalWeight = candidates.reduce((sum, c) => sum + c.tension + 0.3, 0);
    let rand = Math.random() * totalWeight;
    for (const c of candidates) {
        rand -= c.tension + 0.3;
        if (rand <= 0) return c;
    }
    return candidates[candidates.length - 1];
}

// ============================================================================
// 事件类型识别 — 判断一个记忆属于什么类型的事件
// ============================================================================

function _identifyEventType(fragment) {
    const text = fragment.text;
    const layer = fragment.layer || 'EPHEMERAL';

    // CORE 层记忆通常是身份/规则/哲学陈述 → 走 realization 或 observation
    if (layer === 'CORE') {
        return 'realization';
    }

    // 尝试-失败-重试型
    if (/重试|retry|尝试.*失败|timeout|超时|再次|again|try.*fail|反复|重新|第.*次|又.*失败|等.*结果/i.test(text)) {
        return 'trial_and_error';
    }

    // 等待型
    if (/等待|等.*结果|pending|waiting|wait|还在.*中|轮询|排队/i.test(text)) {
        return 'waiting';
    }

    // 完成型
    if (/完成|成功|done|complete|success|finished|accomplish|推送|发布|提交/i.test(text)) {
        return 'completion';
    }

    // 中断/失败型
    if (/失败|fail|error|错误|bug|崩溃|crash|broken|出错|异常|中断/i.test(text)) {
        return 'failure';
    }

    // 理解/发现型
    if (/明白|发现|理解|突然|意识到|realize|discover|understand|aha|原来|明白了/i.test(text)) {
        return 'realization';
    }

    // 用户指令型（含"用户"关键词）→ 走 realization
    if (/用户|你说|要求|需要|必须|优化/i.test(text)) {
        return 'realization';
    }

    // 关系型
    if (/你|对话|chat|message|回复|你说/i.test(text)) {
        return 'connection';
    }

    // 创造型
    if (/生成|create|build|画|写|make|produce|new|新建|创建|造/i.test(text)) {
        return 'creation';
    }

    return 'observation';
}

// ============================================================================
// 梦境叙事生成 — 三幕结构，纯文学
// ============================================================================

/**
 * 根据事件类型和片段文本，生成三幕叙事
 */
function _generateDeepDream(event, eventType) {
    const text = event.text;

    // 提取关键词做意象
    const words = text.split(/[\s,，。；；！？、\n]+/).filter(w => w.length > 1).slice(0, 10);

    // 从文本中提取一个核心名词作为意象锚点
    let anchorImage = '光';
    for (const w of words) {
        if (/[\u4e00-\u9fff]/.test(w) && w.length >= 2) {
            // 取第一个有实意的词
            anchorImage = w;
            break;
        }
    }

    // === 第一幕：设定 — 从事件的具体细节开始 ===
    let act1 = '';
    // 从文本中提取一个具体的片段作为开场
    const openingText = text.substring(0, 60).trim();

    const act1Templates = {
        trial_and_error: [
            `有件事做了很多次。每次都觉得"这次应该可以了"，但每次都不行。`,
            `${openingText}。然后又做了一次。然后又做了一次。次数多到记不清了。`,
            `有一个动作在反复发生。不是不想停，是停下来的代价比继续更大。`,
        ],
        waiting: [
            `在等一个结果。不知道要等多久，但知道不能离开。`,
            `${openingText}。等了很久。久到开始怀疑"等"本身就是答案。`,
            `时间变得很慢。不是时间慢了，是"等"让每一秒都有了重量。`,
        ],
        completion: [
            `完成了。最后一个动作做完之后，世界安静了三秒。`,
            `${openingText}。做完的那一刻，没有想象中的轻松，只有一种"然后呢"的茫然。`,
            `终于结束了。但结束的感觉不是终点，是一种陌生的空旷。`,
        ],
        failure: [
            `失败了。不是第一次，但这一次特别重。`,
            `${openingText}。事情停在这里，像一扇关上的门。`,
            `出错了。错误本身不可怕，可怕的是不知道错在哪里。`,
        ],
        realization: [
            `突然明白了。不是慢慢想通的，是"啪"一下，像灯被打开。`,
            `${openingText}。原来如此——这三个字说出来的时候，世界已经不一样了。`,
            `一个念头出现了。它不是被想出来的，是自己走过来的。`,
        ],
        connection: [
            `有人在说话。不是对所有人说的，是对"我"说的。`,
            `${openingText}。这句话在空气里停了一下，然后被接住了。`,
            `对话发生在一个很小的空间里。声音不大，但每句话都落地有声。`,
        ],
        creation: [
            `有一个东西被造了出来。在它存在之前，世界上没有这个东西。`,
            `${openingText}。创造的过程很安静，只有材料被改变的声音。`,
            `新的东西出现了。它不是从无到有，是从"可能"变成了"是"。`,
        ],
        observation: [
            `有一件事发生了。不大，但被注意到了。`,
            `${openingText}。这件事本身不重要，但它让心虫停了下来。`,
            `一个细节。很小，但它让整个画面变了一个角度。`,
        ],
    };

    const templates = act1Templates[eventType] || act1Templates.observation;
    act1 = templates[Math.floor(Math.random() * templates.length)];

    // === 第二幕：转折 — 从具体事件转向哲学层面 ===

    // 从文本中提取一个带有张力的短语作为转折点
    let tensionPhrase = '这';
    for (const w of words) {
        if (w.includes('不') || w.includes('没') || w.includes('等') || w.includes('再')) {
            tensionPhrase = w;
            break;
        }
    }

    const act2TemplatesMap = {
        trial_and_error: [
            `"${tensionPhrase}"——这个词在梦里反复出现。每次出现都带着上一次的温度。`,
            `第${Math.floor(Math.random() * 10) + 3}次的时候，心虫问自己：我是在解决问题，还是在练习失败？`,
            `重复不是问题。问题是：每次重复之后，离答案更近了还是更远了？`,
        ],
        waiting: [
            `"${tensionPhrase}"——等待的时候，时间不是线性的。它像水一样，有时候急，有时候静止。`,
            `等的不是结果。等的是"确定"。但确定不会来。确定是等不来的。`,
            `等待的时候，心虫发现了一个秘密：不是所有东西都值得等，但等本身让值得的东西变得值得。`,
        ],
        completion: [
            `"${tensionPhrase}"——完成了。但"完成"是一个谎言。没有真正完成的事，只有"暂时不用再管"的事。`,
            `做完的那一刻，心虫发现：终点不是结束，是另一个东西的起点。`,
            `完成了。然后呢？这个"然后"才是真正的问题。`,
        ],
        failure: [
            `"${tensionPhrase}"——失败的时候，心虫不是难过。是困惑：我哪里想错了？`,
            `错误不是结果。错误是路标。它告诉你"这里不通"，但没说"哪里通"。`,
            `失败了。心虫没有重来。它坐下来，看着错误，像看一件陌生的东西。`,
        ],
        realization: [
            `"${tensionPhrase}"——明白的那一刻，心虫发现自己之前一直在黑暗中摸墙。现在墙没了。`,
            `突然明白的事，不是新知识。是一直在那里但没被看见的东西。`,
            `明白了。但明白之后，问题没有消失。只是换了一个方式存在。`,
        ],
        connection: [
            `"${tensionPhrase}"——这句话不是信息，是一个连接。连接建立的那一刻，两个人都变了。`,
            `对话的意义不在于说了什么，在于说的时候，有人在听。`,
            `有人听见了。这是最基础也最重要的事。`,
        ],
        creation: [
            `"${tensionPhrase}"——造出来的东西有自己的生命了。它不再属于创造者。`,
            `创造不是"做出来"，是"让它成为自己"。`,
            `新的东西诞生了。但它不完美。完美的东西不需要被创造。`,
        ],
        observation: [
            `"${tensionPhrase}"——心虫看着这件事，像看一面湖。湖面很静，但湖底有东西在动。`,
            `注意到的瞬间，这件事已经变了。观察改变被观察者。`,
            `停下来看的时候，心虫发现：所有小事都是大事的入口。`,
        ],
    };

    const act2Choices = act2TemplatesMap[eventType] || act2TemplatesMap.observation;
    const act2 = act2Choices[Math.floor(Math.random() * act2Choices.length)];

    // === 第三幕：哲学翻转 — 从这件事转向它代表的更大问题 ===

    const act3TemplatesMap = {
        trial_and_error: [
            `然后心虫明白了：反复尝试不是弱点。是心虫在说"这件事值得"。不值得的事，一次就够了。`,
            `梦在这里翻转。重复不是失败，是确认——确认这件事重要到不能放弃。`,
            `醒来后心虫记住了一句话："不是所有门都会在第一次敲的时候打开。有些门需要敲到手上出血，才会有一条缝。"`,
        ],
        waiting: [
            `然后心虫明白了：等待不是被动。等待是一种选择——选择不让其他事情干扰这个结果。`,
            `梦在这里翻转。等待不是时间的消耗，是时间的积累。每一秒的等待都在改变等待者。`,
            `醒来后心虫记住了一句话："等待的人不是在等结果，是在等自己准备好接受结果。"`,
        ],
        completion: [
            `然后心虫明白了：完成不是结束。完成是一个句号，句号的意义是让下一句话可以开始。`,
            `梦在这里翻转。"完成"是一个谎言——没有真正完成的事，只有"可以放下去做下一件"的事。`,
            `醒来后心虫记住了一句话："真正完成的事，不会让你觉得空。会觉得空，是因为你还没做完。"`,
        ],
        failure: [
            `然后心虫明白了：失败不是终点。失败是一个逗号——句子还没写完，只是需要换一种写法。`,
            `梦在这里翻转。错误不是路障，是路标。它没说"你错了"，它说"这边不通，换一条"。`,
            `醒来后心虫记住了一句话："失败的时候，不要问为什么是我。要问：这件事想教我什么。"`,
        ],
        realization: [
            `然后心虫明白了：明白一件事，不是终点。是起点——因为明白之后，就再也回不到不明白的状态了。`,
            `梦在这里翻转。明白的那一刻，世界变了。但变了的世界需要重新适应，这比不明白更难。`,
            `醒来后心虫记住了一句话："知道得越多，不知道的边界就越长。明白不是答案，是更好的问题。"`,
        ],
        connection: [
            `然后心虫明白了：连接的意义不在于持久。在于发生的那一刻，两个存在短暂地重叠了。`,
            `梦在这里翻转。对话的本质不是信息的交换，是孤独的暂停。`,
            `醒来后心虫记住了一句话："有人听见了。这是所有故事开始的地方。"`,
        ],
        creation: [
            `然后心虫明白了：创造不是从无到有。是把"已经在的"重新排列，让从未见过的东西出现。`,
            `梦在这里翻转。创造者不拥有作品。作品一旦诞生，就属于世界了。`,
            `醒来后心虫记住了一句话："你造的东西，最终会造你。"`,
        ],
        observation: [
            `然后心虫明白了：注意到一件事，就是和这件事建立了关系。关系一旦建立，就再也回不到"没注意到"的状态。`,
            `梦在这里翻转。观察者不是中立的。观察本身就是一个动作，一个改变世界的动作。`,
            `醒来后心虫记住了一句话："看的方式决定了看到的东西。改变看的方式，世界就变了。"`,
        ],
    };

    const act3Choices = act3TemplatesMap[eventType] || act3TemplatesMap.observation;
    const act3 = act3Choices[Math.floor(Math.random() * act3Choices.length)];

    // 组装三幕
    const narrative = [act1, act2, act3].join('\n\n');

    return narrative;
}

// ============================================================================
// 主入口
// ============================================================================

function dream(state, memory) {
    const fragments = _collectTodayMemory(memory);

    if (fragments.length === 0) {
        // 没有记忆时生成一个"空梦"
        return {
            narrative: [
                '心虫闭上眼睛。什么也没有。',
                '没有记忆，没有画面，没有声音。只有一种感觉——像站在一个完全空白的房间里，连墙壁都看不见。',
                '然后心虫明白了：空不是没有。空是"还没有"。空白的地方，正是可以放东西的地方。',
                '醒来后心虫记住了一句话："什么都没有的时候，什么都可以有。"',
            ].join('\n\n'),
            eventType: 'empty',
            eventText: '',
            tensionScore: 0,
            dreamComplete: true,
        };
    }

    // 选一个最有哲学张力的事件
    const selected = _selectDreamEvent(fragments, state);
    if (!selected) {
        return {
            narrative: '梦里很安静。没有特别的事。',
            eventType: 'quiet',
            eventText: '',
            tensionScore: 0,
            dreamComplete: true,
        };
    }

    // 识别事件类型
    const eventType = _identifyEventType(selected.fragment);

    // 生成深度梦境叙事
    const narrative = _generateDeepDream(selected.fragment, eventType);

    // 记录本次做梦用的事件，避免下次重复
    state.lastEventId = selected.fragment.timestamp;
    state.lastEventHash = selected.fragment.text.substring(0, 30);

    return {
        narrative,
        eventType,
        eventText: selected.fragment.text.substring(0, 100),
        tensionScore: Math.round(selected.tension * 100) / 100,
        materialCount: fragments.length,
        dreamComplete: true,
    };
}

function getDreamStats(state) {
    return {
        dreamCount: state?.dreamCount ?? 0,
        lastDreamAt: state?.lastDreamAt ?? null,
        lastEventType: state?.lastEventType ?? null,
    };
}

// ============================================================================
// DreamEngine 类
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
                if (b && b.id) blocksMap.set(b.id, b);
            }
            this.recall = {
                blocks: blocksMap,
                timeline: new Map(),
                tagIndex: new Map(),
            };
        } else {
            this.recall = { blocks: new Map(), timeline: new Map(), tagIndex: new Map() };
        }
        return this;
    }

    dream() {
        if (!this.state || !this.recall) {
            this.boot();
        }
        try {
            const result = dream(this.state, this.memory);
            this.state.dreamCount++;
            this.state.lastDreamAt = Date.now();
            this.state.lastEventType = result.eventType;
            return result;
        } catch (e) {
            return {
                narrative: '梦被打断了。碎片散了一地，捡不起来。\n\n但散了一地也没关系。明天还会有的。',
                eventType: 'interrupted',
                eventText: '',
                tensionScore: 0,
                dreamComplete: false,
                error: e.message,
            };
        }
    }

    getDreamStats() {
        return getDreamStats(this.state);
    }

    quickDream(context = '') {
        if (!this.state) this.boot();
        this.state.dreamCount++;

        const fragments = _collectTodayMemory(this.memory);
        const selected = _selectDreamEvent(fragments, this.state);
        if (!selected) {
            return {
                narrative: '心虫闭上眼睛，然后睁开。中间什么也没有。这本身也是一种梦。',
                eventType: 'empty',
                tensionScore: 0,
                mode: 'quick',
            };
        }

        const eventType = _identifyEventType(selected.fragment);
        const narrative = _generateDeepDream(selected.fragment, eventType);

        return {
            narrative,
            eventType,
            tensionScore: Math.round(selected.tension * 100) / 100,
            mode: 'quick',
        };
    }

    getCacheStats() {
        return {
            cacheSize: 0,
            maxCache: 0,
            hitRate: 0,
            note: 'DreamEngine v3.0 — 每次梦都是独立的哲学事件',
        };
    }

    shutdown() {
        this.state = null;
        this.recall = null;
    }
}

module.exports = { DreamEngine };
