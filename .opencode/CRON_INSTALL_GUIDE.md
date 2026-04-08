# HeartFlow 定时任务安装指南

## 自动安装

```bash
bash setup-cron.sh
```

## 手动安装

### 1. 编辑 crontab

```bash
crontab -e
```

### 2. 添加以下行

```bash
# HeartFlow 每 30 分钟自动运行
*/30 * * * * cd ~/.jvs/.openclaw/workspace/mark-heartflow-skill && node .opencode/auto-runner.js >> .opencode/auto-runner.log 2>&1
```

### 3. 验证

```bash
crontab -l | grep heartflow
```

## 测试运行

```bash
node auto-runner.js
```

---

*HeartFlow v2.0*
