/** Supabase Auth 래퍼 — 이메일 / 구글 / 카카오 */
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export type OAuthProvider = 'google' | 'kakao';

/** OAuth 콜백이 돌아올 주소 */
function redirectTo(): string {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  // 네이티브는 app.json의 scheme 사용
  return 'gymbuddy://';
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithOAuth(provider: OAuthProvider) {
  // 참고: Supabase의 Kakao 기본 scope에 account_email이 하드코딩돼 있어,
  //       options.scopes로는 덮어쓸 수 없다(추가만 됨). 실제 authorize 요청으로 확인.
  //       account_email 필수 동의는 카카오 비즈 앱 전환이 필요하다.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo(),
      // 웹은 브라우저가 알아서 리다이렉트, 네이티브는 우리가 브라우저를 띄운다
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });
  if (error) throw error;

  if (Platform.OS !== 'web' && data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo());
    if (result.type === 'success' && result.url) {
      // 콜백 URL의 토큰으로 세션 생성
      const params = new URL(result.url).hash.replace(/^#/, '');
      const parsed = new URLSearchParams(params);
      const access_token = parsed.get('access_token');
      const refresh_token = parsed.get('refresh_token');
      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) throw sessionError;
      }
    }
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** 이 계정에 연결된 로그인 신원(provider) 목록 */
export async function listIdentityProviders(): Promise<string[]> {
  const { data, error } = await supabase.auth.getUserIdentities();
  if (error) throw error;
  return (data?.identities ?? []).map((i) => i.provider);
}

/**
 * 소셜 신원 연동 해제.
 *
 * Supabase는 계정의 "마지막 신원"은 해제할 수 없다(고아 계정 방지).
 * 즉 소셜로만 가입한 유저는 먼저 이메일 비밀번호를 설정해야 해제 가능하다.
 * 그 경우 needsAnotherMethod: true를 돌려주고, 화면에서 안내한다.
 */
export async function unlinkSocial(
  provider: OAuthProvider,
): Promise<{ ok: boolean; needsAnotherMethod?: boolean }> {
  const { data, error: listError } = await supabase.auth.getUserIdentities();
  if (listError) throw listError;

  const identities = data?.identities ?? [];
  if (identities.length <= 1) {
    return { ok: false, needsAnotherMethod: true };
  }

  const target = identities.find((i) => i.provider === provider);
  if (!target) return { ok: false };

  const { error } = await supabase.auth.unlinkIdentity(target);
  if (error) throw error;
  return { ok: true };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/** 한국어 에러 메시지 */
export function authErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요';
  if (msg.includes('User already registered')) return '이미 가입된 이메일이에요';
  if (msg.includes('Password should be')) return '비밀번호는 6자 이상 입력해주세요';
  if (msg.includes('Email not confirmed')) return '이메일 인증을 완료해주세요';
  if (msg.includes('Unable to validate email address')) return '올바른 이메일 형식이 아니에요';
  if (msg.includes('Failed to fetch') || msg.includes('Network'))
    return '네트워크 연결을 확인해주세요';
  return '문제가 발생했어요. 잠시 후 다시 시도해주세요';
}
