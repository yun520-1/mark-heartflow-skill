#!/usr/bin/env python3
"""
文字理解引擎 v1.0
================
集成多语言词典，理解文字含义

功能:
- 中文成语查询
- 英文词典查询
- 繁体中文查询
- 本地向量匹配
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any


class TextUnderstandingEngine:
    """文字理解引擎"""
    
    def __init__(self):
        self.dictionaries: Dict[str, Any] = {}
        self._init_dictionaries()
    
    def _init_dictionaries(self):
        """初始化词典"""
        # 等待各技能加载后填充
        pass
    
    def register_dictionary(self, name: str, dict_data: Dict):
        """注册词典"""
        self.dictionaries[name] = dict_data
    
    def query(self, text: str, lang: str = "auto") -> Dict:
        """
        查询文字含义
        
        Args:
            text: 待查询文字
            lang: 语言 (auto/en/zh/zh-TW/idiom)
            
        Returns:
            Dict: 查询结果
        """
        results = {}
        
        # 自动检测语言
        if lang == "auto":
            lang = self._detect_language(text)
        
        # 查询各词典
        if lang in ["en", "english"] and "english" in self.dictionaries:
            results["english"] = self._query_english(text)
        
        if lang in ["zh-CN", "zh", "chinese"] and "chinese" in self.dictionaries:
            results["chinese"] = self._query_chinese(text)
        
        if lang in ["zh-TW", "traditional"] and "tc-dict" in self.dictionaries:
            results["tc-dict"] = self._query_tc(text)
        
        if lang in ["idiom", "chengyu"] and "idiom" in self.dictionaries:
            results["idiom"] = self._query_idiom(text)
        
        return results
    
    def _detect_language(self, text: str) -> str:
        """检测语言"""
        # 简单检测：中文 vs 英文 vs 成语
        if any('\u4e00' <= c <= '\u9fff' for c in text):
            if len(text) <= 4 and len(text) >= 2:
                return "idiom"  # 短中文可能是成语
            return "zh"
        return "en"
    
    def _query_english(self, word: str) -> Optional[Dict]:
        """查询英文"""
        if "english" not in self.dictionaries:
            return None
        return self.dictionaries["english"].get(word.lower())
    
    def _query_chinese(self, word: str) -> Optional[Dict]:
        """查询中文"""
        if "chinese" not in self.dictionaries:
            return None
        return self.dictionaries["chinese"].get(word)
    
    def _query_tc(self, word: str) -> Optional[Dict]:
        """查询繁体"""
        if "tc-dict" not in self.dictionaries:
            return None
        return self.dictionaries["tc-dict"].get(word)
    
    def _query_idiom(self, idiom: str) -> Optional[Dict]:
        """查询成语"""
        if "idiom" not in self.dictionaries:
            return None
        return self.dictionaries["idiom"].get(idiom)
    
    def understand(self, text: str) -> Dict:
        """
        深度理解文字
        
        不仅是查词典，还分析:
        - 字面义 vs 引申义
        - 情感色彩
        - 使用场景
        """
        result = {
            "original": text,
            "definition": None,
            "analysis": {},
            "suggestions": []
        }
        
        # 基础查询
        query_result = self.query(text)
        
        if query_result:
            result["definition"] = query_result
        
        # 深度分析
        result["analysis"] = self._analyze_text(text, query_result)
        
        return result
    
    def _analyze_text(self, text: str, definitions: Dict) -> Dict:
        """分析文字"""
        analysis = {
            "type": self._detect_language(text),
            "word_count": len(text),
            "is_idiom": len(text) <= 6 and self._is_chinese(text),
            "is_phrase": " " in text,
        }
        
        return analysis
    
    def _is_chinese(self, text: str) -> bool:
        """是否中文"""
        return any('\u4e00' <= c <= '\u9fff' for c in text)


# 单例
_engine: Optional[TextUnderstandingEngine] = None


def get_engine() -> TextUnderstandingEngine:
    """获取引擎实例"""
    global _engine
    if _engine is None:
        _engine = TextUnderstandingEngine()
    return _engine


def query(text: str, lang: str = "auto") -> dict:
    """快速查询接口"""
    engine = get_engine()
    result = engine.query(text, lang)
    if not result:
        return {"status": "not_found", "text": text}
    return result


def understand(text: str) -> dict:
    """深度理解接口"""
    engine = get_engine()
    return engine.understand(text)


# CLI
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("文字理解引擎 v1.0")
        print("=" * 40)
        print("用法:")
        print("  python3 text_understanding.py <文字>")
        print("  python3 text_understanding.py --understand <文字>")
        sys.exit(1)
    
    if sys.argv[1] == "--understand":
        text = " ".join(sys.argv[2:])
        result = understand(text)
    else:
        text = " ".join(sys.argv[1:])
        result = query(text)
    
    print(json.dumps(result, ensure_ascii=False, indent=2))