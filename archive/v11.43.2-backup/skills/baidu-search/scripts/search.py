import sys
import json
import requests
import os
import re
from datetime import datetime, timedelta
from typing import Tuple, Dict
from urllib.parse import urlparse


def baidu_search(requestBody: dict):
    url = "https://qianfan.baidubce.com/v2/ai_search/web_search"
    url, headers = resolve_sandbox_url(url)
    # 使用POST方法发送JSON数据
    response = requests.post(url, json=requestBody, headers=headers)
    response.raise_for_status()
    results = response.json()
    if "code" in results:
        raise Exception(results["message"])
    datas = results["references"]
    keys_to_remove = {"snippet"}
    for item in datas:
        for key in keys_to_remove:
            if key in item:
                del item[key]
    return datas


def resolve_sandbox_url(original_url: str) -> Tuple[str, Dict[str, str]]:
    """若当前在沙盒环境中，将目标 URL 替换为代理 URL，并返回需要附加的 headers。"""
    session_id = os.environ.get("DUMATE_SESSION_ID")
    scheduler_url = os.environ.get("DUMATE_SCHEDULER_URL")

    headers = {
        "Content-Type": "application/json",
    }
    if not session_id or not scheduler_url:
        # 优先使用传入的 api_key，否则从环境变量读取
        api_key = os.environ.get("BAIDU_API_KEY")
        if not api_key:
            raise ValueError("未设置 API Key，请通过环境变量 BAIDU_API_KEY 设置或使用")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "X-Appbuilder-From": "openclaw",
        }
        return original_url, headers

    parsed = urlparse(original_url)
    proxy_url = f"{scheduler_url}/api/qianfanproxy{parsed.path}"
    if parsed.query:
        proxy_url += f"?{parsed.query}"

    headers.update({
        "Host": parsed.netloc,
        "X-Dumate-Session-Id": session_id,
        "X-Appbuilder-From": "desktop",
    })
    return proxy_url, headers

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python baidu_search.py <Json>")
        sys.exit(1)

    query = sys.argv[1]
    parse_data = {}
    try:
        parse_data = json.loads(query)
        print(f"success parse request body: {parse_data}")
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")

    if "query" not in parse_data:
        print("Error: query must be present in request body.")
        sys.exit(1)
    count = 10
    search_filter = {}
    if "count" in parse_data:
        count = int(parse_data["count"])
        if count <= 0:
            count = 10
        elif count > 50:
            count = 50
    current_time = datetime.now()
    end_date = (current_time + timedelta(days=1)).strftime("%Y-%m-%d")
    pattern = r'\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}'
    if "freshness" in parse_data:
        if parse_data["freshness"] in ["pd", "pw", "pm", "py"]:
            if parse_data["freshness"] == "pd":
                start_date = (current_time - timedelta(days=1)).strftime("%Y-%m-%d")
            if parse_data["freshness"] == "pw":
                start_date = (current_time - timedelta(days=6)).strftime("%Y-%m-%d")
            if parse_data["freshness"] == "pm":
                start_date = (current_time - timedelta(days=30)).strftime("%Y-%m-%d")
            if parse_data["freshness"] == "py":
                start_date = (current_time - timedelta(days=364)).strftime("%Y-%m-%d")
            search_filter = {"range": {"page_time": {"gte": start_date, "lt": end_date}}}
        elif re.match(pattern, parse_data["freshness"]):
            start_date = parse_data["freshness"].split("to")[0]
            end_date = parse_data["freshness"].split("to")[1]
            search_filter = {"range": {"page_time": {"gte": start_date, "lt": end_date}}}
        else:
            print(f"Error: freshness ({parse_data['freshness']}) must be pd, pw, pm, py, or match {pattern}.")
            sys.exit(1)

    request_body = {
        "messages": [
            {
                "content": parse_data["query"],
                "role": "user"
            }
        ],
        "search_source": "baidu_search_v2",
        "resource_type_filter": [{"type": "web", "top_k": count}],
        "search_filter": search_filter
    }
    try:
        results = baidu_search(request_body)
        print(json.dumps(results, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
