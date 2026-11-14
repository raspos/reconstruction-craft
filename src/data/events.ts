import { MarketEvent } from '../types/game';

// 매 턴 확률적으로 또는 특정 조건에 따라 발동되는 사건 & 위기 시스템
export const MARKET_EVENTS_POOL: Array<Omit<MarketEvent, 'id' | 'turn'>> = [
  {
    title: '글로벌 철강·레미콘 원자재 가격 급등',
    category: 'MACRO',
    description: '국제 원자재 공급망 불안으로 철근 및 시멘트 단가가 15% 이상 치솟았습니다. 모든 현장의 예상 원가 부담이 가중됩니다.',
    effectDescription: '모든 단지의 향후 예상 영업이익률이 0.5%p 일괄 하락합니다.',
    effect: {
      materialCostDelta: -0.5,
    },
  },
  {
    title: '한국은행 기준금리 0.50%p 빅스텝 인상',
    category: 'MACRO',
    description: '물가 안정을 위한 전격적인 기준금리 인상으로 PF 대출 및 이주비 대출 금리가 급격히 뛰어올랐습니다.',
    effectDescription: '금융조건 개선에 소모되는 금융비용이 증가하여, 관련 제안 시 추가 마진 감소가 발생합니다.',
    effect: {
      interestRateDelta: 0.5,
    },
  },
  {
    title: '금융당국, 재건축 이주비 LTV 대출 규제 강화',
    category: 'REGULATORY',
    description: '가계부채 억제를 위해 재건축 사업장 이주비 대출 한도를 강력히 축소하는 행정지도가 내려졌습니다.',
    effectDescription: '금융 민감도가 높은 단지(2, 12, 15단지) 조합원들의 불안감이 가중되어 금융 공약의 가치가 더욱 커집니다.',
    effect: {
      regulationLtvDelta: -10,
    },
  },
  {
    title: '서울시 도시계획위원회, 가온 6단지 신속통합기획 패스트트랙 통과',
    category: 'COMPLEX',
    description: '가온 6단지의 정비계획 심의가 일사천리로 통과되어 시공사 입찰 및 총회 일정이 1개월 단축되었습니다!',
    effectDescription: '가온 6단지의 수주전 단계가 즉시 다음 단계로 앞당겨집니다.',
    relatedComplexId: 6,
    effect: {
      advanceTurns: 1,
    },
  },
  {
    title: '가온 9단지 비대위 기습 총회 소집 및 조합장 해임 가결',
    category: 'COMPLEX',
    description: '가온 9단지 내부 갈등이 폭발하여 기존 조합 집행부가 전원 해임되었습니다. 모든 건설사의 집행부 영업이 원점으로 돌아갑니다.',
    effectDescription: '가온 9단지의 집행부 지지율이 초기화되고 일정이 1개월 지연됩니다.',
    relatedComplexId: 9,
    effect: {
      delayTurns: 1,
    },
  },
  {
    title: '경쟁사 부실시공 논란으로 신용평가사 신용등급 전격 강등',
    category: 'SCANDAL',
    description: '지방 현장 균열 사태 여파로 한 경쟁사의 회사채 신용등급이 강등되며 유동성 위기설이 확산됩니다.',
    effectDescription: '해당 경쟁사의 모든 단지 지지율이 12%p 급락하고 수주 캐파가 위축됩니다.',
    effect: {
      reputationHitAmount: 15,
    },
  },
  {
    title: '가온 7단지 역세권 복합환승센터 개발 호재 발표',
    category: 'COMPLEX',
    description: '가온 7단지 인근에 대규모 복합환승센터와 복합몰 건립이 확정되면서 조합원들의 프리미엄 브랜드 요구가 극에 달했습니다.',
    effectDescription: '가온 7단지의 브랜드 파워 반영 가중치가 20% 증가합니다.',
    relatedComplexId: 7,
    effect: {},
  },
  {
    title: '국토교통부·경찰청, 재건축 시공사 불법 로비 전면 합동 단속',
    category: 'REGULATORY',
    description: '수주 과열을 막기 위해 특별 단속반이 가온 신시가지 전역에 암행 투입되었습니다.',
    effectDescription: '향후 3턴 동안 모든 위험 영업의 적발 확률이 2배로 폭증합니다.',
    effect: {},
  },
  {
    title: '수도권 아파트 분양가 신고가 행진 및 재건축 열풍',
    category: 'MACRO',
    description: '신축 아파트 청약 경쟁률이 수백 대 일을 기록하며 재건축 단지 일반분양 완판 기대감이 최고조에 달했습니다.',
    effectDescription: '모든 단지의 사업성이 개선되어 기본 예상 영업이익률이 0.4%p 상승합니다.',
    effect: {
      materialCostDelta: 0.4,
    },
  },
  {
    title: '본사 불시 내부감사 착수: 영업비 및 접대비 실사',
    category: 'SCANDAL',
    description: '본사 감사실에서 주택사업영업본부의 법인카드 및 비공식 홍보비 집행 내역을 현장 전수조사합니다.',
    effectDescription: '위험 영업을 진행했던 경우 CFO 신뢰도가 대폭 깎이고 과징금성 예산 차감이 발생합니다.',
    effect: {},
  },
];
