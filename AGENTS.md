# 짝짐 (gym-buddy) — 헬스 파트너 매칭 앱 MVP

Expo SDK 57 문서: https://docs.expo.dev/versions/v57.0.0/

## 제품
- 정량 지표(3대 중량, 체중 대비 상대강도, Wilks) 기반 헬스 파트너 매칭
- 같은 헬스장 단위 초밀착 매칭 (콜드스타트를 헬스장 1곳 단위로 해소)
- 실시간 스팟(보조) 요청 보드 — 경량 첫 사용 퍼널
- 운동 후 상호 실측 검증 → 검증 뱃지 (허위 입력 대응)
- 기획서: 기획 v0.1 (네이밍 후보: 짝짐/맞무게/페어웨이트 — KIPRIS 조회 전, 앱 표시명은 임시 "짝짐")
- MVP 비목표: 커뮤니티/피드/챌린지/커머스/루틴 추천 금지 (핏뷰의 확장 실수 반복 금지)

## 스택
- Expo SDK 57 + expo-router + TypeScript strict + zustand(persist/AsyncStorage)
- 백엔드 없음 — src/lib/mock.ts 목데이터 (다음 단계: Supabase)
- 로그인: 목 인증 (이메일/구글/카카오 버튼 → store.login())

## 디자인 (Behance 'Fitty' 레퍼런스)
- 다크 온리. 배경 #0A0B08, 네온라임 포인트 #BAFA20, Outfit 폰트
- 토큰은 src/constants/theme.ts, 공용 컴포넌트는 src/components/ui/ — 새 화면은 반드시 이것들 사용
- UI 문구 한국어 존댓말

## 구조
- src/app/ — expo-router 라우트: intro(캐러셀), (auth)/login·signup(모달), onboarding/ 5스텝, (tabs)/ 매칭·스팟·마이, match/[id], verify/[userId]
- src/lib/strength.ts — 상대강도·Wilks·시간대 겹침 계산
- src/store/useAppStore.ts — 세션/매칭/스팟 전역 상태
- 흐름: 비로그인 둘러보기 허용, 액션 시점에 useRequireAuth.gate()로 로그인/온보딩 유도

## 명령
- `npx tsc --noEmit` — 타입체크 (커밋 전 필수)
- `npx expo start --web` — 웹 프리뷰 / `--ios` iOS 시뮬레이터
