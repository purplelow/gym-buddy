import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { BackButton, Button, Input, Screen, Text } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { authErrorMessage, signInWithEmail, signInWithOAuth } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

export default function Login() {
  const router = useRouter();
  const setSession = useAppStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const afterLogin = () => {
    // setSession이 서버 프로필을 채운 뒤 분기
    const me = useAppStore.getState().me;
    router.replace(me ? '/(tabs)' : '/onboarding');
  };

  const handleEmailLogin = async () => {
    const eErr = email.trim() ? undefined : '이메일을 입력해주세요';
    const pErr = password ? undefined : '비밀번호를 입력해주세요';
    setEmailError(eErr);
    setPasswordError(pErr);
    setFormError(undefined);
    if (eErr || pErr) return;

    // Supabase 미설정 시 목 로그인으로 폴백 (UI만 돌려볼 때)
    if (!isSupabaseConfigured) {
      await setSession(`mock_${email.trim()}`, 'email');
      afterLogin();
      return;
    }

    setLoading(true);
    try {
      const { user } = await signInWithEmail(email.trim(), password);
      await setSession(user?.id ?? null, 'email');
      afterLogin();
    } catch (e) {
      setFormError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: 'kakao' | 'google') => {
    setFormError(undefined);
    if (!isSupabaseConfigured) {
      await setSession(`mock_${provider}`, provider);
      afterLogin();
      return;
    }
    setLoading(true);
    try {
      await signInWithOAuth(provider);
      // 웹: 리다이렉트로 페이지가 다시 뜨며 _layout이 세션을 복원
      // 네이티브: 아래에서 세션 확인 후 분기
      const userId = useAppStore.getState().userId;
      if (userId) afterLogin();
    } catch (e) {
      setFormError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen bottomInset>
      <BackButton icon="close" style={styles.closeBtn} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text variant="h1">다시 오셨네요!</Text>
            <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
              이메일로 로그인하고 파트너를 찾으러 가볼까요?
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="이메일"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              error={emailError}
            />
            <Input
              label="비밀번호"
              placeholder="비밀번호를 입력해주세요"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={passwordError}
            />
            {formError ? (
              <Text variant="caption" color={colors.danger}>
                {formError}
              </Text>
            ) : null}
            <Button
              label="로그인"
              onPress={handleEmailLogin}
              loading={loading}
              style={styles.loginButton}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text variant="caption" color={colors.textTertiary}>
              또는
            </Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialGroup}>
            <Button
              label="카카오로 계속하기"
              variant="kakao"
              icon={<Ionicons name="chatbubble" size={20} color={colors.kakaoText} />}
              onPress={() => handleSocial('kakao')}
            />
            <Button
              label="Google로 계속하기"
              variant="google"
              icon={<Ionicons name="logo-google" size={20} color={colors.googleText} />}
              onPress={() => handleSocial('google')}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" color={colors.textSecondary}>
              아직 계정이 없나요?{' '}
            </Text>
            <Pressable onPress={() => router.push('/signup')} hitSlop={8}>
              <Text variant="bodyMd" color={colors.brand}>
                회원가입
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  closeBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  scrollContent: { paddingBottom: spacing.xl },
  header: { marginBottom: spacing.xl },
  subtitle: { marginTop: spacing.sm },
  form: { gap: spacing.md },
  loginButton: { marginTop: spacing.sm },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  socialGroup: { gap: spacing.md },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
