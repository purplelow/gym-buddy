import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import * as api from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase';
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
  /** Supabase auth.users.id — 로그인 여부의 단일 기준 */
  userId: string | null;
  authProvider: AuthProvider | null;
  /** 프로필 (온보딩 완료 시 생성) */
  me: UserProfile | null;
  draft: ProfileDraft;
  /** 세션 복원 완료 전에는 라우팅을 막기 위한 플래그 */
  isHydrated: boolean;

  matchRequests: MatchRequest[];
  spotRequests: SpotRequest[];

  // actions
  completeIntro: () => void;
  /** 로그인 성공 시 호출 — 서버에서 프로필을 불러온다 */
  setSession: (userId: string | null, provider?: AuthProvider | null) => Promise<void>;
  setHydrated: (v: boolean) => void;
  clearSession: () => void;
  updateDraft: (patch: Partial<ProfileDraft>) => void;
  completeProfile: (profile: UserProfile) => Promise<void>;
  refreshMatchRequests: () => Promise<void>;
  sendMatchRequest: (toUserId: string) => Promise<void>;
  setMatchStatus: (requestId: string, status: MatchStatus) => Promise<void>;
  refreshSpotRequests: (gymId: string) => Promise<void>;
  addSpotRequest: (req: {
    exercise: SpotRequest['exercise'];
    targetWeight: number;
    message?: string;
    expiresInMin: number;
  }) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasSeenIntro: false,
      userId: null,
      authProvider: null,
      me: null,
      draft: {},
      isHydrated: false,
      matchRequests: [],
      spotRequests: [],

      completeIntro: () => set({ hasSeenIntro: true }),

      setHydrated: (v) => set({ isHydrated: v }),

      setSession: async (userId, provider) => {
        if (!userId) {
          set({ userId: null, authProvider: null, me: null, matchRequests: [] });
          return;
        }
        set({ userId, ...(provider !== undefined ? { authProvider: provider } : {}) });
        if (!isSupabaseConfigured) return;
        try {
          const [me, matchRequests] = await Promise.all([
            api.fetchMyProfile(userId),
            api.fetchMyMatchRequests(userId),
          ]);
          set({ me, matchRequests });
        } catch (e) {
          console.warn('[짝짐] 프로필 로드 실패', e);
        }
      },

      clearSession: () =>
        set({
          userId: null,
          authProvider: null,
          me: null,
          draft: {},
          matchRequests: [],
        }),

      updateDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),

      completeProfile: async (profile) => {
        if (isSupabaseConfigured) {
          const saved = await api.upsertProfile(profile);
          set({ me: saved, draft: {} });
          return;
        }
        set({ me: profile, draft: {} });
      },

      refreshMatchRequests: async () => {
        const userId = get().userId;
        if (!userId || !isSupabaseConfigured) return;
        try {
          set({ matchRequests: await api.fetchMyMatchRequests(userId) });
        } catch (e) {
          console.warn('[짝짐] 매칭 요청 로드 실패', e);
        }
      },

      sendMatchRequest: async (toUserId) => {
        const { userId, matchRequests } = get();
        if (!userId) return;
        if (matchRequests.some((r) => r.toUserId === toUserId && r.fromUserId === userId))
          return;

        if (!isSupabaseConfigured) {
          set({
            matchRequests: [
              ...matchRequests,
              {
                id: `m_${Date.now()}`,
                fromUserId: userId,
                toUserId,
                status: 'requested',
                createdAt: new Date().toISOString(),
              },
            ],
          });
          return;
        }
        const created = await api.createMatchRequest(userId, toUserId);
        set({ matchRequests: [...get().matchRequests, created] });
      },

      setMatchStatus: async (requestId, status) => {
        // 낙관적 갱신
        set({
          matchRequests: get().matchRequests.map((r) =>
            r.id === requestId ? { ...r, status } : r,
          ),
        });
        if (!isSupabaseConfigured) return;
        try {
          await api.updateMatchStatus(requestId, status);
          if (status === 'verified') {
            const req = get().matchRequests.find((r) => r.id === requestId);
            const me = get().userId;
            if (req && me) {
              const partnerId = req.fromUserId === me ? req.toUserId : req.fromUserId;
              await api.markPeerVerified(partnerId);
            }
          }
        } catch (e) {
          console.warn('[짝짐] 매칭 상태 갱신 실패', e);
          get().refreshMatchRequests();
        }
      },

      refreshSpotRequests: async (gymId) => {
        if (!isSupabaseConfigured) return;
        try {
          set({ spotRequests: await api.fetchSpotRequests(gymId) });
        } catch (e) {
          console.warn('[짝짐] 스팟 요청 로드 실패', e);
        }
      },

      addSpotRequest: async (req) => {
        const { userId, me } = get();
        if (!userId || !me) return;
        if (!isSupabaseConfigured) {
          set({
            spotRequests: [
              {
                id: `s_${Date.now()}`,
                userId,
                gymId: me.gymId,
                createdAt: new Date().toISOString(),
                ...req,
              },
              ...get().spotRequests,
            ],
          });
          return;
        }
        const created = await api.createSpotRequest({
          userId,
          gymId: me.gymId,
          ...req,
        });
        set({ spotRequests: [created, ...get().spotRequests] });
      },
    }),
    {
      name: 'gym-buddy-store',
      storage: createJSONStorage(() => AsyncStorage),
      // 세션은 Supabase가 관리하므로 캐시 성격의 값만 저장한다
      partialize: (s) => ({
        hasSeenIntro: s.hasSeenIntro,
        authProvider: s.authProvider,
      }),
    },
  ),
);

/** 로그인 여부 — Supabase 세션(userId) 기준 */
export function useIsLoggedIn(): boolean {
  return useAppStore((s) => s.userId !== null);
}

/** 매칭 상태 조회: 나와 해당 유저 사이의 요청 */
export function useMatchStatusFor(userId: string): MatchRequest | undefined {
  return useAppStore((s) =>
    s.matchRequests.find((r) => r.toUserId === userId || r.fromUserId === userId),
  );
}
