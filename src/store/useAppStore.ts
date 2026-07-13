import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MOCK_SPOT_REQUESTS } from '@/lib/mock';
import type {
  MatchRequest,
  MatchStatus,
  ProfileDraft,
  SpotRequest,
  UserProfile,
} from '@/types';

export type AuthProvider = 'email' | 'google' | 'kakao';

interface AppState {
  // 세션
  hasSeenIntro: boolean;
  isLoggedIn: boolean;
  authProvider: AuthProvider | null;
  /** 로그인 후 프로필 등록(온보딩)까지 마쳤는지 */
  me: UserProfile | null;
  draft: ProfileDraft;

  // 매칭/스팟 (v0: 로컬 목 상태)
  matchRequests: MatchRequest[];
  spotRequests: SpotRequest[];

  // actions
  completeIntro: () => void;
  login: (provider: AuthProvider) => void;
  logout: () => void;
  updateDraft: (patch: Partial<ProfileDraft>) => void;
  completeProfile: (profile: UserProfile) => void;
  sendMatchRequest: (toUserId: string) => void;
  setMatchStatus: (requestId: string, status: MatchStatus) => void;
  addSpotRequest: (req: SpotRequest) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasSeenIntro: false,
      isLoggedIn: false,
      authProvider: null,
      me: null,
      draft: {},
      matchRequests: [],
      spotRequests: MOCK_SPOT_REQUESTS,

      completeIntro: () => set({ hasSeenIntro: true }),

      login: (provider) => set({ isLoggedIn: true, authProvider: provider }),

      logout: () =>
        set({
          isLoggedIn: false,
          authProvider: null,
          me: null,
          draft: {},
          matchRequests: [],
        }),

      updateDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),

      completeProfile: (profile) => set({ me: profile, draft: {} }),

      sendMatchRequest: (toUserId) => {
        const me = get().me;
        if (!me) return;
        const exists = get().matchRequests.some(
          (r) => r.toUserId === toUserId && r.fromUserId === me.id,
        );
        if (exists) return;
        set({
          matchRequests: [
            ...get().matchRequests,
            {
              id: `m_${Date.now()}`,
              fromUserId: me.id,
              toUserId,
              status: 'requested',
              createdAt: new Date().toISOString(),
            },
          ],
        });
      },

      setMatchStatus: (requestId, status) =>
        set({
          matchRequests: get().matchRequests.map((r) =>
            r.id === requestId ? { ...r, status } : r,
          ),
        }),

      addSpotRequest: (req) =>
        set({ spotRequests: [req, ...get().spotRequests] }),
    }),
    {
      name: 'gym-buddy-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        hasSeenIntro: s.hasSeenIntro,
        isLoggedIn: s.isLoggedIn,
        authProvider: s.authProvider,
        me: s.me,
        matchRequests: s.matchRequests,
      }),
    },
  ),
);

/** 매칭 상태 조회 헬퍼: 내가 보낸 요청 기준 */
export function useMatchStatusFor(userId: string): MatchRequest | undefined {
  return useAppStore((s) =>
    s.matchRequests.find((r) => r.toUserId === userId),
  );
}
