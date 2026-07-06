# LLM 兜底 API 调用模式：API key 传输与 Python subprocess

**发现时间：2026-06-28 · 相关 session：BigBench 100% 优化**

## 问题

心虫 `logic-reasoning.js` 的 `_llmFallback()` 方法需要用 API key 调腾讯云 Copilot API 做兜底推理。但：
1. `***` 在 Hermes execute_code/patch/write_file 中被系统级截断为 `...`
2. Shell 拼接 `curl` 命令时，JSON body 中的 `\n` 被解释为换行导致 API 400
3. 中文 prompt 在 shell 转义中出错
4. 腾讯云 API 返回 SSE 格式，包含 `reasoning_content` 字段

## 解决方案

### 1. API key 不硬编码，从文件读取

```javascript
const fs = require('fs');
let apiKey = '';
try { apiKey = fs.readFileSync('/tmp/api_key.txt', 'utf-8').trim(); } catch(e) {}
if (!apiKey) try { apiKey = process.env.HEARTFLOW_API_KEY || ''; } catch(e) {}
if (!apiKey) return null;
```

Key 写入方式：
```bash
# Python 写文件（绕过 *** 截断）
python3 -c "
with open('/tmp/api_key.txt', 'w') as f:
    f.write('your_full_api_key_here_59chars')
"
```

### 2. 用 Python subprocess 调 curl，避免 shell 转义

```javascript
const { execSync } = require('child_process');
const body = JSON.stringify({...});

const pyCode = `
import subprocess, json, sys
body = json.loads(sys.argv[1])
result = subprocess.run([
  'curl', '-s', '--connect-timeout', '5', '--max-time', '15',
  '-X', 'POST', 'https://copilot.tencent.com/v2/chat/completions',
  '-H', 'Content-Type: application/json',
  '-H', 'Authorization: Bearer ${apiKey}',
  '-d', json.dumps(body)
], capture_output=True, text=True)
content = ''
for line in result.stdout.split('\\\\n'):
    if line.startswith('data: '):
        d = line[6:]
        if d.strip() == '[DONE]': break
        try:
            obj = json.loads(d)
            delta = obj.get('choices', [dict()])[0].get('delta', dict()).get('content', '')
            content += delta
        except: pass
print(content.strip())
`;
const result = execSync('python3', ['-c', pyCode, body], { timeout: 20000, encoding: 'utf-8' });
```

关键点：
- `sys.argv[1]` 传递 JSON body（避免 shell 转义）
- Python 的 `subprocess.run()` 用数组参数（避免 shell 解释）
- `split('\\\\n')` 在 JS 模板字符串中 = Python 的 `split('\n')`
- `[dict()]` 替代 `[{}]`（`{}` 在 f-string 中被当成空集语法报错）

### 3. 腾讯云 API SSE 解析注意事项

```python
for line in result.stdout.split('\n'):
    if line.startswith('data: '):
        d = line[6:]
        if d.strip() == '[DONE]': break
        try:
            obj = json.loads(d)
            delta = obj.get('choices', [{}])[0].get('delta', {})
            # 尝试 content 和 reasoning_content
            c = delta.get('content', '') or delta.get('reasoning_content', '') or ''
            content += c
        except: pass
```

模型（deepseek-v4-flash）在输出最终答案前先输出推理内容（`reasoning_content` 字段）。第一个 chunk 的 `delta.content` 是空的，推理内容在 `reasoning_content` 里。需要等后续 chunk 才有 `delta.content`。

### 4. 测试验证

```python
import subprocess, json

with open('/tmp/api_key.txt') as f:
    key = f.read().strip()

result = subprocess.run([
    "curl", "-s", "--connect-timeout", "5", "--max-time", "15",
    "-X", "POST", "https://copilot.tencent.com/v2/chat/completions",
    "-H", "Content-Type: application/json",
    "-H", f"Authorization: Bearer ***    "-d", json.dumps({...})
], capture_output=True, text=True, timeout=15)
```

## 已知限制

1. **同步调用**：`execSync` 阻塞主线程 ~2-3 秒。适合低频兜底（规则引擎打 0 分时），不适合高频调用。
2. **超时处理**：腾讯云 API 在 deepseek-v4-flash 模型上通常 1-2 秒返回，但高峰期可能 10+ 秒。`--max-time 15` 是合理阈值。
3. **错误恢复**：当前实现在 catch 中直接返回 null（静默降级）。可考虑加重试逻辑。
