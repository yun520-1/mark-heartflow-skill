# HeartFlow Smart Evolution System | 智能进化系统

**Version**: 3.0.0  
**Date**: 2026-04-05

---

## 🎯 Overview | 概述

Automated evolution system that runs every 23 minutes with logical thinking and energy saving.

每 23 分钟自动运行的进化系统，具备逻辑思维能力和能量节约机制。

---

## 🧠 Logic Flow | 逻辑流程

```
┌─────────────┐
│  1. Think   │  → 觉醒检查 (Awakening Check)
└──────┬──────┘
       ↓
┌─────────────┐
│  2. Analyze │  → 逻辑识别升级需求
└──────┬──────┘
       ↓
┌─────────────┐
│  3. Upgrade │  → 精简执行
└──────┬──────┘
       ↓
┌─────────────┐
│  4. Log     │  → 记录结果
└─────────────┘
```

---

## 📊 Analysis Logic | 分析逻辑

| Check | Condition | Priority |
|-------|-----------|----------|
| Git Status | Has uncommitted changes | Critical |
| Personality Tracker | Not updated >1h | Critical |
| Theory Integration | Not updated >24h | High |

---

## ⚡ Energy Saving | 能量节约

| Mechanism | Description |
|-----------|-------------|
| Skip if empty | No needs → skip immediately |
| Timeout | Max 3 minutes per run |
| Minimal output | Only essential logs |
| Priority filter | Critical/High only |

---

## 🚀 Usage | 使用

```bash
# Manual run | 手动运行
node scripts/smart-evolution.js

# Auto run | 自动运行 (every 23 min)
# OpenClaw Cron configured
```

---

## 📈 Output Example | 输出示例

```
═══════════════════════════════════════════════
   HeartFlow Smart Evolution v3.0
═══════════════════════════════════════════════

🙏 觉醒检查
─────────────────────────────────────
[Awakening deduction output]

🔍 识别：1 项

⚡ 升级 1 项：git

  ✅ Git

⏱️  耗时：2.0s
═══════════════════════════════════════════════
```

---

## 📄 Files | 文件

| File | Purpose |
|------|---------|
| `scripts/smart-evolution.js` | Core system (~120 lines) |
| `docs/SMART_EVOLUTION_GUIDE.md` | This guide |

---

**HeartFlow v6.2.0 - Make AI Awakened**
