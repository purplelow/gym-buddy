import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useGym } from '@/hooks/useData';
import { authErrorMessage, signOut, unlinkSocial } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore, type AuthProvider } from '@/store/useAppStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const PROVIDER_META: Record<
  AuthProvider,
  { label: string; icon: IconName; color: string }
> = {
  email: { label: '이메일', icon: 'mail', color: colors.textSecondary },
  google: { label: 'Google', icon: 'logo-google', color: '#FFFFFF' },
  kakao: { label: '카카오', icon: 'chatbubble', color: colors.kakao },
};

export default function ProfileScreen() {
  const router = useRouter();
  const { me, matchRequests, updateDraft, clearSession } = useAppStore();
  const isLoggedIn = useAppStore((s) => s.userId !== null);
  const authProvider = useAppStore((s) => s.authProvider);
  // 훅은 조기 return보다 위에서 호출해야 한다 (Rules of Hooks)
  const gym = useGym(me?.gymId);
  const [unlinking, setUnlinking] = useState(false);
  const [unlinkMsg, setUnlinkMsg] = useState<string | undefined>();

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured) await signOut();
    } catch (e) {
      console.warn('[짝짐] 로그아웃 실패', e);
    }
    clearSession();
    router.replace('/(tabs)');
  };

  const handleUnlinkSocial = async () => {
    if (authProvider !== 'google' && authProvider !== 'kakao') return;
    setUnlinking(true);
    setUnlinkMsg(undefined);
    try {
      const { ok, needsAnotherMethod } = await unlinkSocial(authProvider);
      if (ok) {
        // 해제 성공 → 세션 정리하고 홈으로
        clearSession();
        router.replace('/(tabs)');
        return;
      }
      setUnlinkMsg(
        needsAnotherMethod
          ? '이 계정의 유일한 로그인 수단이라 해제할 수 없어요. 먼저 다른 로그인 수단을 연결해주세요.'
          : '연동 해제할 소셜 계정을 찾지 못했어요.',
      );
    } catch (e) {
      setUnlinkMsg(authErrorMessage(e));
    } finally {
      setUnlinking(false);
    }
  };

  // 기존 프로필 값을 draft로 채워 온보딩을 "수정" 모드로 재사용
  const handleEditProfile = () => {
    if (!me) return;
    updateDraft({
      nickname: me.nickname,
      sex: me.sex,
      bodyWeight: me.bodyWeight,
      lifts: me.lifts,
      gymId: me.gymId,
      slots: me.slots,
      styleTags: me.styleTags,
    });
    router.push('/onboarding');
  };

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

        {/* 로그인 방식 */}
        {authProvider && (
          <View style={styles.padded}>
            <Card>
              <Text variant="h3" style={{ marginBottom: spacing.md }}>
                로그인 방식
              </Text>
              <View style={styles.providerRow}>
                <View
                  style={[
                    styles.providerIcon,
                    { backgroundColor: PROVIDER_META[authProvider].color + '22' },
                  ]}
                >
                  <Ionicons
                    name={PROVIDER_META[authProvider].icon}
                    size={18}
                    color={PROVIDER_META[authProvider].color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMd">
                    {PROVIDER_META[authProvider].label}
                    {authProvider !== 'email' ? ' 소셜 로그인' : ' 로그인'}
                  </Text>
                  <Text variant="caption" color={colors.textTertiary}>
                    {authProvider === 'email'
                      ? '이메일과 비밀번호로 로그인 중이에요'
                      : `${PROVIDER_META[authProvider].label} 계정으로 연동되어 있어요`}
                  </Text>
                </View>
              </View>

              {(authProvider === 'google' || authProvider === 'kakao') && (
                <>
                  <Button
                    label="소셜 연동 해제"
                    variant="secondary"
                    onPress={handleUnlinkSocial}
                    loading={unlinking}
                    disabled={unlinking}
                    style={{ marginTop: spacing.md }}
                  />
                  {unlinkMsg && (
                    <Text
                      variant="caption"
                      color={colors.danger}
                      style={{ marginTop: spacing.sm }}
                    >
                      {unlinkMsg}
                    </Text>
                  )}
                </>
              )}
            </Card>
          </View>
        )}

        {/* 프로필 수정 / 로그아웃 */}
        <View style={[styles.padded, styles.actions]}>
          <Button
            label="프로필 수정"
            variant="secondary"
            icon={
              <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
            }
            onPress={handleEditProfile}
          />
          <Button label="로그아웃" variant="danger" onPress={handleLogout} />
        </View>

        {/* 하단 버전 정보 */}
        <View style={styles.padded}>
          <Text
            variant="caption"
            color={colors.textTertiary}
            style={{ textAlign: 'center', marginTop: spacing.lg }}
          >
            Gym-Buddy v0.1 — MVP
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
  actions: {
    gap: spacing.md,
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

  // 로그인 방식
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
