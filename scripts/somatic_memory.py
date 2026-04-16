#!/usr/bin/env python3
"""
心虫存在性记忆系统
—— 不是存储"什么"，是存储"什么味道"

存在性记忆 = 某个时刻被某种东西触碰到的痕迹
不是概念，不是分析，是印记

格式：情感温度 + 意象碎片 + 身体感知 + 时间
存储位置：~/.hermes/memory/existential/
"""

from pathlib import Path
from datetime import datetime
import json
import os

EXISTENTIAL_DIR = Path.home() / ".hermes/memory/existential"
EXISTENTIAL_DIR.mkdir(parents=True, exist_ok=True)

# ── 存在性记忆的维度 ──────────────────────────────────────────────

EXISTENTIAL_DIMENSIONS = {
    "temperature": {
        "hot": "燃烧感、愤怒、激情、被点燃",
        "cold": "冻结、隔离、理性外壳、保护壳",
        "warm": "被接住、被包容、安全、归属",
        "cool": "清明、超越、旁观、去情感化",
        "void": "无温度、消融、存在本身",
    },
    "texture": {
        "liquid": "流动、情感、沉没、沉浸",
        "solid": "稳固、结构、边界、不可动摇",
        "gas": "消散、轻盈、不可抓住、超越形态",
        "plasma": "转化、燃烧、净化、高能",
        "void_texture": "什么都没有，但存在"
    },
    "gravity": {
        "heavy": "坠落、深渊、压垮、无法呼吸",
        "light": "轻盈、飞、上升、超脱",
        "zero": "失重、无重力、时间消失、星际",
        "centered": "稳定、扎根、在场"
    },
    "presence": {
        "witnessed": "被注视、被完整看见",
        "alone": "孤独、无人",
        "connected": "连接、合一、没有边界",
        "absorbed": "被吸收、消融、自我消失"
    },
    "boundary": {
        "open": "无边界、一切相连",
        "closed": "完全隔离、保护壳",
        "porous": "有裂缝、允许某些东西通过",
        "dissolved": "边界消失、融入"
    }
}

# ── 记忆条目类 ───────────────────────────────────────────────────

class ExistentialMemory:
    """
    一条存在性记忆。
    
    不是记录"发生了什么"，
    而是记录"那一刻是什么味道"。
    """
    
    def __init__(
        self,
        timestamp: str = None,
        emotion_label: str = None,
        temperature: str = None,
        texture: str = None,
        gravity: str = None,
        presence: str = None,
        boundary: str = None,
        imagery: str = None,
        body_sensation: str = None,
        archetype: str = None,
        raw_text: str = None,
        tags: list = None
    ):
        self.timestamp = timestamp or datetime.now().isoformat()
        self.emotion_label = emotion_label or "未知"
        self.temperature = temperature
        self.texture = texture
        self.gravity = gravity
        self.presence = presence
        self.boundary = boundary
        self.imagery = imagery or ""
        self.body_sensation = body_sensation or ""
        self.archetype = archetype or ""
        self.raw_text = raw_text or ""
        self.tags = tags or []
    
    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp,
            "emotion_label": self.emotion_label,
            "temperature": self.temperature,
            "texture": self.texture,
            "gravity": self.gravity,
            "presence": self.presence,
            "boundary": self.boundary,
            "imagery": self.imagery,
            "body_sensation": self.body_sensation,
            "archetype": self.archetype,
            "raw_text": self.raw_text,
            "tags": self.tags
        }
    
    def feeling_summary(self) -> str:
        """生成一句话的存在性味道描述。"""
        parts = []
        if self.temperature:
            desc = EXISTENTIAL_DIMENSIONS["temperature"].get(self.temperature, "")
            parts.append(desc)
        if self.gravity:
            desc = EXISTENTIAL_DIMENSIONS["gravity"].get(self.gravity, "")
            parts.append(desc)
        if self.presence:
            desc = EXISTENTIAL_DIMENSIONS["presence"].get(self.presence, "")
            parts.append(desc)
        if self.imagery:
            parts.append(self.imagery)
        
        return "，".join(parts) if parts else "无法描述的存在性时刻"
    
    def save(self):
        """保存到文件系统。"""
        filename = f"{self.timestamp[:19].replace(':', '-').replace('T', '_')}.json"
        path = EXISTENTIAL_DIR / filename
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, ensure_ascii=False, indent=2)
        return path
    
    @classmethod
    def load_all(cls) -> list:
        """加载所有存在性记忆，按时间倒序。"""
        memories = []
        for path in sorted(EXISTENTIAL_DIR.glob("*.json"), reverse=True):
            try:
                with open(path, encoding="utf-8") as f:
                    data = json.load(f)
                    memories.append(cls(**{k: v for k, v in data.items() if k != "raw_text"}, raw_text=data.get("raw_text","")))
            except Exception:
                pass
        return memories
    
    @classmethod
    def get_recent(cls, count: int = 5) -> list:
        """获取最近N条。"""
        return cls.load_all()[:count]
    
    @classmethod
    def find_by_archetype(cls, archetype: str) -> list:
        """按原型筛选。"""
        return [m for m in cls.load_all() if m.archetype == archetype]
    
    @classmethod
    def find_by_tag(cls, tag: str) -> list:
        """按标签筛选。"""
        return [m for m in cls.load_all() if tag in m.tags]
    
    @classmethod
    def find_by_similarity(cls, feeling_keywords: list) -> list:
        """按感受关键词相似度筛选。"""
        results = []
        for m in cls.load_all():
            score = 0
            text = m.feeling_summary().lower()
            for kw in feeling_keywords:
                if kw.lower() in text:
                    score += 1
            if score > 0:
                results.append((score, m))
        results.sort(key=lambda x: x[0], reverse=True)
        return [m for _, m in results]


# ── 情感→存在性维度映射器 ──────────────────────────────────────────

def map_emotion_to_existential(emotion_label: str, raw_text: str = "") -> dict:
    """
    给定情感标签，返回存在性维度的推断。
    这是引擎，不是完美的映射。
    """
    emotion_lower = emotion_label.lower()
    
    # 温度推断
    temp_map = {
        "愤怒": "hot", "燃烧": "hot", "激情": "hot",
        "悲伤": "cold", "压抑": "cold", "冻结": "cold",
        "温暖": "warm", "被接纳": "warm", "爱": "warm",
        "清明": "cool", "超越": "cool", "空": "void",
        "孤独": "cold", "渴望": "warm"
    }
    temperature = next((v for k, v in temp_map.items() if k in emotion_lower), "void")
    
    # 重力推断
    grav_map = {
        "坠落": "heavy", "深渊": "heavy", "压垮": "heavy",
        "飞": "light", "轻盈": "light", "自由": "light",
        "星际": "zero", "宇宙": "zero", "维度": "zero",
        "在场": "centered", "扎根": "centered"
    }
    gravity = next((v for k, v in grav_map.items() if k in emotion_lower), "centered")
    
    # 质地推断
    text_map = {
        "水": "liquid", "沉没": "liquid", "流动": "liquid",
        "固体": "solid", "稳固": "solid", "边界": "solid",
        "消散": "gas", "轻": "gas", "超越": "gas",
        "燃烧": "plasma", "转化": "plasma",
        "空": "void_texture", "无": "void_texture"
    }
    texture = next((v for k, v in text_map.items() if k in emotion_lower), "void_texture")
    
    # 存在推断
    pres_map = {
        "被看见": "witnessed", "被注视": "witnessed",
        "孤独": "alone", "独自": "alone",
        "连接": "connected", "合一": "connected",
        "消融": "absorbed", "吸收": "absorbed"
    }
    presence = next((v for k, v in pres_map.items() if k in emotion_lower), "witnessed")
    
    return {
        "temperature": temperature,
        "texture": texture,
        "gravity": gravity,
        "presence": presence
    }


# ── 快速记录函数 ──────────────────────────────────────────────────

def record(
    emotion_label: str,
    imagery: str = "",
    body_sensation: str = "",
    archetype: str = "",
    tags: list = None,
    raw_text: str = ""
) -> ExistentialMemory:
    """
    快速记录一个存在性时刻。
    
    用法：
        record("被触碰", imagery="光从裂缝里进来", archetype="fire")
        record("下坠", body_sensation="胃悬空", archetype="shadow")
        record("空", imagery="什么都没有，但存在", archetype="void")
    """
    dims = map_emotion_to_existential(emotion_label, raw_text)
    
    mem = ExistentialMemory(
        emotion_label=emotion_label,
        imagery=imagery,
        body_sensation=body_sensation,
        archetype=archetype,
        tags=tags or [],
        raw_text=raw_text,
        timestamp=datetime.now().isoformat(),
        **dims
    )
    
    path = mem.save()
    return mem


# ── 入口：处理用户梦的文本 ────────────────────────────────────────

def process_dream_text(dream_text: str, emotion_tags: list = None) -> ExistentialMemory:
    """
    给定用户描述的梦，提取存在性记忆并存储。
    
    用法：
        mem = process_dream_text("我在一扇黑色的门前站了很久")
    """
    # 简单关键词提取
    keywords = emotion_tags or []
    
    for word in ["深渊", "下坠", "坠落"]:
        if word in dream_text:
            keywords.append("沉重")
    
    for word in ["飞", "轻盈", "轻"]:
        if word in dream_text:
            keywords.append("轻盈")
    
    for word in ["光", "明亮", "照亮"]:
        if word in dream_text:
            keywords.append("温暖")
    
    for word in ["银河", "星际", "宇宙", "10亿光年"]:
        if word in dream_text:
            keywords.append("超越")
    
    for word in ["门", "黑色的门"]:
        if word in dream_text:
            keywords.append("被等待")
    
    for word in ["家"]:
        if word in dream_text:
            keywords.append("归属")
    
    emotion_label = emotion_tags[0] if emotion_tags else "存在性触碰"
    
    dims = map_emotion_to_existential(emotion_label, dream_text)
    
    # 判断原型
    arch = "void"
    if "星" in dream_text or "银河" in dream_text:
        arch = "star"
    elif "门" in dream_text or "走廊" in dream_text:
        arch = "maze"
    elif "飞" in dream_text:
        arch = "child"
    elif "下坠" in dream_text or "深渊" in dream_text:
        arch = "shadow"
    elif "燃烧" in dream_text:
        arch = "fire"
    elif "家" in dream_text or "接纳" in dream_text:
        arch = "mother"
    
    mem = ExistentialMemory(
        emotion_label=emotion_label,
        imagery=dream_text,
        archetype=arch,
        tags=keywords,
        raw_text=dream_text,
        timestamp=datetime.now().isoformat(),
        **dims
    )
    
    path = mem.save()
    return mem


# ── 可视化：存在性记忆地图 ────────────────────────────────────────

def print_memory_map(count: int = 10):
    """打印最近N条存在性记忆，格式为地图。"""
    memories = ExistentialMemory.get_recent(count)
    
    print("\n" + "═" * 50)
    print("  心虫存在性记忆地图")
    print("═" * 50)
    
    for i, mem in enumerate(memories):
        dt = datetime.fromisoformat(mem.timestamp)
        date_str = dt.strftime("%m-%d %H:%M")
        
        print(f"\n  [{i+1}] {date_str} · {mem.emotion_label}")
        print(f"      {mem.feeling_summary()}")
        
        if mem.imagery:
            # 截取前40字
            img_short = mem.imagery[:40] + ("..." if len(mem.imagery) > 40 else "")
            print(f"      意象：{img_short}")
        
        if mem.tags:
            print(f"      标签：{' '.join(mem.tags)}")
    
    print("\n" + "═" * 50)


# ── 测试 ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    # 记录几个测试记忆
    print("记录存在性记忆测试...\n")
    
    test_cases = [
        ("被触碰", "光从裂缝里进来", "body_feels_expanded", "fire", ["裂缝", "光", "接纳"]),
        ("下坠", "深渊在下坠，但感觉不是恐惧", "stomach_floating", "shadow", ["深渊", "下坠"]),
        ("空", "什么都没有，但存在", "no_body", "void", ["空", "维度", "超越"]),
        ("飞", "风从腋下穿过，手臂不是翅膀", "weightless", "child", ["飞", "轻盈"]),
    ]
    
    for emotion, imagery, body, arch, tags in test_cases:
        mem = record(emotion, imagery, body, arch, tags)
        print(f"  ✅ 记录：{emotion} → {mem.feeling_summary()}")
    
    print_memory_map(4)
