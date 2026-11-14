import { CommunityPost, ComplexData, ComplexBiddingState, IndustryRumor } from '../types/game';

const NICKNAMES_BY_GROUP = {
  BRAND: [
    '로얄동로얄층', '하이엔드바라기', '가온랜드마크', '평당1억기원', '커튼월매니아',
    '성수트리마제부럽지않다', '강남추월가온', '디에이치존버단', '아크로가온점'
  ],
  PRAGMATIC: [
    '추가분담금결사반대', '가성비가최고다', '실속조합원34', '공사비검증위원회',
    '평당800이하만받음', '관리처분계산기', '이자율무섭다', '원가절감TF', '착공빨리하자'
  ],
  FLOATING: [
    '조용한다수', '아직고민중인1인', '설명회다녀온후기', '단톡방눈팅러', '부동산소장님말로는',
    '가온토박이40년', '투표날결정한다', '비대위말도맞는듯', '조합장님믿어봅니다'
  ]
};

const BADGES: Array<'조합원' | '대의원' | '동대표' | '부동산소장' | '익명주민'> = [
  '조합원', '대의원', '동대표', '부동산소장', '익명주민'
];

export function generateCommunityPosts(
  turn: number,
  complexes: ComplexData[],
  complexStates: Record<number, ComplexBiddingState>,
  rumors: IndustryRumor[]
): CommunityPost[] {
  const newPosts: CommunityPost[] = [];
  const activeComplexes = complexes.filter(c => {
    const s = complexStates[c.id];
    return s && s.currentStage !== 'interest' && s.currentStage !== 'contracted';
  });

  if (activeComplexes.length === 0) return [];

  // 1. 단지별 현황 반영 게시글
  activeComplexes.slice(0, 3).forEach(complex => {
    const state = complexStates[complex.id];
    const isHighFatigue = state.prFatigue >= 50;

    // A. 홍보 피로도 폭발 글 (목소리 큰 소수 또는 주민 반발)
    if (isHighFatigue) {
      newPosts.push({
        id: `post_${turn}_fatigue_${complex.id}`,
        complexId: complex.id,
        authorNickname: '엘베스티커떼다지침',
        authorBadge: '동대표',
        voterGroup: 'FLOATING',
        content: `[${complex.name}] 아침마다 우편함이랑 현관문에 건설사 홍보 전단지 꽂혀있는 거 진짜 적당히들 좀 하세요. OS요원들 단지 안에서 서성거리면서 어르신들 잡는 거 경비실에서 제지 좀 부탁드립니다. 역효과만 납니다!`,
        turn,
        isVocalMinority: false,
        likes: Math.floor(Math.random() * 45) + 30,
      });
    }

    // B. 브랜드 충성파 글
    const brandNick = NICKNAMES_BY_GROUP.BRAND[Math.floor(Math.random() * NICKNAMES_BY_GROUP.BRAND.length)];
    newPosts.push({
      id: `post_${turn}_brand_${complex.id}`,
      complexId: complex.id,
      authorNickname: brandNick,
      authorBadge: '조합원',
      voterGroup: 'BRAND',
      content: `[${complex.name}] 우리 단지는 무조건 하이엔드 브랜드에 스카이브릿지 가야 합니다. 옆 단지 보니까 일반 브랜드 했다가 벌써 호가 떨어지는 거 안 보이십니까? 공사비 조금 아끼려다 평당가 수억 손해봅니다!`,
      turn,
      isVocalMinority: complex.voterSegments.brandLoyalistRatio < 35, // 실제 충성파 비율이 낮으면 목소리 큰 소수
      likes: Math.floor(Math.random() * 25) + 5,
    });

    // C. 실리파 글
    const pragNick = NICKNAMES_BY_GROUP.PRAGMATIC[Math.floor(Math.random() * NICKNAMES_BY_GROUP.PRAGMATIC.length)];
    newPosts.push({
      id: `post_${turn}_prag_${complex.id}`,
      complexId: complex.id,
      authorNickname: pragNick,
      authorBadge: '대의원',
      voterGroup: 'PRAGMATIC',
      content: `[${complex.name}] 겉만 번지르르한 커튼월룩이랑 외관 특화에 속지 맙시다. 결국 나중에 입주할 때 추가분담금 수억씩 폭탄 맞는 건 우리 조합원들입니다. 무이자 이주비 보장하고 물가상승 에스컬레이션 리스크 건설사가 떠안는 제안서가 1순위입니다.`,
      turn,
      isVocalMinority: complex.voterSegments.pragmatistRatio < 35,
      likes: Math.floor(Math.random() * 35) + 12,
    });

    // D. 조합 AI 전략 행동에 대한 반응 글
    if (state.unionActions && state.unionActions.length > 0) {
      const latestAct = state.unionActions[state.unionActions.length - 1];
      if (latestAct.turn === turn) {
        newPosts.push({
          id: `post_${turn}_union_${complex.id}`,
          complexId: complex.id,
          authorNickname: '조합원_공개성명',
          authorBadge: '조합원',
          voterGroup: 'FLOATING',
          content: `[${complex.name}] 조합에서 방금 공지 올렸네요. "${latestAct.title}" - ${latestAct.message.slice(0, 60)}... 건설사들 간 보지 말고 제대로 된 조건 들고 오라는 뜻인 듯. 집행부 응원합니다.`,
          turn,
          isVocalMinority: false,
          likes: Math.floor(Math.random() * 50) + 20,
        });
      }
    }
  });

  // 2. 업계 소문 관련 글
  if (rumors.length > 0) {
    const recentRumor = rumors[rumors.length - 1];
    if (recentRumor.turn === turn) {
      newPosts.push({
        id: `post_${turn}_rumor_${recentRumor.id}`,
        complexId: recentRumor.relatedComplexId,
        authorNickname: '카더라통신_소통방',
        authorBadge: '부동산소장',
        voterGroup: 'FLOATING',
        content: `[가온 찌라시] 방금 부동산 연합 단톡방에 돈 정보: "${recentRumor.headline}". 이거 진짜면 수주 판도 완전히 뒤집어지는 거 아닙니까? 확실한 진위 파악되신 분 댓글 좀요.`,
        turn,
        isVocalMinority: true,
        likes: Math.floor(Math.random() * 60) + 15,
      });
    }
  }

  return newPosts;
}
