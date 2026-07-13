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

export default function Signup() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const updateDraft = useAppStore((s) => s.updateDraft);

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nicknameError, setNicknameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();

  const handleSignup = () => {
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

    if (nErr || eErr || pErr || cErr) return;

    updateDraft({ nickname: nickname.trim() });
    login('email');
    router.replace('/onboarding');
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
            <Text variant="h1">짝짐이 처음이시죠?</Text>
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
            <Button label="가입하기" onPress={handleSignup} style={styles.signupButton} />
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
