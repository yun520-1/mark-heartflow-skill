/**
 * Self Modifier - 自我代码修正模块
 * 接收修改建议，生成代码补丁
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SelfModifier {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.configFile = path.join(projectRoot, '.opencode', 'config.json');
    this.patchDir = path.join(projectRoot, 'logs', 'patches');
    this.enabled = this.isEnabled();
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.patchDir)) {
      fs.mkdirSync(this.patchDir, { recursive: true });
    }
  }

  isEnabled() {
    try {
      if (fs.existsSync(this.configFile)) {
        const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
        return config.selfModificationEnabled === true;
      }
    } catch (e) {}
    return false;
  }

  /**
   * 执行修改
   */
  applyModification(suggestion) {
    if (!this.enabled) {
      return {
        success: false,
        reason: 'self_modification_disabled',
        message: '自我修改功能已关闭，请在 config.json 中启用'
      };
    }

    const { targetFile, functionName, newBehavior } = this.parseSuggestion(suggestion);
    
    if (!targetFile || !functionName) {
      return {
        success: false,
        reason: 'invalid_suggestion',
        message: '无法解析修改建议'
      };
    }

    const fullPath = path.join(this.projectRoot, targetFile);
    
    if (!fs.existsSync(fullPath)) {
      return {
        success: false,
        reason: 'file_not_found',
        message: `文件不存在: ${targetFile}`
      };
    }

    const originalCode = fs.readFileSync(fullPath, 'utf8');
    const modifiedCode = this.generatePatch(originalCode, functionName, newBehavior);
    
    const diff = this.generateDiff(originalCode, modifiedCode, targetFile);
    
    this.savePatch(diff, targetFile);

    return {
      success: true,
      targetFile: targetFile,
      function: functionName,
      diff: diff,
      patchFile: `${this.patchDir}/${this.getPatchFilename(targetFile)}`,
      message: '补丁已生成，请在验证后手动应用'
    };
  }

  /**
   * 解析修改建议
   */
  parseSuggestion(suggestion) {
    const suggestionStr = typeof suggestion === 'string' ? suggestion : 
                         suggestion.suggestion || suggestion.description || '';

    const patterns = [
      /修改\s+([^\s]+)\s+中的\s+([^\s]+)\s+函数/,
      /modify\s+([^\s]+)\s+.*?\s+([^\s]+)\s+function/,
      /update\s+([^\s]+)\s+.*?\s+([^\s]+)/,
      /change\s+([^\s]+)\s+.*?\s+([^\s]+)/
    ];

    for (const pattern of patterns) {
      const match = suggestionStr.match(pattern);
      if (match) {
        return {
          targetFile: match[1],
          functionName: match[2],
          newBehavior: suggestionStr
        };
      }
    }

    return {
      targetFile: 'src/core/heartflow-engine.js',
      functionName: 'calculatePAD',
      newBehavior: suggestionStr
    };
  }

  /**
   * 生成补丁代码
   */
  generatePatch(originalCode, functionName, newBehavior) {
    const functionPattern = new RegExp(
      `(function\\s+${functionName}|const\\s+${functionName}\\s*=|let\\s+${functionName}\\s*=|var\\s+${functionName}\\s*=)`,
      'g'
    );

    if (!functionPattern.test(originalCode)) {
      return originalCode + '\n\n// New function: ' + functionName + '\n// ' + newBehavior;
    }

    const enhancement = this.generateEnhancement(functionName, newBehavior);
    
    return originalCode.replace(
      functionPattern,
      `$1${enhancement}`
    );
  }

  /**
   * 生成增强代码
   */
  generateEnhancement(functionName, newBehavior) {
    const enhancements = {
      'calculatePAD': `
  // Self-Modifier: 增加对用户挫败感的敏感度
  const frustrationIndicators = ['difficult', 'hard', 'frustrated', '挫败', '难', '不行'];
  const hasFrustration = context?.userInput?.some(input => 
    frustrationIndicators.some(indicator => input.toLowerCase().includes(indicator))
  );
  if (hasFrustration) {
    pad.pleasure -= 0.2;
    pad.dominance -= 0.1;
  }
`,
      'default': `
  // Self-Modifier enhancement based on: ${newBehavior.substring(0, 50)}...
`
    };

    return enhancements[functionName] || enhancements.default;
  }

  /**
   * 生成差异
   */
  generateDiff(original, modified, filename) {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    const diff = {
      filename: filename,
      timestamp: new Date().toISOString(),
      original: {
        lines: originalLines.length,
        hash: crypto.createHash('sha256').update(original).digest('hex')
      },
      modified: {
        lines: modifiedLines.length,
        hash: crypto.createHash('sha256').update(modified).digest('hex')
      },
      changes: [],
      unifiedDiff: this.generateUnifiedDiff(original, modified, filename)
    };

    let lineNum = 0;
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i] || '';
      const modLine = modifiedLines[i] || '';
      
      if (origLine !== modLine) {
        diff.changes.push({
          line: i + 1,
          original: origLine.substring(0, 80),
          modified: modLine.substring(0, 80)
        });
      }
    }

    return diff;
  }

  /**
   * 生成统一格式差异
   */
  generateUnifiedDiff(original, modified, filename) {
    const lines = [
      `--- a/${filename}`,
      `+++ b/${filename}`,
      `@@ @@`
    ];

    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    
    let i = 0;
    while (i < Math.max(origLines.length, modLines.length)) {
      const orig = origLines[i] || '';
      const mod = modLines[i] || '';
      
      if (orig !== mod) {
        if (orig) lines.push(`-${orig}`);
        if (mod) lines.push(`+${mod}`);
      } else {
        lines.push(` ${orig}`);
      }
      i++;
    }

    return lines.join('\n');
  }

  /**
   * 保存补丁
   */
  savePatch(diff, targetFile) {
    const patchFile = path.join(this.patchDir, this.getPatchFilename(targetFile));
    fs.writeFileSync(patchFile, diff.unifiedDiff);
    
    const metaFile = patchFile.replace('.diff', '.json');
    fs.writeFileSync(metaFile, JSON.stringify(diff, null, 2));
  }

  getPatchFilename(targetFile) {
    const name = targetFile.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${name}_${timestamp}.diff`;
  }

  /**
   * 列出补丁历史
   */
  listPatches() {
    if (!fs.existsSync(this.patchDir)) {
      return [];
    }

    return fs.readdirSync(this.patchDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const fullPath = path.join(this.patchDir, f);
        const stat = fs.statSync(fullPath);
        return {
          file: f,
          created: stat.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      enabled: this.enabled,
      configFile: this.configFile,
      patchesGenerated: this.listPatches().length
    };
  }

  /**
   * 启用功能
   */
  enable() {
    this.setConfig(true);
    this.enabled = true;
  }

  /**
   * 禁用功能
   */
  disable() {
    this.setConfig(false);
    this.enabled = false;
  }

  setConfig(enabled) {
    try {
      let config = {};
      if (fs.existsSync(this.configFile)) {
        config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      }
      config.selfModificationEnabled = enabled;
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    } catch (e) {
      console.error('[SelfModifier] 配置更新失败:', e.message);
    }
  }
}

/**
 * CLI 入口
 */
if (require.main === module) {
  const modifier = new SelfModifier(process.cwd());
  
  console.log('=== Self Modifier ===');
  console.log('状态:', modifier.getStatus().enabled ? '已启用' : '已禁用');
  
  if (modifier.enabled) {
    const testSuggestion = {
      targetFile: 'src/core/heartflow-engine.js',
      functionName: 'calculatePAD',
      suggestion: '修改 calculatePAD 函数，使其对用户挫败感更敏感'
    };
    
    const result = modifier.applyModification(testSuggestion);
    console.log('结果:', result.success ? '成功' : result.message);
    if (result.success) {
      console.log('补丁文件:', result.patchFile);
    }
  } else {
    console.log('请在 config.json 中设置 selfModificationEnabled: true 来启用');
  }
}

module.exports = { SelfModifier };
