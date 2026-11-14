export type ScheduleMasterplanId = 'STANDARD' | 'FAST_TRACK' | 'LANDMARK_CLIMAX';

export interface ScheduleMasterplan {
  id: ScheduleMasterplanId;
  name: string;
  badge: string;
  description: string;
  strategyHint: string;
  startTurns: Record<number, number>; // complexId -> startTurn (1~24)
}

export const SCHEDULE_MASTERPLANS: ScheduleMasterplan[] = [
  {
    id: 'STANDARD',
    name: '표준 순차 분산 플랜',
    badge: '정석 정비계획 (권장)',
    description: '서울시 가온 신시가지 마스터플랜에 따라 15개 단지가 2년에 걸쳐 3~4개씩 고르게 순차 입찰을 진행합니다.',
    strategyHint: '초반 소형 단지부터 후반 초대형 단지까지 점진적으로 자금을 축적하며 안정적으로 수주를 늘려갈 수 있습니다.',
    startTurns: {
      1: 1,  // 1단지: 1턴 시작 -> 5턴 선정
      6: 1,  // 6단지: 1턴 시작 -> 5턴 선정
      4: 2,  // 4단지: 2턴 시작 -> 6턴 선정
      8: 2,  // 8단지: 2턴 시작 -> 6턴 선정
      2: 3,  // 2단지: 3턴 시작 -> 7턴 선정
      15: 3, // 15단지: 3턴 시작 -> 7턴 선정
      5: 4,  // 5단지: 4턴 시작 -> 8턴 선정
      11: 4, // 11단지: 4턴 시작 -> 8턴 선정
      7: 5,  // 7단지: 5턴 시작 -> 9턴 선정 (중심부)
      3: 6,  // 3단지: 6턴 시작 -> 10턴 선정
      12: 6, // 12단지: 6턴 시작 -> 10턴 선정
      10: 7, // 10단지: 7턴 시작 -> 11턴 선정
      9: 8,  // 9단지: 8턴 시작 -> 12턴 선정
      13: 9, // 13단지: 9턴 시작 -> 13턴 선정
      14: 10,// 14단지: 10턴 시작 -> 14턴 선정 (최대 랜드마크)
    },
  },
  {
    id: 'FAST_TRACK',
    name: '신통기획 조기 집중 플랜',
    badge: '속전속결 패스트트랙',
    description: '서울시 신속통합기획 패스트트랙 조치로 알짜 실속 단지들이 1~6턴 전반부에 대거 동시 수주전에 돌입합니다.',
    strategyHint: '초반에 영업예산과 AP를 총동원하여 알짜 단지들을 선점하지 못하면 순식간에 경쟁사들에게 밀릴 수 있습니다.',
    startTurns: {
      1: 1, 4: 1, 6: 1, 8: 1, 15: 1,
      2: 2, 5: 2, 11: 3, 12: 3,
      3: 4, 7: 5, 10: 6, 9: 7, 13: 8, 14: 9,
    },
  },
  {
    id: 'LANDMARK_CLIMAX',
    name: '랜드마크 후반 대격돌 플랜',
    badge: '대형사 빅매치',
    description: '초반에는 중소형 실속 단지들이 진행되며, 후반부(8턴 이후)에 5단지, 7단지, 10단지, 14단지 등 매머드급 사업장이 동시에 격돌합니다.',
    strategyHint: '초반에는 캐파를 아끼고 자금을 축적한 뒤, 후반부 초대형 랜드마크 수주전에 모든 화력을 쏟아부어야 합니다.',
    startTurns: {
      4: 1, 6: 1, 8: 1, 11: 1, 15: 2,
      1: 3, 2: 3, 3: 4, 12: 5,
      5: 7, 7: 8, 10: 8, 9: 9, 13: 9, 14: 10,
    },
  },
];

// 턴 번호를 연/월 날짜 문자열로 변환 (2026년 3월 기준)
export function turnToYearMonth(turn: number): string {
  const startYear = 2026;
  const startMonth = 3;
  const totalMonths = turn - 1;
  const year = startYear + Math.floor((startMonth + totalMonths - 1) / 12);
  const month = ((startMonth + totalMonths - 1) % 12) + 1;
  return `${year}년 ${month}월`;
}

// 각 단지의 예상 총회 선정 턴 계산 (시작 턴 + 4개월)
export function getEstimatedSelectionTurn(startTurn: number): number {
  return startTurn + 4;
}
