import { IndustryRumor, GameState, ComplexData } from '../types/game';
import { RUMOR_TEMPLATES } from '../data/rumors';
import { CONSTRUCTION_COMPANIES } from '../data/companies';
import { SeededRNG } from './rng';

// 게임 내부 실제 사건 기반 소문 생성 엔진 (Phase 3-2: 실제 게임 상태와 소문 연결)
export class RumorEngine {
  private rng: SeededRNG;

  constructor(rng?: SeededRNG) {
    this.rng = rng || new SeededRNG();
  }

  // 매 턴 신규 업계 소문 2~3건 생성 (실제 내부 사건 및 상태 기반)
  public generateTurnRumors(
    turn: number,
    gameState?: GameState,
    allComplexes?: ComplexData[]
  ): IndustryRumor[] {
    const rumors: IndustryRumor[] = [];

    // 1. 실제 게임 내부 사건 기반 동적 소문 추출
    if (gameState && allComplexes) {
      const dynamicCandidates: Array<{
        headline: string;
        detail: string;
        relatedComplexId?: number;
        relatedCompanyId?: string;
        isTrue: boolean;
        truthRate: number;
        rumorType: IndustryRumor['rumorType'];
      }> = [];

      // A. 경쟁사 철수 사건 탐색
      Object.entries(gameState.competitorStates).forEach(([compId, cst]) => {
        const comp = CONSTRUCTION_COMPANIES.find((c) => c.id === compId);
        if (!comp) return;

        allComplexes.forEach((complex) => {
          const bState = gameState.complexStates[complex.id];
          const stance = bState?.supportScores[compId];

          if (stance?.isWithdrawn && !bState.winnerId) {
            dynamicCandidates.push({
              headline: `${comp.name}, ${complex.name} 전격 철수 첩보 포착`,
              detail: `업계 정보통에 따르면 ${comp.name}이(가) ${complex.name}의 기대효용 저조 및 리스크를 감안해 현장 인력을 철수시키고 타 단지로 화력을 돌렸다는 첩보입니다.`,
              relatedComplexId: complex.id,
              relatedCompanyId: compId,
              isTrue: true,
              truthRate: this.rng.range(85, 98),
              rumorType: 'WITHDRAWAL',
            });
          } else if (stance?.hasBid && !bState.winnerId) {
            dynamicCandidates.push({
              headline: `${comp.name}, ${complex.name} 본입찰 전격 참여 확정설`,
              detail: `${comp.name} 주택사업부가 ${complex.name} 입찰보증금 납부와 제안서 최종 검토를 마치고 공식 응찰을 굳혔다는 소문이 조합 주변에 파다합니다.`,
              relatedComplexId: complex.id,
              relatedCompanyId: compId,
              isTrue: true,
              truthRate: this.rng.range(80, 95),
              rumorType: 'BRAND_DEMAND',
            });
          }
        });

        // B. 경쟁사 자금 상황 첩보
        if (cst.budget < 35) {
          dynamicCandidates.push({
            headline: `${comp.name} 영업예산 바닥 소문... 수주전 전선 축소하나`,
            detail: `${comp.name}의 영업실탄이 급속히 소진되어 본사 추가예산 승인이 떨어지지 않을 경우 일부 단지 입찰을 포기할 수밖에 없다는 위기설이 제기되었습니다.`,
            relatedCompanyId: compId,
            isTrue: true,
            truthRate: this.rng.range(75, 92),
            rumorType: 'FINANCE_WAR',
          });
        }
      });

      // 동적 후보 중 1~2개 선별
      if (dynamicCandidates.length > 0) {
        const picked = dynamicCandidates[this.rng.range(0, dynamicCandidates.length - 1)];
        rumors.push({
          id: `rumor_t${turn}_dyn_${this.rng.range(100, 999)}`,
          turn,
          headline: picked.headline,
          detail: picked.detail,
          relatedComplexId: picked.relatedComplexId,
          relatedCompanyId: picked.relatedCompanyId,
          isTrue: picked.isTrue,
          truthRate: picked.truthRate,
          investigated: false,
          rumorType: picked.rumorType,
        });
      }
    }

    // 2. 템플릿 기반 소문 보충 (총 2~3건 충족)
    const countNeeded = Math.max(1, 2 - rumors.length);
    const shuffled = [...RUMOR_TEMPLATES].sort(() => this.rng.next() - 0.5);

    for (let i = 0; i < countNeeded && i < shuffled.length; i++) {
      const template = shuffled[i];
      const isActuallyTrue = this.rng.chance(template.defaultTrueProbability);
      const truthRate = isActuallyTrue
        ? this.rng.range(75, 100)
        : this.rng.range(15, 45);

      rumors.push({
        id: `rumor_t${turn}_tpl_${i}_${this.rng.range(100, 999)}`,
        turn,
        headline: template.headline,
        detail: template.detail,
        relatedComplexId: template.relatedComplexId,
        relatedCompanyId: template.relatedCompanyId,
        isTrue: isActuallyTrue,
        truthRate,
        investigated: false,
        rumorType: template.rumorType,
      });
    }

    return rumors;
  }
}
