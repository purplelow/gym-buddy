/**
 * 데이터 훅 — Supabase가 설정되어 있으면 서버에서, 아니면 목데이터에서 읽는다.
 * 화면은 이 훅만 쓰고 데이터 출처를 신경 쓰지 않는다.
 */
import { useCallback, useEffect, useState } from 'react';

import * as api from '@/lib/api';
import { GYMS, MOCK_USERS } from '@/lib/mock';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import type { Gym, UserProfile } from '@/types';

/** 전체 헬스장 (온보딩 검색) */
export function useGyms() {
  const [gyms, setGyms] = useState<Gym[]>(isSupabaseConfigured ? [] : GYMS);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    api
      .fetchGyms()
      .then((g) => alive && setGyms(g))
      .catch((e) => console.warn('[짝짐] 헬스장 로드 실패', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { gyms, loading };
}

/** 헬스장 1곳 */
export function useGym(gymId: string | undefined) {
  const { gyms } = useGyms();
  return gymId ? gyms.find((g) => g.id === gymId) : undefined;
}

/** 같은 헬스장 멤버 (본인 제외) */
export function useGymMembers(gymId: string | undefined) {
  const myId = useAppStore((s) => s.userId);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!gymId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured) {
      setMembers(MOCK_USERS.filter((u) => u.gymId === gymId && u.id !== myId));
      setLoading(false);
      return;
    }
    try {
      setMembers(await api.fetchGymMembers(gymId, myId ?? undefined));
    } catch (e) {
      console.warn('[짝짐] 멤버 로드 실패', e);
    } finally {
      setLoading(false);
    }
  }, [gymId, myId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load().finally(() => {
      if (!alive) return;
    });
    return () => {
      alive = false;
    };
  }, [load]);

  return { members, loading, reload: load };
}

/** 유저 1명 (상세/검증 화면) */
export function useProfile(id: string | undefined) {
  const me = useAppStore((s) => s.me);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    // 내 프로필이면 스토어 값 재사용
    if (me && me.id === id) {
      setProfile(me);
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured) {
      setProfile(MOCK_USERS.find((u) => u.id === id) ?? null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .fetchProfileById(id)
      .then((p) => alive && setProfile(p))
      .catch((e) => console.warn('[짝짐] 프로필 로드 실패', e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, me]);

  return { profile, loading };
}

/** 스팟 보드 — 내 헬스장의 진행 중 요청 + 실시간 구독 */
export function useSpotRequests(gymId: string | undefined) {
  const spotRequests = useAppStore((s) => s.spotRequests);
  const refresh = useAppStore((s) => s.refreshSpotRequests);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!gymId || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    let alive = true;
    refresh(gymId).finally(() => alive && setLoading(false));
    const unsubscribe = api.subscribeSpotRequests(gymId, () => refresh(gymId));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [gymId, refresh]);

  return { spotRequests, loading };
}
