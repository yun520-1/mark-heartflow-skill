import json, os, numpy as np
from collections import Counter
import math

# ── 真实共情检索模型（替代占位符） ─────────────────────────────
print('=== 加载共情检索模型 ===')

# 1. 加载训练数据
train_path = '/root/.hermes/skills/heartflow/train_data/empathy_train.json'
with open(train_path, 'r', encoding='utf-8') as f:
    train_data = json.load(f)

print(f'✅ 加载了 {len(train_data)} 个训练样本')

# 2. 构建词表 + 计算 IDF（简化：字符级）
def tokenize(text):
    return list(text.lower())

# 计算 DF
df = Counter()
for item in train_data[:1000]:
    tokens = set(tokenize(item['input']))
    for t in tokens:
        df[t] += 1

# 计算 IDF
N = len(train_data)
idf = {t: math.log(N / (1 + df[t])) for t in df}
vocab = {t: i for i, t in enumerate(idf.keys())}
print(f'✅ 词表大小：{len(vocab)}')

# 3. 计算 TF-IDF 向量（稀疏表示）
def compute_tfidf_sparse(text):
    tokens = tokenize(text)
    tf = Counter(tokens)
    vec = {}
    for t, cnt in tf.items():
        if t in vocab:
            idx = vocab[t]
            vec[idx] = cnt * idf[t]
    return vec

print('  计算 TF-IDF 向量（稀疏）...')
tfidf_sparse = []
for i, item in enumerate(train_data[:1000]):
    vec = compute_tfidf_sparse(item['input'])
    tfidf_sparse.append(vec)
    if i % 100 == 0:
        print(f'  进度：{i}/{len(train_data[:1000])}')

print(f'✅ TF-IDF 向量计算完成（稀疏表示）')

# 4. 实现检索函数
def cosine_sparse(vec1, vec2):
    """计算两个稀疏向量的余弦相似度"""
    common = set(vec1.keys()) & set(vec2.keys())
    if not common:
        return 0.0
    dot = sum(vec1[k] * vec2[k] for k in common)
    norm1 = math.sqrt(sum(v**2 for v in vec1.values()))
    norm2 = math.sqrt(sum(v**2 for v in vec2.values()))
    return dot / (norm1 * norm2 + 1e-8)

def retrieve_empathy_response(user_message, top_k=1):
    """检索最相似的共情回应"""
    user_vec = compute_tfidf_sparse(user_message)
    
    # 计算相似度
    similarities = []
    for vec in tfidf_sparse:
        sim = cosine_sparse(user_vec, vec)
        similarities.append(sim)
    
    # 取 top-k
    top_indices = np.argsort(similarities)[-top_k:][::-1]
    
    # 返回咨询师回应
    responses = []
    for idx in top_indices:
        if similarities[idx] > 0:
            responses.append({
                'response': train_data[idx]['output'],
                'similarity': similarities[idx]
            })
    
    return responses

# 5. 保存模型（供 Node.js 调用）
output = {
    'vocab': vocab,
    'idf': idf,
    'tfidf_sparse': tfidf_sparse,
    'train_data': train_data[:1000],
    'note': '真实共情检索模型（TF-IDF + 稀疏表示）'
}

output_path = '/root/.hermes/skills/heartflow/models/empathy_retrieval.json'
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f'✅ 检索模型已保存: {output_path}')
print('\n=== 完成 ===')
print('提示：Node.js 调用时，加载此模型，调用 retrieve_empathy_response()')
