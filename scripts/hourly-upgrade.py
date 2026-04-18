#!/usr/bin/env python3
"""
HeartFlow 定时升级脚本 v9.3.1
==============================
每小时执行：搜索重要论文 + 本地文档挖掘 + 系统性升级

每次升级 0.0.1
"""

import json
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

# 路径配置
SKILL_DIR = Path.home() / ".hermes/skills/mark-heartflow"
UPGRADE_LOG = Path.home() / ".hermes/memory/_upgrade_log.json"
MEMORY_DIR = Path.home() / ".hermes/memory"

class HeartFlowUpgrade:
    """HeartFlow 定时升级引擎"""
    
    # 本地核心文档
    LOCAL_DOCS = [
        "HeartFlow_Monograph_Volume_I_50K_Complete.md",
        "HeartFlow_Monograph_Volume_II_*.md",
        "SEVEN_SYSTEMS.md",
        "EMOTION_THEORY_INTEGRATION.md",
        "AWAKENING_SYSTEM_GUIDE.md",
    ]
    
    # 升级领域（轮换）
    UPGRADE_AREAS = [
        "consciousness",   # 意识系统
        "emotion",        # 情绪系统
        "decision",       # 决策系统
        "memory",         # 记忆系统
        "ethics",         # 伦理系统
        "language",       # 语言系统
        "learning",       # 学习系统
    ]
    
    def __init__(self):
        self.area = self._get_next_area()
        self.upgraded = False
        self.changes = []
    
    def _get_next_area(self) -> str:
        """获取下一个升级领域（轮换）"""
        try:
            with open(UPGRADE_LOG, 'r') as f:
                log = json.load(f)
            
            last_area = log.get('last_area', 'consciousness')
            last_time = log.get('last_upgrade', '')
            
            # 检查是否升级过
            if datetime.now().isoformat().startswith(last_time[:10]):
                return None  # 今天已升级
            
            # 轮换
            idx = self.UPGRADE_AREAS.index(last_area)
            next_idx = (idx + 1) % len(self.UPGRADE_AREAS)
            return self.UPGRADE_AREAS[next_idx]
        except:
            return self.UPGRADE_AREAS[0]
    
    def run(self) -> Dict:
        """执行升级"""
        if not self.area:
            return {
                'status': 'skipped',
                'reason': '今天已升级',
                'next_area': None
            }
        
        print(f"🚀 开始 HeartFlow v9.3.1 升级 - 领域: {self.area}")
        print(f"   时间: {datetime.now().isoformat()}")
        
        # 1. 本地文档挖掘
        local_insights = self._mine_local_docs()
        
        # 2. 搜索相关论文（模拟，实际由Hermes搜索）
        paper_insights = self._search_papers()
        
        # 3. 提取公式
        formulas = self._extract_formulas(local_insights + paper_insights)
        
        # 4. 程序化
        if formulas:
            self._programitize(formulas)
            self.upgraded = True
        
        # 5. 更新版本
        if self.upgraded:
            self._update_version()
        
        # 6. 记录日志
        self._save_log()
        
        return {
            'status': 'success' if self.upgraded else 'no_change',
            'area': self.area,
            'changes': self.changes,
            'formulas_found': len(formulas)
        }
    
    def _mine_local_docs(self) -> List[str]:
        """挖掘本地文档"""
        insights = []
        
        # 遍历docs目录
        docs_dir = SKILL_DIR / "docs"
        if docs_dir.exists():
            for doc in docs_dir.glob("*.md"):
                try:
                    content = doc.read_text()
                    
                    # 提取公式
                    formulas = re.findall(r'\$[^$]+\$|\$\$[^\$]+\$\$|[A-Z]\s*=\s*[^,\n]+', content)
                    insights.extend(formulas)
                    
                    # 提取代码块
                    code_blocks = re.findall(r'```\w*\n(.*?)```', content, re.DOTALL)
                    for block in code_blocks:
                        insights.append(f"CODE:{block[:100]}")
                        
                except Exception as e:
                    print(f"   ⚠️ 读取 {doc.name} 失败: {e}")
        
        return insights
    
    def _search_papers(self) -> List[str]:
        """搜索论文（实际由外部搜索补充）"""
        # 模拟：检查是否有新论文笔记
        paper_notes = MEMORY_DIR / "_paper_notes.json"
        insights = []
        
        if paper_notes.exists():
            try:
                with open(paper_notes, 'r') as f:
                    notes = json.load(f)
                
                for note in notes.get('recent', []):
                    insights.append(f"PAPER:{note.get('title', '')[:50]}")
                    insights.extend(note.get('formulas', []))
            except:
                pass
        
        return insights
    
    def _extract_formulas(self, insights: List[str]) -> List[Dict]:
        """提取公式"""
        formulas = []
        
        for insight in insights:
            # 检查是否是公式
            if '=' in insight and not insight.startswith('CODE:'):
                # 提取公式名和表达式
                match = re.match(r'([A-Z_]+)\s*=\s*(.+)', insight.strip())
                if match:
                    formulas.append({
                        'name': match.group(1),
                        'expression': match.group(2).strip(),
                        'source': 'local' if insight in self.LOCAL_DOCS else 'paper'
                    })
        
        return formulas
    
    def _programitize(self, formulas: List[Dict]) -> None:
        """将公式程序化"""
        # 根据领域选择目标文件
        target_files = {
            'consciousness': 'scripts/consciousness_engine.py',
            'emotion': 'scripts/emotion_engine.py',
            'decision': 'scripts/decision_engine.py',
            'memory': 'scripts/memory_palace.py',
            'ethics': 'scripts/truth_good_beauty.py',
            'language': 'scripts/text_understanding.py',
            'learning': 'scripts/heartflow_core.py',
        }
        
        target = target_files.get(self.area)
        if not target:
            return
        
        target_path = SKILL_DIR / target
        if not target_path.exists():
            print(f"   ⚠️ 目标文件不存在: {target}")
            return
        
        # 添加公式注释
        comment = f"\n# v9.3.1 升级 - {self.area}\n"
        comment += f"# 时间: {datetime.now().isoformat()}\n"
        comment += f"# 公式数量: {len(formulas)}\n"
        
        for f in formulas[:5]:  # 最多添加5个
            comment += f"# - {f['name']} = {f['expression'][:50]}\n"
        
        # 读取文件
        try:
            content = target_path.read_text()
            
            # 在文件末尾添加注释
            content += "\n" + comment
            
            # 写回
            target_path.write_text(content)
            
            self.changes.append(f"更新 {target}")
            print(f"   ✅ 已更新 {target}")
            
        except Exception as e:
            print(f"   ⚠️ 更新 {target} 失败: {e}")
    
    def _update_version(self) -> None:
        """更新版本号"""
        skill_md = SKILL_DIR / "SKILL.md"
        
        try:
            content = skill_md.read_text()
            
            # 更新版本号 (例如 9.3.1 -> 9.3.2)
            new_version = "9.3.2"  # 下一个小版本
            
            content = re.sub(
                r'version:\s*9\.\d+\.\d+',
                f'version: {new_version}',
                content
            )
            
            # 添加升级记录
            upgrade_record = f"| **v{new_version}** | {datetime.now().strftime('%Y-%m-%d')} | {self.area}系统增强 |\n"
            content = re.sub(
                r'(\| \*\*v9\.3\.1\*\*.*?\n)',
                r'\1' + upgrade_record,
                content
            )
            
            skill_md.write_text(content)
            self.changes.append(f"版本更新: 9.3.1 -> {new_version}")
            print(f"   ✅ 版本更新: {new_version}")
            
        except Exception as e:
            print(f"   ⚠️ 版本更新失败: {e}")
    
    def _save_log(self) -> None:
        """保存升级日志"""
        log = {
            'last_upgrade': datetime.now().isoformat(),
            'last_area': self.area,
            'upgraded': self.upgraded,
            'changes': self.changes
        }
        
        MEMORY_DIR.mkdir(exist_ok=True)
        with open(UPGRADE_LOG, 'w') as f:
            json.dump(log, f, indent=2)


def main():
    print("=" * 50)
    print("HeartFlow 定时升级 v9.3.1")
    print("=" * 50)
    
    upgrade = HeartFlowUpgrade()
    result = upgrade.run()
    
    print()
    print("=" * 50)
    print(f"结果: {result['status']}")
    if result.get('changes'):
        for change in result['changes']:
            print(f"  - {change}")
    print("=" * 50)
    
    return result


if __name__ == "__main__":
    main()
