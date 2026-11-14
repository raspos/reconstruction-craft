import { ExternalMarketProject, CompanyData } from '../types/game';

export const INITIAL_EXTERNAL_PROJECTS: ExternalMarketProject[] = [
  {
    id: 'ext_gangnam_apgujeong',
    name: '강남 압구정 현대아파트 특별재건축',
    scaleVolume: 28000, // 2조 8,000억원
    turnResolved: 6,
    description: '대한민국 최고 부촌의 상징적 단지로, 1군 건설사들의 총력전이 펼쳐지고 있습니다.',
  },
  {
    id: 'ext_hannam_4',
    name: '한남 4구역 한강변 랜드마크 재개발',
    scaleVolume: 16000, // 1조 6,000억원
    turnResolved: 12,
    description: '남산 조망과 한강 프리미엄을 겸비한 초호화 수주 격전지입니다.',
  },
  {
    id: 'ext_yeouido_sibeom',
    name: '여의도 시범아파트 금융특화 재건축',
    scaleVolume: 21000, // 2조 1,000억원
    turnResolved: 18,
    description: '65층 초고층 금융허브 배후 주거단지 수주전입니다.',
  },
];

export interface ExternalResolutionResult {
  project: ExternalMarketProject;
  winnerCompanyId: string;
  winnerCompanyName: string;
  impactMessage: string;
  capaConsumed: number;
}

export function processExternalMarketTurn(
  turn: number,
  projects: ExternalMarketProject[],
  companies: CompanyData[],
  playerCompanyId: string
): ExternalResolutionResult | null {
  const targetProject = projects.find(p => p.turnResolved === turn && !p.competitorWinnerId);
  if (!targetProject) return null;

  // 플레이어 제외 대형/중견 경쟁사 중 브랜드와 캐파가 높은 상위 건설사가 수주
  const eligibleCompetitors = companies.filter(
    c => c.id !== playerCompanyId && c.attributes.capa >= targetProject.scaleVolume * 0.6
  );

  if (eligibleCompetitors.length === 0) return null;

  // 한강(브랜드 최상), 태성(신용/자금 최상), 대륙(공격적) 우선순위 가중 추첨
  const scored = eligibleCompetitors.map(c => {
    let weight = c.attributes.brand * 0.5 + c.attributes.funds * 0.3 + c.attributes.capa / 1000;
    return { company: c, weight };
  });

  const totalWeight = scored.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  let winner = scored[0].company;
  for (const s of scored) {
    rand -= s.weight;
    if (rand <= 0) {
      winner = s.company;
      break;
    }
  }

  targetProject.competitorWinnerId = winner.id;

  const capaConsumed = Math.round(targetProject.scaleVolume * 0.85);

  const impactMessage = `[외부 대형 수주전 속보] ${targetProject.name}(${(targetProject.scaleVolume / 10000).toFixed(1)}조원 규모) 시공권이 ${winner.name}에 최종 낙찰되었습니다! 이에 따라 ${winner.name}의 가온 신시가지 시공 캐파 및 투입 여력이 급감하며 일부 단지에서 철수 조짐이 감지됩니다.`;

  return {
    project: targetProject,
    winnerCompanyId: winner.id,
    winnerCompanyName: winner.name,
    impactMessage,
    capaConsumed,
  };
}
