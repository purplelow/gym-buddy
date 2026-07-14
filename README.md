# 짝짐 (gym-buddy)

> 정량 지표 기반 **헬스 파트너 매칭** 앱 · MVP

"3대 몇 치세요?" — 헬스인들이 이미 서로 수준을 가늠하는 문화를 그대로 제품화했습니다.
느낌이 아니라 **숫자로 검증된 수준 매칭**을 지향합니다.

<sub>앱 표시명은 임시 "짝짐"입니다 (네이밍 후보: 짝짐 / 맞무게 / 페어웨이트 — KIPRIS 상표 조회 전).</sub>

---

## 핵심 차별점

| # | 기능 | 설명 |
|---|------|------|
| 1 | **정량 지표 매칭** | 3대 중량(스쿼트·벤치·데드), 체중 대비 상대강도, Wilks 점수 등 실측 수치로 매칭 |
| 2 | **크루/프로그램 단위 매칭** | 5/3/1·nSuns 같은 프로그램을 같은 주기로 도는 2~4인 그룹 매칭 (리텐션↑) |
| 3 | **같은 헬스장 초밀착** | "동네"보다 좁게, 같은 헬스장 등록자끼리 매칭 → 콜드스타트를 헬스장 단위로 해소 |
| 4 | **실시간 스팟(보조) 요청** | "지금 벤치 고중량 치는데 스팟 봐줄 사람" 초경량 유즈케이스 → 첫 사용 진입장벽↓ |

**신뢰 레이어 (허위 입력 대응):** 자기신고(미검증) → 파트너 상호 실측 확인(**실측 검증** 뱃지) → 영상 인증(최상위). 검증 데이터가 쌓일수록 후발주자가 복제하기 어려운 자산이 됩니다.

**MVP 비목표 (의도적 제외):** 커뮤니티/피드/챌린지/커머스/루틴 추천. "지금 내 수준에 맞는, 우리 헬스장 파트너는 누구인가" 하나의 질문에만 답합니다.

---

## 기술 스택

- **Expo SDK 57** + **expo-router** (파일 기반 라우팅)
- **TypeScript** (strict)
- **zustand** + persist(AsyncStorage) — 전역 상태
- **react-native-reanimated** / **gesture-handler** — 인트로 스와이프, 룰러 피커
- **백엔드 없음** — 현재 `src/lib/mock.ts` 목데이터. 다음 단계: Supabase(Auth·Postgres·Realtime)
- **인증:** 목 인증 (이메일 / 구글 / 카카오 버튼 → `store.login()`)

---

## 디자인

Behance ['Fitty'](https://www.behance.net/gallery/246050957/Fitty-Smart-Fitness-Mobile-App) 레퍼런스 기반. 유니콘 스타트업 감성.

- **다크 온리** — 배경 `#0A0B08`, 네온 라임 포인트 `#BAFA20`
- **폰트** — Outfit
- 디자인 토큰: [`src/constants/theme.ts`](src/constants/theme.ts)
- 공용 컴포넌트: [`src/components/ui/`](src/components/ui/) — **새 화면은 반드시 이것들을 사용**
- UI 문구는 한국어 존댓말

---

## 시작하기

```bash
npm install          # 의존성 설치
npm run web          # 웹 프리뷰 (localhost:8081)
npm run ios          # iOS 시뮬레이터
npm run android      # Android 에뮬레이터
npx tsc --noEmit     # 타입체크 (커밋 전 필수)
```

> Expo SDK 57 문서: https://docs.expo.dev/versions/v57.0.0/

---

## 사용자 플로우

```
인트로 캐러셀 (스와이프)
   │  비로그인 둘러보기 허용
   ▼
홈 허브 ── 4대 기능 카드 선택
   │        · 수준 매칭 / 크루 매칭 / 내 헬스장 / 스팟 요청
   │  액션 시점에 로그인 게이트 (useRequireAuth.gate)
   ▼
로그인 / 회원가입 (이메일·구글·카카오 목 인증)
   ▼
온보딩 5스텝 (프로필 등록)
   │  ① 기본정보(성별 카드·체중 룰러) ② 3대 중량 ③ 헬스장 ④ 시간대 ⑤ 스타일
   ▼
매칭 → 상세 → 요청 → 수락 → 오픈채팅 → 운동 후 상호 검증
```

**온보딩(프로필 등록) 진입점:** 앱 부팅 라우팅 / 회원가입·로그인 직후(프로필 없을 때) / 액션 게이트 / **마이페이지 "프로필 수정"**. 마이페이지 수정은 기존 값을 draft에 프리필해 온보딩을 수정 모드로 재사용합니다.

---

## 프로젝트 구조

```
src/
├─ app/                       # expo-router 라우트
│  ├─ index.tsx               #   진입 라우팅 (인트로/온보딩/탭 분기)
│  ├─ intro.tsx               #   인트로 캐러셀 (스와이프)
│  ├─ (auth)/                 #   login · signup (모달)
│  ├─ onboarding/             #   프로필 등록 5스텝
│  ├─ (tabs)/                 #   홈(매칭 허브) · 스팟 · 마이
│  ├─ partners.tsx            #   수준 매칭 리스트
│  ├─ crew.tsx                #   크루/프로그램 매칭
│  ├─ gym.tsx                 #   내 헬스장 멤버
│  ├─ match/[id].tsx          #   파트너 상세 · 매칭 요청
│  └─ verify/[userId].tsx     #   운동 후 상호 실측 검증
├─ components/
│  ├─ ui/                     # 공용 컴포넌트 (Button, Card, RulerPicker, BackButton …)
│  └─ match/MatchCard.tsx
├─ constants/theme.ts         # 디자인 토큰 (colors · type · spacing · radius · font)
├─ lib/
│  ├─ strength.ts             # 상대강도 · Wilks · 시간대 겹침 계산
│  ├─ mock.ts                 # 헬스장 · 유저 · 스팟 목데이터
│  └─ crews.ts                # 크루 목데이터
├─ hooks/useRequireAuth.ts    # 비로그인 액션 게이트
├─ store/useAppStore.ts       # 세션 · 매칭 · 스팟 전역 상태 (persist)
└─ types/index.ts             # 도메인 타입
```

---

## 매칭 로직 ([`src/lib/strength.ts`](src/lib/strength.ts))

- **상대강도** = 3대 합계 ÷ 체중 (매칭 1차 지표)
- **Wilks** = Wilks-2020 계수 기반 성별 보정 점수
- **매칭 필터** = 같은 헬스장 + 상대강도 ±범위(기본 ±0.5) + 시간대 겹침 + 스타일 태그
- 정렬 = 내 상대강도와의 차이 오름차순

---

## 로드맵

- [x] MVP 화면 (인트로·온보딩·매칭·스팟·검증·마이)
- [x] 정량 지표 계산 (상대강도·Wilks)
- [x] 홈 4대 기능 허브 · 인터랙티브 온보딩
- [ ] **Supabase 연동** — 목 스토어 → Auth·Postgres·Realtime 교체
- [ ] 실제 OAuth (구글·카카오) 연결
- [ ] 크루 상세/생성 플로우
- [ ] 영상 인증 · Wilks 자동 랭킹
- [ ] KIPRIS 상표 조회 후 앱 명칭 확정 (09·41·42·45류)

---

## 개발 규칙

- 커밋 전 **`npx tsc --noEmit`** 통과 필수
- 새 화면은 `src/components/ui/`의 공용 컴포넌트와 `theme.ts` 토큰만 사용 (하드코딩 색상·여백 금지)
- 웹 안전영역(safe-area)은 0이므로 하단 CTA는 `Screen`의 `bottomInset`으로 최소 여백 확보
