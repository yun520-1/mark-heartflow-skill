# 反馈吸收升级模式（2026-06-29 新增）

## 来源
DeepSeek-V3 #1446（qingkong66 V4 gap 映射）、#1462（maratsultanov2 divergence trace）、#1447（luoxuejian000 Cross-Framework Validation）

## 适用条件
- GitHub issue/Discussion 中出现**可落地的技术反馈**
- 反馈明确指向心虫现有模块的改进
- 不需要新建模块，只需在现有模块中新增方法/规则

## 执行模式（最小可行改动）

### 1. decision-router.js — 新增决策规则
在 RULES 数组末尾追加规则对象。注意：数组结束标记是 `];` 不是 `]`（有注释）。

### 2. self-healing.js — 新增缓存方法
在 constructor 中添加 Map 实例 + TTL 配置，新增 getCachedPolicy/setCachedPolicy/_getPolicyCacheKey 三个方法。

### 3. identity-engine.js — 新增方法（类内部）
必须放在 IdentityAnchor 类内部，在 _checkIdentityAlignment 之后、declare() 之前。不能在 `}` 类结束符之后插入。

## 版本号检查流程
1. 先 grep 当前版本号
2. 确认当前版本号后再替换（不能假设）
3. 替换所有源：package.json / VERSION / VERSION.txt / README.md / SKILL.md / CHANGELOG.md

## 同步流程
1. git status 检查残留改动
2. git commit -m "vX.Y.Z: 描述"
3. git push origin main
4. clawhub publish . --version X.Y.Z

## 实战案例
- **v5.4.7**（2026-06-29）：3 个反馈 → 3 个文件 → 62 行新增 → commit `df49775`
