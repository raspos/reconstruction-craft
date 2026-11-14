import {
  ComplexData,
  ComplexStage,
  CompanyData,
  GameState,
  PlayerTarget,
  SalesAction,
  ComplexBiddingState,
  GameEnding,
} from '../types/game';
import { RAW_COMPLEX_DATA } from '../data/complexes';
import { CONSTRUCTION_COMPANIES } from '../data/companies';
import { SALES_ACTIONS } from '../data/actions';
import { SeededRNG } from './rng';
import { calculateFavorability } from './favorabilityEngine';
import { AICompetitorEngine } from './aiCompetitorEngine';
import { EventEngine } from './eventEngine';
import { RumorEngine } from './rumorEngine';
import { EndingEngine } from './endingEngine';

export class GameEngine {
  private state: GameState;
  private rng: SeededRNG;
  private aiEngine: AICompetitorEngine;
  private eventEngine: EventEngine;
  private rumorEngine: RumorEngine;
  public allComplexes: ComplexData[];

  constructor(
    playerCompanyId: string = 'taeseong',
    gameMode: 'FULL_24' | 'FAST_12' = 'FULL_24',
    seed: number = Date.now(),
    targetOption?: PlayerTarget
  ) {
    this.rng = new SeededRNG(seed);
    this.aiEngine = new AICompetitorEngine(this.rng);
    this.eventEngine = new EventEngine(this.rng);
    this.rumorEngine = new RumorEngine(this.rng);
    this.allComplexes = JSON.parse(JSON.stringify(RAW_COMPLEX_DATA));

    this.state = this.initializeGameState(playerCompanyId, gameMode, targetOption);
  }

  // 초기 게임 상태 생성
  private initializeGameState(
    playerCompanyId: string,
    gameMode: 'FULL_24' | 'FAST_12',
    targetOption?: PlayerTarget
  ): GameState {
    const totalTurns = gameMode === 'FULL_24' ? 24 : 12;
    const playerCompany =
      CONSTRUCTION_COMPANIES.find((c) => c.id === playerCompanyId) ||
      CONSTRUCTION_COMPANIES[0];

    // 목표 설정이 없을 경우 회사의 기본 시공 캐파에 비례한 기본 목표 부여
    const defaultTarget: PlayerTarget = targetOption || {
      targetVolume: Math.round(playerCompany.attributes.capa * 0.8),
      targetLabel: `${(Math.round(playerCompany.attributes.capa * 0.8) / 10000).toFixed(1)}조원 (균형 목표)`,
      riskMultiplier: 1.0,
    };

    // 15개 단지 수주전 초기 상태 구성
    const complexStates: Record<number, ComplexBiddingState> = {};
    this.allComplexes.forEach((complex) => {
      // 턴 스케일 조정 (12턴 모드인 경우 시작 턴 압축)
      const adjustedStartTurn =
        gameMode === 'FAST_12' ? Math.max(1, Math.ceil(complex.startTurn / 2)) : complex.startTurn;
      complex.startTurn = adjustedStartTurn;

      const supportScores: ComplexBiddingState['supportScores'] = {};

      CONSTRUCTION_COMPANIES.forEach((comp) => {
        // 단지 성향과 회사 속성에 기반한 초기 지지율 계산
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

        supportScores[comp.id] = {
          generalSupport: 50,
          execSupport: 40,
          brandPerception: comp.attributes.brand,
          costOfferedMarginDelta: 0,
          financeOffered: comp.attributes.finance,
          trustScore: 70,
          hasBid: false,
          isWithdrawn: false,
          totalFavorability: initialFavor.totalFavorability,
        };
      });

      complexStates[complex.id] = {
        complexId: complex.id,
        currentStage: complex.startTurn === 1 ? complex.stage : 'interest',
        monthsInStage: 0,
        supportScores,
        winnerId: null,
        isSoleBid: false,
        isRebid: false,
        negotiatedContract: false,
        contractPrice: complex.expectedCost,
        finalProfitMargin: complex.baseExpectedProfitMargin,
      };
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
      complexStates,
      competitorStates,
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

    const mySupport = bState.supportScores[this.state.playerCompanyId];

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
      mySupport.totalFavorability = Math.min(
        99,
        mySupport.totalFavorability + action.effect.favorabilityBoost
      );
    }
    if (action.effect.brandImpression) {
      mySupport.brandPerception = Math.min(100, mySupport.brandPerception + action.effect.brandImpression);
    }
    if (action.effect.marginDelta) {
      mySupport.costOfferedMarginDelta += action.effect.marginDelta;
      if (action.effect.marginDelta < 0) {
        // 공사비 덤핑 관측 -> AI 메모리에 기록
        Object.values(this.state.competitorStates).forEach((comp) => {
          comp.strategyMemory.playerPriceCutObserved += 1;
        });
        // CFO의 경계
        this.state.cfoTrust = Math.max(10, this.state.cfoTrust - 8);
      }
    }
    if (action.effect.executiveTrust) {
      mySupport.execSupport = Math.min(100, mySupport.execSupport + action.effect.executiveTrust);
    }
    if (action.effect.intelGain) {
      // 해당 단지 소문 즉시 검증
      this.state.rumors.forEach((r) => {
        if (r.relatedComplexId === complexId) r.investigated = true;
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
      : `${action.name} 실행 완료: ${complex.name} 지지율 상승`;

    return { success: true, message: statusMsg, scandalTriggered };
  }

  // 턴 종료 및 다음 달 진행 (AI 연산, 총회 표결, 단지 단계 진행, 사건/소문 갱신)
  public nextTurn(): { newEvents: any[]; contractsSigned: any[] } {
    if (this.state.isGameOver) return { newEvents: [], contractsSigned: [] };

    const contractsSigned: Array<{ complexName: string; winnerName: string; price: number }> = [];

    // 1. 경쟁사 AI 의사결정 및 행동 실행
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
        }
      });
    });

    // 2. 단지별 수주 단계 진행 및 시공사 선정 총회 처리
    this.allComplexes.forEach((complex) => {
      const bState = this.state.complexStates[complex.id];
      if (!bState || bState.currentStage === 'contracted' || bState.winnerId) return;

      // 해당 단지가 아직 시작 턴에 도달하지 않은 경우
      if (complex.startTurn > this.state.currentTurn) return;

      bState.monthsInStage += 1;

      // 단계별 진행 임계 시간 (월 단위)
      const stageDurationMap: Record<ComplexStage, number> = {
        interest: 2,
        pre_sales: 3,
        bidding_prep: 2,
        bidding: 2,
        selection: 1,
        contracted: 999,
      };

      // 다음 단계로 진입
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
          // 시공사 선정 총회 표결
          // ==============================
          this.resolveSelectionAssembly(complex, bState, contractsSigned);
        }
      }
    });

    // 3. 시장 사건(돌발 위기) 발생 판정
    const newEvents = this.eventEngine.evaluateTurnEvents(this.state);
    this.state.lastTurnEvents = newEvents;
    this.state.eventsHistory.push(...newEvents);

    // 4. 신규 업계 소문 생성
    this.state.rumors = this.rumorEngine.generateTurnRumors(this.state.currentTurn + 1);

    // 5. 플레이어 자원 회복 및 평가 지표 갱신
    const playerCompany =
      CONSTRUCTION_COMPANIES.find((c) => c.id === this.state.playerCompanyId) ||
      CONSTRUCTION_COMPANIES[0];
    this.state.availableAP = playerCompany.startingAP;
    this.state.actionsTakenThisTurn = [];

    // CFO/CEO 만족도 동적 계산
    if (this.state.usedCapa > this.state.maxCapa) {
      this.state.cfoTrust = Math.max(10, this.state.cfoTrust - 12);
    }

    // 턴 전진
    this.state.currentTurn += 1;

    // 게임 종료 판정 (24턴 또는 12턴 도달 시)
    if (this.state.currentTurn > this.state.totalTurns) {
      this.state.isGameOver = true;
      const evaluation = EndingEngine.evaluateGame(this.state, this.allComplexes);
      this.state.selectedEnding = evaluation.ending;
    }

    return { newEvents, contractsSigned };
  }

  // 시공사 선정 총회 투표 및 계약 체결 처리
  private resolveSelectionAssembly(
    complex: ComplexData,
    bState: ComplexBiddingState,
    contractsSigned: Array<{ complexName: string; winnerName: string; price: number }>
  ): void {
    // 유효 입찰자 목록 (철수하지 않고 최소 20점 이상의 호감도를 보유한 회사)
    const activeCandidates = Object.entries(bState.supportScores)
      .filter(([, s]) => !s.isWithdrawn && s.totalFavorability > 10)
      .map(([compId, s]) => ({ compId, favorability: s.totalFavorability }));

    if (activeCandidates.length === 0) {
      // 아무도 입찰하지 않아 유찰 -> 다음 턴에 재입찰 진행
      bState.isRebid = true;
      bState.currentStage = 'bidding';
      bState.monthsInStage = 0;
      this.state.turnLogs.push({
        turn: this.state.currentTurn,
        message: `[유찰] ${complex.name} 시공사 입찰이 무응찰로 유찰되어 재입찰 공고가 진행됩니다.`,
        type: 'WARNING',
      });
      return;
    }

    // 단독 입찰(Sole Bid) 처리 규칙:
    // 첫 단독 입찰 시 65% 확률로 유찰 후 재입찰 진행, 35% 확률로 수의계약 전환
    // 이미 재입찰(isRebid) 상태에서 단독 입찰인 경우 100% 수의계약 체결
    if (activeCandidates.length === 1) {
      const soleCandidate = activeCandidates[0];
      if (!bState.isRebid && this.rng.chance(0.65)) {
        bState.isRebid = true;
        bState.isSoleBid = true;
        bState.currentStage = 'bidding';
        bState.monthsInStage = 0;
        this.state.turnLogs.push({
          turn: this.state.currentTurn,
          message: `[단독 입찰 유찰] ${complex.name}에 한 개 사만 응찰하여 규정에 따라 재입찰에 부칩니다.`,
          type: 'INFO',
        });
        return;
      }
      // 수의계약 체결
      bState.negotiatedContract = true;
      bState.winnerId = soleCandidate.compId;
      bState.currentStage = 'contracted';
    } else {
      // 2개 사 이상 경쟁 투표 (호감도 비율 + 약간의 총회 현장 투표 변동성)
      activeCandidates.sort(
        (a, b) => b.favorability + this.rng.range(-5, 5) - (a.favorability + this.rng.range(-5, 5))
      );
      bState.winnerId = activeCandidates[0].compId;
      bState.currentStage = 'contracted';
    }

    const winnerCompany = CONSTRUCTION_COMPANIES.find((c) => c.id === bState.winnerId);
    const winnerName = winnerCompany ? winnerCompany.name : '미상';

    // 캐파 반영 및 실적 기록
    if (bState.winnerId === this.state.playerCompanyId) {
      this.state.usedCapa += complex.expectedCost;
      this.state.ceoTrust = Math.min(100, this.state.ceoTrust + 15);
      this.state.turnLogs.push({
        turn: this.state.currentTurn,
        message: `[수주 쾌거!!] 가온 신시가지 ${complex.name}(공사비 ${(complex.expectedCost / 10000).toFixed(1)}조원) 시공권을 전격 확보했습니다!`,
        type: 'SUCCESS',
      });
    } else if (bState.winnerId) {
      const comp = this.state.competitorStates[bState.winnerId];
      if (comp) {
        comp.usedCapa += complex.expectedCost;
        comp.wonComplexIds.push(complex.id);
        comp.totalWonVolume += complex.expectedCost;
      }
      this.state.turnLogs.push({
        turn: this.state.currentTurn,
        message: `[수주 결과] ${complex.name}의 시공권은 ${winnerName}에게 돌아갔습니다.`,
        type: 'INFO',
      });
    }

    contractsSigned.push({
      complexName: complex.name,
      winnerName,
      price: complex.expectedCost,
    });
  }
}
