#!/usr/bin/env python3
"""
从 ModelScope 下载 all-MiniLM-L6-v2 模型并转换为 ONNX 格式，
放入心虫的本地模型目录，供 @xenova/transformers 加载。

使用方法：
  python3 scripts/download-model.py
  
模型将下载到: src/core/search/models/ 目录
"""

import os
import sys
import json
import shutil

MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2'
TARGET_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                          '..', 'src', 'core', 'search', 'models', 'all-MiniLM-L6-v2')

def download_from_modelscope():
    """从 ModelScope 下载模型"""
    print(f'[download-model] 从 ModelScope 下载 {MODEL_NAME} ...')
    from modelscope.hub.snapshot_download import snapshot_download
    
    model_dir = snapshot_download(MODEL_NAME, cache_dir='/tmp/modelscope')
    print(f'[download-model] 下载完成: {model_dir}')
    
    # 列出所有文件
    files = []
    for root, dirs, filenames in os.walk(model_dir):
        for f in filenames:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, model_dir)
            size = os.path.getsize(full)
            files.append((rel, size))
            print(f'  {rel} ({size/1024/1024:.1f}MB)' if size > 1024*1024 else f'  {rel}')
    
    return model_dir

def convert_to_onnx(model_dir, target_dir):
    """将模型文件复制并组织为 transformers.js 可用的 ONNX 格式"""
    os.makedirs(target_dir, exist_ok=True)
    
    # transformers.js 需要的文件：
    # 1. model.onnx (ONNX 模型文件)
    # 2. config.json (模型配置)
    # 3. tokenizer.json (分词器)
    # 4. special_tokens_map.json (特殊token映射)
    
    # 从下载目录找到 ONNX 文件
    onnx_dir = os.path.join(model_dir, 'onnx')
    if os.path.exists(onnx_dir):
        # 使用优化级别 O2 或 O3（量化的 ONNX）
        onnx_files = [f for f in os.listdir(onnx_dir) if f.endswith('.onnx')]
        # 优先使用 O3（最高优化），其次 O2，最后 model.onnx
        preferred = ['model_O3.onnx', 'model_O2.onnx', 'model.onnx']
        chosen = None
        for p in preferred:
            if p in onnx_files:
                chosen = p
                break
        if not chosen and onnx_files:
            chosen = onnx_files[0]
        
        if chosen:
            src = os.path.join(onnx_dir, chosen)
            dst = os.path.join(target_dir, 'model.onnx')
            shutil.copy2(src, dst)
            print(f'[download-model] ONNX 模型: {chosen} → {dst}')
    
    # 复制配置文件
    for fname in ['config.json', 'tokenizer.json', 'tokenizer_config.json', 
                  'special_tokens_map.json', 'config_sentence_transformers.json']:
        src = os.path.join(model_dir, fname)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(target_dir, fname))
    
    # 创建 transformers.js 需要的配置
    # 告诉 transformers.js 这是一个 ONNX 模型
    config = {
        'model_type': 'bert',
        'architectures': ['BertModel'],
        'hidden_size': 384,
        'max_position_embeddings': 512,
        'num_attention_heads': 6,
        'num_hidden_layers': 6,
        'vocab_size': 30522,
        'onnx': True
    }
    with open(os.path.join(target_dir, 'config.json'), 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f'[download-model] 模型已保存到: {target_dir}')
    print(f'[download-model] 文件列表:')
    for f in os.listdir(target_dir):
        fp = os.path.join(target_dir, f)
        print(f'  {f} ({os.path.getsize(fp)/1024/1024:.1f}MB)' if os.path.getsize(fp) > 1024*1024 else f'  {f}')

def main():
    print(f'[download-model] 目标目录: {TARGET_DIR}')
    
    if not os.path.exists(TARGET_DIR) or len(os.listdir(TARGET_DIR)) < 3:
        model_dir = download_from_modelscope()
        convert_to_onnx(model_dir, TARGET_DIR)
        print(f'[download-model] ✅ 下载完成')
    else:
        print(f'[download-model] 模型已存在，跳过下载')
    
    # 打印使用方式
    print()
    print(f'[download-model] 使用方式:')
    print(f'  const {{ SemanticSearch }} = require("./search/semantic-search.js");')
    print(f'  const ss = new SemanticSearch({{\n    modelPath: require("path").join(__dirname, "search/models/all-MiniLM-L6-v2")\n  }});')

if __name__ == '__main__':
    main()
