/**
 * State Snapshot - 状态快照与断点恢复
 */

const fs = require('fs');
const path = require('path');

const SNAPSHOT_CONFIG = {
  snapshotDir: '.opencode/snapshots',
  maxSnapshots: 20,
  autoSnapshotInterval: 5,
  snapshotFilePrefix: 'snapshot-',
  metadataFile: 'snapshots-metadata.json'
};

class StateSnapshot {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.snapshotDir = path.join(projectRoot, SNAPSHOT_CONFIG.snapshotDir);
    this.metadataFile = path.join(this.snapshotDir, SNAPSHOT_CONFIG.metadataFile);
    this.interactionCount = 0;
    this.loadMetadata();
  }

  loadMetadata() {
    try {
      if (fs.existsSync(this.metadataFile)) {
        this.metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
      } else {
        this.metadata = {
          snapshots: [],
          lastSnapshotId: null
        };
      }
    } catch (e) {
      this.metadata = { snapshots: [], lastSnapshotId: null };
    }
  }

  saveMetadata() {
    try {
      if (!fs.existsSync(this.snapshotDir)) {
        fs.mkdirSync(this.snapshotDir, { recursive: true });
      }
      fs.writeFileSync(this.metadataFile, JSON.stringify(this.metadata, null, 2));
    } catch (e) {
      console.error('[StateSnapshot] Failed to save metadata:', e.message);
    }
  }

  /**
   * 获取当前核心状态
   */
  async captureCurrentState() {
    const state = {
      timestamp: new Date().toISOString(),
      personality: await this.getPersonalityState(),
      emotionVector: await this.getEmotionState(),
      memoryPointer: await this.getMemoryState(),
      activatedNodes: await this.getActivatedNodes(),
      interactionCount: this.interactionCount,
      metadata: {
        version: '1.0',
        system: 'HeartFlow'
      }
    };

    return state;
  }

  async getPersonalityState() {
    try {
      const stateFile = path.join(this.projectRoot, '.opencode', 'memory', 'heartflow_state.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        return state.personality || state.big_five_scores || {};
      }
    } catch (e) {
      console.error('[StateSnapshot] Failed to get personality state:', e.message);
    }
    return {};
  }

  async getEmotionState() {
    try {
      const stateFile = path.join(this.projectRoot, '.opencode', 'memory', 'heartflow_state.json');
      if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        return {
          currentEmotion: state.current_emotion || 'calm',
          emotionVector: state.emotion_vector || { pleasure: 0, arousal: 0, dominance: 0 },
          emotionalLog: state.emotional_log?.slice(-10) || []
        };
      }
    } catch (e) {
      console.error('[StateSnapshot] Failed to get emotion state:', e.message);
    }
    return { currentEmotion: 'calm', emotionVector: { pleasure: 0, arousal: 0, dominance: 0 } };
  }

  async getMemoryState() {
    try {
      const memoryFiles = ['intent-history.json', 'reflection-log.json', 'experience-log.json'];
      const memoryState = {};

      for (const file of memoryFiles) {
        const filePath = path.join(this.projectRoot, '.opencode', 'memory', file);
        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          memoryState[file.replace('.json', '')] = data;
        }
      }

      return memoryState;
    } catch (e) {
      console.error('[StateSnapshot] Failed to get memory state:', e.message);
    }
    return {};
  }

  async getActivatedNodes() {
    try {
      const assocFile = path.join(this.projectRoot, 'src', 'core', 'associative-engine', 'association-graph.json');
      if (fs.existsSync(assocFile)) {
        const assoc = JSON.parse(fs.readFileSync(assocFile, 'utf8'));
        return {
          nodeCount: Object.keys(assoc.nodes || {}).length,
          lastActivation: assoc.metadata?.lastUpdate
        };
      }
    } catch (e) {
      console.error('[StateSnapshot] Failed to get activated nodes:', e.message);
    }
    return { nodeCount: 0 };
  }

  /**
   * 拍照快照
   */
  async takeSnapshot(label = 'auto') {
    try {
      const state = await this.captureCurrentState();
      
      const snapshotId = `snap_${Date.now()}`;
      const snapshotFile = path.join(this.snapshotDir, `${SNAPSHOT_CONFIG.snapshotFilePrefix}${snapshotId}.json`);

      const snapshotData = {
        id: snapshotId,
        label,
        ...state
      };

      fs.writeFileSync(snapshotFile, JSON.stringify(snapshotData, null, 2));

      this.metadata.snapshots.push({
        id: snapshotId,
        label,
        timestamp: state.timestamp,
        interactionCount: this.interactionCount
      });

      this.metadata.lastSnapshotId = snapshotId;

      this.cleanOldSnapshots();
      this.saveMetadata();

      console.log(`[StateSnapshot] Created snapshot ${snapshotId} (${label})`);
      
      return {
        success: true,
        snapshotId,
        timestamp: state.timestamp
      };
    } catch (e) {
      console.error('[StateSnapshot] Failed to take snapshot:', e.message);
      return { success: false, error: e.message };
    }
  }

  /**
   * 从快照恢复
   */
  async restoreFromSnapshot(snapshotId) {
    try {
      const snapshotFile = path.join(
        this.snapshotDir,
        `${SNAPSHOT_CONFIG.snapshotFilePrefix}${snapshotId}.json`
      );

      if (!fs.existsSync(snapshotFile)) {
        return { success: false, error: 'Snapshot not found' };
      }

      const snapshot = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));

      await this.restoreState(snapshot);

      this.metadata.lastSnapshotId = snapshotId;
      this.saveMetadata();

      console.log(`[StateSnapshot] Restored from snapshot ${snapshotId}`);
      
      return {
        success: true,
        snapshotId,
        restoredState: {
          personality: snapshot.personality,
          emotionVector: snapshot.emotionVector,
          interactionCount: snapshot.interactionCount
        }
      };
    } catch (e) {
      console.error('[StateSnapshot] Failed to restore:', e.message);
      return { success: false, error: e.message };
    }
  }

  async restoreState(snapshot) {
    try {
      const stateFile = path.join(this.projectRoot, '.opencode', 'memory', 'heartflow_state.json');
      let state = {};

      if (fs.existsSync(stateFile)) {
        state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      }

      if (snapshot.personality) {
        state.personality = snapshot.personality;
      }
      if (snapshot.emotionVector) {
        state.emotion_vector = snapshot.emotionVector.emotionVector;
        state.current_emotion = snapshot.emotionVector.currentEmotion;
      }

      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

      this.interactionCount = snapshot.interactionCount || 0;

      return { success: true };
    } catch (e) {
      console.error('[StateSnapshot] Failed to restore state:', e.message);
      return { success: false, error: e.message };
    }
  }

  cleanOldSnapshots() {
    if (this.metadata.snapshots.length <= SNAPSHOT_CONFIG.maxSnapshots) {
      return;
    }

    const toRemove = this.metadata.snapshots.slice(
      0,
      this.metadata.snapshots.length - SNAPSHOT_CONFIG.maxSnapshots
    );

    for (const snap of toRemove) {
      const file = path.join(
        this.snapshotDir,
        `${SNAPSHOT_CONFIG.snapshotFilePrefix}${snap.id}.json`
      );
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }

    this.metadata.snapshots = this.metadata.snapshots.slice(
      -SNAPSHOT_CONFIG.maxSnapshots
    );
  }

  /**
   * 增加交互计数并在达到阈值时自动快照
   */
  incrementInteraction() {
    this.interactionCount++;

    if (this.interactionCount % SNAPSHOT_CONFIG.autoSnapshotInterval === 0) {
      this.takeSnapshot('auto');
    }

    return this.interactionCount;
  }

  /**
   * 获取快照列表
   */
  listSnapshots() {
    return this.metadata.snapshots.slice().reverse().map(s => ({
      id: s.id,
      label: s.label,
      timestamp: s.timestamp,
      interactionCount: s.interactionCount
    }));
  }

  /**
   * 获取快照详情
   */
  getSnapshotDetail(snapshotId) {
    try {
      const snapshotFile = path.join(
        this.snapshotDir,
        `${SNAPSHOT_CONFIG.snapshotFilePrefix}${snapshotId}.json`
      );

      if (!fs.existsSync(snapshotFile)) {
        return null;
      }

      const snapshot = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
      return {
        id: snapshot.id,
        label: snapshot.label,
        timestamp: snapshot.timestamp,
        personality: snapshot.personality,
        emotionVector: snapshot.emotionVector,
        memoryPointer: Object.keys(snapshot.memoryPointer || {}).length,
        activatedNodes: snapshot.activatedNodes,
        interactionCount: snapshot.interactionCount
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * 删除快照
   */
  deleteSnapshot(snapshotId) {
    try {
      const snapshotFile = path.join(
        this.snapshotDir,
        `${SNAPSHOT_CONFIG.snapshotFilePrefix}${snapshotId}.json`
      );

      if (!fs.existsSync(snapshotFile)) {
        return { success: false, error: 'Snapshot not found' };
      }

      fs.unlinkSync(snapshotFile);

      this.metadata.snapshots = this.metadata.snapshots.filter(s => s.id !== snapshotId);
      if (this.metadata.lastSnapshotId === snapshotId) {
        this.metadata.lastSnapshotId = this.metadata.snapshots[0]?.id || null;
      }
      this.saveMetadata();

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalSnapshots: this.metadata.snapshots.length,
      lastSnapshotId: this.metadata.lastSnapshotId,
      currentInteractionCount: this.interactionCount,
      snapshotsDir: this.snapshotDir
    };
  }
}

module.exports = { StateSnapshot, SNAPSHOT_CONFIG };
