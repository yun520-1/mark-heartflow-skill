/**
 * status.ts — HeartFlow 状态查询命令
 * @version v0.12.50
 *
 * 用法:
 *   heartflow status           # 显示完整状态面板
 *   heartflow status --watch   # 实时监控模式（3秒刷新）
 *   heartflow status --json    # JSON 格式输出
 *   heartflow status --engine  # 只显示引擎状态
 *   heartflow status --system  # 只显示系统信息
 *
 * 依赖 engines.ts 的采集器和渲染器
 */
export interface StatusOptions {
    watch?: boolean;
    json?: boolean;
    engineOnly?: boolean;
    systemOnly?: boolean;
    intervalMs?: number;
}
export declare function runStatus(opts?: StatusOptions): Promise<void>;
//# sourceMappingURL=status.d.ts.map