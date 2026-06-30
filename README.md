# @connect-dot/dododot-react-guide

DODODOT/DUVIS 제품군에서 쓰는 인터랙티브 가이드(Product Tour / Onboarding Walkthrough)
오버레이 라이브러리입니다. 제품 화면의 핵심 흐름을 단계별로 강조하고, 두두닷 브랜드와
튜토리얼 흐름에 맞춰 유지합니다.

- 🎯 `data-guide-id` 속성만으로 타깃 엘리먼트 지정
- 🪟 백드롭 + 하이라이트 + 툴팁 자동 위치 계산
- ⏳ 비동기 DOM 변화 감지 (MutationObserver) 및 타임아웃 처리
- ⌨️ 스크롤/리사이즈 시 위치 자동 재계산
- 🧩 4가지 액션 타입 지원 (`highlight-and-click`, `highlight-only`, `auto-click`, `input`)
- 🔌 버튼/토스트 UI 커스터마이징 (`GuideUIComponents`)
- 📨 LLM 응답에서 ` ```guide ` 코드블록 자동 파싱 (`parseGuideResponse`)
- 🖍 컨테이너 안의 특정 문장만 형광펜 애니메이션으로 하이라이트 (`testHighlight` / `<TestHighlight />`)

---

## 목차

1. [설치](#설치)
2. [빠른 시작](#빠른-시작)
3. [동작(Action) 유형 명세](#동작action-유형-명세)
   - [highlight-and-click](#1-highlight-and-click--사용자-클릭-유도)
   - [highlight-only](#2-highlight-only--설명만-노출)
   - [auto-click](#3-auto-click--자동-클릭)
   - [input](#4-input--입력-유도)
4. [데이터 스펙 (Schema)](#데이터-스펙-schema)
5. [API](#api)
6. [LLM 응답 파싱](#llm-응답-파싱)
7. [형광펜 하이라이트 (`testHighlight`)](#형광펜-하이라이트-testhighlight)
8. [Chatbot (`<Chatbot />`)](#chatbot-chatbot-)
9. [HTML 뷰어 (`.crg-chatbot-html-view`)](#html-뷰어-crg-chatbot-html-view)
10. [UI 커스터마이징 & 테마](#ui-커스터마이징--테마)
11. [개발](#개발)

---

## 설치

```bash
pnpm add @connect-dot/dododot-react-guide
# or
npm i @connect-dot/dododot-react-guide
# or
yarn add @connect-dot/dododot-react-guide
```

> Peer dependencies: `react >= 16.8`, `react-dom >= 16.8`

---

## 빠른 시작

### 1. 스타일 시트 로드

번들된 CSS를 앱 진입점(예: `main.tsx`, `_app.tsx`)에서 한 번만 가져옵니다.

```ts
import "@connect-dot/dododot-react-guide/styles.css";
```

> Tailwind 또는 별도 설정이 없어도 동작합니다. 모든 유틸리티 클래스는 `crg-`
> 프리픽스로 스코프되어 호스트 앱 스타일과 충돌하지 않습니다.

### 2. Provider 등록

```tsx
import {
  GuideProvider,
  GuideOverlay,
  GuideNotification,
} from "@connect-dot/dododot-react-guide";

export function App() {
  return (
    <GuideProvider>
      <YourApp />
      <GuideOverlay />
      <GuideNotification />
    </GuideProvider>
  );
}
```

### 2. 가이드 타깃 마킹

가이드의 대상이 될 모든 엘리먼트에 `data-guide-id` 속성을 부여합니다.

```tsx
<button data-guide-id="btn-create">새로 만들기</button>
<input data-guide-id="input-search" />
```

### 3. 가이드 실행

```tsx
import { useGuide } from "@connect-dot/dododot-react-guide";

function StartTourButton() {
  const { startGuide } = useGuide();

  return (
    <button
      onClick={() =>
        startGuide({
          guide: {
            id: "create-flow",
            title: "신규 생성 플로우",
            cancelable: true,
            steps: [
              {
                targetId: "btn-create",
                action: "highlight-and-click",
                message: "여기를 클릭해 신규 생성 화면으로 이동하세요.",
              },
            ],
          },
        })
      }
    >
      튜토리얼 시작
    </button>
  );
}
```

---

## 동작(Action) 유형 명세

각 스텝(`GuideStep`)은 4가지 `action` 중 하나를 사용합니다. 액션별로 사용자에게 보이는 UX와
지원하는 필드, 진행 트리거가 다릅니다.

### 한눈에 보기

| 액션                  | 시각 효과                                                  | 진행(다음 스텝) 트리거                    | 주 사용 사례            |
| --------------------- | ---------------------------------------------------------- | ----------------------------------------- | ----------------------- |
| `highlight-and-click` | 하이라이트 + 툴팁 + “해당 영역을 클릭하세요” 힌트          | 사용자가 타깃을 **직접 클릭**             | 메뉴/버튼 클릭 유도     |
| `highlight-only`      | 하이라이트 + 툴팁 + “이전/다음” 버튼                       | 사용자가 **다음 버튼** 클릭               | 설명/안내만 필요할 때   |
| `auto-click`          | 하이라이트 + 툴팁 + “자동으로 진행됩니다…” 힌트            | `delay` 경과 후 **자동 클릭 → 자동 진행** | 데모/자동 진행 시나리오 |
| `input`               | 하이라이트 + 툴팁 + 타깃 **자동 focus** + “이전/입력 완료” | 사용자가 **입력 완료 버튼** 클릭          | 입력 필드 안내          |

### 1. `highlight-and-click` — 사용자 클릭 유도

타깃 엘리먼트를 강조하고, 사용자가 해당 엘리먼트를 클릭하면 자동으로 다음 스텝으로 넘어갑니다.
툴팁에는 “이전/다음” 버튼이 표시되지 않습니다(클릭이 곧 진행 트리거).

**필수 필드**: `targetId`, `action`, `message`
**선택 필드**: `tooltipPosition`, `waitForTarget`, `scrollTo`, `highlightPadding`
**무시되는 필드**: `delay`

```json
{
  "targetId": "btn-create",
  "action": "highlight-and-click",
  "message": "신규 계약을 만들려면 이 버튼을 클릭하세요.",
  "tooltipPosition": "bottom",
  "highlightPadding": 6
}
```

### 2. `highlight-only` — 설명만 노출

타깃 엘리먼트를 강조하고 설명만 노출합니다. 사용자가 직접 “다음” 버튼을 눌러야 진행됩니다.
첫 스텝이 아니면 “이전” 버튼이 함께 표시됩니다. 마지막 스텝에서는 “다음”이 “완료”로 표기됩니다.

**필수 필드**: `targetId`, `action`, `message`
**선택 필드**: `tooltipPosition`, `waitForTarget`, `scrollTo`, `highlightPadding`
**무시되는 필드**: `delay`

```json
{
  "targetId": "panel-summary",
  "action": "highlight-only",
  "message": "이 패널에서 오늘의 처리 요약을 확인할 수 있습니다.",
  "tooltipPosition": "right",
  "highlightPadding": 12
}
```

### 3. `auto-click` — 자동 클릭

`delay`(ms) 경과 후 라이브러리가 타깃 엘리먼트의 `.click()`을 호출하고, 곧바로 다음 스텝으로
넘어갑니다. 데모/녹화/자동 시연 시나리오에 적합합니다. 툴팁에 별도의 버튼은 노출되지 않습니다.

**필수 필드**: `targetId`, `action`, `message`
**선택 필드**: `delay`(기본 `800`ms), `tooltipPosition`, `waitForTarget`, `scrollTo`, `highlightPadding`

```json
{
  "targetId": "btn-confirm",
  "action": "auto-click",
  "message": "확인 버튼을 자동으로 눌러드릴게요.",
  "delay": 1200,
  "tooltipPosition": "top"
}
```

> ⚠️ 자동 클릭은 사용자 의도 없이 동작이 발생하므로, 결제/삭제 등 비가역 액션에는 사용을 권장하지 않습니다.

### 4. `input` — 입력 유도

타깃 엘리먼트를 강조하고 자동으로 `focus()` 합니다. 사용자는 직접 값을 입력한 뒤 “입력 완료”
버튼을 눌러야 진행됩니다. 첫 스텝이 아니면 “이전” 버튼이 함께 표시됩니다.

**필수 필드**: `targetId`, `action`, `message`
**선택 필드**: `tooltipPosition`, `delay`(타깃 발견 후 하이라이트/포커스 지연), `waitForTarget`, `scrollTo`, `highlightPadding`
**무시되는 필드**: 없음

```json
{
  "targetId": "input-name",
  "action": "input",
  "message": "여기에 수급자 이름을 입력하세요.",
  "tooltipPosition": "bottom"
}
```

> 💡 타깃은 `input`, `textarea`, 또는 `[contenteditable]` 처럼 `focus()`가 의미 있는 엘리먼트여야 합니다.

---

## 데이터 스펙 (Schema)

### `GuideJson` (최상위 페이로드)

`startGuide(json)` 및 ` ```guide ` 코드블록에 들어가는 최상위 객체입니다.

```ts
interface GuideJson {
  guide: GuideData;
}
```

| 키      | 타입        | 필수 | 설명        |
| ------- | ----------- | ---- | ----------- |
| `guide` | `GuideData` | ✅   | 가이드 본문 |

### `GuideData`

| 키           | 타입          | 필수 | 기본 | 설명                                                     |
| ------------ | ------------- | ---- | ---- | -------------------------------------------------------- |
| `id`         | `string`      | ✅   | —    | 가이드 식별자. 분석/디버깅/캐싱에 사용                   |
| `title`      | `string`      | ❌   | `''` | 가이드 제목 (현재 오버레이에는 노출 X, 상위 UI에서 활용) |
| `cancelable` | `boolean`     | ✅   | —    | `true`면 백드롭 클릭/✕ 버튼으로 취소 가능                |
| `steps`      | `GuideStep[]` | ✅   | —    | 1개 이상의 스텝 배열 (빈 배열 불가)                      |

### `GuideStep`

| 키                 | 타입              | 필수 | 기본     | 적용 액션            | 설명                                                                                              |
| ------------------ | ----------------- | ---- | -------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| `targetId`         | `string`          | ✅   | —        | 전체                 | DOM에서 `[data-guide-id="<targetId>"]`로 매칭되는 엘리먼트                                        |
| `action`           | `GuideAction`     | ✅   | —        | 전체                 | `'highlight-and-click' \| 'highlight-only' \| 'auto-click' \| 'input'`                            |
| `message`          | `string`          | ✅   | —        | 전체                 | 툴팁 본문                                                                                         |
| `tooltipPosition`  | `TooltipPosition` | ❌   | `'auto'` | 전체                 | `'top' \| 'bottom' \| 'left' \| 'right' \| 'auto'`. `'auto'`는 화면 여백이 가장 큰 방향 자동 선택 |
| `highlightPadding` | `number`(px)      | ❌   | `8`      | 전체                 | 하이라이트 박스의 패딩                                                                            |
| `waitForTarget`    | `boolean`         | ❌   | `true`   | 전체                 | 타깃이 아직 없으면 MutationObserver로 최대 10초 대기                                              |
| `scrollTo`         | `boolean`         | ❌   | `true`   | 전체                 | 타깃이 발견되면 `scrollIntoView({behavior:'smooth', block:'center'})` 실행                        |
| `delay`            | `number`(ms)      | ❌   | `800`    | `auto-click` 만 사용 | 자동 클릭 발생까지 대기 시간                                                                      |

### 동작별 필드 사용 매트릭스

| 필드                 | highlight-and-click |   highlight-only    | auto-click |        input        |
| -------------------- | :-----------------: | :-----------------: | :--------: | :-----------------: |
| `targetId`           |         ✅          |         ✅          |     ✅     |         ✅          |
| `action`             |         ✅          |         ✅          |     ✅     |         ✅          |
| `message`            |         ✅          |         ✅          |     ✅     |         ✅          |
| `tooltipPosition`    |         ✅          |         ✅          |     ✅     |         ✅          |
| `highlightPadding`   |         ✅          |         ✅          |     ✅     |         ✅          |
| `waitForTarget`      |         ✅          |         ✅          |     ✅     |         ✅          |
| `scrollTo`           |         ✅          |         ✅          |     ✅     |         ✅          |
| `delay`              |          —          |          —          |     ✅     |          —          |
| 네비게이션 버튼 노출 |         ❌          | ✅ (이전/다음·완료) |     ❌     | ✅ (이전/입력 완료) |

### `GuideStatus`

가이드 진행 상태 머신.

```
idle ─▶ active ─┬─▶ waiting-target ─▶ active
                ├─▶ completed
                └─▶ cancelled
```

| 값               | 의미                                         |
| ---------------- | -------------------------------------------- |
| `idle`           | 가이드 미진행                                |
| `active`         | 현재 스텝 표시 중                            |
| `waiting-target` | 타깃 DOM 등장 대기 중 (로딩 다이얼로그 표시) |
| `completed`      | 모든 스텝 완료                               |
| `cancelled`      | 사용자/프로그램에 의해 중단                  |

### 전체 페이로드 예시

```json
{
  "guide": {
    "id": "create-recipient-flow",
    "title": "신규 수급자 등록 가이드",
    "cancelable": true,
    "steps": [
      {
        "targetId": "nav-recipient",
        "action": "highlight-and-click",
        "message": "수급자 메뉴를 클릭해주세요.",
        "tooltipPosition": "right"
      },
      {
        "targetId": "btn-create",
        "action": "highlight-and-click",
        "message": "‘신규 등록’ 버튼을 눌러주세요."
      },
      {
        "targetId": "input-name",
        "action": "input",
        "message": "수급자 이름을 입력하세요.",
        "tooltipPosition": "bottom"
      },
      {
        "targetId": "panel-summary",
        "action": "highlight-only",
        "message": "입력한 정보 요약을 확인할 수 있습니다.",
        "highlightPadding": 12
      },
      {
        "targetId": "btn-confirm",
        "action": "auto-click",
        "message": "확인 버튼을 자동으로 눌러드릴게요.",
        "delay": 1000
      }
    ]
  }
}
```

---

## API

### Components

| Component                          | 역할                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `<GuideProvider components={...}>` | 상태 + UI 컨텍스트 제공. 앱 루트 근처에 1회 마운트                      |
| `<GuideOverlay />`                 | 백드롭 · 하이라이트 · 툴팁 렌더 (Portal)                                |
| `<GuideNotification />`            | 완료/취소 토스트 (Portal). `ui.showToast`가 주어지면 자체 렌더 생략     |
| `<TestHighlight />`                | 가이드와 독립적으로, 컨테이너 안 특정 문장을 형광펜 애니메이션으로 강조 |

### Hook: `useGuide()`

```ts
const {
  // 상태
  status,
  guideId,
  title,
  cancelable,
  steps,
  currentStepIndex,
  currentStep,
  error,

  // 제어
  startGuide, // (json: GuideJson) => void
  advance, // () => void
  goBack, // () => void
  cancel, // () => void
  reset, // () => void
  goToStep, // (index: number) => void
  setWaiting, // () => void
  setFound, // () => void

  // 커스텀 UI
  ui, // GuideUIComponents
} = useGuide();
```

### Utilities

| 이름                   | 시그니처                                                       | 설명                                                                         |
| ---------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `validateGuideJson`    | `(data: unknown) => data is GuideJson`                         | 런타임 스키마 검증                                                           |
| `parseGuideResponse`   | `(text: string) => { text: string; guide: GuideJson \| null }` | LLM 응답에서 본문 + 가이드 JSON 분리                                         |
| `GUIDE_TARGETS`        | `Readonly<Record<string, string>>`                             | 권장 타깃 ID 상수 모음                                                       |
| `testHighlight`        | `(options: TestHighlightOptions) => () => void`                | 컨테이너 안 문장에 형광펜 애니메이션 적용. 반환값은 cleanup 함수             |
| `TEST_HIGHLIGHT_CLASS` | `string`                                                       | `testHighlight`가 생성하는 span에 부여되는 클래스명 (`'crg-test-highlight'`) |

---

## LLM 응답 파싱

챗봇/LLM 응답에 ` ```guide ` 코드블록을 포함시키면 본문과 가이드 JSON을 자동으로 분리합니다.

````md
원하시는 흐름을 가이드로 보여드릴게요.

```guide
{
  "guide": {
    "id": "create-flow",
    "cancelable": true,
    "steps": [
      { "targetId": "btn-create", "action": "highlight-and-click", "message": "여기를 클릭하세요." }
    ]
  }
}
```
````

```tsx
import { parseGuideResponse, useGuide } from "@connect-dot/dododot-react-guide";

function ChatMessage({ raw }: { raw: string }) {
  const { startGuide } = useGuide();
  const { text, guide } = parseGuideResponse(raw);

  return (
    <>
      <p>{text}</p>
      {guide && <button onClick={() => startGuide(guide)}>가이드 시작</button>}
    </>
  );
}
```

`parseGuideResponse`는 1) ` ```guide ` 코드블록, 2) 본문 전체가 JSON인 경우 순으로 시도하고
실패 시 `{ text: 원본, guide: null }`을 반환합니다.

---

## 형광펜 하이라이트 (`testHighlight`)

특정 컨테이너 안에서 주어진 문장 목록과 **일치하는 텍스트를 형광펜이 지나가듯이 좌→우로 채워지는
애니메이션으로 강조**하는 기능입니다. 가이드 오버레이와 독립적으로 동작하므로, 문서/리뷰 화면에
"이 부분 봐주세요" 식의 컨텍스트 강조에 사용할 수 있습니다.

### 컨셉

- `containerId`로 지정한 DOM 엘리먼트(`document.getElementById`)를 루트로 사용합니다.
- 그 안의 텍스트 노드를 순회하며, `sentences` 배열의 문장과 일치하는 부분을
  `<span class="crg-test-highlight">`로 감쌉니다.
- 감싸진 span에는 CSS keyframe `crg-test-highlight-sweep` 이 적용되어
  배경(형광색)이 0% → 100%로 채워지는 sweep 애니메이션이 재생됩니다.
- 여러 매치는 `stagger`(ms) 간격으로 순차 재생되어 자연스러운 흐름을 만듭니다.

### API

#### `testHighlight(options): () => void`

명령형 API. 호출 시 즉시 DOM을 변형하고, 반환된 cleanup 함수를 호출하면 원상 복구합니다.

```ts
import { testHighlight } from "@connect-dot/dododot-react-guide";

const cleanup = testHighlight({
  containerId: "article-body",
  sentences: ["중요한 문장", "핵심 키워드"],
  caseInsensitive: false,
  duration: 800,
  stagger: 120,
});

// 나중에 하이라이트 제거
cleanup();
```

| 옵션              | 타입          | 필수 | 기본    | 설명                                                      |
| ----------------- | ------------- | ---- | ------- | --------------------------------------------------------- |
| `containerId`     | `string`      | ✅   | —       | 하이라이트를 검색할 컨테이너 엘리먼트의 `id`              |
| `sentences`       | `string[]`    | ✅   | —       | 강조할 문장/구문 목록 (정규식 메타문자는 자동 이스케이프) |
| `caseInsensitive` | `boolean`     | ❌   | `false` | 대소문자 무시 매칭 여부                                   |
| `duration`        | `number` (ms) | ❌   | `800`   | 각 하이라이트 sweep 애니메이션 길이                       |
| `stagger`         | `number` (ms) | ❌   | `120`   | 매치 간 애니메이션 시작 지연 (순차 재생)                  |

반환값은 항상 함수입니다. 컨테이너가 없거나 매치가 없어도 안전하게 호출할 수 있는 no-op 함수가
돌아오므로 `useEffect`의 cleanup으로 그대로 사용할 수 있습니다.

#### `<TestHighlight />` — 선언형 래퍼

React 컴포넌트로도 사용할 수 있습니다. 마운트 시 하이라이트를 적용하고, 언마운트/props 변경 시
자동으로 정리합니다. **렌더 결과는 `null`** 이며, 대상 컨테이너는 별도로 마크업되어 있어야 합니다.

```tsx
import { TestHighlight } from "@connect-dot/dododot-react-guide";

function ArticleView({ body }: { body: string }) {
  return (
    <>
      <article id="article-body" dangerouslySetInnerHTML={{ __html: body }} />
      <TestHighlight
        containerId="article-body"
        sentences={["중요한 문장", "핵심 키워드"]}
        caseInsensitive
        duration={900}
        stagger={150}
      />
    </>
  );
}
```

`deps`에 임의의 의존성을 넣어주면 해당 값이 변할 때 하이라이트를 다시 적용합니다.
(예: `deps={[body]}` — 본문이 바뀔 때마다 재실행)

### 동작 흐름

1. `containerId`로 컨테이너를 찾고, 못 찾으면 no-op cleanup을 반환합니다.
2. `sentences`를 trim + 중복 제거 + 길이 내림차순 정렬 후 단일 정규식으로 합칩니다.
   (긴 문장이 우선 매칭되어 부분 매치를 가립니다.)
3. `TreeWalker`로 컨테이너 안의 텍스트 노드만 순회합니다.
   `<script>`, `<style>`, 이미 하이라이트된 span의 자식은 자동으로 스킵합니다.
4. 매치가 있는 텍스트 노드는 매치 부분만 `<span class="crg-test-highlight">`로 감싼
   document fragment로 교체됩니다.
5. 생성된 span에는 인덱스에 비례한 `animation-delay`가 부여되어 sweep 애니메이션이 순차 재생됩니다.
6. cleanup이 호출되면 모든 하이라이트 span을 원래의 텍스트 노드로 되돌리고
   부모 노드에 `normalize()`를 적용합니다.

### 제약 사항

- **텍스트 노드 단위 매칭**: 한 문장이 여러 엘리먼트에 걸쳐 분리되어 있으면(예:
  `<p>중요한 <strong>문장</strong></p>`) 매칭되지 않습니다. 매칭하려는 문구가
  하나의 텍스트 노드 안에 온전히 포함되어 있어야 합니다.
- 정규식 메타문자는 자동 이스케이프되므로 일반 문장을 그대로 넣으면 됩니다.
- SSR 환경에서는 `document`가 없으므로 즉시 no-op 함수를 반환합니다.

### 테마 변수

형광색은 두 개의 CSS 변수로 조정할 수 있습니다.

```css
:root {
  --crg-highlight: #fef08a; /* 형광펜 색 */
  --crg-highlight-foreground: inherit; /* 강조된 텍스트 색 (기본: 상속) */
}
```

또한 사용자가 `prefers-reduced-motion: reduce`를 설정한 경우 sweep 애니메이션은 자동으로
비활성화되고, 배경이 즉시 100%로 표시됩니다.

---

## Chatbot (`<Chatbot />`)

매뉴얼/FAQ 응답을 **하단 정렬 말풍선 채팅 + 좌측 풀스크린 매뉴얼 뷰어**로 보여주는 통합
컴포넌트입니다. 호스트 rem base에 영향받지 않도록 모든 사이즈가 px 기반 inline style로
고정되어 있고, 컬러/타이포/그림자는 DODODOT 디자인 토큰을 CSS variable로 노출해 호스트에서
override 가능합니다.

### 기본 사용

```tsx
import { Chatbot } from "@connect-dot/dododot-react-guide";
import diff from "html-diff-ts"; // optional, 변경점 보기 활성화

<Chatbot
  answers={CHATBOT_ANSWERS}
  diffHtml={(previous, latest) => diff(previous, latest)}
  title="케어링 도우미"
  subtitle="업무 매뉴얼에 대해 질문해보세요."
  placeholder="예: 수급자 등록은 어떻게 하나요?"
/>;
```

### Props

| prop              | 타입                                           | 필수 | 기본                                            | 설명                                                                  |
| ----------------- | ---------------------------------------------- | ---- | ----------------------------------------------- | --------------------------------------------------------------------- |
| `answers`         | `ChatbotAnswer[]`                              | ✅   | —                                               | 응답 데이터(knowledge base)                                           |
| `findAnswer`      | `(question, answers) => ChatbotAnswer \| null` | ❌   | `defaultMatchAnswer`                            | 사용자 정의 매처. 기본은 `matchKeywords` AND 매칭(케이스 무시)        |
| `diffHtml`        | `(previous, latest) => string`                 | ❌   | —                                               | HTML diff 함수. 제공 시 versions가 2개 이상이면 "변경점 보기" 탭 노출 |
| `title`           | `string`                                       | ❌   | `'도우미'`                                      | 채팅 패널 제목                                                        |
| `subtitle`        | `string`                                       | ❌   | `'무엇이든 물어보세요.'`                        | 채팅 패널 서브타이틀                                                  |
| `placeholder`     | `string`                                       | ❌   | `'질문을 입력하세요'`                           | 입력 placeholder                                                      |
| `emptyMessage`    | `string`                                       | ❌   | `'질문을 입력하면 답변과 매뉴얼을 보여드려요.'` | 메시지가 없을 때                                                      |
| `notFoundMessage` | `string`                                       | ❌   | `'일치하는 답변을 찾지 못했어요.'`              | 매칭 실패 응답                                                        |
| `showSuggestions` | `boolean`                                      | ❌   | `true`                                          | 첫 메시지 전 추천 칩 노출                                             |
| `defaultOpen`     | `boolean`                                      | ❌   | `false`                                         | 초기 오픈 상태                                                        |
| `className`       | `string`                                       | ❌   | —                                               | 패널 컨테이너 추가 className                                          |
| `onAsk`           | `(question, answer \| null) => void`           | ❌   | —                                               | 사용자 질문 콜백                                                      |
| `layout`          | `'auto' \| 'desktop' \| 'mobile'`              | ❌   | `'auto'`                                        | 레이아웃 변형. `'auto'`는 `(max-width: 768px)` 미디어 쿼리로 판정     |

### 데이터 스펙

#### `ChatbotAnswer`

| 키                   | 타입               | 필수 | 설명                                                                        |
| -------------------- | ------------------ | ---- | --------------------------------------------------------------------------- |
| `id`                 | `string`           | ✅   | 고유 식별자                                                                 |
| `question`           | `string`           | ✅   | 대표 질문. suggestion chip 라벨과 bot 응답 텍스트에 사용                    |
| `matchKeywords`      | `string[]`         | ❌   | `defaultMatchAnswer`가 AND 매칭에 사용. 미지정 시 `question` 사용           |
| `highlightSentences` | `string[]`         | ❌   | 뷰어 렌더 후 `<TestHighlight />`로 자동 강조할 문장(diff 모드에서는 비활성) |
| `versions`           | `ChatbotVersion[]` | ✅   | 버전 1개 이상. 마지막 원소가 "최신"으로 간주됨                              |

#### `ChatbotVersion`

| 키          | 타입     | 필수 | 설명                                                  |
| ----------- | -------- | ---- | ----------------------------------------------------- |
| `id`        | `string` | ✅   | 버전 식별자 (탭 key)                                  |
| `label`     | `string` | ✅   | 탭에 노출되는 라벨 (예: `'이전 버전'`, `'최신 버전'`) |
| `updatedAt` | `string` | ❌   | 메타 행에 `최종 수정 {updatedAt}` 형태로 노출         |
| `html`      | `string` | ✅   | 뷰어에 `dangerouslySetInnerHTML`로 렌더되는 HTML      |

#### 그 외 타입

```ts
export interface ChatbotMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  historyId?: string; // bot 응답이 가리키는 history entry. 클릭 시 뷰어가 해당 항목으로 점프
  notFound?: boolean;
}

export interface ChatbotHistoryEntry {
  id: string;
  question: string;
  answer: ChatbotAnswer;
  askedAt: number;
}
```

### 동작

- **입력은 `<textarea>`**: 줄바꿈 지원 + 입력 내용에 따라 높이 자동 확장
  (`min-height: 44px` ~ `max-height: 160px`). 그 이상에서는 내부 스크롤.
- **Enter 키**로 전송, **Shift+Enter**로 줄바꿈. 한글 IME 조합 중(`isComposing` 또는 legacy
  `keyCode 229`)에는 무시되어 후보 확정용 Enter가 폼 submit으로 새지 않습니다.
- **다중 Q&A** 누적: 한 세션 내에서 질문할 때마다 `messages`와 `history`에 항목이 추가됩니다.
- **새 대화** 버튼: 채팅 패널 헤더에 `+ 새 대화` 버튼이 메시지가 1개 이상일 때 노출됩니다.
  클릭 시 `messages` / `history` / viewer 상태가 초기화되어 새 세션이 시작됩니다.
- 답변이 매칭되면 bot 말풍선 아래에 **[문서 보기]** CTA 버튼이 노출됩니다. **버튼을 클릭해야**
  뷰어가 열립니다(데스크톱: 좌측 side panel, 모바일: BottomSheet). 답변이 추가될 때 뷰어가
  자동으로 열리지는 않습니다. 현재 열려 있는 이력의 CTA는 brand 색상으로 강조됩니다.
- 뷰어 헤더의 **이력 셀렉터**는 shadcn/ui 스타일(Radix Select)로 구현되며, 옵션은 **최신순**으로
  정렬됩니다. 새 질문이 추가되면 자동으로 최신 항목이 선택됩니다(뷰어는 닫힌 상태 유지).
- 뷰어 모드는 segmented control 탭으로 **두 가지**입니다:
  - **`문서`** — 선택된 이력의 **최신 버전 HTML**을 그대로 표시합니다.
  - **`이력보기`** — `diffHtml` prop이 제공되고 versions ≥ 2일 때만 노출됩니다. 메타 행에
    **좌·우 두 개의 버전 셀렉터**(shadcn Select)가 등장하며 기본값은 마지막 두 버전입니다.
    선택을 바꾸면 즉시 `diffHtml(from.html, to.html)`이 재계산되어 뷰어가 갱신됩니다.
    선택된 이력(`selectedHistoryId`)이 바뀌면 두 셀렉터는 새 답변의 마지막 두 버전으로 리셋됩니다.

### 레이아웃

`layout` prop (`'auto' | 'desktop' | 'mobile'`, 기본 `'auto'`)으로 결정됩니다. `'auto'`는
viewport 너비 `(max-width: 768px)` 미디어 쿼리로 데스크톱/모바일을 판정합니다.

#### 데스크톱 (`'desktop'` 또는 auto + > 768px)

| 영역            | 위치                                                                           | 크기                                                              |
| --------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Floating button | `position: fixed; right: 24px; bottom: 24px`                                   | 56×56 원형                                                        |
| 패널 컨테이너   | `position: fixed; top: 24px; left: 24px; right: 24px; bottom: 96px; gap: 24px` | viewport 풀-블리드                                                |
| 채팅 패널       | 우측 (`order: 2`)                                                              | width `420px`, height `100%`                                      |
| 문서 뷰어 패널  | 좌측 (`order: 1`)                                                              | `flex: 1`, height `100%` — 챗봇·gap 외 나머지 너비·높이 전부 채움 |

뷰어 패널은 사용자가 bot 메시지의 **[문서 보기]** 버튼을 누른 뒤에만 나타납니다(닫기 버튼으로 닫힘).
컨테이너에 `pointer-events: none` / 각 패널에 `pointer-events: auto` 가 적용돼 패널 사이
gap 영역으로 호스트 페이지 인터랙션이 통과합니다.

#### 모바일 (`'mobile'` 또는 auto + ≤ 768px)

| 영역            | 위치/형태                                             | 비고                                                     |
| --------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| Floating button | `position: fixed; right: 24px; bottom: 24px` (동일)   | 56×56 원형                                               |
| 채팅 패널       | `top: 16px / left: 16px / right: 16px / bottom: 96px` | `width: 100%`, `flex: 1` — 거의 풀스크린                 |
| 문서 뷰어       | **BottomSheet** (`@radix-ui/react-dialog` 기반)       | `height: 85vh`, 하단에서 슬라이드 업, 드래그 핸들 + 닫기 |

모바일에서는 side panel이 렌더되지 않습니다. bot 메시지의 **[문서 보기]** 버튼을 탭하면
BottomSheet가 열리고, 오버레이/닫기 버튼/Esc로 닫힙니다.

---

## HTML 뷰어 (`.crg-chatbot-html-view`)

뷰어 본문은 `ChatbotAnswer.versions[i].html` 문자열을 `dangerouslySetInnerHTML`로 렌더하며,
컨테이너에 자동으로 `.crg-chatbot-html-view` 클래스가 부여됩니다. 이 클래스 스코프에서
DODODOT 디자인 토큰 기반 타이포·컬러 규칙이 적용됩니다.

### 지원 태그 → 적용 토큰

| 태그          | Typography 토큰      | 컬러 토큰                                 | 시각 (기본 DODODOT)                      |
| ------------- | -------------------- | ----------------------------------------- | ------------------------------------ |
| `h1`          | `--crg-font-h1`      | `--crg-foreground`                        | 48px / 60px / 700                    |
| `h2`          | `--crg-font-h2`      | `--crg-foreground`                        | 36px / 45px / 700                    |
| `h3`          | `--crg-font-h3`      | `--crg-foreground`                        | 24px / 36px / 700                    |
| `h4`          | `--crg-font-h4`      | `--crg-foreground`                        | 21px / 32px / 700                    |
| `p`, `li`     | `--crg-font-body`    | `--crg-foreground`                        | 16px / 28px / 500                    |
| `strong`, `b` | `--crg-font-body-b`  | `--crg-foreground`                        | 16px / 28px / 700                    |
| `small`       | `--crg-font-label`   | `--crg-subtle`                            | 14px / 24px / 500                    |
| `em`, `i`     | (inherited)          | (inherited)                               | italic                               |
| `a`           | (inherited)          | `--crg-brand` / hover `--crg-brand-hover` | underline                            |
| `code`        | monospace 14px       | `--crg-muted-foreground` on `--crg-muted` | inline code chip                     |
| `blockquote`  | `--crg-font-body`    | `--crg-subtle` on `--crg-surface-alt`     | 좌측 3px border `--crg-border`       |
| `hr`          | —                    | `--crg-border`                            | 1px top                              |
| `table`, `td` | `--crg-font-body`    | `--crg-foreground`                        | `--crg-border` cells                 |
| `th`          | `--crg-font-label-b` | `--crg-muted-foreground` on `--crg-muted` | 헤더 셀                              |
| `ol`, `ul`    | —                    | —                                         | `margin: 14px 0; padding-left: 28px` |

### Diff 마커 클래스 (`html-diff-ts` 호환)

`diffHtml` 결과에 포함되는 클래스에 자동 스타일이 매핑됩니다.

| 셀렉터                       | 의미               | 배경                          | 텍스트                        |
| ---------------------------- | ------------------ | ----------------------------- | ----------------------------- |
| `ins.diffins`, `ins.mod`     | 추가               | `--crg-diff-ins-bg` (#dcfce7) | `--crg-diff-ins-fg` (#14532d) |
| `ins.diffmod`                | 변경(추가 측)      | `--crg-diff-mod-bg` (#fef3c7) | `--crg-diff-mod-fg` (#78350f) |
| `del.diffdel`, `del.diffmod` | 삭제(line-through) | `--crg-diff-del-bg` (#fee2e2) | `--crg-diff-del-fg` (#7f1d1d) |

### 디자인 토큰 전체 목록

#### Typography

| 토큰 (CSS var)          | 값                         | Tailwind class        |
| ----------------------- | -------------------------- | --------------------- |
| `--crg-font-display`    | `700 60px/72px` Pretendard | `crg-text-display`    |
| `--crg-font-h1`         | `700 48px/60px` Pretendard | `crg-text-h1`         |
| `--crg-font-h2`         | `700 36px/45px` Pretendard | `crg-text-h2`         |
| `--crg-font-h3`         | `700 24px/36px` Pretendard | `crg-text-h3`         |
| `--crg-font-h4`         | `700 21px/32px` Pretendard | `crg-text-h4`         |
| `--crg-font-body-b`     | `700 16px/28px` Pretendard | `crg-text-body-b`     |
| `--crg-font-body`       | `500 16px/28px` Pretendard | `crg-text-body`       |
| `--crg-font-label-b`    | `700 14px/24px` Pretendard | `crg-text-label-b`    |
| `--crg-font-label`      | `500 14px/24px` Pretendard | `crg-text-label`      |
| `--crg-font-subtitle-1` | `500 18px/20px` Pretendard | `crg-text-subtitle-1` |
| `--crg-font-subtitle-2` | `500 16px/20px` Pretendard | `crg-text-subtitle-2` |
| `--crg-font-subtitle-3` | `500 14px/20px` Pretendard | `crg-text-subtitle-3` |

`--crg-font-family` 기본값: `'Pretendard', 'Pretendard Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`

#### Color — Palette

`--crg-primary-{00|10|20|30|40|50|60|70|80|90|95|98|99|100}` · `--crg-gray-{00|10|20|30|40|50|60|70|80|90|95|99|100}` (DODODOT 팔레트 그대로)

#### Color — Semantic

| 토큰                     | 기본값                          | Tailwind class                    |
| ------------------------ | ------------------------------- | --------------------------------- |
| `--crg-brand`            | `--crg-primary-60` (`#2563EB`)  | `crg-bg-brand` / `crg-text-brand` |
| `--crg-brand-foreground` | `--crg-primary-100` (`#FFFFFF`) | `crg-text-brand-foreground`       |
| `--crg-brand-hover`      | `--crg-primary-50` (`#1D4ED8`)  | `crg-bg-brand-hover`              |
| `--crg-foreground`       | `--crg-gray-10` (`#191C1D`)     | `crg-text-foreground`             |
| `--crg-subtle`           | `--crg-gray-40` (`#5C5F5F`)     | `crg-text-subtle`                 |
| `--crg-icon`             | `--crg-gray-60` (`#8E9192`)     | `crg-text-icon`                   |
| `--crg-muted`            | `--crg-gray-95` (`#EFF1F1`)     | `crg-bg-muted`                    |
| `--crg-muted-foreground` | `--crg-gray-20` (`#2E3132`)     | `crg-text-muted-foreground`       |
| `--crg-border`           | `--crg-gray-90` (`#E1E3E3`)     | `crg-border-border`               |
| `--crg-surface`          | `--crg-gray-100` (`#FFFFFF`)    | `crg-bg-surface`                  |
| `--crg-surface-alt`      | `--crg-gray-99` (`#FAFAFA`)     | `crg-bg-surface-alt`              |

#### Elevation

| 토큰                        | Tailwind class                                          |
| --------------------------- | ------------------------------------------------------- |
| `--crg-shadow-elevation-01` | `crg-shadow-elevation-01`                               |
| `--crg-shadow-elevation-02` | `crg-shadow-elevation-02` (alias: `crg-shadow-tooltip`) |
| `--crg-shadow-elevation-03` | `crg-shadow-elevation-03`                               |
| `--crg-shadow-elevation-04` | `crg-shadow-elevation-04`                               |

### 호스트 측 커스터마이징 예

```css
/* 호스트 앱의 :root에서 DODODOT 컬러를 다른 브랜드 컬러로 덮어쓰기 */
:root {
  --crg-brand: #4f46e5;
  --crg-brand-hover: #4338ca;

  /* body 텍스트만 폰트 더 크게 */
  --crg-font-body: 500 18px/30px var(--crg-font-family);

  /* HTML 뷰어 강조 색 변경 */
  --crg-diff-ins-bg: #e0f2fe;
  --crg-diff-ins-fg: #075985;
}
```

---

## UI 커스터마이징 & 테마

### 버튼/토스트 컴포넌트 교체

```tsx
<GuideProvider
  components={{
    renderButton: ({ variant, onClick, children }) => (
      <MyButton variant={variant} onClick={onClick}>
        {children}
      </MyButton>
    ),
    showToast: (message, type) => toast[type](message),
  }}
>
  ...
</GuideProvider>
```

### CSS 변수로 테마 조정

번들된 `styles.css`가 다음 변수들을 노출합니다. 호스트 앱의 `:root`에서 덮어쓰면 라이브러리 전체에 즉시 반영됩니다.

```css
:root {
  --crg-brand: #4f46e5; /* 하이라이트 보더 · primary 버튼 · 액션 힌트 색 */
  --crg-brand-foreground: #ffffff; /* primary 버튼 텍스트 */
  --crg-foreground: #1f2937; /* 본문 텍스트 */
  --crg-subtle: #6b7280; /* 카운터 · 보조 텍스트 · 취소 토스트 배경 */
  --crg-icon: #9ca3af; /* 닫기(✕) 버튼 */
  --crg-muted: #f3f4f6; /* secondary 버튼 배경 */
  --crg-muted-foreground: #374151; /* secondary 버튼 텍스트 */
  --crg-surface: #ffffff; /* 툴팁 · 로딩 카드 배경 */
  --crg-success: #10b981; /* 완료 토스트 배경 */
  --crg-backdrop-opacity: 0.55; /* 백드롭 어둡기 (0~1) */
  --crg-highlight: #fef08a; /* testHighlight 형광펜 색 */
  --crg-highlight-foreground: inherit; /* 형광펜이 적용된 텍스트 색 */
}
```

---

## 개발

```bash
pnpm install
pnpm build      # dist/ 에 ESM + CJS + d.ts 산출
pnpm dev        # watch 모드
pnpm typecheck
```

빌드 산출물:

```
dist/
├─ index.js       # ESM
├─ index.cjs      # CommonJS
├─ index.d.ts     # types (ESM)
├─ index.d.cts    # types (CJS)
├─ styles.css     # Tailwind 번들 (crg- 프리픽스, preflight 제거)
└─ *.map          # sourcemap
```

## 라이선스

MIT © connect-dot
