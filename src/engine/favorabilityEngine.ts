import { ComplexData, CompanyData } from '../types/game';

// 조합원 호감도 및 지지율 세부 계산 엔진
// 복잡한 다변수 가중 계산을 수행하되, 플레이어에게는 직관적인 예상 지지율과 여론 요약을 제공

export interface FavorabilityInput {
  company: CompanyData;
  complex: ComplexData;
  generalSupportBase: number;     // 0~100
  execSupportBase: number;        // 0~100
  brandPerceptionBase: number;    // 0~100
  costOfferedMarginDelta: number; // 제시한 공사비 절감폭 (%p)
  financeOfferedScore: number;    // 금융조건 점수 (0~100)
  trustScore: number;             // 신뢰도 (0~100)
  hasWithdrawn?: boolean;
}

export interface FavorabilityOutput {
  totalFavorability: number;      // 종합 예상 지지율 (0~100)
  brandScore: number;             // 브랜드 기여도
  costScore: number;              // 공사비 기여도
  financeScore: number;           // 금융조건 기여도
  execScore: number;              // 집행부 지지도
  oppositionDampener: number;     // 반대파 감점
  qualitativeSummary: '독점 우세' | '우세' | '박빙 경합' | '열세' | '입찰 포기';
}

export function calculateFavorability(input: FavorabilityInput): FavorabilityOutput {
  if (input.hasWithdrawn) {
    return {
      totalFavorability: 0,
      brandScore: 0,
      costScore: 0,
      financeScore: 0,
      execScore: 0,
      oppositionDampener: 0,
      qualitativeSummary: '입찰 포기',
    };
  }

  const { company, complex } = input;
  const weights = complex.sentimentProfile;

  // 1. 브랜드 점수 계산 (단지 가중치 * (기본 브랜드 + 각인도))
  const effectiveBrand = Math.min(100, (company.attributes.brand * 0.7 + input.brandPerceptionBase * 0.3));
  const brandContrib = (effectiveBrand * weights.brandWeight) / 100;

  // 2. 공사비 제안 점수 계산 (공사비 인하폭이 클수록 호감 급증)
  // costOfferedMarginDelta가 음수(-1.0%p)면 조합원에게는 이득
  const discountBonus = Math.max(0, -input.costOfferedMarginDelta) * 15;
  const effectiveCostImpression = Math.min(100, 50 + discountBonus + (company.attributes.costComp - 75) * 0.5);
  const costContrib = (effectiveCostImpression * weights.costSensitivity) / 100;

  // 3. 금융조건 점수 계산 (이주비, 대출 지원력)
  const effectiveFinance = Math.min(
    100,
    (company.attributes.finance * 0.6 + input.financeOfferedScore * 0.4)
  );
  const financeContrib = (effectiveFinance * weights.financeWeight) / 100;

  // 4. 사업 속도 및 신뢰도
  const speedContrib = (company.attributes.salesOrg * weights.speedPreference) / 100;

  // 5. 일반 조합원 지지 기본 가중
  const generalSentiment = (brandContrib + costContrib + financeContrib + speedContrib);

  // 6. 집행부 지지 가중 (집행부 영향력이 높은 단지일수록 집행부 지지가 판세를 움직임)
  const execContrib = (input.execSupportBase * weights.executiveInfluence) / 100;

  // 7. 비대위 / 반대파 영향력 감점 (비대위 세력이 크면 과도한 로비나 공약에 역풍)
  const oppositionPenalty = (weights.oppositionPower * (100 - input.trustScore)) / 500;

  // 종합 점수 산출 (0 ~ 100)
  let rawScore = generalSentiment * 0.8 + execContrib * 0.2 - oppositionPenalty;

  // 자금력과 신용도 보너스 (안정성 신뢰)
  const stabilityBonus = (company.attributes.credit - 75) * 0.1;
  rawScore += stabilityBonus;

  const totalFavorability = Math.max(5, Math.min(99, Math.round(rawScore)));

  // 여론 정성 분석
  let qualitativeSummary: FavorabilityOutput['qualitativeSummary'] = '박빙 경합';
  if (totalFavorability >= 78) qualitativeSummary = '독점 우세';
  else if (totalFavorability >= 62) qualitativeSummary = '우세';
  else if (totalFavorability <= 38) qualitativeSummary = '열세';

  return {
    totalFavorability,
    brandScore: Math.round(brandContrib),
    costScore: Math.round(costContrib),
    financeScore: Math.round(financeContrib),
    execScore: Math.round(execContrib),
    oppositionDampener: Math.round(oppositionPenalty),
    qualitativeSummary,
  };
}
