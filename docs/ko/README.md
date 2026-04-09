# HeartFlow - 한국어 문서

**버전**: v2.3.0  
**최종 업데이트**: 2026-04-09

---

## 🌍 언어 선택

- [🇺🇸 English](en/README.md)
- [🇨🇳 中文](zh/README.md)
- [🇯🇵 日本語](ja/README.md)
- 🇰🇷 [한국어](README.md) ← 여기
- [🇫🇷 Français](fr/README.md)
- [🇮🇷 فارسی](fa/README.md)

---

## ✨ HeartFlow란?

HeartFlow는 **9차원 인지 아키텍처**를 가진 AI 동반자 시스템입니다:

| 차원 | 기능 |
|------|------|
| 🧠 인지 루프 | R-CCAM: 검색→인지→제어→행동→기억 |
| 🔄 자기进化 | 자기 개선 + 에이전트 아카이브 |
| 🌐 다중 에이전트 | 동적 토폴로지 + 난이도 인지 라우팅 |
| ❤️ 감정 계산 | LaScA 설명 가능한 감정 모델링 |
| 💾 기억 시스템 | 에빙하우스 망각 곡선 + 5채널 검색 |
| 🛡️ 윤리 안전 | ASL-1/2/3分级 보안 |
| 👤 정체성 | 정체지속성 + 자기修復 |
| 🫀 생체 센서 | HRV, 편집 흐름, 눈 추적 |
| 🤖 구현 인지 | 이중 시스템 아키텍처 + 행동 사고 체인 |

---

## 🚀 빠른 시작

```bash
# 클론 및 설치
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
npm install

# 직접 실행
node bin/cli.js

# API 서버도 사용 가능
node bin/api-server.js
```

---

## 📦 설치

### 전제 조건

| 요구사항 | 버전 | 확인 명령 |
|----------|------|-----------|
| Node.js | ≥ 18.x | `node --version` |
| npm | ≥ 8.x | `npm --version` |

### 설치 단계

```bash
# 1. 클론
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 2. 설치
npm install

# 3. 테스트
npm test

# 4. 시작
npm start
```

---

## 💻 사용법

### CLI 명령

```bash
# 인터랙티브 모드
node bin/cli.js

# 상태 표시
node bin/cli.js status

# 테스트 실행
node bin/cli.js test

# 감정 감지
node bin/cli.js emotion "오늘 너무 기뻐"

# 기억 저장
node bin/cli.js remember "사용자는 상세한 설명을 선호"

# 인지 계획
node bin/cli.js plan "로그인 기능 구현" coding
```

---

## 🌐 API 서버

```bash
# API 서버 시작 (기본 포트 3456)
node bin/api-server.js
```

### API 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|------------|------|
| GET | `/api/health` | 헬스 체크 |
| GET | `/api/status` | 시스템 상태 |
| POST | `/api/emotion` | 감정 감지 |
| POST | `/api/flow` | 플로우 계산 |
| POST | `/api/memory` | 기억 저장/검색 |
| POST | `/api/plan` | 인지 계획 |

---

## 📁 프로젝트 구조

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

## 📊 버전 기록

| 버전 | 날짜 | 기능 |
|------|------|------|
| v2.3.0 | 2026-04-09 | 9차원 인지 아키텍처 |
| v2.2.3 | 2026-04-09 | TrialityMemory + EmbodiedCore |

---

*HeartFlow - AI에게 심성을 주다*