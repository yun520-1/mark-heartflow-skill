# HeartFlow 轻量级安装

## 快速安装（Core ~3MB）

```bash
# 1. 克隆仓库（仅核心文件）
git clone --depth 1 --filter=blob:none --sparse https://github.com/yun520-1/mark-heartflow-skill.git heartflow
cd heartflow
git sparse-checkout set src/core mcp bin VERSION package.json config.json

# 2. 安装依赖
npm install

# 3. 验证安装
node core/upgrade.js --check
```

## 按需升级

```bash
# 下载AI认知引擎（~5MB）
node core/upgrade.js --engines

# 下载公式数据库（~10MB）
node core/upgrade.js --data

# 下载全部
node core/upgrade.js --full

# 下载指定引擎
node core/upgrade.js --engine creativity
node core/upgrade.js --engine humor
```

## 组件说明

| 组件 | 大小 | 安装命令 | 说明 |
|------|------|----------|------|
| Core | ~3MB | 默认安装 | 核心引擎、MCP server、CLI |
| Engines | ~5MB | `--engines` | 11个AI认知引擎 |
| Data | ~10MB | `--data` | 公式库(2397个)、知识图谱 |
| Skills | ~3MB | `--skills` | 额外skill模块 |

## 验证安装

```bash
node core/upgrade.js --check
```

输出示例：
```
Core:        ✅ Installed
engines      ✅ 11/11 files (~5MB)
data         ⚠️  2/5 files (~10MB)
skills       ❌ 0/3 files (~3MB)
```
