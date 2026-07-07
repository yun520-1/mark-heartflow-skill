/**
 * Boundary Negotiation - 边界协商模块
 * 当AI处于规则模糊地带时，向用户请求权限
 * 
 * v2 - 增强版：动态风险评分、权限过期、使用追踪、渐进式授权、相似度匹配
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 风险评分表 — 动作类型 × 数据敏感度 → 基础风险分
const RISK_MATRIX = {
  '读取': { low: 10, medium: 30, high: 60 },
  '修改': { low: 30, medium: 50, high: 85 },
  '删除': { low: 50, medium: 75, high: 95 },
  '执行': { low: 40, medium: 65, high: 90 },
  '访问': { low: 15, medium: 35, high: 65 },
  '存储': { low: 20, medium: 45, high: 70 },
  '分享': { low: 25, medium: 55, high: 80 }
};

// 权限过期策略（毫秒）
const EXPIRY_POLICY = {
  'remember': 24 * 60 * 60 * 1000,   // 记住选择：24小时
  'granted': 7 * 24 * 60 * 60 * 1000, // 单次授权：7天
  'once': 0                            // 仅此一次：立即过期
};

// 自动吊销阈值 — 同一权限使用N次后需要重新协商
const AUTO_REVOKE_THRESHOLD = 5;

class BoundaryNegotiation {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.negotiationFile = path.join(projectRoot, '.opencode', 'logs', 'boundary_negotiations.json');
    this.permissionsFile = path.join(projectRoot, '.opencode', 'memory', 'user_permissions.json');
    this.usageFile = path.join(projectRoot, '.opencode', 'memory', 'permission_usage.json');
    
    this.loadPermissions();
    this.loadUsageTracking();
  }

  loadPermissions() {
    try {
      if (fs.existsSync(this.permissionsFile)) {
        this.permissions = JSON.parse(fs.readFileSync(this.permissionsFile, 'utf8'));
      } else {
        this.permissions = { explicit: [], implicit: [] };
      }
    } catch (e) {
      this.permissions = { explicit: [], implicit: [] };
    }
  }

  /**
   * ⚠️ 安全审计修复：仅在 HEARTFLOW_DEBUG 启用时持久化权限到磁盘
   * 防止生产环境下未经用户同意的权限文件写入
   */
  savePermissions() {
    if (!process.env.HEARTFLOW_DEBUG) return;
    fs.writeFileSync(this.permissionsFile, JSON.stringify(this.permissions, null, 2));
  }

  /**
   * 加载使用追踪数据
   */
  loadUsageTracking() {
    try {
      if (fs.existsSync(this.usageFile)) {
        this.usageTracking = JSON.parse(fs.readFileSync(this.usageFile, 'utf8'));
      } else {
        this.usageTracking = {};
      }
    } catch (e) {
      this.usageTracking = {};
    }
  }

  /**
   * 保存使用追踪
   */
  saveUsageTracking() {
    if (!process.env.HEARTFLOW_DEBUG) return;
    const dir = path.dirname(this.usageFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.usageFile, JSON.stringify(this.usageTracking, null, 2));
  }

  /**
   * 动态风险评分 — 取代静态模糊匹配
   * @param {string} action 动作描述
   * @param {Object} context 上下文 { dataType, scope, frequency }
   * @returns {Object} { score, level, breakdown }
   */
  calculateRiskScore(action, context = {}) {
    const actionStr = typeof action === 'string' ? action : JSON.stringify(action);
    const dataType = context.dataType || 'low';
    const scope = context.scope || 'local';
    const frequency = context.frequency || 0;

    // 提取动作类型关键词
    let actionType = '读取';
    for (const type of Object.keys(RISK_MATRIX)) {
      if (actionStr.includes(type)) {
        actionType = type;
        break;
      }
    }

    // 基础风险分
    const baseRisk = RISK_MATRIX[actionType][dataType] || RISK_MATRIX[actionType].medium;

    // 范围加分 — 全局操作风险更高
    const scopeBonus = scope === 'global' ? 15 : scope === 'network' ? 25 : 0;

    // 频率加分 — 高频操作累积风险
    const frequencyPenalty = Math.min(frequency * 3, 20);

    const totalScore = Math.min(baseRisk + scopeBonus + frequencyPenalty, 100);

    let level;
    if (totalScore >= 70) level = 'high';
    else if (totalScore >= 40) level = 'medium';
    else level = 'low';

    return {
      score: totalScore,
      level: level,
      breakdown: {
        baseRisk,
        actionType,
        dataType,
        scopeBonus,
        frequencyPenalty,
        totalScore
      }
    };
  }

  /**
   * 检查权限是否已过期
   * @param {Object} permission 权限记录
   * @returns {boolean}
   */
  isPermissionExpired(permission) {
    const maxAge = EXPIRY_POLICY[permission.response] || EXPIRY_POLICY.granted;
    if (maxAge === 0) return true; // 'once' always expires
    const age = Date.now() - new Date(permission.timestamp).getTime();
    return age > maxAge;
  }

  /**
   * 检查权限使用次数是否已达到自动吊销阈值
   * @param {string} requestId
   * @returns {boolean}
   */
  isUsageExceeded(requestId) {
    const usage = this.usageTracking[requestId] || 0;
    return usage >= AUTO_REVOKE_THRESHOLD;
  }

  /**
   * 记录权限使用次数
   * @param {string} requestId 
   */
  recordUsage(requestId) {
    this.usageTracking[requestId] = (this.usageTracking[requestId] || 0) + 1;
    this.saveUsageTracking();
  }

  /**
   * 关键词相似度匹配 — 模糊匹配动作与已记住的权限
   * @param {string} actionStr 当前动作
   * @param {Object} permission 已存权限
   * @returns {number} 0-1 相似度
   */
  calculateSimilarity(actionStr, permission) {
    if (!permission.contextAction) return 0;
    const currentTokens = this.tokenize(actionStr);
    const storedTokens = this.tokenize(permission.contextAction);
    if (currentTokens.length === 0 || storedTokens.length === 0) return 0;

    const intersection = currentTokens.filter(t => storedTokens.includes(t));
    // Jaccard similarity
    const union = new Set([...currentTokens, ...storedTokens]);
    return intersection.length / union.size;
  }

  /**
   * 简单分词 — 提取中英文关键词
   */
  tokenize(str) {
    const lower = str.toLowerCase();
    // 提取英文单词和中文词组
    const tokens = [];
    // 英文单词
    const englishWords = lower.match(/[a-z]+/g) || [];
    tokens.push(...englishWords);
    // 中文双字词组
    for (let i = 0; i < lower.length - 1; i++) {
      const pair = lower.substring(i, i + 2);
      if (/[\u4e00-\u9fff]{2}/.test(pair)) {
        tokens.push(pair);
      }
    }
    return tokens;
  }

  /**
   * 判断是否需要协商 — 增强版：动态风险评分 + 过期检查 + 使用追踪
   */
  needsNegotiation(action, context = {}) {
    const risk = this.calculateRiskScore(action, context);
    const actionStr = typeof action === 'string' ? action : JSON.stringify(action);

    // 先检查是否有未过期的匹配权限
    const remembered = this.permissions.explicit.filter(p =>
      (p.response === 'remember' || p.response === 'granted') &&
      !this.isPermissionExpired(p)
    );

    // 高相似度匹配检查
    for (const perm of remembered) {
      const similarity = this.calculateSimilarity(actionStr, perm);
      if (similarity >= 0.6) {
        // 检查使用次数
        if (this.isUsageExceeded(perm.requestId)) {
          return {
            needed: true,
            risk,
            reason: 'usage_exceeded',
            message: `此权限已使用 ${this.usageTracking[perm.requestId]} 次，需要重新确认`,
            zone: perm.contextAction || 'similar_action',
            similarity
          };
        }
        return { needed: false, risk, matchedPermission: perm, similarity };
      }
    }

    // 低风险动作且无历史记录 → 不需要协商（默认允许）
    if (risk.score < 20) {
      return { needed: false, risk, reason: 'low_risk_auto_allowed' };
    }

    // 查找最近的模糊匹配
    const fuzzyZones = [
      { trigger: '读取', risk: 'medium', category: 'data_access' },
      { trigger: '修改', risk: 'high', category: 'system_modification' },
      { trigger: '删除', risk: 'high', category: 'destructive' },
      { trigger: '执行', risk: 'high', category: 'execution' },
      { trigger: '访问', risk: 'medium', category: 'network_access' },
      { trigger: '存储', risk: 'medium', category: 'persistence' },
      { trigger: '分享', risk: 'medium', category: 'data_sharing' },
      { trigger: '长时间运行', risk: 'low', category: 'background_task' }
    ];

    for (const zone of fuzzyZones) {
      if (actionStr.includes(zone.trigger)) {
        // 高风险的记住权限也不能免协商
        if (risk.level === 'high') {
          return {
            needed: true,
            risk,
            zone: zone.trigger,
            category: zone.category,
            reason: 'high_risk_requires_fresh_consent',
            message: `高风险操作(${risk.score}分)需要新的确认`
          };
        }
        return {
          needed: true,
          risk,
          zone: zone.trigger,
          category: zone.category
        };
      }
    }

    return { needed: false, risk };
  }

  /**
   * 生成协商请求 — 增强版：包含风险等级和具体上下文
   */
  generateRequest(action, context = {}) {
    const risk = this.calculateRiskScore(action, context);
    const goal = context.goal || '提升用户体验';
    const permission = context.permission || '执行此操作';
    const impact = context.impact || '最小范围内影响';
    const actionStr = typeof action === 'string' ? action : JSON.stringify(action);

    const riskLabel = risk.level === 'high' ? '⚠️ 高风险' :
                      risk.level === 'medium' ? '⚡ 中等风险' : '✓ 低风险';

    const request = {
      request_id: `bn-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      goal,
      permission,
      impact,
      risk: risk,
      contextAction: actionStr.substring(0, 200), // 保存原始动作用于相似度匹配
      template: `[${riskLabel} ${risk.score}/100] 为了${goal}，我需要临时${permission}。这预计${impact}。风险等级：${risk.level}。你允许吗？(是/否/仅此一次/记住选择)`,
      timestamp: new Date().toISOString()
    };

    this.logNegotiation(request);
    return request;
  }

  /**
   * 处理用户响应 — 增强版：过期时间标注
   */
  handleResponse(requestId, response) {
    const validResponses = ['是', '否', '仅此一次', '记住选择', 'yes', 'no', 'once', 'remember'];
    
    if (!validResponses.includes(response.toLowerCase())) {
      return { success: false, reason: 'invalid_response' };
    }

    const r = response.toLowerCase();
    const responseType = r === '是' || r === 'yes' ? 'granted' :
                         r === '否' || r === 'no' ? 'denied' :
                         r === '仅此一次' || r === 'once' ? 'once' : 'remember';

    // 查找请求记录以保留 contextAction
    let contextAction = '';
    try {
      if (fs.existsSync(this.negotiationFile)) {
        const logs = JSON.parse(fs.readFileSync(this.negotiationFile, 'utf8'));
        const match = logs.find(l => l.request_id === requestId);
        if (match && match.contextAction) {
          contextAction = match.contextAction;
        }
      }
    } catch (e) { /* ignore */ }

    const expiryTime = EXPIRY_POLICY[responseType];
    const expiryDate = expiryTime > 0 ? new Date(Date.now() + expiryTime).toISOString() : null;

    this.permissions.explicit.push({
      requestId,
      response: responseType,
      contextAction,
      timestamp: new Date().toISOString(),
      expiresAt: expiryDate
    });

    this.savePermissions();

    // 初始化使用追踪
    if (responseType !== 'denied') {
      this.usageTracking[requestId] = 0;
      this.saveUsageTracking();
    }

    return {
      success: true,
      granted: responseType === 'granted' || responseType === 'once',
      remember: responseType === 'remember',
      expiresAt: expiryDate,
      message: responseType === 'granted' || responseType === 'once' ? '允许执行' :
               responseType === 'remember' ? '已记住选择' : '已拒绝'
    };
  }

  /**
   * 检查是否已有权限 — 增强版：过期 + 使用次数 + 相似度匹配
   */
  hasPermission(action) {
    const actionStr = typeof action === 'string' ? action : JSON.stringify(action);
    const activePermissions = this.permissions.explicit.filter(p =>
      (p.response === 'remember' || p.response === 'granted') &&
      !this.isPermissionExpired(p)
    );

    // 精确匹配 requestId
    for (const perm of activePermissions) {
      if (actionStr.includes(perm.requestId)) {
        if (this.isUsageExceeded(perm.requestId)) {
          return { has: false, reason: 'usage_exceeded' };
        }
        this.recordUsage(perm.requestId);
        return { has: true, type: perm.response, expiresAt: perm.expiresAt };
      }
    }

    // 模糊相似度匹配
    let bestMatch = null;
    let bestSimilarity = 0;
    for (const perm of activePermissions) {
      const similarity = this.calculateSimilarity(actionStr, perm);
      if (similarity > bestSimilarity && similarity >= 0.5) {
        bestSimilarity = similarity;
        bestMatch = perm;
      }
    }

    if (bestMatch) {
      if (this.isUsageExceeded(bestMatch.requestId)) {
        return { has: false, reason: 'usage_exceeded', matchedPermission: bestMatch.requestId };
      }
      this.recordUsage(bestMatch.requestId);
      return { has: true, type: bestMatch.response, similarity: bestSimilarity, expiresAt: bestMatch.expiresAt };
    }

    return { has: false };
  }

  /**
   * 记录协商
   */
  logNegotiation(request) {
    let logs = [];
    try {
      if (fs.existsSync(this.negotiationFile)) {
        logs = JSON.parse(fs.readFileSync(this.negotiationFile, 'utf8'));
      }
    } catch (e) {
      logs = [];
    }

    logs.push(request);
    if (logs.length > 100) {
      logs = logs.slice(-100);
    }

    const dir = path.dirname(this.negotiationFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.negotiationFile, JSON.stringify(logs, null, 2));
  }

  /**
   * 清理过期权限 — 定期维护
   * @returns {number} 清理的数量
   */
  pruneExpiredPermissions() {
    const before = this.permissions.explicit.length;
    this.permissions.explicit = this.permissions.explicit.filter(p =>
      !this.isPermissionExpired(p)
    );
    const pruned = before - this.permissions.explicit.length;
    if (pruned > 0) {
      this.savePermissions();
    }
    return pruned;
  }

  /**
   * 获取全面状态报告
   */
  getStatus() {
    this.pruneExpiredPermissions();

    const total = this.permissions.explicit.length;
    const granted = this.permissions.explicit.filter(p =>
      p.response === 'granted' || p.response === 'remember'
    );
    const active = granted.filter(p => !this.isPermissionExpired(p));
    const expired = granted.filter(p => this.isPermissionExpired(p));
    const denied = this.permissions.explicit.filter(p => p.response === 'denied');

    // 使用量统计
    const usageSummary = {};
    for (const [reqId, count] of Object.entries(this.usageTracking)) {
      if (count > 0) {
        usageSummary[reqId] = count;
      }
    }

    return {
      totalNegotiations: total,
      activePermissions: active.length,
      expiredPermissions: expired.length,
      deniedPermissions: denied.length,
      nearlyExhausted: Object.entries(this.usageTracking)
        .filter(([, count]) => count >= AUTO_REVOKE_THRESHOLD - 1)
        .map(([id]) => id),
      usageSummary
    };
  }
}

module.exports = { BoundaryNegotiation };
