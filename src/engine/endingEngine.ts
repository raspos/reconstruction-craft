import { GameEnding, GameState, ComplexData } from '../types/game';
import { GAME_ENDINGS } from '../data/endings';
import { calculateProjectProfitability } from './profitEngine';
import { CONSTRUCTION_COMPANIES } from '../data/companies';

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
    let soleBidWonCount = 0;
    let contractTrapCount = 0;

    Object.entries(gameState.complexStates).forEach(([cIdStr, st]) => {
      const cId = Number(cIdStr);
      const complex = complexMap.get(cId);
      if (!complex) return;

      if (st.winnerId === gameState.playerCompanyId) {
        playerWonComplexes.push(cId);
        playerWonVolume += st.contractPrice || complex.expectedCost;
        const playerCompany = CONSTRUCTION_COMPANIES.find((c) => c.id === gameState.playerCompanyId)!;
        const profit = calculateProjectProfitability({
          complex,
          company: playerCompany,
          proposal: st.playerProposal,
          contractPriceOverride: st.contractPrice,
          marginPercentOverride: st.finalProfitMargin,
        });
        playerWonProfit += profit.expectedOperatingProfit;

        if (st.isSoleBid || st.negotiatedContract) {
          soleBidWonCount++;
        }

        if (st.contractFulfillment && (st.contractFulfillment.delayMonths >= 6 || st.contractFulfillment.unresolvedDisputes >= 2)) {
          contractTrapCount++;
        }
      }
    });

    // 플레이어의 실제 사용된 영업비용 차감 (손실 시 음수 그대로 보존)
    playerWonProfit = Math.round(playerWonProfit - gameState.totalSalesCostSpent);

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
      const comp = CONSTRUCTION_COMPANIES.find((c) => c.id === compId);

      cState.wonComplexIds.forEach((cId) => {
        const complex = complexMap.get(cId);
        if (complex && comp) {
          const bSt = gameState.complexStates[cId];
          const cPrice = bSt?.contractPrice || complex.expectedCost;
          compVolume += cPrice;
          const profit = calculateProjectProfitability({
            complex,
            company: comp,
            contractPriceOverride: cPrice,
            marginPercentOverride: bSt?.finalProfitMargin,
          });
          compProfit += profit.expectedOperatingProfit;
        }
      });

      // 경쟁사 투입 영업비 차감 (초기예산 - 잔여예산)
      const spentBudget = Math.max(0, (comp?.startingBudget || 300) - cState.budget);
      compProfit = Math.round(compProfit - spentBudget);

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

    // 인접 단지 수 판정 (브랜드 타운 체인 계산)
    let maxAdjacentChain = 0;
    const wonSet = new Set(playerSummary.wonComplexIds);
    wonSet.forEach((id) => {
      const comp = complexMap.get(id);
      if (comp) {
        let chain = 1;
        comp.adjacentComplexIds.forEach((adjId) => {
          if (wonSet.has(adjId)) chain++;
        });
        if (chain > maxAdjacentChain) maxAdjacentChain = chain;
      }
    });

    // 2. 엔딩 분기 조건 판정
    const wonComplexIds = playerSummary.wonComplexIds;
    const hasComplex14 = wonComplexIds.includes(14);
    const hasComplex7 = wonComplexIds.includes(7);
    let chosenEndingId = 'perpetual_director';

    // 1순위: 파멸 / 위기 엔딩
    if (gameState.legalRisk >= 65) {
      chosenEndingId = 'prosecutor_raid'; // 검찰청 엔딩
    } else if (gameState.usedCapa > gameState.maxCapa * 1.25 && gameState.cfoTrust < 30) {
      chosenEndingId = 'workout_nightmare'; // 워크아웃의 망령
    } else if (contractTrapCount >= 2) {
      chosenEndingId = 'contract_trap'; // 계약의 덫
    } else if (playerSummary.totalWonVolume >= targetVolume && (gameState.cfoTrust <= 20 || playerSummary.avgMarginPercent <= 1.8)) {
      chosenEndingId = 'cfo_nightmare'; // CFO의 악몽
    } else if (playerSummary.totalWonVolume >= targetVolume && playerSummary.avgMarginPercent <= 2.4) {
      chosenEndingId = 'winners_curse'; // 승자의 저주
    } else if (playerSummary.totalWonVolume < targetVolume * 0.50) {
      chosenEndingId = 'restructuring_target'; // 구조조정 대상
    }
    // 2순위: 특수 전략 및 쾌거 엔딩
    else if (maxAdjacentChain >= 3 && targetAchievementRate >= 90) {
      chosenEndingId = 'brand_emperor'; // 브랜드 황제 (3개 이상 인접 단지 연계)
    } else if (soleBidWonCount >= 2 && targetAchievementRate >= 80) {
      chosenEndingId = 'bloodless_entry'; // 무혈입성 (단독 응찰 수의계약 2건 이상)
    } else if (
      playerSummary.wonCount >= 2 &&
      gameState.totalSalesCostSpent <= 160 &&
      gameState.rumors.filter((r) => r.investigated).length >= 2
    ) {
      chosenEndingId = 'intel_master'; // 정보전의 승리자
    } else if (
      targetAchievementRate >= 90 &&
      playerSummary.avgMarginPercent >= 5.0 &&
      gameState.cfoTrust >= 75
    ) {
      chosenEndingId = 'negotiation_master'; // 협상의 마술사
    } else if (hasComplex14 && hasComplex7) {
      chosenEndingId = 'landmark_monopolist'; // 랜드마크 독식 (14단지 & 7단지)
    } else if (gameState.legalRisk === 0 && playerSummary.wonCount >= 2 && gameState.companyReputation >= 85) {
      chosenEndingId = 'clean_bidding_champion'; // 클린 수주왕
    } else if (playerSummary.profitRank === 1 && playerSummary.avgMarginPercent >= 5.2) {
      chosenEndingId = 'margin_king'; // 알짜배기 수주왕
    } else if (playerSummary.wonCount >= 5 && targetAchievementRate >= 120) {
      chosenEndingId = 'emperor_of_reconstruction'; // 재건축 황제
    } else if (
      targetAchievementRate >= 100 &&
      gameState.cfoTrust >= 75 &&
      gameState.ceoTrust >= 75 &&
      playerSummary.profitRank <= 2
    ) {
      chosenEndingId = 'ceo_promotion'; // 사장 승진
    } else if (playerSummary.volumeRank === 1) {
      chosenEndingId = 'order_king_of_year'; // 올해의 수주왕
    } else if (gameState.legalRisk >= 35 && targetAchievementRate >= 90 && gameState.cfoTrust < 40) {
      chosenEndingId = 'maverick_retirement'; // 풍운아의 은퇴
    } else {
      chosenEndingId = 'perpetual_director'; // 만년 영업본부장
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
