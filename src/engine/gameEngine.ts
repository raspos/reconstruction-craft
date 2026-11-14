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
    gameMode: 'FULL_24' | 'FAST_12' = 'FULL_24',
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
    gameMode: 'FULL_24' | 'FAST_12',
    targetOption?: PlayerTarget,
    scheduleMasterplanId: ScheduleMasterplanId = 'STANDARD'
  ): GameState {
    const totalTurns = gameMode === 'FULL_24' ? 24 : 12;
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
        const initialFavor = calculateFavorability({
          company: comp,
          complex,
          generalSupportBase: 45 + this.rng.range(-10, 10),
          execSupportBase: 40 + this.rng.range(-15, 15),
          brandPerceptionBase: comp.attributes.brand,
          costOfferedMarginDelta: 0,
          financeOfferedScore: comp.attributes.finance,
          trustScore: 70,
        });

        // 경쟁사 초기 숨겨진 입찰 의지 (30 ~ 80)
        const hiddenIntent = Math.min(
          95,
          Math.max(20, Math.round(comp.attributes.brand * 0.4 + comp.attributes.salesOrg * 0.4 + this.rng.range(-15, 15)))
        );

        const initialActions: ObservableCompetitorAction[] = [];
        if (complex.startTurn === 1 && comp.id !== playerCompanyId && hiddenIntent >= 40) {
          initialActions.push({
            type: 'BANNER_AD',
            turn: 1,
            description: `${comp.name} 브랜드 환영 현수막 및 안내문 부착`,
            sincerityWeight: 0.3,
          });
        }

        supportScores[comp.id] = {
          hiddenBidIntent: hiddenIntent,
          observableActions: initialActions,
          estimatedBidChance: Math.min(95, Math.max(15, hiddenIntent + this.rng.range(-15, 15))),
          intelReliability: 'LOW',
          isWithdrawn: false,
          hasBid: false,
          totalFavorability: initialFavor.totalFavorability,
          brandPerception: comp.attributes.brand,
          costOfferedMarginDelta: 0,
          financeOffered: comp.attributes.finance,
          execSupport: 40,
          trustScore: 70,
        };
      });

      complexStates[complex.id] = {
        complexId: complex.id,
        currentStage: complex.startTurn === 1 ? complex.stage : 'interest',
        monthsInStage: 0,
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

        if (dec.decisionType === 'WITHDRAW') {
          myScore.isWithdrawn = true;
          myScore.totalFavorability = 0;
          this.state.turnLogs.push({
            turn: this.state.currentTurn,
            message: `[경쟁사 철수] ${company.name}이(가) ${this.allComplexes.find((c) => c.id === dec.complexId)?.name}에서 전략적으로 발을 뺐습니다.`,
            type: 'INFO',
          });
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

      const stageDurationMap: Record<ComplexStage, number> = {
        interest: 2,
        pre_sales: 3,
        bidding_prep: 2,
        bidding: 2,
        selection: 1,
        contracted: 999,
      };

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

    // 5. 신규 업계 소문 생성
    this.state.rumors = this.rumorEngine.generateTurnRumors(this.state.currentTurn + 1);

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
    const playerParticipates =
      !bState.supportScores[this.state.playerCompanyId]?.isWithdrawn &&
      (bState.playerProposal !== undefined ||
        bState.supportScores[this.state.playerCompanyId]?.hasBid ||
        bState.supportScores[this.state.playerCompanyId]?.totalFavorability >= 25);

    const voteResult = simulateGeneralAssemblyVote(
      complex,
      bState,
      CONSTRUCTION_COMPANIES,
      this.state.playerCompanyId,
      playerParticipates,
      bState.playerProposal,
      bState.consortiumPartnerId
    );

    bState.winnerId = voteResult.winnerId;
    bState.winnerIsConsortium = voteResult.winnerIsConsortium;
    bState.isSoleBid = voteResult.isSoleBid;
    bState.isRebid = voteResult.isRebid;
    bState.negotiatedContract = voteResult.negotiatedContract;
    bState.contractPrice = voteResult.contractPrice;
    bState.finalProfitMargin = voteResult.finalProfitMargin;

    if (voteResult.isRebid) {
      // 유찰 -> 다시 입찰 진행 단계로 복귀
      bState.currentStage = 'bidding';
      bState.monthsInStage = 0;
      this.state.turnLogs.push({
        turn: this.state.currentTurn,
        message: `[입찰 유찰] ${voteResult.assemblySummary} (사유: ${voteResult.keyVoteFactor})`,
        type: 'WARNING',
      });
      return;
    }

    // 계약 완료 처리
    bState.currentStage = 'contracted';
    const winnerName = voteResult.winnerName || '미상';

    // 사후 계약 관리 객체 초기화
    bState.contractFulfillment = {
      originalAgreedMargin: voteResult.finalProfitMargin,
      currentExpectedMargin: voteResult.finalProfitMargin,
      delayMonths: 0,
      unresolvedDisputes: 0,
    };

    if (voteResult.winnerId === this.state.playerCompanyId) {
      this.state.usedCapa += complex.expectedCost;
      this.state.ceoTrust = Math.min(100, this.state.ceoTrust + 15);
      if (voteResult.finalProfitMargin < 2.0) {
        this.state.cfoTrust = Math.max(10, this.state.cfoTrust - 10);
      } else {
        this.state.cfoTrust = Math.min(100, this.state.cfoTrust + 8);
      }

      this.state.turnLogs.push({
        turn: this.state.currentTurn,
        message: `[수주 승리!] ${voteResult.assemblySummary}`,
        type: 'SUCCESS',
      });
    } else if (voteResult.winnerId) {
      const comp = this.state.competitorStates[voteResult.winnerId];
      if (comp) {
        comp.usedCapa += complex.expectedCost;
        comp.wonComplexIds.push(complex.id);
        comp.totalWonVolume += complex.expectedCost;
      }
      this.state.turnLogs.push({
        turn: this.state.currentTurn,
        message: `[수주 결과] ${complex.name}의 시공권은 ${winnerName}에게 돌아갔습니다. (${voteResult.keyVoteFactor})`,
        type: 'INFO',
      });
    }

    contractsSigned.push({
      complexName: complex.name,
      winnerName,
      price: voteResult.contractPrice,
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
