import { ComplexData, ComplexBiddingState, GameState, UnionStrategicAction } from '../types/game';
import { SeededRNG } from './rng';
import { CONSTRUCTION_COMPANIES } from '../data/companies';

// 조합 AI (Union AI) 의사결정 엔진
// 조합은 단순한 피동적 수용자가 아니라, 건설사 간 경쟁을 유도하고 실리를 극대화하기 위해 심리전을 벌이는 독립된 AI 행위자

export class UnionAIEngine {
  private rng: SeededRNG;

  constructor(rng?: SeededRNG) {
    this.rng = rng || new SeededRNG();
  }

  // 매 턴 각 활성 단지별 조합의 전략적 대응 및 공식 입장 발표
  public evaluateTurn(
    complex: ComplexData,
    bState: ComplexBiddingState,
    gameState: GameState
  ): UnionStrategicAction | null {
    if (bState.currentStage === 'contracted' || bState.winnerId) return null;
    if (complex.startTurn > gameState.currentTurn) return null;

    // 현재 입찰 후보사들의 지지율 분석
    const candidates = Object.entries(bState.supportScores)
      .filter(([, s]) => !s.isWithdrawn)
      .map(([id, s]) => ({ id, favorability: s.totalFavorability, stance: s }))
      .sort((a, b) => b.favorability - a.favorability);

    const leader = candidates[0];
    const runnerUp = candidates[1];
    const personality = complex.unionPersonality;

    // 1. [경쟁 유도형 or 강경 협상형] 독점 우세 방지 및 경쟁사 추가 참여 독려
    // 1위 후보가 너무 압도적(>= 75%)이고 2위와 격차가 25% 이상 벌어지면, 조합이 위기감을 느끼고 타 사 진입을 공개 독려함
    if (
      leader &&
      leader.favorability >= 74 &&
      (!runnerUp || leader.favorability - runnerUp.favorability >= 25) &&
      (personality === 'competition_driver' || personality === 'hard_bargainer' || this.rng.chance(0.45))
    ) {
      const leaderComp = CONSTRUCTION_COMPANIES.find((c) => c.id === leader.id);
      const action: UnionStrategicAction = {
        turn: gameState.currentTurn,
        type: 'ENCOURAGE_COMPETITOR',
        title: `[조합 성명] ${complex.name} "단독 독점 방지, 타 대형사 입찰 적극 환영"`,
        message: `조합 집행부는 특정 시공사(${leaderComp?.name || '유력사'})의 단독 질주로 인한 공사비 협상력 저하를 우려하여, 타 1군 건설사들의 적극적인 현장설명회 참여와 대안 제안을 공식 요청했습니다.`,
        targetCompanyId: leader.id,
        effectDescription: '경쟁사들의 해당 단지 입찰 의지 +15 상승, 선두 시공사의 지지율 일시적 -5%p 조정',
      };
      bState.recentUnionMessage = action.message;
      return action;
    }

    // 2. [실리 추구형 or 강경 협상형] 공사비 인하 및 추가 마감재 요구
    if (
      (personality === 'pragmatic_profit' || personality === 'hard_bargainer') &&
      bState.currentStage === 'bidding_prep' &&
      this.rng.chance(0.35)
    ) {
      const action: UnionStrategicAction = {
        turn: gameState.currentTurn,
        type: 'DEMAND_PRICE_CUT',
        title: `[조합 공문] ${complex.name} 조합 "평당 공사비 3.3㎡당 30만원 추가 절감 요구"`,
        message: `조합 대의원회는 최근 건설 원자재 가격 안정세를 근거로 입찰 참여 희망사들에게 평당 공사비 인하 및 무상 옵션 확대를 공식 지침으로 전달했습니다.`,
        effectDescription: '공사비 인하 제안서 제출 시 가산점 부여, 고가 브랜드 고수 시 지지율 감점',
      };
      bState.recentUnionMessage = action.message;
      return action;
    }

    // 3. [브랜드 중시형] 하이엔드 독점 브랜드 및 입면 특화 가이드라인 하달
    if (
      personality === 'brand_centric' &&
      (bState.currentStage === 'pre_sales' || bState.currentStage === 'bidding_prep') &&
      this.rng.chance(0.4)
    ) {
      const action: UnionStrategicAction = {
        turn: gameState.currentTurn,
        type: 'STRENGTHEN_DESIGN',
        title: `[조합 가이드] ${complex.name} "일반 서브 브랜드 거부, 최상위 하이엔드 필수"`,
        message: `조합원 총의에 따라 자산 가치 극대화를 위해 각 사의 최상위 하이엔드 독점 브랜드를 내걸지 않는 시공사의 입찰서는 접수하지 않겠다고 경고했습니다.`,
        effectDescription: '하이엔드 브랜드 제안 시 지지율 +20%p 보너스, 일반 브랜드 감점',
      };
      bState.recentUnionMessage = action.message;
      return action;
    }

    // 4. [빠른 사업 추진형] 신속 사업 인허가 패스트트랙 및 입찰 단축
    if (
      personality === 'fast_track' &&
      bState.currentStage === 'pre_sales' &&
      this.rng.chance(0.3)
    ) {
      const action: UnionStrategicAction = {
        turn: gameState.currentTurn,
        type: 'SCHEDULE_CHANGE',
        title: `[일정 공고] ${complex.name} 시공사 선정 총회 1개월 조기 추진`,
        message: `조합원들의 신속 이주 염원에 따라 신통기획 인허가를 당겨 본 입찰 및 총회 일정을 1개월 앞당기기로 의결했습니다.`,
        effectDescription: '수주전 단계 조기 전환 (스피드 우수 건설사 유리)',
      };
      bState.monthsInStage += 1;
      bState.recentUnionMessage = action.message;
      return action;
    }

    // 5. [내부 갈등형] 비대위의 시공사 유착 의혹 제기 및 일정 지연
    if (
      personality === 'internal_feud' &&
      this.rng.chance(0.25)
    ) {
      const action: UnionStrategicAction = {
        turn: gameState.currentTurn,
        type: 'PUBLIC_WARNING',
        title: `[비대위 성명] ${complex.name} "특정 건설사 사전 유착 의혹 철저 감사 촉구"`,
        message: `비대위에서 집행부와 특정 건설사 간의 사전 내통설을 주장하며 총회 효력정지 가처분을 예고해 단지 내 갈등이 최고조에 달했습니다.`,
        effectDescription: '부동층 비율 15%p 증가, 로비 진행사 적발 리스크 급증',
      };
      bState.recentUnionMessage = action.message;
      return action;
    }

    return null;
  }
}
