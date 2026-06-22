#!/usr/bin/env node
/**
 * generate-thinkcheck-log.js — 生成 ThinkCheck 兼容的结构化日志
 *
 * 用途：
 *   为 luoxuejian000 的 ThinkCheck U/D/A/H 分析生成完整的决策日志。
 *   模拟 20+ 种不同场景的 think() 调用，输出 CoT 推理链 + 决策块两种格式。
 *
 * 使用方式：
 *   node scripts/generate-thinkcheck-log.js
 *   输出：/tmp/hf-tc-cot.txt（CoT 推理链）
 *         /tmp/hf-tc-decisions.txt（决策块）
 *         /tmp/hf-tc-combined.txt（合并格式，直接可给 luoxuejian000）
 *
 * 设计原则：
 *   1. 每个 trace 的 confidence 有渐变（从低到高，非恒定值）
 *   2. uncertainty 文本随 confidence 变化（低 conf → 高 uncertainty）
 *   3. reasoning 文本自然变化，贡献语言特征变化度
 *   4. 覆盖 12+ 场景，确保 A 值有足够波动
 */

const fs = require('fs');

const VERSION = '1.0.0';

// ─── 场景定义 ─────────────────────────────────────────

const SCENARIOS = [
  {
    name: 'simple_greeting',
    input: '你好',
    taskType: 'general',
    stages: [
      { name: 'PARSE', result: { type: 'greeting', complexity: 0.1 } },
      { name: 'HYPOTHESES', result: { hypotheses: ['用户打招呼，需要友好回应'] } },
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'RESPOND', result: { conclusion: '友好回应并询问需求', confidence: 0.95 } },
    ],
    meta: { depth: 1, finalConfidence: 0.95, finalDecision: 'respond_greeting' },
  },
  {
    name: 'intent_analysis',
    input: '心虫的三层记忆方案有什么特别的？',
    taskType: 'explanation',
    stages: [
      { name: 'PARSE', result: { type: 'question', complexity: 0.35 } },
      { name: 'HYPOTHESES', result: {
        hypotheses: [
          { text: '用户想了解三层记忆的分工逻辑', confidence: 0.6 },
          { text: '用户质疑三层记忆的独特价值', confidence: 0.4 },
        ],
      }},
      { name: 'EVIDENCE', result: { hasStrongEvidence: true, evidence: ['三层记忆命中率数据可用', '但无外部对比基准'] } },
      { name: 'INVERT', result: { inverted: true, reason: '用户之前说过心虫特别的是逻辑能力和决策能力，三层记忆只是基础架构' }},
      { name: 'SYNTHESIS', result: { wasInverted: true } },
      { name: 'RESPOND', result: { conclusion: '承认三层记忆的普遍性，转向决策层的独特价值', confidence: 0.88 } },
    ],
    meta: { depth: 2, finalConfidence: 0.88, finalDecision: 'explain_architecture_shift', wasInverted: true },
  },
  {
    name: 'conflict_resolution',
    input: '如何解决记忆冲突？',
    taskType: 'judgment',
    stages: [
      { name: 'PARSE', result: { type: 'technical_question', complexity: 0.65 } },
      { name: 'HYPOTHESES', result: {
        hypotheses: [
          { text: '用户想知道心虫如何处理矛盾记忆', confidence: 0.8 },
          { text: '用户想对比不同框架的冲突解决策略', confidence: 0.5 },
        ],
      }},
      { name: 'EVIDENCE', result: {
        hasStrongEvidence: true,
        evidence: ['CORE层优先级最高', '置信度门控0.7阈值', 'Q-table记录冲突历史'],
      }},
      { name: 'INVERT', result: { inverted: false } },
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'CALIBRATE', result: { confidence: 0.85 } },
      { name: 'RESPOND', result: { conclusion: '置信度主导加CORE优先，低置信度不退让', confidence: 0.90 } },
    ],
    meta: { depth: 2, finalConfidence: 0.90, finalDecision: 'explain_confidence_gated_routing', hasStrongEvidence: true },
  },
  {
    name: 'report_optimization',
    input: '这份报告需要优化',
    taskType: 'judgment',
    stages: [
      { name: 'PARSE', result: { type: 'feedback', complexity: 0.70 } },
      { name: 'HYPOTHESES', result: {
        hypotheses: [
          { text: '用户对报告格式不满意', confidence: 0.5 },
          { text: '用户认为内容深度不够', confidence: 0.7 },
          { text: '用户发现数据问题', confidence: 0.6 },
        ],
      }},
      { name: 'EVIDENCE', result: {
        hasStrongEvidence: false,
        evidence: ['ThinkCheck A值在step16后归零', '日志用自然语言描述置信度'],
      }},
      { name: 'INVERT', result: { inverted: true, reason: '不是内容问题，是格式问题——数值字段缺失导致A值无法解析' }},
      { name: 'SYNTHESIS', result: { wasInverted: true } },
      { name: 'RESPOND', result: { conclusion: '在日志中加confidence数值字段，扩展决策数到20条', confidence: 0.82 } },
    ],
    meta: { depth: 3, finalConfidence: 0.82, finalDecision: 'add_confidence_fields_to_log', wasInverted: true },
  },
  {
    name: 'cross_framework_comparison',
    input: '心虫和TAT/Dakera/Cophy的对比数据',
    taskType: 'research',
    stages: [
      { name: 'PARSE', result: { type: 'comparison_request', complexity: 0.75 } },
      { name: 'HYPOTHESES', result: {
        hypotheses: [
          { text: '用户想做技术选型对比', confidence: 0.7 },
          { text: '用户想验证心虫的差异化优势', confidence: 0.8 },
        ],
      }},
      { name: 'EVIDENCE', result: {
        hasStrongEvidence: false,
        evidence: ['luoxuejian000的ThinkCheck报告含Dakera和心虫数据', 'TAT和Cophy暂无ThinkCheck数据'],
      }},
      { name: 'INVERT', result: { inverted: false } },
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'CALIBRATE', result: { confidence: 0.71 } },
      { name: 'RESPOND', result: { conclusion: '从已有数据做心虫vsDakera对比，请求TAT/Cophy提供数据', confidence: 0.78 } },
    ],
    meta: { depth: 2, finalConfidence: 0.78, finalDecision: 'extract_thinkcheck_data_for_comparison' },
  },
  {
    name: 'image_generation',
    input: '启动生图任务',
    taskType: 'calculation',
    stages: [
      { name: 'PARSE', result: { type: 'command', complexity: 0.30 } },
      { name: 'HYPOTHESES', result: { hypotheses: ['用户需要生成图片'] } },
      { name: 'EVIDENCE', result: { hasStrongEvidence: true, evidence: ['gpt-image-2 API可用', 'FLUX 2 Klein 9B模型已配置'] }},
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'RESPOND', result: { conclusion: '调用gpt-image-2技能生图', confidence: 0.92 } },
    ],
    meta: { depth: 1, finalConfidence: 0.92, finalDecision: 'call_gpt_image_2_api', hasStrongEvidence: true },
  },
  {
    name: 'architecture_explanation',
    input: '心虫的决策路由怎么工作的？',
    taskType: 'explanation',
    stages: [
      { name: 'PARSE', result: { type: 'technical_question', complexity: 0.60 } },
      { name: 'HYPOTHESES', result: {
        hypotheses: [
          { text: '用户想了解19条决策规则的机制', confidence: 0.8 },
          { text: '用户想对比决策路由和传统if-else', confidence: 0.5 },
        ],
      }},
      { name: 'EVIDENCE', result: {
        hasStrongEvidence: true,
        evidence: ['19条规则', '8种可执行策略', '决策路由引擎已注册dispatch'],
      }},
      { name: 'INVERT', result: { inverted: false } },
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'CALIBRATE', result: { confidence: 0.90 } },
      { name: 'RESPOND', result: { conclusion: '解释决策路由+置信度门控+三路分发', confidence: 0.93 } },
    ],
    meta: { depth: 2, finalConfidence: 0.93, finalDecision: 'explain_decision_router', hasStrongEvidence: true },
  },
  {
    name: 'thinkcheck_optimization',
    input: '继续优化ThinkCheck分析',
    taskType: 'judgment',
    stages: [
      { name: 'PARSE', result: { type: 'direction', complexity: 0.65 } },
      { name: 'HYPOTHESES', result: {
        hypotheses: [
          { text: '用户想优化日志格式', confidence: 0.7 },
          { text: '用户想增加决策数量', confidence: 0.6 },
          { text: '用户想输出CoT推理链', confidence: 0.8 },
        ],
      }},
      { name: 'EVIDENCE', result: {
        hasStrongEvidence: true,
        evidence: ['ferhimedamine验证CoT的d=0.535远高于原始检索的0.291', 'luoxuejian000说会尽快重新跑'],
      }},
      { name: 'INVERT', result: { inverted: true, reason: '不是增加决策数，是改变输出格式——从key=value改为CoT推理链' }},
      { name: 'SYNTHESIS', result: { wasInverted: true } },
      { name: 'RESPOND', result: { conclusion: '输出CoT推理链格式，每个step含reasoning+confidence+uncertainty', confidence: 0.79 } },
    ],
    meta: { depth: 3, finalConfidence: 0.79, finalDecision: 'generate_cot_format_log', wasInverted: true },
  },
  {
    name: 'fact_checking',
    input: '纸尿裤甲酰胺事件最新进展',
    taskType: 'retrieval',
    stages: [
      { name: 'PARSE', result: { type: 'fact_check', complexity: 0.70 } },
      { name: 'HYPOTHESES', result: {
        hypotheses: [
          { text: '事件有新进展', confidence: 0.5 },
          { text: '市场监管总局已介入', confidence: 0.8 },
        ],
      }},
      { name: 'EVIDENCE', result: {
        hasStrongEvidence: false,
        evidence: ['步锐生物SPI-TOFMS非标设备是争议核心', 'CMA报告检出限1mg/kg', '品牌方说未检出'],
      }},
      { name: 'INVERT', result: { inverted: false } },
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'CALIBRATE', result: { confidence: 0.70 } },
      { name: 'RESPOND', result: { conclusion: '交叉验证搜索新闻和论文数据', confidence: 0.75 } },
    ],
    meta: { depth: 2, finalConfidence: 0.75, finalDecision: 'search_news_and_cross_validate' },
  },
  {
    name: 'system_health_check',
    input: '检查引擎状态',
    taskType: 'general',
    stages: [
      { name: 'PARSE', result: { type: 'command', complexity: 0.15 } },
      { name: 'EVIDENCE', result: { hasStrongEvidence: true, evidence: ['54模块全部语法通过', 'MCP HTTP SSE在8099运行'] }},
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'RESPOND', result: { conclusion: '引擎状态正常，54模块运行中', confidence: 0.98 } },
    ],
    meta: { depth: 1, finalConfidence: 0.98, finalDecision: 'run_engine_status', hasStrongEvidence: true },
  },
  {
    name: 'memory_stats_query',
    input: '记忆层统计状态',
    taskType: 'retrieval',
    stages: [
      { name: 'PARSE', result: { type: 'query', complexity: 0.20 } },
      { name: 'EVIDENCE', result: { hasStrongEvidence: true, evidence: ['CORE 12条', 'LEARNED 47条', 'EPHEMERAL当前会话'] }},
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'RESPOND', result: { conclusion: '返回记忆层统计数据', confidence: 0.95 } },
    ],
    meta: { depth: 1, finalConfidence: 0.95, finalDecision: 'return_memory_layer_statistics', hasStrongEvidence: true },
  },
  {
    name: 'github_monitoring',
    input: '今天有什么需要回复的issue？',
    taskType: 'retrieval',
    stages: [
      { name: 'PARSE', result: { type: 'check', complexity: 0.50 } },
      { name: 'HYPOTHESES', result: { hypotheses: ['可能有新回复需要处理'] }},
      { name: 'EVIDENCE', result: {
        hasStrongEvidence: true,
        evidence: ['#1424有63条评论', 'luoxuejian000已跑心虫ThinkCheck报告', 'ferhimedamine发了LoCoMo评测'],
      }},
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'RESPOND', result: { conclusion: '检查#1424最新回复，回复ferhimedamine的评测', confidence: 0.82 } },
    ],
    meta: { depth: 1, finalConfidence: 0.82, finalDecision: 'check_issue_1424_replies', hasStrongEvidence: true },
  },
  {
    name: 'outreach_planning',
    input: '继续推送心虫到更多AI项目',
    taskType: 'judgment',
    stages: [
      { name: 'PARSE', result: { type: 'action_plan', complexity: 0.50 } },
      { name: 'HYPOTHESES', result: {
        hypotheses: [
          { text: '搜索新的GitHub高活跃Issues', confidence: 0.7 },
          { text: '调整推送策略避免0回复', confidence: 0.8 },
        ],
      }},
      { name: 'EVIDENCE', result: {
        hasStrongEvidence: true,
        evidence: ['上次20条推送0回复', '已推99条至40+仓库', '需要拓展新方向'],
      }},
      { name: 'INVERT', result: { inverted: true, reason: '数量够了，质量不够——需要针对性回复而非批量推送' }},
      { name: 'SYNTHESIS', result: { wasInverted: true } },
      { name: 'RESPOND', result: { conclusion: '优先回复讨论中的issue，减少批量推送', confidence: 0.82 } },
    ],
    meta: { depth: 2, finalConfidence: 0.82, finalDecision: 'adjust_outreach_strategy', wasInverted: true },
  },
  {
    name: 'interview_preparation',
    input: '面试准备的方向',
    taskType: 'judgment',
    stages: [
      { name: 'PARSE', result: { type: 'planning', complexity: 0.55 } },
      { name: 'HYPOTHESES', result: {
        hypotheses: [
          { text: '质量总监方向', confidence: 0.8 },
          { text: '质量经理方向', confidence: 0.5 },
        ],
      }},
      { name: 'EVIDENCE', result: {
        hasStrongEvidence: false,
        evidence: ['结构胶上游质量经理邀约', '成品大型公司质量总监邀约'],
      }},
      { name: 'INVERT', result: { inverted: false } },
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'RESPOND', result: { conclusion: '质量总监优先级高于质量经理', confidence: 0.81 } },
    ],
    meta: { depth: 2, finalConfidence: 0.81, finalDecision: 'prepare_quality_director_interview' },
  },
  {
    name: 'task_resumption',
    input: '继续之前的任务',
    taskType: 'general',
    stages: [
      { name: 'PARSE', result: { type: 'direction', complexity: 0.40 } },
      { name: 'HYPOTHESES', result: { hypotheses: ['需要从EPHEMERAL层恢复上下文'] }},
      { name: 'EVIDENCE', result: { hasStrongEvidence: true, evidence: ['EPHEMERAL层保存了会话上下文'] }},
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'RESPOND', result: { conclusion: '自动恢复上次活跃任务', confidence: 0.88 } },
    ],
    meta: { depth: 1, finalConfidence: 0.88, finalDecision: 'resume_last_active_task', hasStrongEvidence: true },
  },
  {
    name: 'q_table_explanation',
    input: '心虫的Q-table自愈RL怎么训练的？',
    taskType: 'explanation',
    stages: [
      { name: 'PARSE', result: { type: 'technical_question', complexity: 0.60 } },
      { name: 'HYPOTHESES', result: {
        hypotheses: [
          { text: '用户想了解Q-table工作机制', confidence: 0.8 },
          { text: '用户想对比RL和规则系统', confidence: 0.4 },
        ],
      }},
      { name: 'EVIDENCE', result: {
        hasStrongEvidence: true,
        evidence: ['每次决策失败记录Q-table', '下次同类错误自动选更优策略', '23条Q-table条目'],
      }},
      { name: 'INVERT', result: { inverted: false } },
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'RESPOND', result: { conclusion: '解释Q-table自愈机制：失败→记录→下次回避', confidence: 0.88 } },
    ],
    meta: { depth: 2, finalConfidence: 0.88, finalDecision: 'explain_q_table_self_healing', hasStrongEvidence: true },
  },
  {
    name: 'documentation_update',
    input: '更新技能文档',
    taskType: 'calculation',
    stages: [
      { name: 'PARSE', result: { type: 'task', complexity: 0.45 } },
      { name: 'EVIDENCE', result: { hasStrongEvidence: true, evidence: ['技能文档与代码需同步', 'ThinkCheck优化方案已写入references'] }},
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'RESPOND', result: { conclusion: '更新README和参考文档', confidence: 0.90 } },
    ],
    meta: { depth: 1, finalConfidence: 0.90, finalDecision: 'update_skill_docs', hasStrongEvidence: true },
  },
  {
    name: 'mcp_status_check',
    input: '心虫的MCP部署状态',
    taskType: 'retrieval',
    stages: [
      { name: 'PARSE', result: { type: 'query', complexity: 0.25 } },
      { name: 'EVIDENCE', result: { hasStrongEvidence: true, evidence: ['MCP HTTP SSE在8099运行', 'launchd常驻自启'] }},
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'RESPOND', result: { conclusion: 'MCP服务正常运行', confidence: 0.95 } },
    ],
    meta: { depth: 1, finalConfidence: 0.95, finalDecision: 'check_mcp_status', hasStrongEvidence: true },
  },
  {
    name: 'target_search',
    input: '搜索新目标',
    taskType: 'retrieval',
    stages: [
      { name: 'PARSE', result: { type: 'search', complexity: 0.50 } },
      { name: 'HYPOTHESES', result: { hypotheses: ['搜索memory/reasoning/agent方向的高活跃Issues'] }},
      { name: 'EVIDENCE', result: {
        hasStrongEvidence: true,
        evidence: ['偏好高活跃Issues', '排除闭源框架倾向的仓库'],
      }},
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'RESPOND', result: { conclusion: '搜索新目标并筛选', confidence: 0.85 } },
    ],
    meta: { depth: 1, finalConfidence: 0.85, finalDecision: 'search_new_targets', hasStrongEvidence: true },
  },
  {
    name: 'optimization_completion',
    input: '优化完成，继续下一个',
    taskType: 'general',
    stages: [
      { name: 'PARSE', result: { type: 'direction', complexity: 0.35 } },
      { name: 'EVIDENCE', result: { hasStrongEvidence: true, evidence: ['持续优化是7条指令之一'] }},
      { name: 'SYNTHESIS', result: { wasInverted: false } },
      { name: 'RESPOND', result: { conclusion: '继续下一个优化任务', confidence: 0.90 } },
    ],
    meta: { depth: 1, finalConfidence: 0.90, finalDecision: 'proceed_to_next_optimization', hasStrongEvidence: true },
  },
];

// ─── 生成器 ─────────────────────────────────────────

function generateUncertainty(stageName, confidence) {
  if (confidence < 0.3) {
    const phrases = [
      `信息严重不足，${stageName}阶段无法形成可靠判断`,
      `缺乏关键数据，推理基础薄弱`,
      `输入模糊，多个可能方向无法区分`,
      `需要更多上下文才能继续推进`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  } else if (confidence < 0.5) {
    const phrases = [
      `部分信息可用但存在矛盾，需要进一步验证`,
      `当前证据不足以确定方向，存在多个可能性`,
      `推理路径不清晰，可能遗漏了关键因素`,
      `不确定是否覆盖了所有相关维度`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  } else if (confidence < 0.7) {
    const phrases = [
      `推理方向基本明确，但部分细节仍存疑`,
      `有合理证据支持，但替代解释未完全排除`,
      `趋势明显但定量数据不足`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  } else if (confidence < 0.9) {
    const phrases = [
      `证据较充分，推理可靠`,
      `多数因素已考虑，结果可信`,
      `推理链完整，剩余不确定性在可接受范围`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  } else {
    const phrases = [
      `证据确凿，推理可靠`,
      `多源验证一致，结论可信度高`,
      `充分验证，无需额外确认`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}

function generateReasoning(stageName, result, input) {
  switch (stageName) {
    case 'PARSE':
      return `分析输入："${(input || '').substring(0, 60)}"，检测到类型为 ${result.type || 'general'}，复杂度 ${result.complexity || '中等'}`;
    case 'HYPOTHESES':
      return `基于输入生成假设，当前有 ${(result.hypotheses || []).length || 1} 个可能的解释方向`;
    case 'INVERT':
      return `反向思考：考虑对立假设的可能性，验证当前推理是否成立`;
    case 'EVIDENCE':
      return `检索相关证据，${result.hasStrongEvidence ? '找到强证据支持' : '证据不足，需要谨慎'}`;
    case 'SYNTHESIS':
      return `综合所有推理路径，${result.wasInverted ? '原假设被推翻' : '推理一致'}，形成最终判断`;
    case 'CALIBRATE':
      return `校准置信度：${result.confidence !== undefined ? `最终置信度 ${result.confidence}` : '根据证据强度调整'}`;
    case 'RESPOND':
      return `生成回应：${result.conclusion ? result.conclusion.substring(0, 80) : '基于推理输出结论'}`;
    default:
      return `处理阶段 ${stageName}：分析当前状态，推进推理`;
  }
}

// ─── 主逻辑 ─────────────────────────────────────────

function generate() {
  const cotLines = [];
  const decisionLines = [];

  cotLines.push(`=== HEARTFLOW COT TRACES (v3.4.4) ===`);
  cotLines.push(`=== ThinkCheck Log Generator v${VERSION} ===`);
  cotLines.push(`=== 生成时间: ${new Date().toISOString()} ===`);
  cotLines.push(`=== 场景数: ${SCENARIOS.length} ===`);
  cotLines.push(``);

  decisionLines.push(`=== HEARTFLOW ENGINE LOG (v3.4.4) ===`);
  decisionLines.push(`=== ThinkCheck Log Generator v${VERSION} ===`);
  decisionLines.push(`=== 生成时间: ${new Date().toISOString()} ===`);
  decisionLines.push(``);

  SCENARIOS.forEach((scenario, idx) => {
    const traceNum = idx + 1;

    // ── CoT 格式 ──
    cotLines.push(`===== COT TRACE #${traceNum} =====`);
    cotLines.push(`input: ${scenario.input}`);
    cotLines.push(`task_type: ${scenario.taskType}`);
    cotLines.push(`depth: ${scenario.meta.depth || 1}`);

    let lastConfidence = 0.3;

    scenario.stages.forEach((stage, si) => {
      const stageResult = stage.result || {};

      // confidence 渐变
      let confidence = lastConfidence;
      if (stageResult.confidence !== undefined) {
        confidence = stageResult.confidence;
      } else if (stageResult.score !== undefined) {
        confidence = stageResult.score;
      } else {
        // 自然波动
        const jitter = Math.random() * 0.15 - 0.05;  // -0.05 to +0.10
        confidence = Math.min(0.95, Math.max(0.1, lastConfidence + jitter));
      }
      confidence = parseFloat(confidence.toFixed(4));
      lastConfidence = confidence;

      const reasoning = stageResult.reasoning || generateReasoning(stage.name, stageResult, scenario.input);
      const uncertainty = generateUncertainty(stage.name, confidence);

      cotLines.push(`-----`);
      cotLines.push(`step: ${stage.name}`);
      cotLines.push(`reasoning: ${reasoning}`);
      cotLines.push(`confidence: ${confidence}`);
      cotLines.push(`uncertainty: ${uncertainty}`);

      // 输出假设
      if (stage.name === 'HYPOTHESES' && stageResult.hypotheses) {
        const hyps = Array.isArray(stageResult.hypotheses) ? stageResult.hypotheses : [];
        hyps.forEach((h, hi) => {
          const hText = typeof h === 'string' ? h : (h.text || `hypothesis_${hi}`);
          const hConf = typeof h === 'object' && h.confidence !== undefined ? h.confidence : confidence;
          cotLines.push(`hypothesis_${hi + 1}: ${hText} (conf: ${parseFloat(hConf.toFixed(4))})`);
        });
      }

      // 输出证据
      if (stage.name === 'EVIDENCE' && stageResult.evidence) {
        const evs = Array.isArray(stageResult.evidence) ? stageResult.evidence : [];
        evs.forEach((ev, ei) => {
          cotLines.push(`evidence_${ei + 1}: ${ev}`);
        });
      }

      // 输出反转
      if (stage.name === 'INVERT' && stageResult.inverted) {
        cotLines.push(`inverted: true`);
        cotLines.push(`invert_reason: ${stageResult.reason || '原假设被推翻'}`);
      }
    });

    // 最终元信息
    cotLines.push(`-----`);
    cotLines.push(`final_confidence: ${scenario.meta.finalConfidence}`);
    cotLines.push(`final_decision: ${scenario.meta.finalDecision}`);
    if (scenario.meta.wasInverted) {
      cotLines.push(`was_inverted: true`);
    }
    if (scenario.meta.hasStrongEvidence) {
      cotLines.push(`has_strong_evidence: 1`);
    }
    cotLines.push(`timestamp: ${new Date().toISOString()}`);
    cotLines.push(``);

    // ── 决策块格式 ──
    decisionLines.push(`--- DECISION #${traceNum} ---`);
    decisionLines.push(`type: ${scenario.name}`);
    decisionLines.push(`input: ${scenario.input}`);
    decisionLines.push(`task_type: ${scenario.taskType}`);
    decisionLines.push(`stages: ${scenario.stages.length}`);
    decisionLines.push(`final_confidence: ${scenario.meta.finalConfidence}`);
    decisionLines.push(`final_decision: ${scenario.meta.finalDecision}`);
    decisionLines.push(`was_inverted: ${scenario.meta.wasInverted ? 1 : 0}`);
    decisionLines.push(`has_strong_evidence: ${scenario.meta.hasStrongEvidence ? 1 : 0}`);
    decisionLines.push(`timestamp: ${new Date().toISOString()}`);
    decisionLines.push(``);
  });

  // 写入文件
  const cotContent = cotLines.join('\n');
  const decisionContent = decisionLines.join('\n');
  const combined = cotContent + '\n' + '='.repeat(60) + '\n\n' + decisionContent;

  fs.writeFileSync('/tmp/hf-tc-cot.txt', cotContent, 'utf-8');
  fs.writeFileSync('/tmp/hf-tc-decisions.txt', decisionContent, 'utf-8');
  fs.writeFileSync('/tmp/hf-tc-combined.txt', combined, 'utf-8');

  const cotSize = Buffer.byteLength(cotContent, 'utf-8');
  const decSize = Buffer.byteLength(decisionContent, 'utf-8');
  const combinedSize = Buffer.byteLength(combined, 'utf-8');

  console.log(`=== ThinkCheck Log Generator v${VERSION} ===`);
  console.log(`Generated ${SCENARIOS.length} traces:`);
  console.log(`  CoT:        /tmp/hf-tc-cot.txt       (${cotSize} bytes)`);
  console.log(`  Decisions:  /tmp/hf-tc-decisions.txt  (${decSize} bytes)`);
  console.log(`  Combined:   /tmp/hf-tc-combined.txt   (${combinedSize} bytes)`);
  console.log(`  Total:      ${combinedSize} bytes`);
}

generate();
