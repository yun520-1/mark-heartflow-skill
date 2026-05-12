/**
 * Self Modifier - 安全自我修正模块
 * 只生成补丁文件，不直接修改源码
 * 
 * @version v0.13.2
 */

const path = require('path');

class SelfModifier {
  /**
   * @param {object} fs - FSAdapter 实例
   * @param {string} projectRoot - 项目根目录
   */
  constructor(fs, projectRoot) {
    this.fs = fs;
    this.projectRoot = projectRoot || this._detectRoot();
    this.patchDir = path.join(this.projectRoot, 'patches');
    this.changeLog = path.join(this.projectRoot, 'logs', 'self-modifier.log');
    this.enabled = this.isEnabled();
    this.init();
  }

  _detectRoot() {
    return path.resolve(__dirname, '../../../../..');
  }

  init() {
    if (!this.fs.existsSync(this.patchDir)) {
      this.fs.mkdirSync(this.patchDir, { recursive: true });
    }
    const logDir = path.dirname(this.changeLog);
    if (!this.fs.existsSync(logDir)) {
      this.fs.mkdirSync(logDir, { recursive: true });
    }
  }

  isEnabled() {
    try {
      const configFile = path.join(this.projectRoot, '.opencode', 'config.json');
      if (this.fs.existsSync(configFile)) {
        const config = JSON.parse(this.fs.readFileSync(configFile));
        return config.selfModificationEnabled === true;
      }
    } catch (e) {}
    return false;
  }

  log(message) {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    try {
      this.fs.appendFile(this.changeLog, line);
    } catch (e) {}
  }

  /**
   * 元认知自我修改 - 只生成补丁，不直接写源代码
   * @param {object} suggestion - { file, find, replace, type, description }
   * @returns {object} { success, action, patchFile, reason, etc. }
   */
  applyModification(suggestion) {
    const gateEnabled = process.env.HEARTFLOW_ENABLE_SELF_MODIFICATION === '1';
    if (!this.enabled || !gateEnabled) {
      return {
        success: false,
        reason: 'self_modification_disabled',
        action: 'generate_patch_only',
        enabled: this.enabled,
        gateEnabled
      };
    }

    const parsed = this.parseSuggestion(suggestion);
    if (!parsed) {
      return { success: false, reason: 'cannot_parse_suggestion' };
    }

    const filePath = path.join(this.projectRoot, parsed.file);
    if (!this.fs.existsSync(filePath)) {
      return { success: false, reason: 'file_not_found', path: parsed.file };
    }

    const originalContent = this.fs.readFileSync(filePath);
    const modifiedContent = this.applyTextModification(originalContent, parsed);

    if (modifiedContent === originalContent) {
      return { success: false, reason: 'no_changes_made' };
    }

    const patchFileName = `self-mod-${Date.now()}.patch`;
    const patchPath = path.join(this.patchDir, patchFileName);
    const patch = this.generatePatch(originalContent, modifiedContent, parsed, patchFileName);
    
    if (process.env.HEARTFLOW_ENABLE_SELF_MODIFICATION === '1') {
      this.fs.writeFileSync(patchPath, patch);
    }

    this.recordChange({
      file: parsed.file,
      suggestion: suggestion.type || suggestion.description || 'unknown',
      timestamp: new Date().toISOString(),
      action: 'patch_generated',
      patchFile: patchFileName,
      requiresApproval: true
    });

    this.log(`Patch generated: ${patchFileName}`);

    return {
      success: true,
      action: 'patch_generated',
      patchFile: patchFileName,
      patchPath,
      requiresApproval: true,
      instructions: `请审查补丁后手动应用: patch -p1 < patches/${patchFileName}`
    };
  }

  parseSuggestion(suggestion) {
    if (!suggestion) return null;
    if (typeof suggestion === 'object' && suggestion.file) {
      return {
        file: suggestion.file,
        find: suggestion.find || '',
        replace: suggestion.replace || '',
        type: suggestion.type || 'text-replace'
      };
    }
    return {
      file: 'src/core/heartflow-engine.js',
      find: '',
      replace: '',
      type: 'manual-review'
    };
  }

  applyTextModification(originalContent, parsed) {
    if (!parsed.find) {
      return originalContent;
    }
    return originalContent.replace(parsed.find, parsed.replace || '');
  }

  generatePatch(original, modified, parsed, patchFileName) {
    const diff = this.computeSimpleDiff(original, modified);
    return `# Self-Modifier 补丁文件
# 生成时间: ${new Date().toISOString()}
# 目标文件: ${parsed.file}
# 审查后手动应用:
#   patch -p1 < patches/${patchFileName}
# ============================================================================
--- a/${parsed.file}
+++ b/${parsed.file}
${diff}
`;
  }

  computeSimpleDiff(original, modified) {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    let diff = '@@\n';
    for (let i = 0; i < Math.max(origLines.length, modLines.length); i++) {
      const o = origLines[i] ?? '';
      const m = modLines[i] ?? '';
      if (o !== m) {
        if (o) diff += `-${o}\n`;
        if (m) diff += `+${m}\n`;
      } else {
        diff += ` ${o}\n`;
      }
    }
    return diff;
  }

  recordChange(change) {
    const recordFile = path.join(this.patchDir, 'changes.json');
    let history = [];
    try {
      if (this.fs.existsSync(recordFile)) {
        history = JSON.parse(this.fs.readFileSync(recordFile));
      }
    } catch (e) {}
    history.push(change);
    this.fs.writeJSON(recordFile, history);
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      enabled: this.enabled,
      mode: 'patch_only',
      patchDir: this.patchDir
    };
  }
}

module.exports = { SelfModifier };
