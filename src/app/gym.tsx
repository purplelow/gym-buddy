import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { BackButton, Card, Screen, Text, VerificationBadge } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { gymById, MOCK_USERS } from '@/lib/mock';
import { formatRelative, relativeStrength } from '@/lib/strength';
import { useAppStore } from '@/store/useAppStore';

/** 같은 헬스장 초밀착 — 내 헬스장 등록 멤버 전체 보기 */
export default function GymScreen() {
  const router = useRouter();
  const me = useAppStore((s) => s.me);
  const spotRequests = useAppStore((s) => s.spotRequests);

  const myGymId = me?.gymId ?? 'g1';
  const gym = gymById(myGymId);
  const members = MOCK_USERS.filter(
    (u) => u.gymId === myGymId && u.id !== me?.id,
  );
  const liveSpots = spotRequests.filter((r) => r.gymId === myGymId).length;

  return (
    <Screen bottomInset>
      <View style={styles.topBar}>
        <BackButton />
        <View style={{ flex: 1 }}>
          <Text variant="h2">{gym?.name ?? '내 헬스장'}</Text>
          <Text variant="caption" color={colors.textTertiary} style={styles.subtitle}>
            {gym?.address}
          </Text>
        </View>
      </View>

      <Card style={styles.statCard}>
        <View style={styles.statItem}>
          <Text variant="stat" color={colors.brand}>
            {gym?.memberCount ?? 0}명
          </Text>
          <Text variant="caption" color={colors.textTertiary}>
            등록 멤버
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text variant="stat">{liveSpots}건</Text>
          <Text variant="caption" color={colors.textTertiary}>
            진행 중 스팟 요청
          </Text>
        </View>
      </Card>

      <Text variant="captionMd" color={colors.textSecondary} style={styles.sectionLabel}>
        지금 매칭 가능한 멤버
      </Text>

      <FlatList
        data={members}
        keyExtractor={(u) => u.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: user }) => (
          <Card onPress={() => router.push(`/match/${user.id}`)} style={styles.memberRow}>
            <View style={styles.avatar}>
              <Text variant="bodyMd" color={colors.brand}>
                {user.nickname.charAt(0)}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text variant="bodyMd">{user.nickname}</Text>
              <Text variant="caption" color={colors.textTertiary}>
                상대강도 {formatRelative(relativeStrength(user.lifts, user.bodyWeight))}
              </Text>
            </View>
            <VerificationBadge level={user.verification} />
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
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
  subtitle: { marginTop: 2 },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statItem: { flex: 1, gap: spacing.xs },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  sectionLabel: { marginBottom: spacing.sm },
  list: { flex: 1 },
  listContent: { gap: spacing.sm, paddingBottom: spacing.xl },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: { flex: 1, gap: 2 },
});
