#!/usr/bin/env node
'use strict';

/**
 * HeartFlow Unified Config System
 *
 * 三层配置合并策略（优先级从低到高）：
 *   1. 引擎内置默认值 (DEFAULTS)
 *   2. 项目根目录 config.json（git  tracked，团队共享）
 *   3. 用户目录 ~/.hermes/heartflow/config.json（个人偏好，不 track）
 *   4. 环境变量 HEARTFLOW_*（CI/CD 或容器部署）
 *
 * 任何人 clone 后直接运行，不需要任何配置文件。
 * 可选运行 `node bin/cli.js setup` 进行个性化配置。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── 默认值（引擎内置，不需要任何配置文件） ────────────────────────────────

const DEFAULTS = {
  // 基础路径
  rootPath: null,           // 自动检测（引擎构造函数中已有逻辑）
  dataDir: null,            // 默认 <rootPath>/data

  // 引擎行为
  silent: false,            // 是否抑制日志
  logLevel: 'info',         // silent | error | warn | info | debug
  sessionId: null,          // 自动生成

  // 记忆系统
  memory: {
    decayEnabled: true,     // Ebbinghaus 衰减
    decayRate: 0.01,        // 每日衰减率
    maxCoreSize: 1000,      // CORE 层最大条目
    maxLearnedSize: 5000,   // LEARNED 层最大条目
    maxEphemeralSize: 100,  // EPHEMERAL 层最大条目
  },

  // 认知参数
  cognition: {
    confidenceThreshold: 0.7,  // 低于此值触发 LLM 兜底
    maxThoughtChainDepth: 5,   // 思维链最大深度
    cognitiveLoadLimit: 0.8,   // 认知负荷上限
  },

  // MCP 服务器
  mcp: {
    port: 8099,             // 默认端口
    host: '127.0.0.1',      // 仅本地监听
    corsOrigins: ['http://localhost'],  // CORS 允许的来源
    sessionMaxAge: 1800000, // 会话 30 分钟超时
    rateLimitWindow: 60000, // 速率限制窗口 (ms)
    rateLimitMax: 100,      // 窗口内最大请求数
  },


  // 自愈 RL
  selfHealing: {
    enabled: true,
    learningRate: 0.1,
    epsilon: 0.2,           // ε-greedy 探索率
    reflectionEnabled: true,
  },

  // 升级
  upgrade: {
    autoCheck: true,        // 启动时检查更新
    channel: 'stable',      // stable | beta
  },

  // 功能开关
  features: {
    innerMonologue: false,  // 内心独白
    dreamEngine: true,      // 梦境引擎
    theoryOfMind: true,     // 心智理论
    codeExecution: true,    // 代码执行
    networkAccess: true,    // 网络访问
    searchEnabled: true,    // 搜索模块
  },
};

// ─── 配置加载器 ─────────────────────────────────────────────────────────────

class HeartFlowConfig {
  constructor() {
    this._values = {};
    this._sources = [];     // 记录每个配置的来源（调试用）
    this._projectRoot = null;
    this._loaded = false;
  }

  /**
   * 加载配置（三层合并）
   * @param {string} projectRoot - 项目根目录
   * @returns {HeartFlowConfig} this
   */
  load(projectRoot) {
    if (this._loaded) return this;
    this._projectRoot = projectRoot;
    this._values = { ...DEFAULTS };

    // 第 1 层：项目根目录 config.json
    this._mergeFile(path.join(projectRoot, 'config.json'), 'project');

    // 第 2 层：用户目录 config.json（~/.heartflow/config.json）
    const userConfigPath = path.join(os.homedir(), '.heartflow', 'config.json');
    this._mergeFile(userConfigPath, 'user');

    // 第 3 层：环境变量
    this._mergeEnv();

    this._loaded = true;
    return this;
  }

  /**
   * 获取配置值（支持点号路径）
   * @param {string} key - 点号分隔的路径，如 'mcp.port'
   * @param {*} fallback - 默认值
   * @returns {*}
   */
  get(key, fallback) {
    if (!key) return this._values;
    const parts = key.split('.');
    let val = this._values;
    for (const p of parts) {
      if (val && typeof val === 'object' && p in val) {
        val = val[p];
      } else {
        return fallback;
      }
    }
    return val !== undefined ? val : fallback;
  }

  /**
   * 设置配置值（支持点号路径）
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    const parts = key.split('.');
    let obj = this._values;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!(p in obj) || typeof obj[p] !== 'object') obj[p] = {};
      obj = obj[p];
    }
    obj[parts[parts.length - 1]] = value;
  }

  /**
   * 获取全部配置（展开为引擎构造函数需要的扁平结构）
   * @returns {object}
   */
  toEngineConfig() {
    const cfg = {
      rootPath: this._values.rootPath || this._projectRoot,
      dataDir: this._values.dataDir || path.join(this._projectRoot, 'data'),
      silent: this._values.silent,
      sessionId: this._values.sessionId,
    };

    // 附加可选功能开关
    if (this._values.features) {
      cfg.features = { ...this._values.features };
    }

    return cfg;
  }

  /**
   * 获取 MCP 服务器配置
   * @returns {object}
   */
  toMCPConfig() {
    return {
      port: this._values.mcp?.port || DEFAULTS.mcp.port,
      host: this._values.mcp?.host || DEFAULTS.mcp.host,
      corsOrigins: this._values.mcp?.corsOrigins || DEFAULTS.mcp.corsOrigins,
      sessionMaxAge: this._values.mcp?.sessionMaxAge || DEFAULTS.mcp.sessionMaxAge,
      rateLimitWindow: this._values.mcp?.rateLimitWindow || DEFAULTS.mcp.rateLimitWindow,
      rateLimitMax: this._values.mcp?.rateLimitMax || DEFAULTS.mcp.rateLimitMax,
    };
  }

  /**
   * 保存用户级配置（持久化到 ~/.hermes/heartflow/config.json）
   * 支持点号路径键名自动展开为嵌套对象
   * @param {object} overrides - 要覆盖的键值对
   */
  saveUserConfig(overrides = {}) {
    const userDir = path.join(os.homedir(), '.heartflow');
    fs.mkdirSync(userDir, { recursive: true });

    const userConfigPath = path.join(userDir, 'config.json');
    let existing = {};
    try { existing = JSON.parse(fs.readFileSync(userConfigPath, 'utf-8')); } catch (_) {}

    // 展开点号路径的键（如 'features.dreamEngine' → { features: { dreamEngine: false } }）
    const expanded = {};
    for (const [key, value] of Object.entries(overrides)) {
      if (key.includes('.')) {
        const parts = key.split('.');
        let target = expanded;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!(parts[i] in target)) target[parts[i]] = {};
          target = target[parts[i]];
        }
        target[parts[parts.length - 1]] = value;
      } else {
        expanded[key] = value;
      }
    }

    const merged = this._deepMerge({ ...existing }, expanded);
    fs.writeFileSync(userConfigPath, JSON.stringify(merged, null, 2) + '\n');
    this._mergeFile(userConfigPath, 'user');
    return merged;
  }

  /**
   * 获取配置摘要（用于 status 命令展示）
   * @returns {object}
   */
  summary() {
    return {
      version: this.get('version', 'unknown'),
      rootPath: this._projectRoot,
      mcp: this.toMCPConfig(),
      features: { ...this._values.features },
      dataDir: this.get('dataDir', path.join(this._projectRoot, 'data')),
      sources: this._sources,
    };
  }

  // ─── 内部方法 ──────────────────────────────────────────────────────────

  _mergeFile(filePath, source) {
    try {
      if (!fs.existsSync(filePath)) return;
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      this._deepMerge(this._values, parsed);
      this._sources.push({ file: filePath, source });
    } catch (_) { /* skip invalid config files */ }
  }

  _mergeEnv() {
    const envMap = {
      HEARTFLOW_LOG_LEVEL: ['logLevel'],
      HEARTFLOW_DATA_DIR: ['dataDir'],
      HEARTFLOW_MCP_PORT: ['mcp', 'port'],
      HEARTFLOW_MCP_HOST: ['mcp', 'host'],
      HEARTFLOW_SILENT: ['silent'],
    };

    for (const [envKey, configPath] of Object.entries(envMap)) {
      const val = process.env[envKey];
      if (val === undefined) continue;

      let parsed;
      if (val === 'true') parsed = true;
      else if (val === 'false') parsed = false;
      else if (/^\d+$/.test(val)) parsed = parseInt(val, 10);
      else parsed = val;

      this._setNested(this._values, configPath, parsed);
      this._sources.push({ env: envKey, source: 'environment' });
    }
  }

  _setNested(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current)) current[key] = {};
      current = current[key];
    }
    current[path[path.length - 1]] = value;
  }

  _deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in target) || typeof target[key] !== 'object') target[key] = {};
        this._deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }
}

// ─── 导出 ────────────────────────────────────────────────────────────────────

// 单例（整个进程共享一份配置）
const config = new HeartFlowConfig();

/**
 * 加载配置（推荐在入口处调用一次）
 * @param {string} projectRoot
 * @returns {HeartFlowConfig}
 */
function load(projectRoot) {
  return config.load(projectRoot);
}

/**
 * 获取单例实例
 * @returns {HeartFlowConfig}
 */
function getInstance() {
  return config;
}

module.exports = {
  HeartFlowConfig,
  load,
  getInstance,
  DEFAULTS,
};
