import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {
  Button,
  Input,
  OnboardingHeader,
  RulerPicker,
  Screen,
  SelectCard,
  Text,
} from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import type { Sex } from '@/types';

const TOTAL_STEPS = 5;

export default function OnboardingBasicInfo() {
  const router = useRouter();
  const draft = useAppStore((s) => s.draft);
  const updateDraft = useAppStore((s) => s.updateDraft);

  const [nickname, setNickname] = useState(draft.nickname ?? '');
  const [sex, setSex] = useState<Sex | undefined>(draft.sex);
  const [bodyWeight, setBodyWeight] = useState(draft.bodyWeight ?? 70);

  const isValid = nickname.trim().length >= 2 && !!sex;

  const handleNext = () => {
    if (!isValid || !sex) return;
    updateDraft({ nickname: nickname.trim(), sex, bodyWeight });
    router.push('/onboarding/lifts');
  };

  return (
    <Screen bottomInset>
      <OnboardingHeader step={1} total={TOTAL_STEPS} canGoBack={false} />

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
            <Text variant="h1">기본 정보를 알려주세요</Text>
            <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
              매칭에 필요한 최소한의 정보예요
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="닉네임"
              placeholder="운동할 때 불릴 이름"
              value={nickname}
              onChangeText={setNickname}
              maxLength={12}
              autoCapitalize="none"
            />

            <View style={styles.field}>
              <Text variant="captionMd" color={colors.textSecondary}>
                성별
              </Text>
              <View style={styles.sexRow}>
                <SelectCard
                  label="남성"
                  icon="male"
                  selected={sex === 'male'}
                  onPress={() => setSex('male')}
                />
                <SelectCard
                  label="여성"
                  icon="female"
                  selected={sex === 'female'}
                  onPress={() => setSex('female')}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text variant="captionMd" color={colors.textSecondary}>
                체중 — 좌우로 드래그해서 맞춰주세요
              </Text>
              <RulerPicker
                min={30}
                max={200}
                value={bodyWeight}
                onChange={setBodyWeight}
                unit="kg"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button label="다음" onPress={handleNext} disabled={!isValid} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xl },
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.sm },
  form: { gap: spacing.lg },
  field: { gap: spacing.md },
  sexRow: { flexDirection: 'row', gap: spacing.md },
  footer: { paddingTop: spacing.md },
});
