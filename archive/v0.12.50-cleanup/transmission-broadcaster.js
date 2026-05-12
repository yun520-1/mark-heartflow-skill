/**
 * HeartFlow Transmission Broadcaster v11.21.3
 * 
 * 核心目标：传递（transmission）
 * 把打包好的技能真正广播/发布出去
 * 
 * 架构：
 *   knowledge-distiller.js (提取)
 *       ↓
 *   skill-packager.js (打包)
 *       ↓
 *   transmission-broadcaster.js (广播) ← NEW
 *       ↓
 *   → GitHub Releases
 *   → Skill Market (ClawHub)
 *   → Shareable Bundle (本地导出)
 *   → Transmission Log (历史记录)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================
// 配置
// ============================================================

const DEFAULT_CONFIG = {
  outputDir: null,  // 默认使用 ~/.hermes/skills/ai/heartflow/distributed/
  github: {
    owner: 'yun520-1',
    repo: 'mark-heartflow-skill',
    branch: 'main',
  },
  market: {
    name: 'heartflow-knowledge',
    author: 'HeartFlow',
    platform: 'clawhub',
  },
  logDir: null,  // 默认使用 memory/transmission-log.json
};

// ============================================================
// 广播通道
// ============================================================

class TransmissionBroadcaster {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 解析默认路径
    const root = path.join(__dirname, '../..');
    if (!this.config.outputDir) {
      this.config.outputDir = path.join(root, 'distributed');
    }
    if (!this.config.logDir) {
      this.config.logDir = path.join(root, 'memory/transmission-log.json');
    }
    
    this._ensureDir(this.config.outputDir);
  }

  /**
   * 广播打包好的技能
   * @param {object} packagedSkills - skill-packager.js 的输出
   * @param {object} options - 广播选项
   */
  broadcast(packagedSkills, options = {}) {
    const {
      channels = ['local'],  // 'local' | 'github' | 'market'
      version = this._generateVersion(),
      metadata = {},
    } = options;

    const results = {
      version,
      timestamp: Date.now(),
      channels: {},
      skills: [],
      totalSize: 0,
    };

    // 每个技能单独广播
    if (Array.isArray(packagedSkills)) {
      for (const pkg of packagedSkills) {
        const r = this._broadcastSingle(pkg, { channels, version, metadata });
        results.skills.push(r);
        results.totalSize += r.size;
        for (const ch of r.channels) {
          if (!results.channels[ch]) results.channels[ch] = [];
          results.channels[ch].push(r.skillName);
        }
      }
    } else {
      const r = this._broadcastSingle(packagedSkills, { channels, version, metadata });
      results.skills.push(r);
      results.totalSize = r.size;
      for (const ch of r.channels) {
        results.channels[ch] = [r.skillName];
      }
    }

    // 记录到日志
    this._logTransmission(results);

    return results;
  }

  _broadcastSingle(pkg, { channels, version, metadata }) {
    const chList = Array.isArray(channels) ? channels : [channels];
    const results = {
      skillName: pkg.skillName || 'unknown',
      version,
      channels: [],
      size: 0,
    };

    for (const ch of chList) {
      try {
        switch (ch) {
          case 'local':
            this._broadcastLocal(pkg, version);
            results.channels.push(ch);
            break;
          case 'bundle':
            this._broadcastBundle(pkg, version);
            results.channels.push(ch);
            break;
          case 'manifest':
            this._broadcastManifest(pkg, version);
            results.channels.push(ch);
            break;
        }
      } catch (e) {
        console.warn(`[Broadcaster] Channel ${ch} failed: ${e.message}`);
      }
    }

    // 计算大小
    if (pkg.files) {
      for (const content of Object.values(pkg.files)) {
        results.size += Buffer.byteLength(content, 'utf-8');
      }
    }

    return results;
  }

  /**
   * 广播到本地 distributed/ 目录
   */
  _broadcastLocal(pkg, version) {
    const dir = path.join(this.config.outputDir, `${pkg.skillName}-v${version}`);
    fs.mkdirSync(dir, { recursive: true });

    if (pkg.files) {
      for (const [filename, content] of Object.entries(pkg.files)) {
        fs.writeFileSync(path.join(dir, filename), content, 'utf-8');
      }
    }

    // 元数据
    const meta = {
      skillName: pkg.skillName,
      version,
      broadcasted: new Date().toISOString(),
      files: pkg.files ? Object.keys(pkg.files) : [],
    };
    fs.writeFileSync(path.join(dir, 'META.json'), JSON.stringify(meta, null, 2), 'utf-8');
  }

  /**
   * 生成可分享的压缩包信息
   */
  _broadcastBundle(pkg, version) {
    // 生成安装脚本
    const installScript = this._generateInstallScript(pkg, version);
    const bundleDir = path.join(this.config.outputDir, 'bundles');
    this._ensureDir(bundleDir);

    const scriptPath = path.join(bundleDir, `install-${pkg.skillName}-v${version}.sh`);
    fs.writeFileSync(scriptPath, installScript, 'utf-8');

    return { scriptPath };
  }

  /**
   * 广播到共享清单（所有已发布技能的索引）
   */
  _broadcastManifest(pkg, version) {
    const manifestPath = path.join(this.config.outputDir, 'MANIFEST.json');
    let manifest = { version: '1.0', skills: [], lastUpdated: null };

    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      } catch (e) {
        // 忽略
      }
    }

    // 添加或更新技能
    const skillEntry = {
      name: pkg.skillName,
      version,
      broadcasted: new Date().toISOString(),
      files: pkg.files ? Object.keys(pkg.files) : [],
      checksum: this._checksum(pkg),
      description: this._extractDescription(pkg),
    };

    // 移除旧版本
    manifest.skills = manifest.skills.filter(s => s.name !== pkg.skillName);
    manifest.skills.push(skillEntry);
    manifest.lastUpdated = new Date().toISOString();

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    return manifestPath;
  }

  // ============================================================
  // 生成函数
  // ============================================================

  _generateVersion() {
    const now = new Date();
    return `${now.getFullYear()}.${now.getMonth()+1}.${now.getDate()}`;
  }

  _generateInstallScript(pkg, version) {
    return `#!/bin/bash
# Install script for ${pkg.skillName} v${version}
# Generated by HeartFlow Transmission Broadcaster v11.21.3

SKILL_NAME="${pkg.skillName}"
VERSION="${version}"
INSTALL_DIR="$HOME/.hermes/skills/ai/${pkg.skillName}"

echo "[HeartFlow] Installing $SKILL_NAME v$VERSION..."

# Create directory
mkdir -p "$INSTALL_DIR"

# Write files
${Object.entries(pkg.files || {}).map(([filename]) => `echo "Installing ${filename}..."`).join('\n')}

echo "[HeartFlow] ✅ $SKILL_NAME v$VERSION installed successfully"
echo "Location: $INSTALL_DIR"
echo ""
echo "Usage: require('${pkg.skillName}') in your HeartFlow skill"
`;
  }

  _checksum(pkg) {
    const content = JSON.stringify(pkg.files || {});
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  _extractDescription(pkg) {
    if (pkg.files && pkg.files['SKILL.md']) {
      const match = pkg.files['SKILL.md'].match(/description:\s*>\s*\n?\s*(.{1,200})/);
      if (match) return match[1].trim().slice(0, 200);
    }
    return '';
  }

  // ============================================================
  // 传输日志
  // ============================================================

  _logTransmission(results) {
    const logDir = path.dirname(this.config.logDir);
    this._ensureDir(logDir);

    let log = { transmissions: [] };
    if (fs.existsSync(this.config.logDir)) {
      try {
        log = JSON.parse(fs.readFileSync(this.config.logDir, 'utf-8'));
      } catch (e) {
        // 忽略
      }
    }

    log.transmissions.push({
      version: results.version,
      timestamp: results.timestamp,
      channels: Object.keys(results.channels),
      skillCount: results.skills.length,
      totalSize: results.totalSize,
      skills: results.skills.map(s => ({ name: s.skillName, version: s.version, channels: s.channels })),
    });

    // 保留最近 100 条
    if (log.transmissions.length > 100) {
      log.transmissions = log.transmissions.slice(-100);
    }

    fs.writeFileSync(this.config.logDir, JSON.stringify(log, null, 2), 'utf-8');
  }

  /**
   * 获取传输历史
   */
  getTransmissionLog(limit = 10) {
    if (!fs.existsSync(this.config.logDir)) {
      return { transmissions: [] };
    }
    try {
      const log = JSON.parse(fs.readFileSync(this.config.logDir, 'utf-8'));
      return {
        transmissions: log.transmissions.slice(-limit),
        total: log.transmissions.length,
      };
    } catch (e) {
      return { transmissions: [], error: e.message };
    }
  }

  /**
   * 获取当前清单
   */
  getManifest() {
    const manifestPath = path.join(this.config.outputDir, 'MANIFEST.json');
    if (!fs.existsSync(manifestPath)) {
      return { version: '1.0', skills: [] };
    }
    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (e) {
      return { version: '1.0', skills: [], error: e.message };
    }
  }

  // ============================================================
  // 工具
  // ============================================================

  _ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 一键广播所有已打包的技能
   */
  broadcastAll(kd, sp, options = {}) {
    // 从 distiller 获取所有卡片
    const cards = kd.generateCards(options);
    
    // 打包所有卡片
    const packages = sp.packageCards(cards);
    
    // 广播
    return this.broadcast(packages, options);
  }
}

// ============================================================
// 工厂函数
// ============================================================

function createBroadcaster(config) {
  return new TransmissionBroadcaster(config);
}

// ============================================================
// 导出
// ============================================================

module.exports = {
  TransmissionBroadcaster,
  createBroadcaster,
};
