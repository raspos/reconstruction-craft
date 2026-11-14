// Game Types for RECONSTRUCTION CRAFT (재건축 크래프트: 시공사 수주전쟁) - 고도화 버전 2.0

export type ComplexStage =
  | 'interest'     // 관심 단계
  | 'pre_sales'    // 사전 영업 (홍보)
  | 'bidding_prep' // 입찰 준비 (현장설명회/공고)
  | 'bidding'      // 입찰 진행
  | 'selection'    // 시공사 선정 총회 투표
  | 'contracted';  // 계약 완료

// 조합 AI 성향 유형
export type UnionPersonality =
  | 'brand_centric'         // 브랜드 중시형 (하이엔드 브랜드 우선)
  | 'pragmatic_profit'      // 실리 추구형 (공사비·분담금 최우선)
  | 'competition_driver'    // 경쟁 유도형 (특정사 독점 방지, 건설사 간 피 터지는 경쟁 유도)
  | 'fast_track'            // 빠른 사업 추진형 (공기 단축 및 인허가 신속 처리)
  | 'internal_feud'         // 내부 갈등형 (집행부 vs 비대위 대립 심화, 변수 다발)
  | 'conservative'          // 보수적 의사결정형 (안정적 대형사 및 검증된 실적 선호)
  | 'hard_bargainer'        // 강경 협상형 (건설사 압박 및 파격 조건 요구)
  | 'pragmatic_compromise'; // 실용적 타협형 (원만한 조율과 적정 마진 인정)

// 조합 전략 행동
export interface UnionStrategicAction {
  turn: number;
  type:
    | 'ENCOURAGE_COMPETITOR'  // 경쟁사 추가 참여 독려
    | 'DEMAND_PRICE_CUT'      // 공사비 추가 인하 공식 요구
    | 'DEMAND_FINANCE_UPGRADE'// 이주비·금융조건 개선 요구
    | 'STRENGTHEN_DESIGN'     // 외관·설계 특화 지침 하달
    | 'SCHEDULE_CHANGE'       // 입찰 총회 일정 변경 (단축/지연)
    | 'PUBLIC_WARNING';       // 특정 제안에 대한 공개 우려 표명
  title: string;
  message: string;
  targetCompanyId?: string;
  effectDescription: string;
}

// 조합원 3대 유권자 계층 비율
export interface VoterSegments {
  brandLoyalistRatio: number; // 브랜드 충성파 비율 (%)
  pragmatistRatio: number;    // 실리파 비율 (%)
  floatingVoterRatio: number; // 부동층 비율 (%)
}

// 입찰 제안서 구성 선택지
export interface BidProposal {
  brandTier: 'STANDARD' | 'PREMIUM' | 'HIGH_END';
  ceilingHeight: 2.5 | 2.6 | 2.7; // 천장고 (m)
  facade: 'STANDARD' | 'CURTAIN_WALL' | 'SPECIALIZED' | 'LANDMARK'; // 외관
  community: 'BASIC' | 'PREMIUM' | 'SUPER_LUXURY'; // 커뮤니티 시설
  landscaping: 'BASIC' | 'PREMIUM' | 'THEMED'; // 조경
  parking: 'BASIC' | 'EXTENDED' | 'SMART'; // 주차장
  costDiscount: 'NONE' | 'SMALL' | 'AGGRESSIVE' | 'DUMPING'; // 공사비 할인폭 (0%, -3%, -7%, -12%)
  financePackage: 'STANDARD' | 'PREFERENTIAL' | 'RADICAL_LTV'; // 금융조건
  scheduleMonths: 'STANDARD' | 'MINUS_4' | 'MINUS_8'; // 공기 단축
  escalationRisk: 'STANDARD' | 'PARTIAL_RISK' | 'FULL_BUILDER_RISK'; // 물가 변동 위험 부담
  architectTier: 'BASIC' | 'FAMOUS' | 'GLOBAL_TOP'; // 설계 특화
}

// 단지별 입찰 규정 및 컨소시엄
export interface ComplexBiddingRules {
  consortiumAllowed: boolean;    // 컨소시엄 허용 여부
  bidDepositAmount: number;      // 입찰 보증금 (억원)
  proposalPrepCost: number;      // 제안서 실비 (소멸 비용, 억원)
  mandatoryDesignItem?: string;  // 필수 설계 요구사항
}

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

  // 조합 AI 특성
  unionPersonality: UnionPersonality;
  voterSegments: VoterSegments;
  biddingRules: ComplexBiddingRules;

  // 단지 간 연계 그래프 (인접 단지 ID 목록)
  adjacentComplexIds: number[];

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
  salesOrg: number;       // 영업 조직력 (0~100) -> 매 턴 행동력(AP) 및 영업 인력 산출
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
  badge: string;
  color: string;
  attributes: CompanyAttributes;
  startingBudget: number;   // 초기 가용 영업예산 (억원)
  startingAP: number;       // 기본 매 턴 행동력
  salesStaffCount: number;  // 보유 영업 인력 (명, 기본 100명)
  personality: AIAggressionType;
  realModelHint: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT';
  flavorDescription: string;
  targetComplexIds: number[];       // 캐파 및 전략에 맞춘 집중 공략 단지 (2~4곳)
  avoidedComplexIds?: number[];     // 캐파 초과 또는 리스크로 입찰 배제/기피 단지
  targetFocusDescription: string;   // 타깃 단지 선정 전략 설명
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
    favorabilityBoost?: number;
    brandImpression?: number;
    costImpression?: number;
    financeImpression?: number;
    marginDelta?: number;
    executiveTrust?: number;
    oppositionRevolt?: number;
    intelGain?: boolean;
    prFatigueIncrease?: number; // 홍보 피로도 증가량
  };
}

// 경쟁사의 관찰 가능한 행동 목록
export interface ObservableCompetitorAction {
  type:
    | 'BANNER_AD'         // 현수막 / 엘리베이터 광고
    | 'SHOWROOM_OPEN'     // 브랜드 홍보관 개관
    | 'STAFF_DEPLOY'      // 현장 영업팀 투입
    | 'CEO_VISIT'         // 대표이사 현장 전격 방문
    | 'SPECIAL_DESIGN'    // 대안설계 준비
    | 'ATTEND_BRIEFING'   // 현장설명회 참석 (입찰 확정 아님!)
    | 'SUBMIT_BID';       // 실제 입찰서 제출
  turn: number;
  description: string;
  sincerityWeight: number; // 실제 입찰과의 상관계수 (0.1 ~ 0.95)
}

// 경쟁사의 단지별 추정 및 숨겨진 의사결정 상태
export interface CompetitorComplexStance {
  hiddenBidIntent: number; // 숨겨진 실제 입찰 의지 (0~100)
  observableActions: ObservableCompetitorAction[];
  estimatedBidChance: number; // 플레이어에게 노출되는 추정 입찰 확률 (%)
  intelReliability: 'LOW' | 'MID' | 'HIGH'; // 정보 신뢰도
  isWithdrawn: boolean;
  hasBid: boolean;
  totalFavorability: number;
  brandPerception: number;
  costOfferedMarginDelta: number;
  financeOffered: number;
  execSupport: number;
  trustScore: number;
}

export interface ComplexBiddingState {
  complexId: number;
  currentStage: ComplexStage;
  monthsInStage: number;

  // 홍보 피로도 (0~100): 과도한 홍보 시 주민 반발 발생
  prFatigue: number;

  // 조합 AI 상태 및 최근 전략 발표
  unionActions: UnionStrategicAction[];
  recentUnionMessage?: string;

  // 각 회사의 호감도 및 입찰 진정성 상태
  supportScores: Record<string, CompetitorComplexStance>;

  // 플레이어의 맞춤형 입찰 제안서
  playerProposal?: BidProposal;

  // 컨소시엄 구성 파트너 ID (있을 경우)
  consortiumPartnerId?: string | null;

  // 선정 결과
  winnerId: string | null;
  winnerIsConsortium?: boolean;
  isSoleBid: boolean;
  isRebid: boolean;
  negotiatedContract: boolean;
  contractPrice: number;
  finalProfitMargin: number;

  // 사후 계약 이행 위험 관리 (계약 완료 후 이벤트)
  contractFulfillment?: {
    originalAgreedMargin: number;
    currentExpectedMargin: number;
    delayMonths: number;
    unresolvedDisputes: number;
  };
}

// 가상 커뮤니티 (가온 신시가지 소통방) 게시글
export interface CommunityPost {
  id: string;
  complexId?: number;
  authorNickname: string;
  authorBadge: '조합원' | '대의원' | '동대표' | '부동산소장' | '익명주민';
  voterGroup: 'BRAND' | 'PRAGMATIC' | 'FLOATING';
  content: string;
  turn: number;
  isVocalMinority: boolean; // 목소리 큰 소수 의견 여부 (실제 표심과 괴리)
  likes: number;
}

// 외부 수주전 (경쟁사 캐파 분산용)
export interface ExternalMarketProject {
  id: string;
  name: string;
  scaleVolume: number; // 억원
  competitorWinnerId?: string;
  description: string;
  turnResolved: number;
}

export interface IndustryRumor {
  id: string;
  turn: number;
  headline: string;
  detail: string;
  relatedComplexId?: number;
  relatedCompanyId?: string;
  isTrue: boolean;
  truthRate: number;
  investigated: boolean;
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
    interestRateDelta?: number;
    materialCostDelta?: number;
    regulationLtvDelta?: number;
    delayTurns?: number;
    advanceTurns?: number;
    reputationHitCompanyId?: string;
    reputationHitAmount?: number;
  };
}

export interface PlayerTarget {
  targetVolume: number;
  targetLabel: string;
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
  gameMode: 'STANDARD_18' | 'FAST_12';
  totalTurns: number;
  currentTurn: number;
  isGameOver: boolean;
  selectedEnding: GameEnding | null;

  // 플레이어 상태
  playerCompanyId: string;
  playerTarget: PlayerTarget;
  availableAP: number;
  maxAP: number;
  budget: number;
  usedCapa: number;
  maxCapa: number;
  ceoTrust: number;
  cfoTrust: number;
  companyReputation: number;
  legalRisk: number;
  totalSalesCostSpent: number;

  // 영업 캐파 및 인력 배분 시스템 (총 100명)
  totalSalesStaff: number;
  staffAllocation: Record<number, number>; // complexId -> 투입 인원 수

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

  // 가상 커뮤니티 게시글 피드
  communityPosts: CommunityPost[];

  // 외부 시장 프로젝트 목록
  externalProjects: ExternalMarketProject[];

  // 소문 & 이벤트
  rumors: IndustryRumor[];
  eventsHistory: MarketEvent[];
  lastTurnEvents: MarketEvent[];
  turnLogs: Array<{
    turn: number;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  }>;

  actionsTakenThisTurn: Array<{
    complexId: number;
    actionId: string;
    timestamp: number;
  }>;
}
