/**
 * Self-Modifier - 自我代码修正模块
 * 实验性功能：根据 reflect 建议自动修改代码
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_FILE = '.opencode/config.json';

class SelfModifier {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.configFile = path.join(projectRoot, CONFIG_FILE);
    this.enabled = this.isEnabled();
    this.changeLog = path.join(projectRoot, 'logs', 'self-modifier.log');
  }

  isEnabled() {
    try {
      const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      return config.selfModificationEnabled === true;
    } catch (e) {
      console.log('[SelfModifier] Config not found or invalid, disabled by default');
      return false;
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.changeLog, entry);
    console.log(`[SelfModifier] ${message}`);
  }

  /**
   * 处理改进建议并执行代码修改
   */
  async processSuggestion(suggestion) {
    if (!this.enabled) {
      return { success: false, reason: 'self_modification_disabled' };
    }

    this.log(`Processing suggestion: ${suggestion.type}`);

    const parsed = this.parseSuggestion(suggestion);
    if (!parsed) {
      return { success: false, reason: 'cannot_parse_suggestion' };
    }

    const filePath = path.join(this.projectRoot, parsed.file);
    if (!fs.existsSync(filePath)) {
      return { success: false, reason: 'file_not_found', path: parsed.file };
    }

    const originalContent = fs.readFileSync(filePath, 'utf8');
    const modifiedContent = this.applyModification(originalContent, parsed);

    if (modifiedContent === originalContent) {
      return { success: false, reason: 'no_changes_made' };
    }

    const testResult = await this.runTests(parsed.testFile);

    if (testResult.passed) {
      fs.writeFileSync(filePath, modifiedContent);
      this.log(`Successfully modified: ${parsed.file}`);
      
      this.recordChange({
        file: parsed.file,
        suggestion: suggestion.type,
        timestamp: new Date().toISOString(),
        test_passed: true
      });

      return {
        success: true,
        file: parsed.file,
        changes: this.describeChanges(originalContent, modifiedContent)
      };
    } else {
      this.log(`Tests failed, rolling back: ${testResult.error}`);
      
      this.recordChange({
        file: parsed.file,
        suggestion: suggestion.type,
        timestamp: new Date().toISOString(),
        test_passed: false,
        error: testResult.error
      });

      return {
        success: false,
        reason: 'tests_failed',
        error: testResult.error
      };
    }
  }

  parseSuggestion(suggestion) {
    const patterns = [
      {
        regex: /修改\s+([^\s]+)\s+中的\s+([^\s]+)\s+函数/,
        extract: (match) => ({
          file: match[1],
          function: match[2],
          type: 'function'
        })
      },
      {
        regex: /更新\s+([^\s]+)\s+的\s+([^\s]+)/,
        extract: (match) => ({
          file: match[1],
          section: match[2],
          type: 'section'
        })
      },
      {
        regex: /调整\s+([^\s]+)\s+中的\s+([^\s]+)/,
        extract: (match) => ({
          file: match[1],
          parameter: match[2],
          type: 'parameter'
        })
      }
    ];

    for (const pattern of patterns) {
      const match = suggestion.type.match(pattern.regex);
      if (match) {
        return pattern.extract(match);
      }
    }

    return null;
  }

  applyModification(content, parsed) {
    if (parsed.type === 'function' && parsed.function === 'calculatePAD') {
      return this.modifyCalculatePAD(content, parsed);
    }

    return content;
  }

  modifyCalculatePAD(content, parsed) {
    const oldFunction = /function\s+calculatePAD[\s\S]*?(?=\nfunction|\nexport|\n$)/;
    const newFunction = `function calculatePAD(emotion, context) {
  // Modified: 增加对用户挫败感的敏感度
  const basePAD = calculateBasePAD(emotion);
  
  // 检测挫败感信号
  const frustrationSignals = ['difficult', 'hard', 'frustrated', '挫败', '难'];
  const hasFrustration = context?.userInput?.some(input => 
    frustrationSignals.some(signal => input.toLowerCase().includes(signal))
  );
  
  // 如果检测到挫败感，调整 PAD 值
  if (hasFrustration) {
    return {
      pleasure: basePAD.pleasure - 0.3,
      arousal: basePAD.arousal + 0.2,
      dominance: basePAD.dominance - 0.2
    };
  }
  
  return basePAD;
}`;

    if (oldFunction.test(content)) {
      return content.replace(oldFunction, newFunction);
    }

    return content;
  }

  async runTests(testFile) {
    if (!testFile) {
      return { passed: true, reason: 'no_tests' };
    }

    const testPath = path.join(this.projectRoot, testFile);
    if (!fs.existsSync(testPath)) {
      return { passed: true, reason: 'test_file_not_found' };
    }

    try {
      execSync(`npm test -- "${testPath}"`, {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      return { passed: true };
    } catch (e) {
      return { passed: false, error: e.message };
    }
  }

  describeChanges(original, modified) {
    const originalLines = original.split('\n').length;
    const modifiedLines = modified.split('\n').length;
    return {
      lines_added: modifiedLines - originalLines,
      lines_removed: originalLines - modifiedLines
    };
  }

  recordChange(change) {
    const logFile = path.join(this.projectRoot, 'logs', 'self-modifier-changes.json');
    let changes = [];
    
    try {
      if (fs.existsSync(logFile)) {
        changes = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      }
    } catch (e) {
      changes = [];
    }
    
    changes.push(change);
    fs.writeFileSync(logFile, JSON.stringify(changes, null, 2));
  }

  getChangeHistory() {
    const logFile = path.join(this.projectRoot, 'logs', 'self-modifier-changes.json');
    try {
      if (fs.existsSync(logFile)) {
        return JSON.parse(fs.readFileSync(logFile, 'utf8'));
      }
    } catch (e) {
      return [];
    }
    return [];
  }

  enable() {
    this.setConfig(true);
    this.enabled = true;
    this.log('Self-modification enabled');
  }

  disable() {
    this.setConfig(false);
    this.enabled = false;
    this.log('Self-modification disabled');
  }

  setConfig(enabled) {
    try {
      const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      config.selfModificationEnabled = enabled;
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    } catch (e) {
      const newConfig = { selfModificationEnabled: enabled };
      fs.writeFileSync(this.configFile, JSON.stringify(newConfig, null, 2));
    }
  }

  getStatus() {
    return {
      enabled: this.enabled,
      config_file: this.configFile,
      change_history: this.getChangeHistory()
    };
  }
}

module.exports = { SelfModifier };
