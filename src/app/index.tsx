import { Redirect } from 'expo-router';

import { useAppStore } from '@/store/useAppStore';

/**
 * 진입 라우팅:
 * 인트로 미시청 → 인트로 캐러셀
 * 로그인했지만 프로필 미등록 → 온보딩
 * 그 외 → 메인 탭 (비로그인 둘러보기 허용)
 */
export default function Index() {
  const hasSeenIntro = useAppStore((s) => s.hasSeenIntro);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const hasProfile = useAppStore((s) => s.me !== null);

  if (!hasSeenIntro) return <Redirect href="/intro" />;
  if (isLoggedIn && !hasProfile) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
