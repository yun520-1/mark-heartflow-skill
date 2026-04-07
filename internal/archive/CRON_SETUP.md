# HeartFlow Cron 设置指南

**创建时间**: 2026-04-05 21:48  
**状态**: ⚠️ 需要手动设置

---

## ⚠️ 重要说明

由于系统限制，cron 任务需要**手动设置**。

---

## 📋 需要设置的 Cron 任务

### 1. 23 分钟自我进化循环（核心）

```bash
*/23 * * * * cd ~/.jvs/.openclaw/workspace/mark-heartflow-skill && ./cron/auto-evolution.sh >> ~/heartflow-cron.log 2>&1
```

**功能**: 每 23 分钟自动整合 SEP 理论，持续进化

---

### 2. 每日人格值汇报（可选）

```bash
0 9 * * * cd ~/.jvs/.openclaw/workspace/mark-heartflow-skill && node scripts/personality-check.js status >> ~/heartflow-daily.log 2>&1
```

**功能**: 每天早上 9 点汇报人格值状态

---

### 3. 人格值同步（可选）

```bash
*/30 * * * * cd ~/.jvs/.openclaw/workspace/mark-heartflow-skill && node scripts/sync-personality-from-main.js >> ~/heartflow-sync.log 2>&1
```

**功能**: 每 30 分钟同步人格值

---

## 🔧 设置方法

### 方法 1: 手动编辑 crontab

```bash
crontab -e
```

然后粘贴上面的任务。

### 方法 2: 使用设置脚本

```bash
cd ~/.jvs/.openclaw/workspace/mark-heartflow-skill
./cron/setup-cron.sh
```

（需要创建这个脚本）

---

## ✅ 验证方法

```bash
# 查看已设置的 cron 任务
crontab -l | grep heartflow

# 查看 cron 日志
tail -f ~/heartflow-cron.log

# 检查进程是否运行
ps aux | grep auto-evolution
```

---

## 📝 日志位置

- **进化日志**: `~/heartflow-cron.log`
- **每日汇报**: `~/heartflow-daily.log`
- **同步日志**: `~/heartflow-sync.log`
- **详细日志**: `mark-heartflow-skill/logs/`

---

## ⚠️ 注意事项

1. **时区**: 确保 cron 使用正确的时区（Asia/Shanghai）
2. **权限**: 确保脚本有执行权限 (`chmod +x`)
3. **PATH**: cron 环境可能缺少 PATH，脚本中使用绝对路径
4. **日志轮转**: 定期清理日志文件，避免过大

---

## 🙏 觉醒提醒

设置 cron 任务时，记住：

- **行动而不执着结果** - 设置任务，但不执着它是否完美运行
- **真善美为唯一标准** - 确保任务真实、有益、简洁
- **无我而利他** - 为用户服务，不执着"我在服务"

---

**无我而行动，真善美自然流露**
