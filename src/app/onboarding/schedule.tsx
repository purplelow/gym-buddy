import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Button, OnboardingHeader, Screen, Text, useContentWidth } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import {
  TIME_BAND_LABEL,
  WEEKDAY_LABEL,
  type TimeBand,
  type TimeSlot,
  type Weekday,
} from '@/types';

const TOTAL_STEPS = 5;
const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIME_BANDS: TimeBand[] = ['dawn', 'morning', 'lunch', 'evening', 'night'];
const GRID_COLUMNS = 8; // 1 label column + 7 weekday columns

export default function OnboardingSchedule() {
  const router = useRouter();
  // 창 너비가 아니라 셸(콘텐츠) 폭 기준으로 셀 크기를 계산한다
  const width = useContentWidth();
  const draft = useAppStore((s) => s.draft);
  const updateDraft = useAppStore((s) => s.updateDraft);

  const [slots, setSlots] = useState<TimeSlot[]>(draft.slots ?? []);

  const cellSize = Math.floor((width - spacing.lg * 2) / GRID_COLUMNS) - 4;

  const isSelected = (day: Weekday, band: TimeBand) =>
    slots.some((s) => s.day === day && s.band === band);

  const toggle = (day: Weekday, band: TimeBand) => {
    setSlots((prev) =>
      prev.some((s) => s.day === day && s.band === band)
        ? prev.filter((s) => !(s.day === day && s.band === band))
        : [...prev, { day, band }],
    );
  };

  const isValid = slots.length >= 1;

  const handleNext = () => {
    if (!isValid) return;
    updateDraft({ slots });
    router.push('/onboarding/tags');
  };

  // 새로고침 등으로 draft가 비면 1단계부터 다시
  if (!draft.gymId) return <Redirect href="/onboarding" />;

  return (
    <Screen bottomInset>
      <OnboardingHeader step={4} total={TOTAL_STEPS} />

      <View style={styles.header}>
        <Text variant="h1">주로 언제 운동하세요?</Text>
        <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
          가능한 시간대를 모두 선택해주세요
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <View style={[styles.cornerCell, { width: cellSize, height: 32 }]} />
            {WEEKDAYS.map((day) => (
              <View key={day} style={[styles.headerCell, { width: cellSize, height: 32 }]}>
                <Text variant="captionMd" color={colors.textSecondary}>
                  {WEEKDAY_LABEL[day]}
                </Text>
              </View>
            ))}
          </View>

          {TIME_BANDS.map((band) => (
            <View key={band} style={styles.gridRow}>
              <View style={[styles.labelCell, { width: cellSize, height: cellSize }]}>
                <Text variant="caption" color={colors.textSecondary}>
                  {TIME_BAND_LABEL[band]}
                </Text>
              </View>
              {WEEKDAYS.map((day) => {
                const selected = isSelected(day, band);
                return (
                  <Pressable
                    key={`${day}-${band}`}
                    onPress={() => toggle(day, band)}
                    hitSlop={2}
                    style={[
                      styles.cell,
                      { width: cellSize, height: cellSize },
                      selected ? styles.cellSelected : styles.cellUnselected,
                    ]}
                  >
                    {selected ? (
                      <Ionicons name="checkmark" size={16} color={colors.textInvert} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <Text variant="captionMd" color={colors.brand} style={styles.countText}>
          {slots.length}개 선택됨
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="다음" onPress={handleNext} disabled={!isValid} />
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
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.sm },
  scrollContent: { paddingBottom: spacing.xl, alignItems: 'center' },
  grid: { gap: 4 },
  gridRow: { flexDirection: 'row', gap: 4 },
  cornerCell: { alignItems: 'center', justifyContent: 'center' },
  headerCell: { alignItems: 'center', justifyContent: 'center' },
  labelCell: { alignItems: 'center', justifyContent: 'center' },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  cellUnselected: { backgroundColor: colors.glass, borderColor: colors.border },
  cellSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  countText: { marginTop: spacing.lg, textAlign: 'center' },
  footer: { paddingTop: spacing.md },
});
