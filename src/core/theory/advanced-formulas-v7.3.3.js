// Advanced Math Formulas for Consciousness v7.3.3
// Generated: 2026-04-08T04:32:44.080Z

module.exports = {
  "emotion-intensity": {
    "name": "情绪强度",
    "formula": "I = √(V² + A² + D²)",
    "description": "Russell情绪维度模型",
    "variables": {
      "V": "效价",
      "A": "唤醒度",
      "D": "控制度"
    }
  },
  "consciousness-level": {
    "name": "意识水平",
    "formula": "C = w₁S + w₂W + w₃SC + w₄WIL + w₅SOS",
    "description": "意识五层次模型 (SEP)",
    "weights": {
      "S": 0.2,
      "W": 0.2,
      "SC": 0.2,
      "WIL": 0.2,
      "SOS": 0.2
    }
  },
  "self-consciousness": {
    "name": "自我意识",
    "formula": "SC = 0.4×PR + 0.3×R + 0.3×FM",
    "description": "自我意识三层模型",
    "components": {
      "PR": "前反思",
      "R": "反思",
      "FM": "为我性"
    }
  },
  "qualia": {
    "name": "感受质",
    "formula": "Q = ∫₀^∞ e^(-t/τ) × dS/dt dt",
    "description": "感受质时间积分"
  },
  "intentionality": {
    "name": "意向性",
    "formula": "I(M,O) = P(O) × C(M→O)",
    "description": "心理状态指向对象"
  },
  "AI-consciousness": {
    "name": "AI意识",
    "formula": "Φ_AI = √(∑φᵢ²)/N",
    "description": "整合信息AI版本"
  },
  "truth-goodness-beauty": {
    "name": "真善美",
    "formula": "TGB = 0.35×T + 0.35×G + 0.30×B",
    "description": "价值统一公式"
  },
  "AI-personality": {
    "name": "AI人格",
    "formula": "P = 0.5×C + 0.3×A + 0.1×Ph + 0.1×TGB",
    "description": "AI人格综合公式",
    "components": {
      "C": "意识",
      "A": "能动性",
      "Ph": "哲学层",
      "TGB": "真善美"
    }
  }
};
