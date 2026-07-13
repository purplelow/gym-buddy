/** 크루/프로그램 단위 매칭 목데이터 (P1 기능의 v0 목업) */

export interface Crew {
  id: string;
  name: string;
  program: string; // 5/3/1 BBB, nSuns 5day 등
  gymId: string;
  memberNicknames: string[];
  capacity: number;
  cycleWeeks: number;
  slotSummary: string; // "월·수·금 저녁"
  description: string;
}

export const CREWS: Crew[] = [
  {
    id: 'c1',
    name: '저녁 531 크루',
    program: '5/3/1 BBB',
    gymId: 'g1',
    memberNicknames: ['3대500지망생', '벤치만삼년'],
    capacity: 3,
    cycleWeeks: 4,
    slotSummary: '월·수·금 저녁',
    description: '4주 사이클로 돌아요. 보조운동 같이 맞춰갈 분!',
  },
  {
    id: 'c2',
    name: '새벽 엔선즈',
    program: 'nSuns 5day',
    gymId: 'g1',
    memberNicknames: ['새벽바벨'],
    capacity: 3,
    cycleWeeks: 3,
    slotSummary: '화·목·토 새벽',
    description: '출근 전 새벽 세션. 꾸준함이 최우선이에요.',
  },
  {
    id: 'c3',
    name: '주말 대회 준비반',
    program: '파워리프팅 피킹',
    gymId: 'g1',
    memberNicknames: ['데드리프터', '무게의신'],
    capacity: 4,
    cycleWeeks: 8,
    slotSummary: '토·일 오전',
    description: '가을 대회 목표. 고중량 스팟 상호 지원 필수.',
  },
];
