import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MatchCard } from '@/components/match/MatchCard';
import { Button, Card, Screen, Text } from '@/components/ui';
import { colors, font, radius, spacing } from '@/constants/theme';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { gymById, MOCK_USERS } from '@/lib/mock';
import { overlappingSlots, relativeStrength } from '@/lib/strength';
import { useAppStore } from '@/store/useAppStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** 홈 허브 — 4대 핵심 기능을 종류별로 선택 */
export default function HomeScreen() {
  const router = useRouter();
  const { gate } = useRequireAuth();
  const me = useAppStore((s) => s.me);
  const hasProfile = me !== null;

  const gym = gymById(me?.gymId ?? 'g1');

  // 내 수준 근접 추천 미리보기 (top 2)
  const recommended = useMemo(() => {
    const gymId = me?.gymId ?? 'g1';
    const list = MOCK_USERS.filter((u) => u.gymId === gymId && u.id !== me?.id);
    if (!me) return list.slice(0, 2);
    const myRel = relativeStrength(me.lifts, me.bodyWeight);
    return [...list]
      .sort(
        (a, b) =>
          Math.abs(relativeStrength(a.lifts, a.bodyWeight) - myRel) -
          Math.abs(relativeStrength(b.lifts, b.bodyWeight) - myRel),
      )
      .slice(0, 2);
  }, [me]);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text variant="h1" color={colors.brand} style={styles.brand}>
            짝짐
          </Text>
          <View style={styles.gymRow}>
            <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
            <Text variant="caption" color={colors.textTertiary}>
              {gym?.name ?? '헬스장 미설정'}
            </Text>
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

        {/* 4대 기능 카드 */}
        <View style={styles.gridRow}>
          {/* 대표 기능: 수준 매칭 — 라임 강조 카드 */}
          <Pressable style={styles.gridItem} onPress={() => router.push('/partners')}>
            <View style={styles.featureCard}>
              <LinearGradient
                colors={[colors.brand, colors.brand400]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="barbell" size={28} color={colors.textInvert} />
              <View style={styles.featureTextWrap}>
                <Text variant="bodyMd" color={colors.textInvert} style={styles.featureTitle}>
                  수준 매칭
                </Text>
                <Text variant="caption" color="rgba(10,11,8,0.7)">
                  3대 수치로 딱 맞는 파트너
                </Text>
              </View>
            </View>
          </Pressable>

          <FeatureCard
            icon="people"
            title="크루 매칭"
            caption="같은 프로그램, 같은 주기"
            onPress={() => router.push('/crew')}
          />
        </View>

        <View style={styles.gridRow}>
          <FeatureCard
            icon="location"
            title="내 헬스장"
            caption={`멤버 ${gym?.memberCount ?? 0}명 · 초밀착`}
            onPress={() => router.push('/gym')}
          />
          <FeatureCard
            icon="flash"
            title="스팟 요청"
            caption="지금 바로 보조 찾기"
            onPress={() => router.push('/spot')}
          />
        </View>

        {/* 추천 미리보기 */}
        <View style={styles.sectionHeader}>
          <Text variant="h3">
            {hasProfile ? '내 수준에 딱 맞는 파트너' : '우리 헬스장 파트너'}
          </Text>
          <Pressable onPress={() => router.push('/partners')} hitSlop={8}>
            <Text variant="captionMd" color={colors.brand}>
              전체 보기
            </Text>
          </Pressable>
        </View>

        <View style={styles.previewList}>
          {recommended.map((user) => (
            <MatchCard
              key={user.id}
              user={user}
              myRelative={me ? relativeStrength(me.lifts, me.bodyWeight) : undefined}
              overlap={me ? overlappingSlots(me.slots, user.slots) : []}
              onPress={() => router.push(`/match/${user.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function FeatureCard({
  icon,
  title,
  caption,
  onPress,
}: {
  icon: IconName;
  title: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.gridItem} onPress={onPress}>
      <View style={[styles.featureCard, styles.featureCardDark]}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={20} color={colors.brand} />
        </View>
        <View style={styles.featureTextWrap}>
          <Text variant="bodyMd" style={styles.featureTitle}>
            {title}
          </Text>
          <Text variant="caption" color={colors.textTertiary}>
            {caption}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xl },
  header: { paddingTop: spacing.md, paddingBottom: spacing.md, gap: 4 },
  brand: { fontFamily: font.bold },
  gymRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  banner: { marginBottom: spacing.md, gap: spacing.md },
  bannerButton: { alignSelf: 'flex-start' },
  gridRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  gridItem: { flex: 1 },
  featureCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    height: 128,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  featureCardDark: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brandDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: { gap: 2 },
  featureTitle: { fontFamily: font.semiBold },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  previewList: { gap: spacing.md },
});
