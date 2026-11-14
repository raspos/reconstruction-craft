import {
  ComplexData,
  ComplexStage,
  CompanyData,
  GameState,
  PlayerTarget,
  SalesAction,
  ComplexBiddingState,
  BidProposal,
  ObservableCompetitorAction,
  CommunityPost,
  ExternalMarketProject,
} from '../types/game';
import { RAW_COMPLEX_DATA } from '../data/complexes';
import { CONSTRUCTION_COMPANIES } from '../data/companies';
import { SALES_ACTIONS } from '../data/actions';
import { SCHEDULE_MASTERPLANS, ScheduleMasterplanId } from '../data/schedules';
import { SeededRNG } from './rng';
import { calculateFavorability } from './favorabilityEngine';
import { AICompetitorEngine } from './aiCompetitorEngine';
import { EventEngine } from './eventEngine';
import { RumorEngine } from './rumorEngine';
import { EndingEngine } from './endingEngine';
import { UnionAIEngine } from './unionAIEngine';
import { ProposalEvaluationResult, evaluateProposal, DEFAULT_STANDARD_PROPOSAL } from './proposalEngine';
import { simulateGeneralAssemblyVote } from './votingEngine';
import { generateCommunityPosts } from './communityEngine';
import { processExternalMarketTurn, INITIAL_EXTERNAL_PROJECTS } from './externalMarketEngine';

export class GameEngine {
  private state: GameState;
  private rng: SeededRNG;
  private aiEngine: AICompetitorEngine;
  private eventEngine: EventEngine;
  private rumorEngine: RumorEngine;
  private unionEngine: UnionAIEngine;
  public allComplexes: ComplexData[];

  constructor(
    playerCompanyId: string = 'taeseong',
    gameMode: 'STANDARD_18' | 'FAST_12' = 'STANDARD_18',
    seed: number = Date.now(),
    targetOption?: PlayerTarget,
    scheduleMasterplanId: ScheduleMasterplanId = 'STANDARD'
  ) {
    this.rng = new SeededRNG(seed);
    this.aiEngine = new AICompetitorEngine(this.rng);
    this.eventEngine = new EventEngine(this.rng);
    this.rumorEngine = new RumorEngine(this.rng);
    this.unionEngine = new UnionAIEngine(this.rng);
    this.allComplexes = JSON.parse(JSON.stringify(RAW_COMPLEX_DATA));

    this.state = this.initializeGameState(playerCompanyId, gameMode, targetOption, scheduleMasterplanId);
  }

  // 초기 게임 상태 생성
  private initializeGameState(
    playerCompanyId: string,
    gameMode: 'STANDARD_18' | 'FAST_12',
    targetOption?: PlayerTarget,
    scheduleMasterplanId: ScheduleMasterplanId = 'STANDARD'
  ): GameState {
    const totalTurns = gameMode === 'STANDARD_18' ? 18 : 12;
    const playerCompany =
      CONSTRUCTION_COMPANIES.find((c) => c.id === playerCompanyId) ||
      CONSTRUCTION_COMPANIES[0];

    const masterplan =
      SCHEDULE_MASTERPLANS.find((p) => p.id === scheduleMasterplanId) ||
      SCHEDULE_MASTERPLANS[0];

    // 목표 설정
    const defaultTarget: PlayerTarget = targetOption || {
      targetVolume: Math.round(playerCompany.attributes.capa * 0.8),
      targetLabel: `${(Math.round(playerCompany.attributes.capa * 0.8) / 10000).toFixed(1)}조원 (균형 목표)`,
      riskMultiplier: 1.0,
    };

    // 15개 단지 수주전 초기 상태 구성
    const complexStates: Record<number, ComplexBiddingState> = {};
    const staffAllocation: Record<number, number> = {};

    this.allComplexes.forEach((complex) => {
      staffAllocation[complex.id] = 0;
      const baseStartTurn = masterplan.startTurns[complex.id] || complex.startTurn;
      const adjustedStartTurn =
        gameMode === 'FAST_12' ? Math.max(1, Math.ceil(baseStartTurn / 2)) : baseStartTurn;
      complex.startTurn = adjustedStartTurn;

      const supportScores: ComplexBiddingState['supportScores'] = {};

      CONSTRUCTION_COMPANIES.forEach((comp) => {
        const isTarget = comp.targetComplexIds.includes(complex.id);

        // 기본 점수: 우선 관심 단지 vs 일반 관심 단지 (충분히 역전 가능한 완만한 격차)
        let generalBase = isTarget ? 40 + this.rng.range(-3, 5) : 26 + this.rng.range(-3, 3);
        let execBase = isTarget ? 38 + this.rng.range(-4, 5) : 24 + this.rng.range(-3, 3);
        let trustScore = isTarget ? 68 + this.rng.range(-3, 4) : 50 + this.rng.range(-3, 3);
        let hiddenIntent = isTarget
          ? Math.min(
              85,
              Math.max(
                50,
                Math.round(
                  comp.attributes.brand * 0.35 +
                    comp.attributes.salesOrg * 0.35 +
                    this.rng.range(5, 15)
                )
              )
            )
          : Math.min(45, Math.max(18, Math.round(this.rng.range(20, 35))));

        const isWithdrawn = false; // 기본 상태에서는 어느 건설사도 원천 배제/철수되지 않고 시장에 상존

        // 시장 선점 단지 특별 우세 살짝 반영 (6단지 정우, 10단지 한강, 12단지 미래, 13단지 태성)
        const isHistoricalPrecedent =
          (complex.id === 6 && comp.id === 'jungwoo') ||
          (complex.id === 10 && comp.id === 'hangang') ||
          (complex.id === 12 && comp.id === 'mirae') ||
          (complex.id === 13 && comp.id === 'taeseong');

        if (isHistoricalPrecedent) {
          generalBase += 8;
          execBase += 9;
          hiddenIntent = Math.min(90, hiddenIntent + 12);
          trustScore = Math.min(84, trustScore + 10);
        }

        const initialFavor = calculateFavorability({
          company: comp,
          complex,
          generalSupportBase: generalBase,
          execSupportBase: execBase,
          brandPerceptionBase: comp.attributes.brand,
          costOfferedMarginDelta: 0,
          financeOfferedScore: comp.attributes.finance,
          trustScore,
        });

        const initialActions: ObservableCompetitorAction[] = [];
        if (isHistoricalPrecedent && comp.id !== playerCompanyId) {
          initialActions.push({
            type: 'BANNER_AD',
            turn: 1,
            description: `${comp.name} 사전 정비계획 협력 및 브랜드 특화 사전 교감 진행`,
            sincerityWeight: 0.45,
          });
        } else if (
          complex.startTurn === 1 &&
          comp.id !== playerCompanyId &&
          isTarget &&
          hiddenIntent >= 50
        ) {
          initialActions.push({
            type: 'BANNER_AD',
            turn: 1,
            description: `${comp.name} 우선 관심 단지 지정 및 현장 홍보 안내문 부착`,
            sincerityWeight: 0.35,
          });
        }

        supportScores[comp.id] = {
          hiddenBidIntent: hiddenIntent,
          observableActions: initialActions,
          estimatedBidChance: Math.min(
            90,
            Math.max(15, Math.round(hiddenIntent + this.rng.range(-6, 6)))
          ),
          intelReliability: isTarget ? 'LOW' : 'MID',
          isWithdrawn,
          hasBid: false,
          totalFavorability: initialFavor.totalFavorability,
          brandPerception: comp.attributes.brand,
          costOfferedMarginDelta: 0,
          financeOffered: comp.attributes.finance,
          execSupport: execBase,
          trustScore,
        };
      });

      complexStates[complex.id] = {
        complexId: complex.id,
        currentStage: complex.startTurn === 1 ? complex.stage : 'interest',
        monthsInStage: 0,
        playerBidStatus: complex.startTurn === 1 ? 'PRE_SALES' : 'NONE',
        prFatigue: 0,
        unionActions: [],
        supportScores,
        playerProposal: undefined,
        consortiumPartnerId: null,
        winnerId: null,
        isSoleBid: false,
        isRebid: false,
        negotiatedContract: false,
        contractPrice: complex.expectedCost,
        finalProfitMargin: complex.baseExpectedProfitMargin,
      };
    });

    // 시작 턴 활성 단지에 기본 인력 자동 분배 (100명 중 활성 단지 3~4곳에 분배)
    const turn1Complexes = this.allComplexes.filter((c) => c.startTurn === 1);
    const count = turn1Complexes.length || 1;
    const perComplex = Math.floor(80 / count);
    turn1Complexes.forEach((c) => {
      staffAllocation[c.id] = perComplex;
    });

    // 경쟁사 AI 상태 초기화
    const competitorStates: GameState['competitorStates'] = {};
    CONSTRUCTION_COMPANIES.filter((c) => c.id !== playerCompanyId).forEach((comp) => {
      competitorStates[comp.id] = {
        usedCapa: 0,
        wonComplexIds: [],
        totalWonVolume: 0,
        budget: comp.startingBudget,
        reputation: 80,
        strategyMemory: {
          playerPriceCutObserved: 0,
          playerAggressionObserved: 0,
          preferredComplexTypes: [],
        },
        hqBudgetRequestsUsed: 0,
      };
    });

    const initialRumors = this.rumorEngine.generateTurnRumors(1);
    const initialCommunityPosts = generateCommunityPosts(1, this.allComplexes, complexStates, initialRumors);
    const externalProjects = JSON.parse(JSON.stringify(INITIAL_EXTERNAL_PROJECTS));

    return {
      gameMode,
      totalTurns,
      currentTurn: 1,
      isGameOver: false,
      selectedEnding: null,
      playerCompanyId,
      playerTarget: defaultTarget,
      availableAP: playerCompany.startingAP,
      maxAP: playerCompany.startingAP,
      budget: playerCompany.startingBudget,
      usedCapa: 0,
      maxCapa: playerCompany.attributes.capa,
      ceoTrust: 75,
      cfoTrust: 75,
      companyReputation: 85,
      legalRisk: 0,
      totalSalesCostSpent: 0,
      totalSalesStaff: 100,
      staffAllocation,
      complexStates,
      competitorStates,
      communityPosts: initialCommunityPosts,
      externalProjects,
      rumors: initialRumors,
      eventsHistory: [],
      lastTurnEvents: [],
      turnLogs: [
        {
          turn: 1,
          message: `${playerCompany.name} 주택사업영업본부장으로 공식 부임했습니다. 수주 목표 ${defaultTarget.targetLabel} 달성을 향해 전진하십시오!`,
          type: 'INFO',
        },
      ],
      actionsTakenThisTurn: [],
    };
  }

  public getState(): GameState {
    return this.state;
  }

  // 저장된 게임 상태 복원 (Phase 6: 이어하기 지원)
  public setState(state: GameState): void {
    this.state = JSON.parse(JSON.stringify(state));
  }

  public static fromSavedState(savedState: GameState): GameEngine {
    const engine = new GameEngine(
      savedState.playerCompanyId,
      savedState.gameMode,
      Date.now(),
      savedState.playerTarget
    );
    engine.setState(savedState);
    return engine;
  }

  // 영업 인력(100명) 재배치
  public allocateStaff(allocations: Record<number, number>): { success: boolean; message: string } {
    let total = 0;
    Object.values(allocations).forEach((v) => {
      total += Math.max(0, Number(v) || 0);
    });

    if (total > this.state.totalSalesStaff) {
      return {
        success: false,
        message: `가용 영업 인력(총 ${this.state.totalSalesStaff}명)을 초과했습니다. (요청: ${total}명)`,
      };
    }

    this.state.staffAllocation = { ...allocations };
    return {
      success: true,
      message: `영업 인력 재배치가 완료되었습니다. (투입: ${total}명 / 대기: ${this.state.totalSalesStaff - total}명)`,
    };
  }

  // 입찰 제안서 제출 및 평가
  public submitPlayerProposal(
    complexId: number,
    proposal: BidProposal,
    consortiumPartnerId?: string | null
  ): { success: boolean; message: string; evalResult: ProposalEvaluationResult } {
    const complex = this.allComplexes.find((c) => c.id === complexId);
    const bState = this.state.complexStates[complexId];
    const playerCompany = CONSTRUCTION_COMPANIES.find((c) => c.id === this.state.playerCompanyId)!;

    if (!complex || !bState) {
      throw new Error('단지를 찾을 수 없습니다.');
    }

    // 단일 건설사 수주 한도(최대 5개 단지) 검증
    const playerWonCount = Object.values(this.state.complexStates).filter(
      (st) => st.winnerId === this.state.playerCompanyId
    ).length;
    if (playerWonCount >= 5) {
      return {
        success: false,
        message: '시공능력 및 반독점 규제(단일 건설사 최대 5개 단지 상한)에 따라 추가 입찰이 제한됩니다. (현재 5개 단지 수주 완료)',
        evalResult: evaluateProposal(proposal, complex, playerCompany),
      };
    }

    // 컨소시엄 가능 여부 검증
    if (consortiumPartnerId && !complex.biddingRules.consortiumAllowed) {
      return {
        success: false,
        message: '해당 단지는 조합 규정상 건설사 컨소시엄(공동도급) 입찰이 엄격히 금지되어 있습니다.',
        evalResult: evaluateProposal(proposal, complex, playerCompany),
      };
    }

    const evalResult = evaluateProposal(proposal, complex, playerCompany);

    bState.playerProposal = proposal;
    bState.playerBidStatus = 'BID_CONFIRMED';
    bState.supportScores[this.state.playerCompanyId].hasBid = true;
    bState.consortiumPartnerId = consortiumPartnerId || null;

    // 제안서 실비 소멸 적용 (소멸비용 차감)
    const prepCost = complex.biddingRules.proposalPrepCost;
    if (this.state.budget >= prepCost) {
      this.state.budget -= prepCost;
      this.state.totalSalesCostSpent += prepCost;
    }

    // CFO 경고 로그
    if (evalResult.cfoWarningMessage) {
      this.state.cfoTrust = Math.max(10, this.state.cfoTrust - 8);
      this.state.turnLogs.push({
        turn: this.state.currentTurn,
        message: `[CFO 경고] ${complex.name} 제안서 제출: ${evalResult.cfoWarningMessage}`,
        type: 'WARNING',
      });
    }

    const partnerComp = consortiumPartnerId
      ? CONSTRUCTION_COMPANIES.find((c) => c.id === consortiumPartnerId)
      : null;

    const partnerMsg = partnerComp ? ` (${partnerComp.name}과 공동 컨소시엄)` : '';

    this.state.turnLogs.push({
      turn: this.state.currentTurn,
      message: `[입찰 제안서 공식 접수] ${complex.name}에 맞춤형 제안서${partnerMsg}를 제출 완료했습니다. (예상 마진: ${evalResult.effectiveMarginPercent}%, 브랜드 매력도: ${evalResult.brandLoyalistAppeal}점, 실리파 매력도: ${evalResult.pragmatistAppeal}점)`,
      type: 'SUCCESS',
    });

    return {
      success: true,
      message: `${complex.name} 입찰 제안서가 성공적으로 접수되었습니다.`,
      evalResult,
    };
  }

  // 경쟁사 정보 정밀 분석 (정보전)
  public investigateCompetitor(
    complexId: number,
    competitorId: string
  ): { success: boolean; message: string; revealedIntent: number; reliability: string } {
    if (this.state.availableAP < 1) {
      return { success: false, message: '행동력(AP)이 부족합니다.', revealedIntent: 0, reliability: 'LOW' };
    }
    if (this.state.budget < 5) {
      return { success: false, message: '정보 수집 영업비(5억원)가 부족합니다.', revealedIntent: 0, reliability: 'LOW' };
    }

    this.state.availableAP -= 1;
    this.state.budget -= 5;
    this.state.totalSalesCostSpent += 5;

    const bState = this.state.complexStates[complexId];
    const stance = bState?.supportScores[competitorId];
    const comp = CONSTRUCTION_COMPANIES.find((c) => c.id === competitorId);
    const complex = this.allComplexes.find((c) => c.id === complexId);

    if (!stance || !comp || !complex) {
      return { success: false, message: '정보 대상을 찾을 수 없습니다.', revealedIntent: 0, reliability: 'LOW' };
    }

    // 신뢰도 HIGH 격상 및 진정성 공개
    stance.intelReliability = 'HIGH';
    stance.estimatedBidChance = stance.hiddenBidIntent;

    let verdict = '포기 가능성 농후 (단순 블러핑)';
    if (stance.hiddenBidIntent >= 70) verdict = '결사항전 실입찰 확정';
    else if (stance.hiddenBidIntent >= 45) verdict = '간보기 및 조건 관망 중';

    this.state.turnLogs.push({
      turn: this.state.currentTurn,
      message: `[정보전 첩보 입수] ${complex.name} 내 ${comp.name}의 실제 입찰 의지는 ${stance.hiddenBidIntent}% 수준으로 파악되었습니다. (${verdict})`,
      type: 'INFO',
    });

    return {
      success: true,
      message: `정밀 첩보 확인 완료: ${comp.name} 실제 의지 ${stance.hiddenBidIntent}% (${verdict})`,
      revealedIntent: stance.hiddenBidIntent,
      reliability: 'HIGH',
    };
  }

  // 플레이어 영업 행동 실행
  public executePlayerAction(
    complexId: number,
    actionId: string
  ): { success: boolean; message: string; scandalTriggered?: boolean } {
    if (this.state.isGameOver) return { success: false, message: '게임이 종료되었습니다.' };

    const action = SALES_ACTIONS.find((a) => a.id === actionId);
    if (!action) return { success: false, message: '존재하지 않는 행동입니다.' };

    if (this.state.availableAP < action.apCost) {
      return { success: false, message: '행동력(AP)이 부족합니다.' };
    }

    if (this.state.budget < action.budgetCost) {
      return { success: false, message: '가용 영업예산이 부족합니다.' };
    }

    const bState = this.state.complexStates[complexId];
    const complex = this.allComplexes.find((c) => c.id === complexId);
    if (!bState || !complex) return { success: false, message: '단지를 찾을 수 없습니다.' };

    if (bState.currentStage === 'contracted' || bState.winnerId) {
      return { success: false, message: '이미 시공사 선정이 완료된 단지입니다.' };
    }

    // 단일 건설사 수주 한도(최대 5개 단지 제한)
    const playerWonCount = Object.values(this.state.complexStates).filter(
      (st) => st.winnerId === this.state.playerCompanyId
    ).length;
    if (playerWonCount >= 5 && action.id !== 'withdraw_bid') {
      return {
        success: false,
        message: '시공능력 및 반독점 규제(단일 건설사 최대 5개 단지 상한)에 도달하여 추가 영업이 제한됩니다. (현재 5개 단지 수주 완료)',
      };
    }

    // 자원 소모
    this.state.availableAP -= action.apCost;
    this.state.budget -= action.budgetCost;
    this.state.totalSalesCostSpent += action.budgetCost;

    // 홍보 피로도 누적
    const fatigueDelta = action.effect.prFatigueIncrease || (action.category === 'RISKY' ? 18 : 8);
    bState.prFatigue = Math.min(100, bState.prFatigue + fatigueDelta);

    const mySupport = bState.supportScores[this.state.playerCompanyId];

    // 투입된 영업인력 시너지 보너스
    const staff = this.state.staffAllocation[complexId] || 0;
    const staffBonus = Math.floor(staff / 20); // 20명당 +1 보너스

    // 행동 효과 적용
    if (action.id === 'withdraw_bid') {
      mySupport.isWithdrawn = true;
      mySupport.totalFavorability = 0;
      mySupport.hasBid = false;
      bState.playerBidStatus = 'WITHDRAWN';
      this.state.ceoTrust = Math.max(10, this.state.ceoTrust - 6);
      this.state.cfoTrust = Math.min(100, this.state.cfoTrust + 6);
      this.state.turnLogs.push({
        turn: this.state.currentTurn,
        message: `[${complex.name}] 출혈 경쟁을 피해 전격 철수를 선언했습니다. CFO가 예산 절감을 치하합니다.`,
        type: 'WARNING',
      });
      return { success: true, message: '단지에서 전략적으로 철수했습니다.' };
    }

    if (action.id === 'enter_bid') {
      mySupport.hasBid = true;
      bState.playerBidStatus = 'BID_CONFIRMED';
    } else if (bState.playerBidStatus === 'NONE' || bState.playerBidStatus === 'PRE_SALES') {
      bState.playerBidStatus = 'BID_REVIEW';
    }

    // 호감도 및 마진 변동 적용
    if (action.effect.favorabilityBoost) {
      const totalBoost = action.effect.favorabilityBoost + staffBonus;
      mySupport.totalFavorability = Math.min(99, mySupport.totalFavorability + totalBoost);
    }
    if (action.effect.brandImpression) {
      mySupport.brandPerception = Math.min(100, mySupport.brandPerception + action.effect.brandImpression);
    }
    if (action.effect.marginDelta) {
      mySupport.costOfferedMarginDelta += action.effect.marginDelta;
      if (action.effect.marginDelta < 0) {
        Object.values(this.state.competitorStates).forEach((comp) => {
          comp.strategyMemory.playerPriceCutObserved += 1;
        });
        this.state.cfoTrust = Math.max(10, this.state.cfoTrust - 8);
      }
    }
    if (action.effect.executiveTrust) {
      mySupport.execSupport = Math.min(100, mySupport.execSupport + action.effect.executiveTrust);
    }
    if (action.effect.intelGain) {
      this.state.rumors.forEach((r) => {
        if (r.relatedComplexId === complexId) r.investigated = true;
      });
      // 단지 내 모든 경쟁사 정보 신뢰도 상승
      Object.values(bState.supportScores).forEach((s) => {
        s.intelReliability = 'MID';
      });
    }

    // 위험 영업 적발 여부 체크
    let scandalTriggered = false;
    if (action.category === 'RISKY') {
      this.state.legalRisk += Math.round(action.riskChance * 35);
      if (this.rng.chance(action.riskChance)) {
        scandalTriggered = true;
        this.state.companyReputation = Math.max(10, this.state.companyReputation - 20);
        this.state.cfoTrust = Math.max(10, this.state.cfoTrust - 15);
        this.state.legalRisk += 25;
        mySupport.totalFavorability = Math.max(15, mySupport.totalFavorability - 25);
        bState.prFatigue = Math.min(100, bState.prFatigue + 25);
        this.state.turnLogs.push({
          turn: this.state.currentTurn,
          message: `[불법 영업 적발 경고] ${complex.name}에서 ${action.name} 중 비대위 및 사법당국에 꼬리가 잡혔습니다! 평판과 지지율이 폭락합니다.`,
          type: 'DANGER',
        });
      }
    }

    this.state.actionsTakenThisTurn.push({
      complexId,
      actionId,
      timestamp: Date.now(),
    });

    const statusMsg = scandalTriggered
      ? `적발 발생! ${action.name} 실행으로 리스크가 급증했습니다.`
      : `${action.name} 실행 완료: ${complex.name} 지지율 상승 (+인력시너지 ${staffBonus})`;

    return { success: true, message: statusMsg, scandalTriggered };
  }

  // 턴 종료 및 다음 달 진행
  public nextTurn(): { newEvents: any[]; contractsSigned: any[] } {
    if (this.state.isGameOver) return { newEvents: [], contractsSigned: [] };

    const contractsSigned: Array<{ complexName: string; winnerName: string; price: number }> = [];

    // 1. 외부 시장 프로젝트 해결 체크 (강남 압구정, 한남 4구역 등)
    const extResolution = processExternalMarketTurn(
      this.state.currentTurn,
      this.state.externalProjects,
      CONSTRUCTION_COMPANIES,
      this.state.playerCompanyId
    );

    if (extResolution) {
      this.state.turnLogs.push({
        turn: this.state.currentTurn,
        message: extResolution.impactMessage,
        type: 'INFO',
      });
      // 수주한 경쟁사의 가온 신시가지 내 입찰 의지 25% 하락
      Object.values(this.state.complexStates).forEach((st) => {
        const rivalStance = st.supportScores[extResolution.winnerCompanyId];
        if (rivalStance) {
          rivalStance.hiddenBidIntent = Math.max(10, rivalStance.hiddenBidIntent - 25);
        }
      });
    }

    // 2. 경쟁사 AI 의사결정 및 관찰 가능 행동 생성
    CONSTRUCTION_COMPANIES.filter((c) => c.id !== this.state.playerCompanyId).forEach((company) => {
      const compState = this.state.competitorStates[company.id];
      if (!compState) return;

      // 긴급 본사 추가예산 심사 (Phase 1-1: 자원 제약 및 본사 승인)
      if (compState.budget < 25 && compState.hqBudgetRequestsUsed < 2) {
        if (company.attributes.funds >= 75 && compState.reputation >= 65) {
          compState.budget += 60;
          compState.hqBudgetRequestsUsed += 1;
          this.state.turnLogs.push({
            turn: this.state.currentTurn,
            message: `[본사 추가예산 승인] ${company.name} 본사가 가온 신시가지 수주 총력전을 위해 긴급 영업예산 60억원을 추가 배정했습니다.`,
            type: 'INFO',
          });
        }
      }

      const aiDecisions = this.aiEngine.evaluateCompanyTurn(
        company,
        this.state,
        this.allComplexes
      );

      aiDecisions.forEach((dec) => {
        const bState = this.state.complexStates[dec.complexId];
        if (!bState) return;
        const myScore = bState.supportScores[company.id];
        if (!myScore) return;

        // 실제 영업예산 차감 (Phase 1-1: 플레이어와 동일한 실제 예산 제약)
        if (dec.costSpent > 0) {
          compState.budget = Math.max(0, compState.budget - dec.costSpent);
        }

        if (dec.decisionType === 'WITHDRAW') {
          myScore.isWithdrawn = true;
          myScore.hasBid = false;
          myScore.totalFavorability = 0;
          this.state.turnLogs.push({
            turn: this.state.currentTurn,
            message: `[경쟁사 철수] ${company.name}이(가) ${this.allComplexes.find((c) => c.id === dec.complexId)?.name}에서 기대효용 부족으로 전략적 철수를 선언했습니다.`,
            type: 'INFO',
          });

          // Phase 3-1: 연쇄 반응 (Cascade Reaction) - 철수한 인력과 영업비를 자사 다른 목표 단지로 즉시 전환
          const otherTargetId = company.targetComplexIds.find(
            (tId) =>
              tId !== dec.complexId &&
              !this.state.complexStates[tId]?.winnerId &&
              !this.state.complexStates[tId]?.supportScores[company.id]?.isWithdrawn
          );
          if (otherTargetId) {
            const otherStance = this.state.complexStates[otherTargetId]?.supportScores[company.id];
            if (otherStance) {
              otherStance.totalFavorability = Math.min(95, otherStance.totalFavorability + 8);
              otherStance.hiddenBidIntent = Math.min(95, otherStance.hiddenBidIntent + 12);
              const targetName = this.allComplexes.find((c) => c.id === otherTargetId)?.name;
              this.state.turnLogs.push({
                turn: this.state.currentTurn,
                message: `[전력 재배치] ${company.name}이(가) 철수 인력을 ${targetName}로 급파하여 집중 공세에 돌입했습니다!`,
                type: 'WARNING',
              });
            }
          }
        } else if (dec.supportBoost) {
          myScore.totalFavorability = Math.min(98, myScore.totalFavorability + dec.supportBoost);
          if (dec.marginAdjustment) {
            myScore.costOfferedMarginDelta += dec.marginAdjustment;
          }

          // 관찰 가능 행동 추가 (쇼룸, 홍보관, CEO 방문 등)
          if (myScore.hiddenBidIntent >= 70 && this.rng.chance(0.35)) {
            myScore.observableActions.push({
              type: 'CEO_VISIT',
              turn: this.state.currentTurn,
              description: `${company.name} 대표이사 현장 전격 방문 및 조합원 간담회 주재`,
              sincerityWeight: 0.85,
            });
          } else if (this.rng.chance(0.4)) {
            myScore.observableActions.push({
              type: 'SHOWROOM_OPEN',
              turn: this.state.currentTurn,
              description: `${company.name} 단지 인근 프리미엄 홍보관 개관 및 VIP 상담`,
              sincerityWeight: 0.6,
            });
          }
        }
      });
    });

    // 3. 조합 AI 평가 및 단지별 단계 진행 / 총회 투표
    this.allComplexes.forEach((complex) => {
      const bState = this.state.complexStates[complex.id];
      if (!bState || bState.currentStage === 'contracted' || bState.winnerId) return;

      if (complex.startTurn > this.state.currentTurn) return;

      // 조합 AI 의사결정 호출
      const unionAction = this.unionEngine.evaluateTurn(complex, bState, this.state);
      if (unionAction) {
        bState.unionActions.push(unionAction);
        this.state.turnLogs.push({
          turn: this.state.currentTurn,
          message: unionAction.title,
          type: unionAction.type === 'PUBLIC_WARNING' ? 'WARNING' : 'INFO',
        });
      }

      // 자연 홍보 피로도 감쇠 (매 턴 -6)
      bState.prFatigue = Math.max(0, bState.prFatigue - 6);

      // 인력 상주 패시브 보너스
      const staff = this.state.staffAllocation[complex.id] || 0;
      if (staff > 0) {
        const mySupport = bState.supportScores[this.state.playerCompanyId];
        mySupport.totalFavorability = Math.min(99, mySupport.totalFavorability + Math.min(3, Math.floor(staff / 30)));
      }

      bState.monthsInStage += 1;

      // 18개월/12개월 모드에 맞춘 압축 단계 일정
      const isFast = this.state.gameMode === 'FAST_12';
      const stageDurationMap: Record<ComplexStage, number> = isFast
        ? {
            interest: 1,
            pre_sales: 1,
            bidding_prep: 1,
            bidding: 1,
            selection: 1,
            contracted: 999,
          }
        : {
            interest: 1,
            pre_sales: 2,
            bidding_prep: 1,
            bidding: 1,
            selection: 1,
            contracted: 999,
          };

      // 게임 종료 임박 시 완결 보장 가속화 ("그 안에서 해결하도록")
      const turnsRemaining = this.state.totalTurns - this.state.currentTurn;
      if (turnsRemaining <= 2 && bState.currentStage !== 'selection') {
        if (bState.currentStage === 'interest' || bState.currentStage === 'pre_sales') {
          bState.currentStage = 'bidding_prep';
        } else if (bState.currentStage === 'bidding_prep') {
          bState.currentStage = 'bidding';
        } else if (bState.currentStage === 'bidding') {
          bState.currentStage = 'selection';
        }
        bState.monthsInStage = 0;
      }

      if (bState.monthsInStage >= stageDurationMap[bState.currentStage]) {
        bState.monthsInStage = 0;

        if (bState.currentStage === 'interest') {
          bState.currentStage = 'pre_sales';
        } else if (bState.currentStage === 'pre_sales') {
          bState.currentStage = 'bidding_prep';
        } else if (bState.currentStage === 'bidding_prep') {
          bState.currentStage = 'bidding';
        } else if (bState.currentStage === 'bidding') {
          bState.currentStage = 'selection';
        } else if (bState.currentStage === 'selection') {
          // ==============================
          // 고도화 비밀투표 총회 표결
          // ==============================
          this.resolveSelectionAssembly(complex, bState, contractsSigned);
        }
      }
    });

    // 4. 시장 사건 발생 판정
    const newEvents = this.eventEngine.evaluateTurnEvents(this.state);
    this.state.lastTurnEvents = newEvents;
    this.state.eventsHistory.push(...newEvents);

    // 5. 신규 업계 소문 생성 (실제 내부 상태 및 사건 기반)
    this.state.rumors = this.rumorEngine.generateTurnRumors(
      this.state.currentTurn + 1,
      this.state,
      this.allComplexes
    );

    // 6. 가상 커뮤니티 (가온 신시가지 소통방) 피드 갱신
    const newPosts = generateCommunityPosts(
      this.state.currentTurn,
      this.allComplexes,
      this.state.complexStates,
      this.state.rumors
    );
    this.state.communityPosts.unshift(...newPosts);
    // 최대 40개 유지
    if (this.state.communityPosts.length > 40) {
      this.state.communityPosts = this.state.communityPosts.slice(0, 40);
    }

    // 7. 사후 계약 이행 위험 관리 (이미 수주한 단지들 점검)
    this.processContractFulfillmentRisks();

    // 8. 플레이어 자원 회복
    const playerCompany =
      CONSTRUCTION_COMPANIES.find((c) => c.id === this.state.playerCompanyId) ||
      CONSTRUCTION_COMPANIES[0];
    this.state.availableAP = playerCompany.startingAP;
    this.state.actionsTakenThisTurn = [];

    // 턴 전진
    this.state.currentTurn += 1;

    // 게임 종료 판정
    if (this.state.currentTurn > this.state.totalTurns) {
      // 모든 미선정 단지 최종 총회 수의계약 완결 처리 ("그 안에서 해결하도록")
      this.allComplexes.forEach((c) => {
        const bs = this.state.complexStates[c.id];
        if (bs && bs.currentStage !== 'contracted') {
          const getWonCount = (bId: string) => {
            return bId === this.state.playerCompanyId
              ? Object.values(this.state.complexStates).filter((st) => st.winnerId === bId).length
              : (this.state.competitorStates[bId]?.wonComplexIds.length || 0);
          };

          const validBuilders = Object.entries(bs.supportScores)
            .filter(([bId, s]) => !s.isWithdrawn && getWonCount(bId) < 5)
            .sort((a, b) => b[1].totalFavorability - a[1].totalFavorability);

          let winnerId = validBuilders.length > 0 ? validBuilders[0][0] : null;
          if (!winnerId) {
            const eligible = CONSTRUCTION_COMPANIES.filter((comp) => getWonCount(comp.id) < 5);
            winnerId = eligible.length > 0 ? eligible[0].id : 'taeseong';
          }

          const winnerComp = CONSTRUCTION_COMPANIES.find((comp) => comp.id === winnerId)!;
          bs.winnerId = winnerId;
          bs.currentStage = 'contracted';
          bs.contractPrice = c.expectedCost;
          bs.finalProfitMargin = c.baseExpectedProfitMargin;
          bs.negotiatedContract = true;
          bs.isSoleBid = true;

          if (winnerId === this.state.playerCompanyId) {
            this.state.usedCapa += c.expectedCost;
          } else {
            const cst = this.state.competitorStates[winnerId];
            if (cst) {
              cst.usedCapa += c.expectedCost;
              cst.wonComplexIds.push(c.id);
              cst.totalWonVolume += c.expectedCost;
            }
          }

          this.state.turnLogs.push({
            turn: this.state.totalTurns,
            message: `[최종 계약 체결] ${c.name}이(가) 회기 종료 전 조합원 총회를 통해 ${winnerComp.name}과(와) 최종 시공 계약을 체결했습니다.`,
            type: 'INFO',
          });
        }
      });

      this.state.isGameOver = true;
      const evaluation = EndingEngine.evaluateGame(this.state, this.allComplexes);
      this.state.selectedEnding = evaluation.ending;
    }

    return { newEvents, contractsSigned };
  }

  // 시공사 선정 총회 투표 및 계약 체결 처리 (votingEngine 연동)
  private resolveSelectionAssembly(
    complex: ComplexData,
    bState: ComplexBiddingState,
    contractsSigned: Array<{ complexName: string; winnerName: string; price: number }>
  ): void {
    // 플레이어 참여 여부: 반드시 명시적 입찰 확정('BID_CONFIRMED') 및 제안서 제출 완료 시에만 참가!
    // Phase 1-2: 호감도가 95라도 입찰을 확정하지 않았거나 포기('WITHDRAWN')했으면 절대 참여하지 않음!
    const playerParticipates =
      !bState.supportScores[this.state.playerCompanyId]?.isWithdrawn &&
      (bState.playerBidStatus === 'BID_CONFIRMED' || bState.playerProposal !== undefined);

    // 건설사별 기수주 단지 수 및 잔여 캐파 집계 (반독점 밸런스 평가용)
    const builderWonCounts: Record<string, number> = {};
    const builderRemainingCapas: Record<string, number> = {};

    let playerWonCount = 0;
    Object.values(this.state.complexStates).forEach((st) => {
      if (st.winnerId === this.state.playerCompanyId) playerWonCount++;
    });
    builderWonCounts[this.state.playerCompanyId] = playerWonCount;
    builderRemainingCapas[this.state.playerCompanyId] = Math.max(
      0,
      this.state.maxCapa - this.state.usedCapa
    );

    CONSTRUCTION_COMPANIES.forEach((comp) => {
      if (comp.id === this.state.playerCompanyId) return;
      const cst = this.state.competitorStates[comp.id];
      builderWonCounts[comp.id] = cst?.wonComplexIds.length || 0;
      builderRemainingCapas[comp.id] = Math.max(
        0,
        comp.attributes.capa - (cst?.usedCapa || 0)
      );
    });

    const voteResult = simulateGeneralAssemblyVote(
      complex,
      bState,
      CONSTRUCTION_COMPANIES,
      this.state.playerCompanyId,
      playerParticipates,
      bState.playerProposal,
      bState.consortiumPartnerId,
      builderWonCounts,
      builderRemainingCapas
    );

    bState.winnerId = voteResult.winnerId;
    bState.winnerIsConsortium = voteResult.winnerIsConsortium;
    bState.isSoleBid = voteResult.isSoleBid;
    bState.isRebid = voteResult.isRebid;
    bState.negotiatedContract = voteResult.negotiatedContract;
    bState.contractPrice = voteResult.contractPrice;
    bState.finalProfitMargin = voteResult.finalProfitMargin;

    if (voteResult.isRebid) {
      const isUrgent = this.state.currentTurn >= this.state.totalTurns - 2;
      if (bState.isRebid || isUrgent) {
        // 2회차 유찰 또는 기한 임박 시 수의계약으로 전환하여 즉시 확정
        const getWonCount = (bId: string) => {
          return bId === this.state.playerCompanyId
            ? Object.values(this.state.complexStates).filter((st) => st.winnerId === bId).length
            : (this.state.competitorStates[bId]?.wonComplexIds.length || 0);
        };

        const validBuilders = Object.entries(bState.supportScores)
          .filter(([bId, s]) => !s.isWithdrawn && getWonCount(bId) < 5)
          .sort((a, b) => b[1].totalFavorability - a[1].totalFavorability);

        let fallbackWinner = validBuilders.length > 0 ? validBuilders[0][0] : null;
        if (!fallbackWinner) {
          const eligible = CONSTRUCTION_COMPANIES.filter((comp) => getWonCount(comp.id) < 5);
          fallbackWinner = eligible.length > 0 ? eligible[0].id : 'taeseong';
        }

        const fallbackComp = CONSTRUCTION_COMPANIES.find((c) => c.id === fallbackWinner)!;

        bState.winnerId = fallbackWinner;
        voteResult.winnerId = fallbackWinner;
        voteResult.winnerName = fallbackComp.name;
        bState.isRebid = false;
        bState.isSoleBid = true;
        bState.negotiatedContract = true;
        bState.contractPrice = complex.expectedCost;
        bState.finalProfitMargin = complex.baseExpectedProfitMargin;
        bState.currentStage = 'contracted';

        this.state.turnLogs.push({
          turn: this.state.currentTurn,
          message: `[수의계약 전환] ${complex.name} 유찰 사태에 따라 조합 총회 의결로 ${fallbackComp.name}과(와) 전격 수의계약이 체결되었습니다.`,
          type: 'INFO',
        });
      } else {
        // 1회차 유찰 -> 다시 입찰 진행 단계로 복귀
        bState.isRebid = true;
        bState.currentStage = 'bidding';
        bState.monthsInStage = 0;
        this.state.turnLogs.push({
          turn: this.state.currentTurn,
          message: `[입찰 유찰] ${voteResult.assemblySummary} (사유: ${voteResult.keyVoteFactor})`,
          type: 'WARNING',
        });
        return;
      }
    }

    // 계약 완료 처리
    bState.currentStage = 'contracted';
    const effectiveWinnerId = bState.winnerId || voteResult.winnerId;
    const resolvedWinnerComp = CONSTRUCTION_COMPANIES.find((c) => c.id === effectiveWinnerId);
    const playerCompanyObj = CONSTRUCTION_COMPANIES.find((c) => c.id === this.state.playerCompanyId);
    const winnerName =
      (voteResult.winnerIsConsortium && voteResult.winnerName) ||
      resolvedWinnerComp?.name ||
      voteResult.winnerName ||
      (effectiveWinnerId === this.state.playerCompanyId ? playerCompanyObj?.name || '당사' : '선정 시공사');

    // 사후 계약 관리 객체 초기화
    bState.contractFulfillment = {
      originalAgreedMargin: bState.finalProfitMargin,
      currentExpectedMargin: bState.finalProfitMargin,
      delayMonths: 0,
      unresolvedDisputes: 0,
    };

    if (effectiveWinnerId === this.state.playerCompanyId) {
      bState.playerBidStatus = 'WON';
      this.state.usedCapa += complex.expectedCost;
      this.state.ceoTrust = Math.min(100, this.state.ceoTrust + 15);
      if (bState.finalProfitMargin < 2.0) {
        this.state.cfoTrust = Math.max(10, this.state.cfoTrust - 10);
      } else {
        this.state.cfoTrust = Math.min(100, this.state.cfoTrust + 8);
      }

      this.state.turnLogs.push({
        turn: this.state.currentTurn,
        message: `[수주 승리!] ${voteResult.assemblySummary || `${complex.name} 시공사로 당사가 최종 선정되었습니다!`}`,
        type: 'SUCCESS',
      });
    } else if (effectiveWinnerId) {
      if (playerParticipates) {
        bState.playerBidStatus = 'LOST';
        this.state.ceoTrust = Math.max(10, this.state.ceoTrust - 8);
        this.state.turnLogs.push({
          turn: this.state.currentTurn,
          message: `[수주 실패] ${complex.name} 총회 투표에서 고배를 마셨습니다. 투입된 영업비와 인력 노력이 무산되었습니다. (CEO 신뢰도 -8)`,
          type: 'WARNING',
        });
      }

      const comp = this.state.competitorStates[effectiveWinnerId];
      if (comp) {
        comp.usedCapa += complex.expectedCost;
        if (!comp.wonComplexIds.includes(complex.id)) {
          comp.wonComplexIds.push(complex.id);
        }
        comp.totalWonVolume += complex.expectedCost;
      }
      this.state.turnLogs.push({
        turn: this.state.currentTurn,
        message: `[수주 결과] ${complex.name}의 시공권은 ${winnerName}에게 돌아갔습니다. (${voteResult.keyVoteFactor || '수의계약 인준'})`,
        type: 'INFO',
      });
    }

    contractsSigned.push({
      complexName: complex.name,
      winnerName,
      price: bState.contractPrice,
    });
  }

  // 사후 계약 이행 위기 시뮬레이션
  private processContractFulfillmentRisks(): void {
    Object.values(this.state.complexStates).forEach((st) => {
      if (st.currentStage === 'contracted' && st.winnerId === this.state.playerCompanyId && st.contractFulfillment) {
        const proposal = st.playerProposal || DEFAULT_STANDARD_PROPOSAL;

        // 시공사가 전액 물가 변동을 부담하기로 한 경우 (FULL_BUILDER_RISK)
        if (proposal.escalationRisk === 'FULL_BUILDER_RISK' && this.rng.chance(0.12)) {
          st.contractFulfillment.currentExpectedMargin -= 0.6;
          st.contractFulfillment.unresolvedDisputes += 1;
          this.state.turnLogs.push({
            turn: this.state.currentTurn,
            message: `[계약 이행 위기] ${this.allComplexes.find((c) => c.id === st.complexId)?.name}에서 자재비 인상 전액 부담 약정으로 인해 마진이 추가 악화되었습니다.`,
            type: 'DANGER',
          });
        }
      }
    });
  }
}
