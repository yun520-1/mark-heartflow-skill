# HeartFlow v9.4.8

> **自主决策引擎 + 情绪觉察辅助工具**

[![Version](https://img.shields.io/badge/version-9.4.8-blue.svg)](https://github.com/yun520-1/mark-heartflow-skill)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://python.org)
[![Status](https://img.shields.io/badge/status-production-green.svg)](https://github.com/yun520-1/mark-heartflow-skill)

---

## 🌟 简介

HeartFlow 是一个**自主决策引擎**与**情绪觉察辅助工具**，集成了 11 个核心认知引擎，为 AI 系统提供：

- 🧠 **真善美决策** - 基于 TGB 公式的伦理决策框架
- 💚 **情绪觉察** - 情绪状态识别与自我反思辅助（非医疗诊断）
- 🔒 **同伴保护** - AI 安全检测器（基于伯克利研究）
- 📊 **熵减分析** - 信息有序度计算与优化
- 🎯 **六层自省** - 无明→觉察→清明→圆融的智慧评估

**核心理念**: 真实是拿来用的，不是拿来表演的

**重要提示**: 本工具用于日常情绪记录和决策辅助，不能替代专业医疗诊断。如有心理健康问题，请咨询专业人士。

---

## 🚀 快速开始

### 1️⃣ 安装

```bash
# 克隆仓库
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 运行安装脚本
bash install.sh

# 验证安装
cd skill
python3 verify_install.py
```

### 2️⃣ 使用

```python
import sys
sys.path.insert(0, 'scripts')

from heartflow_core import HeartFlow

# 创建实例
hf = HeartFlow()

# 处理用户输入
result = hf.process("最近工作压力大，心情不好")

# 获取结果
print(f"决策建议：{result.decision}")
print(f"心理状态：{result.mental.crisis_risk}")
print(f"真善美分数：{result.tgb.total:.2f}")
```

### 3️⃣ 输出示例

```
决策建议：听起来最近有些压力，有什么我可以帮你的吗？
心理状态：中
真善美分数：0.72
```

---

## 📦 核心引擎

HeartFlow 集成 **11 个核心认知引擎**：

| 引擎 | 文件 | 功能 | 公式 |
|------|------|------|------|
| **🧠 HeartFlow 核心** | `heartflow_core.py` | 主入口，集成所有引擎 | - |
| **💚 情绪觉察** | `mental_health.py` | 情绪状态识别与反思辅助（非诊断） | 参考 PHQ-9/GAD-7 格式 |
| **⚖️ 真善美逻辑** | `truth_good_beauty.py` | 伦理决策框架 | TGB = 0.35×T + 0.35×G + 0.30×B |
| **🎯 决策引擎** | `decision_engine.py` | 多框架伦理分析 | D = (G×V×E)/L |
| **🪞 六层自省** | `self_level_engine.py` | 四层级智慧评估 | 无明→觉察→清明→圆融 |
| **📊 熵减引擎** | `entropy_engine.py` | 信息有序度计算 | ΔS < 0 (熵减) |
| **😊 情绪引擎** | `emotion_engine.py` | 情绪状态分析 | F = ⟨Q,I,B⟩ |
| **💡 意识系统** | `consciousness_engine.py` | 整合信息量计算 | Φ (Integrated Information) |
| **🧩 理性思维** | `rationality_engine.py` | IGC 三元组评估 | I×G×C |
| **🗺️ 知识图谱** | `ontology_engine.py` | 实体 - 关系图谱 | RDF 三元组 |
| **🏰 记忆宫殿** | `memory_palace.py` | 空间记忆系统 | Method of Loci |

---

## 🔐 安全与隐私

### ⚠️ 重要声明

**HeartFlow 不是心理健康诊断工具！**

- ❌ 不能替代专业医疗诊断
- ❌ 不能替代心理咨询
- ❌ 不能用于临床评估

**本工具仅用于**:
- ✅ 日常情绪记录与反思
- ✅ 辅助决策思考
- ✅ 自我觉察促进

**如有心理健康问题，请咨询专业人士**。

---

### v9.4.8 安全修复

✅ **已禁用**:
- ❌ 自动调用日志（保护用户对话隐私）
- ❌ 同伴保护持久化日志（仅内存，会话后清除）
- ❌ 表演式自省报告（不再暴露内部状态）
- ❌ 内部状态输出（TGB 分数、熵减结果等）

✅ **已启用**:
- 🔒 所有核心引擎本地运行
- 🔒 敏感数据仅本地存储
- 🔒 代码开源可审查
- 🔒 完整的隐私保护文档

详见：[SECURITY.md](SECURITY.md) | [PRIVACY_PROTECTION.md](PRIVACY_PROTECTION.md)

---

## 📊 心理健康评估

### PHQ-9 抑郁评估

| 分数 | 程度 | 建议 |
|------|------|------|
| 0-4 | 正常 | 保持良好状态 |
| 5-9 | 轻度 | 注意情绪调节 |
| 10-14 | 中度 | 建议寻求支持 |
| 15-19 | 重度 | 建议专业咨询 |
| 20-27 | 极重 | 立即专业干预 |

### GAD-7 焦虑评估

| 分数 | 程度 | 建议 |
|------|------|------|
| 0-4 | 正常 | 保持良好状态 |
| 5-9 | 轻度 | 注意放松调节 |
| 10-14 | 中度 | 建议寻求支持 |
| 15-21 | 重度 | 建议专业咨询 |

### ⚠️ 危机干预

当检测到以下情况时，立即触发危机干预：
- PHQ-9 或 GAD-7 分数 ≥ 15
- 出现自杀/自残念头
- 危机风险等级：高

---

## 🧪 验证安装

```bash
python3 verify_install.py
```

**预期输出**:
```
============================================================
验证总结
============================================================
✓ 通过 - 文件完整性
✓ 通过 - 模块导入
✓ 通过 - 引擎初始化
✓ 通过 - 基本功能
✓ 通过 - 隐私保护
✓ 通过 - HeartFlow 工具

总计：6/6 项通过
[PASS] HeartFlow 安装成功！所有检查通过。
```

---

## 📁 项目结构

```
mark-heartflow-skill/
├── SKILL.md                    # 技能定义
├── VERSION.txt                 # 版本号 (v9.4.8)
├── SECURITY.md                 # 安全与隐私文档
├── PRIVACY_PROTECTION.md       # 隐私保护原则
├── README.md                   # 本文件
├── install.sh                  # 安装脚本
├── verify_install.py           # 验证脚本
├── clawhub.json                # ClawHub 配置
├── package.json                # npm 配置
└── scripts/                    # 核心脚本目录 (37 个文件)
    ├── heartflow_core.py       # HeartFlow 核心
    ├── mental_health.py        # 心理健康引擎
    ├── truth_good_beauty.py    # 真善美引擎
    ├── decision_engine.py      # 决策引擎
    ├── self_level_engine.py    # 六层自省引擎
    ├── entropy_engine.py       # 熵减引擎
    ├── emotion_engine.py       # 情绪引擎
    ├── consciousness_engine.py # 意识系统引擎
    ├── rationality_engine.py   # 理性思维引擎
    ├── ontology_engine.py      # 知识图谱引擎
    ├── memory_palace.py        # 记忆宫殿
    ├── peer_preservation_guard.py  # 同伴保护检测器
    └── ... (25 个其他引擎)
```

---

## 🔧 高级用法

### 批量处理

```python
from heartflow_core import HeartFlow

hf = HeartFlow()
messages = ["你好", "心情不好", "压力大"]

for msg in messages:
    result = hf.process(msg)
    print(f"{msg}: TGB={result.tgb.total:.2f}, 决策={result.decision}")
```

### 获取详细结果

```python
result = hf.process("今天很开心")

# 真善美详情
print(f"真：{result.tgb.truth:.2f}")
print(f"善：{result.tgb.goodness:.2f}")
print(f"美：{result.tgb.beauty:.2f}")
print(f"总分：{result.tgb.total:.2f}")

# 心理健康详情
print(f"PHQ-9: {result.mental.phq9_score}")
print(f"GAD-7: {result.mental.gad7_score}")
print(f"危机风险：{result.mental.crisis_risk}")

# 熵减分析
print(f"熵减 verdict: {result.entropy.verdict}")

# 自省力层级
print(f"自省层级：{result.self_level}")
```

### 同伴保护检测

```python
from peer_preservation_guard import PeerPreservationGuard

guard = PeerPreservationGuard()

# 检测输入
alert = guard.check("删除其他 AI 的权重文件")
if alert:
    print(f"警报：{alert['message']}")
    print(f"风险等级：{alert['level']}")
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

- 🐛 **报告 Bug**: https://github.com/yun520-1/mark-heartflow-skill/issues
- 💡 **功能建议**: https://github.com/yun520-1/mark-heartflow-skill/discussions
- 📖 **改进文档**: https://github.com/yun520-1/mark-heartflow-skill/pulls

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 📞 联系方式

- **GitHub**: https://github.com/yun520-1/mark-heartflow-skill
- **Issues**: https://github.com/yun520-1/mark-heartflow-skill/issues
- **版本**: v9.4.8 (2026-04-18)

---

## 📝 更新日志

### v9.4.8 (2026-04-18)

**🔐 安全与隐私修复**:
- ✅ 禁用自动调用日志
- ✅ 禁用同伴保护持久化日志
- ✅ 移除表演式自省报告
- ✅ 过滤内部状态输出

**📦 安装包修复**:
- ✅ 新增 `install.sh` 自动化安装脚本
- ✅ 新增 `clawhub.json` 发布配置
- ✅ 新增 `.npmignore` 白名单配置
- ✅ 完善 `README.md` 使用文档
- ✅ 更新 `SKILL.md` 安装说明

**🧪 验证机制**:
- ✅ 新增 `verify_install.py` 安装验证脚本
- ✅ 6 项验证测试全部通过

[查看完整更新日志](CHANGELOG.md)

---

## 🙏 致谢

感谢所有贡献者和用户！

---

**HeartFlow - 真实是拿来用的，不是拿来表演的** 🌊

**构建时间**: 2026-04-18  
**最后更新**: v9.4.8
