# HeartFlow 审计工作流

> 用于 HeartFlow 每次升级同步 GitHub 前的强制审计检查。
> 来源: v11.31.0 审计流程文档化

## 审计检查清单（6项）

每次升级后必须按顺序执行以下6项检查：

### 1. 安全审计 (S-Series)

| 检查项 | 命令 | 预期结果 |
|--------|------|----------|
| S-01 自动git push | `grep -r "git push" --include="*.sh" --include="*.js" . \| grep -v "已禁用\|disabled\|#git\|manual"` | 空或仅注释 |
| S-02 PII泄露 | `grep -r "342966761\|markcell@" --include="*.md" --include="*.js" .` | 仅archive中已修复的记录 |
| S-03 硬编码路径 | `grep -r "/Users/apple/" --include="*.md" --include="*.js" . \| grep -v "memory/meaningful"` | 仅记忆文件内容 |

### 2. 版本一致性审计 (V-Series)

| 检查项 | 命令 | 预期结果 |
|--------|------|----------|
| V-01 VERSION文件 | `cat VERSION` | 正确版本号 |
| V-02 package.json | `grep '"version"' package.json` | 与VERSION一致 |
| V-03 SKILL.md | `grep "^version:" SKILL.md` | 与VERSION一致 |
| V-04 README.md | `head -1 README.md` | 与VERSION一致 |
| V-05 CHANGELOG.md | `head -3 CHANGELOG.md` | 包含正确版本 |
| V-06 package.json description | `grep "version" package.json` | 包含正确版本 |

### 3. 语法检查 (C-Series)

```bash
node --check src/core/upgrade-and-push.js
```

## 审计输出模板

```
=== HeartFlow 审计报告 ===

日期: YYYY-MM-DD
版本: X.Y.Z

□ 安全审计
  □ S-01 自动git push: PASS/FAIL
  □ S-02 PII泄露: PASS/FAIL  
  □ S-03 硬编码路径: PASS/FAIL

□ 版本一致性
  □ V-01 VERSION: X.Y.Z
  □ V-02 package.json: X.Y.Z
  □ V-03 SKILL.md: vX.Y.Z
  □ V-04 README.md: vX.Y.Z
  □ V-05 CHANGELOG.md: vX.Y.Z
  □ V-06 description: vX.Y.Z

□ 语法检查
  □ upgrade-and-push.js: PASS/FAIL

□ Git状态
  □ 提交: HASH
  □ 推送: SUCCESS/FAIL

审计结果: PASS/FAIL
```

## 完整审计脚本

```bash
#!/bin/bash
# heartflow-audit.sh - HeartFlow 审计脚本

cd ~/.hermes/skills/ai/heartflow

echo "=== HeartFlow 审计开始 ==="
echo "版本: $(cat VERSION)"
echo ""

# 1. 安全审计
echo "□ S-01 git push检查"
PUSH_COUNT=$(grep -r "git push" --include="*.sh" --include="*.js" . 2>/dev/null | grep -v "已禁用\|disabled\|#git\|manual" | wc -l)
if [ "$PUSH_COUNT" -eq 0 ]; then
  echo "  ✅ PASS (0条残留)"
else
  echo "  ❌ FAIL ($PUSH_COUNT条残留)"
  grep -r "git push" --include="*.sh" --include="*.js" . 2>/dev/null | grep -v "已禁用\|disabled\|#git\|manual"
fi

# 2. 版本一致性
echo ""
echo "□ 版本一致性检查"
VER=$(cat VERSION)
for f in "package.json:version" "SKILL.md:version:" "README.md:v"; do
  file="${f%%:*}"
  pattern="${f##*:}"
  result=$(grep "$pattern" "$file" 2>/dev/null | head -1)
  if echo "$result" | grep -q "$VER"; then
    echo "  ✅ $file: OK"
  else
    echo "  ❌ $file: 不匹配 (got: $result)"
  fi
done

# 3. 语法检查
echo ""
echo "□ 语法检查"
if node --check src/core/upgrade-and-push.js 2>/dev/null; then
  echo "  ✅ upgrade-and-push.js: PASS"
else
  echo "  ❌ upgrade-and-push.js: FAIL"
fi

echo ""
echo "=== 审计完成 ==="
```

## 常见问题修复

### S-01: 自动git push未禁用

**文件**: `src/core/upgrade-and-push.js`

**修复**:
```javascript
// 注释掉 push 调用
// run('git push origin-sync main');
console.log('ℹ️ 自动推送已禁用 — 请手动执行 git push origin-sync main');
```

### V-01: README.md版本号过时

**修复**:
```bash
sed -i '' 's/v11\.[0-9]*\.[0-9]*/vNEW_VERSION/g' README.md
```

---

*来源: v11.31.0 审计流程文档化*
