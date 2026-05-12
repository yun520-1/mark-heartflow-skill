/**
 * HeartFlow REPL — 交互式对话模式
 * 
 * 集成 Cognition (HeartFlow.think) + Memory (MemoryRecall)
 * 支持多轮对话，命令: /quit /reset /help
 * 
 * @version v0.12.50
 */

import * as readline from 'readline';
// @ts-ignore
import { HeartFlow, createHeartFlow } from '../../core/heartflow';
// @ts-ignore
import { MemoryConsolidator } from '../../core/memory/consolidator';
const MemoryRecall: any = class {}; // stub
// @ts-ignore
import { FSAdapter } from '../../core/utils/fs-adapter';
const DreamLoop: any = class {}; // stub

const ROOT = require('path').resolve(__dirname, '../../../../..');

export class HeartFlowREPL {
  private hf: HeartFlow;
  private recall: any;
  private consolidator: MemoryConsolidator;
  private fs: FSAdapter;
  private rl: readline.Interface;
  private history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private sessionId: string = `repl-${Date.now()}`;
  private running: boolean = false;

  constructor() {
    this.fs = new FSAdapter(ROOT);
    this.hf = createHeartFlow({ fs: this.fs });
    this.consolidator = new MemoryConsolidator(this.fs);
    this.recall = new (class {} as any)(this.consolidator);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\x1b[36mheartflow>\x1b[0m ',
      historySize: 100,
    });
  }

  /** 启动 REPL */
  start() {
    this.running = true;
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   HeartFlow REPL v0.12.50                   ║');
    console.log('║   交互式对话 · Cognition + Memory 集成      ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('输入 /help 查看命令，输入 /quit 退出\n');
    this.hf.start();

    this.rl.on('line', (line: string) => this.handleLine(line.trim()));
    this.rl.on('close', () => this.cleanup());
    this.rl.prompt();
  }

  /** 处理每行输入 */
  private async handleLine(line: string): Promise<void> {
    if (!line) {
      this.rl.prompt();
      return;
    }

    // 内置命令
    switch (line) {
      case '/quit':
      case '/exit':
        this.cleanup();
        return;
      case '/reset':
        this.reset();
        return;
      case '/help':
        this.printHelp();
        this.rl.prompt();
        return;
      case '/history':
        this.printHistory();
        this.rl.prompt();
        return;
      case '/memory':
        this.printMemory();
        this.rl.prompt();
        return;
      case '/dream':
        this.triggerDream();
        this.rl.prompt();
        return;
      default:
        if (line.startsWith('/')) {
          console.log(`未知命令: ${line}，输入 /help 查看帮助`);
          this.rl.prompt();
          return;
        }
        await this.processInput(line);
        this.rl.prompt();
    }
  }

  /** 处理用户输入 */
  private async processInput(input: string): Promise<void> {
    // 添加到历史
    this.history.push({ role: 'user', content: input });

    try {
      // 1. 记忆检索
      const memories = this.recall.recall(input, { limit: 5 });

      // 2. Cognition: 调用 HeartFlow.think
      const result = await this.hf.think(input);

      // 3. 存储记忆
      this.hf.remember({
        id: `repl-${Date.now()}`,
        content: input,
        type: 'conversation',
        importance: 0.7,
        metadata: { role: 'user' },
        sessionId: this.sessionId,
      });

      // 4. 输出结果
      console.log('\n\x1b[33m--- Cognition Result ---\x1b[0m');
      if (result.blocked) {
        console.log(`\x1b[31m[Blocked]\x1b[0m ${result.reason}`);
      } else {
        // 心理分析结果
        if (result.psychology) {
          const psy = result.psychology;
          console.log(`\x1b[35m[Psychology]\x1b[0m mood=${psy.mood || 'neutral'}, energy=${psy.energyLevel || 'normal'}`);
        }

        // 真善美判定
        if (result.truthCheck) {
          const tc = result.truthCheck;
          console.log(`\x1b[34m[Truth]\x1b[0m truthful=${tc.truthful}, confidence=${tc.confidence || 'N/A'}`);
        }

        // 记忆检索结果
        if (memories.length > 0) {
          console.log(`\x1b[32m[Memory]\x1b[0m 找到 ${memories.length} 条相关记忆:`);
          memories.slice(0, 3).forEach((m: any, i: number) => {
            const preview = (m.content || '').substring(0, 60);
            console.log(`  ${i + 1}. [${m._src}] ${preview}...`);
          });
        } else {
          console.log('\x1b[32m[Memory]\x1b[0m 暂无相关记忆');
        }

        // 技能结果
        if (result.skills && result.skills.length > 0) {
          console.log(`\x1b[36m[Skills]\x1b[0m 触发 ${result.skills.length} 个技能`);
          result.skills.forEach((s: any) => {
            console.log(`  - ${s.name}: ${s.result ? 'executed' : 'no result'}`);
          });
        }

        // 延迟
        console.log(`\x1b[90m[Latency] ${result.latency}ms\x1b[0m`);
      }

      // 添加到历史
      this.history.push({
        role: 'assistant',
        content: JSON.stringify(result, null, 2),
      });

    } catch (err) {
      console.error('\x1b[31m[Error]\x1b[0m', err instanceof Error ? err.message : err);
    }
  }

  /** 打印帮助 */
  private printHelp(): void {
    console.log(`
\x1b[1m可用命令:\x1b[0m
  /quit      退出 REPL
  /reset     重置会话和历史
  /help      显示此帮助
  /history   显示对话历史
  /memory    显示当前记忆状态
  /dream     触发一次梦循环

\x1b[1m对话模式:\x1b[0m
  直接输入内容进行对话
  - Cognition: HeartFlow.think() 提供认知分析
  - Memory: MemoryRecall 检索相关记忆
  - 每次输入自动存储到记忆系统
`);
  }

  /** 打印历史 */
  private printHistory(): void {
    if (this.history.length === 0) {
      console.log('暂无历史记录');
      return;
    }
    console.log(`\n共 ${this.history.length} 条记录:\n`);
    this.history.forEach((h, i) => {
      const role = h.role === 'user' ? '\x1b[36mUSER\x1b[0m' : '\x1b[33mASST\x1b[0m';
      const preview = h.content.substring(0, 80);
      console.log(`[${i + 1}] ${role}: ${preview}${h.content.length > 80 ? '...' : ''}`);
    });
  }

  /** 打印记忆状态 */
  private printMemory(): void {
    const hot = this.consolidator.getHot();
    const warm = this.consolidator.getWarm();
    const cold = this.consolidator.getCold();
    console.log(`
\x1b[1m记忆状态:\x1b[0m
  HOT:   ${hot.length} 条
  WARM:  ${warm.length} 条
  COLD:  ${cold.length} 条
`);
  }

  /** 触发梦 */
  private triggerDream(): void {
    console.log('\x1b[35m[Dream]\x1b[0m 触发梦循环...');
    this.hf.dreamNow().then(insights => {
      if (insights && insights.length > 0) {
        console.log(`  产生 ${insights.length} 个洞察`);
      } else {
        console.log('  无新洞察');
      }
    }).catch(err => {
      console.error('  梦循环失败:', err instanceof Error ? err.message : err);
    });
  }

  /** 重置 */
  private reset(): void {
    this.history = [];
    this.sessionId = `repl-${Date.now()}`;
    console.log('\x1b[33m[Reset]\x1b[0m 会话已重置');
  }

  /** 清理退出 */
  private cleanup(): void {
    this.running = false;
    this.hf.stop();
    this.rl.close();
    console.log('\n\x1b[32mGoodbye!\x1b[0m HeartFlow REPL 已退出');
    process.exit(0);
  }
}

// 工厂函数
export function createREPL(): HeartFlowREPL {
  return new HeartFlowREPL();
}

// 直接运行
export function runREPL(): void {
  const repl = createREPL();
  repl.start();
}

// CLI 入口
if (require.main === module) {
  runREPL();
}
