import { ComplexData } from '../types/game';

// 건설 프로젝트 수익성 계산 엔진
// 예상 수주액 - 직접 공사비 - 현장 간접비 - 본사 배부비 - 금융 부담 - 위험 대비 비용 - 수주 영업비 = 위험조정 예상 영업이익

export interface ProfitBreakdown {
  contractPrice: number;        // 예상 수주액 (억원)
  directConstructionCost: number;// 직접 공사원가 (철근, 레미콘, 노무비 등)
  siteOverhead: number;         // 현장 간접비 (가설비, 현장 감리, 안전 관리비)
  hqAllocationCost: number;     // 본사 일반관리비 및 배부비
  financingBurden: number;      // 금융 부담 (이주비 보증 수수료, PF 조달 이자 차액)
  riskContingency: number;      // 돌발 변수 위험 대비 충당금
  salesCostAllocated: number;   // 투입된 수주 영업비용
  riskAdjustedProfit: number;   // 위험조정 예상 영업이익 (억원)
  profitMarginPercent: number;  // 위험조정 예상 영업이익률 (%)
}

export function calculateProjectProfit(
  complex: ComplexData,
  marginDelta: number = 0,
  salesCostSpent: number = 0,
  macroFactor: { interestDelta?: number; materialCostDelta?: number } = {}
): ProfitBreakdown {
  const contractPrice = complex.expectedCost;

  // 기본 마진에서 제안 조건(공사비 인하, 추가 마감재 등)과 거시경제 변동 반영
  const effectiveMarginPercent = Math.max(
    -5.0, // 최대 적자 한도
    complex.baseExpectedProfitMargin +
      marginDelta +
      (macroFactor.materialCostDelta || 0)
  );

  // 원가 구성 모델 (국내 대형 건설사 표준 주택공사 원가 배분율 기준)
  // 직접 공사비: 약 78%~82%
  // 현장 간접비: 약 6%~8%
  // 본사 배부비: 약 4%~5%
  // 금융 부담: 약 2%~4% (금리 변동 반영)
  // 영업이익: 약 3%~8%

  const baseCost = contractPrice * (1 - effectiveMarginPercent / 100);

  // 1. 직접 공사원가 (약 80%)
  const directConstructionCost = Math.round(baseCost * 0.81);

  // 2. 현장 간접비 (약 8%)
  const siteOverhead = Math.round(baseCost * 0.08);

  // 3. 본사 배부비 (약 5%)
  const hqAllocationCost = Math.round(baseCost * 0.05);

  // 4. 금융 부담 (금리 변동 반영)
  const baseFinancingRatio = 0.03 + (macroFactor.interestDelta || 0) * 0.01;
  const financingBurden = Math.round(contractPrice * Math.max(0.01, baseFinancingRatio));

  // 5. 위험 대비 충당금 (단지별 위험도 반영)
  const riskRates = { LOW: 0.01, MID: 0.025, HIGH: 0.045, EXTREME: 0.07 };
  const riskContingency = Math.round(contractPrice * riskRates[complex.riskLevel]);

  // 위험조정 순이익 계산
  const totalDeductions =
    directConstructionCost +
    siteOverhead +
    hqAllocationCost +
    financingBurden +
    riskContingency +
    salesCostSpent;

  const riskAdjustedProfit = Math.round(contractPrice - totalDeductions);
  const profitMarginPercent = Number(
    ((riskAdjustedProfit / contractPrice) * 100).toFixed(2)
  );

  return {
    contractPrice,
    directConstructionCost,
    siteOverhead,
    hqAllocationCost,
    financingBurden,
    riskContingency,
    salesCostAllocated: salesCostSpent,
    riskAdjustedProfit,
    profitMarginPercent,
  };
}
