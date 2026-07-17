# ModelScope 模型下载 → transformers.js 本地加载

## 流程

### 1. 搜索模型
```python
from modelscope.hub.api import HubApi
api = HubApi()
models = api.list_models('sentence-transformers')
# 找到 all-MiniLM-L6-v2 等模型
```

### 2. 下载模型
```python
from modelscope.hub.snapshot_download import snapshot_download
model_dir = snapshot_download('sentence-transformers/all-MiniLM-L6-v2', cache_dir='/tmp/modelscope')
```

### 3. 复制 ONNX 文件到 transformers.js 模型目录
```bash
MODEL_DIR="node_modules/@xenova/transformers/models/Xenova/all-MiniLM-L6-v2"
mkdir -p "$MODEL_DIR/onnx"

# 从 ModelScope 下载的 ONNX 文件
SRC="/tmp/modelscope/sentence-transformers/all-MiniLM-L6-v2/onnx"

# 重要：用原始 model.onnx（opset 兼容），不要用 O3/O4 优化版
# O3/O4 使用 opset 5，onnxruntime-node 只保证支持到 opset 3
cp "$SRC/model.onnx" "$MODEL_DIR/onnx/model_quantized.onnx"

# 复制配置文件
cp /tmp/modelscope/sentence-transformers/all-MiniLM-L6-v2/config.json "$MODEL_DIR/"
cp /tmp/modelscope/sentence-transformers/all-MiniLM-L6-v2/tokenizer.json "$MODEL_DIR/"
cp /tmp/modelscope/sentence-transformers/all-MiniLM-L6-v2/tokenizer_config.json "$MODEL_DIR/"
```

### 4. 配置 transformers.js 只用本地模型
```js
const { env } = require('@xenova/transformers');
env.allowRemoteModels = false;  // 禁止从 HuggingFace 下载
```

## ONNX 文件选择

ModelScope 提供多种 ONNX 优化版本：

| 文件 | 大小 | 说明 | 兼容性 |
|------|------|------|--------|
| model.onnx | 86MB | 原始版本，opset 兼容 | ✅ 全兼容 |
| model_O1.onnx | 86MB | O1 优化 | ✅ |
| model_O2.onnx | 86MB | O2 优化 | ⚠️ 可能 opset 不兼容 |
| model_O3.onnx | 86MB | O3 最高优化 | ❌ opset 5，不兼容 |
| model_O4.onnx | 45MB | fp16/int8 量化 | ❌ opset 5 |
| model_qint8_arm64.onnx | 23MB | 8bit 量化，ARM | ❌ opset 5 |
| model_quint8_avx2.onnx | 23MB | 8bit 量化，x86 | ❌ opset 5 |

**始终用 model.onnx（原始版本）**，其他优化版本 opset 不兼容 onnxruntime-node。

## 下载脚本

参考 `scripts/download-model.py`，自动化上述流程。
