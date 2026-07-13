/** 도메인 타입 — 기획 v0.1 MVP(P0) 범위 */

export type Sex = 'male' | 'female';

/** 3대 중량 (kg). basis에 따라 작업중량 또는 1RM */
export interface Lifts {
  basis: 'working' | '1rm';
  squat: number;
  bench: number;
  deadlift: number;
}

export type StyleTag = 'powerlifting' | 'bodybuilding' | 'crossfit';

export const STYLE_TAG_LABEL: Record<StyleTag, string> = {
  powerlifting: '파워리프팅',
  bodybuilding: '보디빌딩',
  crossfit: '크로스핏',
};

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type TimeBand = 'dawn' | 'morning' | 'lunch' | 'evening' | 'night';

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일',
};

export const TIME_BAND_LABEL: Record<TimeBand, string> = {
  dawn: '새벽', morning: '오전', lunch: '점심', evening: '저녁', night: '밤',
};

/** 요일×시간대 슬롯. 예: { day: 'mon', band: 'evening' } */
export interface TimeSlot {
  day: Weekday;
  band: TimeBand;
}

export interface Gym {
  id: string;
  name: string;
  address: string;
  memberCount: number; // 등록 유저 수 (콜드스타트 밀도 지표)
}

export type VerificationLevel = 'unverified' | 'peer' | 'video';

export const VERIFICATION_LABEL: Record<VerificationLevel, string> = {
  unverified: '미검증',
  peer: '실측 검증',
  video: '영상 인증',
};

export interface UserProfile {
  id: string;
  nickname: string;
  sex: Sex;
  bodyWeight: number; // kg
  lifts: Lifts;
  gymId: string;
  slots: TimeSlot[];
  styleTags: StyleTag[];
  verification: VerificationLevel;
  intro?: string;
}

export type MatchStatus = 'none' | 'requested' | 'accepted' | 'met' | 'verified';

export interface MatchRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: MatchStatus;
  openChatUrl?: string; // 수락 시 오픈채팅 링크 교환 (v0)
  createdAt: string;
}

/** 실시간 스팟(보조) 요청 */
export interface SpotRequest {
  id: string;
  userId: string;
  gymId: string;
  exercise: '벤치프레스' | '스쿼트' | '데드리프트' | '오버헤드프레스';
  targetWeight: number; // kg
  message?: string;
  expiresInMin: number;
  createdAt: string;
}

/** 온보딩 중간 저장용 드래프트 */
export interface ProfileDraft {
  nickname?: string;
  sex?: Sex;
  bodyWeight?: number;
  lifts?: Partial<Lifts>;
  gymId?: string;
  slots?: TimeSlot[];
  styleTags?: StyleTag[];
}
