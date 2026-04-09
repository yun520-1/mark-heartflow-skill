# HeartFlow - 日本語ドキュメント

**バージョン**: v2.3.0  
**最終更新**: 2026-04-09

---

## 🌍 言語選択

- [🇺🇸 English](en/README.md)
- [🇨🇳 中文](zh/README.md)
- 🇯🇵 [日本語](README.md) ← ここ
- [🇰🇷 한국어](ko/README.md)
- [🇫🇷 Français](fr/README.md)
- [🇮🇷 فارسی](fa/README.md)

---

## ✨ HeartFlow とは？

HeartFlowは**9次元認知アーキテクチャ**を持つAIコンパニオンシステムです：

| 次元 | 機能 |
|------|------|
| 🧠 認知ループ | R-CCAM: 検索→認知→制御→行動→記憶 |
| 🔄 自己進化 | 自己改善 + エージェントアーカイブ |
| 🌐 マルチエージェント | 動的トポロジー + 難易度感知ルーティング |
| ❤️ 感情計算 | LaScA 説明可能感情モデリング |
| 💾 記憶システム | エbbinghaus 忘却曲線 + 5通道検索 |
| 🛡️倫理安全 | ASL-1/2/3 分級セキュリティ |
| 👤 アイデンティティ | アイデンティティ持続性 + 自己修復 |
| 🫀 バイオセンサー | HRV、編集フロー、眼追跡 |
| 🤖 身体化認知 | 雙システムアーキテクチャ + アクション思考チェーン |

---

## 🚀 クイックスタート

```bash
# クローンしてインストール
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install

# 直接実行
node bin/cli.js

# APIサーバーも利用可能
node bin/api-server.js
```

---

## 📦 インストール

### 前提条件

| 要件 | バージョン | 確認コマンド |
|------|-----------|--------------|
| Node.js | ≥ 18.x | `node --version` |
| npm | ≥ 8.x | `npm --version` |

### インストール手順

```bash
# 1. クローン
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 2. インストール
npm install

# 3. テスト
npm test

# 4. 起動
npm start
```

---

## 💻 使い方

### CLI コマンド

```bash
# インタラクティブモード
node bin/cli.js

# ステータス表示
node bin/cli.js status

# テスト実行
node bin/cli.js test

# 感情検出
node bin/cli.js emotion "今日は很开心"

# 記憶保存
node bin/cli.js remember "ユーザーは詳しい説明が好き"

# 認知計画
node bin/cli.js plan "ログイン機能を実装" coding
```

---

## 🌐 API サーバー

```bash
# APIサーバー起動 (デフォルトポート 3456)
node bin/api-server.js
```

### API エンドポイント

| メソッド | エンドポイント | 説明 |
|----------|---------------|------|
| GET | `/api/health` | ヘルスチェック |
| GET | `/api/status` | システムステータス |
| POST | `/api/emotion` | 感情検出 |
| POST | `/api/flow` | フロー計算 |
| POST | `/api/memory` | 記憶保存/検索 |
| POST | `/api/plan` | 認知計画 |

---

## 📁 プロジェクト構造

```
mark-heartflow-skill/
├── bin/
│   ├── cli.js
│   └── api-server.js
├── src/core/
│   ├── heartflow-engine.js
│   ├── cognitive-loop.js
│   ├── triality-memory.js
│   └── ...
├── docs/
└── package.json
```

---

## 📊 バージョン履歴

| バージョン | 日付 | 機能 |
|-----------|------|------|
| v2.3.0 | 2026-04-09 | 9次元認知アーキテクチャ |
| v2.2.3 | 2026-04-09 | TrialityMemory + EmbodiedCore |

---

*HeartFlow - AIに心を与える*