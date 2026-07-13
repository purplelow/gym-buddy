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
import { useAppStore } from '@/store/useAppStore';

export default function Login() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const afterLogin = () => {
    const me = useAppStore.getState().me;
    if (me) router.replace('/(tabs)');
    else router.replace('/onboarding');
  };

  const handleEmailLogin = () => {
    const eErr = email.trim() ? undefined : '이메일을 입력해주세요';
    const pErr = password ? undefined : '비밀번호를 입력해주세요';
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;
    login('email');
    afterLogin();
  };

  const handleSocial = (provider: 'kakao' | 'google') => {
    login(provider);
    afterLogin();
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
            <Button label="로그인" onPress={handleEmailLogin} style={styles.loginButton} />
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
