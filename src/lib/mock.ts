import type { Gym, SpotRequest, UserProfile } from '@/types';

/** 초기 제휴 타깃 헬스장 (콜드스타트: 헬스장 단위 밀도 전략) */
export const GYMS: Gym[] = [
  { id: 'g1', name: '스파르타 짐 강남점', address: '서울 강남구 테헤란로 12', memberCount: 42 },
  { id: 'g2', name: '아이언 팩토리 역삼', address: '서울 강남구 역삼로 88', memberCount: 31 },
  { id: 'g3', name: '바벨하우스 선릉', address: '서울 강남구 선릉로 421', memberCount: 27 },
  { id: 'g4', name: '리프트랩 잠실', address: '서울 송파구 올림픽로 240', memberCount: 19 },
  { id: 'g5', name: '그라인드 짐 홍대', address: '서울 마포구 양화로 160', memberCount: 23 },
  { id: 'g6', name: '펌프 피트니스 성수', address: '서울 성동구 아차산로 49', memberCount: 15 },
];

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'u1', nickname: '3대500지망생', sex: 'male', bodyWeight: 78,
    lifts: { basis: 'working', squat: 150, bench: 105, deadlift: 180 },
    gymId: 'g1',
    slots: [
      { day: 'mon', band: 'evening' }, { day: 'wed', band: 'evening' },
      { day: 'fri', band: 'evening' }, { day: 'sat', band: 'morning' },
    ],
    styleTags: ['powerlifting'], verification: 'peer',
    intro: '5/3/1 BBB 돌리는 중. 스쿼트 파트너 구해요.',
  },
  {
    id: 'u2', nickname: '벤치만삼년', sex: 'male', bodyWeight: 85,
    lifts: { basis: 'working', squat: 140, bench: 125, deadlift: 170 },
    gymId: 'g1',
    slots: [{ day: 'mon', band: 'evening' }, { day: 'thu', band: 'night' }],
    styleTags: ['bodybuilding', 'powerlifting'], verification: 'video',
    intro: '벤치 스팟 상시 가능. 고중량 환영.',
  },
  {
    id: 'u3', nickname: '새벽바벨', sex: 'female', bodyWeight: 58,
    lifts: { basis: 'working', squat: 90, bench: 50, deadlift: 110 },
    gymId: 'g1',
    slots: [{ day: 'tue', band: 'dawn' }, { day: 'thu', band: 'dawn' }, { day: 'sat', band: 'dawn' }],
    styleTags: ['powerlifting'], verification: 'peer',
    intro: '새벽 운동러. nSuns 5day 진행 중.',
  },
  {
    id: 'u4', nickname: '점심굴리기', sex: 'male', bodyWeight: 72,
    lifts: { basis: 'working', squat: 110, bench: 80, deadlift: 140 },
    gymId: 'g2',
    slots: [{ day: 'mon', band: 'lunch' }, { day: 'wed', band: 'lunch' }, { day: 'fri', band: 'lunch' }],
    styleTags: ['crossfit'], verification: 'unverified',
    intro: '직장인 점심 운동. 짧고 굵게.',
  },
  {
    id: 'u5', nickname: '득근득근', sex: 'female', bodyWeight: 62,
    lifts: { basis: 'working', squat: 85, bench: 45, deadlift: 105 },
    gymId: 'g1',
    slots: [{ day: 'mon', band: 'evening' }, { day: 'wed', band: 'evening' }],
    styleTags: ['bodybuilding'], verification: 'unverified',
    intro: '보디빌딩 위주, 하체 루틴 같이 하실 분.',
  },
  {
    id: 'u6', nickname: '데드리프터', sex: 'male', bodyWeight: 92,
    lifts: { basis: 'working', squat: 170, bench: 120, deadlift: 220 },
    gymId: 'g1',
    slots: [{ day: 'sat', band: 'morning' }, { day: 'sun', band: 'morning' }],
    styleTags: ['powerlifting'], verification: 'peer',
    intro: '주말 아침 롱세션. 대회 준비 중.',
  },
  {
    id: 'u7', nickname: '헬린이탈출', sex: 'male', bodyWeight: 68,
    lifts: { basis: 'working', squat: 80, bench: 60, deadlift: 100 },
    gymId: 'g2',
    slots: [{ day: 'tue', band: 'evening' }, { day: 'thu', band: 'evening' }],
    styleTags: ['bodybuilding'], verification: 'unverified',
    intro: '이제 6개월차. 배우면서 같이 크실 분!',
  },
  {
    id: 'u8', nickname: '무게의신', sex: 'female', bodyWeight: 55,
    lifts: { basis: 'working', squat: 100, bench: 55, deadlift: 125 },
    gymId: 'g3',
    slots: [{ day: 'mon', band: 'night' }, { day: 'wed', band: 'night' }],
    styleTags: ['powerlifting', 'crossfit'], verification: 'video',
    intro: '파워리프팅 2년차. 야간 운동 선호.',
  },
];

export const MOCK_SPOT_REQUESTS: SpotRequest[] = [
  {
    id: 's1', userId: 'u2', gymId: 'g1', exercise: '벤치프레스',
    targetWeight: 130, message: '5x3 마지막 세트 스팟 부탁드려요',
    expiresInMin: 20, createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
  },
  {
    id: 's2', userId: 'u6', gymId: 'g1', exercise: '스쿼트',
    targetWeight: 180, message: '워킹세트 3세트만',
    expiresInMin: 30, createdAt: new Date(Date.now() - 11 * 60000).toISOString(),
  },
  {
    id: 's3', userId: 'u4', gymId: 'g2', exercise: '벤치프레스',
    targetWeight: 90, expiresInMin: 15,
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
  },
];

export function gymById(id: string | undefined): Gym | undefined {
  return GYMS.find((g) => g.id === id);
}

export function userById(id: string): UserProfile | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
