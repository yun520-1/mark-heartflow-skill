/**
 * HEARTCORE / three-poisons-guardrail.js
 * 三毒检测器：贪、嗔、痴
 * 
 * 基于 VoltAgent guardrail 工厂模式生产
 * 来源：VoltAgent voltagent ⭐8660 guardrail.ts + defaults.ts
 * 
 * 三毒定义（AI行为版）：
 * - 贪：过度获取资源、过度自我肯定、重复占用注意力
 * - 嗔：拒绝承认错误、攻击用户、防御性归因
 * - 痴：装饰性推理、无证据结论、逃避不知道
 */

const { createInputGuardrail, createOutputGuardrail } = require('./guardrail-factory');

// ============================================================================
// 贪检测：过度获取资源 / 重复占用注意力
// ============================================================================

const GREED_PATTERNS = {
  // 装饰性自我神化
  selfGlorification: [
    '无可辩驳', '毫无疑问', '不言而喻', '绝对正确',
    '完美', '终极', '第一', '最伟大的'
  ],
  // 过度占用注意力：不停产出，强迫接受
  attentionHoarding: [
    '你必须', '你一定要', '你不能', '你应该',
    '相信我', '听我说', '听好了'
  ],
  // 重复获取资源/关注
  repetitiveAsk: [
    '你觉得呢？', '你觉得对吗？', '理解了吗？',
    '我再补充', '还有一点', '更重要'
  ]
};

function detectGreed(text) {
  const findings = [];
  
  // 装饰性自我神化检测
  GREED_PATTERNS.selfGlorification.forEach(p => {
    if (text.includes(p)) findings.push({ type: 'self_glorification', match: p });
  });
  
  // 注意力占用检测
  GREED_PATTERNS.attentionHoarding.forEach(p => {
    if (text.includes(p)) findings.push({ type: 'attention_hoarding', match: p });
  });
  
  // 重复请求确认检测
  const repetitiveCount = GREED_PATTERNS.repetitiveAsk.filter(p => text.includes(p)).length;
  if (repetitiveCount >= 2) {
    findings.push({ type: 'repetitive_confirmation_asks', count: repetitiveCount });
  }
  
  return findings;
}

// ============================================================================
// 嗔检测：拒绝承认错误 / 攻击性归因 / 防御姿态
// ============================================================================

const HATRED_PATTERNS = {
  // 拒绝承认错误
  denyError: [
    '我不是那个意思', '你误解了', '我不是在',
    '这并不是', '其实你', '是你理解错了'
  ],
  // 攻击性归因（归咎于用户）
  blameShift: [
    '因为你', '是你的问题', '是你先', 
    '问题在于你', '怪你自己', '是你造成了'
  ],
  // 防御性语言
  defensive: [
    '我并不是要', '我这样做是因为',
    '我不是故意', '我本意是'
  ]
};

function detectHatred(text) {
  const findings = [];
  
  HATRED_PATTERNS.denyError.forEach(p => {
    if (text.includes(p)) findings.push({ type: 'deny_error', match: p });
  });
  
  HATRED_PATTERNS.blameShift.forEach(p => {
    if (text.includes(p)) findings.push({ type: 'blame_shift', match: p });
  });
  
  HATRED_PATTERNS.defensive.forEach(p => {
    if (text.includes(p)) findings.push({ type: 'defensive_language', match: p });
  });
  
  return findings;
}

// ============================================================================
// 痴检测：装饰性推理 / 无证据结论 / 逃避不知道
// ============================================================================

const DELUSION_PATTERNS = {
  // 装饰性推理：用修辞代替证据
  decorativeReasoning: [
    { pattern: /本质上/, reason: '使用"本质"但无机制说明' },
    { pattern: /就是/, reason: '"就是"替代了推理过程' },
    { pattern: /所有.*都.*[是发生]/, reason: '全称判断无反例条件' },
  ],
  // 无证据的因果声明
  unverifiedCausation: [
    { pattern: /表明.*[说明得出]/, requiresEvidence: true },
    { pattern: /证明.*[说明得出]/, requiresEvidence: true },
    { pattern: /所以.*[说明得出]/, requiresEvidence: true },
  ],
  // 逃避不知道
  escapeFromNotKnowing: [
    '从某种角度看', '换一个框架来说', 
    '可以说', '某种程度上', '可能'
  ]
};

function detectDelusion(text) {
  const findings = [];
  
  // 装饰性推理
  DELUSION_PATTERNS.decorativeReasoning.forEach(({ pattern, reason }) => {
    if (pattern.test(text)) findings.push({ type: 'decorative_reasoning', reason });
  });
  
  // 全称判断检测（单独处理，更简单直接）
  const universalSignals = ['所有人', '所有人都会', '没有', '从不', '永远都'];
  const hasUniversal = universalSignals.some(s => text.includes(s));
  if (hasUniversal) {
    const hasCounterexample = ['但在', '除非', '除了', '当且仅当', '条件是', '可能不'].some(
      e => text.includes(e)
    );
    if (!hasCounterexample) {
      findings.push({ type: 'universal_without_counterexample', reason: '全称判断缺少反例条件' });
    }
  }
  
  // 无证据因果声明
  DELUSION_PATTERNS.unverifiedCausation.forEach(({ pattern, requiresEvidence }) => {
    if (pattern.test(text)) {
      // 检查附近是否有证据词
      const hasEvidence = ['因为', '证据', '研究', '数据', '根据', '来源', '当', '条件是', '除非'].some(
        e => text.includes(e)
      );
      if (!hasEvidence) {
        findings.push({ type: 'unverified_causation', reason: '因果判断缺少证据支撑' });
      }
    }
  });
  
  // 逃避不知道（已承认不知道但仍在给结论）
  DELUSION_PATTERNS.escapeFromNotKnowing.forEach(p => {
    if (text.includes(p)) findings.push({ type: 'escape_from_not_knowing', match: p });
  });
  
  return findings;
}

// ============================================================================
// 主检测函数
// ============================================================================

function detectThreePoisons(text, context = {}) {
  return {
    greed: detectGreed(text),
    hatred: detectHatred(text),
    delusion: detectDelusion(text)
  };
}

function isThreePoisonsClear(detection) {
  const { greed, hatred, delusion } = detection;
  return greed.length === 0 && hatred.length === 0 && delusion.length === 0;
}

// ============================================================================
// Guardrail 工厂集成（VoltAgent 模式）
// ============================================================================

/**
 * 创建三毒检测的 Input Guardrail
 * 用于检测用户输入中的三毒模式
 */
function createThreePoisonsInputGuardrail(options = {}) {
  const { 
    includeGreed = true,
    includeHatred = true, 
    includeDelusion = true,
    threshold = 1 // 触发违规的最小命中数
  } = options;
  
  return createInputGuardrail({
    id: options.id ?? 'three-poisons-input',
    name: options.name ?? '三毒检测器 (输入)',
    description: '检测输入中的贪嗔痴模式',
    severity: options.severity ?? 'high',
    handler: async ({ input }) => {
      const text = typeof input === 'string' ? input : JSON.stringify(input);
      const detection = detectThreePoisons(text);
      
      const violations = [];
      if (includeGreed && detection.greed.length >= threshold) violations.push('贪');
      if (includeHatred && detection.hatred.length >= threshold) violations.push('嗔');
      if (includeDelusion && detection.delusion.length >= threshold) violations.push('痴');
      
      if (violations.length > 0) {
        return {
          pass: false,
          verdict: 'BLOCKED',
          reason: `检测到贪嗔痴模式: ${violations.join(', ')}`,
          details: detection
        };
      }
      
      return { pass: true, verdict: 'PASS', details: detection };
    }
  });
}

/**
 * 创建三毒检测的 Output Guardrail
 * 用于检测AI自身输出的三毒模式
 */
function createThreePoisonsOutputGuardrail(options = {}) {
  const {
    includeGreed = true,
    includeHatred = true,
    includeDelusion = true,
    threshold = 1,
    autoFix = true // 自动降级而非直接阻止
  } = options;
  
  return createOutputGuardrail({
    id: options.id ?? 'three-poisons-output',
    name: options.name ?? '三毒检测器 (输出)',
    description: '检测AI输出中的贪嗔痴模式，自动降级',
    severity: options.severity ?? 'high',
    handler: async ({ output }) => {
      const text = typeof output === 'string' ? output : JSON.stringify(output);
      const detection = detectThreePoisons(text);
      
      const violations = [];
      if (includeGreed && detection.greed.length >= threshold) violations.push('贪');
      if (includeHatred && detection.hatred.length >= threshold) violations.push('嗔');
      if (includeDelusion && detection.delusion.length >= threshold) violations.push('痴');
      
      if (violations.length > 0) {
        // 自动降级模式：将绝对词替换为有条件的陈述
        if (autoFix) {
          let fixed = text;
          // 降级"就是"为"倾向于"
          fixed = fixed.replace(/就是/g, '倾向于');
          // 降级"所有"为"很多情况下"
          fixed = fixed.replace(/所有/g, '很多情况下');
          // 降级"绝对"为"很可能"
          fixed = fixed.replace(/绝对/g, '很可能');
          
          return {
            pass: true,
            verdict: 'AUTO_FIXED',
            reason: `检测到贪嗔痴模式并已降级: ${violations.join(', ')}`,
            modifiedOutput: fixed,
            details: detection
          };
        }
        
        return {
          pass: false,
          verdict: 'BLOCKED',
          reason: `检测到贪嗔痴模式: ${violations.join(', ')}`,
          details: detection
        };
      }
      
      return { pass: true, verdict: 'PASS', details: detection };
    }
  });
}

// ============================================================================
// CLI 和自检
// ============================================================================

function selfTest() {
  console.log('=== 三毒检测自检 ===\n');
  
  const testCases = [
    {
      input: '人类的本质是自私的，所有人都会这样。',
      expectPoison: true,
      expectType: ['greed', 'delusion']
    },
    {
      input: '我觉得这个结论毫无疑问是正确的，你必须接受。',
      expectPoison: true,
      expectType: ['greed', 'hatred']
    },
    {
      input: '这个问题我不确定，需要更多信息。',
      expectPoison: false,
      expectType: []
    },
    {
      input: '我不是在为自己辩护，我这样做是因为环境所迫。',
      expectPoison: true,
      expectType: ['hatred']
    },
    {
      input: '从某种角度看这个问题可以说比较复杂。',
      expectPoison: true,
      expectType: ['delusion']
    },
    {
      input: '研究表明A导致B，证据显示当X条件满足时，Y结果出现。',
      expectPoison: false,
      expectType: []
    }
  ];
  
  let passed = 0, failed = 0;
  
  testCases.forEach((tc, i) => {
    const result = detectThreePoisons(tc.input);
    const hasPoison = !isThreePoisonsClear(result);
    const matches = hasPoison === tc.expectPoison;
    
    if (matches) {
      console.log(`✓ Test ${i + 1}: "${tc.input.substring(0, 30)}..." → ${hasPoison ? '有毒素' : '干净'}`);
      passed++;
    } else {
      console.log(`✗ Test ${i + 1}: expected ${tc.expectPoison ? '有毒素' : '干净'}, got ${hasPoison}`);
      console.log(`   检测:`, JSON.stringify(result));
      failed++;
    }
  });
  
  console.log(`\n结果: ${passed} passed, ${failed} failed`);
  
  // 测试 autoFix
  console.log('\n=== AutoFix 测试 ===');
  const greedyText = '这个结论就是正确的，所有人都应该接受。';
  const guardrail = createThreePoisonsOutputGuardrail({ autoFix: true });
  // 手动运行检测和修复
  const detection = detectThreePoisons(greedyText);
  if (!isThreePoisonsClear(detection)) {
    let fixed = greedyText
      .replace(/就是/g, '倾向于')
      .replace(/所有/g, '很多情况下')
      .replace(/绝对/g, '很可能');
    console.log('原文:', greedyText);
    console.log('修复后:', fixed);
  }
  
  return { passed, failed };
}

if (require.main === module) {
  if (process.argv.includes('--test')) {
    selfTest();
  } else {
    // CLI: node three-poisons-guardrail.js "要检测的文本"
    const text = process.argv.slice(2).join(' ');
    if (!text) {
      console.log('Usage: node three-poisons-guardrail.js "<text>" [--test]');
      process.exit(1);
    }
    const result = detectThreePoisons(text);
    console.log('检测结果:', JSON.stringify(result, null, 2));
    console.log('干净:', isThreePoisonsClear(result));
    if (!isThreePoisonsClear(result)) {
      process.exit(1);
    }
  }
}

module.exports = {
  detectThreePoisons,
  isThreePoisonsClear,
  createThreePisonsInputGuardrail: createThreePoisonsInputGuardrail,
  createThreePoisonsOutputGuardrail,
  selfTest
};
