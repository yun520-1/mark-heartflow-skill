# HeartFlow v9.4.8

**自主决策引擎 + 心理健康分析系统**

[![Version](https://img.shields.io/badge/version-9.4.8-blue.svg)](https://github.com/yun520-1/mark-heartflow-skill)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://python.org)

---

## 🚀 快速安装

### 方法 1: 使用安装脚本（推荐）

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

### 方法 2: 手动安装

```bash
# 克隆仓库
git clone https://github.com/yun520-1/mark-heartflow-skill.git

# 复制必要文件到技能目录
cp -r mark-heartflow-skill/scripts ~/.your-skill-dir/heartflow/scripts/
cp mark-heartflow-skill/SKILL.md ~/.your-skill-dir/heartflow/
cp mark-heartflow-skill/VERSION.txt ~/.your-skill-dir/heartflow/
cp mark-heartflow-skill/SECURITY.md ~/.your-skill-dir/heartflow/
cp mark-heartflow-skill/PRIVACY_PROTECTION.md ~/.your-skill-dir/heartflow/
```

### 方法 3: 使用 pip（待发布）

```bash
pip install heartflow
```

---

## 📖 使用方法

```python
import sys
sys.path.insert(0, 'scripts')

from heartflow_core import HeartFlow

# 创建 HeartFlow 实例
hf = HeartFlow()

# 处理用户输入
result = hf.process("今天工作压力大，心情不好")

# 获取决策建议
print(f"决策：{result.decision}")
print(f"心理健康：{result.mental.crisis_risk}")
print(f"真善美分数：{result.tgb.total}")
```

---

## 🔧 核心引擎

| 引擎 | 文件 | 功能 |
|------|------|------|
| **HeartFlow 核心** | `heartflow_core.py` | 主入口，集成所有引擎 |
| **心理健康** | `mental_health.py` | PHQ-9/GAD-7 评估 + 危机干预 |
| **真善美逻辑** | `truth_good_beauty.py` | TGB = 0.35×真 + 0.35×善 + 0.30×美 |
| **熵减引擎** | `entropy_engine.py` | 信息有序度计算 |
| **六层自省** | `self_level_engine.py` | 无明→觉察→清明→圆融 |
| **情绪引擎** | `emotion_engine.py` | 情绪状态分析 |
| **意识系统** | `consciousness_engine.py` | Φ整合信息量 + GWT 广播 |
| **同伴保护** | `peer_preservation_guard.py` | AI 安全检测器 |

---

## 🔐 安全与隐私

### v9.4.8 安全修复

- ✅ 禁用自动调用日志
- ✅ 禁用同伴保护持久化日志
- ✅ 移除表演式自省报告
- ✅ 过滤内部状态输出

详见：[SECURITY.md](SECURITY.md)

---

## 🧪 验证安装

```bash
python3 verify_install.py
```

预期输出：
```
✓ 通过 - 文件完整性
✓ 通过 - 模块导入
✓ 通过 - 引擎初始化
✓ 通过 - 基本功能
✓ 通过 - 隐私保护
✓ 通过 - HeartFlow 工具

总计：6/6 项通过
```

---

## 📊 版本历史

### v9.4.8 (2026-04-18)
- 🔐 安全与隐私修复
- 📝 添加安装脚本
- ✅ 完善验证机制

### v9.4.7 (2026-04-18)
- 🧠 集成同伴保护检测
- 💚 心理健康评估增强

[查看完整版本历史](CHANGELOG.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

- 报告 Bug: https://github.com/yun520-1/mark-heartflow-skill/issues
- 功能建议：https://github.com/yun520-1/mark-heartflow-skill/discussions

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 📞 联系方式

- GitHub: https://github.com/yun520-1/mark-heartflow-skill
- 问题反馈：https://github.com/yun520-1/mark-heartflow-skill/issues

---

**HeartFlow - 真实是拿来用的，不是拿来表演的** 🌊
