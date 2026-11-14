export interface CraftUniverseNavLink {
  id: 'personnel-craft' | 'hongdam-craft' | 'reconstruction-craft';
  nameKo: string;
  nameEn: string;
  badgeKo?: string;
  badgeEn?: string;
  url: string;
  active?: boolean;
}

export const CRAFT_UNIVERSE_BRAND = {
  title: 'CRAFT UNIVERSE',
  subtitleKo: '한국형 기업 생존 시뮬레이션 유니버스',
  subtitleEn: 'The Korean Corporate Survival Universe',
  genreBadgeKo: '데이터 기반 턴제 경영·전략 시뮬레이션',
  genreBadgeEn: 'Data-driven Turn-based Strategy Simulation',
};

export const CRAFT_UNIVERSE_LINKS: CraftUniverseNavLink[] = [
  {
    id: 'personnel-craft',
    nameKo: '인사 크래프트',
    nameEn: 'Personnel Craft',
    badgeKo: '기자편',
    badgeEn: 'Newsroom',
    url: 'https://raspos.github.io/personnel-craft/',
  },
  {
    id: 'hongdam-craft',
    nameKo: '홍담 크래프트',
    nameEn: 'Hongdam Craft',
    badgeKo: '홍보편',
    badgeEn: 'PR Battle',
    url: 'https://raspos.github.io/hongdam-craft/',
  },
  {
    id: 'reconstruction-craft',
    nameKo: '재건축 크래프트',
    nameEn: 'Reconstruction Craft',
    badgeKo: '수주전쟁',
    badgeEn: 'Bidding War',
    url: 'https://raspos.github.io/reconstruction-craft/',
    active: true,
  },
];
