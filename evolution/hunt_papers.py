#!/usr/bin/env python3
"""
HeartFlow 代码狩猎引擎 v3.0
- 搜索 GitHub 仓库 + 带代码的 arXiv 论文
- 下载有用代码文件 (.py, .ipynb)
- 提取 LaTeX 公式
- 生成代码分析报告

用法:
    /usr/bin/python3 /Users/apple/.hermes/skills/ai/heartflow/evolution/hunt_papers.py

测试:
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
import subprocess
from pathlib import Path
from typing import Optional, List, Dict, Tuple

# ============== 路径配置 ==============
SKILL_DIR = Path("/Users/apple/.hermes/skills/ai/heartflow")
CODE_DIR = Path("/Users/apple/Documents/HeartFlow/代码库")
CODE_DIR.mkdir(parents=True, exist_ok=True)

LOGS_DIR = SKILL_DIR / "evolution_logs"
LOGS_DIR.mkdir(exist_ok=True)

CONFIG_PATH = SKILL_DIR / "evolution" / "config.yaml"

# GitHub API 配置
GITHUB_API = "https://api.github.com"
GH_TOKEN = os.getenv("GITHUB_TOKEN", "")

# ============== 工具函数 ==============

def load_config():
    """加载配置文件"""
    if not CONFIG_PATH.exists():
        return {
            "search": {
                "keywords": [
                    "consciousness AI",
                    "self-evolving agent",
                    "cognitive architecture pytorch",
                    "emotion recognition transformer",
                    "LLM agent memory",
                    "reinforcement learning human feedback",
                ],
                "max_results": 10,
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
    """将名称转为安全的文件名"""
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', name)
    name = name.strip()
    if len(name) > maxlen:
        name = name[:maxlen].rsplit(' ', 1)[0]
    return name or "untitled"

def github_headers():
    """GitHub API 请求头"""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "HeartFlow/3.0",
    }
    if GH_TOKEN:
        headers["Authorization"] = f"token {GH_TOKEN}"
    return headers

# ============== 核心搜索逻辑 ==============

def search_github(keyword: str, max_results: int = 10) -> List[Dict]:
    """搜索 GitHub 仓库"""
    results = []
    try:
        # 搜索代码仓库（带 python 文件的）
        query = f"{keyword} language:python"
        url = f"{GITHUB_API}/search/repositories?q={urllib.parse.quote(query)}&sort=stars&order=desc&per_page={max_results}"
        
        req = urllib.request.Request(url, headers=github_headers())
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        for item in data.get("items", [])[:max_results]:
            results.append({
                "type": "github_repo",
                "id": item["full_name"],
                "name": item["name"],
                "full_name": item["full_name"],
                "description": item.get("description", "")[:500],
                "url": item["html_url"],
                "clone_url": item["clone_url"],
                "stars": item.get("stargazers_count", 0),
                "language": item.get("language", ""),
                "updated": item.get("updated_at", "")[:10],
                "matched_keyword": keyword,
            })
        time.sleep(1)  # 礼貌延迟
    except Exception as e:
        print(f"  [github] '{keyword}' 失败: {e}", file=sys.stderr)
    return results

def search_arxiv_with_code(keyword: str, max_results: int = 5) -> List[Dict]:
    """搜索带代码链接的 arXiv 论文"""
    results = []
    try:
        # 搜索 arXiv
        query = f"all:{keyword} AND (cat:cs.AI OR cat:cs.LG OR cat:cs.CL)"
        encoded = urllib.parse.quote_plus(query)
        url = f"http://export.arxiv.org/api/query?search_query={encoded}&start=0&max_results={max_results}&sortBy=submittedDate&sortOrder=descending"
        
        req = urllib.request.Request(url, headers={"User-Agent": "HeartFlow/3.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read().decode("utf-8")
        
        root = ET.fromstring(data)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        
        for entry in root.findall("atom:entry", ns):
            title_el = entry.find("atom:title", ns)
            summ_el = entry.find("atom:summary", ns)
            id_el = entry.find("atom:id", ns)
            
            if title_el is None:
                continue
            
            paper_id = id_el.text.split("/")[-1] if id_el is not None else ""
            
            # 检查是否有 GitHub 链接
            links = entry.findall("atom:link", ns)
            github_url = ""
            for l in links:
                href = l.get("href", "")
                if "github.com" in href.lower():
                    github_url = href
                    break
            
            if not github_url:
                continue  # 跳过没有代码的
            
            results.append({
                "type": "arxiv_code",
                "id": paper_id,
                "name": paper_id,
                "title": title_el.text.strip().replace("\n", " "),
                "summary": summ_el.text.strip()[:500] if summ_el is not None else "",
                "github_url": github_url,
                "matched_keyword": keyword,
            })
        time.sleep(0.5)
    except Exception as e:
        print(f"  [arxiv] '{keyword}' 失败: {e}", file=sys.stderr)
    return results

def hunt_code(config) -> List[Dict]:
    """搜索代码仓库和带代码的论文"""
    keywords = config["search"]["keywords"]
    max_results = config["search"].get("max_results", 10)
    
    all_results = []
    
    print("🔍 搜索 GitHub 仓库...")
    for kw in keywords:
        repos = search_github(kw, max_results)
        all_results.extend(repos)
        print(f"   '{kw}': {len(repos)} 个仓库")
    
    print("🔍 搜索带代码的 arXiv 论文...")
    for kw in keywords[:3]:  # 限制 arXiv 搜索
        papers = search_arxiv_with_code(kw, max_results // 2)
        all_results.extend(papers)
        print(f"   '{kw}': {len(papers)} 篇")
    
    # 去重
    seen, unique = set(), []
    for r in all_results:
        key = r.get("id") or r.get("full_name") or r.get("name")
        if key and key not in seen:
            seen.add(key)
            unique.append(r)
    
    return unique

# ============== 下载逻辑 ==============

def clone_repo(repo_url: str, dest_dir: Path) -> Optional[Path]:
    """克隆 GitHub 仓库"""
    try:
        # 使用 HTTPS，不使用 SSH 密钥
        cmd = ["git", "clone", "--depth", "1", repo_url, str(dest_dir)]
        result = subprocess.run(cmd, capture_output=True, timeout=300)
        if result.returncode == 0:
            return dest_dir
        return None
    except Exception as e:
        print(f"  [clone] 失败: {e}", file=sys.stderr)
        return None

def extract_code_files(repo_dir: Path, dest_dir: Path) -> List[Dict]:
    """提取有用的代码文件"""
    code_files = []
    extensions = [".py", ".ipynb", ".sh", ".yaml", ".yml", ".json"]
    
    for ext in extensions:
        for f in repo_dir.rglob(f"*{ext}"):
            if ".git" in f.parts:
                continue
            rel_path = f.relative_to(repo_dir)
            dest_path = dest_dir / rel_path.name
            try:
                # 简单复制
                import shutil
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(f, dest_path)
                code_files.append({
                    "file": str(rel_path),
                    "size": f.stat().st_size,
                })
            except Exception as e:
                pass
    
    return code_files

def download_and_extract(result: Dict, code_root: Path) -> Tuple[Optional[Path], List[Dict]]:
    """下载仓库并提取代码"""
    repo_name = sanitize_filename(result.get("name", result.get("id", "repo")))
    dest_dir = code_root / result.get("type", "unknown") / repo_name
    
    if dest_dir.exists():
        # 已下载，返回现有目录
        code_files = extract_code_files(dest_dir, dest_dir)
        return dest_dir, code_files
    
    # 克隆仓库
    url = result.get("clone_url") or result.get("github_url", "")
    if not url:
        return None, []
    
    success = clone_repo(url, dest_dir)
    if not success:
        return None, []
    
    # 提取代码文件
    code_files = extract_code_files(dest_dir, dest_dir)
    return dest_dir, code_files

# ============== 报告生成 ==============

def save_report(results: List[Dict], session_id: str):
    """保存代码狩猎报告"""
    today = datetime.date.today().isoformat()
    report_file = LOGS_DIR / f"code_hunt_{today}.md"
    
    lines = [
        f"# HeartFlow 代码狩猎报告 — {today}",
        f"**会话**: {session_id}  **时间**: {datetime.datetime.now().isoformat()}",
        f"**捕获**: {len(results)} 个代码源",
        "",
        "---",
    ]
    
    github_repos = [r for r in results if r.get("type") == "github_repo"]
    arxiv_papers = [r for r in results if r.get("type") == "arxiv_code"]
    
    if github_repos:
        lines.append("\n## GitHub 仓库")
        for i, r in enumerate(github_repos, 1):
            lines.extend([
                f"\n### [{i}] {r['name']}",
                f"- ⭐ {r.get('stars', 0)} stars",
                f"- 🔗 {r.get('url', '')}",
                f"- 📝 {r.get('description', '')[:200]}",
            ])
    
    if arxiv_papers:
        lines.append("\n## arXiv 带代码论文")
        for i, r in enumerate(arxiv_papers, 1):
            lines.extend([
                f"\n### [{i}] {r['title'][:60]}...",
                f"- 🔗 {r.get('github_url', '')}",
            ])
    
    with open(report_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return report_file

def log_evolution(session_id: str, total: int, results: List[Dict], 
               downloaded: List[Dict], errors: List[str]):
    """保存结构化日志"""
    log_file = LOGS_DIR / f"code_evolution_{datetime.date.today().isoformat()}.jsonl"
    entry = {
        "session_id": session_id,
        "timestamp": datetime.datetime.now().isoformat(),
        "total_found": total,
        "downloaded": downloaded,
        "errors": errors,
    }
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return log_file

# ============== 主程序 ==============

def main():
    parser = argparse.ArgumentParser(description="HeartFlow 代码狩猎引擎 v3.0")
    parser.add_argument("--test", action="store_true", help="测试模式: 仅搜索，不下载")
    args = parser.parse_args()
    
    print("🧬 HeartFlow 代码狩猎引擎 v3.0")
    print(f"   代码目录: {CODE_DIR}")
    print(f"   日志目录: {LOGS_DIR}")
    print("=" * 60)
    
    config = load_config()
    session_id = hashlib.md5(str(datetime.datetime.now()).encode()).hexdigest()[:8]
    
    # 1. 搜索
    print("🎯 搜索代码中...")
    results = hunt_code(config)
    print(f"   找到 {len(results)} 个代码源")
    
    if not results:
        print("   无新代码")
        log_evolution(session_id, 0, [], [], ["no new code found"])
        return
    
    # 2. TGBF 过滤（简化）
    filtered = []
    for r in results:
        text = (r.get("name", "") + " " + r.get("description", "") + " " + r.get("title", "")).lower()
        red_lines = config.get("tgbf", {}).get("red_lines", [])
        if not any(rl.lower() in text for rl in red_lines):
            filtered.append(r)
    
    print(f"🔒 TGB 过滤后: {len(filtered)} 个")
    
    # 3. 下载并提取代码
    downloaded: List[Dict] = []
    download_errors: List[str] = []
    
    if not args.test:
        print(f"\n📥 下载代码 ({len(filtered)} 个)...")
        # 限制下载数量
        for r in filtered[:5]:
            try:
                path, files = download_and_extract(r, CODE_DIR)
                if path:
                    downloaded.append({
                        "id": r.get("id"),
                        "name": r.get("name"),
                        "path": str(path),
                        "files": len(files),
                        "type": r.get("type"),
                    })
                    print(f"   ⬇️  {r.get('name')} ({len(files)} 文件)")
                else:
                    download_errors.append(f"download failed: {r.get('id')}")
                time.sleep(1)
            except Exception as e:
                download_errors.append(f"error: {r.get('id')} - {e}")
    
    # 4. 报告
    print(f"\n📄 生成报告...")
    report = save_report(filtered, session_id)
    print(f"   {report}")
    
    # 5. 日志
    log = log_evolution(
        session_id,
        total=len(results),
        results=filtered,
        downloaded=downloaded,
        errors=download_errors,
    )
    print(f"   {log}")
    
    # 6. JSON 输出
    result = {
        "session_id": session_id,
        "total": len(results),
        "filtered": len(filtered),
        "downloaded": len(downloaded),
        "errors": download_errors,
        "sources": [
            {
                "id": r.get("id"),
                "name": r.get("name"),
                "type": r.get("type"),
                "keyword": r.get("matched_keyword"),
            }
            for r in filtered
        ]
    }
    print("\n---RESULT---")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    print(f"\n🎉 完成! 下载 {len(downloaded)} 个代码源")
    print(f"   代码目录: {CODE_DIR}")


if __name__ == "__main__":
    main()