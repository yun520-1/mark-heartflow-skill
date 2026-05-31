/**
 * 工具调度器 (Tool Dispatcher) v1.0.0
 *
 * 统一调度所有工具执行
 *
 * 功能：
 * 1. 意图识别 - 判断用户想要执行什么操作
 * 2. 工具选择 - 根据意图选择合适的工具
 * 3. 参数解析 - 解析用户输入为工具参数
 * 4. 执行路由 - 调用对应的工具执行
 */

const { ToolExecutor } = require('./tool-executor');
const { BashTool } = require('./tools/bash-tool');
const { FileTool } = require('./tools/file-tool');
const { SearchTool } = require('./tools/search-tool');
const { GitTool } = require('./tools/git-tool');
const { HttpTool } = require('./tools/http-tool');
const { ProcessTool } = require('./tools/process-tool');

class ToolDispatcher {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();

    // 初始化执行器
    this.executor = new ToolExecutor({
      rootPath: this.rootPath
    });

    // 注册工具
    this._registerTools();

    // 意图模式库
    this.intentPatterns = this._buildIntentPatterns();
  }

  /**
   * 注册所有工具
   */
  _registerTools() {
    this.executor.register('bash', new BashTool());
    this.executor.register('file', new FileTool());
    this.executor.register('search', new SearchTool());
    this.executor.register('git', new GitTool());
    this.executor.register('http', new HttpTool());
    this.executor.register('process', new ProcessTool());

    console.log('[ToolDispatcher] 工具注册完成: bash, file, search, git, http, process');
  }

  /**
   * 构建意图模式库
   */
  _buildIntentPatterns() {
    return [
      // Bash 命令模式
      {
        intent: 'bash',
        patterns: [
          /^(运行|执行|跑|launch)\s+(.+)/i,
          /^`(.+)`$/,
          /^bash:\s*(.+)/i,
          /^shell:\s*(.+)/i,
          /^(npm|npx|yarn|pnpm)\s+(.+)/i,
          /^(python|python3|node|ruby)\s+(.+)/i
        ],
        tool: 'bash',
        argExtractor: (match) => ({ command: match[2] || match[1] })
      },

      // 文件操作模式
      {
        intent: 'file.read',
        patterns: [
          /^读取\s+(.+)/i,
          /^读\s+(.+)/i,
          /^cat\s+(.+)/i,
          /^查看\s+(.+)/i,
          /^打开\s+(.+)/i
        ],
        tool: 'file',
        argExtractor: (match) => ({ action: 'read', path: match[1] })
      },
      {
        intent: 'file.write',
        patterns: [
          /^写入\s+(.+?)\s+内容[为:]?\s*([\s\S]+)/i,
          /^创建\s+(.+?)\s+内容[为:]?\s*([\s\S]+)/i,
          /^写\s+(.+?)\s+内容[为:]?\s*([\s\S]+)/i
        ],
        tool: 'file',
        argExtractor: (match) => ({ action: 'write', path: match[1], content: match[2] })
      },
      {
        intent: 'file.delete',
        patterns: [
          /^删除\s+(.+)/i,
          /^删掉\s+(.+)/i,
          /^rm\s+(.+)/i
        ],
        tool: 'file',
        argExtractor: (match) => ({ action: 'delete', path: match[1] })
      },
      {
        intent: 'file.list',
        patterns: [
          /^列出\s+(.+?)\s+目录/i,
          /^ls\s+(.+)/i,
          /^列出目录\s*(.*)/i
        ],
        tool: 'file',
        argExtractor: (match) => ({ action: 'list', path: match[1] || '.' })
      },

      // Git 操作模式
      {
        intent: 'git.status',
        patterns: [
          /^git\s+status/i,
          /^查看\s*git\s*状态/i
        ],
        tool: 'git',
        argExtractor: (match) => ({ action: 'status' })
      },
      {
        intent: 'git.commit',
        patterns: [
          /^git\s+commit\s+-m\s+(.+)/i,
          /^提交\s*(.+)/i
        ],
        tool: 'git',
        argExtractor: (match) => ({ action: 'commit', message: match[1] })
      },
      {
        intent: 'git.push',
        patterns: [
          /^git\s+push/i,
          /^推送\s*(.*)/i
        ],
        tool: 'git',
        argExtractor: (match) => ({ action: 'push' })
      },
      {
        intent: 'git.pull',
        patterns: [
          /^git\s+pull/i,
          /^拉取\s*(.*)/i
        ],
        tool: 'git',
        argExtractor: (match) => ({ action: 'pull' })
      },
      {
        intent: 'git.log',
        patterns: [
          /^git\s+log/i,
          /^查看\s*提交\s*历史/i
        ],
        tool: 'git',
        argExtractor: (match) => ({ action: 'log' })
      },

      // HTTP 请求模式
      {
        intent: 'http.get',
        patterns: [
          /^GET\s+(.+)/i,
          /^获取\s+(.+)/i
        ],
        tool: 'http',
        argExtractor: (match) => ({ method: 'GET', url: match[1] })
      },
      {
        intent: 'http.post',
        patterns: [
          /^POST\s+(.+?)\s+body[:\s]+([\s\S]+)/i,
          /^POST\s+(.+)/i
        ],
        tool: 'http',
        argExtractor: (match) => ({ method: 'POST', url: match[1], body: match[2] || '' })
      },

      // 搜索模式
      {
        intent: 'search.content',
        patterns: [
          /^搜索\s+(.+?)\s+在\s+(.+)/i,
          /^查找\s+(.+?)\s+在\s+(.+)/i,
          /^grep\s+(.+?)\s+(.+)/i
        ],
        tool: 'search',
        argExtractor: (match) => ({ type: 'content', query: match[1], path: match[2] })
      },
      {
        intent: 'search.filename',
        patterns: [
          /^搜索文件\s+(.+)/i,
          /^找文件\s+(.+)/i,
          /^find\s+(.+)/i
        ],
        tool: 'search',
        argExtractor: (match) => ({ type: 'filename', query: match[1] })
      }
    ];
  }

  /**
   * 解析用户输入，识别意图
   */
  parseIntent(input) {
    const trimmed = input.trim();

    for (const pattern of this.intentPatterns) {
      for (const regex of pattern.patterns) {
        const match = trimmed.match(regex);
        if (match) {
          return {
            intent: pattern.intent,
            tool: pattern.tool,
            args: pattern.argExtractor(match),
            confidence: 0.9
          };
        }
      }
    }

    // 默认尝试作为 bash 命令执行（危险 — 审计修复：默认 bash 绕过意图识别）
    // 已禁用。如需执行命令，请使用明确的工具前缀（如 "bash: xxx" 或 "shell: xxx"）
    return {
      intent: 'unknown',
      tool: null,
      args: {},
      confidence: 0
    };
  }

  /**
   * 直接执行工具（绕过意图识别）
   */
  async execute(toolName, args) {
    return await this.executor.execute(toolName, args);
  }

  /**
   * 处理用户输入
   */
  async handle(input) {
    // 1. 解析意图
    const { intent, tool, args, confidence } = this.parseIntent(input);

    console.log(`[ToolDispatcher] 意图: ${intent}, 置信度: ${confidence}`);

    // 2. 执行工具
    const result = await this.executor.execute(tool, args);

    // 3. 返回结果
    return {
      intent,
      tool,
      args,
      confidence,
      result
    };
  }

  /**
   * 获取工具列表
   */
  listTools() {
    return this.executor.listTools();
  }

  /**
   * 获取执行历史
   */
  getHistory(filter) {
    return this.executor.getHistory(filter);
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return {
      dispatcher: 'healthy',
      executor: this.executor.healthCheck()
    };
  }
}

module.exports = { ToolDispatcher };
