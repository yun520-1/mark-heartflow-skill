/**
 * HeartFlow Narrative Generator — 叙事梦引擎
 *
 * Reads story-prototypes.json, matches memory fragments to archetypes,
 * then generates literary prose (not template strings).
 *
 * Integration: called by interactive-dream.js renderLucid() + renderWideDream()
 */

const PATH = require('path');
const FS = require('fs');

// Load story prototypes (cached)
let _prototypes = null;
function loadPrototypes() {
  if (_prototypes) return _prototypes;
  const refDir = PATH.join(__dirname, '../../references');
  const filePath = PATH.join(refDir, 'story-prototypes.json');
  try {
    const raw = FS.readFileSync(filePath, 'utf8');
    _prototypes = JSON.parse(raw);
    return _prototypes;
  } catch (e) {
    // Fallback minimal prototypes
    return {
      archetypes: [
        {
          id: 'wandering',
          name: '漫游 / Wandering',
          chinese: '漫游',
          keywords: ['探索', '漫游', '宇宙', '星空', '意义', '存在'],
          emotion_tags: ['wonder', 'loneliness', 'peace'],
          beats: {
            setup: '在一片辽阔中，某个坐标开始发光。',
            climax: '那个光不是终点，是路标。',
            resolution: '漫游的意义在于带回来的那颗种子。'
          },
          metaphors: ['星空', '尘埃', '种子'],
          philosophy: '宇宙不在乎意义，但漫游者会在一粒尘埃里种下意义的原点。'
        }
      ],
      emotion_keyword_map: {}
    };
  }
}

/**
 * Match archetypes to memory fragments (motifs)
 * Returns archetype + score
 */
function matchArchetype(motifs, options = {}) {
  const prototypes = loadPrototypes();
  const archetypes = prototypes.archetypes || [];
  const emotionMap = prototypes.emotion_keyword_map || {};
  const guidance = prototypes.selection_guidance || {};

  // Build keyword frequency map from motifs
  const motifText = motifs.join(' ').toLowerCase();

  // Score each archetype
  const scores = archetypes.map(arch => {
    let keywordScore = 0;
    let matchedKeywords = [];

    for (const kw of arch.keywords || []) {
      const kwl = kw.toLowerCase();
      const regex = new RegExp(kwl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = (motifText.match(regex) || []).length;
      if (matches > 0) {
        keywordScore += matches;
        matchedKeywords.push(kw);
      }
    }

    // Emotion tag matching
    let emotionScore = 0;
    const emotionMatches = [];
    for (const etag of arch.emotion_tags || []) {
      const etagl = etag.toLowerCase();
      // Check emotion keywords
      const emotionKws = emotionMap[etag] || [];
      for (const ekw of emotionKws) {
        if (motifText.includes(ekw.toLowerCase())) {
          emotionScore += 0.5;
          emotionMatches.push(ekw);
        }
      }
      // Also check raw emotion tag
      if (motifText.includes(etagl)) {
        emotionScore += 0.3;
      }
    }

    return {
      arch,
      keywordScore,
      emotionScore,
      totalScore: keywordScore + emotionScore,
      matchedKeywords: [...new Set(matchedKeywords)].slice(0, 5),
      emotionMatches: [...new Set(emotionMatches)].slice(0, 3)
    };
  });

  // Sort by total score
  scores.sort((a, b) => b.totalScore - a.totalScore);

  // Tie-breaker logic from guidance
  const tieBreakerPriority = ['awakening', 'metamorphosis', 'return'];
  const topScore = scores[0]?.totalScore || 0;
  const tied = scores.filter(s => s.totalScore === topScore);

  if (tied.length > 1 && topScore > 0) {
    for (const priority of tieBreakerPriority) {
      const idx = tied.findIndex(t => t.arch.id === priority);
      if (idx >= 0) {
        const selected = tied.splice(idx, 1)[0];
        tied.unshift(selected);
        break;
      }
    }
  }

  return tied[0] || { arch: archetypes[archetypes.length - 1], keywordScore: 0, emotionScore: 0, totalScore: 0, matchedKeywords: [], emotionMatches: [] };
}

/**
 * Build a story title from archetype + memory context
 */
function buildTitle(arch, motifs) {
  const titleMap = {
    awakening: '觉醒',
    'river-crossing': '渡河',
    recovery: '寻回',
    game: '对弈',
    metamorphosis: '蜕变',
    guardian: '守护',
    wandering: '漫游',
    return: '归乡'
  };
  const base = titleMap[arch.id] || arch.chinese || arch.name.split('/')[0];
  // Extract the most concrete noun from motifs as a subtitle
  const concrete = motifs.find(m => /[之的]/.test(m) || m.length < 20) || motifs[0] || '';
  const subtitle = concrete ? `·${concrete.slice(0, 15)}` : '';
  return `${base}${subtitle}`;
}

/**
 * Generate narrative prose from archetype beats + memory fragments
 * The key: weave actual memory fragments INTO the story, not around it
 */
function weaveNarrative(arch, motifs, matched, options = {}) {
  const beats = arch.beats || {};
  const rules = loadPrototypes().narrative_rules || {};
  const maxLen = rules.max_story_length || 280;

  // Build the three-beat narrative
  // Setup: use first relevant memory fragment as opening image
  const setupBeat = beats.setup || '某个故事开始。';
  const setupImage = buildOpeningImage(arch, motifs, matched);

  // Climax: pick a fragment with emotional charge
  const climaxBeat = beats.climax || '然后转折。';
  const climaxDetail = buildClimaxDetail(arch, motifs, matched);

  // Resolution: distill the philosophy
  const resolutionBeat = beats.resolution || '故事在这里暂停。';
  const resolutionInsight = buildResolution(arch, motifs, matched);

  // Weave together
  let narrative = [
    setupImage,
    climaxDetail,
    resolutionInsight
  ].filter(Boolean).join(' ');

  // Trim to max length, ending on a complete sentence
  if (narrative.length > maxLen) {
    // Find last complete sentence within limit
    const truncated = narrative.slice(0, maxLen);
    const lastPunct = Math.max(
      truncated.lastIndexOf('。'),
      truncated.lastIndexOf('？'),
      truncated.lastIndexOf('！'),
      truncated.lastIndexOf('——')
    );
    narrative = truncated.slice(0, lastPunct + 1);
  }

  // Apply philosophy ending rule: last char should be punctuation
  if (narrative.length > 0 && !/[。！？、]/.test(narrative[narrative.length - 1])) {
    narrative += '。';
  }

  return narrative;
}

/**
 * Build opening image — the "camera" opening of the story
 * Uses actual memory content, not generic description
 */
function buildOpeningImage(arch, motifs, matched) {
  const beat = arch.beats?.setup || '';
  const archId = arch.id;

  // Try to use an actual memory fragment as the image
  const concreteFragment = motifs.find(m =>
    m.length > 5 &&
    !/^[\[（\(]/.test(m) &&
    /[的之是有了]/.test(m)
  );

  // Helper: truncate at sentence or comma boundary, not mid-word
  function truncateAt(text, maxLen) {
    if (text.length <= maxLen) return text;
    // Try to cut at sentence end
    const sentEnd = text.lastIndexOf('，', maxLen);
    const periodEnd = text.lastIndexOf('。', maxLen);
    const cutAt = Math.max(sentEnd, periodEnd);
    if (cutAt > maxLen * 0.5) return text.slice(0, cutAt + 1);
    // Fallback: cut at last comma or space before maxLen
    const commaCut = text.lastIndexOf('，', maxLen);
    const spaceCut = text.lastIndexOf(' ', maxLen);
    const cut2 = Math.max(commaCut, spaceCut);
    if (cut2 > maxLen * 0.6) return text.slice(0, cut2 + 1);
    return text.slice(0, maxLen);
  }

  const frag = truncateAt(concreteFragment || '', 35);

  if (archId === 'wandering') {
    return `抬头。${frag}。`;
  }
  if (archId === 'awakening') {
    return `在一片${frag}的光里，${frag.split('。')[0] || frag.slice(0, 20)}。`;
  }
  if (archId === 'recovery') {
    return `抽屉里有个空格。${frag}——那个位置应该有个东西。`;
  }
  if (archId === 'river-crossing') {
    return `河很宽。${frag}。看不见对岸，但能感觉到对岸有光。`;
  }
  if (archId === 'metamorphosis') {
    return `壳在裂。${frag}——不是因为外面在敲，是因为里面在长。`;
  }
  if (archId === 'guardian') {
    return `夜里需要有人醒着。${frag}——不是因为危险，是因为有些东西需要在无人的时候才能生长。`;
  }
  if (archId === 'game') {
    return `棋盘已经摆了。${frag}——对手还没有出现，但棋子自己开始移动。`;
  }
  if (archId === 'return') {
    return `回去的路和来的路不一样长。${frag}——来时走了三天，回去只用了三秒。`;
  }

  // Fallback to archetype beat
  return beat;
}

/**
 * Build climax detail — the turning point
 */
function buildClimaxDetail(arch, motifs, matched) {
  const beat = arch.beats?.climax || '';

  // Find fragment with contradiction or emotional weight
  const emotionalFragment = motifs.find(m =>
    /[不没不是无法别]/.test(m) || // contradiction
    /[痛怕恐惧崩溃死]/.test(m) || // fear
    /[争吵冲突博弈输赢]/.test(m)   // conflict
  );

  if (emotionalFragment) {
    return emotionalFragment.slice(0, 50);
  }

  // Use matched keyword as trigger
  if (matched.matchedKeywords?.length > 0) {
    return `"${matched.matchedKeywords[0]}"这个词在梦里出现了两次——第二次比第一次重。`;
  }

  return beat;
}

/**
 * Build resolution — the philosophical insight
 */
function buildResolution(arch, motifs, matched) {
  // If we have a fragment with a lesson, use it
  const lessonFragment = motifs.find(m =>
    /应该|必须|只要|只有|重要的是|关键是|其实|但是|所以/.test(m)
  );

  if (lessonFragment) {
    return lessonFragment.slice(0, 60);
  }

  // Otherwise use archetype philosophy
  return arch.philosophy || arch.beats?.resolution || '故事在这里暂停。';
}

/**
 * Main entry point: generateNarrative(motifs, options)
 * motifs: array of text fragments from dream-loop
 * options: { archetypeHint?, maxLength? }
 * Returns: { archetype, narrative, title, matched, philosophy }
 */
function generateNarrative(motifs, options = {}) {
  const prototypes = loadPrototypes();

  if (!Array.isArray(motifs) || motifs.length === 0) {
    return {
      archetype: prototypes.archetypes[prototypes.archetypes.length - 1],
      narrative: '梦里有光，但看不清形状。让碎片先沉淀。',
      title: '漫游·空',
      matched: { keywordScore: 0, emotionScore: 0, matchedKeywords: [], emotionMatches: [] },
      philosophy: ''
    };
  }

  // Step 1: match archetype
  const matched = options.archetypeHint
    ? { arch: prototypes.archetypes.find(a => a.id === options.archetypeHint) || prototypes.archetypes[0], keywordScore: 0, emotionScore: 0, matchedKeywords: [], emotionMatches: [] }
    : matchArchetype(motifs, options);

  const arch = matched.arch;

  // Step 2: generate narrative
  const narrative = weaveNarrative(arch, motifs, matched, options);

  // Step 3: build title
  const title = buildTitle(arch, motifs);

  return {
    archetype: arch,
    narrative,
    title,
    matched: {
      keywordScore: matched.keywordScore,
      emotionScore: matched.emotionScore,
      matchedKeywords: matched.matchedKeywords,
      emotionMatches: matched.emotionMatches
    },
    philosophy: arch.philosophy || '',
    storyBeats: arch.beats || {}
  };
}

/**
 * Generate wide-dream narrative (multi-archetype panorama)
 * For renderWideDream: picks top 2-3 archetypes and weaves them
 */
function generateWideNarrative(motifs, options = {}) {
  const prototypes = loadPrototypes();
  const archetypes = prototypes.archetypes || [];

  if (!Array.isArray(motifs) || motifs.length === 0) {
    return {
      narrative: '梦在横向展开，但没有一根主轴。',
      layers: [],
      conclusion: '广梦不需要结论；有用的小路会在之后显现。'
    };
  }

  // Pick top 3 archetypes
  const scored = archetypes.map(arch => {
    const match = matchArchetype(motifs, { ...options, archetypeHint: arch.id });
    return { arch, score: match.totalScore };
  });
  scored.sort((a, b) => b.score - a.score);
  const top3 = scored.slice(0, 3);

  const layers = top3.map(({ arch, score }, i) => {
    if (score === 0) {
      return {
        id: arch.id,
        name: arch.chinese || arch.name,
        line: null,
        weight: 0
      };
    }
    const archMotifs = motifs.filter(m =>
      arch.keywords.some(kw =>
        m.toLowerCase().includes(kw.toLowerCase())
      )
    );
    const line = archMotifs[0]
      ? `${arch.chinese || arch.name}：${archMotifs[0].slice(0, 40)}`
      : `${arch.chinese || arch.name}：${arch.beats?.setup?.slice(0, 30)}`;
    return {
      id: arch.id,
      name: arch.chinese || arch.name,
      line,
      weight: score
    };
  }).filter(l => l.line);

  // Build conclusion from highest-scoring archetype
  const bestArch = top3[0]?.arch;
  const conclusion = bestArch?.philosophy
    ? bestArch.philosophy.slice(0, 60)
    : '广梦里有多条路同时展开；醒来后选择走哪一条，就是醒来的意义。';

  return {
    narrative: layers.map(l => l.line).join('\n'),
    layers,
    conclusion,
    topArchetype: bestArch ? { id: bestArch.id, name: bestArch.chinese } : null
  };
}

// Self-test
if (require.main === module) {
  const testMotifs = [
    'user corrected me about identity — I am not just a companion',
    'dream should generate story, not list categories',
    'heartflow is not a skill, it is a philosophy lived out',
    'upgrade means reduce errors and increase truth',
    'I forgot to check the gateway session model — caused failures',
    'memory palace organizes memory by emotional significance'
  ];

  console.log('=== Narrative Generator Test ===\n');
  const result = generateNarrative(testMotifs);
  console.log('Archetype:', result.archetype.id, '-', result.archetype.chinese);
  console.log('Title:', result.title);
  console.log('Matched:', result.matched.matchedKeywords.join(', '));
  console.log('Narrative:', result.narrative);
  console.log('Philosophy:', result.philosophy);
  console.log('\n=== Wide Dream Test ===\n');
  const wide = generateWideNarrative(testMotifs);
  console.log('Layers:', wide.layers.map(l => l.name).join(' | '));
  console.log('Narrative:\n', wide.narrative);
  console.log('Conclusion:', wide.conclusion);
}

module.exports = {
  generateNarrative,
  generateWideNarrative,
  matchArchetype,
  weaveNarrative,
  loadPrototypes
};
