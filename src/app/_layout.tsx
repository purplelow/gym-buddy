import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Session } from '@supabase/supabase-js';

import { AppShell } from '@/components/ui';
import { colors } from '@/constants/theme';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAppStore, type AuthProvider } from '@/store/useAppStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 폰트는 assets/fonts에서 직접 로드한다.
  // @expo-google-fonts 패키지를 쓰면 빌드 결과가 assets/node_modules/... 경로로 나오는데,
  // wrangler(Cloudflare Pages)가 node_modules 경로를 업로드에서 제외해 폰트가 누락된다.
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular: require('@/assets/fonts/Outfit_400Regular.ttf'),
    Outfit_500Medium: require('@/assets/fonts/Outfit_500Medium.ttf'),
    Outfit_600SemiBold: require('@/assets/fonts/Outfit_600SemiBold.ttf'),
    Outfit_700Bold: require('@/assets/fonts/Outfit_700Bold.ttf'),
  });
  const isHydrated = useAppStore((s) => s.isHydrated);

  // Supabase 세션 복원 + 로그인/로그아웃 구독
  useEffect(() => {
    const { setSession, setHydrated } = useAppStore.getState();

    if (!isSupabaseConfigured) {
      setHydrated(true);
      return;
    }

    // Supabase 세션의 실제 로그인 제공자를 읽어 store에 반영한다.
    // (OAuth 웹 로그인은 리다이렉트로 돌아와 여기서 세션이 복원되므로,
    //  login 화면에서 넘긴 provider가 아니라 세션 값을 신뢰한다.)
    const providerOf = (session: Session | null): AuthProvider | null => {
      const p = session?.user.app_metadata.provider;
      if (p === 'google' || p === 'kakao') return p;
      if (p === 'email') return 'email';
      return session ? 'email' : null;
    };

    supabase.auth
      .getSession()
      .then(({ data }) =>
        setSession(data.session?.user.id ?? null, providerOf(data.session)),
      )
      .catch((e) => console.warn('[짝짐] 세션 복원 실패', e))
      .finally(() => setHydrated(true));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user.id ?? null, providerOf(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 폰트 로딩이 실패해도 앱은 떠야 한다 (시스템 폰트로 대체).
  // 폰트 하나 때문에 화면 전체가 흰 화면이 되는 상황을 막는다.
  const ready = (fontsLoaded || !!fontError) && isHydrated;

  useEffect(() => {
    if (fontError) console.warn('[짝짐] 폰트 로딩 실패 — 시스템 폰트로 대체', fontError);
  }, [fontError]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {/* 넓은 화면에서 앱을 가운데 컬럼으로 고정 (모바일에선 그대로 전체 폭) */}
        <AppShell>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="intro" />
            <Stack.Screen
              name="(auth)"
              options={{
                // 웹은 모달 시트 주변으로 밑 화면이 비쳐 지저분해서 풀스크린으로
                presentation: Platform.OS === 'web' ? 'card' : 'modal',
              }}
            />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AppShell>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
