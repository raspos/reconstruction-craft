import { IndustryRumor } from '../types/game';

// 업계 소문 템플릿 풀
// 정보의 비대칭성과 심리전을 형성하는 핵심 시스템 (일부는 진실, 일부는 경쟁사의 연막작전이나 과장)

export interface RumorTemplate {
  headline: string;
  detail: string;
  rumorType: IndustryRumor['rumorType'];
  relatedComplexId?: number;
  relatedCompanyId?: string;
  defaultTrueProbability: number; // 기본 진실 확률 (예: 0.65 = 65% 확률로 진짜)
}

export const RUMOR_TEMPLATES: RumorTemplate[] = [
  {
    headline: '가온 14단지에서 태성건설 전격 철수설 솔솔',
    detail: '업계 소식통에 따르면 태성건설 경영진이 3.6조원대 초대형 리스크를 우려해 14단지 입찰 참여를 재검토하고 있다는 첩보입니다.',
    rumorType: 'WITHDRAWAL',
    relatedComplexId: 14,
    relatedCompanyId: 'taeseong',
    defaultTrueProbability: 0.60,
  },
  {
    headline: '가온 7단지 조합원들, "하이엔드 브랜드 아니면 보이콧"',
    detail: '7단지 주민 단톡방에서 시공능력평가 최상위권의 프리미엄 독점 브랜드를 내걸지 않으면 입찰서를 반려하겠다는 여론이 급확산 중입니다.',
    rumorType: 'BRAND_DEMAND',
    relatedComplexId: 7,
    defaultTrueProbability: 0.85,
  },
  {
    headline: '가온 10단지, 경쟁사의 충격적인 파격 공사비 덤핑 예고',
    detail: '대형 경쟁사 한 곳이 10단지 수주를 위해 평당 공사비 800만원 이하의 파격적인 출혈 입찰을 준비하고 있다는 소문이 돌고 있습니다.',
    rumorType: 'PRICE_CUT',
    relatedComplexId: 10,
    defaultTrueProbability: 0.50,
  },
  {
    headline: '가온 3단지, 시공사 선정 총회 일정 2개월 기습 단축설',
    detail: '조합 집행부가 인허가 승인에 탄력을 받아 당초 계획보다 시공사 입찰 공고를 조기에 띄울 것이라는 구체적인 전언입니다.',
    rumorType: 'SCHEDULE_CHANGE',
    relatedComplexId: 3,
    defaultTrueProbability: 0.70,
  },
  {
    headline: '가온 12단지, 비대위의 조합 집행부 고발 및 직무정지 가처분 임박',
    detail: '이주비 조건 조율 과정에서 잡음이 터져 나와 비대위가 법원에 집행부 직무정지 신청을 냈다는 풍문이 업계에 파다합니다.',
    rumorType: 'EXECUTIVE_CRISIS',
    relatedComplexId: 12,
    defaultTrueProbability: 0.55,
  },
  {
    headline: '경쟁사, 가온 8단지 포기하고 5단지 고급화 총력전으로 전략 선회',
    detail: '소규모 알짜 단지 대신 브랜드 위상을 높일 수 있는 5단지로 영업 인력을 대거 전환 배치했다는 내부 직원 제보가 있습니다.',
    rumorType: 'WITHDRAWAL',
    relatedComplexId: 8,
    defaultTrueProbability: 0.75,
  },
  {
    headline: '가온 15단지, 세원건설의 LTV 120% 파격 금융 폭탄 투하 준비',
    detail: '신규 확장지구인 15단지를 선점하기 위해 세원건설이 역대급 무이자 사업비 대여 카드를 만지작거리고 있다는 후문입니다.',
    rumorType: 'FINANCE_WAR',
    relatedComplexId: 15,
    relatedCompanyId: 'sewon',
    defaultTrueProbability: 0.65,
  },
  {
    headline: '가온 4단지, 주민 간 단합으로 단독 입찰 후 빠른 수의계약 추진설',
    detail: '조합원들이 소모적인 경쟁 대신 우량 시공사와 조기 수의계약을 맺어 공사 기간을 6개월 단축하자는 공감대를 형성 중입니다.',
    rumorType: 'SCHEDULE_CHANGE',
    relatedComplexId: 4,
    defaultTrueProbability: 0.60,
  },
  {
    headline: '한강건설, 수주 캐파 한계 임박으로 후속 단지 입찰 포기 관측',
    detail: '이미 대형 단지를 여러 개 확보한 한강건설이 본사 리스크 심의회에서 추가 수주 금지 권고를 받았다는 풍문입니다.',
    rumorType: 'WITHDRAWAL',
    relatedCompanyId: 'hangang',
    defaultTrueProbability: 0.45,
  },
  {
    headline: '가온 11단지, 정우건설의 극비리 언더테이블 접촉 정황 포착',
    detail: '정우건설이 소리 없이 11단지 핵심 대의원들과 연쇄 접촉하며 물밑 지지율을 60% 이상 장악했다는 첩보가 입수되었습니다.',
    rumorType: 'BRAND_DEMAND',
    relatedComplexId: 11,
    relatedCompanyId: 'jungwoo',
    defaultTrueProbability: 0.70,
  },
];
