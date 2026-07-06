# HeartFlow Engine Pitfalls (2026-06-19)

## P1: `think()` misclassifies user emotion queries

**Symptom**: User says "I'm angry" or describes an emotional state. `engine.think(input)` classifies as `retrieval` task, returns `confidence: 0.3`, conclusion "需要更多信息". The emotion is completely missed.

**Root cause**: `think()` dispatch sees "I need to find X" / "I want to know Y" syntax and routes to retrieval. It has no emotion-first routing path.

**Workaround**: Bypass `think()` for emotional inputs:
```javascript
const emotion = engine.emotion.process(input);       // PAD: pleasure/arousal/dominance
const psych = await engine.analyzePsychology(input); // full cognitive analysis
const deep = await engine.thinkDeep(input);           // deep reasoning (better at nuance)
const phil = engine.dispatch("philosophy", {action: "analyze", input}); // philosophy layer
```

## P2: Engine API is not discoverable from docs

The SKILL.md documents high-level capabilities but not actual method names. Run this to see real API:
```javascript
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(engine))
  .filter(m => typeof engine[m] === 'function');
console.log(methods);
```

Known working paths:
| Path | Returns |
|------|---------|
| `engine.emotion.process(input)` | PAD (pleasure/arousal/dominance) |
| `engine.analyzePsychology(input)` | Full cognitive psych analysis |
| `engine.thinkDeep(input)` | Deep reasoning chain |
| `engine.heal(description)` | Self-healing strategy |
| `engine.dispatch(subsystem, {action, input})` | Route to specific subsystem |
| `engine.thinkFast(input)` | Fast judgment |
| `engine.processEmotionally(input)` | Emotional processing |

## P3: MCP HTTP SSE connection drops

**Symptom**: MCP tools return "server is not connected" but `curl http://127.0.0.1:8099/health` returns `{"status":"ok"}`.

**Fix**: 
```bash
launchctl kickstart -k gui/501/com.heartflow.mcp-daemon
```
Or: `kill <PID>` — launchd auto-restarts it.

## P4: `execute_code` sandbox kills Node processes

`subprocess.run()` with timeout in the sandbox kills long-running Node scripts (engine startup ~70ms but `think()`/`analyzePsychology()` take 10-30s). Always use:
```python
import subprocess
proc = subprocess.Popen(["node", "/tmp/script.js"], cwd=HF_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
stdout, stderr = proc.communicate(timeout=30)
```
