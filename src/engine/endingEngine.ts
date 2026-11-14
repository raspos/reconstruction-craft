import { GameEnding, GameState, ComplexData } from '../types/game';
import { GAME_ENDINGS } from '../data/endings';
import { calculateProjectProfit } from './profitEngine';

export interface CompanyPerformanceSummary {
  companyId: string;
  totalWonVolume: number;      // 총 수주액 (억원)
  wonCount: number;            // 수주 단지 수
  wonComplexIds: number[];
  totalExpectedProfit: number; // 총 위험조정 영업이익 (억원)
  avgMarginPercent: number;    // 평균 영업이익률 (%)
  volumeRank: number;          // 수주액 순위 (1~8위)
  profitRank: number;          // 영업이익 순위 (1~8위)
}

export interface FinalGameEvaluation {
  ending: GameEnding;
  playerSummary: CompanyPerformanceSummary;
  allCompanyRankings: CompanyPerformanceSummary[];
  targetVolume: number;
  targetAchievementRate: number; // 달성률 (%)
  evaluationNarrative: {
    targetComparisonText: string;
    profitRankText: string;
    executiveVerdictText: string;
  };
}

export class EndingEngine {
  public static evaluateGame(
    gameState: GameState,
    allComplexes: ComplexData[]
  ): FinalGameEvaluation {
    const complexMap = new Map(allComplexes.map((c) => [c.id, c]));

    // 1. 모든 회사별 최종 실적 집계
    const companySummaries: Record<string, CompanyPerformanceSummary> = {};

    // 플레이어 회사 등록
    const playerWonComplexes: number[] = [];
    let playerWonVolume = 0;
    let playerWonProfit = 0;

    Object.entries(gameState.complexStates).forEach(([cIdStr, st]) => {
      const cId = Number(cIdStr);
      const complex = complexMap.get(cId);
      if (!complex) return;

      if (st.winnerId === gameState.playerCompanyId) {
        playerWonComplexes.push(cId);
        playerWonVolume += complex.expectedCost;
        const profit = calculateProjectProfit(
          complex,
          st.supportScores[gameState.playerCompanyId]?.costOfferedMarginDelta || 0,
          0
        );
        playerWonProfit += profit.riskAdjustedProfit;
      }
    });

    // 플레이어의 실제 사용된 영업비용 차감
    playerWonProfit = Math.max(0, playerWonProfit - gameState.totalSalesCostSpent);

    companySummaries[gameState.playerCompanyId] = {
      companyId: gameState.playerCompanyId,
      totalWonVolume: playerWonVolume,
      wonCount: playerWonComplexes.length,
      wonComplexIds: playerWonComplexes,
      totalExpectedProfit: playerWonProfit,
      avgMarginPercent:
        playerWonVolume > 0
          ? Number(((playerWonProfit / playerWonVolume) * 100).toFixed(2))
          : 0,
      volumeRank: 1,
      profitRank: 1,
    };

    // 경쟁사별 실적 집계
    Object.entries(gameState.competitorStates).forEach(([compId, cState]) => {
      let compVolume = 0;
      let compProfit = 0;

      cState.wonComplexIds.forEach((cId) => {
        const complex = complexMap.get(cId);
        if (complex) {
          compVolume += complex.expectedCost;
          const profit = calculateProjectProfit(complex, 0, 0);
          compProfit += profit.riskAdjustedProfit;
        }
      });

      companySummaries[compId] = {
        companyId: compId,
        totalWonVolume: compVolume,
        wonCount: cState.wonComplexIds.length,
        wonComplexIds: cState.wonComplexIds,
        totalExpectedProfit: compProfit,
        avgMarginPercent:
          compVolume > 0
            ? Number(((compProfit / compVolume) * 100).toFixed(2))
            : 0,
        volumeRank: 1,
        profitRank: 1,
      };
    });

    // 순위 계산 (수주액 기준 & 영업이익 기준)
    const list = Object.values(companySummaries);

    // 수주액 순 정렬
    list.sort((a, b) => b.totalWonVolume - a.totalWonVolume);
    list.forEach((item, index) => {
      item.volumeRank = index + 1;
    });

    // 영업이익 순 정렬
    const profitSorted = [...list].sort((a, b) => b.totalExpectedProfit - a.totalExpectedProfit);
    profitSorted.forEach((item, index) => {
      companySummaries[item.companyId].profitRank = index + 1;
    });

    const playerSummary = companySummaries[gameState.playerCompanyId];
    const targetVolume = gameState.playerTarget.targetVolume;
    const targetAchievementRate = Math.round(
      (playerSummary.totalWonVolume / (targetVolume || 1)) * 100
    );

    // 2. 엔딩 분기 조건 판정
    const wonComplexIds = playerSummary.wonComplexIds;
    const hasComplex14 = wonComplexIds.includes(14);
    const hasComplex7 = wonComplexIds.includes(7);
    let chosenEndingId = 'perpetual_director';

    if (gameState.legalRisk >= 65) {
      // 1순위: 법적 리스크 임계치 초과 (검찰청 엔딩)
      chosenEndingId = 'prosecutor_raid';
    } else if (gameState.usedCapa > gameState.maxCapa * 1.25 && gameState.cfoTrust < 30) {
      // 캐파 초과 및 부도 위기
      chosenEndingId = 'workout_nightmare';
    } else if (playerSummary.totalWonVolume >= targetVolume && playerSummary.avgMarginPercent <= 2.2) {
      // 승자의 저주: 수주는 많이 했으나 출혈 마진
      chosenEndingId = 'winners_curse';
    } else if (playerSummary.totalWonVolume < targetVolume * 0.50) {
      // 목표 50% 미달 (구조조정 대상)
      chosenEndingId = 'restructuring_target';
    } else if (hasComplex14 && hasComplex7) {
      // 랜드마크 독식 (14단지 & 7단지 동시 확보)
      chosenEndingId = 'landmark_monopolist';
    } else if (gameState.legalRisk === 0 && playerSummary.wonCount >= 2 && gameState.companyReputation >= 85) {
      // 클린 수주왕 (리스크 0, 높은 평판)
      chosenEndingId = 'clean_bidding_champion';
    } else if (playerSummary.profitRank === 1 && playerSummary.avgMarginPercent >= 5.2) {
      // 알짜배기 수주왕 (실질 이익 1위)
      chosenEndingId = 'margin_king';
    } else if (playerSummary.wonCount >= 5 && targetAchievementRate >= 120) {
      // 재건축 황제
      chosenEndingId = 'emperor_of_reconstruction';
    } else if (
      targetAchievementRate >= 100 &&
      gameState.cfoTrust >= 75 &&
      gameState.ceoTrust >= 75 &&
      playerSummary.profitRank <= 2
    ) {
      // 사장 승진
      chosenEndingId = 'ceo_promotion';
    } else if (playerSummary.volumeRank === 1) {
      // 올해의 수주왕
      chosenEndingId = 'order_king_of_year';
    } else if (gameState.legalRisk >= 35 && targetAchievementRate >= 90 && gameState.cfoTrust < 40) {
      // 풍운아의 은퇴
      chosenEndingId = 'maverick_retirement';
    } else {
      // 만년 영업본부장
      chosenEndingId = 'perpetual_director';
    }

    const ending =
      GAME_ENDINGS.find((e) => e.id === chosenEndingId) || GAME_ENDINGS[0];

    // 결과 텍스트 생성
    const targetComparisonText = `당신은 ${Math.round(targetVolume / 10000)}조원 수주를 목표로 했습니다. 최종 수주액은 ${(playerSummary.totalWonVolume / 10000).toFixed(1)}조원(달성률 ${targetAchievementRate}%)입니다.`;
    const profitRankText = `위험조정 예상 영업이익은 ${(playerSummary.totalExpectedProfit / 100).toFixed(0)}억원으로, 업계 ${playerSummary.profitRank}위(평균 마진율 ${playerSummary.avgMarginPercent}%)를 기록했습니다.`;
    const executiveVerdictText =
      gameState.ceoTrust >= 70
        ? '사장은 당신의 당돌한 영업 성과를 흡족해하고 있습니다.'
        : '사장은 목표 미달과 경쟁사 이탈에 불만을 품고 있습니다.';

    return {
      ending,
      playerSummary,
      allCompanyRankings: list,
      targetVolume,
      targetAchievementRate,
      evaluationNarrative: {
        targetComparisonText,
        profitRankText,
        executiveVerdictText,
      },
    };
  }
}
