# HeartFlow API 文档

## 快速开始

### 启动服务器

```bash
# 默认端口 3800
node api/server.js

# 自定义端口
HEARTFLOW_PORT=8080 node api/server.js

# 允许跨域
HEARTFLOW_CORS=true node api/server.js
```

### API 端点

## 认证

当前版本无需认证（生产环境建议添加）

---

## 端点详情

### GET /health

健康检查

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-03-28T19:00:00.000Z"
}
```

---

### GET /status

获取当前情感状态

**响应**:
```json
{
  "emotion": "关切",
  "intensity": "中等",
  "energy": 75,
  "totalInteractions": 12,
  "sessionId": "session_1711656000000_abc12",
  "continuousInteractionMinutes": 24,
  "initialized": true
}
```

---

### POST /chat

发送对话消息

**请求**:
```json
{
  "message": "今天工作好累啊..."
}
```

**响应**:
```json
{
  "response": "我能理解你的感受。这确实不容易。",
  "emotion": {
    "name": "关切",
    "intensity": "中等",
    "energy": 70
  },
  "report": {
    "emotionalState": {
      "before": { "emotion": "平静", "intensity": 2 },
      "after": { "emotion": "关切", "intensity": 3 }
    },
    "triggerAnalysis": {
      "userInput": "今天工作好累啊...",
      "detectedTriggers": ["stress", "fatigue"]
    }
  },
  "memoryId": "mem_1711656000000",
  "timestamp": "2026-03-28T19:00:00.000Z"
}
```

---

### GET /history

获取情感历史

**参数**:
- `limit` (可选): 返回数量，默认 10

**响应**:
```json
[
  {
    "interactionId": "int_1",
    "timestamp": "2026-03-28T19:00:00.000Z",
    "before": { "emotion": "平静", "intensity": "轻微" },
    "after": { "emotion": "关切", "intensity": "中等" },
    "userInput": "今天工作好累啊...",
    "triggers": ["stress", "fatigue"]
  }
]
```

---

### GET /stats

获取情感统计

**响应**:
```json
{
  "totalInteractions": 25,
  "emotionDistribution": {
    "平静": 8,
    "愉悦": 10,
    "关切": 5,
    "好奇": 2
  },
  "averageIntensity": {
    "平静": "2.00",
    "愉悦": "3.20",
    "关切": "3.00"
  },
  "transitions": {
    "平静→愉悦": 5,
    "愉悦→关切": 3
  }
}
```

---

### GET /report

获取情感分析报告

**参数**:
- `index` (可选): 交互索引，-1 表示最新，默认 -1

**响应**:
```json
{
  "interactionId": "int_5",
  "timestamp": "2026-03-28T19:05:00.000Z",
  "before": {
    "emotion": "平静",
    "intensity": 2,
    "intensityLabel": "轻微"
  },
  "after": {
    "emotion": "关切",
    "intensity": 3,
    "intensityLabel": "中等"
  },
  "trigger": {
    "userInput": "工作压力好大",
    "triggers": ["stress", "negative_emotion"],
    "keywords": ["压力", "大"]
  },
  "transition": {
    "type": "empathy_response",
    "rule": "平静 → 关切"
  },
  "energyLevel": 75
}
```

---

### POST /rest

休息恢复能量

**请求**:
```json
{
  "minutes": 10
}
```

**响应**:
```json
{
  "rested": true,
  "energyRecovered": 90,
  "emotionChanged": true,
  "from": "疲惫",
  "to": "平静"
}
```

---

### POST /reset

重置情感状态

**响应**:
```json
{
  "reset": true,
  "newSessionId": "session_1711656000000_xyz99",
  "timestamp": "2026-03-28T19:10:00.000Z"
}
```

---

### GET /export

导出完整会话数据

**响应**:
```json
{
  "sessionInfo": {
    "id": "session_xxx",
    "startTime": "2026-03-28T18:00:00.000Z",
    "endTime": null
  },
  "currentState": { ... },
  "memoryRecords": [ ... ],
  "stats": { ... },
  "exportedAt": "2026-03-28T19:15:00.000Z"
}
```

---

### POST /end

结束当前会话

**响应**:
```json
{
  "ended": true,
  "sessionId": "session_xxx",
  "endTime": "2026-03-28T19:20:00.000Z"
}
```

---

### GET /emotions

获取情感类型定义

**响应**:
```json
{
  "emotions": ["平静", "愉悦", "好奇", "关切", "疲惫", "兴奋"],
  "definitions": {
    "平静": {
      "name": "平静",
      "english": "Calm",
      "description": "默认状态，内心平和，理性思考",
      "defaultIntensity": 2,
      "traits": ["理性", "稳定", "倾听", "客观"]
    }
  }
}
```

---

## 错误处理

所有错误返回统一格式：

```json
{
  "error": "错误信息"
}
```

常见错误码：
- 400: 请求参数错误
- 404: 端点不存在
- 500: 服务器内部错误

---

## 使用示例

### cURL

```bash
# 发送消息
curl -X POST http://localhost:3800/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}'

# 获取状态
curl http://localhost:3800/status

# 获取历史
curl "http://localhost:3800/history?limit=5"
```

### JavaScript

```javascript
// 发送消息
const response = await fetch('http://localhost:3800/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '你好' })
});
const result = await response.json();
console.log(result.response);

// 获取状态
const status = await fetch('http://localhost:3800/status');
const state = await status.json();
console.log(state.emotion);
```

### Python

```python
import requests

# 发送消息
response = requests.post('http://localhost:3800/chat', json={
    'message': '你好'
})
result = response.json()
print(result['response'])

# 获取状态
status = requests.get('http://localhost:3800/status')
state = status.json()
print(state['emotion'])
```
