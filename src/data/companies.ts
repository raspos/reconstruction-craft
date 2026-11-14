import { CompanyData } from '../types/game';

// 8개 가상 건설사 데이터 모델
// 실제 대형 건설사(삼성물산, 현대건설, 대우건설, GS건설, DL이앤씨, 포스코이앤씨, 롯데건설, HDC현대산업개발)의
// 시공능력평가 순위, 부채비율, 현금성 자산, 주택사업 비중, 브랜드 선호도를 가상화하여 게임 밸런스에 맞게 설계
// 건설사별 시공 캐파에 따른 집중 타깃 단지 차등화 시스템 반영

export const CONSTRUCTION_COMPANIES: CompanyData[] = [
  {
    id: 'taeseong',
    name: '태성건설',
    motto: '품질과 신뢰로 완성하는 최고급 명작',
    badge: '국내 브랜드 파워 1위 / 초우량 재무건전성',
    color: '#0284c7', // Sky Blue
    difficulty: 'EASY',
    realModelHint: '삼성물산 건설부문 모티브',
    flavorDescription: '국내 최고 수준의 신용도와 압도적인 브랜드 선호도를 자랑합니다. 무리한 출혈 경쟁을 지양하고 상징성 높은 대형 랜드마크 선별 수주를 원칙으로 합니다.',
    startingBudget: 330, // 330억원
    startingAP: 5,
    salesStaffCount: 95,
    personality: 'profit_conservative',
    attributes: {
      funds: 92,          // 자금력 최상
      credit: 95,         // 신용등급 AA+ 수준
      capa: 70000,        // 시공 캐파: 7조원
      brand: 92,          // 브랜드 선호도 최상위권
      finance: 80,
      salesOrg: 75,
      costComp: 74,
      riskTolerance: 35,  // 불법/위험 영업 회피
    },
    targetComplexIds: [1, 7, 13, 14], // 대형 랜드마크 및 13단지 선별 집중
    avoidedComplexIds: [4, 8, 15], // 소형 실속 단지는 브랜드 프리미엄 훼손 우려로 직접 입찰 배제
    targetFocusDescription: '1·7·14단지 랜드마크와 더불어, 래미안 브랜드 선호도가 탄탄한 13단지를 핵심 공략 단지로 선별합니다.',
  },
  {
    id: 'hangang',
    name: '한강건설',
    motto: '대한민국을 짓는 압도적 건설 명가',
    badge: '시공능력평가 1위 / 매머드 랜드마크 전문',
    color: '#16a34a', // Emerald Green
    difficulty: 'NORMAL',
    realModelHint: '현대건설 모티브',
    flavorDescription: '국내 최대 시공 캐파와 과감한 베팅력을 보유한 거인입니다. 상징성 높은 신시가지 최대어 랜드마크 수주에 사활을 걸며 과감한 제안을 던집니다.',
    startingBudget: 330, // 330억원 (밸런스 조정)
    startingAP: 5,
    salesStaffCount: 95,
    personality: 'landmark_obsessed',
    attributes: {
      funds: 88,
      credit: 88,
      capa: 72000,        // 시공 캐파: 7조 2천억원 (기존 9조원에서 하향)
      brand: 88,
      finance: 84,
      salesOrg: 82,
      costComp: 76,
      riskTolerance: 72,
    },
    targetComplexIds: [2, 7, 10, 14], // 신시가지 매머드 랜드마크 및 2단지 집중
    avoidedComplexIds: [6, 8, 11, 15], // 소형 실속 단지 기피
    targetFocusDescription: '2단지·7단지·14단지와 더불어 남부 핵심 거점으로 사전 정지작업을 마친 10단지(디에이치)를 정조준합니다.',
  },
  {
    id: 'daeryuk',
    name: '대륙건설',
    motto: '현장을 발로 뛰는 저돌적인 영업 승부사',
    badge: '최강의 현장 영업 기동력 / 돌파형 수주',
    color: '#dc2626', // Crimson Red
    difficulty: 'NORMAL',
    realModelHint: '대우건설 모티브',
    flavorDescription: '국내 최고 수준의 영업 기동력과 OS 요원 조직력을 갖추고 있습니다. 밀착 스킨십과 과감한 현장 프로모션으로 조합원 표심을 단숨에 끌어올립니다.',
    startingBudget: 310,
    startingAP: 6,
    salesStaffCount: 110,
    personality: 'aggressive_expansion',
    attributes: {
      funds: 80,
      credit: 78,
      capa: 62000,        // 시공 캐파: 6조 2천억원
      brand: 83,
      finance: 75,
      salesOrg: 94,       // 영업 조직력 최상
      costComp: 80,
      riskTolerance: 80,
    },
    targetComplexIds: [2, 5, 9, 13], // 사업성 높고 영업력으로 뒤집을 수 있는 중대형 사업장
    avoidedComplexIds: [14], // 14단지는 초대형 리스크로 단독 참여 기피
    targetFocusDescription: '2단지·5단지·9단지·13단지 등 현장 영업 기동력으로 표심을 뒤흔들 수 있는 중대형 단지를 주력 공략합니다.',
  },
  {
    id: 'mirae',
    name: '미래건설',
    motto: '공간의 미학을 창조하는 트렌드 리더',
    badge: '조합원 감성 자극 / 디자인·커뮤니티 특화',
    color: '#8b5cf6', // Purple
    difficulty: 'NORMAL',
    realModelHint: 'GS건설 모티브',
    flavorDescription: '주택 시장에서 가장 세련된 커뮤니티와 외관 특화 설계를 제안합니다. 고급화에 민감한 중상류층 거주 단지에서 압도적인 호감도를 자랑합니다.',
    startingBudget: 300,
    startingAP: 5,
    salesStaffCount: 90,
    personality: 'opportunist',
    attributes: {
      funds: 80,
      credit: 76,
      capa: 58000,
      brand: 89,          // 감성적 브랜드 인지도 높음
      finance: 78,
      salesOrg: 82,
      costComp: 76,
      riskTolerance: 65,
    },
    targetComplexIds: [1, 3, 12], // 주거환경 우수 및 12단지 금융 패키지 선점
    avoidedComplexIds: [10, 14], // 초대형 출혈 경쟁 단지 회피
    targetFocusDescription: '1단지·3단지(디자인 특화) 및 파격적인 이주비/금융 패키지로 표심을 선점한 12단지(자이)에 역량을 집중합니다.',
  },
  {
    id: 'jungwoo',
    name: '정우건설',
    motto: '한 푼의 낭비도 없는 철저한 원가경영',
    badge: '최고의 원가 경쟁력 / 무차입 수준 클린 재무',
    color: '#ea580c', // Orange
    difficulty: 'HARD',
    realModelHint: 'DL이앤씨 모티브',
    flavorDescription: '철저한 손익 중심 수주 전략과 독보적인 원가 관리력을 자랑합니다. 화려한 수주액보다 실제 회사가 쥐는 알짜배기 마진을 극대화하는 실속형 최강자입니다.',
    startingBudget: 290,
    startingAP: 5,
    salesStaffCount: 90,
    personality: 'profit_conservative',
    attributes: {
      funds: 85,
      credit: 88,
      capa: 54000,        // 시공 캐파: 5조 4천억원
      brand: 82,
      finance: 82,
      salesOrg: 72,
      costComp: 95,       // 원가 경쟁력 1위 (버프)
      riskTolerance: 40,
    },
    targetComplexIds: [5, 6, 8, 11], // 6단지 신통 급행 텃밭 및 실리파 알짜 단지
    avoidedComplexIds: [7, 14], // 외관 출혈 경쟁이 심하고 마진이 박한 매머드 단지 제외
    targetFocusDescription: '신속통합 단계부터 탄탄한 입지를 굳혀둔 6단지(아크로 특화) 및 5·8·11단지 등 알짜 실속 사업장에 집중합니다.',
  },
  {
    id: 'sewon',
    name: '세원건설',
    motto: '파격적인 금융 솔루션으로 조합의 부담 경감',
    badge: '최첨단 금융 공학 제안 / 탄탄한 자금줄',
    color: '#0891b2', // Cyan
    difficulty: 'NORMAL',
    realModelHint: '포스코이앤씨 모티브',
    flavorDescription: '모그룹의 금융 신인도를 등에 업고 LTV 100% 이주비 지원, 무이자 사업비 대여 등 공격적인 금융 패키지로 조합원들의 현실적인 고민을 파고듭니다.',
    startingBudget: 320,
    startingAP: 5,
    salesStaffCount: 95,
    personality: 'finance_fighter',
    attributes: {
      funds: 84,
      credit: 86,
      capa: 58000,
      brand: 85,
      finance: 96,        // 금융조건 제안 능력 1위 (버프)
      salesOrg: 80,
      costComp: 80,
      riskTolerance: 70,
    },
    targetComplexIds: [4, 11, 12, 15], // 이주비 및 사업비 대여 등 금융조건 민감 단지
    avoidedComplexIds: [14], // 초대형 단지 단독 참여 기피
    targetFocusDescription: '4단지·11단지·12단지·15단지 등 조합원 이주비와 금융 패키지를 최우선으로 평가하는 사업장에 화력을 쏟아붓습니다.',
  },
  {
    id: 'dongbang',
    name: '동방건설',
    motto: '쇼핑과 주거를 융합하는 도시 랜드마크 개발',
    badge: '대형 복합 개발 강자 / 집요한 라이벌 마킹',
    color: '#e11d48', // Rose
    difficulty: 'HARD',
    realModelHint: '롯데건설 모티브',
    flavorDescription: '복합 상업시설 개발 노하우와 집요한 영업력을 겸비했습니다. 특정 경쟁사가 우세한 단지를 집요하게 물고 늘어져 판도를 뒤흔드는 견제력이 뛰어납니다.',
    startingBudget: 270,
    startingAP: 5,
    salesStaffCount: 90,
    personality: 'blocker_rivalry',
    attributes: {
      funds: 78,
      credit: 75,
      capa: 48000,
      brand: 82,
      finance: 76,
      salesOrg: 80,
      costComp: 82,
      riskTolerance: 62,
    },
    targetComplexIds: [3, 9, 10], // 상업·교통 요충지 및 라이벌 격돌지
    avoidedComplexIds: [7, 14], // 캐파 한계로 3조원대 매머드 단지 입찰 제외
    targetFocusDescription: '3단지·9단지·10단지 등 복합 상업 인프라 가치와 라이벌 견제가 가능한 전략 단지에 집중합니다.',
  },
  {
    id: 'shinhwa',
    name: '신화건설',
    motto: '틈새를 공략하여 초과 수익을 창출하는 승부사',
    badge: '민첩한 틈새 단지 포식자 / 실속 알짜 수주',
    color: '#d97706', // Amber
    difficulty: 'EXPERT',
    realModelHint: 'HDC현대산업개발 모티브',
    flavorDescription: '대형사들의 시선이 덜 미치는 1조~1.7조원대 소형 알짜 단지나 15단지 같은 틈새 시장을 신속하게 선점하여 고수익을 달성합니다.',
    startingBudget: 260,
    startingAP: 5,
    salesStaffCount: 85,
    personality: 'small_medium_focus',
    attributes: {
      funds: 74,
      credit: 72,
      capa: 42000,        // 시공 캐파: 4조 2천억원
      brand: 78,
      finance: 74,
      salesOrg: 78,
      costComp: 88,       // 원가 경쟁력 우수 (버프)
      riskTolerance: 88,  // 위험 감내력 최고
    },
    targetComplexIds: [4, 8, 15], // 1조~1.7조원대 소형 알짜 틈새 단지 선점
    avoidedComplexIds: [1, 5, 7, 10, 14], // 2조원대 중후반 및 매머드 단지는 보증금/캐파 초과로 원천 배제
    targetFocusDescription: '4단지·8단지·15단지 등 1조원대 소형 알짜 단지를 기습 선점하며, 캐파를 초과하는 대형 단지는 원천 배제합니다.',
  },
];
