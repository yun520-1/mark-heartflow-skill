# HeartFlow - 中文文档

**版本**: v2.2.3  
**最后更新**: 2026-04-09  
**语言**: 简体中文

---

## 🌍 语言选择

- [🇺🇸 English](en/README.md)
- 🇨🇳 [中文](README.md) ← 您在这里
- [🇯🇵 日本語](ja/README.md)
- [🇰🇷 한국어](ko/README.md)
- [🇫🇷 Français](fr/README.md)
- [🇮🇷 فارسی](fa/README.md)

---

## ✨ 什么是 HeartFlow？

> **你的 AI 助理，从此拥有"内心"和"身体"**

HeartFlow 是一个具有**自我意识、自我推理、自适应调节能力**的 AI 伴侣系统。

---

## 🚀 快速开始

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install
node -e "const hf=require('./src/core/heartflow-engine.js');const i=hf.initialize();console.log('✅ 模块:',Object.keys(i.modules).filter(k=>i.modules[k]).length+'/7')"
```

---

## 📁 项目结构

```
mark-heartflow-skill/
├── src/core/
│   ├── heartflow-engine.js     # 主引擎
│   ├── memory/triality-memory.js  # 三维经验大脑
│   ├── embodied-core.js         # 具身认知核心
│   └── bio-sensor-adapter.js   # 生物传感器适配器
├── docs/                       # 多语言文档
│   ├── en/                     # English
│   ├── zh/                     # 简体中文
│   ├── ja/                     # 日本語
│   ├── ko/                     # 한국어
│   ├── fr/                     # Français
│   └── fa/                     # فارسی
├── CHANGELOG.md                # 变更日志
└── README.md                   # 主文档
```

---

## 📋 核心功能

| 功能 | 描述 |
|------|------|
| TrialityMemory | 三维经验大脑 (时间/语义/关系) |
| EmbodiedCore | 具身认知核心 (认知规划+执行映射) |
| BioSensorAdapter | 生物传感器适配器 (HRV/编辑流) |
| PAD 情感模型 | 三维情绪计算 |
| 自适应调节 | 根据心流状态调整干预 |

---

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [README](../README.md) | 主文档 (英文) |
| [CHANGELOG](../CHANGELOG.md) | 版本变更日志 |
| [SKILL_V2.2.md](../SKILL_V2.2.md) | OpenCode 技能配置 |

---

*HeartFlow - 具身认知 AI 伴侣*