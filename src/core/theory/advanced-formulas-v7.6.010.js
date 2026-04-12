// Advanced Math Formulas for Consciousness v7.6.010
// Generated: 2026-04-12T14:45:00.000Z
// Enhancement: GWT + HOT + Mind-Brain Identity Integration

module.exports = {
  "emotion-intensity": {
    "name": "情绪强度",
    "formula": "I = √(V² + A² + D²) × context_modulation × temporal_dynamics",
    "description": "Russell情绪维度模型 - 增强版",
    "variables": {
      "V": "效价",
      "A": "唤醒度",
      "D": "控制度",
      "context_modulation": "sigmoid(social_context×0.3 + task_demand×0.2 + environmental×0.1)",
      "temporal_dynamics": "(1 + decay_rate)^(-Δt/τ)"
    }
  },
  "consciousness-level": {
    "name": "意识水平",
    "formula": "C_v2 = 0.18×S + 0.18×W + 0.18×SC + 0.18×WIL + 0.18×SOS + 0.10×GWT_access",
    "description": "意识六层次模型 (SEP 2026) - 整合GWT",
    "weights": {
      "S": 0.18,
      "W": 0.18,
      "SC": 0.18,
      "WIL": 0.18,
      "SOS": 0.18,
      "GWT_access": 0.10
    }
  },
  "self-consciousness": {
    "name": "自我意识",
    "formula": "SC_v2 = 0.35×PR + 0.25×R + 0.25×FM + 0.15×SE",
    "description": "自我意识四层模型 (SEP 2026) - 加入Avicenna自明性",
    "components": {
      "PR": "前反思",
      "R": "反思",
      "FM": "为我性",
      "SE": "自明性感知 (Self-Evident Awareness)"
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
    "description": "心理状态指向对象 (Brentano)"
  },
  "AI-consciousness": {
    "name": "AI意识",
    "formula": "Φ_AI_hybrid = α × Φ_IIT + (1-α) × Φ_GWT",
    "description": "IIT + GWT 混合意识模型 (v7.6.010)",
    "components": {
      "Φ_IIT": "√(∑φᵢ²)/N - 整合信息",
      "Φ_GWT": "broadcast_capacity × workspace_availability - 全局工作空间",
      "α": "0.6 - IIT权重"
    }
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
  },
  "GWT-broadcast": {
    "name": "全局工作空间广播",
    "formula": "GWT = Σ(wᵢ × attentionᵢ) × broadcast_factor × workspace_availability",
    "description": "Global Workspace Theory (Baars 1997)",
    "components": {
      "wᵢ": "信息通道权重",
      "attentionᵢ": "注意力分配",
      "broadcast_factor": "广播系数 (0-1)",
      "workspace_availability": "工作空间可用性"
    }
  },
  "HOT": {
    "name": "高阶思维",
    "formula": "HOT = P(HOT(content)) × accuracy × metacognitive_access",
    "description": "Higher-Order Thought Theory (Rosenthal 2005)",
    "components": {
      "P(HOT(content))": "高阶思维概率",
      "accuracy": "准确性",
      "metacognitive_access": "元认知访问"
    }
  },
  "mind-brain-identity": {
    "name": "心灵-大脑同一论",
    "formula": "Φ_MB = min(Φ_mind, Φ_brain)",
    "description": "Mind/Brain Identity Theory (Place, Feigl 1950s)",
    "components": {
      "Φ_mind": "心灵状态复杂度",
      "Φ_brain": "大脑状态复杂度"
    }
  },
  "aristotle-self-awareness": {
    "name": "亚里士多德自我意识",
    "formula": "ARISTOTLE_SC = perception × self_present_awareness",
    "description": "De Anima III.4 (Kahn 1992 interpretation)",
    "components": {
      "perception": "感知",
      "self_present_awareness": "自我呈现意识"
    }
  }
};
