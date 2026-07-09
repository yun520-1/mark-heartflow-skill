# 心虫 cron 配置记录（2026-06-05 更新）

## 当前 cron 架构（2层分离）

```
升级 cron (2h)  ──→ 找薄弱模块 → 升级 → 微信通知
   │                    ↑
   └── 带 web-search-plus skill ─┘ (可搜索最新代码模式)

审计 cron (12h) ──→ 6维度全库审计 → 存本地(local)
                      (只有发现问题才输出报告)
```

## Cron 1: 心虫硬核代码升级

| 参数 | 值 |
|------|-----|
| job_id | `34c15eb4730b` |
| model | deepseek-v4-flash |
| provider | custom |
| base_url | `https://by.53hk.cn/v1` |
| schedule | **every 2h** |
| workdir | `~/.hermes/skills/heartflow` |
| toolsets | `["terminal","file","skills","web"]` |
| skills | `["web-search-plus"]` |
| deliver | weixin |

**升级规则**：必须用 CodeEngine 自审 → 找 1500-5000B 最小模块 → 升级（≥50行新逻辑）→ 版本号 +0.0.1

## Cron 2: 心虫代码审计

| 参数 | 值 |
|------|-----|
| job_id | `8ab98fa62748` |
| model | deepseek-v4-flash |
| provider | custom:https://by.53hk.cn/v1 |
| schedule | **every 12h** |
| workdir | `~/.hermes/skills/heartflow` |
| toolsets | `["terminal","file","skills"]` |
| deliver | local（存本地，不推微信） |

**审计规则**：调用 self-audit.js 的 6维度全库审计 → 只有 CRITICAL/HIGH 才输出详细报告 → 健康状态不超过3行

## 当前模型/endpoint 配置（2026-06-05 有效）

- **model**: `deepseek-v4-flash`
- **provider**: `custom`
- **base_url**: `https://by.53hk.cn/v1`
- 旧模型名 (MiniMax-M2.7, MiniMax-M2.7-highspeed) 和旧 endpoint (copilot.tencent.com, url.53hk.cn, ai.53hk.cn) 已不再使用

## 注意事项
- 创建 cron 后用户可能纠正模型——确认后再创建
- cron 的 base_url 和主配置可能不同，需要单独设置
- 审计 cron 用 `local` 交付，不推微信——避免每12小时微信消息轰炸
- 升级 cron 带 `web` 工具集 + `web-search-plus` skill，可以在升级时搜索最新代码模式
