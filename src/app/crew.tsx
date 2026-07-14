import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { BackButton, Badge, Button, Card, Screen, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { CREWS } from '@/lib/crews';
import { useAppStore } from '@/store/useAppStore';

/** 크루/프로그램 단위 매칭 — 같은 프로그램을 같은 주기로 도는 2~4인 그룹 */
export default function CrewScreen() {
  const router = useRouter();
  const { gate } = useRequireAuth();
  const me = useAppStore((s) => s.me);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  const myGymId = me?.gymId ?? 'g1';
  const crews = CREWS.filter((c) => c.gymId === myGymId);

  const requestJoin = (crewId: string) =>
    gate(() => setRequested((prev) => new Set(prev).add(crewId)));

  return (
    <Screen bottomInset>
      <View style={styles.topBar}>
        <BackButton />
        <View style={styles.titleWrap}>
          <Text variant="h2">크루 매칭</Text>
          <Text variant="caption" color={colors.textTertiary} style={styles.subtitle}>
            같은 프로그램, 같은 주기로 함께
          </Text>
        </View>
      </View>

      <FlatList
        data={crews}
        keyExtractor={(c) => c.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: crew }) => {
          const isRequested = requested.has(crew.id);
          const isFull = crew.memberNicknames.length >= crew.capacity;
          return (
            <Card style={styles.crewCard}>
              <View style={styles.cardTop}>
                <Badge label={crew.program} />
                <Text variant="caption" color={colors.textTertiary}>
                  {crew.cycleWeeks}주 사이클
                </Text>
              </View>

              <Text variant="h3">{crew.name}</Text>
              <Text variant="body" color={colors.textSecondary}>
                {crew.description}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.avatarStack}>
                  {crew.memberNicknames.map((nick, i) => (
                    <View
                      key={nick}
                      style={[styles.miniAvatar, i > 0 && { marginLeft: -10 }]}
                    >
                      <Text variant="captionMd" color={colors.brand}>
                        {nick.charAt(0)}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text variant="captionMd" color={colors.textSecondary}>
                  {crew.memberNicknames.length}/{crew.capacity}명
                </Text>
                <View style={styles.dot} />
                <Ionicons name="time-outline" size={13} color={colors.textTertiary} />
                <Text variant="caption" color={colors.textTertiary}>
                  {crew.slotSummary}
                </Text>
              </View>

              <Button
                label={
                  isFull ? '모집 완료' : isRequested ? '요청됨 · 응답 대기중' : '참여 요청'
                }
                size="md"
                disabled={isFull || isRequested}
                variant={isRequested ? 'secondary' : 'primary'}
                onPress={() => requestJoin(crew.id)}
              />
            </Card>
          );
        }}
        ListFooterComponent={
          <Text variant="caption" color={colors.textTertiary} style={styles.footNote}>
            크루 기능은 베타예요 — 곧 직접 크루를 만들 수 있어요
          </Text>
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
  titleWrap: { marginTop: 3 },
  subtitle: { marginTop: 2 },
  list: { flex: 1 },
  listContent: { gap: spacing.md, paddingBottom: spacing.xl },
  crewCard: { gap: spacing.md },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarStack: { flexDirection: 'row' },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textTertiary,
  },
  footNote: { textAlign: 'center', paddingVertical: spacing.md },
});
