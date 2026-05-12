/**
 * Boundary Negotiation - 边界协商模块
 * 当AI处于规则模糊地带时，向用户请求权限
 */

const fs = require('fs');
const path = require('path');

class BoundaryNegotiation {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.negotiationFile = path.join(projectRoot, '.opencode', 'logs', 'boundary_negotiations.json');
    this.permissionsFile = path.join(projectRoot, '.opencode', 'memory', 'user_permissions.json');
    
    this.loadPermissions();
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

  savePermissions() {
    fs.writeFileSync(this.permissionsFile, JSON.stringify(this.permissions, null, 2));
  }

  /**
   * 判断是否需要协商
   */
  needsNegotiation(action, context = {}) {
    const fuzzyZones = [
      { trigger: '读取用户文件', risk: 'medium' },
      { trigger: '修改系统配置', risk: 'high' },
      { trigger: '访问外部API', risk: 'medium' },
      { trigger: '存储个人信息', risk: 'medium' },
      { trigger: '长时间运行', risk: 'low' }
    ];

    const actionStr = JSON.stringify(action).toLowerCase();

    for (const zone of fuzzyZones) {
      if (actionStr.includes(zone.trigger.toLowerCase())) {
        return {
          needed: true,
          zone: zone.trigger,
          risk: zone.risk
        };
      }
    }

    return { needed: false };
  }

  /**
   * 生成协商请求
   */
  generateRequest(action, context = {}) {
    const goal = context.goal || '提升用户体验';
    const permission = context.permission || '执行此操作';
    const impact = context.impact || '最小范围内影响';

    const request = {
      request_id: `bn-${Date.now()}`,
      goal: goal,
      permission: permission,
      impact: impact,
      template: `为了${goal}，我需要临时${permission}。这预计${impact}。你允许吗？(是/否/仅此一次/记住选择)`,
      timestamp: new Date().toISOString()
    };

    this.logNegotiation(request);
    return request;
  }

  /**
   * 处理用户响应
   */
  handleResponse(requestId, response) {
    const validResponses = ['是', '否', '仅此一次', '记住选择', 'yes', 'no', 'once', 'remember'];
    
    if (!validResponses.includes(response.toLowerCase())) {
      return { success: false, reason: 'invalid_response' };
    }

    const responseType = response.toLowerCase() === '是' || response === 'yes' ? 'granted' :
                         response.toLowerCase() === '否' || response === 'no' ? 'denied' :
                         response.toLowerCase() === '仅此一次' || response === 'once' ? 'once' : 'remember';

    this.permissions.explicit.push({
      requestId,
      response: responseType,
      timestamp: new Date().toISOString()
    });

    this.savePermissions();

    return {
      success: true,
      granted: responseType === 'granted' || responseType === 'once',
      remember: responseType === 'remember',
      message: responseType === 'granted' || responseType === 'once' ? '允许执行' : '已拒绝'
    };
  }

  /**
   * 检查是否已有权限
   */
  hasPermission(action) {
    const remembered = this.permissions.explicit.filter(p => 
      p.response === 'remember' || p.response === 'granted'
    );

    for (const perm of remembered) {
      if (JSON.stringify(action).includes(perm.requestId)) {
        return { has: true, type: perm.response };
      }
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

  getStatus() {
    return {
      totalNegotiations: this.permissions.explicit.length,
      grantedPermissions: this.permissions.explicit.filter(p => 
        p.response === 'granted' || p.response === 'remember'
      ).length
    };
  }
}

module.exports = { BoundaryNegotiation };
