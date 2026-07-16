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
import { authErrorMessage, signUpWithEmail } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

export default function Signup() {
  const router = useRouter();
  const setSession = useAppStore((s) => s.setSession);
  const updateDraft = useAppStore((s) => s.updateDraft);
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nicknameError, setNicknameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();

  const handleSignup = async () => {
    const nErr =
      nickname.trim().length >= 2 ? undefined : '닉네임은 2자 이상 입력해주세요';
    const eErr = email.includes('@') ? undefined : '올바른 이메일 형식이 아니에요';
    const pErr = password.length >= 6 ? undefined : '비밀번호는 6자 이상 입력해주세요';
    const cErr =
      confirmPassword.length > 0 && confirmPassword === password
        ? undefined
        : '비밀번호가 일치하지 않아요';

    setNicknameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmError(cErr);
    setFormError(undefined);

    if (nErr || eErr || pErr || cErr) return;

    // 닉네임은 온보딩에서 프로필로 확정되므로 draft에 보관
    updateDraft({ nickname: nickname.trim() });

    if (!isSupabaseConfigured) {
      await setSession(`mock_${email.trim()}`, 'email');
      router.replace('/onboarding');
      return;
    }

    setLoading(true);
    try {
      const { user, session } = await signUpWithEmail(email.trim(), password);
      if (!session) {
        // 이메일 확인이 켜져 있으면 세션 없이 가입만 된다
        setFormError('가입 확인 메일을 보냈어요. 메일함을 확인한 뒤 로그인해주세요');
        return;
      }
      await setSession(user?.id ?? null, 'email');
      router.replace('/onboarding');
    } catch (e) {
      setFormError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen bottomInset>
      <BackButton fallback="/login" style={styles.backBtn} />

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
            <Text variant="h1">Gym-Buddy가 처음이시죠?</Text>
            <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
              몇 가지 정보만 입력하면 바로 시작할 수 있어요
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="닉네임"
              placeholder="운동할 때 불릴 이름"
              value={nickname}
              onChangeText={setNickname}
              error={nicknameError}
            />
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
              placeholder="6자 이상 입력해주세요"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={passwordError}
            />
            <Input
              label="비밀번호 확인"
              placeholder="비밀번호를 다시 입력해주세요"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={confirmError}
            />
            {formError ? (
              <Text variant="caption" color={colors.danger}>
                {formError}
              </Text>
            ) : null}
            <Button
              label="가입하기"
              onPress={handleSignup}
              loading={loading}
              style={styles.signupButton}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" color={colors.textSecondary}>
              이미 계정이 있나요?{' '}
            </Text>
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Text variant="bodyMd" color={colors.brand}>
                로그인
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  scrollContent: { paddingBottom: spacing.xl },
  header: { marginBottom: spacing.xl },
  subtitle: { marginTop: spacing.sm },
  form: { gap: spacing.md },
  signupButton: { marginTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});
