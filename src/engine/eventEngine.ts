import { GameState, MarketEvent } from '../types/game';
import { MARKET_EVENTS_POOL } from '../data/events';
import { SeededRNG } from './rng';

export class EventEngine {
  private rng: SeededRNG;

  constructor(rng?: SeededRNG) {
    this.rng = rng || new SeededRNG();
  }

  // 매 턴 시장 사건 발동 여부 판정 (약 45% 확률로 시장 사건 발생)
  public evaluateTurnEvents(gameState: GameState): MarketEvent[] {
    const triggeredEvents: MarketEvent[] = [];

    // 특정 턴 특별 이벤트 고정 발동 (예: 5턴, 11턴, 17턴 등)
    const isSpecialTurn = [4, 9, 14, 19].includes(gameState.currentTurn);
    const triggerChance = isSpecialTurn ? 0.85 : 0.40;

    if (this.rng.chance(triggerChance)) {
      const template = this.rng.choice(MARKET_EVENTS_POOL);

      const event: MarketEvent = {
        ...template,
        id: `event_t${gameState.currentTurn}_${Date.now()}`,
        turn: gameState.currentTurn,
      };

      triggeredEvents.push(event);
      this.applyEventEffect(event, gameState);
    }

    return triggeredEvents;
  }

  // 사건 효과를 게임 상태에 직접 반영
  private applyEventEffect(event: MarketEvent, gameState: GameState): void {
    const { effect } = event;

    // 1. 단지 일정 변경 (패스트트랙 or 지연)
    if (event.relatedComplexId && (effect.advanceTurns || effect.delayTurns)) {
      const bState = gameState.complexStates[event.relatedComplexId];
      if (bState && bState.currentStage !== 'contracted') {
        if (effect.advanceTurns) {
          // 다음 단계로 조기 진입
          bState.monthsInStage += effect.advanceTurns;
        }
        if (effect.delayTurns) {
          // 단계 지연
          bState.monthsInStage = Math.max(0, bState.monthsInStage - effect.delayTurns);
        }
      }
    }

    // 2. 경쟁사 신용등급/평판 타격
    if (effect.reputationHitAmount) {
      // 랜덤 경쟁사 한 곳 선정
      const rivalIds = Object.keys(gameState.competitorStates);
      if (rivalIds.length > 0) {
        const victimId = this.rng.choice(rivalIds);
        const comp = gameState.competitorStates[victimId];
        if (comp) {
          comp.reputation = Math.max(20, comp.reputation - effect.reputationHitAmount);
          // 해당 경쟁사의 모든 단지 지지율 일괄 하락
          Object.values(gameState.complexStates).forEach((st) => {
            if (st.supportScores[victimId]) {
              st.supportScores[victimId].totalFavorability = Math.max(
                10,
                st.supportScores[victimId].totalFavorability - 12
              );
            }
          });
        }
      }
    }
  }
}
