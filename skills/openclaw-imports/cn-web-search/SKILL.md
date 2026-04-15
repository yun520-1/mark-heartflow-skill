---
name: cn-web-search
version: 2.0.0
description: 中文网页搜索 - 聚合 22+ 免费搜索引擎，无需 API Key，支持公众号/知乎/财经/技术/学术/知识搜索。唯一真正免费的中文多引擎搜索方案！
author: joansongjr
author_url: https://github.com/joansongjr
repository: https://github.com/joansongjr/cn-web-search
license: MIT
tags:
  - search
  - chinese
  - wechat
  - 公众号
  - web-search
  - 360-search
  - sogou
  - bing
  - qwant
  - startpage
  - duckduckgo
  - hacker-news
  - reddit
  - arxiv
  - stackoverflow
  - github
  - caixin
  - wolfram
  - baidu
  - brave-search
  - yahoo
  - mojeek
  - toutiao
  - jisilu
  - wikipedia
  - no-api-key
  - free
  - 中文搜索
  - 百度
  - 头条搜索
  - 知乎
  - 东方财富
  - A股
  - 财经
  - 技术搜索
  - 多引擎
  - 聚合搜索
  - 免费无需API
  - 学术搜索
  - 投资
  - 知识百科
---

# 中文网页搜索 (CN Web Search)

> **⚡ 安装:**
> ```bash
> clawhub install cn-web-search
> ```

多引擎聚合搜索，**全部免费，无需 API Key**。22+ 引擎覆盖中英文、公众号、技术、学术、财经、知识百科。

## 引擎总览（22 个）

| 类别 | 引擎 | 数量 |
|------|------|------|
| 公众号 | 搜狗微信、必应索引 | 2 |
| 中文综合 | 360、搜狗、必应中文、**百度**、**头条搜索** | 5 |
| 英文综合 | DDG Lite、Qwant、Startpage、必应英文、**Yahoo**、**Brave Search**、**Mojeek** | 7 |
| 技术社区 | Stack Overflow、GitHub Trending | 2 |
| 资讯/论坛 | Hacker News、Reddit | 2 |
| 学术 | ArXiv | 1 |
| 财经/投资 | 东方财富、**集思录**、财新 | 3 |
| 知识百科 | Wolfram Alpha、**Wikipedia 中文**、**Wikipedia 英文** | 3 |
| 即时答案 | **DDG Instant Answer API** | 1 |

> 🆕 v2.0 新增 9 个引擎（**加粗**标注）

---

## 1. 公众号搜索

### 1.1 搜狗微信

```
https://weixin.sogou.com/weixin?type=2&query=QUERY&page=1
```

### 1.2 必应公众号索引

```
https://cn.bing.com/search?q=site:mp.weixin.qq.com+QUERY
```

---

## 2. 中文综合搜索

### 2.1 360 搜索

```
https://m.so.com/s?q=QUERY
```

### 2.2 搜狗网页

```
https://www.sogou.com/web?query=QUERY
```

### 2.3 必应中文

```
https://cn.bing.com/search?q=QUERY
```

### 2.4 百度 🆕

```
https://www.baidu.com/s?wd=QUERY
```

中文搜索覆盖最全，结果丰富。

### 2.5 头条搜索 🆕

```
https://so.toutiao.com/search?keyword=QUERY
```

字节跳动旗下，中文资讯和短视频内容强。

---

## 3. 英文综合搜索

### 3.1 DuckDuckGo Lite

```
https://lite.duckduckgo.com/lite/?q=QUERY
```

### 3.2 Qwant

```
https://www.qwant.com/?q=QUERY&t=web
```

### 3.3 Startpage

```
https://www.startpage.com/do/search?q=QUERY&cluster=web
```

### 3.4 必应英文

```
https://www.bing.com/search?q=QUERY
```

### 3.5 Yahoo 🆕

```
https://search.yahoo.com/search?p=QUERY
```

老牌英文搜索引擎，结果稳定。

### 3.6 Brave Search 🆕

```
https://search.brave.com/search?q=QUERY
```

独立索引（非 Bing/Google 代理），隐私友好，结果质量高。

### 3.7 Mojeek 🆕

```
https://www.mojeek.com/search?q=QUERY
```

独立爬虫索引，不依赖任何大厂，适合多样化结果。

---

## 4. 技术/社区/学术

### 4.1 Hacker News

```
https://hn.algolia.com/api/v1/search?query=QUERY&tags=story&hitsPerPage=10
```

### 4.2 Reddit

```
https://www.reddit.com/search.json?q=QUERY&limit=10
```

### 4.3 ArXiv

```
http://export.arxiv.org/api/query?search_query=all:QUERY&max_results=5
```

### 4.4 Stack Overflow

```
https://stackoverflow.com/search?q=QUERY
```

### 4.5 GitHub Trending

```
https://github.com/trending?since=weekly
```

---

## 5. 财经/投资

### 5.1 东方财富

```
https://search.eastmoney.com/search?keyword=QUERY
```

### 5.2 集思录 🆕

```
https://www.jisilu.cn/explore/?keyword=QUERY
```

投资社区，可转债、基金、LOF 等投资品种讨论。

### 5.3 财新

```
https://search.caixin.com/search/?keyword=QUERY
```

---

## 6. 知识百科

### 6.1 Wolfram Alpha

```
https://www.wolframalpha.com/input?i=QUERY
```

### 6.2 Wikipedia 中文 🆕

```
https://zh.wikipedia.org/w/index.php?search=QUERY&title=Special:Search
```

中文维基百科，知识查询首选。

### 6.3 Wikipedia 英文 🆕

```
https://en.wikipedia.org/w/index.php?search=QUERY&title=Special:Search
```

英文维基百科，信息量最大的免费百科全书。

---

## 7. 即时答案

### 7.1 DDG Instant Answer API 🆕

```
https://api.duckduckgo.com/?q=QUERY&format=json&no_html=1
```

返回 JSON 格式的即时答案（定义、摘要、相关主题），适合快速获取事实性信息。

---

## 使用示例

```
# 中文搜索
web_fetch(url="https://www.baidu.com/s?wd=英伟达财报", extractMode="text", maxChars=12000)
web_fetch(url="https://m.so.com/s?q=英伟达财报", extractMode="text", maxChars=12000)

# 英文搜索
web_fetch(url="https://search.brave.com/search?q=AI+news", extractMode="text", maxChars=8000)
web_fetch(url="https://lite.duckduckgo.com/lite/?q=AI+news", extractMode="text", maxChars=8000)

# 公众号
web_fetch(url="https://weixin.sogou.com/weixin?type=2&query=英伟达&page=1", extractMode="text", maxChars=10000)

# 知识查询
web_fetch(url="https://zh.wikipedia.org/w/index.php?search=量子计算&title=Special:Search", extractMode="text", maxChars=8000)

# 投资
web_fetch(url="https://www.jisilu.cn/explore/?keyword=可转债", extractMode="text", maxChars=8000)

# 即时答案（JSON）
web_fetch(url="https://api.duckduckgo.com/?q=Python&format=json&no_html=1", extractMode="text", maxChars=5000)
```

---

## 引擎选择建议

| 场景 | 推荐引擎 |
|------|---------|
| 中文通用搜索 | 百度 → 360 → 搜狗 |
| 英文通用搜索 | Brave → DDG → Bing |
| 公众号文章 | 搜狗微信 → 必应索引 |
| 技术问题 | Stack Overflow → GitHub |
| 学术论文 | ArXiv |
| 最新资讯 | 头条搜索 → Hacker News |
| A股/投资 | 东方财富 → 集思录 |
| 财经深度 | 财新 |
| 知识/定义 | Wikipedia → Wolfram Alpha → DDG API |
| 隐私优先 | Brave → Mojeek → DDG |

---

## 更新日志

### v2.0.0
- 🆕 新增 9 个引擎：百度、Yahoo、Brave Search、Mojeek、头条搜索、集思录、Wikipedia 中英文、DDG Instant Answer API
- 📊 引擎总数：13 → 22
- 📋 新增「引擎选择建议」表
- 🏷️ 新增标签：baidu, brave-search, yahoo, mojeek, toutiao, jisilu, wikipedia

### v1.0.0
- ✅ 全新发布！聚合 13+ 免费中文搜索引擎
- ✅ 无需 API Key，真正免费
- ✅ 支持公众号、知乎、财经(A股)、技术搜索
- ✅ 多引擎智能切换
