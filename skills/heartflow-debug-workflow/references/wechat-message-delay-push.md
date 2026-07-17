# 微信消息延迟推送问题

## 场景

Hermes 的 `send_message` 调用成功（state.db 记录确认），但用户可能在 **数小时甚至一天后** 才收到消息。用户会以为"又收到了新消息"或"信息乱发"。

## 根因

微信公众平台（或企业微信）的消息推送存在队列延迟。消息在 Hermes 侧已标记为 `sent`，但在微信端可能因排队/限流/审核被延迟推送。这不是 Hermes 或 Gateway 的 bug。

## 排查步骤

1. **查 state.db 确认消息是否真的刚发出**：
   ```sql
   SELECT m.rowid, m.role, substr(m.content,1,200), s.source
   FROM messages m JOIN sessions s ON m.session_id = s.id
   WHERE m.content LIKE '%🌸%' OR m.content LIKE '%MEDIA%'
   ORDER BY m.rowid DESC LIMIT 10;
   ```
   如果最近1000条中没有新消息，说明是微信端延迟推送。

2. **查 cron jobs**：
   ```
   cronjob action=list
   ```
   确认没有意外触发生图或消息发送的 cron job。

3. **查 send_message 历史**：
   ```sql
   SELECT m.rowid, m.role, m.content, s.source, s.started_at
   FROM messages m JOIN sessions s ON m.session_id = s.id
   WHERE m.content LIKE '%send_message%' OR m.tool_name = 'send_message'
   ORDER BY m.rowid DESC LIMIT 20;
   ```

## 典型案例

- 2026-06-05 19:27：心虫调用 `send_message` 发送"🌸 春日仙气处女图 x5"到微信
- 2026-06-06 12:00+：用户报告"刚刚又收到图片"
- state.db 确认：最近1000条中无新的生图相关 send_message 调用
- 结论：微信消息延迟推送了约 16 小时

## 向用户解释的话术

> "查遍了所有日志，那条消息是昨天[时间]心虫用 send_message 发到微信的。最近1000条消息中没有新的发送记录。应该是微信消息队列延迟推送了昨天的消息。不是定时任务，不是后台进程，也不是自动触发。"

## 预防措施

- 不要在用户可能睡觉的时间段 send_message 图片（避免延迟推送导致用户困惑）
- 图片类 send_message 尽量在对话中同步发送，不要通过 cron 或后台
- 如果用户报告"信息乱发"，先查 state.db 确认消息是否真的刚发出
