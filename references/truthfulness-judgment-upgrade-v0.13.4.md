# 真善美判定引擎升级方法论 v0.13.4

## 升级源文件
`src/core/identity/identity.js` — IdentitySystem.judgeTruthfulness()

## 升级前问题
- 2个简单 regex 检测，漏报率高
- 矛盾句（"很好但是也很糟糕"）不触发
- 返回结构简单，只有 `pass` + `issues[]`
- async 函数但无真正异步逻辑

## 升级后架构：4维多层验证

### 维度1：可疑数字检测
```javascript
// 条件：无 %、无来源标记（arXiv/GitHub/论文/https）
if (hasLongNumbers && !hasPercent && !hasSource && !hasCitation) {
  issues.push('possible_fabricated_number');
}
```

### 维度2：绝对化声明检测（5类型）
| 类型 | pattern | severity |
|------|---------|----------|
| universal_quantifier | 所有/一切 | medium |
| absolute_frequency | 总是/从来 | medium |
| absolute_deterministic | 必然/绝对 | high |
| absolute_completeness | 完全/彻底 | medium |
| uniqueness | 唯一 | high |

**关键**：有条件限制（如果/当/取决于）时降级或豁免。

### 维度3：模糊引用检测
- `研究表明|研究显示`：medium（有具体例子降为 low）
- `大家都知道`：medium
- `肯定|一定|必定`：medium

### 维度4：矛盾检测（逐句分析）
```javascript
const sentences = input.split(/[。；！？\n]/);
for (const sent of sentences) {
  const hasPos = /很好|完美|成功|棒|不错/.test(sent);
  const hasNeg = /糟糕|失败|不行|很差|烂/.test(sent);
  if (hasPos && hasNeg) {
    // 矛盾 → high severity → 加入 issues
  }
}
```

## 返回结构
```javascript
{
  pass: boolean,           // issues.length === 0
  issues: string[],        // 高严重性（触发 fail）
  warnings: string[],      // 警告信息
  checks: [                // 所有检测项详情
    { type, severity, detail }
  ],
  timestamp: number,
  confidence: number       // 通过时 0.95，失败时 0.7
}
```

## 验证测试用例
```
"这个东西很好但是也很糟糕" → pass=false, contradiction ✓
"所有人都喜欢这个"           → pass=false, universal_quantifier ✓
"这是唯一正确的答案"        → pass=false, uniqueness ✓
"如果你努力学习就一定成功"   → pass=true（有条件限制）✓
"研究表明每天喝8杯水对身体好" → pass=true（有来源标记）✓
```

## 升级检查清单
1. ✅ 先 read_file 完整文件
2. ✅ patch 而非 rewrite（保留文件其余部分）
3. ✅ 每次 patch 后立即验证（node 跑测试用例）
4. ✅ 修复 regex 逻辑 bug（contradiction 检测的数组误用）
5. ✅ 更新 VERSION + CHANGELOG + SKILL.md date + 主引擎注释
6. ✅ 运行 sync-version.js 验证
