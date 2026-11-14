import { ComplexData, CompanyData, BidProposal } from '../types/game';

// 단일 수익성 계산 엔진 (Single Source of Truth Profit Engine)
// 메인 화면, 단지 상세, 제안서 조립, 수주 결산, 최종 엔딩 평가에서 모두 동일한 함수를 호출하여
// 수주액과 이익률, 예상 영업이익의 일관성을 100% 보장합니다.

export interface DetailedProjectProfitability {
  // ① 계약 공사비 (총 수주액, 억원)
  contractPrice: number;

  // ② 직접 공사원가 (자재비, 노무비, 외주공사비, 억원)
  directConstructionCost: number;

  // ③ 현장 간접비 (현장 감리, 가설공사, 안전관리비, 억원)
  siteIndirectCost: number;

  // ④ 본사 배부비 (본사 관리비, 설계/인허가 관리비 배부, 억원)
  hqOverheadCost: number;

  // ⑤ 금융비용 (조합원 이주비 LTV 지원 이자, 사업비 무이자 대여 금융비용, 억원)
  financialCost: number;

  // ⑥ 수주 영업비용 (투입 영업예산, 홍보관 운영비, 제안서 실비 소멸분, 억원)
  salesMarketingCost: number;

  // ⑦ 위험조정 비용 (원자재가 급등, 인허가 지연, 설계변경/소송 우발채무 비용, 억원)
  riskAdjustedCost: number;

  // ⑧ 예상 영업이익 (계약공사비 - 직접공사원가 - 현장간접비 - 본사배부비 - 금융비용, 억원)
  expectedOperatingProfit: number;
  expectedMarginPercent: number; // 영업이익률 (%)

  // ⑨ 위험조정 예상이익 (예상영업이익 - 수주영업비용 - 위험조정비용, 억원)
  riskAdjustedExpectedProfit: number;
  riskAdjustedMarginPercent: number; // 위험조정 이익률 (%)

  // 적자 여부 (적자 발생 시 음수 그대로 표기)
  isDeficit: boolean;
}

export interface ProfitabilityInput {
  complex: ComplexData;
  company: CompanyData;
  proposal?: BidProposal;
  salesCostSpentOnComplex?: number;
  contractPriceOverride?: number;
  marginPercentOverride?: number;
  escalationRiskTriggered?: boolean; // 자재 인플레이션 돌발사건 반영 여부
  delayMonths?: number;              // 지연 개월 수
}

/**
 * 단지별 단일 정밀 수익성 계산
 */
export function calculateProjectProfitability(
  input: ProfitabilityInput
): DetailedProjectProfitability {
  const {
    complex,
    company,
    proposal,
    salesCostSpentOnComplex = 0,
    contractPriceOverride,
    marginPercentOverride,
    escalationRiskTriggered = false,
    delayMonths = 0,
  } = input;

  // 1. 계약 공사비
  let contractPrice = contractPriceOverride ?? complex.expectedCost;

  // 공사비 할인 제안 반영 (단, 확정 오버라이드가 없을 경우)
  if (!contractPriceOverride && proposal) {
    if (proposal.costDiscount === 'DUMPING') contractPrice = Math.round(complex.expectedCost * 0.88);
    else if (proposal.costDiscount === 'AGGRESSIVE') contractPrice = Math.round(complex.expectedCost * 0.93);
    else if (proposal.costDiscount === 'SMALL') contractPrice = Math.round(complex.expectedCost * 0.97);
  }

  // 2. 기본 원가율 계산 (건설사 원가경쟁력 70~95에 따라 직접원가 72% ~ 84% 형성)
  const baseCostCompFactor = (100 - company.attributes.costComp) * 0.002; // 0.01 ~ 0.06
  let directCostRate = 0.76 + baseCostCompFactor; // 약 77% ~ 82%

  // 제안서 고급화에 따른 원가율 증가
  if (proposal) {
    if (proposal.brandTier === 'HIGH_END') directCostRate += 0.025;
    if (proposal.facade === 'LANDMARK') directCostRate += 0.03;
    else if (proposal.facade === 'SPECIALIZED') directCostRate += 0.015;
    if (proposal.ceilingHeight === 2.7) directCostRate += 0.02;
    else if (proposal.ceilingHeight === 2.6) directCostRate += 0.01;
    if (proposal.community === 'SUPER_LUXURY') directCostRate += 0.018;
    if (proposal.architectTier === 'GLOBAL_TOP') directCostRate += 0.015;
    if (proposal.parking === 'SMART') directCostRate += 0.008;
  }

  // 3. 각 원가 항목 산출 (억원 단위 정수화)
  const directConstructionCost = Math.round(complex.expectedCost * directCostRate);
  const siteIndirectCost = Math.round(complex.expectedCost * 0.065); // 약 6.5%
  const hqOverheadCost = Math.round(complex.expectedCost * 0.035);   // 약 3.5%

  // 4. 금융비용 계산
  let financeRate = 0.018; // 기본 1.8%
  if (proposal) {
    if (proposal.financePackage === 'RADICAL_LTV') financeRate = 0.045; // 파격 LTV 지원 이자 부담
    else if (proposal.financePackage === 'PREFERENTIAL') financeRate = 0.028;
  }
  // 회사 금융신인도에 따른 금융비용 절감 (-0.5%p ~ +0.5%p)
  const financeBonus = (company.attributes.finance - 80) * 0.0003;
  financeRate = Math.max(0.01, financeRate - financeBonus);
  const financialCost = Math.round(complex.expectedCost * financeRate);

  // 5. 수주 영업비용
  const prepCost = complex.biddingRules?.proposalPrepCost || 15;
  const salesMarketingCost = Math.round(salesCostSpentOnComplex + prepCost);

  // 6. 위험조정 비용
  let riskRate = 0.015;
  if (complex.riskLevel === 'EXTREME') riskRate = 0.045;
  else if (complex.riskLevel === 'HIGH') riskRate = 0.03;
  else if (complex.riskLevel === 'MID') riskRate = 0.02;

  if (escalationRiskTriggered) {
    // 물가변동 무조건 시공사 부담 특약인 경우 원자재 폭등 시 리스크 급증
    if (proposal?.escalationRisk === 'FULL_BUILDER_RISK') riskRate += 0.04;
    else if (proposal?.escalationRisk === 'PARTIAL_RISK') riskRate += 0.02;
  }
  if (delayMonths > 0) {
    riskRate += delayMonths * 0.005; // 개월당 0.5%p
  }
  const riskAdjustedCost = Math.round(complex.expectedCost * riskRate);

  // 7. 예상 영업이익 산출
  let expectedOperatingProfit: number;
  let expectedMarginPercent: number;

  if (marginPercentOverride !== undefined) {
    expectedMarginPercent = Number(marginPercentOverride.toFixed(2));
    expectedOperatingProfit = Math.round(contractPrice * (expectedMarginPercent / 100));
  } else {
    expectedOperatingProfit =
      contractPrice - directConstructionCost - siteIndirectCost - hqOverheadCost - financialCost;
    expectedMarginPercent = Number(((expectedOperatingProfit / contractPrice) * 100).toFixed(2));
  }

  // 8. 위험조정 예상이익 산출 (영업비 및 위험비용 차감)
  const riskAdjustedExpectedProfit =
    expectedOperatingProfit - salesMarketingCost - riskAdjustedCost;
  const riskAdjustedMarginPercent = Number(
    ((riskAdjustedExpectedProfit / contractPrice) * 100).toFixed(2)
  );

  return {
    contractPrice,
    directConstructionCost,
    siteIndirectCost,
    hqOverheadCost,
    financialCost,
    salesMarketingCost,
    riskAdjustedCost,
    expectedOperatingProfit,
    expectedMarginPercent,
    riskAdjustedExpectedProfit,
    riskAdjustedMarginPercent,
    isDeficit: expectedOperatingProfit < 0 || riskAdjustedExpectedProfit < 0,
  };
}

/**
 * 회사 전체 포트폴리오의 통합 손익 계산 (메인 HUD 및 결산용)
 */
export function calculateCompanyTotalProfitability(
  wonComplexes: ComplexData[],
  company: CompanyData,
  proposals: Record<number, BidProposal | undefined>,
  salesCostSpentTotal: number,
  contractPrices: Record<number, number> = {},
  contractMargins: Record<number, number> = {}
) {
  let totalContractVolume = 0;
  let totalDirectCost = 0;
  let totalSiteIndirectCost = 0;
  let totalHqOverheadCost = 0;
  let totalFinancialCost = 0;
  let totalRiskCost = 0;
  let totalOperatingProfit = 0;
  let totalRiskAdjustedProfit = 0;

  wonComplexes.forEach((c) => {
    const proj = calculateProjectProfitability({
      complex: c,
      company,
      proposal: proposals[c.id],
      contractPriceOverride: contractPrices[c.id],
      marginPercentOverride: contractMargins[c.id],
    });

    totalContractVolume += proj.contractPrice;
    totalDirectCost += proj.directConstructionCost;
    totalSiteIndirectCost += proj.siteIndirectCost;
    totalHqOverheadCost += proj.hqOverheadCost;
    totalFinancialCost += proj.financialCost;
    totalRiskCost += proj.riskAdjustedCost;
    totalOperatingProfit += proj.expectedOperatingProfit;
  });

  // 전체 영업비용 차감
  totalRiskAdjustedProfit = totalOperatingProfit - salesCostSpentTotal - totalRiskCost;

  const totalMarginPercent =
    totalContractVolume > 0
      ? Number(((totalOperatingProfit / totalContractVolume) * 100).toFixed(2))
      : 0;

  const totalRiskAdjustedMarginPercent =
    totalContractVolume > 0
      ? Number(((totalRiskAdjustedProfit / totalContractVolume) * 100).toFixed(2))
      : 0;

  return {
    totalContractVolume,
    totalDirectCost,
    totalSiteIndirectCost,
    totalHqOverheadCost,
    totalFinancialCost,
    totalSalesCostSpent: salesCostSpentTotal,
    totalRiskCost,
    totalOperatingProfit,
    totalMarginPercent,
    totalRiskAdjustedProfit,
    totalRiskAdjustedMarginPercent,
    isDeficit: totalOperatingProfit < 0 || totalRiskAdjustedProfit < 0,
  };
}
