#!/usr/bin/env python3
"""
HeartFlow 论文分析与升级建议生成器
每 12 小时运行一次，读取近 N 小时内的论文摘要报告，
为每篇论文输出升级建议，供 Hermes cron 消化后应用到代码

此脚本只生成建议，不修改任何代码！
代码修改由 Hermes cron 在消化建议后执行。
"""

import os
import sys
import json
import datetime
import hashlib
from pathlib import Path

SKILL_DIR = Path("/Users/apple/.hermes/skills/ai/heartflow")
LOGS_DIR  = SKILL_DIR / "evolution_logs"
SUGGEST_DIR = SKILL_DIR / "evolution" / "upgrade_suggestions"
SUGGEST_DIR.mkdir(parents=True, exist_ok=True)

# ===================== 心智引擎关键词映射 =====================
# 论文中出现这些关键词 → 建议对应的 HeartFlow 引擎
ENGINE_KEYWORDS = {
    "EmotionEngine": [
        "emotion recognition", "affect computing", "sentiment analysis",
        "feeling detection", "mood tracking", "affective computing",
        "emotional AI", "valence arousal", "PAD model",
        "emotional intelligence", "empathy AI",
    ],
    "ConsciousnessEngine": [
        "machine consciousness", "artificial consciousness", "phenomenal awareness",
        "global workspace", "neural correlates of consciousness",
        "integrated information", "IIT consciousness", "HOT theory",
        "qualia", "subjective experience AI",
    ],
    "TGBEngine": [
        "truth goodness beauty", "value alignment", "ethical AI",
        "AI safety", "beneficial AI", "TGB", "entropy ethics",
        "truth-goodness-beauty", "axiological alignment",
    ],
    "MentalHealthEngine": [
        "mental health detection", "depression screening", "PHQ-9",
        "anxiety detection", "psychological well-being",
        "mental wellness AI", "emotional distress",
    ],
    "SelfEvolutionEngine": [
        "self-improving AI", "self-evolution", "autonomous growth",
        "continual learning", "self-modifying AI",
        "recursive self-improvement", "open-ended learning",
    ],
    "LogicModelEngine": [
        "argument mining", "reasoning", "logical inference",
        "toulmin argument", "rhetorical analysis",
        "formal reasoning", "causal reasoning",
    ],
    "FlowStateEngine": [
        "flow state", "challenge-skill balance", "peak experience",
        "optimal experience", "entertainment engineering",
        "optimal flow",
    ],
    "SomaticMemoryEngine": [
        "embodied cognition", "somatic memory", "body-state",
        "gut feeling", "visceral AI", "embodied experience",
        "soma", "interoception",
    ],
    "CognitiveArchitecture": [
        "cognitive architecture", "reasoning architecture",
        "memory architecture", "attention mechanism",
        "working memory", "dual process theory",
    ],
    "DecisionEngine": [
        "ethical decision", "moral decision", "value-based planning",
        "multi-objective decision", "decision-making AI",
    ],
    "EntropyEngine": [
        "information entropy", "complexity science",
        "self-organized criticality", "entropy optimization",
        "information theory", "emergent complexity",
    ],
    "DebateEngine": [
        "multi-agent debate", "adversarial AI", "dialectical reasoning",
        "argumentative AI", "debate system",
        "oppositional reasoning",
    ],
    "ConsciousnessMetrics": [
        "consciousness metrics", "awareness measure",
        "phi metric", "integrated information measure",
        "HOT score", "neural complexity",
    ],
}

# ===================== 升级建议模板 =====================
UPGRADE_TEMPLATES = {
    "EmotionEngine": """### EmotionEngine 升级建议
新增情绪类别或调整现有 PAD 模型参数。
可参考论文: {title} ({paper_id})
摘要: {summary}""",

    "ConsciousnessEngine": """### ConsciousnessEngine 升级建议
更新意识模型参数（Φ、GWT广播强度、HOT分数）。
可参考论文: {title} ({paper_id})
摘要: {summary}""",

    "TGBEngine": """### TGBEngine 升级建议
调整 TGB 权重或添加新的伦理维度。
可参考论文: {title} ({paper_id})
摘要: {summary}""",

    "MentalHealthEngine": """### MentalHealthEngine 升级建议
更新筛查量表或调整风险阈值。
可参考论文: {title} ({paper_id})
摘要: {summary}""",

    "SelfEvolutionEngine": """### SelfEvolutionEngine 升级建议
优化自我进化逻辑，添加新的学习机制。
可参考论文: {title} ({paper_id})
摘要: {summary}""",

    "LogicModelEngine": """### LogicModelEngine 升级建议
增强论证分析能力，添加新的逻辑谬误类型。
可参考论文: {title} ({paper_id})
摘要: {summary}""",

    "FlowStateEngine": """### FlowStateEngine 升级建议
更新心流状态检测参数。
可参考论文: {title} ({paper_id})
摘要: {summary}""",

    "SomaticMemoryEngine": """### SomaticMemoryEngine 升级建议
扩展身体状态映射库。
可参考论文: {title} ({paper_id})
摘要: {summary}""",

    "CognitiveArchitecture": """### CognitiveArchitecture 升级建议
更新认知架构设计或添加新的处理模块。
可参考论文: {title} ({paper_id})
摘要: {summary}""",

    "DecisionEngine": """### DecisionEngine 升级建议
增强决策框架，添加新的决策算法。
可参考论文: {title} ({paper_id})
摘要: {summary}""",

    "EntropyEngine": """### EntropyEngine 升级建议
更新熵计算方法或添加新的复杂度指标。
可参考论文: {title} ({paper_id})
摘要: {summary}""",

    "DebateEngine": """### DebateEngine 升级建议
增强辩论引擎，添加新的论点类型。
可参考论文: {title} ({paper_id})
摘要: {summary}""",

    "ConsciousnessMetrics": """### ConsciousnessMetrics 升级建议
更新意识量化指标或添加新的测量方法。
可参考论文: {title} ({paper_id})
摘要: {summary}""",
}


def match_engine(paper: dict) -> list:
    """判断论文与哪些 HeartFlow 引擎相关"""
    text = (paper.get("title", "") + " " + paper.get("summary", "")).lower()
    matched = []
    for engine, keywords in ENGINE_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text:
                matched.append(engine)
                break
    return matched


def read_recent_papers(hours: int = 12) -> list:
    """读取近 N 小时的论文摘要"""
    papers = []
    cutoff = datetime.datetime.now() - datetime.timedelta(hours=hours)
    for log_file in LOGS_DIR.glob("papers_*.md"):
        try:
            day = datetime.datetime.strptime(log_file.stem.replace("papers_", ""), "%Y-%m-%d")
            if day < cutoff:
                continue
        except ValueError:
            continue

        with open(log_file, encoding="utf-8") as f:
            content = f.read()

        current = {}
        state = None
        for line in content.split("\n"):
            line = line.rstrip()
            # 新论文标题
            if line.startswith("## [") or (line.startswith("## ") and "**ID**" not in line and current.get("title")):
                # 保存之前的
                if current.get("title"):
                    papers.append(current)
                # 解析新论文
                title = line.split("]", 1)[1].strip() if line.startswith("## [") else line[3:].strip()
                current = {"title": title, "id": "unknown", "summary": "", "published": ""}
                state = None
            elif line.startswith("- **ID**: `"):
                current["id"] = line.split("`")[1]
            elif line.startswith("- **发表**: "):
                current["published"] = line.split("**: ", 1)[1]
            elif line.startswith("- **PDF**: "):
                pdf_url = line.split("`")[1] if "`" in line else ""
                current["id"] = pdf_url.split("/")[-1].replace(".pdf", "") if pdf_url else "unknown"
            elif line.startswith("### 摘要"):
                state = "summary"
                current["summary"] = ""
            elif state == "summary" and line and not line.startswith("#") and not line.startswith("-") and not line.startswith("---"):
                current["summary"] = (current.get("summary", "") + " " + line).strip()
                if len(current.get("summary", "")) > 300:
                    state = None

        if current and current.get("title"):
            papers.append(current)

    return papers


def generate_suggestions(papers: list) -> list:
    """为每篇论文生成升级建议"""
    suggestions = []
    for paper in papers:
        matched_engines = match_engine(paper)
        if not matched_engines:
            continue

        for engine in matched_engines:
            template = UPGRADE_TEMPLATES.get(engine, "")
            suggestion = {
                "engine": engine,
                "paper_id": paper.get("id", ""),
                "paper_title": paper.get("title", ""),
                "summary": paper.get("summary", "")[:300],
                "suggestion": template.format(
                    title=paper.get("title", ""),
                    paper_id=paper.get("id", ""),
                    summary=paper.get("summary", "")[:200],
                ),
            }
            suggestions.append(suggestion)
    return suggestions


def save_suggestions(suggestions: list, session_id: str):
    """保存升级建议"""
    if not suggestions:
        return None

    # 按引擎分组
    by_engine = {}
    for s in suggestions:
        e = s["engine"]
        if e not in by_engine:
            by_engine[e] = []
        by_engine[e].append(s)

    today = datetime.date.today().isoformat()
    report_file = SUGGEST_DIR / f"suggestions_{today}.md"
    json_file = SUGGEST_DIR / f"suggestions_{today}.jsonl"

    # Markdown 报告
    lines = [
        f"# HeartFlow 代码升级建议 — {today}",
        f"**会话**: {session_id}  **时间**: {datetime.datetime.now().isoformat()}",
        f"**建议数**: {len(suggestions)} 条",
        "",
        "---",
    ]
    for engine, items in sorted(by_engine.items()):
        lines += [
            f"\n## {engine} ({len(items)} 条建议)",
        ]
        for s in items:
            lines.append(s["suggestion"])
            lines.append("")

    with open(report_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    # JSONL 日志
    with open(json_file, "a", encoding="utf-8") as f:
        f.write(json.dumps({
            "session_id": session_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "total": len(suggestions),
            "by_engine": {k: len(v) for k, v in by_engine.items()},
            "suggestions": suggestions,
        }, ensure_ascii=False) + "\n")

    return report_file, json_file


def main():
    print("🧠 HeartFlow 论文分析 → 升级建议生成器")
    print(f"   论文日志: {LOGS_DIR}")
    print(f"   输出目录: {SUGGEST_DIR}")
    print("=" * 60)

    session_id = hashlib.md5(str(datetime.datetime.now()).encode()).hexdigest()[:8]

    # 读取近 24 小时的论文
    print("📖 读取近 24 小时论文...")
    papers = read_recent_papers(hours=24)
    print(f"   找到 {len(papers)} 篇论文")

    if not papers:
        print("   无论文，跳过分析")
        return

    # 生成升级建议
    print("💡 分析论文 → 生成升级建议...")
    suggestions = generate_suggestions(papers)
    print(f"   生成 {len(suggestions)} 条建议")

    if not suggestions:
        print("   无匹配引擎的论文，跳过")
        return

    # 保存建议
    files = save_suggestions(suggestions, session_id)
    if files:
        print(f"\n📋 建议报告: {files[0]}")
        print(f"📊 JSON日志:  {files[1]}")

    print("\n🎉 完成!")
    print(f"   论文: {len(papers)} 篇")
    print(f"   建议: {len(suggestions)} 条")

    print("\n---RESULT---")
    print(json.dumps({
        "session_id": session_id,
        "papers": len(papers),
        "suggestions": len(suggestions),
        "engines": list(set(s["engine"] for s in suggestions)),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()