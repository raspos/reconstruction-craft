// Game Types for RECONSTRUCTION CRAFT (재건축 크래프트: 시공사 수주전쟁)

export type ComplexStage =
  | 'interest'     // 관심 단계
  | 'pre_sales'    // 사전 영업 (홍보)
  | 'bidding_prep' // 입찰 준비 (현장설명회/공고)
  | 'bidding'      // 입찰 진행
  | 'selection'    // 시공사 선정 총회 투표
  | 'contracted';  // 계약 완료

export interface ComplexData {
  id: number;              // 1 ~ 15
  name: string;            // '가온 1단지' ~ '가온 15단지'
  originalUnits: number;   // 기존 가구 수
  plannedUnits: number;    // 재건축 계획 가구 수
  expectedCost: number;    // 예상 공사비 (단위: 억원, 예: 25000 = 2조 5000억원)
  baseExpectedProfitMargin: number; // 기본 예상 영업이익률 (%) 예: 4.5%
  riskLevel: 'LOW' | 'MID' | 'HIGH' | 'EXTREME'; // 사업 위험도
  startTurn: number;       // 수주전 본격 진입 턴 (1~24)
  stage: ComplexStage;
  tagline: string;         // 성격 요약
  description: string;     // 상세 설명
  dataSource: string;      // 실제 참고 자료 출처
  sourceDate: string;      // 자료 기준일

  // 조합원 성향 가중치 (총합 100 기준)
  sentimentProfile: {
    brandWeight: number;      // 브랜드 선호도 (0~100)
    costSensitivity: number;  // 공사비 민감도 (저가 선호)
    financeWeight: number;    // 금융조건 민감도 (이주비, 대출 등)
    speedPreference: number;  // 사업 속도 선호도
    executiveInfluence: number; // 집행부 영향력 (vs 일반 조합원)
    oppositionPower: number;  // 비대위/반대파 강도
  };

  // 3D 맵 배치 좌표 및 형태
  mapPos: {
    x: number;
    z: number;
    buildingCount: number;
    avgFloors: number;
    colorScheme?: string;
  };
}

export interface CompanyAttributes {
  funds: number;          // 자금력 (0~100)
  credit: number;         // 신용도 (0~100)
  capa: number;           // 시공 여력 (최대 동시 수주 감당액 단위: 억원, 예: 70000 = 7조원)
  brand: number;          // 브랜드 파워 (0~100)
  finance: number;        // 금융조건 제안 능력 (0~100)
  salesOrg: number;       // 영업 조직력 (0~100) -> 매 턴 행동력(AP) 산출에 영향
  costComp: number;       // 원가 경쟁력 (0~100) -> 마진 방어율
  riskTolerance: number;  // 위험 감내 능력 (0~100)
}

export type AIAggressionType =
  | 'aggressive_expansion'  // 공격적 수주 확대형
  | 'profit_conservative'   // 수익성 중심 보수형
  | 'landmark_obsessed'     // 랜드마크 집착형
  | 'finance_fighter'       // 금융조건 경쟁형
  | 'small_medium_focus'    // 중소형 단지 집중형
  | 'blocker_rivalry'       // 경쟁사 견제형
  | 'opportunist'           // 기회주의적 진입형
  | 'stable_manager';       // 안정적 실적 관리형

export interface CompanyData {
  id: string;               // 'taeseong', 'hangang', etc.
  name: string;             // '태성건설', '한강건설'
  motto: string;
  badge: string;            // '래미안'급 하이엔드 등 가상 수식
  color: string;            // 테마 컬러
  attributes: CompanyAttributes;
  startingBudget: number;   // 초기 가용 영업예산 (억원)
  startingAP: number;       // 기본 매 턴 행동력
  personality: AIAggressionType;
  realModelHint: string;    // 내부 개발용 모티브 (실제 UI 미표시)
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT';
  flavorDescription: string;
}

export type ActionCategory = 'LEGAL' | 'RISKY';

export interface SalesAction {
  id: string;
  name: string;
  category: ActionCategory;
  apCost: number;
  budgetCost: number;       // 억원
  targetStages: ComplexStage[];
  description: string;
  pros: string;
  cons: string;
  riskChance: number;       // 위험 적발 확률 (0~1)
  riskPenaltyDesc?: string;
  effect: {
    favorabilityBoost?: number;   // 조합원 호감도 변화
    brandImpression?: number;     // 브랜드 각인도 변화
    costImpression?: number;      // 공사비 호감도 변화
    financeImpression?: number;   // 금융조건 호감도 변화
    marginDelta?: number;         // 예상 마진 변화 (예: -0.5%p)
    executiveTrust?: number;      // 집행부 지지율 변화
    oppositionRevolt?: number;    // 비대위 반발 확률
    intelGain?: boolean;          // 정보 획득 여부
  };
}

export interface ComplexBiddingState {
  complexId: number;
  currentStage: ComplexStage;
  monthsInStage: number;

  // 각 회사의 호감도/지지율 세부 (0~100)
  supportScores: Record<string, {
    generalSupport: number;     // 일반 조합원 지지 (0~100)
    execSupport: number;        // 집행부 지지 (0~100)
    brandPerception: number;    // 브랜드 인식 (0~100)
    costOfferedMarginDelta: number; // 제시한 공사비 변동 (%p)
    financeOffered: number;     // 금융조건 점수 (0~100)
    trustScore: number;         // 신뢰도 (0~100)
    hasBid: boolean;            // 공식 입찰서 제출 여부
    isWithdrawn: boolean;       // 철수 여부
    totalFavorability: number;  // 종합 예상 지지율 (0~100)
  }>;

  // 선정 결과
  winnerId: string | null;     // 수주 성공 건설사 ID
  isSoleBid: boolean;          // 단독 입찰 여부
  isRebid: boolean;            // 유찰 후 재입찰 진행 중인지
  negotiatedContract: boolean; // 수의계약 여부
  contractPrice: number;       // 최종 계약 공사비 (억원)
  finalProfitMargin: number;   // 최종 예상 영업이익률 (%)
}

export interface IndustryRumor {
  id: string;
  turn: number;
  headline: string;
  detail: string;
  relatedComplexId?: number;
  relatedCompanyId?: string;
  isTrue: boolean;            // 진실 여부
  truthRate: number;          // 정보 정확도 (0~100%)
  investigated: boolean;      // 플레이어가 확인했는지
  rumorType: 'WITHDRAWAL' | 'PRICE_CUT' | 'SCHEDULE_CHANGE' | 'EXECUTIVE_CRISIS' | 'BRAND_DEMAND' | 'FINANCE_WAR';
}

export interface MarketEvent {
  id: string;
  turn: number;
  title: string;
  category: 'MACRO' | 'COMPLEX' | 'REGULATORY' | 'SCANDAL';
  description: string;
  effectDescription: string;
  relatedComplexId?: number;
  relatedCompanyId?: string;
  effect: {
    interestRateDelta?: number;    // 금리 변동 (%p)
    materialCostDelta?: number;    // 원자재가 변동 (%p 마진 영향)
    regulationLtvDelta?: number;   // 대출 규제 영향
    delayTurns?: number;           // 특정 단지 일정 지연
    advanceTurns?: number;         // 특정 단지 일정 단축
    reputationHitCompanyId?: string;
    reputationHitAmount?: number;
  };
}

export interface PlayerTarget {
  targetVolume: number;       // 수주 목표액 (억원, 예: 80000 = 8조원)
  targetLabel: string;        // '안전한 목표 (3조)', '도전적 목표 (5조)', '공격적 목표 (8조)', '무모한 목표 (12조)'
  riskMultiplier: number;
}

export interface GameEnding {
  id: string;
  title: string;
  subtitle: string;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  badgeColor: string;
  headline: string;
  story: string;
  ceoVerdict: string;
  cfoVerdict: string;
  shareMessage: string;
}

export interface GameState {
  gameMode: 'FULL_24' | 'FAST_12';
  totalTurns: number;
  currentTurn: number;        // 1 ~ 24 (or 12)
  isGameOver: boolean;
  selectedEnding: GameEnding | null;

  // 플레이어 상태
  playerCompanyId: string;
  playerTarget: PlayerTarget;
  availableAP: number;
  maxAP: number;
  budget: number;             // 남은 영업 예산 (억원)
  usedCapa: number;           // 사용 중인 시공 캐파 (억원)
  maxCapa: number;            // 최대 시공 캐파 (억원)
  ceoTrust: number;           // 경영진(사장) 신뢰도 (0~100)
  cfoTrust: number;           // CFO 신뢰도 (0~100)
  companyReputation: number;  // 회사 평판 (0~100)
  legalRisk: number;          // 법적/적발 위험도 (0~100)
  totalSalesCostSpent: number;// 누적 지출 영업비 (억원)

  // 단지 상태
  complexStates: Record<number, ComplexBiddingState>;

  // AI 경쟁사 상태
  competitorStates: Record<string, {
    usedCapa: number;
    wonComplexIds: number[];
    totalWonVolume: number;
    budget: number;
    reputation: number;
    strategyMemory: {
      playerPriceCutObserved: number;
      playerAggressionObserved: number;
      preferredComplexTypes: string[];
    };
  }>;

  // 소문 & 이벤트
  rumors: IndustryRumor[];
  eventsHistory: MarketEvent[];
  lastTurnEvents: MarketEvent[];
  turnLogs: Array<{
    turn: number;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  }>;

  // 턴 행동 기록 (현재 턴)
  actionsTakenThisTurn: Array<{
    complexId: number;
    actionId: string;
    timestamp: number;
  }>;
}
