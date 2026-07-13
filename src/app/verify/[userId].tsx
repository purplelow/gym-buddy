import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackButton, Button, Card, Screen, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { userById, gymById } from '@/lib/mock';

type Step = 1 | 2 | 3;

export default function VerifyScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const setMatchStatus = useAppStore((s) => s.setMatchStatus);
  const matchRequests = useAppStore((s) => s.matchRequests);

  const [step, setStep] = useState<Step>(1);

  const partner = userId ? userById(userId) : null;
  const partnerGym = partner ? gymById(partner.gymId) : null;

  const handleVerifyStep2 = useCallback(() => {
    if (!userId) return;

    // 검증 처리: matchRequests에서 toUserId === userId인 요청 찾아 상태 업데이트
    const request = matchRequests.find(
      (r) => r.toUserId === userId && r.status === 'met',
    );

    if (request) {
      setMatchStatus(request.id, 'verified');
    }

    setStep(3);
  }, [userId, matchRequests, setMatchStatus]);

  const handleSkipVerify = useCallback(() => {
    setStep(3);
  }, []);

  if (!partner || !userId) {
    return (
      <Screen>
        <View style={styles.errorContainer}>
          <Text variant="h2">파트너를 찾을 수 없어요.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Header with back button */}
      <View style={styles.header}>
        <BackButton />
      </View>

      {/* Step 1: Met and worked out */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          <Card style={styles.stepCard}>
            <Text variant="h2" style={styles.stepTitle}>
              실제로 만나서 운동했나요?
            </Text>

            <View style={styles.partnerInfo}>
              <Text variant="body" color={colors.textSecondary}>
                {partner.nickname}
              </Text>
              <Text variant="caption" color={colors.textTertiary}>
                {partnerGym?.name}
              </Text>
            </View>

            <View style={styles.buttonGroup}>
              <Button
                label="네, 함께 운동했어요"
                onPress={() => setStep(2)}
                variant="primary"
              />
              <Button
                label="아직이요"
                onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
                variant="ghost"
              />
            </View>
          </Card>
        </View>
      )}

      {/* Step 2: Verify weights */}
      {step === 2 && (
        <View style={styles.stepContainer}>
          <Card style={styles.stepCard}>
            <Text variant="h2" style={styles.stepTitle}>
              파트너의 중량, 실제와 일치했나요?
            </Text>

            <View style={styles.liftsContainer}>
              <View style={styles.liftRow}>
                <Text variant="bodyMd" color={colors.textSecondary}>
                  스쿼트
                </Text>
                <Text variant="stat" color={colors.brand}>
                  {partner.lifts.squat}kg
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.liftRow}>
                <Text variant="bodyMd" color={colors.textSecondary}>
                  벤치프레스
                </Text>
                <Text variant="stat" color={colors.brand}>
                  {partner.lifts.bench}kg
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.liftRow}>
                <Text variant="bodyMd" color={colors.textSecondary}>
                  데드리프트
                </Text>
                <Text variant="stat" color={colors.brand}>
                  {partner.lifts.deadlift}kg
                </Text>
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <Button
                label="네, 실측으로 확인했어요"
                onPress={handleVerifyStep2}
                variant="primary"
              />
              <Button
                label="잘 모르겠어요"
                onPress={handleSkipVerify}
                variant="ghost"
              />
            </View>
          </Card>
        </View>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <View style={styles.successContainer}>
          <View style={styles.checkmarkCircle}>
            <Ionicons name="checkmark" size={64} color={colors.brand} />
          </View>

          <Text variant="h1" style={styles.successTitle}>
            검증 완료!
          </Text>

          <Text
            variant="body"
            color={colors.textSecondary}
            style={styles.successDesc}
          >
            파트너 프로필에 실측 검증 뱃지가 쌓여요.{'\n'}
            검증이 쌓일수록 매칭 신뢰도가 올라가요
          </Text>

          <Button
            label="홈으로"
            onPress={() => router.replace('/(tabs)')}
            style={styles.homeButton}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  stepCard: {
    gap: spacing.lg,
  },
  stepTitle: {
    marginBottom: spacing.md,
  },
  partnerInfo: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  liftsContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  liftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  buttonGroup: {
    gap: spacing.md,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xl,
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.brandDim,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    textAlign: 'center',
  },
  successDesc: {
    textAlign: 'center',
    lineHeight: 24,
  },
  homeButton: {
    width: '100%',
    marginTop: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
