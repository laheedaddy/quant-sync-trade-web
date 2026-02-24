# Quant Sync Trade Web - 프론트엔드

이 문서는 Claude가 이 프로젝트에서 작업할 때 참고할 핵심 지침입니다.

---

## 응답 언어

- **항상 한글로 응답**합니다.
- 코드, 커밋 메시지, 변수명은 영어 사용 가능하지만, 설명/요약/대화는 반드시 한글로 작성합니다.

---

## 프로젝트 정체성

**Quant Sync Trade Web** - 퀀트 자동매매 프론트엔드
- Next.js 16+ (App Router) + React 19
- Tailwind v4 + shadcn/ui
- Zustand v5 (상태 관리)
- Lightweight Charts v5 (차트)
- sonner (토스트 알림)
- 백엔드: `quant-sync-trade` (NestJS, 기본 포트 6000)

---

## 프로젝트 구조

```
src/
  app/
    page.tsx                          # 차트 페이지 (메인)

  components/
    layout/
      header.tsx                      # 헤더 (Chart 네비게이션)
    chart/                            # 차트 관련 컴포넌트
    strategy/
      strategy-editor.tsx             # ★ 공유 전략 편집기 (Settings/Indicators/Rules 탭)
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
    backtest/
      strategy-panel.tsx             # 차트 페이지 우측 패널 (3탭: Strategy/Backtest/History)
      strategy-select-tab.tsx        # Strategy 탭: 하이라키 바인딩 목록 (전략 > 버전 트리) + 상세(StrategyEditor)
      strategy-detail-panel.tsx      # 전략 상세 패널 (3탭: Backtest/Edit/Channel)
      backtest-tab.tsx               # Backtest 탭: 전략/버전 드롭다운 + 실행 + 인라인 편집(StrategyEditor)
      history-tab.tsx                # History 탭: 백테스트 이력 (스냅샷 요약 포함)
      connect-strategy-dialog.tsx    # 전략-심볼 연결 다이얼로그
      backtest-results-summary.tsx   # 결과 요약 (스냅샷 상세 포함)
      backtest-trade-list.tsx        # 거래 내역 리스트
    signal-channel/
      channels-tab.tsx               # 시그널 채널 목록 탭 + ChannelCard 컴포넌트
      create-channel-dialog.tsx      # 채널 생성 다이얼로그 (제목/설명 + 자동 symbol/timeframe)
      channel-logs-dialog.tsx        # 시그널 로그 조회 다이얼로그
    ui/                               # shadcn/ui 컴포넌트

  hooks/
    use-strategies.ts                 # 전략 목록 페칭 + mutation (toast 알림)
    use-strategy-detail.ts            # 전략 상세 (3개 병렬 API 호출, toast 알림)
    use-backtest.ts                   # 백테스트 실행/이력 (toast 알림)
    use-strategy-versions.ts          # 전략 버전 CRUD (toast 알림)
    use-symbol-bindings.ts            # 종목-버전 바인딩 CRUD (toast 알림)
    use-signal-channels.ts            # 시그널 채널 CRUD + 상태 전환 (toast 알림)

  stores/
    strategy-store.ts                 # 전략 목록 상태
    strategy-detail-store.ts          # 전략 상세 편집 상태
    backtest-store.ts                 # 백테스트 상태 (ActiveTab, DetailTab 포함)
    chart-store.ts                    # 차트 상태
    signal-channel-store.ts           # 시그널 채널 상태

  lib/
    api/
      client.ts                       # API 클라이언트 (에러 body 파싱 포함)
      strategy.ts                     # Strategy CRUD API
      strategy-indicator.ts           # Indicator Config API
      strategy-rule.ts                # Signal Rule API
      strategy-version.ts             # Strategy Version API
      strategy-binding.ts             # Symbol Binding CRUD API
      backtest.ts                     # Backtest API
      signal-channel.ts               # Signal Channel CRUD + 상태 전환 API
    toast.ts                          # 공통 toast 유틸리티 (sonner)
    strategy/
      indicator-fields.ts             # 지표별 출력 필드 매핑
      condition-helpers.ts            # 조건 트리 유틸 (생성, 검증, 경로 업데이트)

  types/
    strategy.ts                       # 전략 관련 타입 + 상수 + 타입가드
    backtest.ts                       # 백테스트 타입 (StrategySnapshot 포함)
    signal-channel.ts                 # 시그널 채널 타입 (SignalChannel, CreateSignalChannelRequest 등)
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

**인증 처리**: `apiClient`는 `useAuthStore`에서 `accessToken`을 자동 주입하고, 401 응답 시 `tryRefreshToken()`으로 1회 재시도. refresh 실패 시 `clearAuth()` + `/login`으로 자동 리다이렉트.

**`totalCount`가 필요한 API**: `apiClient`는 `result`만 반환하므로, `totalCount`도 필요한 경우 raw `fetch()`를 사용한다. 이때 **반드시** `useAuthStore.getState().accessToken`으로 Authorization 헤더를 주입하고, 401 시 `tryRefreshToken()`을 호출해야 한다 (예: `fetchConditionLogs`).

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

LeafCondition = ThresholdCondition | CrossCondition | PriceCondition | PositionCondition;
```

### 조건 타입별 필드

| 타입 | 필수 필드 |
|------|-----------|
| THRESHOLD | `indicatorRef`, `field`, `operator`, `value` (number 또는 [min, max]) |
| CROSS | `indicatorRef`, `field`, `operator`, `targetRef`, `targetField` |
| PRICE | `indicatorRef`, `field`, `operator`, `priceField` |
| POSITION | `field` (changePercent/trailingPercent/highChangePercent/holdingMinutes), `operator`, `value` — 지표 참조 없음 |

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

### 2026-02-14: Toast System + Settings Tab + Backtest Snapshot
- **Toast System**: sonner 기반 공통 토스트 알림 (`lib/toast.ts`)
  - API client 에러 body 파싱 개선 (서버 에러 메시지 추출)
  - 모든 hooks에 `showError`/`showSuccess` 적용
  - Layout에 `<Toaster />` 추가 (TradingView 다크 테마)
- **Settings Tab**: 차트 페이지 패널에 4번째 탭 추가
  - 기존 공유 컴포넌트 재사용 (StrategySettingsForm, IndicatorConfigList, SignalRuleList)
- **Backtest Strategy Snapshot**: 백테스트 실행 시 전략 스냅샷 JSONB 저장
  - 프론트엔드: History 탭 스냅샷 요약, 결과 요약에 스냅샷 상세 표시
  - **백엔드 수정** (quant-sync-trade):
    - `StrategySnapshotType` 추가 (entities/types)
    - `BacktestRunEntity`에 `strategySnapshot` JSONB 컬럼 추가
    - `CommonBacktestService.runBacktest()`에서 스냅샷 저장

### 2026-02-14: 전략 버전 관리 시스템
- **Strategy Versioning**: 전략 버전 관리 (스냅샷 기반)
  - Version 탭 추가 (5번째 탭): 버전 생성/상세/복원/삭제
  - 백테스트 실행 시 자동 버전 생성
  - History/Results에 버전 정보 표시
  - `use-strategy-versions.ts` 훅, `strategy-version.ts` API 클라이언트
  - `backtest-store.ts`에 versions[], selectedVersionNo 추가
  - **백엔드 수정** (quant-sync-trade):
    - `UserStrategyVersionEntity` 추가 (JSONB 스냅샷)
    - `BacktestRunEntity`에 `userStrategyVersionNo` FK 추가
    - `CommonStrategyService`에 5개 버전 메서드 + `buildVersionSnapshot` 헬퍼
    - `CommonBacktestService.runBacktest()`에서 자동 버전 생성
    - Strategy/Backtest 컨트롤러에 버전 엔드포인트 추가

### 2026-02-14: 백테스트 패널 UI 리디자인 + 공유 StrategyEditor
- **StrategyEditor 공유 컴포넌트** (`strategy/strategy-editor.tsx`)
  - `useStrategyDetail(strategyNo)` + Settings/Indicators/Rules 탭을 하나의 컴포넌트로 통합
  - 사용처: 전략 상세 페이지(`/strategy/[id]`), 차트 패널 Strategy 탭 상세뷰, Backtest 탭 인라인 편집
  - `onChanged` 콜백으로 편집 후 버전 목록 새로고침 지원
- **Backtest 탭 리디자인** (`backtest-tab.tsx`)
  - 전략 드롭다운 (useStrategies) + 버전 드롭다운 (MAJOR/MINOR 구분, 마이너 개수 표시)
  - "Latest (Live)" 옵션: 라이브 config로 실행
  - 접기/펼치기 "Strategy Edit" 섹션 → StrategyEditor 컴포넌트 사용
- **Version 탭 리디자인** (`version-tab.tsx`)
  - flat list → Major > Minor 계층 트리 뷰
  - Draft 그룹 (첫 MAJOR 이전 MINOR들), Major 노드 접기/펼치기
  - Major: 파란색 `v{N}`, 마이너 개수 항상 표시, Deploy/Restore/Delete 액션
  - Minor: 주황색 `d{N}`, 들여쓰기, Info/Delete만
  - 클릭 시 `selectedVersionNo` 설정 → Backtest 탭 버전 드롭다운에 반영
- **Strategy 탭 개선** (`strategy-select-tab.tsx`)
  - 바인딩 목록: MAJOR 버전 + 마이너 개수 배지 표시 (`{N}v {N}d`)
  - 상세뷰: 수동 조립 → StrategyEditor 공유 컴포넌트로 교체
- **전략 상세 페이지 간소화** (`strategy/[id]/page.tsx`)
  - `useStrategyDetail` 직접 사용 → StrategyEditor 컴포넌트로 교체

### 2026-02-14: 전략-종목-버전 바인딩 시스템
- **Symbol Binding**: 종목별 독립 버전 배포 아키텍처
  - Deploy 탭 추가 (6번째 탭): 종목에 특정 버전 배포/수정/해제
  - Version 탭에 "Deploy" 버튼 추가 (현재 차트 종목에 즉시 배포)
  - Backtest 탭에 배포된 버전 표시, 배포 버전 기반 백테스트 실행
  - `use-symbol-bindings.ts` 훅, `strategy-binding.ts` API 클라이언트
  - `backtest-store.ts`에 symbolBindings[], deploy 탭 추가
  - `RunBacktestRequest`에 `userStrategyVersionNo` 추가
  - **백엔드 수정** (quant-sync-trade):
    - `UserStrategySymbolBindingEntity` 추가 (전략-종목-버전 바인딩)
    - `CommonStrategyService`에 바인딩 CRUD 6개 메서드 추가
    - `CommonBacktestService.runBacktest()`에서 버전/바인딩 기반 스냅샷 실행 지원
    - Strategy 컨트롤러에 바인딩 CRUD 엔드포인트 (GET/POST/PUT/DELETE)
    - `deleteVersion()` 시 참조 바인딩 자동 비활성화

### 2026-02-16: Signal Channel 탭 + 실시간 시세 수신 관리
- **Signal Channel 탭**: 전략 상세 패널(`strategy-detail-panel.tsx`)에 3번째 탭 추가
  - `DetailTab` 타입에 `'channel'` 추가 (`backtest-store.ts`)
  - `StrategyChannelContent` 로컬 컴포넌트: 기존 signal-channel 인프라 100% 재사용
  - `ChannelCard` 내보내기 (channels-tab.tsx → strategy-detail-panel.tsx 공유)
- **채널 생성 다이얼로그 간소화** (`create-channel-dialog.tsx`)
  - symbol/timeframe: 전략에서 자동 전달 (prop), 사용자 입력 제거
  - title(필수)/description(선택) 입력 추가
- **채널 상태 머신**: DISCONNECTED → CONNECTED → RECEIVING
  - Connect/Disconnect, Start/Stop Receiving, Delete 전체 관리
  - 수신 시작 시 백엔드에서 CollectionTarget 자동 확보 (ensureCollectionTarget)

### 2026-02-16: Strategy 탭 하이라키 구조 + Version 탭 제거
- **Strategy 탭 하이라키 리디자인** (`strategy-select-tab.tsx`)
  - flat 바인딩 목록 → 확장 가능한 BindingCard (전략 > 버전 트리)
  - 각 카드 확장 시 Major > Minor 계층 트리 표시 (Draft 그룹 포함)
  - 인라인 버전 관리: 생성/삭제/복원/배포 액션
  - 편집 아이콘으로 상세뷰(StrategyEditor) 진입
  - 버전 목록은 per-binding 독립 로딩 (공유 스토어 충돌 방지)
- **Version 탭 제거**
  - `strategy-panel.tsx`: 4탭 → 3탭 (Strategy/Backtest/History)
  - `backtest-store.ts`: `ActiveTab`에서 `'version'` 제거
  - `version-tab.tsx`: 패널에서 미사용 (코드 보존)

### 2026-02-17: 차트 지표 토글 버그 수정
- **Bollinger Band 토글 먹통 수정** (`hooks/use-chart-indicators.ts`)
  - TypeORM `bigint` 컬럼이 JavaScript string으로 반환되어 `===` 비교 실패
  - 모든 `userChartIndicatorConfigNo` 할당에 `Number()` 변환 추가
  - 영향 범위: version/strategy/default 모드 load, add, toggle, update 전체
- **지표 숨기기 시 레전드 사라짐 수정** (`hooks/use-chart-data.ts`, `components/chart/chart-legend.tsx`)
  - `activeKey`에서 `isActive` 제거 → 토글 시 차트 데이터 refetch 방지
  - 비활성 지표: `opacity-40` 스타일 + 값 미표시 (레전드 유지)
- **주의사항**: TypeORM `bigint` → JS `string` 문제는 `@Transform(() => Number())` 미적용 DTO에서 반복 발생 가능

### 2026-02-17: 관리자 Backfill 기능
- **Collection Targets Backfill UI** (`app/management/page.tsx`)
  - 각 수집 대상 행에 "Backfill" 버튼 추가
  - Backfill 다이얼로그: 대상 심볼/타임프레임 표시 + 날짜 범위 입력 (2015-01-01 ~ 오늘)
  - `BackfillRequest`, `BackfillResult` 타입 추가 (`types/management.ts`)
  - `backfillCollectionTarget()` API 함수 추가 (`lib/api/management.ts`)
  - `backfill()` 훅 메서드 추가 (`hooks/use-management.ts`)
  - **백엔드 수정** (quant-sync-trade):
    - `BackfillByTargetDto` 추가 (`libs/types` — from/to만 받는 경량 DTO)
    - `CollectionTargetService.backfill()` 메서드 추가 (crypto 자동 판별)
    - `POST collector/target/:no/backfill` 엔드포인트 추가 (console-api)
    - `CollectionTargetModule`에 `CommonCollectorModule` import 추가

### 2026-02-17: 실시간 시그널 PRICE 조건 수정
- **실시간 OHLC → 체결가 통일** (`apps/signal/src/biz/signal/signal-processor.service.ts`)
  - `handleRealtimeQuote()`에서 OHLC 4개 필드 모두 현재 체결가(`message.price`)로 설정
  - 백테스트: 완성된 캔들 OHLC 사용 (기존 유지)
  - 실시간: 틱(체결가)만 유의미하므로 `openPrice=highPrice=lowPrice=closePrice=tickPrice`
  - Rule Editor에 안내 문구 추가 (`signal-rule-editor.tsx`): "PRICE 조건의 O/H/L/C는 백테스트에서만 구분"
- **설계 원칙**: PRICE 조건의 `priceField` (open/high/low/close)는 백테스트에서 캔들 내 세밀한 비교에 사용. 실시간에서는 항상 현재 체결가와 비교

### 2026-02-19: POSITION (SL/TP) 조건 UI 추가
- **타입 확장** (`types/strategy.ts`):
  - `CONDITION_TYPES`에 `'POSITION'` 추가
  - `POSITION_FIELDS` 상수: `changePercent`, `trailingPercent`, `highChangePercent`, `holdingMinutes`
  - `POSITION_FIELD_LABELS` 한글 레이블: 수익률 %, 고점 대비 %, 최고 수익률 %, 보유 시간(분)
  - `PositionCondition` 인터페이스, `LeafCondition` 유니온에 추가
- **새 컴포넌트** (`condition-tree/position-condition-form.tsx`):
  - 필드 선택 (4종) + 연산자 선택 (GT/GTE/LT/LTE/EQ) + 값 입력 + 단위 표시 (%/분)
  - 지표 선택 없음 (POSITION은 지표 참조 불필요)
- **조건 빌더 통합**:
  - `condition-leaf-node.tsx`: POSITION 뱃지 (빨간색 `#ef5350`, 'SL/TP' 레이블) + PositionConditionForm 렌더링
  - `condition-group-node.tsx`: "Add condition" 드롭다운에 `POSITION (SL/TP)` 메뉴 추가
- **헬퍼 업데이트** (`lib/strategy/condition-helpers.ts`):
  - `createDefaultPosition()`: `{ type: 'POSITION', field: 'changePercent', operator: 'LTE', value: -5 }`
  - `createDefaultLeaf()`에 `'POSITION'` 케이스 추가
  - `validateConditionTree()`에 POSITION 검증 (field 필수)
- **규칙 요약 수정** (`signal-rule-list.tsx`): POSITION 조건 요약 표시 (지표명 대신 필드명 표시)

### 2026-02-19: 차트 캔들 타임스탬프 — Binance 표준(시작시각) 전환
- **오프셋 제거** (`lib/chart/utils.ts`):
  - `getDisplayTimeOffset()`: 항상 0 반환 (기존: 분봉에 interval 초 추가)
  - `getCurrentBucketTimestamp()`: `bucketStart` 반환 (기존: `bucketStart + interval`)
  - JSDoc 업데이트: "open-time convention (Binance standard)"
- **영향**: `transformCandles`, `transformVolume`, `transformIndicatorLine` 등 모든 차트 데이터가 open-time 기준 표시

### 2026-02-19: 차트 지표 실시간 갱신 + WebSocket 안정화
- **refreshLatest 지표 포함** (`hooks/use-chart-data.ts`):
  - `refreshLatest`에서 `candlesOnly: true` 제거 → 지표 데이터도 함께 갱신
  - `mergeLatestIndicators()`: 기존 지표 데이터에 최신 값 tail-merge
- **WebSocket 구독 참조 카운팅** (`lib/socket/socket-manager.ts`):
  - `activeSymbols: Set<string>` → `symbolRefCount: Map<string, number>`
  - 여러 컴포넌트가 같은 심볼 구독 시 마지막 해제까지 유지 (탭 전환 시 끊김 방지)
- **지표 overlay 라인 forming candle 연장** (`components/chart/candlestick-chart.tsx`):
  - `lastIndicatorValueRef`: 마지막 지표 값 추적
  - overlay 라인을 forming candle 타임스탬프까지 연장
  - 버킷 전환 시 overlay 지표도 새 시간대에 연장

### 2026-02-19: 채널 모니터 POSITION 수정 + 실시간 표시 + 자동 갱신
- **POSITION changePercent -100% 버그 수정**:
  - 백엔드: `getChannelMonitor()`에 `currentPrice` 쿼리 파라미터 추가 → EvaluationContext에 반영
  - 프론트엔드: `fetchChannelMonitor()`에 `currentPrice` 전달, `tickPriceRef`로 최신 체결가 사용
- **POSITION 표시 형식 개선** (`channel-detail-view.tsx`):
  - `Ref#0` 제거 → 뱃지 `SL/TP` (빨간색), 필드 한글화 (`수익률`, `고점 대비`), 단위 표시 (`%`/`분`)
  - `LeafConditionEval.type`에 `'POSITION'` 추가 (`types/signal-channel.ts`)
- **POSITION 수익률 실시간 갱신**:
  - `changePercent`: `tickPrice`와 `lastSignalPrice`로 매 렌더마다 재계산 + `(live)` 라벨
  - 수익률 양수 초록/음수 빨강 색상 구분
  - `lastSignalPrice` prop 체인: MonitorSection → RuleEvalCard → ConditionNode → LeafConditionRow
- **매수가 옆 수익률 표시**: 마지막 시그널이 BUY일 때 Monitor 상단에 `+0.47%` (초록) / `-2.31%` (빨강)
- **버킷 전환 자동 갱신** (`channel-detail-view.tsx`):
  - `ChannelDetailView`에서 1초 간격 `getCurrentBucketTimestamp()` 체크
  - 타임프레임 경계(예: 35분→36분) 넘어가면 Status + Monitor API 자동 재호출
  - `bucketKey` 상태로 MonitorSection에 갱신 트리거 전달

### 2026-02-20: Management 페이지 — CollectionTarget → Stock 통합
- **Collection Targets 탭 제거**: 단일 Stocks 뷰로 통합
- **Stock 테이블에 `Collect` 토글 추가**: `isCollectionActive` on/off (수집 활성 여부, `isActive`와 분리)
- **Stock 행에 `Backfill` 버튼 추가**: `POST /v1/stock/:no/backfill` → 전체 타임프레임 일괄 수집
- **수집 종목 카운트 표시**: "N collecting" 초록색 텍스트
- **타입 변경**: `Stock` 인터페이스에 `isCollectionActive` 추가, `UpdateStockRequest`에 `isCollectionActive` 추가
- **제거된 코드**: `CollectionTarget` 타입, `useCollectionTargetManagement` 훅, CollectionTarget API 함수, `TIMEFRAMES`/`COLLECTION_TYPES` 상수

### 2026-02-21: 종목 식별자 확장 (3중 식별자 체계)
- **타입 확장** (`types/management.ts`):
  - `Stock` 인터페이스에 `fmpSymbol` (string|null), `isin` (string|null), `cik` (string|null) 추가
  - `CreateStockRequest`에 `fmpSymbol?`, `isin?` 추가
- **Management 테이블 확장** (`app/management/page.tsx`):
  - FMP Symbol 컬럼 추가 (Symbol 옆, 회색 mono)
  - ISIN 컬럼 추가 (Exchange 옆, 10px mono)

### 2026-02-21: Collect Daily 수동 트리거 + Management UI
- **`collectDaily()` API 함수** (`lib/api/management.ts`): `POST /v1/stock/collect-daily` 호출
- **`collectDailyAll()` 훅 메서드** (`hooks/use-management.ts`): 성공/에러 토스트 포함
- **Collect Daily 버튼** (`app/management/page.tsx`): 초록색 버튼, 툴바에 배치 — 활성 종목 전체 1day 봉 수동 수집

### 2026-02-21: 종목 삭제/비활성화 시 연쇄 처리 (Cascade) + 검색/차트/왓치리스트 경고 표시
- **백엔드 cascade** (quant-sync-trade):
  - `CommonSignalChannelService.forceStopReceivingBySymbol(symbol)`: 심볼 기준 모든 채널 `isReceiving=false`, `isConnected=false` 일괄 처리 + PubSub 발행
  - `CommonSignalChannelService.ensureStockActive(symbol)`: `connect()`/`startReceiving()` 시 비활성/삭제 종목 차단 (`BadRequestException`)
  - `CommonStockService.updateStock()`: 비활성화 시 `isCollectionActive=false` + `forceStopReceivingBySymbol()` cascade
  - `CommonStockService.deleteStock()`: `isDelete=true` + `isActive=false` + `isCollectionActive=false` + `forceStopReceivingBySymbol()` cascade
  - `CommonStockService.restoreStock()`: 삭제된 종목 복원 (`isDelete=false`, `isActive=true`)
  - `POST /v1/stock/:no/restore` 엔드포인트 추가 (console-api)
  - `CommonStockModule`에 `CommonSignalChannelModule` import, `CommonSignalChannelModule`에 `CommonMessagingModule` import
  - `searchStocks()`: `isDelete`/`isActive` 필터 제거 → 비활성/삭제 종목도 검색 노출 (프론트엔드 경고 표시용)
  - Watchlist `getGroups()`: 아이템에 `s.isActive`, `s.isDelete` (alias `stockIsDelete`) JOIN 추가
- **프론트엔드 타입** (quant-sync-trade-web):
  - `StockSearchResult`에 `isActive`, `isDelete` 추가 (`types/stock.ts`)
  - `WatchlistItem`에 `isActive`, `isDelete` 추가 (`types/watchlist.ts`)
- **검색 다이얼로그** (`chart/symbol-search-dialog.tsx`):
  - `SymbolLogo` 컴포넌트: `useState(imgError)` 패턴으로 이미지 fallback (첫 글자 표시)
  - 비활성 종목: `INACTIVE` 빨간 배지 + "해당 종목은 관리되지 않는 종목입니다"
  - 삭제 종목: `DELETED` 빨간 배지 + "삭제된 종목입니다"
- **차트 페이지** (`chart/chart-container.tsx`):
  - `getStockBySymbol()` API로 종목 상태 확인 (`lib/api/stock.ts`)
  - 비활성/삭제 종목 진입 시 빨간 경고 배너: "해당 종목은 관리되지 않는 종목입니다. 시세 수신 및 데이터 수집이 중단되었을 수 있습니다."
- **왓치리스트** (`watchlist/watchlist-panel.tsx`):
  - `DraggableWatchlistItemRow`: `(!isActive || isDelete)` 시 `opacity-50`
  - `WatchlistItemContent`: `AlertTriangle` 아이콘 + 삭제/비활성 라벨 구분
  - `StaticWatchlistItemRow`: `useState(imgError)` 패턴으로 이미지 fallback
- **왓치리스트 검색** (`watchlist/add-watchlist-item-dialog.tsx`):
  - `DELETED`/`INACTIVE` 배지 + 경고 문구 + `opacity-50` 처리

### 2026-02-21: Management 페이지 — 종목 복원 + 컨펌 다이얼로그
- **종목 복원 (Undelete)**:
  - `restoreStock(no)` API 함수 (`lib/api/management.ts`): `POST /v1/stock/:no/restore`
  - `restore(stockNo)` 훅 메서드 (`hooks/use-management.ts`): 낙관적 업데이트 + 토스트
  - 삭제된 종목 행: `opacity-50` + `DELETED` 빨간 배지
  - Actions: 삭제 종목은 `Delete` 대신 초록색 `Restore` 버튼
- **Generic Confirm Dialog 패턴** (`app/management/page.tsx`):
  - `confirmDialog` 상태: `{ title, description, confirmLabel, confirmClassName?, onConfirm }`
  - 기존 `deleteTarget` / `handleDelete` 패턴을 generic confirm으로 통합
  - 적용 대상:
    - **Active 스위치 (비활성화)**: "시그널 채널 중지 + 수집 비활성화" 경고
    - **Active 스위치 (활성화)**: 확인
    - **Delete 버튼**: "Active, Collect 비활성화 + 시그널 중지" 경고
    - **Restore 버튼**: 확인
    - **Enrich Selected (배치)**: 확인
    - **Delete Selected (배치)**: "시그널 채널 중지 + 수집 비활성화" 경고
- **Cascade 동작 정리**:
  - 비활성화 (`isActive→false`): `isCollectionActive=false` + 시그널 채널 강제 중지
  - 삭제 (`isDelete→true`): `isActive=false` + `isCollectionActive=false` + 시그널 채널 강제 중지

### 2026-02-24: 세션 만료 자동 리다이렉트 + fetchConditionLogs 인증 수정
- **세션 만료 자동 리다이렉트** (`lib/api/client.ts`):
  - `tryRefreshToken()` export으로 변경 (다른 모듈에서 직접 사용 가능)
  - refresh 실패 시 `clearAuth()` + `window.location.replace('/login')` 자동 리다이렉트
  - 저장된 refreshToken 없는 경우에도 동일 처리
- **fetchConditionLogs 인증 수정** (`lib/api/backtest.ts`):
  - `fetchConditionLogs()`가 raw `fetch()` 사용하면서 Authorization 헤더 누락 → 401 에러 발생
  - `useAuthStore.getState().accessToken`으로 Authorization 헤더 주입
  - 401 응답 시 `tryRefreshToken()` 호출 → 갱신 후 1회 재시도
  - `tryRefreshToken` import 추가 (`lib/api/client.ts`에서)

### 2026-02-24: 볼린저 Bandwidth 레전드 + 백테스트 타임스탬프 수정
- **차트 레전드 Bandwidth 표시** (`components/chart/chart-legend.tsx`):
  - BOLLINGER overlay 레전드에 bandwidth 파생값 분리 표시
  - 가격 필드(upper/middle/lower): 기존 `formatPrice()` 유지
  - Bandwidth 필드: `BW 8.87% · Pctl 23 · Ratio 1.12` 형식으로 별도 표시
  - Percentile 색상: ≤20 초록(스퀴즈), ≥80 빨강(확장), 그 외 기본
  - Ratio 색상: ≥1.0 빨강(확장), <1.0 초록(수축)
  - `BANDWIDTH_KEYS` Set으로 가격 레전드에서 필터링
- **백테스트 조건 로그 타임스탬프 수정** (`components/backtest/backtest-condition-log-table.tsx`):
  - 변경 전: `toLocaleDateString('en-US', { month, day })` → `MM/DD` (시간 없음)
  - 변경 후: `MM/DD HH:MM` (날짜 + 시간) — 인트라데이 타임프레임에서 동일 날짜 캔들 구분 가능
