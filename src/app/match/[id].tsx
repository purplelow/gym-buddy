import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BackButton, Button, Card, Chip, Screen, Text, VerificationBadge } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { gymById, userById } from '@/lib/mock';
import {
  formatRelative,
  overlappingSlots,
  relativeStrength,
  totalLifts,
  wilksScore,
} from '@/lib/strength';
import { useAppStore, useMatchStatusFor } from '@/store/useAppStore';
import {
  STYLE_TAG_LABEL,
  TIME_BAND_LABEL,
  WEEKDAY_LABEL,
  type Lifts,
} from '@/types';

const LIFTS_BASIS_LABEL: Record<Lifts['basis'], string> = {
  working: '작업중량 기준',
  '1rm': '1RM 기준',
};

const MOCK_OPEN_CHAT_URL = 'open.kakao.com/o/gymbuddy123';

export default function MatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gate } = useRequireAuth();
  const me = useAppStore((s) => s.me);
  const sendMatchRequest = useAppStore((s) => s.sendMatchRequest);
  const setMatchStatus = useAppStore((s) => s.setMatchStatus);
  const req = useMatchStatusFor(id ?? '');

  const user = id ? userById(id) : undefined;

  if (!user) {
    return (
      <Screen bottomInset>
        <View style={styles.topBar}>
          <BackButton />
        </View>
        <View style={styles.notFound}>
          <Text variant="h3">찾을 수 없어요</Text>
          <Button
            label="뒤로 가기"
            variant="secondary"
            size="md"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          />
        </View>
      </Screen>
    );
  }

  const gym = gymById(user.gymId);
  const relative = relativeStrength(user.lifts, user.bodyWeight);
  const wilks = wilksScore(user.lifts, user.bodyWeight, user.sex);
  const overlap = me ? overlappingSlots(me.slots, user.slots) : [];

  let cta: React.ReactNode;
  if (!req) {
    cta = (
      <Button
        label="매칭 요청하기"
        size="lg"
        onPress={() => gate(() => sendMatchRequest(user.id))}
      />
    );
  } else if (req.status === 'requested') {
    cta = (
      <View style={styles.ctaStack}>
        <Button label="요청됨 · 수락 대기중" size="lg" disabled />
        <Button
          label="(데모) 상대가 수락했다고 가정"
          variant="ghost"
          size="md"
          onPress={() => setMatchStatus(req.id, 'accepted')}
        />
      </View>
    );
  } else if (req.status === 'accepted') {
    cta = (
      <Card style={styles.ctaCard}>
        <Text variant="bodyMd">매칭 성사! 오픈채팅으로 약속을 잡아보세요</Text>
        <Text variant="captionMd" color={colors.brand}>
          {MOCK_OPEN_CHAT_URL}
        </Text>
        <Button
          label="운동 완료 — 상호 인증하기"
          size="lg"
          onPress={() => router.push(`/verify/${user.id}`)}
        />
      </Card>
    );
  } else if (req.status === 'verified') {
    cta = (
      <Card style={styles.ctaCardCenter}>
        <Text variant="bodyMd" color={colors.brand}>
          상호 검증 완료 ✓
        </Text>
      </Card>
    );
  } else {
    cta = null;
  }

  return (
    <Screen bottomInset>
      <View style={styles.topBar}>
        <BackButton />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text variant="display" color={colors.brand}>
              {user.nickname.charAt(0)}
            </Text>
          </View>
          <Text variant="h2">{user.nickname}</Text>
          <VerificationBadge level={user.verification} style={styles.headerBadge} />
          {gym ? (
            <View style={styles.gymRow}>
              <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
              <Text variant="caption" color={colors.textTertiary}>
                {gym.name}
              </Text>
            </View>
          ) : null}
        </View>

        <Card style={styles.card}>
          <Text variant="captionMd" color={colors.textTertiary}>
            3대 기록 · {LIFTS_BASIS_LABEL[user.lifts.basis]}
          </Text>
          <View style={styles.statCols}>
            <View style={styles.statCol}>
              <Text variant="caption" color={colors.textTertiary}>
                스쿼트
              </Text>
              <Text variant="stat">{user.lifts.squat}kg</Text>
            </View>
            <View style={styles.statCol}>
              <Text variant="caption" color={colors.textTertiary}>
                벤치
              </Text>
              <Text variant="stat">{user.lifts.bench}kg</Text>
            </View>
            <View style={styles.statCol}>
              <Text variant="caption" color={colors.textTertiary}>
                데드리프트
              </Text>
              <Text variant="stat">{user.lifts.deadlift}kg</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statCols}>
            <View style={styles.statCol}>
              <Text variant="caption" color={colors.textTertiary}>
                합계
              </Text>
              <Text variant="h3">{totalLifts(user.lifts)}kg</Text>
            </View>
            <View style={styles.statCol}>
              <Text variant="caption" color={colors.textTertiary}>
                상대강도
              </Text>
              <Text variant="h3" color={colors.brand}>
                {formatRelative(relative)}
              </Text>
            </View>
            <View style={styles.statCol}>
              <Text variant="caption" color={colors.textTertiary}>
                Wilks
              </Text>
              <Text variant="h3">{wilks.toFixed(0)}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text variant="captionMd" color={colors.textTertiary}>
            운동 가능 시간대
          </Text>
          <View style={styles.slotWrap}>
            {user.slots.map((slot, idx) => {
              const isOverlap = overlap.some(
                (s) => s.day === slot.day && s.band === slot.band,
              );
              return (
                <Chip
                  key={`${slot.day}-${slot.band}-${idx}`}
                  size="sm"
                  selected={isOverlap}
                  label={`${WEEKDAY_LABEL[slot.day]} ${TIME_BAND_LABEL[slot.band]}`}
                />
              );
            })}
          </View>
          {me ? (
            <Text variant="caption" color={colors.brand}>
              겹치는 시간 {overlap.length}개
            </Text>
          ) : null}
        </Card>

        <Card style={styles.card}>
          <Text variant="captionMd" color={colors.textTertiary}>
            스타일 & 소개
          </Text>
          <View style={styles.tagRow}>
            {user.styleTags.map((tag) => (
              <Chip key={tag} size="sm" label={STYLE_TAG_LABEL[tag]} />
            ))}
          </View>
          {user.intro ? (
            <Text variant="body" color={colors.textSecondary}>
              {user.intro}
            </Text>
          ) : null}
        </Card>
      </ScrollView>

      <View style={styles.ctaWrap}>{cta}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingVertical: spacing.sm },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  scroll: { flex: 1 },
  scrollContent: { gap: spacing.md, paddingBottom: spacing.xl },
  profileHeader: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  headerBadge: { alignSelf: 'center' },
  gymRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  card: { gap: spacing.md },
  statCols: { flexDirection: 'row' },
  statCol: { flex: 1, gap: 4 },
  divider: { height: 1, backgroundColor: colors.border },
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  ctaWrap: { paddingTop: spacing.md },
  ctaStack: { gap: spacing.sm },
  ctaCard: { gap: spacing.sm },
  ctaCardCenter: { alignItems: 'center' },
});
