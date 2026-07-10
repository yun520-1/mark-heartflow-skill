# Formula → Module Mapping Reference

## HeartFlow v5.9.12 公式驱动模块架构

### 核心原则

公式库是原料，认知模块是工厂。只存公式不接入模块 = 死数据。

### 模块注册四步（漏任何一步dispatch都失败）

1. **Lazy import** (~line 219 in heartflow.js):
```js
const _Mod = _lazy('modName', () => require('../path/file.js'));
```

2. **Init** (~line 853):
```js
try { this.modName = new (_Mod().ClassName)(); } catch(e) { _boundedPush(this._initErrors, {...}); }
```

3. **_registerModules subsystemNames** (~line 1803) — 最容易漏！漏了就 "Unknown subsystem":
```js
'modName',  // v5.9.12 — 公式驱动新模块
```

4. **ALLOWED_ROUTES** (~line 1981):
```js
'modName.method1', 'modName.method2', 'modName.healthCheck',
```

### 模块开发模板

每个公式驱动模块遵循同一结构：

```javascript
const { getFormulaBridge } = require('../formula/formula-bridge.js');

class MyEngine {
  constructor(options = {}) {
    this._bridge = null;
  }

  _getBridge() {
    if (!this._bridge) this._bridge = getFormulaBridge();
    return this._bridge;
  }

  // 每个子系统一个方法
  subsystemA(params) {
    const bridge = this._getBridge();
    // 使用 bridge 的公式原语
    return { result, ... };
  }

  // 统一入口
  analyze(type, params = {}) {
    switch (type) {
      case 'subsystemA': return this.subsystemA(params);
      default: return { error: `Unknown type: ${type}` };
    }
  }

  // 必须有healthCheck
  healthCheck() {
    return { status: 'ok', modules: ['subsystemA', ...] };
  }
}

module.exports = { MyEngine };
```

### FormulaBridge 已有公式原语（90+）

| 类别 | 方法 |
|------|------|
| 遗忘/记忆 | ebbinghausRetention, memoryStrengthFromFrequency, actrBaseLevel, actrActivation, actrNoise |
| 信息论 | shannonEntropy, crossEntropy, klDivergence, logLoss |
| 决策 | expectedUtility, bayesUpdate, softmaxPolicy, prospectValue, prospectWeight |
| 信念 | bayesFactor, posteriorOdds, bayesConfirmation, popperCorroboration |
| 认知 | metacognitiveConfidence, cognitiveDissonance, yerkesDodson, flowChannel |
| 意识 | gwtAccessibility, gwtWinner, iitPhi, clarionACS |
| 主动推断 | predictiveCodingFreeEnergy, activeInferenceEFE, precisionWeight, activeInferenceInfoGain |
| IRT | irtRasch, irt2PL, irt3PL, irt4PL, irtInformation, irtSEM |
| DDM | ddmDecisionTime, ddmErrorRate |
| SDT | sdtDPrime, sdtBeta, sdtAPrime |
| 社交 | socialInfluence, vygotskyZPD, homophily, bystanderEffect |
| 测量 | cronbachAlpha, cohensD, phq9Score, gad7Score |
| SEM | semFitRMSEA, semFitSRMR |

### formula-triggers.json 信号扩展

当前 40 个信号触发器（v5.9.12 从 24 扩展到 40）。新增：
decision_dynamics, signal_detection, conditioning, weber_fechner, motor_control, game_theory, memory_consolidation, emotion_regulation, resilience, self_efficacy, attribution, dream, attention, task_switching, emotion_contagion, creative_association

### 版本历史

- v5.8.6: FormulaBridge 初建（4个核心公式）
- v5.9.8: 扩展到 30+ 公式原语
- v5.9.9: 第二批审计扩展（博弈论/社会影响/量表）
- v5.9.10: 第三批（IRT/PCA/KMO/Bartlett）
- v5.9.11: DDM/SDT/主动推断信息增益（论文代码移植）
- v5.9.12: 5个公式驱动模块 + 16个新信号触发器 + 3529公式
