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
import { colors, font, spacing } from '@/constants/theme';
import { formatRelative, relativeStrength, totalLifts, wilksScore } from '@/lib/strength';
import { useAppStore } from '@/store/useAppStore';
import type { Lifts } from '@/types';

const TOTAL_STEPS = 5;
const MIN_KG = 20;
const MAX_KG = 400;

function isValidWeight(v: string): boolean {
  if (!v) return false;
  const n = Number(v);
  return !Number.isNaN(n) && n >= MIN_KG && n <= MAX_KG;
}

interface LiftFieldProps {
  badge: string;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}

function LiftField({ badge, label, value, onChangeText }: LiftFieldProps) {
  return (
    <View style={styles.liftField}>
      <View style={styles.liftLabelRow}>
        <View style={styles.liftBadge}>
          <Text variant="captionMd" color={colors.brand} style={styles.liftBadgeText}>
            {badge}
          </Text>
        </View>
        <Text variant="bodyMd">{label}</Text>
      </View>
      <Input
        placeholder="0"
        keyboardType="number-pad"
        value={value}
        onChangeText={(t) => onChangeText(t.replace(/[^0-9]/g, ''))}
        suffix={
          <Text variant="bodyMd" color={colors.textTertiary}>
            kg
          </Text>
        }
      />
    </View>
  );
}

export default function OnboardingLifts() {
  const router = useRouter();
  const draft = useAppStore((s) => s.draft);
  const updateDraft = useAppStore((s) => s.updateDraft);

  const [basis, setBasis] = useState<Lifts['basis']>(draft.lifts?.basis ?? 'working');
  const [squat, setSquat] = useState(draft.lifts?.squat ? String(draft.lifts.squat) : '');
  const [bench, setBench] = useState(draft.lifts?.bench ? String(draft.lifts.bench) : '');
  const [deadlift, setDeadlift] = useState(
    draft.lifts?.deadlift ? String(draft.lifts.deadlift) : '',
  );

  const allValid =
    isValidWeight(squat) && isValidWeight(bench) && isValidWeight(deadlift);

  const previewLifts: Lifts | null = allValid
    ? { basis, squat: Number(squat), bench: Number(bench), deadlift: Number(deadlift) }
    : null;

  const hasBodyContext = !!draft.bodyWeight && !!draft.sex;
  const total = previewLifts ? totalLifts(previewLifts) : null;
  const relative =
    previewLifts && draft.bodyWeight ? relativeStrength(previewLifts, draft.bodyWeight) : null;
  const wilks =
    previewLifts && draft.bodyWeight && draft.sex
      ? wilksScore(previewLifts, draft.bodyWeight, draft.sex)
      : null;

  const handleNext = () => {
    if (!allValid) return;
    updateDraft({
      lifts: { basis, squat: Number(squat), bench: Number(bench), deadlift: Number(deadlift) },
    });
    router.push('/onboarding/gym');
  };

  // 새로고침 등으로 draft가 비면 1단계부터 다시
  if (!hasBodyContext) return <Redirect href="/onboarding" />;

  return (
    <Screen bottomInset>
      <OnboardingHeader step={2} total={TOTAL_STEPS} />

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
            <Text variant="h1">3대 중량을 입력해주세요</Text>
            <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
              정확할수록 매칭이 정확해져요
            </Text>
          </View>

          <View style={styles.basisRow}>
            <Chip
              label="작업중량"
              selected={basis === 'working'}
              onPress={() => setBasis('working')}
            />
            <Chip label="1RM" selected={basis === '1rm'} onPress={() => setBasis('1rm')} />
          </View>

          <View style={styles.form}>
            <LiftField badge="S" label="스쿼트" value={squat} onChangeText={setSquat} />
            <LiftField badge="B" label="벤치프레스" value={bench} onChangeText={setBench} />
            <LiftField badge="D" label="데드리프트" value={deadlift} onChangeText={setDeadlift} />
          </View>

          <Card style={styles.previewCard}>
            <Text variant="captionMd" color={colors.textTertiary}>
              3대 합계
            </Text>
            <Text variant="stat" color={colors.brand} style={styles.previewTotal}>
              {total !== null ? `${total}kg` : '—'}
            </Text>
            <View style={styles.previewRow}>
              <View style={styles.previewItem}>
                <Text variant="caption" color={colors.textTertiary}>
                  상대강도 (체중 대비)
                </Text>
                <Text variant="h3">{relative !== null ? formatRelative(relative) : '—'}</Text>
              </View>
              <View style={styles.previewDivider} />
              <View style={styles.previewItem}>
                <Text variant="caption" color={colors.textTertiary}>
                  Wilks 점수
                </Text>
                <Text variant="h3">{wilks !== null ? String(Math.round(wilks)) : '—'}</Text>
              </View>
            </View>
            {!hasBodyContext ? (
              <Text variant="caption" color={colors.textTertiary} style={styles.previewHint}>
                체중과 성별을 먼저 입력하면 계산돼요
              </Text>
            ) : null}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button label="다음" onPress={handleNext} disabled={!allValid} />
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
  basisRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  form: { gap: spacing.md },
  liftField: { gap: spacing.sm },
  liftLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  liftBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brandDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liftBadgeText: { fontFamily: font.bold },
  previewCard: { marginTop: spacing.lg },
  previewTotal: { marginTop: spacing.xs, marginBottom: spacing.md },
  previewRow: { flexDirection: 'row', alignItems: 'center' },
  previewItem: { flex: 1, gap: spacing.xs },
  previewDivider: { width: 1, height: 36, backgroundColor: colors.border, marginHorizontal: spacing.md },
  previewHint: { marginTop: spacing.md },
  footer: { paddingTop: spacing.md },
});
