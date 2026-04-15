# 贡献指南

感谢你考虑为 HeartFlow 情感伴侣做出贡献！

## 如何贡献

### 报告问题

发现 Bug？请在 GitHub Issues 中报告：
- 描述问题现象
- 提供复现步骤
- 说明预期行为

### 提出新功能

有新想法？欢迎提出：
- 描述功能需求
- 说明使用场景
- 提供实现思路（可选）

### 提交代码

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发环境

```bash
# 克隆仓库
git clone https://github.com/8xiaochongzi/heartflow-skill.git
cd heartflow-skill

# 安装依赖（本项目无外部依赖）
npm install

# 运行测试
npm test

# 启动 API 服务器
npm run api

# 启动 CLI
npm start
```

## 代码规范

- 使用 ES6+ 语法
- 函数和变量使用有意义的命名
- 添加必要的注释
- 保持代码简洁

## 情感系统扩展

### 添加新情感

在 `src/emotion/states.js` 中添加：

```javascript
EmotionTypes.NEW_EMOTION = '新情感名称';

EmotionDefinitions[EmotionTypes.NEW_EMOTION] = {
  name: '新情感',
  english: 'NewEmotion',
  description: '描述...',
  defaultIntensity: 3,
  naturalDecayMinutes: 30,
  color: '#XXXXXX',
  traits: ['特质 1', '特质 2'],
  responseStyle: '响应风格'
};
```

### 添加转换规则

在 `src/emotion/transitions.js` 中添加转换规则。

## 许可证

MIT License - 贡献即表示同意以 MIT 许可证发布

---

再次感谢你的贡献！🌊
