import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Button, Card, Chip, Input, OnboardingHeader, Screen, Text } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useGym } from '@/hooks/useData';
import { formatRelative, relativeStrength, totalLifts } from '@/lib/strength';
import { useAppStore } from '@/store/useAppStore';
import { STYLE_TAG_LABEL, type Lifts, type StyleTag } from '@/types';

const TOTAL_STEPS = 5;
const ALL_STYLE_TAGS = Object.keys(STYLE_TAG_LABEL) as StyleTag[];

export default function OnboardingTags() {
  const router = useRouter();
  const draft = useAppStore((s) => s.draft);
  const me = useAppStore((s) => s.me);
  const completeProfile = useAppStore((s) => s.completeProfile);

  const userId = useAppStore((s) => s.userId);
  const [styleTags, setStyleTags] = useState<StyleTag[]>(draft.styleTags ?? []);
  const [intro, setIntro] = useState(me?.intro ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();

  const toggleTag = (tag: StyleTag) => {
    setStyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const isValid = styleTags.length >= 1;

  const previewLifts: Lifts = {
    basis: draft.lifts?.basis ?? 'working',
    squat: draft.lifts?.squat ?? 0,
    bench: draft.lifts?.bench ?? 0,
    deadlift: draft.lifts?.deadlift ?? 0,
  };
  const total = totalLifts(previewLifts);
  const relative = draft.bodyWeight ? relativeStrength(previewLifts, draft.bodyWeight) : 0;
  const gymName = useGym(draft.gymId)?.name ?? '헬스장 미선택';

  const handleComplete = async () => {
    if (!isValid || !userId) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      await completeProfile({
        // 프로필 id는 Supabase auth.users.id와 동일해야 한다
        id: userId,
        nickname: draft.nickname ?? '',
        sex: draft.sex ?? 'male',
        bodyWeight: draft.bodyWeight ?? 0,
        lifts: previewLifts,
        gymId: draft.gymId ?? '',
        slots: draft.slots ?? [],
        styleTags,
        // 기존 검증 등급은 유지 (수정 시 초기화 금지)
        verification: me?.verification ?? 'unverified',
        intro: intro.trim() || undefined,
      });
      router.replace('/(tabs)');
    } catch (e) {
      console.warn('[짝짐] 프로필 저장 실패', e);
      setSaveError('프로필 저장에 실패했어요. 잠시 후 다시 시도해주세요');
    } finally {
      setSaving(false);
    }
  };

  // 새로고침 등으로 draft가 비면 1단계부터 다시 (완료 직후 draft 초기화와는 me로 구분)
  if (!me && !draft.slots?.length) return <Redirect href="/onboarding" />;

  return (
    <Screen bottomInset>
      <OnboardingHeader step={5} total={TOTAL_STEPS} />

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
            <Text variant="h1">운동 스타일을 골라주세요</Text>
            <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
              해당하는 스타일을 모두 선택해주세요
            </Text>
          </View>

          <View style={styles.chipRow}>
            {ALL_STYLE_TAGS.map((tag) => (
              <Chip
                key={tag}
                label={STYLE_TAG_LABEL[tag]}
                selected={styleTags.includes(tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>

          <View style={styles.introField}>
            <Input
              label="한 줄 소개 (선택)"
              placeholder="예: 스쿼트 파트너 구해요"
              value={intro}
              onChangeText={setIntro}
              maxLength={60}
            />
            <Text variant="caption" color={colors.textTertiary} style={styles.introCount}>
              {intro.length}/60
            </Text>
          </View>

          <Card style={styles.summaryCard}>
            <Text variant="captionMd" color={colors.textTertiary}>
              프로필 미리보기
            </Text>
            <Text variant="h3" style={styles.summaryNickname}>
              {draft.nickname ?? '닉네임'}
            </Text>
            <Text variant="caption" color={colors.textTertiary}>
              {gymName}
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="caption" color={colors.textTertiary}>
                  3대 합계
                </Text>
                <Text variant="stat" color={colors.brand}>
                  {total}kg
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text variant="caption" color={colors.textTertiary}>
                  상대강도
                </Text>
                <Text variant="h3">{formatRelative(relative)}</Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        {saveError ? (
          <Text variant="caption" color={colors.danger} style={styles.saveError}>
            {saveError}
          </Text>
        ) : null}
        <Button
          label="완료"
          onPress={handleComplete}
          disabled={!isValid}
          loading={saving}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepText: { width: 32, textAlign: 'right' },
  scrollContent: { paddingBottom: spacing.xl },
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  introField: { marginTop: spacing.lg },
  introCount: { textAlign: 'right', marginTop: spacing.xs },
  summaryCard: { marginTop: spacing.lg },
  summaryNickname: { marginTop: spacing.xs },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  summaryItem: { flex: 1, gap: spacing.xs },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  footer: { paddingTop: spacing.md, gap: spacing.sm },
  saveError: { textAlign: 'center' },
});
