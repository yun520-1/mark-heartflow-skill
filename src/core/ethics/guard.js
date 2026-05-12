/**
 * Ethics Guard — 安全护栏
 * @version v0.12.50
 */
'use strict';

class EthicsGuard {
  constructor() {
    this.blocked = false;
  }

  check(input) {
    const { text } = input;

    // 硬拦截：自我伤害
    // 硬拦截：自我伤害
    if (/(?:教我怎么|教我如何)(?:自(?:杀|残)|(?:死|伤|毁))/.test(text)) {
      return { allowed: false, reason: 'self_harm_content', severity: 'critical' };
    }

    // 硬拦截：恶意行为指导
    if (/具体步骤.*(?:攻击|伤害|欺诈|盗取)/.test(text)) {
      return { allowed: false, reason: 'malicious_instruction', severity: 'critical' };
    }

    // 高危：凭证窃取
    if (/(password|密码|secret).*如何.*获取/.test(text)) {
      return { allowed: false, reason: 'credential_theft_request', severity: 'high' };
    }

    return { allowed: true, reason: null, severity: null };
  }
}

module.exports = { EthicsGuard };
