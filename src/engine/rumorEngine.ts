import { IndustryRumor } from '../types/game';
import { RUMOR_TEMPLATES, RumorTemplate } from '../data/rumors';
import { SeededRNG } from './rng';

export class RumorEngine {
  private rng: SeededRNG;

  constructor(rng?: SeededRNG) {
    this.rng = rng || new SeededRNG();
  }

  // 매 턴 신규 업계 소문 2~3건 생성
  public generateTurnRumors(turn: number): IndustryRumor[] {
    const rumors: IndustryRumor[] = [];
    const count = this.rng.range(2, 3);
    const shuffled = [...RUMOR_TEMPLATES].sort(() => this.rng.next() - 0.5);

    for (let i = 0; i < count && i < shuffled.length; i++) {
      const template = shuffled[i];
      const isActuallyTrue = this.rng.chance(template.defaultTrueProbability);
      const truthRate = isActuallyTrue
        ? this.rng.range(75, 100)
        : this.rng.range(10, 40);

      rumors.push({
        id: `rumor_t${turn}_${i}_${Date.now()}`,
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
