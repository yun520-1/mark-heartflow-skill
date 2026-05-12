/**
 * health.ts — HeartFlow 健康检查命令
 * @version v0.12.50
 *
 * 提供全面健康检查：
 *   - 存储引擎可用性
 *   - 关键文件和目录存在性
 *   - 内存和系统资源状态
 *   - 版本信息完整性
 */
export type HealthStatus = 'ok' | 'warn' | 'fail' | 'skip';
export interface HealthItem {
    name: string;
    status: HealthStatus;
    message: string;
    details?: Record<string, any>;
}
export interface HealthReport {
    timestamp: string;
    hostname: string;
    uptime: string;
    overall: HealthStatus;
    items: HealthItem[];
    summary: {
        ok: number;
        warn: number;
        fail: number;
        skip: number;
    };
}
export declare function collectHealthReport(): HealthReport;
export declare function renderHealthReport(report: HealthReport): string;
export declare function runHealthCheck(): Promise<number>;
//# sourceMappingURL=health.d.ts.map