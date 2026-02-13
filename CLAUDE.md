# Quant Sync Trade Web - 프론트엔드

이 문서는 Claude가 이 프로젝트에서 작업할 때 참고할 핵심 지침입니다.

---

## 프로젝트 정체성

**Quant Sync Trade Web** - 퀀트 자동매매 프론트엔드
- Next.js 16+ (App Router) + React 19
- Tailwind v4 + shadcn/ui
- Zustand v5 (상태 관리)
- Lightweight Charts v5 (차트)
- 백엔드: `quant-sync-trade` (NestJS, 기본 포트 6000)

---

## 프로젝트 구조

```
src/
  app/
    page.tsx                          # 차트 페이지 (메인)
    strategy/
      page.tsx                        # 전략 목록 페이지
      [id]/page.tsx                   # 전략 상세/편집 페이지

  components/
    layout/
      header.tsx                      # 헤더 (Chart / Strategy 네비게이션)
    chart/                            # 차트 관련 컴포넌트
    strategy/
      strategy-list.tsx               # 전략 목록 컨테이너
      strategy-card.tsx               # 전략 카드 (상태배지, 심볼, 드롭다운)
      create-strategy-dialog.tsx      # 전략 생성 다이얼로그
      delete-strategy-dialog.tsx      # 삭제 확인 AlertDialog
      strategy-settings-form.tsx      # 전략 설정 편집 폼
      indicator-config-list.tsx       # 지표 목록 + 추가/수정/삭제
      indicator-config-dialog.tsx     # 지표 추가/편집 다이얼로그
      signal-rule-list.tsx            # 규칙 목록 (BUY/SELL 그룹)
      signal-rule-editor.tsx          # 규칙 편집 다이얼로그
      condition-tree/
        condition-tree-builder.tsx    # 루트: immutable 트리 업데이트
        condition-group-node.tsx      # AND/OR 그룹 노드 (재귀)
        condition-leaf-node.tsx       # 단일 조건 행 (타입별 폼 위임)
        threshold-condition-form.tsx  # THRESHOLD: 지표 > 값
        cross-condition-form.tsx      # CROSS: 지표 교차 비교
        price-condition-form.tsx      # PRICE: 지표 vs 현재가
    ui/                               # shadcn/ui 컴포넌트

  hooks/
    use-strategies.ts                 # 전략 목록 페칭 + mutation
    use-strategy-detail.ts            # 전략 상세 (3개 병렬 API 호출)

  stores/
    strategy-store.ts                 # 전략 목록 상태
    strategy-detail-store.ts          # 전략 상세 편집 상태

  lib/
    api/
      client.ts                       # API 클라이언트 (응답 래핑 해제)
      strategy.ts                     # Strategy CRUD API
      strategy-indicator.ts           # Indicator Config API
      strategy-rule.ts                # Signal Rule API
    strategy/
      indicator-fields.ts             # 지표별 출력 필드 매핑
      condition-helpers.ts            # 조건 트리 유틸 (생성, 검증, 경로 업데이트)

  types/
    strategy.ts                       # 전략 관련 타입 + 상수 + 타입가드
```

---

## 핵심 패턴

### API 클라이언트

```typescript
// lib/api/client.ts - 모든 API 호출은 이 클라이언트를 통해
export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  // 응답 구조: { statusCode, message, isSuccess, data: { result, totalCount? } }
  // result를 추출하여 반환
}
```

### 백엔드 응답 구조

```json
{
  "statusCode": 200,
  "message": "...",
  "isSuccess": true,
  "data": {
    "result": { ... },
    "totalCount": 10
  }
}
```

`apiClient<T>`는 `json.data.result`를 추출하여 `T`로 반환.

### 백엔드 API 메서드 규칙

- **생성**: `POST`
- **수정**: `PUT` (PATCH 아님!)
- **삭제**: `DELETE`
- **활성화/비활성화**: `PUT /activate`, `PUT /deactivate`

### 상세 페이지 데이터 로딩

백엔드 `GET /v1/strategy/:id`는 중첩된 indicators/rules를 반환하지 않음 (`@Expose()` 미적용 필드는 `excludeExtraneousValues: true`로 제거됨). 따라서 3개 API를 병렬 호출:

```typescript
const [strategy, indicators, rules] = await Promise.all([
  fetchStrategyDetail(no),
  fetchIndicators(no),
  fetchRules(no),
]);
```

### Zustand 스토어 분리

- `strategy-store.ts`: 전략 **목록** 상태 (낙관적 업데이트)
- `strategy-detail-store.ts`: 전략 **상세** 편집 상태 (strategy + indicators[] + rules[] 분리 관리)

분리 이유: 목록 낙관적 업데이트와 상세 편집이 충돌하지 않도록.

---

## 백엔드 DTO 필드명 매핑 (중요!)

프론트엔드 타입은 백엔드 DTO와 1:1 매핑되어야 함. 주의할 필드명:

| 프론트엔드 | 설명 |
|------------|------|
| `userStrategyNo` | 전략 PK (strategyNo 아님) |
| `userIndicatorConfigNo` | 지표 설정 PK (indicatorNo 아님) |
| `userSignalRuleNo` | 시그널 규칙 PK (ruleNo 아님) |
| `ruleType` | 규칙 타입: BUY/SELL (type 아님) |
| `conditions` | 조건 트리 JSON (conditionTree 아님) |
| `logic` | ConditionGroup의 AND/OR (operator 아님) |
| `indicatorRef` | 조건에서 지표 참조 (number FK, 지표타입 string 아님) |
| `targetRef` | Cross 조건의 타겟 지표 참조 (number FK) |
| `displayName` | 지표 생성 시 필수 (타입+파라미터 조합명) |

### 비교 연산자

백엔드: `GT`, `GTE`, `LT`, `LTE`, `EQ`, `BETWEEN` (GREATER_THAN 등 아님)

### 배달 타입

백엔드: `NOTIFICATION`, `AUTO_TRADE`, `BOTH` (WEBHOOK/TELEGRAM/DISCORD 아님)

---

## Condition Tree (조건 트리)

### 구조

```typescript
ConditionGroup {
  logic: 'AND' | 'OR';
  conditions: (ConditionGroup | LeafCondition)[];
}

LeafCondition = ThresholdCondition | CrossCondition | PriceCondition;
```

### 조건 타입별 필드

| 타입 | 필수 필드 |
|------|-----------|
| THRESHOLD | `indicatorRef`, `field`, `operator`, `value` (number 또는 [min, max]) |
| CROSS | `indicatorRef`, `field`, `operator`, `targetRef`, `targetField` |
| PRICE | `indicatorRef`, `field`, `operator`, `priceField` |

### 지표 필드 매핑 (indicator-fields.ts)

| 지표 타입 | 출력 필드 |
|-----------|-----------|
| MA, EMA, RSI | `value` |
| MACD | `macd`, `signal`, `histogram` |
| BOLLINGER | `upper`, `middle`, `lower` |
| STOCHASTIC | `k`, `d` |

### 제약사항 (STRATEGY_LIMITS)

- 전략 최대 10개
- 지표 최대 20개/전략
- 규칙 최대 5개/타입/전략
- 조건 트리 최대 깊이 3

### 사용 순서 (중요!)

1. **Indicators 탭**에서 지표 먼저 추가 (RSI, MACD, MA 등)
2. **Rules 탭**에서 규칙 추가 → 조건에서 등록된 지표를 참조
3. 조건의 `indicatorRef`는 `userIndicatorConfigNo` (number FK)를 참조

---

## UI 테마

TradingView 다크 테마 스타일:

| 용도 | 색상 |
|------|------|
| 배경 (깊은) | `#0a0e17` |
| 배경 (기본) | `#131722` |
| 배경 (카드/패널) | `#1e222d` |
| 보더 | `#2a2e39` |
| 텍스트 (기본) | `#d1d4dc` |
| 텍스트 (보조) | `#787b86` |
| 액센트 (파랑) | `#2962ff` |
| 성공 (초록) | `#26a69a` |
| 위험 (빨강) | `#ef5350` |
| AND 그룹 | `#2196F3` (파랑) |
| OR 그룹 | `#FFD54F` (노랑) |
| THRESHOLD 뱃지 | `#26a69a` (초록) |
| CROSS 뱃지 | `#ab47bc` (보라) |
| PRICE 뱃지 | `#ff9800` (주황) |

---

## 기술 스택 주의사항

### Next.js 16+ (App Router)

- 동적 라우트 params는 `Promise`로 전달: `params: Promise<{ id: string }>`
- `use(params)`로 unwrap

### React 19

- `useRef`는 반드시 초기값 필요: `useRef<T | undefined>(undefined)`

### Lightweight Charts v5

- 시리즈 추가: `chart.addSeries(CandlestickSeries, opts)` (v4의 `addCandlestickSeries` 아님)
- 시리즈 타입 import: `CandlestickSeries`, `LineSeries`, `HistogramSeries` (값으로 import)
- `lineWidth`: `as LineWidth` 캐스트 필요 (branded type)
- `ColorType`: 값으로 import (`import { ColorType }`)

### Tailwind v4

- `@import` 방식 사용 (v3의 `@tailwind` 아님)

### shadcn/ui 설치된 컴포넌트

badge, button, card, input, label, textarea, dialog, alert-dialog, switch, tabs,
dropdown-menu, select, tooltip, scroll-area, skeleton, separator

---

## 커맨드

```bash
# 개발
npm run dev                    # Next.js 개발 서버

# 빌드
npm run build

# 타입 체크
npx tsc --noEmit

# shadcn/ui 컴포넌트 추가
npx shadcn@latest add [component-name]
```

---

## 백엔드 연동 설정

`next.config.ts`에서 API 프록시:
- `/api/v1/*` → `http://localhost:6000/v1/*` (rewrites)
- 프론트엔드 코드에서는 `/api/v1/...` 경로 사용

---

## 변경 이력

### 2026-02-12: 전략 관리 UI 구현
- **신규**: 전략 CRUD, 지표 설정, 시그널 규칙 관리 UI
- **핵심**: Condition Tree Builder (재귀 AND/OR 그룹 + 3가지 조건 타입)
- **백엔드 수정** (quant-sync-trade):
  - `apps/api/src/main.ts`: `initializeTransactionalContext()` 추가
  - `libs/core/src/config/modules/common-datasource.module.ts`: `addTransactionalDataSource()` + `dataSourceFactory` 추가
  - 이 두 가지는 `typeorm-transactional` 라이브러리 초기화에 필수
