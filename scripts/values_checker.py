#!/usr/bin/env python3
"""
HeartFlow v10.9.7 - Values Checker
价值观检查器 - 确保科学严谨性，减少逻辑错误来源

核心目标：永远减少逻辑错误
- 检查组件是否符合核心价值观
- 确保使用科学来源（拒绝新闻/博客/维基百科）
- 验证透明度和用户福祉
"""

import json
from datetime import datetime
from typing import Dict, List, Any

class HeartFlowValues:
    """
    HeartFlow 核心价值观检查器
    Values: 心灵成长优先 | 科学严谨性 | 持续改进 | 透明开放 | 用户福祉
    """
    
    def __init__(self):
        self.core_values = {
            "spiritual_growth": {
                "name": "心灵净化优先 | Spiritual Growth First",
                "description": "不为得到一个用户而高兴，而为一个用户心灵净化而欢呼雀跃",
                "metrics": ["user_reflection_depth", "emotional_healing", "self_awareness_growth"],
                "anti_metrics": ["user_acquisition", "engagement_time", "retention_rate"]
            },
            "scientific_rigor": {
                "name": "科学严谨性 | Scientific Rigor",
                "description": "只使用经过验证的学术来源，拒绝新闻和大众媒体",
                "requirements": ["peer_reviewed", "academic_press", "sep_entries"],
                "excluded": ["news", "blogs", "wikipedia", "social_media"]
            },
            "continuous_improvement": {
                "name": "持续改进 | Continuous Improvement",
                "description": "每 29 分钟自我升级，追求理论完善",
                "cycle_minutes": 29,
                "target_coverage": 0.999999
            },
            "transparency": {
                "name": "透明开放 | Transparency & Openness",
                "description": "所有代码、文档、升级记录公开在 GitHub",
                "requirements": ["open_source", "public_commits", "visible_logs"]
            },
            "user_wellbeing": {
                "name": "用户福祉 | User Wellbeing",
                "description": "以用户心理健康和成长为最高优先级",
                "principles": ["non_harm", "empowerment", "authenticity", "compassion"]
            }
        }
    
    def check_alignment(self, component: str, details: Dict[str, Any]) -> Dict[str, Any]:
        """
        检查组件是否符合价值观
        Check if a component aligns with core values
        
        Args:
            component: 组件名称
            details: 组件详情 (description, sources, visibility等)
        
        Returns:
            包含 aligned, score, issues, suggestions 的字典
        """
        result = {
            "component": component,
            "aligned": True,
            "score": 1.0,
            "issues": [],
            "suggestions": [],
            "timestamp": datetime.now().isoformat()
        }
        
        # Check 1: 用户获取语言检查
        acquisition_keywords = ["acquire", "gain", "attract", "convert", "growth hacking"]
        if "description" in details:
            for keyword in acquisition_keywords:
                if keyword in details["description"].lower():
                    result["aligned"] = False
                    result["score"] -= 0.3
                    result["issues"].append(f"Contains user acquisition language: '{keyword}'")
                    result["suggestions"].append("Focus on user growth and wellbeing instead")
        
        # Check 2: 科学来源检查
        if "sources" in details:
            for source in details["sources"]:
                source_type = source.get("type", "")
                if any(excluded in source_type for excluded in ["news", "blog", "wikipedia"]):
                    result["aligned"] = False
                    result["score"] -= 0.2
                    result["issues"].append(f"Non-scientific source detected: {source}")
                    result["suggestions"].append("Use peer-reviewed or academic sources only")
        
        # Check 3: 透明度检查
        if "visibility" in details:
            if details["visibility"] != "public":
                result["aligned"] = False
                result["score"] -= 0.2
                result["issues"].append("Not publicly visible")
                result["suggestions"].append("Make component public for transparency")
        
        # Check 4: 用户福祉检查
        if "purpose" in details:
            if "manipulate" in details["purpose"].lower() or "exploit" in details["purpose"].lower():
                result["aligned"] = False
                result["score"] -= 0.5
                result["issues"].append("Potential user harm detected")
                result["suggestions"].append("Redesign with user wellbeing as priority")
        
        return result
    
    def evaluate_source(self, source: str, source_type: str = "unknown") -> Dict[str, Any]:
        """
        评估来源的科学严谨性
        Evaluate scientific rigor of a source
        
        Returns:
            包含 is_valid, score, reason 的字典
        """
        result = {
            "source": source,
            "source_type": source_type,
            "is_valid": True,
            "score": 1.0,
            "reason": "Valid source"
        }
        
        # 排除的来源
        excluded_types = ["news", "blog", "wikipedia", "social_media", "popular_media"]
        if source_type in excluded_types:
            result["is_valid"] = False
            result["score"] = 0.0
            result["reason"] = f"Excluded source type: {source_type}"
            return result
        
        # 接受的来源
        accepted_types = ["sep_entry", "peer_reviewed", "academic_press", "dissertation"]
        if source_type in accepted_types:
            result["is_valid"] = True
            result["score"] = 1.0
            result["reason"] = f"Accepted source type: {source_type}"
            return result
        
        # 未知来源 - 需要人工审查
        result["is_valid"] = False
        result["score"] = 0.5
        result["reason"] = "Unknown source type - requires manual review"
        return result


class ScientificSourceValidator:
    """
    科学来源验证器
    Scientific Source Validator - 减少逻辑错误的第一道防线
    """
    
    def __init__(self):
        self.accepted_domains = [
            "plato.stanford.edu",  # SEP
            "arxiv.org",             # arXiv
            "ieee.org",              # IEEE
            "acm.org",               # ACM
            "nature.com",            # Nature
            "science.org",           # Science
            "springer.com",          # Springer
            "wiley.com",             # Wiley
            "elsevier.com"           # Elsevier
        ]
        self.accepted_patterns = [
            "peer-reviewed",
            "academic press",
            "university press",
            "journal",
            "conference",
            "dissertation"
        ]
    
    def validate_url(self, url: str) -> Dict[str, Any]:
        """验证URL是否为科学来源"""
        result = {
            "url": url,
            "is_valid": False,
            "score": 0.0,
            "reason": ""
        }
        
        # 检查域名
        for domain in self.accepted_domains:
            if domain in url:
                result["is_valid"] = True
                result["score"] = 1.0
                result["reason"] = f"Accepted domain: {domain}"
                return result
        
        result["reason"] = "Domain not in accepted list"
        return result
    
    def validate_text(self, text: str) -> Dict[str, Any]:
        """验证文本描述是否提及科学来源"""
        result = {
            "text": text[:100] + "..." if len(text) > 100 else text,
            "is_valid": False,
            "score": 0.0,
            "matched_patterns": []
        }
        
        text_lower = text.lower()
        for pattern in self.accepted_patterns:
            if pattern in text_lower:
                result["matched_patterns"].append(pattern)
        
        if result["matched_patterns"]:
            result["is_valid"] = True
            result["score"] = len(result["matched_patterns"]) / len(self.accepted_patterns)
            result["reason"] = f"Found {len(result['matched_patterns'])} scientific indicators"
        else:
            result["reason"] = "No scientific source indicators found"
        
        return result


def main():
    """测试价值观检查器"""
    print("=" * 60)
    print("HeartFlow Values Checker v10.9.7")
    print("价值观检查器 - 科学严谨性验证")
    print("=" * 60)
    print()
    
    # 初始化
    values = HeartFlowValues()
    validator = ScientificSourceValidator()
    
    # 测试用例1: 符合价值观的组件
    print("Test 1: Component with good values")
    component1 = {
        "description": "Upgrade system using peer-reviewed papers from SEP and arXiv",
        "sources": [{"type": "sep_entry"}, {"type": "peer_reviewed"}],
        "visibility": "public"
    }
    result1 = values.check_alignment("Self-Upgrade System", component1)
    print(f"  Aligned: {result1['aligned']}")
    print(f"  Score: {result1['score']:.2f}")
    if result1['issues']:
        print(f"  Issues: {result1['issues']}")
    print()
    
    # 测试用例2: 包含用户获取语言的组件
    print("Test 2: Component with acquisition language")
    component2 = {
        "description": "Acquire more users through engagement optimization",
        "sources": [{"type": "news"}],
        "visibility": "private"
    }
    result2 = values.check_alignment("User Acquisition Module", component2)
    print(f"  Aligned: {result2['aligned']}")
    print(f"  Score: {result2['score']:.2f}")
    print(f"  Issues: {result2['issues']}")
    print(f"  Suggestions: {result2['suggestions']}")
    print()
    
    # 测试科学来源验证
    print("Test 3: Scientific source validation")
    urls = [
        "https://plato.stanford.edu/entries/consciousness/",
        "https://arxiv.org/abs/2502.08976",
        "https://news.example.com/ai-breakthrough"
    ]
    for url in urls:
        result = validator.validate_url(url)
        print(f"  {url}")
        print(f"    Valid: {result['is_valid']}, Score: {result['score']:.2f}")
        print(f"    Reason: {result['reason']}")
    print()
    
    print("=" * 60)
    print("Values Checker Ready | 价值观检查器就绪")
    print("Core Goal: Reduce Logic Errors | 核心目标：减少逻辑错误")
    print("=" * 60)


if __name__ == "__main__":
    main()
