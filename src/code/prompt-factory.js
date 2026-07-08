/**
 * HeartFlow PromptFactory
 *
 * 提示词模板和语言适配
 * - 所有语言相关的提示词模板
 * - 语言检测和适配逻辑
 * - 提示词构建方法
 *
 * @author HeartFlow Team
 */

// ============================================================
// 内置代码模板库
// ============================================================

const { validateFetchUrl } = require('../security/url-validator.js');

const TEMPLATES = {
  javascript: {
    algorithm: {
      'quick-sort': {
        name: '快速排序',
        description: '快速排序算法实现',
        code: `/**
 * 快速排序算法
 * 时间复杂度: 平均 O(n log n), 最坏 O(n²)
 * 空间复杂度: O(log n)
 */
function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}

// 示例
const arr = [64, 34, 25, 12, 22, 11, 90];
if (process.env.HEARTFLOW_DEBUG) console.log('原数组:', arr);
if (process.env.HEARTFLOW_DEBUG) console.log('排序后:', quickSort([...arr]));`,
        confidence: 0.95
      },
      'binary-search': {
        name: '二分查找',
        description: '二分查找算法（有序数组）',
        code: `/**
 * 二分查找算法
 * 时间复杂度: O(log n)
 * 前提: 数组必须已排序
 */
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid; // 找到目标，返回索引
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1; // 未找到
}

// 示例
const sortedArr = [11, 12, 22, 25, 34, 64, 90];
const target = 25;
const result = binarySearch(sortedArr, target);
if (process.env.HEARTFLOW_DEBUG) console.log(\`数组: [\${sortedArr.join(', ')}]\`);
if (process.env.HEARTFLOW_DEBUG) if (process.env.HEARTFLOW_DEBUG) console.log(\`目标 \${target} 的索引: \${result}\`);`,
        confidence: 0.95
      },
      'linked-list': {
        name: '链表',
        description: '单向链表实现',
        code: `/**
 * 单向链表实现
 */
class ListNode {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.size = 0;
  }

  // 在链表末尾添加节点
  append(val) {
    const newNode = new ListNode(val);
    if (!this.head) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = newNode;
    }
    this.size++;
  }

  // 在指定位置插入节点
  insertAt(val, index) {
    if (index < 0 || index > this.size) return false;
    const newNode = new ListNode(val);
    if (index === 0) {
      newNode.next = this.head;
      this.head = newNode;
    } else {
      let prev = this.head;
      for (let i = 0; i < index - 1; i++) {
        prev = prev.next;
      }
      newNode.next = prev.next;
      prev.next = newNode;
    }
    this.size++;
    return true;
  }

  // 删除指定位置的节点
  removeAt(index) {
    if (index < 0 || index >= this.size) return null;
    let removed;
    if (index === 0) {
      removed = this.head;
      this.head = this.head.next;
    } else {
      let prev = this.head;
      for (let i = 0; i < index - 1; i++) {
        prev = prev.next;
      }
      removed = prev.next;
      prev.next = removed.next;
    }
    this.size--;
    return removed.val;
  }

  // 打印链表
  print() {
    const values = [];
    let current = this.head;
    while (current) {
      values.push(current.val);
      current = current.next;
    }
    if (process.env.HEARTFLOW_DEBUG) console.log(values.join(' -> '));
  }
}

// 示例
const list = new LinkedList();
list.append(1);
list.append(2);
list.append(3);
list.print(); // 1 -> 2 -> 3`,
        confidence: 0.9
      }
    },
    structure: {
      'class-template': {
        name: '类模板',
        description: '标准类结构模板',
        code: `/**
 * [类名] - [描述]
 */
class [ClassName] {
  constructor(options = {}) {
    // 初始化属性
    this.options = { ...this.getDefaultOptions(), ...options };
    this.initialized = false;
  }

  getDefaultOptions() {
    return {
      // 默认配置
    };
  }

  async init() {
    if (this.initialized) return;
    // 初始化逻辑
    this.initialized = true;
  }

  destroy() {
    // 清理资源
    this.initialized = false;
  }
}

module.exports = { [ClassName] };`,
        confidence: 0.85
      },
      'event-emitter': {
        name: '事件发射器',
        description: '标准事件系统实现',
        code: `/**
 * 事件发射器实现
 */
class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(listener);
    return () => this.off(event, listener); // 返回取消订阅函数
  }

  off(event, listener) {
    if (!this.events.has(event)) return;
    const listeners = this.events.get(event);
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return false;
    this.events.get(event).forEach(listener => {
      try {
        listener(...args);
      } catch (err) {
        console.error(\`Error in event listener for "\${event}":\`, err);
      }
    });
    return true;
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }
}

module.exports = { EventEmitter };`,
        confidence: 0.9
      }
    },
    network: {
      'http-server': {
        name: 'HTTP 服务器',
        description: 'Node.js HTTP 服务器模板',
        code: `/**
 * HTTP 服务器
 * 使用 Node.js 原生 http 模块
 */
const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  try {
    // 路由处理
    if (pathname === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

server.listen(PORT, () => {
  if (process.env.HEARTFLOW_DEBUG) console.log(\`服务器运行在 http://localhost:\${PORT}\`);
});

module.exports = { server };`,
        confidence: 0.9
      },
      'fetch-api': {
        name: 'Fetch API 封装',
        description: 'HTTP 请求封装',
        code: `/**
 * Fetch API 封装
 * 支持自动重试、超时、错误处理
 */
class ApiClient {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
  }

  async request(endpoint, options = {}) {
    const url = \`\${this.baseUrl}\${endpoint}\`;

    // SSRF 防护：校验 URL 安全性
    const urlCheck = validateFetchUrl(url);
    if (!urlCheck.safe) {
      throw new Error('SSRF防护: ' + urlCheck.reason);
    }

    const config = {
      ...this.defaultOptions,
      ...options,
      headers: {
        ...this.defaultOptions.headers,
        ...options.headers
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// 示例
const api = new ApiClient('https://api.example.com');

async function main() {
  try {
    const data = await api.get('/users/1');
    if (process.env.HEARTFLOW_DEBUG) console.log('用户数据:', data);
  } catch (err) {
    console.error('请求失败:', err.message);
  }
}

main();`,
        confidence: 0.85
      }
    },
    io: {
      'file-operations': {
        name: '文件操作',
        description: '文件读写操作封装',
        code: `/**
 * 文件操作工具
 */
const fs = require('fs').promises;
const path = require('path');

class FileOps {
  /**
   * 读取文件内容
   */
  static async read(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, content };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 写入文件
   */
  static async write(filePath, content) {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 追加内容到文件
   */
  static async append(filePath, content) {
    try {
      await fs.appendFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * 检查文件是否存在
   */
  static async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 删除文件
   */
  static async delete(filePath) {
    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = { FileOps };`,
        confidence: 0.9
      }
    },
    cli: {
      'commander-cli': {
        name: 'Commander CLI 工具',
        description: '使用 commander 构建 CLI 工具',
        code: `#!/usr/bin/env node
/**
 * CLI 工具 - 使用 Commander.js
 */
const { Command } = require('commander');
const program = new Command();

program
  .name('my-cli')
  .description('CLI 工具说明')
  .version('1.0.0');

program
  .command('init')
  .description('初始化项目')
  .option('-f, --force', '强制覆盖已有文件')
  .action((options) => {
    if (process.env.HEARTFLOW_DEBUG) console.log('初始化项目...');
    if (options.force && process.env.HEARTFLOW_DEBUG) console.log('强制模式已启用');
  });

program
  .command('build [target]')
  .description('构建项目')
  .option('-o, --output <dir>', '输出目录')
  .action((target, options) => {
    if (process.env.HEARTFLOW_DEBUG) console.log(\`构建目标: \${target || 'default'}\`);
    if (process.env.HEARTFLOW_DEBUG) console.log(\`输出目录: \${options.output || './dist'}\`);
  });

program
  .command('deploy <env>')
  .description('部署到指定环境')
  .option('--dry-run', '仅模拟不实际执行')
  .action((env, options) => {
    if (process.env.HEARTFLOW_DEBUG) console.log(\`部署到: \${env}\`);
    if (options.dryRun) {
      if (process.env.HEARTFLOW_DEBUG) console.log('[DRY-RUN] 仅模拟执行');
      return;
    }
  });

program.parse(process.argv);`,
        confidence: 0.9
      },
      'simple-cli': {
        name: '简单 CLI 工具',
        description: '不依赖外部库的轻量 CLI',
        code: `#!/usr/bin/env node
/**
 * 轻量 CLI 工具 - 无外部依赖
 */
const commands = {
  help() {
    if (process.env.HEARTFLOW_DEBUG) console.log(\`用法: node \${require('path').basename(process.argv[1])} <命令> [选项]

命令:
  init        初始化项目
  build       构建项目
  deploy      部署项目
  help        显示帮助信息\`);
  },
  init() { if (process.env.HEARTFLOW_DEBUG) console.log('初始化项目...'); },
  build() { if (process.env.HEARTFLOW_DEBUG) console.log('构建项目...'); },
  deploy(env) { if (process.env.HEARTFLOW_DEBUG) console.log(\`部署到: \${env || 'production'}...\`); },
};

const cmd = process.argv[2];
const arg = process.argv[3];

if (commands[cmd]) commands[cmd](arg);
else { console.error(\`未知命令: \${cmd}\`); commands.help(); process.exit(1); }`,
        confidence: 0.85
      }
    },
    database: {
      'sqlite-query': {
        name: 'SQLite 查询',
        description: 'SQLite 数据库操作',
        code: `/**
 * SQLite 数据库操作
 */
const sqlite3 = require('better-sqlite3');

class Database {
  constructor(dbPath) {
    this.db = new sqlite3(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  migrate() {
    this.db.exec(\`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    \`);
  }

  createUser(name, email) {
    const stmt = this.db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
    const result = stmt.run(name, email);
    return result.lastInsertRowid;
  }

  getUserWithPosts(userId) {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return null;
    user.posts = this.db.prepare(
      'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
    return user;
  }

  close() { this.db.close(); }
}

// 示例
const db = new Database('./app.db');
db.migrate();
const userId = db.createUser('Alice', 'alice@example.com');
if (process.env.HEARTFLOW_DEBUG) console.log('用户信息:', db.getUserWithPosts(userId));
db.close();`,
        confidence: 0.85
      },
      'mongoose-model': {
        name: 'Mongoose 模型',
        description: 'MongoDB Mongoose 模型',
        code: `/**
 * Mongoose 数据模型
 */
const mongoose = require('mongoose');

async function connectDB(uri) {
  try {
    await mongoose.connect(uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp');
    if (process.env.HEARTFLOW_DEBUG) console.log('数据库连接成功');
  } catch (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  age: { type: Number, min: 0, max: 150 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

module.exports = { connectDB, User };`,
        confidence: 0.85
      }
    }
  },

  // TypeScript 模板（带类型注解）
  typescript: {
    algorithm: {
      'quick-sort': {
        name: '快速排序',
        description: '快速排序算法实现（TypeScript版）',
        code: `/**
 * 快速排序算法 - TypeScript 版本
 */
function quickSort<T>(arr: T[], low = 0, high = arr.length - 1): T[] {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition<T>(arr: T[], low: number, high: number): number {
  const pivot = arr[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}

// 示例
const arr: number[] = [64, 34, 25, 12, 22, 11, 90];
if (process.env.HEARTFLOW_DEBUG) console.log('原数组:', arr);
if (process.env.HEARTFLOW_DEBUG) console.log('排序后:', quickSort([...arr]));`,
        confidence: 0.95
      },
      'binary-search': {
        name: '二分查找',
        description: '二分查找算法（TypeScript版）',
        code: `/**
 * 二分查找算法 - TypeScript 版本
 */
function binarySearch<T>(arr: T[], target: T): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}

// 示例
const sortedArr: number[] = [11, 12, 22, 25, 34, 64, 90];
const target = 25;
const result = binarySearch(sortedArr, target);
if (process.env.HEARTFLOW_DEBUG) console.log(\`目标 \${target} 的索引: \${result}\`);`,
        confidence: 0.95
      }
    },
    structure: {
      'class-template': {
        name: '类模板',
        description: '标准 TypeScript 类结构',
        code: `/**
 * [类名] - [描述]
 */
export class [ClassName]<T = any> {
  private options: Required<T>;
  private initialized: boolean;

  constructor(options: T = {} as T) {
    this.options = { ...this.getDefaultOptions(), ...options } as Required<T>;
    this.initialized = false;
  }

  protected getDefaultOptions(): Partial<T> {
    return {};
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    // 初始化逻辑
    this.initialized = true;
  }

  destroy(): void {
    // 清理资源
    this.initialized = false;
  }

  protected isInitialized(): boolean {
    return this.initialized;
  }
}`,
        confidence: 0.9
      }
    },
    network: {
      'http-server': {
        name: 'HTTP 服务器',
        description: 'Express TypeScript 服务器',
        code: `/**
 * Express HTTP 服务器 - TypeScript 版本
 */
import express, { Express, Request, Response } from 'express';

const PORT = process.env.PORT || 3000;

const app: Express = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 路由
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 错误处理中间件
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  if (process.env.HEARTFLOW_DEBUG) console.log(\`服务器运行在 http://localhost:\${PORT}\`);
});

export { app };`,
        confidence: 0.9
      }
    },
    io: {
      'file-operations': {
        name: '文件操作',
        description: 'TypeScript 文件操作',
        code: `/**
 * 文件操作工具 - TypeScript 版本
 */
import * as fs from 'fs/promises';
import * as path from 'path';

export interface FileResult {
  success: boolean;
  content?: string;
  error?: string;
}

export class FileOps {
  static async read(filePath: string): Promise<FileResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, content };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  static async write(filePath: string, content: string): Promise<FileResult> {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  static async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async delete(filePath: string): Promise<FileResult> {
    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }
}`,
        confidence: 0.9
      }
    },
    cli: {
      'yargs-cli': {
        name: 'Yargs CLI 工具',
        description: '使用 yargs 构建 TypeScript CLI 工具',
        code: `#!/usr/bin/env node
/**
 * CLI 工具 - TypeScript + yargs
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface InitOptions { force?: boolean }
interface BuildOptions { output?: string }
interface DeployOptions { dryRun?: boolean }

yargs(hideBin(process.argv))
  .scriptName('my-cli')
  .usage('$0 <cmd> [选项]')
  .command('init', '初始化项目', (yargs) => {
    yargs.option('force', { type: 'boolean', describe: '强制覆盖已有文件' });
  }, (argv: InitOptions) => {
    if (process.env.HEARTFLOW_DEBUG) console.log('初始化项目...');
    if (argv.force && process.env.HEARTFLOW_DEBUG) console.log('强制模式已启用');
  })
  .command('build [target]', '构建项目', (yargs) => {
    yargs.positional('target', { type: 'string', describe: '构建目标' });
    yargs.option('output', { type: 'string', describe: '输出目录' });
  }, (argv: BuildOptions & { target?: string }) => {
    if (process.env.HEARTFLOW_DEBUG) console.log(\`构建目标: \${argv.target || 'default'}\`);
  })
  .command('deploy <env>', '部署到指定环境', (yargs) => {
    yargs.positional('env', { type: 'string', describe: '环境名称' });
    yargs.option('dry-run', { type: 'boolean', describe: '仅模拟' });
  }, (argv: DeployOptions & { env: string }) => {
    if (process.env.HEARTFLOW_DEBUG) console.log(\`部署到: \${argv.env}\`);
  })
  .demandCommand(1, '请指定命令')
  .strict()
  .parse();`,
        confidence: 0.9
      }
    },
    database: {
      'typeorm-model': {
        name: 'TypeORM 模型',
        description: 'TypeORM 实体和数据库连接',
        code: `/**
 * TypeORM 数据模型
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ default: 'user' })
  role!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column('text', { nullable: true })
  content!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  author!: User;

  @CreateDateColumn()
  createdAt!: Date;
}`,
        confidence: 0.85
      }
    }
  },

  // Python 模板
  python: {
    algorithm: {
      'quick-sort': {
        name: '快速排序',
        description: '快速排序算法（Python版）',
        code: `"""
快速排序算法
时间复杂度: 平均 O(n log n), 最坏 O(n²)
空间复杂度: O(log n)
"""
from typing import List, TypeVar

T = TypeVar('T')

def quick_sort(arr: List[T], low: int = 0, high: int = None) -> List[T]:
    """快速排序主函数"""
    if high is None:
        high = len(arr) - 1

    if low < high:
        pivot_index = partition(arr, low, high)
        quick_sort(arr, low, pivot_index - 1)
        quick_sort(arr, pivot_index + 1, high)

    return arr

def partition(arr: List[T], low: int, high: int) -> int:
    """分区函数"""
    pivot = arr[high]
    i = low - 1

    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]

    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

if __name__ == "__main__":
    arr = [64, 34, 25, 12, 22, 11, 90]
    print(f"原数组: {arr}")
    print(f"排序后: {quick_sort(arr.copy())}")`,
        confidence: 0.95
      },
      'binary-search': {
        name: '二分查找',
        description: '二分查找算法（Python版）',
        code: `"""
二分查找算法
时间复杂度: O(log n)
前提: 列表必须已排序
"""
from typing import List, TypeVar, Optional

T = TypeVar('T')

def binary_search(arr: List[T], target: T) -> int:
    """
    二分查找

    Args:
        arr: 已排序的列表
        target: 查找目标

    Returns:
        目标索引，未找到返回 -1
    """
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = (left + right) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1

if __name__ == "__main__":
    sorted_arr = [11, 12, 22, 25, 34, 64, 90]
    target = 25
    result = binary_search(sorted_arr, target)
    print(f"目标 {target} 的索引: {result}")`,
        confidence: 0.95
      }
    },
    structure: {
      'class-template': {
        name: '类模板',
        description: 'Python 标准类结构',
        code: `"""
[类名] - [描述]
"""
from typing import Any, Dict, Optional
from abc import ABC, abstractmethod

class BaseClass(ABC):
    """基类模板"""

    def __init__(self, options: Optional[Dict[str, Any]] = None):
        self.options = self.get_default_options()
        if options:
            self.options.update(options)
        self.initialized = False

    def get_default_options(self) -> Dict[str, Any]:
        """获取默认配置"""
        return {}

    @abstractmethod
    async def init(self) -> None:
        """初始化逻辑（子类实现）"""
        pass

    def destroy(self) -> None:
        """清理资源"""
        self.initialized = False

class [ClassName](BaseClass):
    """[类名] 实现"""

    async def init(self) -> None:
        if self.initialized:
            return
        # 初始化逻辑
        self.initialized = True

    def process(self, data: Any) -> Any:
        """处理数据"""
        return data`,
        confidence: 0.9
      }
    },
    network: {
      'http-server': {
        name: 'HTTP 服务器',
        description: 'FastAPI 服务器',
        code: `"""
FastAPI HTTP 服务器
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI(title="API Server")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 请求模型
class HealthResponse(BaseModel):
    status: str
    timestamp: int

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """健康检查端点"""
    return HealthResponse(status="ok", timestamp=__import__("time").time_ns())

@app.get("/api/items/{item_id}")
async def get_item(item_id: int, q: Optional[str] = None):
    """获取单个项目"""
    return {"item_id": item_id, "q": q}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
        confidence: 0.9
      }
    },
    io: {
      'file-operations': {
        name: '文件操作',
        description: 'Python 文件操作',
        code: `"""
文件操作工具
"""
import os
from pathlib import Path
from typing import Optional, List
import json

class FileOps:
    """文件操作工具类"""

    @staticmethod
    def read(file_path: str, encoding: str = 'utf-8') -> dict:
        """读取文件"""
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                content = f.read()
            return {'success': True, 'content': content}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def write(file_path: str, content: str, encoding: str = 'utf-8') -> dict:
        """写入文件"""
        try:
            Path(file_path).parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, 'w', encoding=encoding) as f:
                f.write(content)
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def exists(file_path: str) -> bool:
        """检查文件是否存在"""
        return Path(file_path).exists()

    @staticmethod
    def delete(file_path: str) -> dict:
        """删除文件"""
        try:
            os.remove(file_path)
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def list_files(directory: str, pattern: str = '*') -> List[str]:
        """列出目录下的文件"""
        return [str(p) for p in Path(directory).glob(pattern)]`,
        confidence: 0.9
      }
    },
    cli: {
      'argparse-cli': {
        name: 'Argparse CLI 工具',
        description: '使用 argparse 构建 Python CLI',
        code: `"""
CLI 工具 - 使用 argparse
"""
import argparse
import sys


def main():
    parser = argparse.ArgumentParser(description="CLI 工具说明")
    parser.add_argument("--version", action="version", version="1.0.0")

    subparsers = parser.add_subparsers(dest="command", help="可用命令")

    init_p = subparsers.add_parser("init", help="初始化项目")
    init_p.add_argument("-f", "--force", action="store_true", help="强制覆盖")

    build_p = subparsers.add_parser("build", help="构建项目")
    build_p.add_argument("target", nargs="?", default="default")
    build_p.add_argument("-o", "--output", default="./dist")

    deploy_p = subparsers.add_parser("deploy", help="部署项目")
    deploy_p.add_argument("env", help="目标环境")
    deploy_p.add_argument("--dry-run", action="store_true", help="仅模拟")

    args = parser.parse_args()

    if args.command == "init":
        print("初始化项目...")
    elif args.command == "build":
        print(f"构建目标: {args.target}")
    elif args.command == "deploy":
        print(f"部署到: {args.env}")
        if args.dry_run:
            print("[DRY-RUN] 仅模拟执行")
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()`,
        confidence: 0.9
      },
      'click-cli': {
        name: 'Click CLI 工具',
        description: '使用 click 构建 Python CLI',
        code: `"""
CLI 工具 - 使用 click
"""
import click


@click.group()
def cli():
    """CLI 工具说明"""
    pass


@cli.command()
@click.option("-f", "--force", is_flag=True, help="强制覆盖已有文件")
def init(force):
    """初始化项目"""
    click.echo("初始化项目...")


@cli.command()
@click.argument("target", required=False, default="default")
@click.option("-o", "--output", default="./dist", help="输出目录")
def build(target, output):
    """构建项目"""
    click.echo(f"构建目标: {target}")


@cli.command()
@click.argument("env")
@click.option("--dry-run", is_flag=True, help="仅模拟不实际执行")
def deploy(env, dry_run):
    """部署到指定环境"""
    click.echo(f"部署到: {env}")
    if dry_run:
        click.echo("[DRY-RUN] 仅模拟执行")


if __name__ == "__main__":
    cli()`,
        confidence: 0.9
      }
    },
    database: {
      'sqlalchemy-model': {
        name: 'SQLAlchemy 模型',
        description: 'SQLAlchemy ORM 数据库模型',
        code: `"""
SQLAlchemy 数据模型
"""
from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime,
    ForeignKey, Text, Boolean,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(String(20), default="user")
    created_at = Column(DateTime, default=datetime.utcnow)

    posts = relationship("Post", back_populates="author")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", back_populates="posts")


def get_session(database_url: str = "sqlite:///app.db"):
    engine = create_engine(database_url, echo=False)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session()


if __name__ == "__main__":
    session = get_session()
    user = User(name="Alice", email="alice@example.com")
    session.add(user)
    session.commit()
    print(f"创建用户: {user.id}")`,
        confidence: 0.85
      }
    }
  },

  // Bash 模板
  bash: {
    algorithm: {
      'quick-sort': {
        name: '排序脚本',
        description: 'Bash 排序脚本（简化示例）',
        code: '#!/bin/bash\necho "Array: 64 34 25 12 22 11 90"\necho "Sorted: 11 12 22 25 34 64 90"',
        confidence: 0.7
      }
    },
    structure: {
      'cli-template': {
        name: 'CLI 工具模板',
        description: '标准 Bash CLI 脚本模板',
        code: '#!/bin/bash\nset -euo pipefail\nVERSION="1.0.0"\nlog_info() { echo "[INFO] $*"; }\nlog_error() { echo "[ERROR] $*" >&2; }\ncase "${1:-}" in -h|--help) echo "Usage: $0 <cmd>" ;; init|build|deploy) log_info "Running $1" ;; *) log_error "Unknown: $1" ;; esac',
        confidence: 0.9
      }
    },
    network: {
      'http-check': {
        name: 'HTTP 健康检查',
        description: '检查 URL 是否可访问',
        code: '#!/bin/bash\nURL="${1:-http://localhost}"\ncurl -sf --max-time 5 "$URL" > /dev/null 2>&1 && echo "OK: $URL" || echo "FAIL: $URL"',
        confidence: 0.9
      }
    },
    io: {
      'file-watcher': {
        name: '文件监控脚本',
        description: '监控文件变化并执行命令',
        code: '#!/bin/bash\nFILE="$1"; CMD="$2"; LAST=""\nwhile true; do CUR=$(md5sum "$FILE" 2>/dev/null | awk "{print $1}"); [ "$CUR" != "$LAST" ] && { echo "[WATCH] $FILE changed"; bash -c "$CMD"; LAST="$CUR"; }; sleep 2; done',
        confidence: 0.8
      }
    },
    cli: {
      'advanced-cli': {
        name: '高级 CLI 脚本',
        description: '带子命令和选项的 Bash CLI 工具',
        code: `#!/bin/bash
set -euo pipefail
VERSION="1.0.0"

# ─── 颜色输出 ──────────────────────────────────────
RED='\\033[0;31m'; GREEN='\\033[0;32m'; YELLOW='\\033[1;33m'; NC='\\033[0m'
info()  { echo -e "\${GREEN}[INFO]\${NC} $*"; }
warn()  { echo -e "\${YELLOW}[WARN]\${NC} $*"; }
error() { echo -e "\${RED}[ERROR]\${NC} $*" >&2; }

# ─── 命令函数 ──────────────────────────────────────
cmd_init() {
  local force=false
  [[ "$1" == "-f" || "$1" == "--force" ]] && force=true
  info "初始化项目..."; $force && info "强制模式已启用"
}

cmd_build() {
  local target="\${1:-default}" output="\${2:-./dist}"
  info "构建目标: $target"; info "输出目录: $output"
}

cmd_deploy() {
  local env="$1"; shift
  local dry_run=false
  [[ "$1" == "--dry-run" ]] && dry_run=true
  info "部署到: $env"
  $dry_run && { warn "[DRY-RUN] 仅模拟执行"; return; }
}

# ─── 主入口 ────────────────────────────────────────
main() {
  [[ $# -eq 0 ]] && { echo "用法: $0 <命令> [选项]"; exit 1; }
  local cmd="$1"; shift
  case "$cmd" in
    init)   cmd_init "$@" ;;
    build)  cmd_build "$@" ;;
    deploy) cmd_deploy "$@" ;;
    help|--help|-h)
      echo "用法: $0 {init|build|deploy} [选项]";;
    *) error "未知命令: $cmd"; exit 1 ;;
  esac
}

main "$@"`,
        confidence: 0.85
      }
    },
    database: {
      'db-backup': {
        name: '数据库备份脚本',
        description: 'MySQL/PostgreSQL 数据库备份',
        code: `#!/bin/bash
# 数据库备份脚本
set -euo pipefail

# ─── 配置 ──────────────────────────────────────────
DB_TYPE="\${DB_TYPE:-mysql}"            # mysql | postgres
DB_HOST="\${DB_HOST:-localhost}"
DB_PORT="\${DB_PORT:-3306}"
DB_NAME="\${DB_NAME:-myapp}"
DB_USER="\${DB_USER:-root}"
DB_PASS="\${DB_PASS:-}"
BACKUP_DIR="\${BACKUP_DIR:-./backups}"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ─── 创建备份目录 ─────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ─── 执行备份 ─────────────────────────────────────
backup_mysql() {
  local file="$BACKUP_DIR/\${DB_NAME}_$TIMESTAMP.sql.gz"
  info "备份 MySQL 数据库: $DB_NAME"
  mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" \\
    \${DB_PASS:+-p"$DB_PASS"} "$DB_NAME" | gzip > "$file"
  info "备份完成: $file"
}

backup_postgres() {
  local file="$BACKUP_DIR/\${DB_NAME}_$TIMESTAMP.sql.gz"
  info "备份 PostgreSQL 数据库: $DB_NAME"
  PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" \\
    -U "$DB_USER" "$DB_NAME" | gzip > "$file"
  info "备份完成: $file"
}

# ─── 清理旧备份 ───────────────────────────────────
cleanup_old() {
  info "清理 \${RETENTION_DAYS} 天前的备份..."
  find "$BACKUP_DIR" -name "\${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
}

# ─── 主流程 ───────────────────────────────────────
main() {
  echo "====== 数据库备份 ======"
  echo "类型: $DB_TYPE | 主机: $DB_HOST | 数据库: $DB_NAME"
  echo "备份目录: $BACKUP_DIR"
  echo "========================="

  case "$DB_TYPE" in
    mysql)    backup_mysql ;;
    postgres) backup_postgres ;;
    *)        error "不支持的数据库类型: $DB_TYPE"; exit 1 ;;
  esac

  cleanup_old
  info "备份流程完成"
}

main "$@"`,
        confidence: 0.85
      }
    }
  },

  // Go 模板
  go: {
    algorithm: {
      'quick-sort': {
        name: '快速排序',
        description: '快速排序算法（Go版）',
        code: `// 快速排序算法
// 时间复杂度: 平均 O(n log n), 最坏 O(n²)
// 空间复杂度: O(log n)
package main

import "fmt"

func quickSort(arr []int, low, high int) []int {
	if low < high {
		pivotIndex := partition(arr, low, high)
		quickSort(arr, low, pivotIndex-1)
		quickSort(arr, pivotIndex+1, high)
	}
	return arr
}

func partition(arr []int, low, high int) int {
	pivot := arr[high]
	i := low - 1

	for j := low; j < high; j++ {
		if arr[j] <= pivot {
			i++
			arr[i], arr[j] = arr[j], arr[i]
		}
	}

	arr[i+1], arr[high] = arr[high], arr[i+1]
	return i + 1
}

func main() {
	arr := []int{64, 34, 25, 12, 22, 11, 90}
	fmt.Println("原数组:", arr)
	fmt.Println("排序后:", quickSort(arr, 0, len(arr)-1))
}`,
        confidence: 0.95
      },
      'binary-search': {
        name: '二分查找',
        description: '二分查找算法（Go版）',
        code: `// 二分查找算法
// 时间复杂度: O(log n)
package main

import "fmt"

func binarySearch(arr []int, target int) int {
	left, right := 0, len(arr)-1

	for left <= right {
		mid := (left + right) / 2

		if arr[mid] == target {
			return mid
		} else if arr[mid] < target {
			left = mid + 1
		} else {
			right = mid - 1
		}
	}

	return -1
}

func main() {
	sortedArr := []int{11, 12, 22, 25, 34, 64, 90}
	target := 25
	result := binarySearch(sortedArr, target)
	fmt.Printf("目标 %d 的索引: %d\\n", target, result)
}`,
        confidence: 0.95
      }
    },
    structure: {
      'class-template': {
        name: '结构体模板',
        description: 'Go 标准结构体模板',
        code: `// [类名] - [描述]
package main

import (
	"fmt"
	"sync"
)

// 默认配置
type Options struct {
	Option1 string
	Option2 int
}

func DefaultOptions() Options {
	return Options{
		Option1: "default",
		Option2: 0,
	}
}

// 主结构体
type Service struct {
	options Options
	mu      sync.RWMutex
}

func NewService(opts ...Options) *Service {
	opt := DefaultOptions()
	if len(opts) > 0 {
		opt = opts[0]
	}

	return &Service{
		options: opt,
	}
}

func (s *Service) Init() error {
	// 初始化逻辑
	return nil
}

func (s *Service) Process(data interface{}) (interface{}, error) {
	// 处理逻辑
	return data, nil
}

func (s *Service) Close() error {
	// 清理资源
	return nil
}

func main() {
	svc := NewService()
	defer svc.Close()

	if err := svc.Init(); err != nil {
		fmt.Println("初始化失败:", err)
		return
	}

	result, _ := svc.Process("test data")
	fmt.Println("结果:", result)
}`,
        confidence: 0.9
      }
    },
    network: {
      'http-server': {
        name: 'HTTP 服务器',
        description: 'Gin HTTP 服务器',
        code: `// HTTP 服务器 - Gin 框架
package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// CORS 中间件
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// 健康检查
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"timestamp": time.Now().Unix(),
		})
	})

	// RESTful 路由示例
	r.GET("/api/items/:id", func(c *gin.Context) {
		id := c.Param("id")
		c.JSON(http.StatusOK, gin.H{
			"id": id,
		})
	})

	// 启动服务器
	r.Run(":8080")
}`,
        confidence: 0.9
      }
    },
    io: {
      'file-operations': {
        name: '文件操作',
        description: 'Go 文件操作',
        code: `// 文件操作工具
package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
)

// 读取文件
func ReadFile(filePath string) ([]byte, error) {
	return os.ReadFile(filePath)
}

// 写入文件
func WriteFile(filePath string, content []byte) error {
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	return os.WriteFile(filePath, content, 0644)
}

// 检查文件是否存在
func FileExists(filePath string) bool {
	_, err := os.Stat(filePath)
	return err == nil
}

// 删除文件
func DeleteFile(filePath string) error {
	return os.Remove(filePath)
}

// 复制文件
func CopyFile(src, dst string) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	dir := filepath.Dir(dst)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	dstFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer dstFile.Close()

	_, err = io.Copy(dstFile, srcFile)
	return err
}

func main() {
	// 示例
	content := []byte("Hello, World!")

	if err := WriteFile("test.txt", content); err != nil {
		fmt.Println("写入失败:", err)
		return
	}

	data, err := ReadFile("test.txt")
	if err != nil {
		fmt.Println("读取失败:", err)
		return
	}

	fmt.Println("文件内容:", string(data))

	DeleteFile("test.txt")
}`,
        confidence: 0.9
      }
    },
    cli: {
      'cobra-cli': {
        name: 'Cobra CLI 工具',
        description: '使用 cobra 构建 Go CLI 工具',
        code: `// CLI 工具 - Cobra 框架
package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "my-cli",
	Short: "CLI 工具说明",
}

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "初始化项目",
	Run: func(cmd *cobra.Command, args []string) {
		force, _ := cmd.Flags().GetBool("force")
		fmt.Println("初始化项目...")
		if force {
			fmt.Println("强制模式已启用")
		}
	},
}

var buildCmd = &cobra.Command{
	Use:   "build [target]",
	Short: "构建项目",
	Run: func(cmd *cobra.Command, args []string) {
		target := "default"
		if len(args) > 0 {
			target = args[0]
		}
		output, _ := cmd.Flags().GetString("output")
		fmt.Printf("构建目标: %s\\n", target)
		fmt.Printf("输出目录: %s\\n", output)
	},
}

var deployCmd = &cobra.Command{
	Use:   "deploy <env>",
	Short: "部署到指定环境",
	Run: func(cmd *cobra.Command, args []string) {
		if len(args) == 0 {
			fmt.Println("请指定环境")
			os.Exit(1)
		}
		env := args[0]
		dryRun, _ := cmd.Flags().GetBool("dry-run")
		fmt.Printf("部署到: %s\\n", env)
		if dryRun {
			fmt.Println("[DRY-RUN] 仅模拟执行")
			return
		}
	},
}

func init() {
	initCmd.Flags().BoolP("force", "f", false, "强制覆盖已有文件")
	buildCmd.Flags().StringP("output", "o", "./dist", "输出目录")
	deployCmd.Flags().Bool("dry-run", false, "仅模拟不实际执行")

	rootCmd.AddCommand(initCmd, buildCmd, deployCmd)
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}`,
        confidence: 0.9
      }
    },
    database: {
      'gorm-model': {
        name: 'GORM 模型',
        description: 'Go GORM ORM 数据模型',
        code: `// GORM 数据模型
package main

import (
	"fmt"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID        uint      \`gorm:"primaryKey"\`
	Name      string    \`gorm:"size:100;not null"\`
	Email     string    \`gorm:"uniqueIndex;not null"\`
	Role      string    \`gorm:"default:user"\`
	CreatedAt time.Time
	Posts     []Post \`gorm:"foreignKey:UserID"\`
}

// Post 文章模型
type Post struct {
	ID        uint   \`gorm:"primaryKey"\`
	Title     string \`gorm:"not null"\`
	Content   string \`gorm:"type:text"\`
	UserID    uint
	Published bool \`gorm:"default:false"\`
	CreatedAt time.Time
}

func main() {
	// 连接数据库
	db, err := gorm.Open(sqlite.Open("app.db"), &gorm.Config{})
	if err != nil {
		panic("数据库连接失败: " + err.Error())
	}

	// 自动迁移
	db.AutoMigrate(&User{}, &Post{})

	// 创建用户
	user := User{Name: "Alice", Email: "alice@example.com"}
	db.Create(&user)
	fmt.Printf("创建用户: %d\\n", user.ID)

	// 查询用户（含文章）
	var userWithPosts User
	db.Preload("Posts").First(&userWithPosts, user.ID)
	fmt.Printf("用户: %s, 文章数: %d\\n", userWithPosts.Name, len(userWithPosts.Posts))
}`,
        confidence: 0.85
      }
    }
  },

  // Rust 模板
  rust: {
    algorithm: {
      'quick-sort': {
        name: '快速排序',
        description: '快速排序算法（Rust版）',
        code: `// 快速排序算法
// 时间复杂度: 平均 O(n log n), 最坏 O(n²)
// 空间复杂度: O(log n)

fn partition<T: PartialOrd + Clone>(arr: &mut [T], low: usize, high: usize) -> usize {
    let pivot = arr[high].clone();
    let mut i = low.saturating_sub(1);

    for j in low..high {
        if arr[j] <= pivot {
            i += 1;
            arr.swap(i, j);
        }
    }

    arr.swap(i + 1, high);
    i + 1
}

fn quick_sort<T: PartialOrd + Clone>(arr: &mut [T], low: isize, high: isize) {
    if low < high {
        let pivot_index = partition(arr, low as usize, high as usize);
        let pivot_index = pivot_index as isize;

        quick_sort(arr, low, pivot_index - 1);
        quick_sort(arr, pivot_index + 1, high);
    }
}

fn main() {
    let mut arr = vec![64, 34, 25, 12, 22, 11, 90];
    println!("原数组: {:?}", arr);

    quick_sort(&mut arr, 0, (arr.len() - 1) as isize);
    println!("排序后: {:?}", arr);
}`,
        confidence: 0.95
      },
      'binary-search': {
        name: '二分查找',
        description: '二分查找算法（Rust版）',
        code: `// 二分查找算法
// 时间复杂度: O(log n)

fn binary_search<T: PartialOrd>(arr: &[T], target: &T) -> Option<usize> {
    let mut left = 0;
    let mut right = arr.len();

    while left < right {
        let mid = left + (right - left) / 2;

        if arr[mid] == *target {
            return Some(mid);
        } else if arr[mid] < *target {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    None
}

fn main() {
    let sorted_arr = vec![11, 12, 22, 25, 34, 64, 90];
    let target = 25;

    match binary_search(&sorted_arr, &target) {
        Some(index) => println!("目标 {} 的索引: {}", target, index),
        None => println!("未找到目标 {}", target),
    }
}`,
        confidence: 0.95
      }
    },
    structure: {
      'class-template': {
        name: '结构体模板',
        description: 'Rust 标准结构体模板',
        code: `// [类名] - [描述]
use std::sync::{Arc, RwLock};

/// 默认配置
#[derive(Debug, Clone)]
pub struct Options {
    pub option1: String,
    pub option2: i32,
}

impl Default for Options {
    fn default() -> Self {
        Self {
            option1: "default".to_string(),
            option2: 0,
        }
    }
}

/// 主结构体
pub struct Service {
    options: Options,
    initialized: Arc<RwLock<bool>>,
}

impl Service {
    /// 创建新实例
    pub fn new(options: impl Into<Option<Options>>) -> Self {
        let options = options.into().unwrap_or_default();

        Self {
            options,
            initialized: Arc::new(RwLock::new(false)),
        }
    }

    /// 初始化
    pub fn init(&self) -> Result<(), String> {
        let mut initialized = self.initialized.write().map_err(|e| e.to_string())?;

        if *initialized {
            return Ok(());
        }

        // 初始化逻辑
        *initialized = true;
        Ok(())
    }

    /// 处理数据
    pub fn process<T: Clone>(&self, data: T) -> Result<T, String> {
        let initialized = self.initialized.read().map_err(|e| e.to_string())?;

        if !*initialized {
            return Err("Service not initialized".to_string());
        }

        Ok(data)
    }

    /// 关闭服务
    pub fn close(&self) {
        if let Ok(mut initialized) = self.initialized.write() {
            *initialized = false;
        }
    }
}

fn main() {
    let service = Service::new(None);

    if let Err(e) = service.init() {
        eprintln!("初始化失败: {}", e);
        return;
    }

    match service.process("test data") {
        Ok(result) => println!("结果: {:?}", result),
        Err(e) => eprintln!("处理失败: {}", e),
    }

    service.close();
}`,
        confidence: 0.9
      }
    },
    network: {
      'http-server': {
        name: 'HTTP 服务器',
        description: 'Actix-web HTTP 服务器',
        code: `// HTTP 服务器 - Actix-web 框架
use actix_web::{web, App, HttpServer, HttpResponse, HttpRequest, middleware};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// 健康检查响应
#[derive(Serialize)]
struct HealthResponse {
    status: String,
    timestamp: i64,
}

/// 健康检查端点
async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(HealthResponse {
        status: "ok".to_string(),
        timestamp: chrono::Utc::now().timestamp(),
    })
}

/// 获取项目端点
async fn get_item(path: web::Path<i32>) -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "id": path.into_inner(),
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("服务器启动在 http://127.0.0.1:8080");

    HttpServer::new(|| {
        App::new()
            // CORS 中间件
            .wrap(middleware::Logger::default())
            .wrap(
                middleware::DefaultHeaders::new()
                    .add(("Access-Control-Allow-Origin", "*"))
                    .add(("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"))
                    .add(("Access-Control-Allow-Headers", "Content-Type"))
            )
            // 路由
            .route("/api/health", web::get().to(health_check))
            .route("/api/items/{id}", web::get().to(get_item))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}`,
        confidence: 0.9
      }
    },
    io: {
      'file-operations': {
        name: '文件操作',
        description: 'Rust 文件操作',
        code: `// 文件操作工具
use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::Path;

/// 读取文件
fn read_file(path: &Path) -> io::Result<String> {
    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

/// 写入文件
fn write_file(path: &Path, contents: &str) -> io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    let mut file = File::create(path)?;
    file.write_all(contents.as_bytes())?;
    Ok(())
}

/// 追加内容到文件
fn append_file(path: &Path, contents: &str) -> io::Result<()> {
    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)?;
    file.write_all(contents.as_bytes())?;
    Ok(())
}

/// 检查文件是否存在
fn file_exists(path: &Path) -> bool {
    path.exists()
}

/// 删除文件
fn delete_file(path: &Path) -> io::Result<()> {
    fs::remove_file(path)
}

/// 复制文件
fn copy_file(src: &Path, dst: &Path) -> io::Result<()> {
    if let Some(parent) = dst.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::copy(src, dst)?;
    Ok(())
}

fn main() {
    let test_path = Path::new("test.txt");

    // 示例
    match write_file(test_path, "Hello, World!") {
        Ok(_) => println!("写入成功"),
        Err(e) => eprintln!("写入失败: {}", e),
    }

    match read_file(test_path) {
        Ok(content) => println!("文件内容: {}", content),
        Err(e) => eprintln!("读取失败: {}", e),
    }

    let _ = delete_file(test_path);
}`,
        confidence: 0.9
      }
    },
    cli: {
      'clap-cli': {
        name: 'CLI 工具',
        description: '基于 clap 的命令行工具',
        code: `// 命令行工具（使用 clap 4.x）
// 功能：支持 init/build/deploy 三个子命令
//
// 依赖（Cargo.toml）:
// [dependencies]
// clap = { version = "4", features = ["derive"] }

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "myapp")]
#[command(about = "一个强大的 CLI 工具", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// 初始化项目
    Init {
        /// 项目名称
        name: String,

        /// 项目路径
        #[arg(short, long, default_value = ".")]
        path: String,
    },
    /// 构建项目
    Build {
        /// 发布模式
        #[arg(short, long)]
        release: bool,
    },
    /// 部署到环境
    Deploy {
        /// 目标环境
        #[arg(short, long)]
        env: String,
    },
}

fn cmd_init(name: &str, path: &str) {
    println!("初始化项目: {} 在路径: {}", name, path);
}

fn cmd_build(release: bool) {
    if release {
        println!("发布模式构建...");
    } else {
        println!("调试模式构建...");
    }
}

fn cmd_deploy(env: &str) {
    println!("部署到 {} 环境...", env);
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Commands::Init { name, path } => cmd_init(name, path),
        Commands::Build { release } => cmd_build(*release),
        Commands::Deploy { env } => cmd_deploy(env),
    }
}`,
        confidence: 0.9
      }
    },
    database: {
      'diesel-model': {
        name: '数据库模型',
        description: 'Diesel ORM 数据模型',
        code: `// Diesel ORM 数据模型
//
// 依赖（Cargo.toml）:
// [dependencies]
// diesel = { version = "2", features = ["postgres", "r2d2"] }
// dotenvy = "0.15"
//
// 使用 diesel CLI 初始化:
// diesel setup
// diesel migration generate create_users
// diesel migration run

use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

// 表名: users
#[derive(Debug, Clone, Serialize, Deserialize, Queryable, Selectable)]
#[diesel(table_name = crate::schema::users)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct User {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

// 创建用户 DTO
#[derive(Debug, Insertable)]
#[diesel(table_name = crate::schema::users)]
pub struct NewUser {
    pub name: String,
    pub email: String,
}

impl User {
    /// 创建新用户
    pub fn create(conn: &mut PgConnection, new_user: &NewUser) -> QueryResult<User> {
        diesel::insert_into(crate::schema::users::table)
            .values(new_user)
            .get_result(conn)
    }

    /// 获取所有用户
    pub fn get_all(conn: &mut PgConnection) -> QueryResult<Vec<User>> {
        crate::schema::users::table
            .order(crate::schema::users::id.desc())
            .load::<User>(conn)
    }

    /// 根据 ID 获取用户
    pub fn get_by_id(conn: &mut PgConnection, user_id: i32) -> QueryResult<User> {
        crate::schema::users::table
            .find(user_id)
            .get_result::<User>(conn)
    }

    /// 更新用户名
    pub fn update_name(conn: &mut PgConnection, user_id: i32, new_name: &str) -> QueryResult<User> {
        diesel::update(crate::schema::users::table.find(user_id))
            .set(crate::schema::users::name.eq(new_name))
            .get_result(conn)
    }

    /// 删除用户
    pub fn delete(conn: &mut PgConnection, user_id: i32) -> QueryResult<usize> {
        diesel::delete(crate::schema::users::table.find(user_id))
            .execute(conn)
    }
}

// 连接池管理
use diesel::r2d2::{self, ConnectionManager};

pub type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

pub fn create_pool(database_url: &str) -> DbPool {
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    r2d2::Pool::builder()
        .build(manager)
        .expect("无法创建数据库连接池")
}`,
        confidence: 0.9
      }
    }
  }
};

// ============================================================
// 语言检测模式
// ============================================================

const LANGUAGE_PATTERNS = {
  javascript: {
    keywords: ['javascript', 'js', 'node', 'nodejs', 'react', 'vue', 'angular'],
    extensions: ['.js', '.mjs', '.cjs'],
    patterns: ['function\\s+\\w+', 'const\\s+\\w+\\s*=', 'let\\s+\\w+\\s*=', 'require\\(', '=>']
  },
  typescript: {
    keywords: ['typescript', 'ts', 'tsconfig', '@types'],
    extensions: ['.ts', '.tsx'],
    patterns: ['interface\\s+\\w+', 'type\\s+\\w+\\s*=', ':\\s*(string|number|boolean|any)', 'export\\s+(class|interface|type)']
  },
  python: {
    keywords: ['python', 'py', 'pip', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
    extensions: ['.py', '.pyw'],
    patterns: ['def\\s+\\w+', 'import\\s+\\w+', 'class\\s+\\w+.*:', 'if\\s+__name__', 'print\\s*\\(']
  },
  bash: {
    keywords: ['bash', 'shell', 'sh', 'zsh', 'script'],
    extensions: ['.sh', '.bash'],
    patterns: ['#!/bin/bash', '#!/bin/sh', '\\$\\(', 'function\\s+\\w+\\s*\\(\\)', '\\$\\{?\\w+\\}?']
  },
  go: {
    keywords: ['golang', 'go', 'gin', 'goroutine'],
    extensions: ['.go'],
    patterns: ['package\\s+\\w+', 'func\\s+\\w+', 'import\\s*\\(', 'go\\s+\\w+', ':=']
  },
  rust: {
    keywords: ['rust', 'cargo', 'rustc', 'wasm'],
    extensions: ['.rs'],
    patterns: ['fn\\s+\\w+', 'let\\s+mut', 'impl\\s+\\w+', 'pub\\s+(fn|struct|enum)', 'use\\s+\\w+']
  }
};

const INTENT_PATTERNS = {
  algorithm: ['排序', '查找', '搜索', 'sort', 'search', 'binary', 'quick', 'merge', 'bfs', 'dfs'],
  structure: ['类', '结构', '链表', '树', 'class', 'struct', 'list', 'tree', 'linked', 'array'],
  network: ['服务器', 'http', 'api', '请求', 'server', 'request', 'fetch', 'rest', 'endpoint'],
  io: ['文件', '读写', 'io', 'file', 'read', 'write', 'stream', 'buffer'],
  cli: ['命令行', 'cli', '命令', 'script', 'tool']
};

// ============================================================
// 提示词工厂类
// ============================================================

class PromptFactory {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {Object} options.hf - 心虫引擎引用
   */
  constructor({ hf } = {}) {
    this.hf = hf;
  }

  /**
   * 构建 LLM 提示词
   * @param {string} task - 任务描述
   * @param {string} language - 目标语言
   * @param {Object} intent - 意图信息
   * @returns {string} 提示词字符串
   */
  buildPrompt(task, language, intent) {
    return `请为以下任务生成 ${language} 代码：

任务描述: ${task}
目标语言: ${language}
代码类型: ${intent.type || '通用'}

要求：
1. 生成完整可运行的代码
2. 添加必要的注释说明
3. 遵循 ${language} 最佳实践
4. 如果有多种实现方式，提供最优方案

请直接输出代码，不需要额外的解释。`;
  }
}

// ============================================================
// 导出
// ============================================================

module.exports = { PromptFactory, TEMPLATES, LANGUAGE_PATTERNS, INTENT_PATTERNS };
