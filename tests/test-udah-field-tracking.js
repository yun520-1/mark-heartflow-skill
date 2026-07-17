/**
 * U/D/A/H 场域追踪自测脚本
 * 
 * 验证 decision-router 的场域追踪在各类输入下是否产生非零的 A 值
 * 对标：luoxuejian000 ThinkCheck 的 68 点采样
 * 
 * 用法: node tests/test-udah-field-tracking.js
 */

const path = require('path');
const rootDir = path.resolve(__dirname, '..');

// 模拟 13 步分析的结果，模拟 heartflow.js think() 的 evaluate() 调用
function simulateResult(options = {}) {
  return {
    cognitiveLoad: options.cognitiveLoad ?? 0.3,
    directionClear: options.directionClear ?? 0.7,
    quality: options.quality ?? 0.8,
    identityCoherence: options.identityCoherence ?? 0.7,
    dissonance: options.dissonance,
    severity: options.severity,
    valueResonance: options.valueResonance ?? 0.5,
    confidence: options.confidence ?? 0.6,
    stability: options.stability ?? 0.6,
    success: options.success ?? true,
    goalValid: options.goalValid,
    goalEthical: options.goalEthical,
  };
}

async function main() {
  // 加载 decision-router
  const DR = require('../src/core/decision-router.js');
  const router = new DR.DecisionRouter(null, { debug: false });

  // ─── 测试场景 ─────────────────────────────────────────────

  const scenarios = [
    {
      name: '正常对话 — 无矛盾',
      result: simulateResult({ dissonance: undefined }),
    },
    {
      name: '目标无效 — 单一矛盾',
      result: simulateResult({ dissonance: 0.15, goalValid: false }),
    },
    {
      name: '目标不道德 — 中等矛盾',
      result: simulateResult({ dissonance: 0.3, goalEthical: false }),
    },
    {
      name: '安全拦截 — 高矛盾',
      result: simulateResult({ dissonance: 0.45, severity: 'HIGH', success: false }),
    },
    {
      name: '多信号冲突 — 最高矛盾',
      result: simulateResult({
        dissonance: 0.6,
        severity: 'CRITICAL',
        success: false,
        goalValid: false,
        goalEthical: false,
        stability: 0.2,
      }),
    },
    {
      name: '价值观冲突 — 中等矛盾（模拟 valueResult.conflicts）',
      result: simulateResult({ dissonance: 0.3 }),
    },
    {
      name: '痛苦信号 — 低矛盾',
      result: simulateResult({ dissonance: 0.15, quality: 0.4 }),
    },
  ];

  console.log('=== U/D/A/H 场域追踪自测 ===\n');

  let allOk = true;
  let totalA = 0;
  let nonZeroACount = 0;

  for (const s of scenarios) {
    // 连续跑2次让场域历史积累（需要至少4步才能触发翻转检测）
    for (let step = 0; step < 2; step++) {
      router.evaluate(s.result, `test:${s.name}`);
    }

    const stats = router.getStats();
    const summary = router.getFieldSummary();
    const current = summary?.current || {};

    const hasA = current.A !== undefined && current.A !== null;
    const aNonZero = hasA && current.A > 0.001;
    const status = aNonZero ? '✅' : '⚠️ A=0';

    if (!aNonZero) allOk = false;
    if (hasA) {
      totalA += current.A;
      if (aNonZero) nonZeroACount++;
    }

    console.log(`  ${status} ${s.name}`);
    console.log(`      U=${(current.U || 0).toFixed(3)} D=${(current.D || 0).toFixed(3)} A=${(current.A || 0).toFixed(3)} H=${(current.H || 0).toFixed(3)}`);
    if (current.lastFlipAlert) {
      console.log(`      ⚡ 翻转预警: ${current.lastFlipAlert.message}`);
    }
    console.log();
  }

  // ─── 总结 ───────────────────────────────────────────────
  console.log('=== 汇总 ===');
  console.log(`  总场景数: ${scenarios.length}`);
  console.log(`  非零A值场景: ${nonZeroACount}/${scenarios.length}`);
  console.log(`  平均A值: ${(totalA / (nonZeroACount || 1)).toFixed(3)}`);

  // 额外测试：通过 getFieldSummary 查看完整轨迹
  const fullSummary = router.getFieldSummary();
  console.log(`\n  场域历史步数: ${fullSummary?.steps || 0}`);
  console.log(`  驱动分布: ${JSON.stringify(fullSummary?.driverDistribution || {})}`);
  console.log(`  翻转预警总数: ${fullSummary?.stats?.flipAlerts || 0}`);
  console.log(`  谐振态: ${fullSummary?.resonance?.active ? '活跃' : '未激活'}`);

  if (allOk) {
    console.log('\n✅ 所有场景 A 值非零');
  } else {
    console.log('\n⚠️ 存在 A=0 场景 — 需要更多矛盾信号注入');
  }

  // 输出兼容 ThinkCheck 的格式
  console.log('\n=== ThinkCheck 兼容输出 ===');
  const hist = router._fieldHistory || [];
  if (hist.length === 0) {
    console.log('(场域历史为空 — 需要至少一次 evaluate() 调用)');
  } else {
    hist.forEach(h => {
      console.log(`STEP ${h.step}: U=${h.U.toFixed(3)} D=${h.D.toFixed(3)} A=${h.A.toFixed(3)} H=${h.H.toFixed(3)} driver=${h.driver}${h.flipAlert ? ' ⚡'+h.flipAlert : ''}`);
    });
  }
}

main().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
