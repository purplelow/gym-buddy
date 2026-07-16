import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * 환경변수가 없으면 앱이 목데이터 모드로 동작한다.
 * (.env 없이도 UI를 돌려볼 수 있게 — 자세한 설정은 README 참고)
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured && __DEV__) {
  console.warn(
    '[짝짐] Supabase 환경변수가 없어 목데이터 모드로 실행합니다. ' +
      '.env에 EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.',
  );
}

export const supabase = createClient<Database>(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'public-anon-key-placeholder',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // 웹 OAuth 리다이렉트는 URL의 토큰을 파싱해야 하므로 웹에서만 활성화
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
);
