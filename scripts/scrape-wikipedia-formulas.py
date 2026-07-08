#!/usr/bin/env python3
"""
批量抓取 Wikipedia 数学/物理公式列表页面
来源：https://en.wikipedia.org/wiki/List_of_mathematical_formulas
      https://en.wikipedia.org/wiki/List_of_physics_formulas
"""

import requests
from bs4 import BeautifulSoup
import json
import time

print("=== 批量抓取 Wikipedia 公式列表 ===\n")

# Wikipedia 公式列表页面
pages = [
    {
        'title': 'List of mathematical formulas',
        'url': 'https://en.wikipedia.org/wiki/List_of_mathematical_formulas',
        'category': 'mathematics'
    },
    {
        'title': 'List of physics formulas',
        'url': 'https://en.wikipedia.org/wiki/List_of_physics_formulas',
        'category': 'physics'
    },
    {
        'title': 'List of equations in physics',
        'url': 'https://en.wikipedia.org/wiki/List_of_equations_in_physics',
        'category': 'physics'
    },
    {
        'title': 'List of laws in physics',
        'url': 'https://en.wikipedia.org/wiki/List_of_laws_in_physics',
        'category': 'physics'
    }
]

formulas = []

for page in pages:
    print(f"抓取页面: {page['title']}")
    print(f"  URL: {page['url']}")
    
    try:
        response = requests.get(page['url'], timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 提取页面中的所有公式（介于 <math> 标签）
            math_tags = soup.find_all('math')
            print(f"  ✅ 找到 {len(math_tags)} 个公式")
            
            for i, math_tag in enumerate(math_tags[:10]):  # 只取前 10 个示例
                formula_latex = math_tag.get_text(strip=True)
                
                formulas.append({
                    'id': f"{page['category']}_{len(formulas)}",
                    'name': f"{page['title']} - Formula {i+1}",
                    'category': page['category'],
                    'latex': formula_latex,
                    'source': page['url']
                })
            
            print(f"  ✅ 已提取 {min(10, len(math_tags))} 个公式")
        else:
            print(f"  ❌ HTTP {response.status_code}")
    
    except Exception as e:
        print(f"  ❌ 错误: {e}")
    
    print()
    time.sleep(1)  # 避免请求过快

# 保存为 JSON
output = {
    'metadata': {
        'version': '1.0.0',
        'source': 'Wikipedia',
        'total_formulas': len(formulas)
    },
    'formulas': formulas
}

output_file = '/root/.hermes/skills/heartflow/formulas/wikipedia_formulas.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"✅ 完成！共提取 {len(formulas)} 个公式")
print(f"   文件路径: {output_file}")
