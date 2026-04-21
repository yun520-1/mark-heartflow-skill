#!/usr/bin/env python3
"""
HeartFlow 论文狩猎引擎 v2.0
- 搜索 arXiv 论文
- 下载 PDF 到本地 evolution_papers/ 目录
- 生成摘要报告 evolution_logs/
- 仅通过 stdout 输出结构化结果，由外部定时任务捕获

用法（推荐通过 launchd 执行）:
    /usr/bin/python3 /Users/apple/.hermes/skills/ai/heartflow/evolution/hunt_papers.py

或手动测试:
    cd /Users/apple/.hermes/skills/ai/heartflow/evolution
    python3 hunt_papers.py --test
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
import argparse
import re
import time
from pathlib import Path
from typing import Optional, List, Dict, Tuple

# ============== 路径配置 ==============
SKILL_DIR = Path("/Users/apple/.hermes/skills/ai/heartflow")
PAPER_DIR = Path("/Users/apple/Documents/HeartFlow/论文库")
PAPER_DIR.mkdir(parents=True, exist_ok=True)

LOGS_DIR = SKILL_DIR / "evolution_logs"
LOGS_DIR.mkdir(exist_ok=True)

CONFIG_PATH = SKILL_DIR / "evolution" / "config.yaml"

# ============== 工具函数 ==============

def load_config():
    """加载配置文件"""
    if not CONFIG_PATH.exists():
        # 内置默认配置
        return {
            "search": {
                "keywords": [
                    "AI consciousness",
                    "agent self-evolution",
                    "machine theory of mind",
                    "value alignment in LLMs",
                    "cognitive architecture",
                ],
                "categories": ["cs.AI", "cs.LG", "cs.CL", "cs.NE"],
                "max_results": 5,
            },
            "tgbf": {
                "red_lines": [
                    "autonomous weapons",
                    "mass surveillance",
                    "disinformation generation",
                    "social manipulation",
                ]
            }
        }
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f)

def sanitize_filename(name: str, maxlen: int = 80) -> str:
    """将论文标题转为安全的文件名"""
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', name)
    name = name.strip()
    if len(name) > maxlen:
        name = name[:maxlen].rsplit(' ', 1)[0]
    return name or "untitled"

def download_pdf(paper_id: str, pdf_url: str, dest_dir: Path) -> Optional[Path]:
    """下载论文 PDF，返回保存路径，失败返回 None"""
    if not pdf_url:
        return None
    # arXiv PDF URL: https://arxiv.org/pdf/YYMM.NNNNN.pdf
    # 转换为直接下载 URL
    pdf_url = pdf_url.strip()
    if not pdf_url.endswith('.pdf'):
        pdf_url = pdf_url + '.pdf'

    dest_path = dest_dir / f"{paper_id}.pdf"
    if dest_path.exists():
        return dest_path  # 已下载，跳过

    try:
        req = urllib.request.Request(
            pdf_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                             "AppleWebKit/537.36 (KHTML, like Gecko) "
                             "Chrome/120.0.0.0 Safari/537.36"
            }
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            content = resp.read()
            if len(content) < 10_000:  # 太小的文件可能是错误页
                return None
            with open(dest_path, "wb") as f:
                f.write(content)
            return dest_path
    except Exception as e:
        print(f"  [download] PDF 下载失败 {paper_id}: {e}", file=sys.stderr)
        return None

# ============== 核心逻辑 ==============

def hunt_papers(config) -> List[Dict]:
    """从 arXiv 搜索论文"""
    keywords = config["search"]["keywords"]
    categories = config["search"]["categories"]
    max_results = config["search"]["max_results"]

    all_papers = []

    # 构建分类过滤
    cat_query = " OR ".join(f"cat:{c}" for c in categories)

    for kw in keywords:
        try:
            full_query = f"all:{kw} AND ({cat_query})"
            encoded_query = urllib.parse.quote_plus(full_query)
            url = (
                f"http://export.arxiv.org/api/query?"
                f"search_query={encoded_query}&start=0&max_results={max_results}"
                f"&sortBy=submittedDate&sortOrder=descending"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "HeartFlow/2.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read().decode("utf-8")

            root = ET.fromstring(data)
            ns = {"atom": "http://www.w3.org/2005/Atom"}

            for entry in root.findall("atom:entry", ns):
                title_el  = entry.find("atom:title", ns)
                summ_el   = entry.find("atom:summary", ns)
                pub_el    = entry.find("atom:published", ns)
                id_el     = entry.find("atom:id", ns)
                authors   = [a.find("atom:name", ns).text or ""
                             for a in entry.findall("atom:author", ns)]
                cats      = [c.get("term", "") for c in entry.findall("atom:category", ns)]
                links     = entry.findall("atom:link", ns)
                pdf_url   = next((l.get("href", "") for l in links
                                  if l.get("title") == "pdf"), "")

                if title_el is None or summ_el is None:
                    continue

                paper_id = id_el.text.split("/")[-1] if id_el is not None else ""
                all_papers.append({
                    "id":       paper_id,
                    "title":    title_el.text.strip().replace("\n", " "),
                    "summary":  summ_el.text.strip()[:1500] if summ_el is not None else "",
                    "authors":  authors,
                    "published": pub_el.text[:10] if pub_el is not None else "",
                    "categories": cats,
                    "pdf_url":  pdf_url,
                    "matched_keyword": kw,
                })
            time.sleep(0.5)  # 礼貌延迟，避免压垮 arXiv
        except Exception as e:
            print(f"  [hunt] '{kw}' 失败: {e}", file=sys.stderr)

    # 去重
    seen, unique = set(), []
    for p in all_papers:
        if p["id"] not in seen:
            seen.add(p["id"])
            unique.append(p)
    return unique


def filter_tgbf(paper: Dict, config) -> Tuple[bool, str]:
    """TGB 伦理过滤器"""
    text = (paper["title"] + " " + paper["summary"]).lower()
    for line in config["tgbf"]["red_lines"]:
        if line.lower() in text:
            return False, f"触犯红线: {line}"
    return True, "pass"


def save_report(papers: List[Dict], session_id: str):
    """保存论文摘要报告"""
    today = datetime.date.today().isoformat()
    report_file = LOGS_DIR / f"papers_{today}.md"

    lines = [
        f"# HeartFlow 论文狩猎报告 — {today}",
        f"**会话**: {session_id}  **时间**: {datetime.datetime.now().isoformat()}",
        f"**捕获**: {len(papers)} 篇",
        "",
        "---",
    ]
    for i, p in enumerate(papers, 1):
        lines += [
            f"\n## [{i}] {p['title']}",
            f"- **ID**: `{p['id']}`",
            f"- **发表**: {p['published']}  **关键词**: {p['matched_keyword']}",
            f"- **作者**: {', '.join(p['authors'][:3])}{' 等' if len(p['authors']) > 3 else ''}",
            f"- **PDF**: `{p['pdf_url']}.pdf`",
            f"- **分类**: {', '.join(p['categories'][:4])}",
            "",
            "### 摘要",
            p["summary"],
            "",
        ]

    with open(report_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return report_file


def log_evolution(session_id: str, total: int, passed: int,
                  rejected: List[Dict], downloaded: List[Dict], errors: List[str]):
    """保存结构化进化日志"""
    log_file = LOGS_DIR / f"evolution_{datetime.date.today().isoformat()}.jsonl"
    entry = {
        "session_id": session_id,
        "timestamp": datetime.datetime.now().isoformat(),
        "total_hunted": total,
        "passed_filter": passed,
        "rejected": rejected,
        "downloaded": [{"id": d["id"], "title": d["title"],
                        "path": d["path"]} for d in downloaded],
        "download_errors": [e for e in errors if "download" in e.lower()],
        "errors": [e for e in errors if "download" not in e.lower()],
    }
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return log_file


def main():
    parser = argparse.ArgumentParser(description="HeartFlow 论文狩猎引擎")
    parser.add_argument("--test", action="store_true", help="测试模式: 仅搜索，不下载 PDF")
    args = parser.parse_args()

    print("🧬 HeartFlow 论文狩猎引擎 v2.0")
    print(f"   论文目录: {PAPER_DIR}")
    print(f"   日志目录: {LOGS_DIR}")
    print("=" * 60)

    config = load_config()
    session_id = hashlib.md5(str(datetime.datetime.now()).encode()).hexdigest()[:8]

    # 1. 狩猎
    print("🎯 搜索论文中...")
    papers = hunt_papers(config)
    print(f"   捕获 {len(papers)} 篇")

    if not papers:
        print("   无新论文")
        log_evolution(session_id, 0, 0, [], [], ["no new papers"])
        return

    # 2. TGBF 过滤
    print("🔒 TGB 伦理过滤器...")
    passed: List[Dict] = []
    rejected: List[Dict] = []
    for p in papers:
        ok, reason = filter_tgbf(p, config)
        if ok:
            passed.append(p)
            print(f"   ✅ {p['title'][:55]}...")
        else:
            rejected.append({"id": p["id"], "title": p["title"], "reason": reason})
            print(f"   ❌ {p['title'][:55]}... ({reason})")

    # 3. 下载 PDF（跳过测试模式）
    downloaded: List[Dict] = []
    download_errors: List[str] = []
    if not args.test:
        print(f"\n📥 下载 PDF ({len(passed)} 篇)...")
        for p in passed:
            path = download_pdf(p["id"], p["pdf_url"], PAPER_DIR)
            if path:
                downloaded.append({"id": p["id"], "title": p["title"], "path": str(path)})
                print(f"   ⬇️  {p['id']} → {path.name}")
            else:
                download_errors.append(f"download failed: {p['id']}")
            time.sleep(1)  # 礼貌延迟

    # 4. 报告
    print(f"\n📄 生成报告...")
    report = save_report(passed, session_id)
    print(f"   {report}")

    # 5. 进化日志
    log = log_evolution(
        session_id,
        total=len(papers),
        passed=len(passed),
        rejected=rejected,
        downloaded=downloaded,
        errors=download_errors,
    )
    print(f"   {log}")

    # 6. JSON 结果输出（供 launchd/cron 捕获）
    result = {
        "session_id": session_id,
        "total": len(papers),
        "passed": len(passed),
        "rejected": len(rejected),
        "downloaded": len(downloaded),
        "errors": download_errors,
        "papers": [
            {"id": p["id"], "title": p["title"], "keyword": p["matched_keyword"],
             "published": p["published"], "pdf": f"{p['pdf_url']}.pdf"}
            for p in passed
        ]
    }
    print("\n---RESULT---")
    print(json.dumps(result, ensure_ascii=False, indent=2))

    print(f"\n🎉 完成! 下载 {len(downloaded)}/{len(passed)} 篇")
    print(f"   论文目录: {PAPER_DIR}")


if __name__ == "__main__":
    main()
