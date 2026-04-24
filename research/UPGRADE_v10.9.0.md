# HeartFlow v10.9.0 稳定升级规划

**版本**: 10.9.0  
**主题**: 稳定优先 - 减少逻辑错误的核心升级  
**日期**: 2026-04-24

---

## 核心目标

> 永远减少逻辑错误

---

## 一、现状分析

### 当前能力

| 引擎 | 功能 | 状态 |
|------|------|------|
| `heart_logic.py` | 三段论验证、命题逻辑、谬误检测 | ✅ v10.7.8 |
| `fallacy.py` | 5种谬误检测 | ✅ |
| VeriCoT 验证门 | 思维链形式前提提取 | ✅ 已集成 |

### 现有谬误检测

- ✅ 肯定后件 (Affirming Consequent)
- ✅ 否定前件 (Denying Antecedent)
- ✅ 虚假二选一 (False Dichotomy)
- ✅ 循环论证 (Circular Reasoning)
- ✅ 合成谬误 / 分解谬误

### 差距分析

| 目标 | 当前 | 目标 | 优先级 |
|------|------|------|--------|
| 减少逻辑错误 | 规则匹配 | HJB最优停止 | 🔴 高 |
| 验证准确性 | 85% | 95% | 🔴 高 |
| 错误回滚 | 无 | 检测+恢复 | 🟡 中 |

---

## 二、v10.9.0 稳定升级

### 1. HJB 最优停止 (新增)

```python
# 边际价值 <= 成本时停止思考
# 来源: 认知摩擦研究

def should_stop_reasoning(confidence: float, steps: int, cost: float = 0.1) -> bool:
    """
    当推理的边际价值低于成本时停止
    """
    marginal_value = (confidence - 0.5) / (steps + 1)
    return marginal_value <= cost or steps >= 5
```

**目标**: 减少过度推理导致的逻辑错误

### 2. 验证门增强 (改进)

- 从当前规则匹配升级为 CSP 验证
- 增加矛盾检测 (contradiction detection)
- 增加未支持结论检测 (unsupported conclusion)

### 3. 错误日志 (新增)

```python
@dataclass
class LogicError:
    error_type: str      # 谬误类型
    description: str    # 错误描述
    severity: str      # low/medium/high
    timestamp: str   # 时间戳
```

**目标**: 追踪并学习逻辑错误

---

## 三、升级计划 (稳定优先)

| 阶段 | 内容 | 时间 | 状态 |
|------|------|------|------|
| 1️⃣ | HJB停止函数集成 | 1周 | 待开发 |
| 2️⃣ | 验证门CSP升级 | 2周 | 待开发 |
| 3️⃣ | 错误日志系统 | 1周 | 待开发 |
| 4️⃣ | 测试验证 | 2周 | 待开发 |

**总周期**: 6周 (稳定升级)

---

## 四、验证方案

### 测试用例

```python
# 必须通过
test_cases = [
    # 三段论
    ("All M are P. All S are M. ∴ All S are P.", True, 0.95),
    # Modus Ponens
    ("If P then Q. P. ∴ Q.", True, 0.95),
    # Modus Tollens
    ("If P then Q. Not Q. ∴ Not P.", True, 0.95),
    # 谬误检测
    ("If P then Q. Q. ∴ P.", False, 0.90),  # 肯定后件
    ("If P then Q. Not P. ∴ Not Q.", False, 0.90),  # 否定前件
]
```

### 验收标准

- 准确率 >= 95%
- 误报率 <= 3%
- 延迟 <= 100ms

---

## 五、风险控制

| 风险 | 缓解措施 |
|------|---------|
| 过度复杂 | 先小后大，逐步集成 |
| 性能下降 | 保持现有接口，单独测试 |
| regression | 完整测试用例覆盖 |

---

## 六、版本历史

| 版本 | 主题 | 状态 |
|------|------|------|
| 10.8.3 | 研究升级 (AI+哲学论文) | ✅ |
| **10.9.0** | 稳定升级 (减少逻辑错误) | 📋 规划 |

---

*HeartFlow v10.9.0 - 稳定升级规划*  
*核心理念：不在于快，最重要的是稳定*