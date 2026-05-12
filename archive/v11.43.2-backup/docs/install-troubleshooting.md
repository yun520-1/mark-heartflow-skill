# HeartFlow 安装与故障排查

## 安装
```bash
cd ~/.hermes/skills/ai/heartflow
npm install
node bin/cli.js status
```

## 常见问题
- 版本不一致：检查 `package.json`、`SKILL.md`、`VERSION`
- 启动失败：先看 `node bin/cli.js status`
- 升级脚本异常：先执行 `bash -n hourly-upgrade.sh`
- 任务未产出：检查定时任务是否已触发并查看最后运行状态

## 使用示例
```text
请用 HeartFlow 检查这个方案的逻辑漏洞、矛盾点和风险。
请用 HeartFlow 比较 A/B/C 方案，并给出依据、风险、备选路径。
请用 HeartFlow 把这段上下文整理成 working / episodic / semantic 三层记忆。
```
