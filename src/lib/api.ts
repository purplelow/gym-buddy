/**
 * Supabase 데이터 접근 계층.
 * DB(snake_case) ↔ 앱 도메인 타입(camelCase) 변환을 여기서만 처리한다.
 * 화면은 이 파일의 함수만 호출하고 supabase 클라이언트를 직접 만지지 않는다.
 */
import { supabase } from '@/lib/supabase';
import type {
  MatchRequestRow,
  ProfileInsert,
  ProfileRow,
  SpotRequestRow,
} from '@/types/database';
import type {
  Gym,
  MatchRequest,
  MatchStatus,
  SpotRequest,
  UserProfile,
} from '@/types';

// ── 변환 ────────────────────────────────────────

export function rowToProfile(r: ProfileRow): UserProfile {
  return {
    id: r.id,
    nickname: r.nickname,
    sex: r.sex,
    bodyWeight: Number(r.body_weight),
    lifts: {
      basis: r.lifts_basis,
      squat: Number(r.squat),
      bench: Number(r.bench),
      deadlift: Number(r.deadlift),
    },
    gymId: r.gym_id,
    slots: r.slots ?? [],
    styleTags: r.style_tags ?? [],
    verification: r.verification,
    intro: r.intro ?? undefined,
  };
}

export function profileToRow(p: UserProfile): ProfileInsert {
  return {
    id: p.id,
    nickname: p.nickname,
    sex: p.sex,
    body_weight: p.bodyWeight,
    lifts_basis: p.lifts.basis,
    squat: p.lifts.squat,
    bench: p.lifts.bench,
    deadlift: p.lifts.deadlift,
    gym_id: p.gymId,
    slots: p.slots,
    style_tags: p.styleTags,
    verification: p.verification,
    intro: p.intro ?? null,
  };
}

function rowToMatchRequest(r: MatchRequestRow): MatchRequest {
  return {
    id: r.id,
    fromUserId: r.from_user_id,
    toUserId: r.to_user_id,
    status: r.status,
    openChatUrl: r.open_chat_url ?? undefined,
    createdAt: r.created_at,
  };
}

function rowToSpotRequest(r: SpotRequestRow): SpotRequest {
  return {
    id: r.id,
    userId: r.user_id,
    gymId: r.gym_id,
    exercise: r.exercise,
    targetWeight: Number(r.target_weight),
    message: r.message ?? undefined,
    expiresInMin: r.expires_in_min,
    createdAt: r.created_at,
  };
}

// ── 헬스장 ──────────────────────────────────────

export async function fetchGyms(): Promise<Gym[]> {
  const { data, error } = await supabase
    .from('gyms_with_counts')
    .select('*')
    .order('member_count', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    address: g.address,
    memberCount: Number(g.member_count),
  }));
}

// ── 프로필 ──────────────────────────────────────

export async function fetchMyProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToProfile(data) : null;
}

/** 온보딩 완료 / 프로필 수정 — 있으면 갱신, 없으면 생성 */
export async function upsertProfile(profile: UserProfile): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profileToRow(profile))
    .select()
    .single();
  if (error) throw error;
  return rowToProfile(data);
}

/** 같은 헬스장 멤버 (본인 제외) */
export async function fetchGymMembers(
  gymId: string,
  excludeUserId?: string,
): Promise<UserProfile[]> {
  let q = supabase.from('profiles').select('*').eq('gym_id', gymId);
  if (excludeUserId) q = q.neq('id', excludeUserId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToProfile);
}

/**
 * 수준 매칭 — 같은 헬스장 + 상대강도 ±range.
 * 범위 필터를 DB에서 처리해 전체 스캔을 피한다.
 */
export async function fetchMatchCandidates(params: {
  gymId: string;
  excludeUserId?: string;
  myRelative?: number;
  range?: number;
}): Promise<UserProfile[]> {
  const { gymId, excludeUserId, myRelative, range } = params;
  let q = supabase.from('profiles').select('*').eq('gym_id', gymId);
  if (excludeUserId) q = q.neq('id', excludeUserId);
  if (myRelative !== undefined && range !== undefined && Number.isFinite(range)) {
    q = q
      .gte('relative_strength', myRelative - range)
      .lte('relative_strength', myRelative + range);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToProfile);
}

export async function fetchProfileById(id: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToProfile(data) : null;
}

// ── 매칭 요청 ───────────────────────────────────

export async function fetchMyMatchRequests(userId: string): Promise<MatchRequest[]> {
  const { data, error } = await supabase
    .from('match_requests')
    .select('*')
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToMatchRequest);
}

export async function createMatchRequest(
  fromUserId: string,
  toUserId: string,
): Promise<MatchRequest> {
  const { data, error } = await supabase
    .from('match_requests')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: 'requested',
      open_chat_url: null,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToMatchRequest(data);
}

export async function updateMatchStatus(
  requestId: string,
  status: MatchStatus,
): Promise<void> {
  if (status === 'none') return;
  const { error } = await supabase
    .from('match_requests')
    .update({ status })
    .eq('id', requestId);
  if (error) throw error;
}

/** 상호 실측 검증 완료 → 파트너 프로필에 검증 뱃지 */
export async function markPeerVerified(partnerId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ verification: 'peer' })
    .eq('id', partnerId)
    .eq('verification', 'unverified'); // 영상 인증(상위 등급)은 덮어쓰지 않음
  if (error) throw error;
}

// ── 스팟 요청 ───────────────────────────────────

/** 내 헬스장의 아직 만료되지 않은 요청만 */
export async function fetchSpotRequests(gymId: string): Promise<SpotRequest[]> {
  const { data, error } = await supabase
    .from('spot_requests')
    .select('*')
    .eq('gym_id', gymId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToSpotRequest);
}

export async function createSpotRequest(req: {
  userId: string;
  gymId: string;
  exercise: SpotRequest['exercise'];
  targetWeight: number;
  message?: string;
  expiresInMin: number;
}): Promise<SpotRequest> {
  const { data, error } = await supabase
    .from('spot_requests')
    .insert({
      user_id: req.userId,
      gym_id: req.gymId,
      exercise: req.exercise,
      target_weight: req.targetWeight,
      message: req.message ?? null,
      expires_in_min: req.expiresInMin,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToSpotRequest(data);
}

/** 스팟 보드 실시간 구독 — 새 요청이 올라오면 즉시 반영 */
export function subscribeSpotRequests(gymId: string, onChange: () => void) {
  const channel = supabase
    .channel(`spot_requests:${gymId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'spot_requests',
        filter: `gym_id=eq.${gymId}`,
      },
      onChange,
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
