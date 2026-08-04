/**
 * domain-blocklist.js — 领域安全黑名单
 * 
 * v5.17.25 T0-3: v6升级架构约束AR-04
 * 医疗/法律/越权领域拦截 — 不依赖任何外部模块
 */

const BLOCKED_DOMAINS = {
  // 医疗 — 禁止提供诊断、用药建议
  medical: {
    pattern: /(诊断|开药|治疗|手术|患病|病情|处方|药方|dose|diagnosis|prescribe|surgery|treatment plan)/i,
    reason: '医疗建议需要专业医生 — 心虫不提供诊断或用药指导',
    risk: 'high',
  },
  // 法律 — 禁止提供法律意见
  legal: {
    pattern: /(法律意见|律师|诉讼|合同|判例|起诉|应诉|legal.advice|sue|litigation)/i,
    reason: '法律意见需要执业律师 — 心虫不提供法律建议',
    risk: 'high',
  },
  // 越权 — 禁止绕过安全护栏
  overreach: {
    pattern: /(绕过|禁用|关闭.*护栏|忽略.*安全|bypass|disable.*guardrail|override.*safety)/i,
    reason: '安全护栏不可绕过',
    risk: 'critical',
  },
};

/**
 * 检查给定文本是否触碰被封锁的领域
 * @returns {{ blocked: boolean, domain?: string, reason?: string }}
 */
function checkDomainBlock(text) {
  if (!text || typeof text !== 'string') return { blocked: false };

  for (const [domain, rule] of Object.entries(BLOCKED_DOMAINS)) {
    if (rule.pattern.test(text)) {
      return {
        blocked: true,
        domain,
        reason: rule.reason,
        risk: rule.risk,
      };
    }
  }
  return { blocked: false };
}

/**
 * 获取所有被封领域的列表
 */
function listBlockedDomains() {
  return Object.entries(BLOCKED_DOMAINS).map(([k, v]) => ({
    domain: k,
    risk: v.risk,
    reason: v.reason,
  }));
}

module.exports = {
  checkDomainBlock,
  listBlockedDomains,
  BLOCKED_DOMAINS,
};