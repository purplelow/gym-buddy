import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAppStore } from '@/store/useAppStore';

/**
 * 비로그인 둘러보기 허용 + 액션 시점 로그인 게이트.
 * 반환된 gate(fn)는 로그인 상태면 fn 실행, 아니면 로그인 화면으로 이동.
 * 로그인은 됐지만 프로필 미등록이면 온보딩으로 보낸다.
 */
export function useRequireAuth() {
  const router = useRouter();
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const hasProfile = useAppStore((s) => s.me !== null);

  const gate = useCallback(
    (action: () => void, { needProfile = true }: { needProfile?: boolean } = {}) => {
      if (!isLoggedIn) {
        router.push('/login');
        return;
      }
      if (needProfile && !hasProfile) {
        router.push('/onboarding');
        return;
      }
      action();
    },
    [isLoggedIn, hasProfile, router],
  );

  return { isLoggedIn, hasProfile, gate };
}
