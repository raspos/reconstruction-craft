import { BidProposal, ComplexData, CompanyData } from '../types/game';

// 입찰 제안서 조립 및 손익·위험도 평가 엔진

export interface ProposalEvaluationResult {
  proposal: BidProposal;
  totalCost: number;             // 총 공사비 (억원)
  effectiveMarginPercent: number;// 위험조정 예상 영업이익률 (%)
  initialCashBurden: number;     // 초기 금융 및 보증 투입 부담 (억원)
  permitRiskPercent: number;     // 인허가 지연 및 설계 변경 위험 (%)
  brandLoyalistAppeal: number;   // 브랜드 충성파 매력도 점수 (0~100)
  pragmatistAppeal: number;      // 실리파 매력도 점수 (0~100)
  cfoApprovalScore: number;      // CFO 승인 점수 (0~100, 낮으면 제동)
  cfoWarningMessage?: string;
  ceoApprovalScore: number;      // CEO 승인 점수 (0~100)
}

export const DEFAULT_STANDARD_PROPOSAL: BidProposal = {
  brandTier: 'PREMIUM',
  ceilingHeight: 2.5,
  facade: 'SPECIALIZED',
  community: 'PREMIUM',
  landscaping: 'PREMIUM',
  parking: 'EXTENDED',
  costDiscount: 'NONE',
  financePackage: 'STANDARD',
  scheduleMonths: 'STANDARD',
  escalationRisk: 'STANDARD',
  architectTier: 'FAMOUS',
};

export function evaluateProposal(
  proposal: BidProposal,
  complex: ComplexData,
  company: CompanyData
): ProposalEvaluationResult {
  let marginDelta = 0;
  let cashBurden = Math.round(complex.expectedCost * 0.04); // 기본 4%
  let permitRisk = complex.riskLevel === 'HIGH' ? 25 : complex.riskLevel === 'EXTREME' ? 40 : 15;
  let brandScore = 50 + (company.attributes.brand - 75) * 0.5;
  let pragmatistScore = 50 + (company.attributes.costComp - 75) * 0.5;

  // 1. 브랜드 티어
  if (proposal.brandTier === 'HIGH_END') {
    marginDelta -= 0.5;
    brandScore += 25;
    cashBurden += 30;
  } else if (proposal.brandTier === 'STANDARD') {
    brandScore -= 15;
    pragmatistScore += 5;
  }

  // 2. 천장고
  if (proposal.ceilingHeight === 2.7) {
    marginDelta -= 0.6;
    permitRisk += 10;
    brandScore += 12;
    pragmatistScore += 8;
  } else if (proposal.ceilingHeight === 2.6) {
    marginDelta -= 0.3;
    brandScore += 6;
  }

  // 3. 외관
  if (proposal.facade === 'LANDMARK') {
    marginDelta -= 0.8;
    brandScore += 24;
    permitRisk += 12;
  } else if (proposal.facade === 'SPECIALIZED') {
    marginDelta -= 0.4;
    brandScore += 12;
  } else if (proposal.facade === 'CURTAIN_WALL') {
    marginDelta -= 0.3;
    brandScore += 8;
  }

  // 4. 커뮤니티 시설
  if (proposal.community === 'SUPER_LUXURY') {
    marginDelta -= 0.6;
    brandScore += 15;
    pragmatistScore += 10;
  } else if (proposal.community === 'BASIC') {
    marginDelta += 0.3;
    brandScore -= 12;
  }

  // 5. 조경
  if (proposal.landscaping === 'THEMED') {
    marginDelta -= 0.4;
    brandScore += 10;
  }

  // 6. 주차장
  if (proposal.parking === 'SMART') {
    marginDelta -= 0.4;
    pragmatistScore += 12;
  } else if (proposal.parking === 'EXTENDED') {
    marginDelta -= 0.2;
    pragmatistScore += 6;
  }

  // 7. 공사비 할인
  if (proposal.costDiscount === 'DUMPING') {
    marginDelta -= 3.5; // -3.5%p 마진 파괴
    pragmatistScore += 35;
  } else if (proposal.costDiscount === 'AGGRESSIVE') {
    marginDelta -= 1.8;
    pragmatistScore += 20;
  } else if (proposal.costDiscount === 'SMALL') {
    marginDelta -= 0.8;
    pragmatistScore += 10;
  }

  // 8. 금융조건
  if (proposal.financePackage === 'RADICAL_LTV') {
    marginDelta -= 0.9;
    cashBurden += Math.round(complex.expectedCost * 0.05);
    pragmatistScore += 28;
  } else if (proposal.financePackage === 'PREFERENTIAL') {
    marginDelta -= 0.4;
    cashBurden += Math.round(complex.expectedCost * 0.02);
    pragmatistScore += 14;
  }

  // 9. 공사 기간
  if (proposal.scheduleMonths === 'MINUS_8') {
    marginDelta -= 0.9; // 돌관공사비
    permitRisk += 15;
    pragmatistScore += 15;
  } else if (proposal.scheduleMonths === 'MINUS_4') {
    marginDelta -= 0.4;
    pragmatistScore += 8;
  }

  // 10. 물가 변동 위험 부담
  if (proposal.escalationRisk === 'FULL_BUILDER_RISK') {
    marginDelta -= 1.2;
    pragmatistScore += 25;
  } else if (proposal.escalationRisk === 'PARTIAL_RISK') {
    marginDelta -= 0.5;
    pragmatistScore += 12;
  }

  // 11. 설계 특화
  if (proposal.architectTier === 'GLOBAL_TOP') {
    marginDelta -= 0.7;
    brandScore += 25;
    permitRisk += 10;
  } else if (proposal.architectTier === 'FAMOUS') {
    marginDelta -= 0.3;
    brandScore += 12;
  }

  // 원가 경쟁력 보정에 따른 마진 방어
  const costDefense = (company.attributes.costComp - 75) * 0.02;
  marginDelta += costDefense;

  const effectiveMarginPercent = Number(
    Math.max(-4.0, complex.baseExpectedProfitMargin + marginDelta).toFixed(2)
  );

  // CFO 승인 점수 계산 (마진율과 현금 부담 중심)
  let cfoScore = 50 + effectiveMarginPercent * 8 - (cashBurden / 100) * 1.5;
  if (proposal.costDiscount === 'DUMPING') cfoScore -= 25;
  if (proposal.escalationRisk === 'FULL_BUILDER_RISK') cfoScore -= 20;
  cfoScore = Math.max(10, Math.min(100, Math.round(cfoScore)));

  let cfoWarningMessage: string | undefined;
  if (effectiveMarginPercent <= 1.8) {
    cfoWarningMessage = '경고: 예상 영업이익률이 1.8% 이하입니다. CFO가 입찰 보류 권고안을 발의했습니다.';
  } else if (cashBurden >= 250) {
    cfoWarningMessage = '주의: 초기 금융 및 보증 부담이 과도합니다. 유동성 리스크가 가중됩니다.';
  }

  // CEO 승인 점수 (수주 가능성 및 브랜드 위상 중심)
  let ceoScore = 40 + (brandScore * 0.4) + (pragmatistScore * 0.3);
  if (proposal.brandTier === 'HIGH_END') ceoScore += 15;
  if (proposal.facade === 'LANDMARK') ceoScore += 12;
  ceoScore = Math.max(10, Math.min(100, Math.round(ceoScore)));

  return {
    proposal,
    totalCost: complex.expectedCost,
    effectiveMarginPercent,
    initialCashBurden: cashBurden,
    permitRiskPercent: Math.min(90, permitRisk),
    brandLoyalistAppeal: Math.min(99, Math.round(brandScore)),
    pragmatistAppeal: Math.min(99, Math.round(pragmatistScore)),
    cfoApprovalScore: cfoScore,
    cfoWarningMessage,
    ceoApprovalScore: ceoScore,
  };
}

// 경쟁사 AI의 성향에 맞는 입찰 제안서 자동 생성
export function generateCompetitorProposal(
  company: CompanyData,
  complex: ComplexData
): BidProposal {
  const proposal: BidProposal = { ...DEFAULT_STANDARD_PROPOSAL };

  switch (company.personality) {
    case 'landmark_obsessed': // 한강건설 등: 하이엔드, 랜드마크 외관, 글로벌 건축가
      proposal.brandTier = 'HIGH_END';
      proposal.facade = 'LANDMARK';
      proposal.architectTier = 'GLOBAL_TOP';
      proposal.community = 'SUPER_LUXURY';
      break;

    case 'profit_conservative': // 태성·정우: 마진 방어, 실비 에스컬레이션, 적정 공사비
      proposal.costDiscount = 'NONE';
      proposal.escalationRisk = 'STANDARD';
      proposal.brandTier = company.attributes.brand >= 90 ? 'HIGH_END' : 'PREMIUM';
      break;

    case 'finance_fighter': // 세원건설: 파격적 LTV 금융 패키지
      proposal.financePackage = 'RADICAL_LTV';
      proposal.costDiscount = 'SMALL';
      break;

    case 'aggressive_expansion': // 대륙건설: 공격적 공사비 할인 및 공기 단축
      proposal.costDiscount = 'AGGRESSIVE';
      proposal.scheduleMonths = 'MINUS_4';
      break;

    case 'small_medium_focus': // 신화건설: 스마트 주차 및 실속형 옵션
      proposal.costDiscount = 'SMALL';
      proposal.parking = 'SMART';
      break;

    default:
      proposal.costDiscount = 'SMALL';
      proposal.financePackage = 'PREFERENTIAL';
  }

  return proposal;
}
