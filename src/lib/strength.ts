import type { Lifts, Sex, TimeSlot } from '@/types';

/** 3대 합계 (kg) */
export function totalLifts(lifts: Lifts): number {
  return lifts.squat + lifts.bench + lifts.deadlift;
}

/** 체중 대비 상대강도 = 3대 합계 / 체중. 매칭의 1차 지표 */
export function relativeStrength(lifts: Lifts, bodyWeight: number): number {
  if (bodyWeight <= 0) return 0;
  return totalLifts(lifts) / bodyWeight;
}

/**
 * Wilks-2020 계수 기반 점수.
 * 체중(kg)과 3대 합계(kg)로 성별 보정 점수를 산출한다.
 */
const WILKS2020 = {
  male: {
    a: 47.4617885411949,
    b: 8.472061379048,
    c: 0.073694103462609,
    d: -0.00139583381094385,
    e: 7.07665973070743e-6,
    f: -1.20804336482315e-8,
  },
  female: {
    a: -125.425539779509,
    b: 13.7121941940668,
    c: -0.0330725063103405,
    d: -0.0010504000506583,
    e: 9.38773881462799e-6,
    f: -2.3334613884954e-8,
  },
} as const;

export function wilksScore(lifts: Lifts, bodyWeight: number, sex: Sex): number {
  const { a, b, c, d, e, f } = WILKS2020[sex];
  const w = Math.min(Math.max(bodyWeight, 40), 200.95);
  const denom =
    a + b * w + c * w ** 2 + d * w ** 3 + e * w ** 4 + f * w ** 5;
  if (denom === 0) return 0;
  return (600 / denom) * totalLifts(lifts);
}

/** 상대강도 차이가 ±range 이내인지 (매칭 필터 기본 ±0.5) */
export function withinStrengthRange(
  a: number,
  b: number,
  range: number,
): boolean {
  return Math.abs(a - b) <= range;
}

/** 두 시간대 집합의 겹치는 슬롯 */
export function overlappingSlots(a: TimeSlot[], b: TimeSlot[]): TimeSlot[] {
  return a.filter((s) => b.some((t) => t.day === s.day && t.band === s.band));
}

export function formatRelative(value: number): string {
  return `x${value.toFixed(2)}`;
}
