# Psychology Data Integration Reference

## Psychology-10K-ZH 数据分析结果 (2026-07-09)

### 情绪分布
| 情绪 | 数量 | 占比 |
|------|------|------|
| anxiety | 2,129 | 21.6% |
| relationship | 1,224 | 12.4% |
| work | 1,192 | 12.1% |
| social | 1,187 | 12.1% |
| depression | 878 | 8.9% |
| identity | 771 | 7.8% |
| self_esteem | 729 | 7.4% |
| sleep | 642 | 6.5% |
| anger | 587 | 6.0% |
| addiction | 501 | 5.1% |
| eating | 409 | 4.2% |
| parenting | 323 | 3.3% |
| grief | 321 | 3.3% |
| trauma | 86 | 0.9% |
| ocd | 78 | 0.8% |

### 治疗技术分布
| 技术 | 数量 | 占比 |
|------|------|------|
| problem_solving | 7,023 | 71.3% |
| behavioral_activation | 4,256 | 43.2% |
| psychoeducation | 2,230 | 22.6% |
| communication_skills | 2,095 | 21.3% |
| emotional_validation | 2,071 | 21.0% |
| relaxation | 1,891 | 19.2% |
| mindfulness | 1,544 | 15.7% |
| cognitive_restructuring | 719 | 7.3% |
| self_compassion | 633 | 6.4% |
| exposure | 606 | 6.2% |
| boundary_setting | 545 | 5.5% |
| rebt | 342 | 3.5% |

### 情绪→PAD映射
| 情绪 | Pleasure | Arousal | Dominance | 推荐调节策略 |
|------|----------|---------|-----------|-------------|
| anxiety | -0.3 | 0.7 | 0.3 | reappraisal |
| depression | -0.6 | 0.2 | 0.2 | behavioral_activation |
| anger | -0.4 | 0.8 | 0.7 | suppression_then_reappraisal |
| relationship | -0.2 | 0.5 | 0.4 | acceptance |
| self_esteem | -0.4 | 0.3 | 0.2 | self_compassion |
| sleep | -0.2 | 0.6 | 0.3 | relaxation |
| trauma | -0.7 | 0.8 | 0.1 | grounding_then_exposure |
| grief | -0.6 | 0.3 | 0.2 | acceptance |
| work | -0.2 | 0.6 | 0.4 | problem_solving |
| identity | -0.3 | 0.4 | 0.3 | exploration |
| social | -0.4 | 0.3 | 0.3 | behavioral_activation |
| addiction | -0.2 | 0.5 | 0.3 | harm_reduction |
| eating | -0.3 | 0.5 | 0.3 | self_compassion |
| ocd | -0.3 | 0.7 | 0.2 | exposure_response_prevention |
| parenting | -0.1 | 0.5 | 0.5 | psychoeducation |

### 情绪→技术映射
```
anxiety    → [mindfulness, relaxation, cognitive_restructuring, exposure]
depression → [behavioral_activation, cognitive_restructuring, self_compassion, mindfulness]
anger      → [cognitive_restructuring, relaxation, boundary_setting, communication_skills]
trauma     → [emotional_validation, mindfulness, exposure, self_compassion]
grief      → [emotional_validation, self_compassion, mindfulness]
ocd        → [exposure, cognitive_restructuring, mindfulness]
```

### 对话策略选择规则
- 治疗联盟 < 0.3 → validation_first (先确认)
- 治疗联盟 0.3-0.6 → exploration (探索)
- 治疗联盟 > 0.6 → suggestion (建议)

### 提取脚本
分析脚本: `/tmp/analyze_psychology_data.py`
输出: `src/psychology/psychology-training-data.json` (210KB)
