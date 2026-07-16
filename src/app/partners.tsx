import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MatchCard } from '@/components/match/MatchCard';
import { BackButton, Button, Card, Chip, Screen, Text } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useGym, useGymMembers } from '@/hooks/useData';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  overlappingSlots,
  relativeStrength,
  withinStrengthRange,
} from '@/lib/strength';
import { useAppStore } from '@/store/useAppStore';
import { STYLE_TAG_LABEL, type StyleTag, type UserProfile } from '@/types';

const RANGE_OPTIONS: { label: string; value: number }[] = [
  { label: '±0.3', value: 0.3 },
  { label: '±0.5', value: 0.5 },
  { label: '±1.0', value: 1.0 },
  { label: '전체', value: Number.POSITIVE_INFINITY },
];

const STYLE_TAG_OPTIONS = Object.keys(STYLE_TAG_LABEL) as StyleTag[];

/** 정량 지표 기반 수준 매칭 — 같은 헬스장 + 상대강도 ±범위 + 시간대 겹침 */
export default function PartnersScreen() {
  const router = useRouter();
  const { gate } = useRequireAuth();
  const me = useAppStore((s) => s.me);
  const hasProfile = me !== null;

  const [selectedRange, setSelectedRange] = useState<number>(0.5);
  const [overlapOnly, setOverlapOnly] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<StyleTag>>(new Set());

  const toggleTag = (tag: StyleTag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const gymId = me?.gymId ?? 'g1';
  const gym = useGym(gymId);
  const { members } = useGymMembers(gymId);

  const partners = useMemo<UserProfile[]>(() => {
    const meProfile = me;
    let list = members;

    if (meProfile) {
      const myRel = relativeStrength(meProfile.lifts, meProfile.bodyWeight);

      if (Number.isFinite(selectedRange)) {
        list = list.filter((u) =>
          withinStrengthRange(
            relativeStrength(u.lifts, u.bodyWeight),
            myRel,
            selectedRange,
          ),
        );
      }

      if (overlapOnly) {
        list = list.filter(
          (u) => overlappingSlots(meProfile.slots, u.slots).length > 0,
        );
      }

      if (selectedTags.size > 0) {
        list = list.filter((u) => u.styleTags.some((t) => selectedTags.has(t)));
      }

      list = [...list].sort(
        (a, b) =>
          Math.abs(relativeStrength(a.lifts, a.bodyWeight) - myRel) -
          Math.abs(relativeStrength(b.lifts, b.bodyWeight) - myRel),
      );
    }

    return list;
  }, [me, members, selectedRange, overlapOnly, selectedTags]);

  return (
    <Screen bottomInset>
      <View style={styles.topBar}>
        <BackButton />
        <View style={styles.titleWrap}>
          <Text variant="h2">수준 매칭</Text>
          <View style={styles.gymRow}>
            <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
            <Text variant="caption" color={colors.textTertiary}>
              {gym?.name ?? '헬스장 미설정'}
            </Text>
          </View>
        </View>
      </View>

      {!hasProfile ? (
        <Card style={styles.banner}>
          <Text variant="bodyMd">
            내 3대 중량을 등록하면 딱 맞는 파트너를 찾아드려요
          </Text>
          <Button
            label="시작하기"
            size="md"
            style={styles.bannerButton}
            onPress={() => gate(() => {})}
          />
        </Card>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {RANGE_OPTIONS.map((opt) => (
          <Chip
            key={opt.label}
            label={opt.label}
            selected={
              hasProfile
                ? selectedRange === opt.value
                : !Number.isFinite(opt.value)
            }
            onPress={hasProfile ? () => setSelectedRange(opt.value) : undefined}
          />
        ))}
        <Chip
          label="시간대 겹침만"
          selected={overlapOnly}
          onPress={() => setOverlapOnly((v) => !v)}
        />
        {STYLE_TAG_OPTIONS.map((tag) => (
          <Chip
            key={tag}
            label={STYLE_TAG_LABEL[tag]}
            selected={selectedTags.has(tag)}
            onPress={() => toggleTag(tag)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={partners}
        keyExtractor={(u) => u.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MatchCard
            user={item}
            myRelative={
              me ? relativeStrength(me.lifts, me.bodyWeight) : undefined
            }
            overlap={me ? overlappingSlots(me.slots, item.slots) : []}
            onPress={() => router.push(`/match/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={32} color={colors.textTertiary} />
            <Text variant="caption" color={colors.textTertiary}>
              조건에 맞는 파트너가 아직 없어요
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.brand,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { marginTop: 3 },
  gymRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  banner: { marginBottom: spacing.md, gap: spacing.md },
  bannerButton: { alignSelf: 'flex-start' },
  filterScroll: { flexGrow: 0 },
  filterRow: { gap: spacing.sm, paddingVertical: spacing.sm },
  list: { flex: 1 },
  listContent: { gap: spacing.md, paddingBottom: spacing.xl },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
});
