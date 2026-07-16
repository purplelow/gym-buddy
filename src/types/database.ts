/**
 * Supabase 테이블 타입 — supabase/schema.sql과 1:1로 대응.
 * 스키마를 바꾸면 이 파일도 함께 갱신할 것.
 * (자동 생성: npx supabase gen types typescript --project-id <id> > src/types/database.ts)
 *
 * ⚠️ 반드시 `type`으로 선언할 것. `interface`는 암묵적 인덱스 시그니처가 없어
 *    supabase의 Record<string, unknown> 제약을 만족하지 못하고,
 *    그 결과 모든 쿼리 결과 타입이 never로 무너진다.
 */
import type { Sex, StyleTag, TimeSlot, VerificationLevel } from './index';

export type GymRow = {
  id: string;
  name: string;
  address: string;
  created_at: string;
};

export type GymWithCountRow = {
  id: string;
  name: string;
  address: string;
  member_count: number;
};

export type ProfileRow = {
  id: string;
  nickname: string;
  sex: Sex;
  body_weight: number;
  lifts_basis: 'working' | '1rm';
  squat: number;
  bench: number;
  deadlift: number;
  gym_id: string;
  slots: TimeSlot[];
  style_tags: StyleTag[];
  verification: VerificationLevel;
  intro: string | null;
  /** DB 생성 컬럼 (읽기 전용) */
  total_lifts: number;
  /** DB 생성 컬럼 (읽기 전용) */
  relative_strength: number;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = Omit<
  ProfileRow,
  'total_lifts' | 'relative_strength' | 'created_at' | 'updated_at'
>;

export type MatchRequestRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'requested' | 'accepted' | 'met' | 'verified';
  open_chat_url: string | null;
  created_at: string;
};

export type MatchRequestInsert = Omit<MatchRequestRow, 'id' | 'created_at'>;

export type SpotRequestRow = {
  id: string;
  user_id: string;
  gym_id: string;
  exercise: '벤치프레스' | '스쿼트' | '데드리프트' | '오버헤드프레스';
  target_weight: number;
  message: string | null;
  expires_in_min: number;
  created_at: string;
  /** DB 생성 컬럼 (읽기 전용) */
  expires_at: string;
};

export type SpotRequestInsert = Omit<
  SpotRequestRow,
  'id' | 'created_at' | 'expires_at'
>;

export type Database = {
  public: {
    Tables: {
      gyms: {
        Row: GymRow;
        Insert: Partial<GymRow>;
        Update: Partial<GymRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
        Relationships: [];
      };
      match_requests: {
        Row: MatchRequestRow;
        Insert: MatchRequestInsert;
        Update: Partial<MatchRequestInsert>;
        Relationships: [];
      };
      spot_requests: {
        Row: SpotRequestRow;
        Insert: SpotRequestInsert;
        Update: Partial<SpotRequestInsert>;
        Relationships: [];
      };
    };
    Views: {
      gyms_with_counts: {
        Row: GymWithCountRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
