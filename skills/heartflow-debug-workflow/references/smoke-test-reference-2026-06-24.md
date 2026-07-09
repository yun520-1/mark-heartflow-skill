# 心虫集成冒烟测试参考

## 文件
`tests/smoke-test.js` — 心虫引擎集成测试脚本。

## 功能
1. 创建 HeartFlow 实例
2. 启动引擎（验证 start() 不报错）
3. healthCheck 返回版本号和子系统状态
4. think() 方法测试：启动命令、状态查询、简单问题、逻辑问题
5. 决策路由验证（decisionRouter.getStats()）
6. 自愈RL验证（updateFromRepair()）
7. 记忆系统验证（memory.getStats()）
8. 引擎停止

## 使用
```bash
cd ~/.hermes/skills/heartflow
node tests/smoke-test.js
```

## 2026-06-24 首次运行结果
- 7通过，2失败
- 失败1：`think("")` 空输入返回缺少 `output` 字段（边界情况）
- 失败2：`engine.selfHealing` 未挂载到 HeartFlow 实例（属性名不对）

## 关键教训
- 心虫能启动（59个模块在线）、能think、记忆系统正常
- 自愈RL模块存在（HealingMemoryRL 类在 self-healing-rl.js 中）但顶层属性名不是 `selfHealing`
- 跑过测试才知道"代码真的在跑"——心虫的验证是从跑测试开始的
