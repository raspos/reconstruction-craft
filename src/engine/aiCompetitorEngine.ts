import { ComplexData, ComplexBiddingState, CompanyData, GameState } from '../types/game';
import { SeededRNG } from './rng';
import { calculateFavorability } from './favorabilityEngine';

export interface AIActionDecision {
  companyId: string;
  complexId: number;
  decisionType: 'BID_PUSH' | 'PRICE_ATTACK' | 'FINANCE_PUSH' | 'WITHDRAW' | 'OBSERVE';
  reason: string;
  marginAdjustment?: number;
  supportBoost?: number;
  costSpent: number;
}

export class AICompetitorEngine {
  private rng: SeededRNG;

  constructor(rng?: SeededRNG) {
    this.rng = rng || new SeededRNG();
  }

  // 매 턴 각 AI 건설사의 최적 행동을 산출
  public evaluateCompanyTurn(
    company: CompanyData,
    gameState: GameState,
    allComplexes: ComplexData[]
  ): AIActionDecision[] {
    const decisions: AIActionDecision[] = [];
    const compState = gameState.competitorStates[company.id];
    if (!compState) return decisions;

    // 회사의 남은 시공 캐파 확인
    const remainingCapa = company.attributes.capa - compState.usedCapa;
    if (remainingCapa < 12000) {
      // 캐파 소진 상태: 추가 수주 자제
      return decisions;
    }

    // 현재 입찰 가능하거나 수주전이 진행 중인 단지들 필터링
    const activeComplexes = allComplexes.filter((c) => {
      const state = gameState.complexStates[c.id];
      return (
        state &&
        state.currentStage !== 'contracted' &&
        c.startTurn <= gameState.currentTurn &&
        !state.winnerId
      );
    });

    for (const complex of activeComplexes) {
      const bState = gameState.complexStates[complex.id];
      const mySupportData = bState.supportScores[company.id];
      const playerSupportData = bState.supportScores[gameState.playerCompanyId];

      if (mySupportData?.isWithdrawn) continue;

      // 1. 전략 성향에 따른 단지 선호도 점수 산출
      const preference = this.calculateComplexPreference(
        company,
        complex,
        gameState,
        remainingCapa
      );

      // 선호도가 낮으면 관망
      if (preference < 25) continue;

      // 2. 현재 내 지지율 vs 1위 후보 지지율 비교
      const allScores = Object.entries(bState.supportScores)
        .filter(([, s]) => !s.isWithdrawn)
        .map(([id, s]) => ({ id, score: s.totalFavorability }));

      const highestOther = allScores
        .filter((item) => item.id !== company.id)
        .reduce((max, item) => (item.score > max ? item.score : max), 0);

      const myScore = mySupportData?.totalFavorability || 30;

      // 3. 압도적 열세 시 전략적 철수 판단 (무경쟁 수주 형성 원리)
      if (
        (bState.currentStage === 'bidding_prep' || bState.currentStage === 'bidding') &&
        highestOther >= 78 &&
        myScore <= 35 &&
        complex.expectedCost > remainingCapa * 0.7
      ) {
        // 승산이 없고 캐파 부담이 크면 철수 결정
        decisions.push({
          companyId: company.id,
          complexId: complex.id,
          decisionType: 'WITHDRAW',
          reason: `${highestOther}%의 압도적 1위에 맞서 불필요한 예산 낭비를 막고 전략적 철수 결정`,
          costSpent: 0,
        });
        continue;
      }

      // 4. 플레이어 기억에 따른 카운터 전략 반영
      const playerMemory = compState.strategyMemory;
      const playerDumpsPrice = playerMemory.playerPriceCutObserved >= 2;

      // 5. 행동 결정 (성향 및 승률 고려)
      if (bState.currentStage === 'bidding') {
        // 본 입찰 단계
        if (myScore < highestOther && myScore >= 45) {
          // 접전 중 역전 시도
          if (company.personality === 'finance_fighter' || (playerDumpsPrice && company.attributes.finance > 85)) {
            decisions.push({
              companyId: company.id,
              complexId: complex.id,
              decisionType: 'FINANCE_PUSH',
              reason: '플레이어의 저가 공세에 맞서 파격 금융 패키지(이주비 무이자)로 역전 시도',
              supportBoost: this.rng.range(12, 18),
              marginAdjustment: -0.4,
              costSpent: 12,
            });
          } else if (company.personality === 'profit_conservative' && complex.riskLevel === 'HIGH') {
            // 보수형은 고위험 단지에서 무리하지 않고 관망
            decisions.push({
              companyId: company.id,
              complexId: complex.id,
              decisionType: 'OBSERVE',
              reason: '사업 위험도가 높아 추가 출혈을 자제하고 기본 조건 유지',
              costSpent: 0,
            });
          } else if (company.attributes.costComp >= 80 && myScore <= highestOther - 8) {
            // 원가 우위 건설사의 기습 공사비 인하
            decisions.push({
              companyId: company.id,
              complexId: complex.id,
              decisionType: 'PRICE_ATTACK',
              reason: '강력한 원가 통제력을 바탕으로 공사비 인하 견적서를 기습 투척',
              supportBoost: this.rng.range(14, 20),
              marginAdjustment: -0.8,
              costSpent: 10,
            });
          } else {
            decisions.push({
              companyId: company.id,
              complexId: complex.id,
              decisionType: 'BID_PUSH',
              reason: '총회 표결을 앞두고 총력 홍보전 가동',
              supportBoost: this.rng.range(8, 14),
              costSpent: 8,
            });
          }
        }
      } else {
        // 사전 영업 / 입찰 준비 단계
        if (preference >= 55 && compState.budget >= 15) {
          decisions.push({
            companyId: company.id,
            complexId: complex.id,
            decisionType: 'BID_PUSH',
            reason: `목표 단지(${complex.name})의 사전 표심 확보를 위한 현장 영업 개시`,
            supportBoost: this.rng.range(6, 12),
            costSpent: 5,
          });
        }
      }
    }

    return decisions;
  }

  // 성향별 단지 선호도 산출
  private calculateComplexPreference(
    company: CompanyData,
    complex: ComplexData,
    gameState: GameState,
    remainingCapa: number
  ): number {
    // 1. 배제/기피 단지 또는 캐파 초과 시 원천 배제
    if (company.avoidedComplexIds?.includes(complex.id)) {
      return 0; // 입찰 기피 단지
    }

    if (complex.expectedCost > remainingCapa * 0.9) {
      return 0; // 캐파 한계 초과
    }

    // 2. 이미 수주한 단지 수가 많으면 추가 수주 욕구 대폭 감소 (반독점 밸런스)
    const compState = gameState.competitorStates[company.id];
    const wonCount = compState?.wonComplexIds.length || 0;
    if (wonCount >= 2) {
      return 0; // 2건 이상 수주 시 자사 리스크 관리로 신규 입찰 전면 중단
    }

    // 기본 점수: 지정된 주력 타깃 단지 여부에 따른 차등
    const isTarget = company.targetComplexIds.includes(complex.id);
    let score = isTarget ? 65 : 25;

    if (wonCount === 1) {
      score -= 20; // 1건 수주 후에는 입찰 기준이 대폭 엄격해짐
    }

    switch (company.personality) {
      case 'landmark_obsessed': // 7단지, 14단지 등 대형 랜드마크 집착
        if (complex.plannedUnits >= 4000) score += 35;
        if (complex.id === 7 || complex.id === 14) score += 30;
        break;

      case 'profit_conservative': // 안정적 마진 및 저위험 선호
        if (complex.baseExpectedProfitMargin >= 5.2) score += 30;
        if (complex.riskLevel === 'LOW') score += 20;
        if (complex.riskLevel === 'EXTREME') score -= 40;
        break;

      case 'small_medium_focus': // 4, 8, 11, 15단지 등 중소형 알짜 집중
        if (complex.plannedUnits <= 3000) score += 35;
        if (complex.id === 15 || complex.id === 8 || complex.id === 4) score += 30;
        if (complex.expectedCost >= 25000) score -= 40;
        break;

      case 'finance_fighter': // 금융 민감 단지 선호
        score += complex.sentimentProfile.financeWeight * 0.8;
        if (complex.id === 2 || complex.id === 12 || complex.id === 15) score += 30;
        break;

      case 'blocker_rivalry': // 플레이어 주력 단지 견제
        const playerSupp =
          gameState.complexStates[complex.id]?.supportScores[gameState.playerCompanyId]?.totalFavorability || 0;
        if (playerSupp >= 50 && playerSupp <= 75) score += 35;
        break;

      case 'aggressive_expansion': // 물불 가리지 않고 수주량 확대
        score += 20;
        break;

      case 'opportunist': // 브랜드 효과가 좋거나 경쟁이 느슨한 곳
        score += complex.sentimentProfile.brandWeight * 0.5;
        break;

      case 'stable_manager': // 1, 6단지 등 분쟁 적은 곳
        if (complex.riskLevel === 'LOW') score += 25;
        break;
    }

    return score;
  }
}
