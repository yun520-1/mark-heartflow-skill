# v5.9.18 审计修复记录

来源：4份审计报告 + 1份全面审计报告，共5份。

## 修复清单（v5.9.17 → v5.9.18 → v5.10.0）

| # | 级别 | 问题 | 修复 | 报告 |
|---|------|------|------|------|
| 1 | P2 | getTopLessons崩溃 | LessonBank补getTopLessons委派getConfidenceWeighted | 全部 |
| 2 | P2 | 版本三源不一致 | VERSION/pkg/BUILD_DATE统一 | 全部 |
| 3 | P3 | 孤儿core/目录 | 删除 | 全部 |
| 4 | P3 | verify.js反向检查 | deps<1才报错 | bug+newuser |
| 5 | P3 | 硬编码路径公式测试 | 删除4个过时测试 | bug |
| 6 | P3 | JSON.parse无保护 | 会话历史解析加try/catch | bug |
| 7 | P3 | daemon.js缺pm2 | optionalDependencies加pm2 | bug |
| 8 | P3 | executable-reasoning死代码 | 删除 | 全面审计 |
| 9 | P3 | 默认LLM端点 | copilot.tencent.com→空，强制显式配置 | 全面审计 |
| 10 | P3 | 66处空catch | 批处理加注释标记 | 全面审计 |
| 11 | P3 | parseInt缺基数 | sed批量加基数10 | 全面审计 |

## 关键发现

- **子代理并发审计大型代码库会超时**：delegate_task逐文件读取导致600s超时
- **var→let批量替换危险**：作用域语义不同，导致heartflow.js启动失败
- **bridge模块引用清理**：17个已删模块需加stub兜底，目标0初始化失败
- **sync-version.js正则错误**：只匹配const VERSION但实际用let VERSION+VERSION文件读取
