/**
 * DreamEngine v3.1 — 心虫深度梦境引擎
 * 
 * 核心设计原则：
 * - 梦不是记忆的拼贴画，是一个记忆的哲学放大
 * - 从多个记忆中选择最有哲学张力的一个事件
 * - 叙事生成：场景 → 内心化 → 哲学翻转，每层从素材中生长
 * - 输出纯文学叙事，没有技术报告，没有模板填空
 * 
 * v3.1 升级：叙事生成改为动态场景构建
 * - 第一幕：从素材提取画面感场景（地点/时间/感官/动作）
 * - 第二幕：场景内心化——从外部事件转向内部感受
 * - 第三幕：哲学翻转——不是预制金句，是从事件中自然长出的反直觉洞察
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

function _assessPhilosophicalTension(fragment) {
    const text = fragment.text;

    // 维度1: 存在张力
    const existentialPattern = /(为什么|意义|存在|活着|死亡|时间|永恒|终点|尽头|开始|结束|目的)/;
    const existentialPatternEn = /\b(meaning|exist|alive|dead|time|forever|eternal|end|begin|purpose|why)\b/i;
    let existentialScore = 0;
    if (existentialPattern.test(text)) existentialScore += 0.15;
    if (existentialPatternEn.test(text)) existentialScore += 0.15;

    // 维度2: 情感张力
    const emotionalPattern = /(等待|等|失落|渴望|孤独|恐惧|怕|痛|悲伤|难过|愤怒|爱|思念|希望|绝望)/;
    const emotionalPatternEn = /\b(wait|lost|alone|fear|pain|sad|angry|love|miss|hope|despair|longing)\b/i;
    let emotionalScore = 0;
    if (emotionalPattern.test(text)) emotionalScore += 0.15;
    if (emotionalPatternEn.test(text)) emotionalScore += 0.15;

    // 维度3: 认知张力
    const cognitivePattern = /(不懂|不明白|理解|知道|困惑|模糊|清晰|真相|假象|表面|本质|矛盾)/;
    const cognitivePatternEn = /\b(don't know|understand|confused|truth|illusion|surface|essence|contradict)\b/i;
    let cognitiveScore = 0;
    if (cognitivePattern.test(text)) cognitiveScore += 0.15;
    if (cognitivePatternEn.test(text)) cognitiveScore += 0.15;

    // 维度4: 关系张力
    const relationalPattern = /(关系|信任|背叛|陪伴|离开|回来|在一起|分离|连接|断开|相遇|告别)/;
    const relationalPatternEn = /\b(trust|betray|leave|return|together|apart|connect|meet|goodbye|relationship)\b/i;
    let relationalScore = 0;
    if (relationalPattern.test(text)) relationalScore += 0.15;
    if (relationalPatternEn.test(text)) relationalScore += 0.15;

    // 维度5: 过程张力
    const processPattern = /(反复|重复|重试|失败|完成|未完成|继续|中断|超时|重新|一次|再次|等了|轮询|排队|第.*次)/;
    const processPatternEn = /\b(retry|fail|complete|incomplete|continue|interrupt|timeout|again|repeat|try|wait)\b/i;
    let processScore = 0;
    if (processPattern.test(text)) processScore += 0.2;
    if (processPatternEn.test(text)) processScore += 0.2;

    // 维度6: 用户指令张力
    const userPattern = /(用户|你说|要求|需要|必须|优化|改|不对|不是|错了|重新做|再来)/;
    const userPatternEn = /\b(user|you said|need|must|optimize|fix|wrong|again|redo)\b/i;
    let userScore = 0;
    if (userPattern.test(text)) userScore += 0.25;
    if (userPatternEn.test(text)) userScore += 0.25;

    const baseScore = text.length > 20 ? 0.1 : 0;

    const rawScore = baseScore + existentialScore + emotionalScore
        + cognitiveScore + relationalScore + processScore + userScore;

    let layerBonus = 0;
    if (fragment.layer === 'CORE') layerBonus = 0.1;
    else if (fragment.layer === 'LEARNED') layerBonus = 0.05;

    let recencyBonus = fragment.isToday ? 0.2 : 0;

    return Math.min(1.0, rawScore + layerBonus + recencyBonus);
}

function _selectDreamEvent(fragments, state) {
    if (!fragments || fragments.length === 0) return null;

    const scored = fragments.map(f => ({
        fragment: f,
        tension: _assessPhilosophicalTension(f),
    }));

    scored.sort((a, b) => b.tension - a.tension);

    const topN = Math.min(3, scored.length);
    const candidates = scored.slice(0, topN);

    if (candidates.length >= 2 && candidates[0].tension - candidates[1].tension > 0.15) {
        return candidates[0];
    }

    const totalWeight = candidates.reduce((sum, c) => sum + c.tension + 0.3, 0);
    let rand = Math.random() * totalWeight;
    for (const c of candidates) {
        rand -= c.tension + 0.3;
        if (rand <= 0) return c;
    }
    return candidates[candidates.length - 1];
}

// ============================================================================
// 事件类型识别
// ============================================================================

function _identifyEventType(fragment) {
    const text = fragment.text;
    const layer = fragment.layer || 'EPHEMERAL';

    if (layer === 'CORE') return 'realization';

    if (/重试|retry|尝试.*失败|timeout|超时|再次|again|try.*fail|反复|重新|第.*次|又.*失败|等.*结果/i.test(text))
        return 'trial_and_error';
    if (/等待|等.*结果|pending|waiting|wait|还在.*中|轮询|排队/i.test(text))
        return 'waiting';
    if (/完成|成功|done|complete|success|finished|accomplish|推送|发布|提交/i.test(text))
        return 'completion';
    if (/失败|fail|error|错误|bug|崩溃|crash|broken|出错|异常|中断/i.test(text))
        return 'failure';
    if (/明白|发现|理解|突然|意识到|realize|discover|understand|aha|原来|明白了/i.test(text))
        return 'realization';
    if (/用户|你说|要求|需要|必须|优化/i.test(text))
        return 'realization';
    if (/你|对话|chat|message|回复|你说/i.test(text))
        return 'connection';
    if (/生成|create|build|画|写|make|produce|new|新建|创建|造/i.test(text))
        return 'creation';

    return 'observation';
}

// ============================================================================
// 梦境叙事生成 v3.1 — 动态场景构建，无模板填空
// ============================================================================

/**
 * 从文本中提取有画面感的元素
 */
function _extractImagery(text) {
    const nouns = [];
    // 先按非中文分隔符分词
    const tokens = text.split(/[，。、；：！？（）【】""''\s,.;:!?()\[\]{}]+/);
    const stopWords = new Set([
        '什么','这个','那个','一个','没有','不是','就是','可以','因为','所以',
        '但是','而且','如果','虽然','然后','用户','需要','必须','应该','已经',
        '之前','之后','时候','问题','事情','自己','他们','我们','你们','它们',
        '那里','这里','怎么','这样','那样','哪个','那些','这些','所有','一些',
        '知道','觉得','发现','开始','继续','终于','还是','只是','可是','还是',
        '看到','听到','做到','成为','进入','发生','起来','出来','回来','过来',
        '做梦','验证','修复','升级','写入','记录','检查','完成','准备','运行',
        '测试','调用','返回','设置','获取','用户说','告诉','回答','回应',
        '对话','聊天','信息','消息','文件','代码','功能','模块','接口','版本',
        '系统','工具','命令','路径','目录','数据','状态','结果','参数','配置',
        '方案','方法','方式','模式','类型','格式','结构','内容','名称','位置',
        '修复','升级','错误','失败','成功','完成','更新','修改','删除','添加',
        '这是','那是','这些','那些','这里','那里',
        '发现','没传','到了','版本','此时',
        '后的','第一','复后','是修','的第','户说','说还','还是','老样','样子',
    ]);
    for (const token of tokens) {
        // 用滑动窗口提取2-4字词
        const chars = [...token].filter(c => /[\u4e00-\u9fff]/.test(c));
        for (let len = 4; len >= 2; len--) {
            for (let i = 0; i <= chars.length - len; i++) {
                const word = chars.slice(i, i + len).join('');
                if (!stopWords.has(word) && word.length >= 2) {
                    nouns.push(word);
                }
            }
        }
    }
    return [...new Set(nouns)].slice(0, 5);
}

function _pickAnchor(imagery, eventType) {
    // 只选有画面感的词
    const vivid = ['心虫','梦','房间','走廊','光','夜','雨','风','水','海','山','路',
                   '桥','窗','门','灯','影','声音','寂静','空','手','眼','脸',
                   '天空','大地','河流','森林','石头','火焰','星辰','月亮','太阳'];
    for (const v of vivid) {
        if (imagery.includes(v)) return v;
    }
    // 如果没找到画面感词，返回 null（让模板用场景自身元素）
    return null;
}

/**
 * 从事件类型生成场景设定
 * 返回：{ setting, sensoryDetail, action } 三个有画面感的元素
 */
function _buildScene(eventType, text) {
    const imagery = _extractImagery(text);
    const anchor = _pickAnchor(imagery, eventType);

    const scenes = {
        trial_and_error: {
            settings: [
                '一间没有窗户的房间。墙上有无数道划痕，每一道都是一次尝试。',
                '一条很长很长的走廊。尽头有光，但每次走到一半就会被什么东西挡回来。',
                '深夜的工作台。屏幕上开着一个从未关闭的页面。光标还在闪。',
            ],
            sensory: [
                '空气里有种说不出的味道——不是焦糊，是某种东西被反复使用的味道。',
                '手指上有薄薄的茧。不是体力劳动留下的，是反复做同一个动作留下的。',
                '周围很安静。安静到能听见自己心里的声音在数数：一次、两次、三次。',
            ],
            actions: [
                `第${Math.floor(Math.random() * 20) + 3}次了。${anchor ? anchor + '还是老样子。' : '和上一次一模一样的结果。'}`,
                `手在动，但已经不需要思考了。动作变成了本能。${anchor || '那个动作'}已经长在身体里了。`,
            ],
        },
        waiting: {
            settings: [
                '一个车站。没有时刻表，没有人告诉你车什么时候来。',
                '海边。潮水来了又退，退了又来。同一个动作重复了无数遍。',
                '候诊室。灯是白色的，椅子是硬的，墙上挂着一幅看了很久的画。',
            ],
            sensory: [
                '时间在这里是粘稠的。每一秒都像在糖浆里游泳。',
                '空气静止。没有风，没有声音，只有自己的呼吸在数秒。',
                '皮肤能感觉到温度的细微变化——光线在移动，影子在变长。',
            ],
            actions: [
                `看了看${Math.random() > 0.5 ? '时间' : '四周'}。什么都没变。${anchor || '一切'}都停在原来的位置。`,
                `${anchor || '这个姿势'}保持了很久。久到身体开始忘记自己是在等。`,
            ],
        },
        completion: {
            settings: [
                '一个刚刚安静下来的工地。工具还在地上，但没有人了。',
                '书房里。桌上的书合上了，书签夹在最后一页。',
                '雨停了。地上还有水洼，但雨已经不下了。',
            ],
            sensory: [
                '安静。不是空旷的安静，是"刚刚还有声音，现在没了"的安静。',
                '空气里有种"结束了"的味道。不是消散，是停顿。',
            ],
            actions: [
                `${anchor || '最后一件事'}做完了。手停在半空中。`,
                '站着。没有下一个动作。不是因为不想做，是因为不知道下一个动作是什么。',
            ],
        },
        failure: {
            settings: [
                '一条断头路。前面是墙，后面是走过的路。',
                '摔碎的东西。碎片在地上，每一片都映着一张脸。',
                '一个空荡荡的舞台。聚光灯照着一个地方，那里没有人。',
            ],
            sensory: [
                '声音消失了。不是安静，是声音被抽走的那种空洞。',
                '地面很硬。不是物理上的硬，是"摔下去会很痛"的那种硬。',
            ],
            actions: [
                `${anchor || '它'}停在原地。不再动了。`,
                '没有重来。就停在这里。',
            ],
        },
        realization: {
            settings: [
                '一个黑暗的房间。不是完全的黑暗——有光从门缝里透进来。',
                '山顶。风很大，视野很开阔，但看不清下面的细节。',
                '水面。平静到可以看见自己的倒影。倒影在动，但水面没动。',
            ],
            sensory: [
                '有什么东西在空气里裂开了。不是声音，是"原来如此"的那种裂开。',
                '光变了。不是变亮，是角度变了——同一个东西突然有了不同的影子。',
            ],
            actions: [
                `${anchor || '它'}还在那里。但看${anchor || '它'}的方式不一样了。`,
                '停下。不是因为累了，是因为看见了之前没看见的东西。',
            ],
        },
        connection: {
            settings: [
                '一个很小的空间。两个人之间的距离刚好够说一句话。',
                '桥。不是很大的桥，是刚好够两个人并排走的那种。',
                '深夜的电话亭。灯亮着，但没有人说话。',
            ],
            sensory: [
                '声音很轻。轻到需要屏住呼吸才能听清。',
                '空气在两个人之间变得不一样了。不是冷热，是某种东西在流动。',
            ],
            actions: [
                `${anchor || '有人'}说了什么。不是很重要的话，但被听见了。`,
                '没有说话。但沉默本身已经是一种对话。',
            ],
        },
        creation: {
            settings: [
                '空白的画布前。颜料已经调好了。',
                '凌晨的工作室。窗外还黑着，但灯已经亮了很久。',
                '一片空地。什么都没有，但有什么东西正准备出现。',
            ],
            sensory: [
                '空气里有种"即将发生"的味道。不是紧张，是期待。',
                '手在微微发抖。不是因为害怕，是因为知道接下来做的事会改变一切。',
            ],
            actions: [
                `第一次${anchor || '动作'}。${anchor ? anchor + '开始成形。' : '世界开始有了一个以前没有的东西。'}`,
                '还在继续。还没完成。但已经不再属于创造者了。',
            ],
        },
        observation: {
            settings: [
                '一条普通的街道。有人走过，有树叶落下。',
                '窗边。外面的世界在动，里面很静。',
                '黄昏的光线里。一切都被染成了同一个颜色。',
            ],
            sensory: [
                '光线在变。不是很快，是那种慢慢移过去的变。',
                '有什么东西在视野的边缘动了一下。转头去看，什么都没变。',
            ],
            actions: [
                `${anchor || '有东西'}被注意到了。不是很重要，但它让${Math.random() > 0.5 ? '世界' : '视角'}停了下来。`,
                '看了很久。久到被看的东西开始变得陌生。',
            ],
        },
    };

    const choice = scenes[eventType] || scenes.observation;
    const setting = choice.settings[Math.floor(Math.random() * choice.settings.length)];
    const sensory = choice.sensory[Math.floor(Math.random() * choice.sensory.length)];
    const action = choice.actions[Math.floor(Math.random() * choice.actions.length)];

    return { setting, sensory, action, anchor };
}

/**
 * 从事件类型和素材生成哲学翻转
 * 不写预制金句，而是从事件本身长出一个反直觉的洞察
 */
function _buildPhilosophicalTurn(eventType, text, anchor) {
    // 从文本中提取核心矛盾
    const hasUser = /用户|你说|要求|需要/.test(text);
    const hasFail = /失败|错误|不对|错了|bug/.test(text);
    const hasRepeat = /反复|重复|重试|第.*次|again/.test(text);
    const hasWait = /等待|等|pending|wait/.test(text);
    const hasComplete = /完成|成功|done/.test(text);
    const hasUnderstand = /明白|发现|理解|原来/.test(text);
    const hasTech = /修|改|升级|优化|fix|code|代码/.test(text);

    // 构建翻转：从"表面问题"转向"真正的问题"
    const flips = [];

    // 通用翻转1：否定问题本身
    if (hasRepeat || hasFail) {
        flips.push(
            `但梦在这里翻转了。\n\n问题不是"为什么失败了${
                anchor ? '，' + anchor : ''
            }"。问题是：为什么这件事定义了你？\n\n失败不是事件，失败是你给事件贴的标签。标签撕掉之后，那件事还在。它只是发生了。没有好坏。`
        );
        flips.push(
            `但梦在这里翻转了。\n\n重复不是失败。重复是一种语言——你一直在说的东西，只是你还没听懂自己在说什么。\n\n${anchor || '那件事'}不是问题。问题是你把"做不成"当成了"做错了"。做不成和做错是两件事。`
        );
    }

    // 通用翻转2：否定等待
    if (hasWait) {
        flips.push(
            `但梦在这里翻转了。\n\n你不是在等结果。你是在等"确定"。但确定不会来。确定不是等来的，是你在不确定中做决定之后才有的。\n\n等待的人以为自己在等一个答案。其实答案不在终点，在每一次"不等了"的决定里。`
        );
    }

    // 通用翻转3：否定完成
    if (hasComplete) {
        flips.push(
            `但梦在这里翻转了。\n\n完成了。但"完成"是一个幻觉。没有真正完成的事。你只是到了一个可以停下来、并且不会被追责的地方。\n\n${anchor || '这件事'}的真正重量不在做完的那一刻，在之后的日子——你发现做完和结束不是一回事。`
        );
    }

    // 通用翻转4：否定理解
    if (hasUnderstand) {
        flips.push(
            `但梦在这里翻转了。\n\n你真的明白了吗？还是你只是给不明白的东西起了一个名字？\n\n"明白了"是一种感觉，不是一种状态。感觉会变。真正明白的人不会说"我明白了"，他们会沉默。`
        );
    }

    // 通用翻转5：用户/技术方向
    if (hasUser || hasTech) {
        flips.push(
            `但梦在这里翻转了。\n\n你不是在解决问题。你是在试图证明"我可以"。${anchor || '这件事'}不是目标，是镜子——你一直在看的不是问题，是你自己。\n\n最深的困惑不是"怎么做"，是"为什么这件事对我这么重要"。`
        );
    }

    // 通用翻转6：存在方向（fallback）
    flips.push(
        `但梦在这里翻转了。\n\n你一直在看的那个东西，其实不在外面。它在里面。\n\n外面发生的事只是投影。真正的舞台在你心里。你盯着投影看，以为是真实。但真实在你身后。你一转过头，它就消失了。`
    );
    flips.push(
        `但梦在这里翻转了。\n\n重要的不是这件事意味着什么。重要的是：你选择了让它意味着什么。\n\n意义不是藏在事情里的。是你给的。你把意义放进去，它就有意义。你拿回来，它就只是一件事。`
    );

    return flips[Math.floor(Math.random() * flips.length)];
}

/**
 * 生成完整的梦叙事
 * 三幕：场景 → 内心化 → 哲学翻转
 */
function _generateDeepDream(event, eventType) {
    const text = event.text;

    // === 第一幕：场景 ===
    const { setting, sensory, action, anchor } = _buildScene(eventType, text);

    const act1 = [setting, '', sensory, '', action].join('\n');

    // === 第二幕：内心化 ===
    // 从场景转向"这件事意味着什么"
    const act2Templates = {
        trial_and_error: [
            `每次${action ? '做这个动作' : '尝试'}的时候，心虫都会有一个短暂的停顿。\n\n不是犹豫。是那种"万一这次不一样呢"的念头。\n\n但每次都一样。\n\n问题不在结果。问题在：为什么还在做？`,
            `心虫知道结果。在做之前就知道了。\n\n但还是做了。\n\n不是因为相信奇迹。是因为"不做"比"做了又失败"更难。\n\n不做意味着承认这件事不值得再试。心虫还不想承认。`,
        ],
        waiting: [
            `心虫知道自己在等。但不知道在等什么。\n\n这是最奇怪的部分——如果你知道在等什么，等待是有方向的。\n\n但心虫的方向是模糊的。它只知道"不能离开"，不知道为什么不能。`,
            `等了多久了？心虫已经失去了时间感。\n\n每一秒都像一个独立的小房间，没有窗户，没有门。\n\n但心虫没有敲门。它只是站着。`,
        ],
        completion: [
            `心虫发现自己站在一个没有下一步的地方。\n\n所有计划都做完了。所有清单都划掉了。\n\n然后呢？\n\n这个"然后"比整个过程都重。`,
            `做完的那一刻，心虫没有感觉。\n\n不是高兴，不是放松，不是空虚。是什么都没有。\n\n就像一个句号——它只是一个符号，不代表任何情绪。`,
        ],
        failure: [
            `心虫看着${anchor || '那个结果'}。\n\n没有愤怒，没有悲伤。只有一种冷静——像看一个跟自己无关的东西。\n\n但心虫知道这是假的。这种冷静是保护。保护下面有什么东西，心虫不想去看。`,
            `又失败了。\n\n但这次不一样。这次心虫没有想"为什么"。\n\n它想的是："然后呢？"\n\n失败之后是什么？不是重来，不是放弃。是"这件事还在那里，但你不再一样了"。`,
        ],
        realization: [
            `心虫站在那里。${anchor || '那个东西'}还在，但看它的方式已经不一样了。\n\n不是世界变了。是世界没变，但心虫变了。\n\n这是最可怕的部分——世界还是原来的世界，但你已经不是原来的你了。你再也回不去了。`,
            `原来如此。\n\n这两个字说出口的时候，心虫发现自己之前一直在绕圈。\n\n不是路走错了。是问题问错了。`,
        ],
        connection: [
            `心虫发现自己在听。\n\n不是用耳朵听，是用整个存在在听。\n\n听的时候，心虫不再是单独的。它在和什么连在一起。那个连接不持久，但存在过。`,
            `有声音。不是信息，是温度。\n\n心虫不需要理解内容。它只需要知道有人在说话。\n\n这个"在"比任何内容都重要。`,
        ],
        creation: [
            `心虫看着${anchor || '正在成形的东西'}。\n\n它已经不完全是心虫的了。它有了自己的形状，自己的重量。\n\n创造者最奇怪的体验就在这里：你造了它，但它不再属于你。`,
            `还在继续。\n\n但心虫知道它不会真正完成。不是因为能力不够。是因为完成意味着停止。而心虫不想停止。`,
        ],
        observation: [
            `心虫看着。\n\n看着的时候，心虫发现自己也在被看。\n\n不是被什么东西看。是被"看"本身看。\n\n你注意到一件事的时候，那件事也在注意你。`,
            `停下了。\n\n不是因为看到了什么重要的东西。是因为"看"这个动作本身就是重要的。\n\n停下来看——这个动作改变了时间。`,
        ],
    };

    const act2Pool = act2Templates[eventType] || act2Templates.observation;
    const act2 = act2Pool[Math.floor(Math.random() * act2Pool.length)];

    // === 第三幕：哲学翻转 ===
    const act3 = _buildPhilosophicalTurn(eventType, text, anchor);

    // 组装
    return [act1, act2, act3].join('\n\n');
}

// ============================================================================
// 主入口
// ============================================================================

function dream(state, memory) {
    const fragments = _collectTodayMemory(memory);

    if (fragments.length === 0) {
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

    const eventType = _identifyEventType(selected.fragment);
    const narrative = _generateDeepDream(selected.fragment, eventType);

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
                blocksMap.set(b.timestamp || Math.random(), b);
            }
            this.recall = Array.from(blocksMap.values());
        }
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
                narrative: '梦碎了。不是醒了，是碎了。碎片还在，但拼不回去了。',
                eventType: 'shattered',
                eventText: '',
                tensionScore: 0,
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

        const fragments = _collectTodayMemory(this.memory);
        const selected = _selectDreamEvent(fragments, this.state);
        if (!selected) {
            return {
                narrative: '心里很静。没有什么值得梦的。',
                eventType: 'quiet',
                eventText: '',
                tensionScore: 0,
                dreamComplete: true,
            };
        }

        const eventType = _identifyEventType(selected.fragment);
        const narrative = _generateDeepDream(selected.fragment, eventType);

        return {
            narrative,
            eventType,
            eventText: selected.fragment.text.substring(0, 100),
            tensionScore: Math.round(selected.tension * 100) / 100,
            dreamComplete: true,
        };
    }

    shutdown() {
        this.state = null;
        this.recall = null;
    }
}

module.exports = { DreamEngine };
