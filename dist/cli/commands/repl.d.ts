/**
 * HeartFlow REPL — 交互式对话模式
 *
 * 集成 Cognition (HeartFlow.think) + Memory (MemoryRecall)
 * 支持多轮对话，命令: /quit /reset /help
 *
 * @version v0.12.50
 */
export declare class HeartFlowREPL {
    private hf;
    private recall;
    private consolidator;
    private fs;
    private rl;
    private history;
    private sessionId;
    private running;
    constructor();
    /** 启动 REPL */
    start(): void;
    /** 处理每行输入 */
    private handleLine;
    /** 处理用户输入 */
    private processInput;
    /** 打印帮助 */
    private printHelp;
    /** 打印历史 */
    private printHistory;
    /** 打印记忆状态 */
    private printMemory;
    /** 触发梦 */
    private triggerDream;
    /** 重置 */
    private reset;
    /** 清理退出 */
    private cleanup;
}
export declare function createREPL(): HeartFlowREPL;
export declare function runREPL(): void;
//# sourceMappingURL=repl.d.ts.map