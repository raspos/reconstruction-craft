import { CompanyData } from '../types/game';

// 8개 가상 건설사 데이터 모델
// 실제 대형 건설사(삼성물산, 현대건설, 대우건설, GS건설, DL이앤씨, 포스코이앤씨, 롯데건설, HDC현대산업개발)의
// 시공능력평가 순위, 부채비율, 현금성 자산, 주택사업 비중, 브랜드 선호도를 가상화하여 게임 밸런스에 맞게 설계
// (실제 회사명과 게임 회사의 연결고리는 개발 및 학술적 참고용으로만 유지)

export const CONSTRUCTION_COMPANIES: CompanyData[] = [
  {
    id: 'taeseong',
    name: '태성건설',
    motto: '품질과 신뢰로 완성하는 최고급 명작',
    badge: '국내 브랜드 파워 1위 / 초우량 재무건전성',
    color: '#0284c7', // Sky Blue
    difficulty: 'EASY',
    realModelHint: '삼성물산 건설부문 모티브',
    flavorDescription: '국내 최고 수준의 신용도와 압도적인 브랜드 선호도를 자랑합니다. 무리한 출혈 경쟁을 지양하고 선별 수주를 원칙으로 하여, 조합원들의 자연스러운 지지를 이끌어냅니다.',
    startingBudget: 350, // 350억원
    startingAP: 5,
    salesStaffCount: 100,
    personality: 'profit_conservative',
    attributes: {
      funds: 95,          // 자금력 최상
      credit: 95,         // 신용등급 AA+ 수준
      capa: 75000,        // 시공 캐파: 7조 5천억원
      brand: 96,          // 브랜드 선호도 1위
      finance: 80,
      salesOrg: 74,
      costComp: 72,
      riskTolerance: 35,  // 불법/위험 영업 회피
    },
  },
  {
    id: 'hangang',
    name: '한강건설',
    motto: '대한민국을 짓는 압도적 건설 명가',
    badge: '시공능력평가 부동의 1위 / 거대 캐파',
    color: '#16a34a', // Emerald Green
    difficulty: 'NORMAL',
    realModelHint: '현대건설 모티브',
    flavorDescription: '국내 최대 시공 캐파와 강력한 자금 동원력을 보유한 거인입니다. 상징성 높은 대형 랜드마크 수주에 사활을 걸며, 과감한 베팅으로 경쟁사를 압도합니다.',
    startingBudget: 400, // 400억원
    startingAP: 6,
    salesStaffCount: 110,
    personality: 'landmark_obsessed',
    attributes: {
      funds: 92,
      credit: 90,
      capa: 90000,        // 시공 캐파: 9조원 (최대)
      brand: 92,
      finance: 85,
      salesOrg: 84,
      costComp: 78,
      riskTolerance: 72,
    },
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
    startingBudget: 320,
    startingAP: 6,
    salesStaffCount: 120,
    personality: 'aggressive_expansion',
    attributes: {
      funds: 78,
      credit: 78,
      capa: 65000,        // 시공 캐파: 6조 5천억원
      brand: 83,
      finance: 75,
      salesOrg: 95,       // 영업 조직력 최상
      costComp: 80,
      riskTolerance: 80,
    },
  },
  {
    id: 'mirae',
    name: '미래건설',
    motto: '공간의 미학을 창조하는 트렌드 리더',
    badge: '조합원 감성 자극 / 디자인·커뮤니티 특화',
    color: '#8b5cf6', // Purple
    difficulty: 'NORMAL',
    realModelHint: 'GS건설 모티브',
    flavorDescription: '주택 시장에서 가장 세련된 커뮤니티와 외관 특화 설계를 제안합니다. 고급화에 민감한 중상류층 조합원들의 지지를 확보하는 데 최적화되어 있습니다.',
    startingBudget: 310,
    startingAP: 5,
    salesStaffCount: 100,
    personality: 'opportunist',
    attributes: {
      funds: 80,
      credit: 75,
      capa: 65000,
      brand: 89,          // 감성적 브랜드 인지도 높음
      finance: 78,
      salesOrg: 82,
      costComp: 72,
      riskTolerance: 65,
    },
  },
  {
    id: 'jungwoo',
    name: '정우건설',
    motto: '한 푼의 낭비도 없는 철저한 원가경영',
    badge: '최고의 원가 경쟁력 / 무차입 수준 클린 재무',
    color: '#ea580c', // Orange
    difficulty: 'HARD',
    realModelHint: 'DL이앤씨 모티브',
    flavorDescription: '철저한 손익 중심 수주 전략과 독보적인 원가 관리력을 자랑합니다. 화려한 수주액보다 실제 회사가 쥐는 알짜배기 마진을 극대화하는 실속형 강자입니다.',
    startingBudget: 280,
    startingAP: 5,
    salesStaffCount: 90,
    personality: 'profit_conservative',
    attributes: {
      funds: 85,
      credit: 88,
      capa: 55000,        // 시공 캐파: 5조 5천억원
      brand: 80,
      finance: 80,
      salesOrg: 70,
      costComp: 92,       // 원가 경쟁력 1위
      riskTolerance: 40,
    },
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
    startingBudget: 330,
    startingAP: 5,
    salesStaffCount: 95,
    personality: 'finance_fighter',
    attributes: {
      funds: 84,
      credit: 86,
      capa: 62000,
      brand: 84,
      finance: 94,        // 금융조건 제안 능력 1위
      salesOrg: 80,
      costComp: 80,
      riskTolerance: 70,
    },
  },
  {
    id: 'dongbang',
    name: '동방건설',
    motto: '쇼핑과 주거를 융합하는 도시 랜드마크 개발',
    badge: '대형 복합 개발 강자 / 집요한 라이벌 마킹',
    color: '#e11d48', // Rose
    difficulty: 'HARD',
    realModelHint: '롯데건설 모티브',
    flavorDescription: '복합 상업시설 개발 노하우와 공격적인 영업을 겸비했습니다. 특정 경쟁사가 우세한 단지를 집요하게 물고 늘어져 판도를 뒤흔드는 견제력이 뛰어납니다.',
    startingBudget: 260,
    startingAP: 5,
    salesStaffCount: 90,
    personality: 'blocker_rivalry',
    attributes: {
      funds: 76,
      credit: 72,
      capa: 50000,
      brand: 78,
      finance: 76,
      salesOrg: 78,
      costComp: 76,
      riskTolerance: 62,
    },
  },
  {
    id: 'shinhwa',
    name: '신화건설',
    motto: '틈새를 공략하여 초과 수익을 창출하는 승부사',
    badge: '민첩한 틈새 단지 포식자 / 고위험 고수익',
    color: '#d97706', // Amber
    difficulty: 'EXPERT',
    realModelHint: 'HDC현대산업개발 모티브',
    flavorDescription: '대형사들의 경쟁이 치열하지 않은 중형 알짜 단지나 15단지 같은 틈새 시장을 신속하게 선점합니다. 리스크를 두려워하지 않고 높은 이익률을 집요하게 추구합니다.',
    startingBudget: 240,
    startingAP: 5,
    salesStaffCount: 85,
    personality: 'small_medium_focus',
    attributes: {
      funds: 70,
      credit: 68,
      capa: 45000,        // 시공 캐파: 4조 5천억원
      brand: 72,
      finance: 70,
      salesOrg: 76,
      costComp: 84,
      riskTolerance: 88,  // 위험 감내력 최고
    },
  },
];
