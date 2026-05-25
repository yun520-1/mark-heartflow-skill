name: hermes-browser-bridge
version: 0.1.0
description: "心虫浏览器桥接 — 操控用户已登录的 Chrome/Edge，搜索/截图/填表/下载。复用登录状态，无需重新登录。"
author: "xxxsuke"
homepage: "https://github.com/xxxsuke/hermes-browser-bridge"
trigger:
  keywords:
    - 搜一下
    - 打开网页
    - 截图
    - 帮我搜索
    - 浏览器操控
    - 下载文件
    - 读取页面
    - 填表

capabilities:
  - 控制已登录浏览器（不新开窗口）
  - 搜索、多引擎切换
  - 截图、页面读取
  - 表单填写、文件下载

architecture:
  bridge: /Users/apple/.hermes/plugins/hermes-browser-bridge/bridge.py
  client: /Users/apple/.hermes/plugins/hermes-browser-bridge/hermes_client.py
  extension: /Users/apple/.hermes/plugins/hermes-browser-bridge/extension/

start:
  python /Users/apple/.hermes/plugins/hermes-browser-bridge/bridge.py

ports:
  ws: 9876

requirements:
  pip install websockets