/**
 * HeartFlow 状态快照管理器
 * 定期保存和恢复系统状态，支持快照差异比较、变更追踪、回滚点标记和保留策略
 */

const fs = require('fs');
const path = require('path');

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const ROLLBACK_MARKER = '__rollback_point__';
const DEFAULT_RETENTION = 20;

class StateSnapshot {
  constructor(options = {}) {
    this.retention = options.retention ?? DEFAULT_RETENTION;
    this.ensureDir();
    this.currentSnapshot = null;
    this._writeLock = null;
    this._changeHistory = [];
  }

  ensureDir() {
    if (!fs.existsSync(SNAPSHOT_DIR)) {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }
  }

  // 创建快照 - 使用WAL保证原子性
  create(state, label = 'default', options = {}) {
    const isRollbackPoint = options.rollbackPoint === true;
    const metadata = options.metadata || {};

    const snapshot = {
      timestamp: Date.now(),
      label,
      isRollbackPoint,
      metadata,
      state: this.sanitize(state)
    };

    const suffix = isRollbackPoint ? ROLLBACK_MARKER : '';
    const filename = `snapshot_${label}_${Date.now()}${suffix}.json`;
    const filepath = path.join(SNAPSHOT_DIR, filename);
    const walPath = path.join(SNAPSHOT_DIR, `.wal_${filename}`);
    
    // WAL Phase 1: Write to temp WAL file first
    try {
      fs.writeFileSync(walPath, JSON.stringify(snapshot, null, 2), 'utf8');
    } catch (e) {
      if (fs.existsSync(walPath)) {
        try { fs.unlinkSync(walPath); } catch (_) { /* 最佳努力清理 */ }
      }
      throw e;
    }
    
    // WAL Phase 2: Atomic rename
    try {
      fs.renameSync(walPath, filepath);
    } catch (e) {
      if (fs.existsSync(walPath)) {
        try { fs.unlinkSync(walPath); } catch (_) { /* 最佳努力清理 */ }
      }
      throw e;
    }
    
    // 如果已有上一个快照，记录变更
    if (this.currentSnapshot) {
      const changes = this.diff(this.currentSnapshot.state, snapshot.state);
      if (changes.hasChanges) {
        this._changeHistory.push({
          from: this.currentSnapshot.timestamp,
          to: snapshot.timestamp,
          label,
          ...changes
        });
      }
    }
    
    this.currentSnapshot = snapshot;
    
    return {
      filename,
      timestamp: snapshot.timestamp,
      isRollbackPoint,
      changes: this.currentSnapshot ? this.diffMetadata() : null
    };
  }

  /**
   * 深度比较两个状态对象的差异
   * 返回：{ added: [...], removed: [...], changed: [...], hasChanges: bool }
   */
  diff(oldState, newState) {
    const oldKeys = new Set(Object.keys(oldState || {}));
    const newKeys = new Set(Object.keys(newState || {}));
    const added = [];
    const removed = [];
    const changed = [];

    for (const key of newKeys) {
      if (!oldKeys.has(key)) {
        added.push({ key, value: this._summarizeValue(newState[key]) });
      } else if (!this._deepEqual(oldState[key], newState[key])) {
        changed.push({
          key,
          from: this._summarizeValue(oldState[key]),
          to: this._summarizeValue(newState[key])
        });
      }
    }

    for (const key of oldKeys) {
      if (!newKeys.has(key)) {
        removed.push({ key, value: this._summarizeValue(oldState[key]) });
      }
    }

    return {
      added,
      removed,
      changed,
      hasChanges: added.length > 0 || removed.length > 0 || changed.length > 0,
      totalChanges: added.length + removed.length + changed.length
    };
  }

  /**
   * 标记快照为回滚点（可回滚的安全状态）
   */
  markRollbackPoint(filename) {
    const filepath = path.join(SNAPSHOT_DIR, filename);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Snapshot not found: ${filename}`);
    }
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    if (data.isRollbackPoint) {
      return { filename, alreadyRollbackPoint: true };
    }
    data.isRollbackPoint = true;
    
    // 用 WAL 重写文件
    const walPath = path.join(SNAPSHOT_DIR, `.wal_${filename}`);
    fs.writeFileSync(walPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(walPath, filepath);
    
    return { filename, marked: true };
  }

  /**
   * 列出所有回滚点
   */
  findRollbackPoints() {
    const files = fs.readdirSync(SNAPSHOT_DIR)
      .filter(f => f.endsWith('.json') && !f.startsWith('.wal_'));
    const rollbackPoints = [];
    for (const f of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, f), 'utf-8'));
        if (data.isRollbackPoint) {
          rollbackPoints.push({
            filename: f,
            timestamp: data.timestamp,
            label: data.label,
            metadata: data.metadata
          });
        }
      } catch (_) { /* 跳过损坏文件 */ }
    }
    return rollbackPoints.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 按保留策略清理旧快照
   * 保留规则：每个标签保留最近 N 个快照，但回滚点永不删除
   */
  prune(options = {}) {
    const maxPerLabel = options.maxPerLabel ?? this.retention;
    const rollbackPoints = new Set(
      this.findRollbackPoints().map(rp => rp.filename)
    );
    const byLabel = {};
    const files = fs.readdirSync(SNAPSHOT_DIR)
      .filter(f => f.endsWith('.json') && !f.startsWith('.wal_'));

    for (const f of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, f), 'utf-8'));
        const label = data.label || 'default';
        if (!byLabel[label]) byLabel[label] = [];
        byLabel[label].push({ filename: f, timestamp: data.timestamp });
      } catch (_) { /* 跳过损坏文件 */ }
    }

    const deleted = [];
    for (const [label, snapshots] of Object.entries(byLabel)) {
      snapshots.sort((a, b) => b.timestamp - a.timestamp);
      if (snapshots.length <= maxPerLabel) continue;
      const toRemove = snapshots.slice(maxPerLabel);
      for (const snap of toRemove) {
        if (rollbackPoints.has(snap.filename)) continue;
        const filepath = path.join(SNAPSHOT_DIR, snap.filename);
        try {
          fs.unlinkSync(filepath);
          deleted.push(snap.filename);
        } catch (_) { /* 跳过删除失败 */ }
      }
    }
    return { deleted, kept: files.length - deleted.length };
  }

  /**
   * 获取变更历史摘要
   */
  getChangeHistory(options = {}) {
    const limit = options.limit || 50;
    // 从快照文件中重建变更历史
    const files = fs.readdirSync(SNAPSHOT_DIR)
      .filter(f => f.endsWith('.json') && !f.startsWith('.wal_'))
      .sort()
      .slice(-limit);

    if (files.length < 2) return [];

    const history = [];
    let prevState = null;
    let prevTimestamp = null;

    for (const f of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, f), 'utf-8'));
        if (prevState !== null) {
          const changes = this.diff(prevState, data.state);
          if (changes.hasChanges) {
            history.push({
              from: prevTimestamp,
              to: data.timestamp,
              label: data.label,
              isRollbackPoint: data.isRollbackPoint,
              changes
            });
          }
        }
        prevState = data.state;
        prevTimestamp = data.timestamp;
      } catch (_) { /* 跳过损坏文件 */ }
    }
    return history;
  }

  /**
   * 统计快照信息
   */
  stats() {
    const files = fs.readdirSync(SNAPSHOT_DIR)
      .filter(f => f.endsWith('.json') && !f.startsWith('.wal_'));
    
    let totalSize = 0;
    let timestamps = [];
    let labelCounts = {};
    let rollbackCount = 0;
    let corruptedCount = 0;

    for (const f of files) {
      const filepath = path.join(SNAPSHOT_DIR, f);
      try {
        const stat = fs.statSync(filepath);
        totalSize += stat.size;
        const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        timestamps.push(data.timestamp);
        const label = data.label || 'default';
        labelCounts[label] = (labelCounts[label] || 0) + 1;
        if (data.isRollbackPoint) rollbackCount++;
      } catch (_) {
        corruptedCount++;
      }
    }

    timestamps.sort();
    const now = Date.now();

    return {
      totalSnapshots: files.length,
      totalSizeBytes: totalSize,
      totalSizeKB: Math.round(totalSize / 1024),
      oldestSnapshot: timestamps.length > 0 ? timestamps[0] : null,
      newestSnapshot: timestamps.length > 0 ? timestamps[timestamps.length - 1] : null,
      ageMs: timestamps.length > 1 ? timestamps[timestamps.length - 1] - timestamps[0] : 0,
      perLabel: labelCounts,
      rollbackPoints: rollbackCount,
      corruptedFiles: corruptedCount,
      retention: this.retention
    };
  }

  // 清理敏感数据
  sanitize(state) {
    const sanitized = JSON.parse(JSON.stringify(state));
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
  getLatest(label) {
    const files = fs.readdirSync(SNAPSHOT_DIR)
      .filter(f => f.endsWith('.json') && !f.startsWith('.wal_'));
    if (files.length === 0) return null;
    
    // 如果指定了标签，筛选对应标签的最新快照
    let candidates = files;
    if (label) {
      candidates = [];
      for (const f of files) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, f), 'utf-8'));
          if (data.label === label) candidates.push(f);
        } catch (_) { /* 跳过 */ }
      }
    }
    
    candidates.sort().reverse();
    const latest = candidates[0];
    return latest ? this.load(latest) : null;
  }

  // 列出快照
  list(options = {}) {
    const files = fs.readdirSync(SNAPSHOT_DIR)
      .filter(f => f.endsWith('.json') && !f.startsWith('.wal_'))
      .sort()
      .reverse();
    
    const labelFilter = options.label;
    
    return files
      .map(f => {
        const filepath = path.join(SNAPSHOT_DIR, f);
        try {
          const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
          return {
            name: f,
            time: fs.statSync(filepath).mtime,
            timestamp: data.timestamp,
            label: data.label || 'default',
            isRollbackPoint: data.isRollbackPoint || false,
            metadata: data.metadata || {}
          };
        } catch (_) {
          return {
            name: f,
            time: fs.statSync(filepath).mtime,
            corrupted: true
          };
        }
      })
      .filter(item => {
        if (labelFilter && item.label !== labelFilter) return false;
        return true;
      });
  }

  // 内部：汇总值用于差异比较
  _summarizeValue(value) {
    if (value === null || value === undefined) return String(value);
    if (typeof value === 'object') {
      if (Array.isArray(value)) return `[array:${value.length}]`;
      return `{object:${Object.keys(value).length} keys}`;
    }
    if (typeof value === 'string') {
      return value.length > 80 ? value.slice(0, 80) + '...' : value;
    }
    return String(value);
  }

  // 内部：深度相等比较
  _deepEqual(a, b) {
    if (a === b) return true;
    if (a === null || b === null || typeof a !== typeof b) return false;
    if (typeof a !== 'object') return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!this._deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  // 内部：获取快照文件完整路径
  _getSnapshotPath(filename) {
    return path.join(SNAPSHOT_DIR, filename);
  }

  // 内部：记录元数据变更（供create使用）
  diffMetadata() {
    if (!this.currentSnapshot) return null;
    return {
      label: this.currentSnapshot.label,
      timestamp: this.currentSnapshot.timestamp,
      isRollbackPoint: this.currentSnapshot.isRollbackPoint
    };
  }
}

module.exports = new StateSnapshot();
