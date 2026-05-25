/**
 * HeartFlow 状态快照管理器
 * 定期保存和恢复系统状态
 */

const fs = require('fs');
const path = require('path');

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');

class StateSnapshot {
  constructor() {
    this.ensureDir();
    this.currentSnapshot = null;
    this._writeLock = null;
  }

  ensureDir() {
    if (!fs.existsSync(SNAPSHOT_DIR)) {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }
  }

  // 创建快照 - 使用WAL保证原子性
  create(state, label = 'default') {
    const snapshot = {
      timestamp: Date.now(),
      label,
      state: this.sanitize(state)
    };

    const filename = `snapshot_${label}_${Date.now()}.json`;
    const filepath = path.join(SNAPSHOT_DIR, filename);
    const walPath = path.join(SNAPSHOT_DIR, `.wal_${filename}`);
    
    // WAL Phase 1: Write to temp WAL file first
    try {
      fs.writeFileSync(walPath, JSON.stringify(snapshot, null, 2), 'utf8');
    } catch (e) {
      // Clean up WAL on failure
      if (fs.existsSync(walPath)) {
        try { fs.unlinkSync(walPath); } catch (_) {}
      }
      throw e;
    }
    
    // WAL Phase 2: Atomic rename (on POSIX systems)
    try {
      fs.renameSync(walPath, filepath);
    } catch (e) {
      // Rollback: remove WAL file on rename failure
      if (fs.existsSync(walPath)) {
        try { fs.unlinkSync(walPath); } catch (_) {}
      }
      throw e;
    }
    
    this.currentSnapshot = snapshot;
    
    return { filename, timestamp: snapshot.timestamp };
  }

  // 清理敏感数据
  sanitize(state) {
    const sanitized = JSON.parse(JSON.stringify(state));
    // 移除敏感信息
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    return sanitized;
  }

  // 加载快照
  load(filename) {
    const filepath = path.join(SNAPSHOT_DIR, filename);
    if (fs.existsSync(filepath)) {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      this.currentSnapshot = data;
      return data.state;
    }
    return null;
  }

  // 获取最新快照
  getLatest() {
    const files = fs.readdirSync(SNAPSHOT_DIR).filter(f => f.endsWith('.json'));
    if (files.length === 0) return null;
    
    files.sort().reverse();
    const latest = files[0];
    return this.load(latest);
  }

  // 列出快照
  list() {
    return fs.readdirSync(SNAPSHOT_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(SNAPSHOT_DIR, f)).mtime
      }));
  }
}

module.exports = new StateSnapshot();