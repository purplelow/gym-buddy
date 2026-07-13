import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  type ViewStyle,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { VerificationBadge } from '@/components/ui/Badge';
import { colors, radius, spacing, font } from '@/constants/theme';
import { STYLE_TAG_LABEL, TIME_BAND_LABEL, WEEKDAY_LABEL } from '@/types';
import {
  totalLifts,
  relativeStrength,
  wilksScore,
  formatRelative,
} from '@/lib/strength';
import { gymById } from '@/lib/mock';
import { useAppStore } from '@/store/useAppStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { isLoggedIn, me, logout, matchRequests } = useAppStore();

  // 비로그인 또는 프로필 미등록 상태
  if (!isLoggedIn || !me) {
    return (
      <Screen style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Ionicons
            name="person-circle-outline"
            size={80}
            color={colors.textTertiary}
          />
          <Text variant="h2" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
            내 프로필이 비어있어요
          </Text>
          <Text
            variant="body"
            color={colors.textSecondary}
            style={{
              marginTop: spacing.md,
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            3대 중량을 등록하고{'\n'}내 수준에 맞는 파트너를 찾아보세요
          </Text>
          <Button
            label="로그인하고 시작하기"
            variant="primary"
            onPress={() => router.push('/login')}
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </Screen>
    );
  }

  // 로그인 + 프로필 등록 상태
  const gym = gymById(me.gymId);
  const initials = me.nickname.charAt(0).toUpperCase();
  const total = totalLifts(me.lifts);
  const relative = relativeStrength(me.lifts, me.bodyWeight);
  const wilks = Math.round(wilksScore(me.lifts, me.bodyWeight, me.sex));

  return (
    <Screen padded={false} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 프로필 헤더 */}
        <View style={[styles.padded, styles.headerSection]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text
                variant="display"
                color={colors.brand}
                style={{ lineHeight: 40 }}
              >
                {initials}
              </Text>
            </View>
          </View>
          <Text variant="h1" style={{ marginTop: spacing.md, textAlign: 'center' }}>
            {me.nickname}
          </Text>
          <View style={styles.badgeContainer}>
            <VerificationBadge level={me.verification} />
          </View>
          {gym && (
            <View style={styles.gymInfo}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text
                variant="caption"
                color={colors.textSecondary}
                style={{ marginLeft: spacing.xs }}
              >
                {gym.name}
              </Text>
            </View>
          )}
        </View>

        {/* 내 기록 */}
        <View style={styles.padded}>
          <Card>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>
              내 기록
            </Text>
            <View style={styles.statsGrid}>
              {/* 첫 행: 스쿼트, 벤치, 데드 */}
              <StatCell
                label="스쿼트"
                value={me.lifts.squat}
              />
              <StatCell
                label="벤치"
                value={me.lifts.bench}
              />
              <StatCell
                label="데드"
                value={me.lifts.deadlift}
              />
              {/* 둘째 행: 합계, 상대강도, Wilks */}
              <StatCell
                label="3대 합계"
                value={total}
              />
              <StatCell
                label="상대강도"
                value={formatRelative(relative)}
                highlight
              />
              <StatCell
                label="Wilks"
                value={wilks}
              />
            </View>
          </Card>
        </View>

        {/* 운동 시간대 */}
        {me.slots.length > 0 && (
          <View style={styles.padded}>
            <Card>
              <Text variant="h3" style={{ marginBottom: spacing.md }}>
                운동 시간대
              </Text>
              <View style={styles.chipContainer}>
                {me.slots.map((slot, idx) => (
                  <Chip
                    key={idx}
                    label={`${WEEKDAY_LABEL[slot.day]} ${TIME_BAND_LABEL[slot.band]}`}
                    size="sm"
                  />
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* 운동 스타일 */}
        {me.styleTags.length > 0 && (
          <View style={styles.padded}>
            <Card>
              <Text variant="h3" style={{ marginBottom: spacing.md }}>
                운동 스타일
              </Text>
              <View style={styles.chipContainer}>
                {me.styleTags.map((tag, idx) => (
                  <Chip
                    key={idx}
                    label={STYLE_TAG_LABEL[tag]}
                    size="sm"
                  />
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* 소개 */}
        {me.intro && (
          <View style={styles.padded}>
            <Card>
              <Text variant="h3" style={{ marginBottom: spacing.md }}>
                소개
              </Text>
              <Text variant="body" color={colors.textSecondary}>
                {me.intro}
              </Text>
            </Card>
          </View>
        )}

        {/* 매칭 요청 */}
        <View style={[styles.padded, styles.matchRequestRow]}>
          <Ionicons
            name="paper-plane-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text
            variant="body"
            color={colors.textSecondary}
            style={{ marginLeft: spacing.sm, flex: 1 }}
          >
            보낸 매칭 요청
          </Text>
          <Text
            variant="bodyMd"
            color={colors.brand}
            style={{ fontFamily: font.bold }}
          >
            {matchRequests.length}건
          </Text>
        </View>

        {/* 로그아웃 버튼 */}
        <View style={styles.padded}>
          <Button
            label="로그아웃"
            variant="danger"
            onPress={() => {
              logout();
              router.replace('/(tabs)');
            }}
          />
        </View>

        {/* 하단 버전 정보 */}
        <View style={styles.padded}>
          <Text
            variant="caption"
            color={colors.textTertiary}
            style={{ textAlign: 'center', marginTop: spacing.lg }}
          >
            짝짐 v0.1 — MVP
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

/** 통계 셀 컴포넌트 */
function StatCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <View style={styles.statCell}>
      <Text
        variant="stat"
        color={highlight ? colors.brand : colors.textPrimary}
      >
        {value}
      </Text>
      <Text
        variant="caption"
        color={colors.textSecondary}
        style={{ marginTop: spacing.xs }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },

  // 비로그인 상태
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
  },

  // 프로필 헤더
  headerSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    marginTop: spacing.md,
  },
  gymInfo: {
    flexDirection: 'row',
    marginTop: spacing.md,
    alignItems: 'center',
  },

  // 통계 그리드
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  statCell: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
  },

  // Chip 컨테이너
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  // 매칭 요청 행
  matchRequestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
});
