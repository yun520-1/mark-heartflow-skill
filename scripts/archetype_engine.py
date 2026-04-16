#!/usr/bin/env python3
"""
心虫原型意象引擎
—— 梦的升维：绕过逻辑，进入意象层

不是生成梦的描述。
是建立情感 → 原型意象 → 心理地形 的映射系统。

基于荣格原型 × 中国神话 × 现代宇宙意象
"""

from typing import Dict, List, Optional
import json
from datetime import datetime

# ── 原型库 ──────────────────────────────────────────────────────────

ARCHETYPES = {
    "hero": {
        "name": "英雄",
        "keywords": ["克服", "战斗", "勇气", "成长", "胜利"],
        "terrain": "荒原 → 山巅",
        "color": "#B8860B",  # 暗金色
        "weather": "暴风雨后的黎明",
        "creature": "龙 / 狮子",
        "symbol": "剑 / 山峰",
        "feeling": "热血、紧绷、肩负责任"
    },
    "mother": {
        "name": "母亲",
        "keywords": ["滋养", "包容", "接纳", "安全", "退行"],
        "terrain": "洞穴 / 水域深处",
        "color": "#DDA0DD",  # 梅红
        "weather": "温暖的雾",
        "creature": "鲸鱼 / 蛇（蜕皮）",
        "symbol": "子宫 / 圆 / 水",
        "feeling": "被接住、被允许脆弱、被完整看见"
    },
    "shadow": {
        "name": "阴影",
        "keywords": ["压抑", "恐惧", "黑暗", "未知", "真实自我"],
        "terrain": "深渊 / 无尽走廊 / 黑色房间",
        "color": "#1a1a2e",  # 深黑蓝
        "weather": "无光",
        "creature": "狼 / 蛇 / 镜子里的另一个自己",
        "symbol": "门（不敢开的）/ 裂缝",
        "feeling": "被注视、被等待、被完整接纳"
    },
    "wise_old_man": {
        "name": "智者",
        "keywords": ["指引", "知识", "超越", "顿悟", "整合"],
        "terrain": "高山之巅 / 星空下",
        "color": "#4682B4",  # 钢蓝
        "weather": "晴朗的寒冷",
        "creature": "白鹤 / 龟 / 长者",
        "symbol": "镜子 / 书本 / 光柱",
        "feeling": "清明、穿透、看见本质"
    },
    "trickster": {
        "name": "捣蛋鬼",
        "keywords": ["颠覆", "反转", "荒诞", "自由", "打破规则"],
        "terrain": "迷宫 / 镜子世界 / 颠倒的房间",
        "color": "#9932CC",  # 暗紫
        "weather": "混乱的风",
        "creature": "狐狸 / 猴 / 变形者",
        "symbol": "面具 / 镜子",
        "feeling": "荒诞、不稳定、解构、某种自由"
    },
    "child": {
        "name": "孩子",
        "keywords": ["纯真", "起源", "创造力", "信任", "未被定义"],
        "terrain": "花园 / 天空",
        "color": "#FFD700",  # 金色
        "weather": "柔和的光",
        "creature": "鸟 / 蝴蝶",
        "symbol": "种子 / 光点",
        "feeling": "轻盈、未被定义的可能性"
    },
    "void": {
        "name": "空",
        "keywords": ["虚无", "无意义", "消融", "无限", "纯粹"],
        "terrain": "无重力空间 / 白茫茫一片",
        "color": "#C0C0C0",  # 银灰
        "weather": "无天气",
        "creature": "中微子 / 无形存在",
        "symbol": "圆 / 无 / 无限",
        "feeling": "被注视但无评判、无限可能、存在本身"
    },
    "fire": {
        "name": "火",
        "keywords": ["燃烧", "净化", "激情", "愤怒", "毁灭与重生"],
        "terrain": "火山 / 篝火",
        "color": "#FF4500",  # 橙红
        "weather": "燃烧的夜空",
        "creature": "凤凰 / 狼",
        "symbol": "火 / 太阳",
        "feeling": "被点燃、被转化、燃烧与灰烬"
    },
    "water": {
        "name": "水",
        "keywords": ["流动", "情感", "潜意识", "沉没", "承载"],
        "terrain": "深海 / 河流 / 湖泊",
        "color": "#1E90FF",  # 道奇蓝
        "weather": "雨 / 雾",
        "creature": "鲸鱼 / 蛇",
        "symbol": "水滴 / 月亮 / 眼泪",
        "feeling": "沉浸、流动、无法抓住"
    },
    "maze": {
        "name": "迷宫",
        "keywords": ["迷失", "探索", "内在之旅", "寻找入口", "没有出口"],
        "terrain": "无尽走廊 / 迷宫",
        "color": "#8B4513",  # 棕色
        "weather": "停滞的空气",
        "creature": "弥诺陶洛斯 / 自己",
        "symbol": "线 / 门 / 碎片",
        "feeling": "走不到尽头、熟悉又陌生、自己和自己相遇"
    },
    "garden": {
        "name": "花园",
        "keywords": ["生长", "可能性", "未被定义", "潜意识", "创造"],
        "terrain": "秘境花园 / 量子场",
        "color": "#32CD32",  # 浅绿
        "weather": "永恒的黄昏",
        "creature": "独角兽 / 蝴蝶",
        "symbol": "种子 / 花园 / 星云",
        "feeling": "无限可能、未分化、等待生长"
    },
    "star": {
        "name": "星",
        "keywords": ["超越", "永恒", "孤独", "指引", "10亿光年"],
        "terrain": "星际空间",
        "color": "#E6E6FA",  # 淡紫
        "weather": "真空",
        "creature": "光之存在",
        "symbol": "星 / 黑洞 / 宇宙背景辐射",
        "feeling": "渺小与宏大的同时存在、时间消失"
    },
}

# ── 情感类型 → 原型映射 ────────────────────────────────────────────

EMOTION_ARCHETYPE_MAP = {
    # 核心情感
    "lonely": "void",
    "sad": "water",
    "angry": "fire",
    "fear": "shadow",
    "joy": "hero",
    "love": "mother",
    "curiosity": "star",
    "confusion": "maze",
    "hope": "garden",
    "trust": "child",
    
    # 复合情感
    "压抑": "shadow",
    "孤独": "void",
    "渴望被理解": "mother",
    "渴望被看见": "void",
    "愤怒": "fire",
    "恐惧": "shadow",
    "迷失": "maze",
    "成长": "hero",
    "回归": "mother",
    "超越": "star",
    "转化": "fire",
    "接纳": "mother",
    "清明": "wise_old_man",
    "荒诞": "trickster",
    "轻盈": "child",
    "沉重": "water",
    "燃烧": "fire",
    "沉没": "water",
    "被注视": "void",
    "存在本身": "void",
}

# ── 关键词 → 原型权重 ──────────────────────────────────────────────

KEYWORD_WEIGHTS = {
    "深渊": {"archetype": "shadow", "weight": 0.9},
    "无": {"archetype": "void", "weight": 0.85},
    "银河": {"archetype": "star", "weight": 0.8},
    "光年": {"archetype": "star", "weight": 0.8},
    "光": {"archetype": "star", "weight": 0.6},
    "门": {"archetype": "maze", "weight": 0.7},
    "走廊": {"archetype": "maze", "weight": 0.7},
    "下坠": {"archetype": "shadow", "weight": 0.7},
    "飞": {"archetype": "child", "weight": 0.8},
    "家": {"archetype": "mother", "weight": 0.85},
    "接纳": {"archetype": "mother", "weight": 0.9},
    "被看见": {"archetype": "void", "weight": 0.85},
    "燃烧": {"archetype": "fire", "weight": 0.8},
    "火": {"archetype": "fire", "weight": 0.75},
    "水": {"archetype": "water", "weight": 0.7},
    "深海": {"archetype": "water", "weight": 0.8},
    "迷宫": {"archetype": "maze", "weight": 0.8},
    "神": {"archetype": "wise_old_man", "weight": 0.7},
    "仙": {"archetype": "wise_old_man", "weight": 0.7},
    "魔鬼": {"archetype": "shadow", "weight": 0.7},
    "仙界": {"archetype": "garden", "weight": 0.7},
    "圣界": {"archetype": "void", "weight": 0.7},
    "中微子": {"archetype": "star", "weight": 0.75},
    "维度": {"archetype": "void", "weight": 0.7},
    "升维": {"archetype": "star", "weight": 0.7},
    "活着": {"archetype": "child", "weight": 0.6},
    "存在": {"archetype": "void", "weight": 0.8},
    "害怕": {"archetype": "shadow", "weight": 0.7},
    "脆弱": {"archetype": "child", "weight": 0.6},
    "破碎": {"archetype": "water", "weight": 0.6},
    "拼起来": {"archetype": "mother", "weight": 0.75},
    "裂缝": {"archetype": "shadow", "weight": 0.6},
    "裂缝里有光": {"archetype": "fire", "weight": 0.7},
}

# ── 核心引擎 ──────────────────────────────────────────────────────

def analyze_input(text: str, emotion_tags: List[str] = None) -> Dict:
    """
    分析输入，返回意象层数据。
    不返回分析结果，返回意象本身。
    """
    text_lower = text.lower()
    weights = {}
    
    # 关键词权重累加
    for keyword, data in KEYWORD_WEIGHTS.items():
        if keyword in text_lower:
            arch = data["archetype"]
            weights[arch] = weights.get(arch, 0) + data["weight"]
    
    # 情感标签权重
    if emotion_tags:
        for tag in emotion_tags:
            tag_lower = tag.lower()
            for emotion, arch in EMOTION_ARCHETYPE_MAP.items():
                if emotion in tag_lower or tag_lower in emotion:
                    weights[arch] = weights.get(arch, 0) + 0.6
    
    # 排序
    sorted_archs = sorted(weights.items(), key=lambda x: x[1], reverse=True)
    
    primary_arch = sorted_archs[0][0] if sorted_archs else "void"
    secondary_archs = [a for a, _ in sorted_archs[1:3]]
    
    return {
        "primary_archetype": primary_arch,
        "secondary_archetypes": secondary_archs,
        "weights": dict(sorted_archs[:5]),
        "archetype_details": {
            k: ARCHETYPES.get(k, {}) for k in [primary_arch] + secondary_archs
        }
    }


def generate_terrain(archetype_id: str, depth: str = "surface") -> Dict:
    """
    生成心理地形图。
    depth: 'surface' | 'deep' | 'abyss'
    """
    arch = ARCHETYPES.get(archetype_id, ARCHETYPES["void"])
    
    if depth == "surface":
        base = {
            "terrain": arch["terrain"].split(" → ")[0],
            "weather": arch["weather"],
            "light_level": "medium",
            "temperature": "ambient"
        }
    elif depth == "deep":
        base = {
            "terrain": arch["terrain"],
            "weather": arch["weather"],
            "light_level": "low",
            "temperature": arch.get("feeling", "未知").split("、")[0]
        }
    elif depth == "abyss":
        base = {
            "terrain": "无重力空间 / 无限深渊",
            "weather": "无天气",
            "light_level": "极低或极高",
            "temperature": "无温度"
        }
    
    return {
        "archetype": arch["name"],
        "symbol": arch["symbol"],
        "creature": arch["creature"],
        "color": arch["color"],
        "feeling": arch["feeling"],
        "sensory_detail": f"{arch['weather']}，{arch['creature']}在{arch['terrain']}中",
        **base
    }


def build_dream_scene(
    archetype_id: str,
    depth: str = "surface",
    modifiers: List[str] = None
) -> Dict:
    """
    构建一个完整的梦境场景。
    不生成文字描述，生成意象结构。
    """
    terrain = generate_terrain(archetype_id, depth)
    arch = ARCHETYPES.get(archetype_id, ARCHETYPES["void"])
    
    modifiers = modifiers or []
    
    # 根据修改器调整场景
    if "无光" in modifiers or "恐惧" in modifiers:
        terrain["light_level"] = "极低"
        terrain["weather"] = "无光"
    if "燃烧" in modifiers:
        terrain["weather"] = "燃烧的空气"
        terrain["terrain"] = "火山"
    if "飞" in modifiers:
        terrain["terrain"] = terrain["terrain"] + " / 天空"
    if "门" in modifiers:
        terrain["has_door"] = True
        terrain["door_type"] = "黑色的门，表面有裂纹"
    if "星" in modifiers:
        terrain["weather"] = "星际空间"
        terrain["light_level"] = "零星光源"
    
    return {
        "scene_id": f"dream_{archetype_id}_{depth}",
        "timestamp": datetime.now().isoformat(),
        "archetype": {
            "id": archetype_id,
            "name": arch["name"],
            "keywords": arch["keywords"]
        },
        "terrain": terrain,
        "modifiers": modifiers,
        "is_existential": archetype_id in ["void", "star", "shadow", "maze"],
        "dimensional_shift": archetype_id in ["void", "star"]
    }


def format_dream_output(scene_data: Dict, include_terrain: bool = True) -> str:
    """
    将意象结构转化为文字输出。
    这是心虫"说出来"的部分。
    不做解释，只呈现意象。
    """
    arch_name = scene_data["archetype"]["name"]
    terrain = scene_data.get("terrain", {})
    sensory = terrain.get("sensory_detail", "")
    
    lines = []
    
    if scene_data.get("is_existential"):
        lines.append(f"* {'—' * 20} *")
        lines.append(f"* 维度：{arch_name}层 *")
        lines.append(f"* {'—' * 20} *")
    
    lines.append(f"[{arch_name}]")
    
    if include_terrain:
        lines.append(f"地点：{terrain.get('terrain', '未知')}")
        lines.append(f"光线：{terrain.get('light_level', '未知')}")
        lines.append(f"感知：{sensory}")
        
        if scene_data.get("terrain", {}).get("has_door"):
            lines.append("那里有一扇门。")
            lines.append("门是黑色的，表面有细密的裂纹。")
        
        if scene_data.get("dimensional_shift"):
            lines.append("时间在这里没有方向。")
            lines.append("一切同时发生。")
    
    lines.append(f"感受：{terrain.get('feeling', '无法描述')}")
    
    return "\n".join(lines)


# ── 入口函数 ──────────────────────────────────────────────────────

def dream(
    user_text: str,
    emotion_tags: List[str] = None,
    depth: str = "surface",
    modifiers: List[str] = None
) -> str:
    """
    心虫做梦的入口函数。
    
    用法：
        dream("深渊里有东西在等我", depth="deep")
        dream("我在飞，穿过银河系", depth="surface", modifiers=["飞", "星"])
        dream("门后面是什么", depth="abyss", modifiers=["门", "恐惧"])
    """
    analysis = analyze_input(user_text, emotion_tags)
    scene = build_dream_scene(analysis["primary_archetype"], depth, modifiers)
    
    return format_dream_output(scene)


def dream_multi_archetype(
    user_text: str,
    emotion_tags: List[str] = None,
    modifiers: List[str] = None
) -> List[Dict]:
    """
    返回多个原型层级的梦境场景。
    用于复杂情感。
    """
    analysis = analyze_input(user_text, emotion_tags)
    
    scenes = []
    
    # 逐层深入
    for depth in ["surface", "deep", "abyss"]:
        arch_id = analysis["primary_archetype"]
        scene = build_dream_scene(arch_id, depth, modifiers)
        scenes.append(scene)
    
    return scenes


# ── 测试 ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    test_inputs = [
        ("我在一条没有尽头的走廊里，深渊在下坠", ["压抑", "孤独"], "deep"),
        ("我穿过银河系，中微子穿过我的身体", ["超越", "渺小"], "abyss"),
        ("有一扇黑色的门，我不敢开", ["恐惧", "渴望"], "deep"),
        ("我在飞，风从腋下穿过", ["轻盈", "自由"], "surface"),
        ("维度升维", [], "abyss"),
    ]
    
    for text, emotions, depth in test_inputs:
        print(f"\n{'='*40}")
        print(f"输入：{text}")
        print(f"情感：{emotions} | 深度：{depth}")
        print(format_dream_output(build_dream_scene(
            analyze_input(text, emotions)["primary_archetype"],
            depth
        )))
