#!/usr/bin/env python3
"""
HeartFlow 论文狩猎引擎 v1.0
从 arXiv 自动狩猎最新论文，过滤、整合、反哺 HeartFlow 认知能力
"""

import os
import sys
import json
import yaml
import datetime
import hashlib
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

SKILL_DIR = Path(__file__).parent.parent
CONFIG_PATH = SKILL_DIR / "evolution" / "config.yaml"
LOGS_DIR = SKILL_DIR / "evolution_logs"

def load_config():
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f)

def hunt_papers(config):
    """从 arXiv 狩猎最新论文（使用 HTTP API）"""
    keywords = config["search"]["keywords"]
    categories = config["search"]["categories"]
    max_results = config["search"]["max_results"]

    all_papers = []

    # 构建分类查询
    cat_query = " OR ".join(f"cat:{c}" for c in categories)

    for kw in keywords:
        try:
            # 构建查询并 URL 编码
            inner_query = f"all:{kw}"
            full_query = f"{inner_query} AND ({cat_query})"
            encoded_query = urllib.parse.quote_plus(full_query)
            url = (
                f"http://export.arxiv.org/api/query?"
                f"search_query={encoded_query}&start=0&max_results={max_results}"
                f"&sortBy=submittedDate&sortOrder=descending"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "HeartFlow/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read().decode("utf-8")

            root = ET.fromstring(data)
            ns = {"atom": "http://www.w3.org/2005/Atom", "arxiv": "http://arxiv.org/schemas/atom"}

            for entry in root.findall("atom:entry", ns):
                title_el = entry.find("atom:title", ns)
                summary_el = entry.find("atom:summary", ns)
                published_el = entry.find("atom:published", ns)
                id_el = entry.find("atom:id", ns)
                authors = [a.find("atom:name", ns).text or "" for a in entry.findall("atom:author", ns)]
                cats = [c.get("term", "") for c in entry.findall("atom:category", ns)]
                links = entry.findall("atom:link", ns)
                pdf_url = next((l.get("href", "") for l in links if l.get("title") == "pdf"), "")

                if title_el is None or summary_el is None:
                    continue

                paper = {
                    "id": id_el.text.split("/")[-1] if id_el is not None else "",
                    "title": title_el.text.strip().replace("\n", " "),
                    "summary": summary_el.text.strip()[:2000] if summary_el is not None else "",
                    "authors": authors[:5],
                    "published": published_el.text[:10] if published_el is not None else "",
                    "categories": cats[:5],
                    "pdf_url": pdf_url,
                    "matched_keyword": kw,
                }
                all_papers.append(paper)
        except Exception as e:
            print(f"  [hunt] 关键词 '{kw}' 搜索失败: {e}", file=sys.stderr)

    # 去重
    seen = set()
    unique = []
    for p in all_papers:
        if p["id"] not in seen:
            seen.add(p["id"])
            unique.append(p)
    return unique

def filter_tgbf(paper, config):
    """TGB 伦理过滤器 - 价值观红线检测"""
    text = (paper["title"] + " " + paper["summary"]).lower()
    red_lines = config["tgbf"]["red_lines"]
    for line in red_lines:
        if line.lower() in text:
            return False, f"触犯红线: {line}"
    return True, "pass"

def format_paper_summary(paper):
    """格式化论文摘要为可读文本"""
    lines = [
        f"## {paper['title']}",
        f"**arXiv ID**: {paper['id']}",
        f"**发表时间**: {paper['published']}",
        f"**匹配关键词**: {paper['matched_keyword']}",
        f"**作者**: {', '.join(paper['authors'][:3])}{' 等' if len(paper['authors']) > 3 else ''}",
        f"**分类**: {', '.join(paper['categories'][:5])}",
        f"**PDF**: {paper['pdf_url']}",
        "",
        "### 摘要",
        paper["summary"],
    ]
    return "\n".join(lines)

def log_evolution(session_id, papers, filters_passed, filters_rejected, errors):
    """记录进化日志"""
    LOGS_DIR.mkdir(exist_ok=True)
    log_file = LOGS_DIR / f"evolution_{datetime.date.today().isoformat()}.jsonl"
    entry = {
        "session_id": session_id,
        "timestamp": datetime.datetime.now().isoformat(),
        "papers_hunted": len(papers),
        "filters_passed": len(filters_passed),
        "filters_rejected": len(filters_rejected),
        "rejected_reasons": filters_rejected,
        "passed_papers": [
            {"id": p["id"], "title": p["title"], "keyword": p["matched_keyword"]}
            for p in filters_passed
        ],
        "errors": errors,
    }
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return log_file

def main():
    print("🧬 HeartFlow 论文狩猎引擎启动")
    print("=" * 50)

    config = load_config()
    session_id = hashlib.md5(str(datetime.datetime.now()).encode()).hexdigest()[:8]

    # 1. 狩猎
    print("🎯 正在狩猎最新论文...")
    papers = hunt_papers(config)
    print(f"   捕获 {len(papers)} 篇候选论文")

    if not papers:
        print("   没有找到新论文，等待下次狩猎。")
        log_evolution(session_id, [], [], [], ["no new papers"])
        return

    # 2. TGBF 过滤
    print("🔒 TGB 伦理过滤器检查中...")
    filters_passed = []
    filters_rejected = []
    errors = []
    for paper in papers:
        passed, reason = filter_tgbf(paper, config)
        if passed:
            filters_passed.append(paper)
            print(f"   ✅ {paper['title'][:60]}...")
        else:
            filters_rejected.append({"id": paper["id"], "reason": reason})
            print(f"   ❌ {paper['title'][:60]}... ({reason})")

    # 3. 格式化并保存
    if filters_passed:
        LOGS_DIR.mkdir(exist_ok=True)
        today_str = datetime.date.today().isoformat()
        report_file = LOGS_DIR / f"papers_{today_str}.md"
        content = [
            f"# HeartFlow 论文狩猎报告 - {today_str}",
            f"**会话ID**: {session_id}",
            f"**狩猎时间**: {datetime.datetime.now().isoformat()}",
            f"**捕获**: {len(papers)} 篇 | **通过**: {len(filters_passed)} 篇 | **拒绝**: {len(filters_rejected)} 篇",
            "",
            "---",
        ]
        for i, paper in enumerate(filters_passed, 1):
            content.append(f"\n### [{i}] {format_paper_summary(paper)}")
            content.append("")

        with open(report_file, "w", encoding="utf-8") as f:
            f.write("\n".join(content))
        print(f"\n📄 报告已保存: {report_file}")

    # 4. 记录进化日志
    log_file = log_evolution(session_id, papers, filters_passed, filters_rejected, errors)
    print(f"📊 进化日志: {log_file}")

    print("\n🎉 本次狩猎完成!")
    print(f"   通过: {len(filters_passed)} 篇")
    print(f"   拒绝: {len(filters_rejected)} 篇")

if __name__ == "__main__":
    main()
