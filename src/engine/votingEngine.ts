import {
  BidProposal,
  ComplexData,
  ComplexBiddingState,
  CompanyData,
  VoterSegments,
} from '../types/game';
import { evaluateProposal, generateCompetitorProposal } from './proposalEngine';

export interface BidderVoteDetail {
  companyId: string;
  companyName: string;
  isPlayer: boolean;
  isConsortium?: boolean;
  consortiumPartnerName?: string;
  totalVotes: number;
  voteSharePercent: number;
  brandLoyalistVotes: number;
  pragmatistVotes: number;
  floatingVotes: number;
  appealScore: number;
  effectiveMarginPercent: number;
  contractPrice: number;
}

export interface VotingResult {
  complexId: number;
  complexName: string;
  totalEligibleVoters: number;
  totalCastVotes: number;
  winnerId: string | null;
  winnerName: string | null;
  winnerIsConsortium?: boolean;
  isSoleBid: boolean;
  isRebid: boolean;
  negotiatedContract: boolean;
  bidders: BidderVoteDetail[];
  finalProfitMargin: number;
  contractPrice: number;
  assemblySummary: string;
  keyVoteFactor: string;
}

export function simulateGeneralAssemblyVote(
  complex: ComplexData,
  state: ComplexBiddingState,
  companies: CompanyData[],
  playerCompanyId: string,
  playerParticipates: boolean,
  playerProposal?: BidProposal,
  consortiumPartnerId?: string | null,
  builderWonCounts: Record<string, number> = {},
  builderRemainingCapas: Record<string, number> = {}
): VotingResult {
  const companyMap = new Map<string, CompanyData>(companies.map(c => [c.id, c]));
  const playerCompany = companyMap.get(playerCompanyId);

  // 1. 입찰 참여사 식별
  const participatingCompanyIds: string[] = [];

  // 플레이어 참여 여부
  if (playerParticipates && playerCompany) {
    participatingCompanyIds.push(playerCompanyId);
  }

  // 경쟁사 참여 여부
  Object.entries(state.supportScores).forEach(([compId, stance]) => {
    if (compId === playerCompanyId) return;
    if (stance.isWithdrawn) return;
    // 입찰 의지 35 이상이거나 이미 입찰을 선언한 경우
    if (stance.hasBid || stance.hiddenBidIntent >= 35) {
      participatingCompanyIds.push(compId);
    }
  });

  const totalEligibleVoters = complex.originalUnits;
  // 투표 참여율 (88% ~ 96%)
  const turnoutRate = 0.88 + Math.random() * 0.08;
  const totalCastVotes = Math.round(totalEligibleVoters * turnoutRate);

  const brandVoterCount = Math.round(totalCastVotes * (complex.voterSegments.brandLoyalistRatio / 100));
  const pragmatistVoterCount = Math.round(totalCastVotes * (complex.voterSegments.pragmatistRatio / 100));
  const floatingVoterCount = Math.max(0, totalCastVotes - brandVoterCount - pragmatistVoterCount);

  // 케이스 A: 응찰사 0곳 -> 무조건 유찰
  if (participatingCompanyIds.length === 0) {
    return {
      complexId: complex.id,
      complexName: complex.name,
      totalEligibleVoters,
      totalCastVotes: 0,
      winnerId: null,
      winnerName: null,
      isSoleBid: false,
      isRebid: true,
      negotiatedContract: false,
      bidders: [],
      finalProfitMargin: complex.baseExpectedProfitMargin,
      contractPrice: complex.expectedCost,
      assemblySummary: `${complex.name} 시공사 입찰에 단 한 곳의 건설사도 입찰보증금을 납부하지 않아 유찰 처리되었습니다.`,
      keyVoteFactor: '응찰 건설사 부재',
    };
  }

  // 케이스 B: 응찰사 1곳 (단독 응찰)
  if (participatingCompanyIds.length === 1) {
    const soleId = participatingCompanyIds[0];
    const comp = companyMap.get(soleId);
    const compName = comp?.name || '미상';

    // 재입찰이거나 컨소시엄 허용 단지면 수의계약 가능
    if (state.isRebid || complex.biddingRules.consortiumAllowed) {
      const proposal = (soleId === playerCompanyId && playerProposal)
        ? playerProposal
        : comp
        ? generateCompetitorProposal(comp, complex)
        : null;

      const evalRes = (proposal && comp)
        ? evaluateProposal(proposal, complex, comp)
        : { effectiveMarginPercent: complex.baseExpectedProfitMargin, totalCost: complex.expectedCost };

      return {
        complexId: complex.id,
        complexName: complex.name,
        totalEligibleVoters,
        totalCastVotes,
        winnerId: soleId,
        winnerName: compName,
        winnerIsConsortium: soleId === playerCompanyId && !!consortiumPartnerId,
        isSoleBid: true,
        isRebid: false,
        negotiatedContract: true,
        bidders: [
          {
            companyId: soleId,
            companyName: compName,
            isPlayer: soleId === playerCompanyId,
            totalVotes: totalCastVotes,
            voteSharePercent: 100,
            brandLoyalistVotes: brandVoterCount,
            pragmatistVotes: pragmatistVoterCount,
            floatingVotes: floatingVoterCount,
            appealScore: 85,
            effectiveMarginPercent: evalRes.effectiveMarginPercent,
            contractPrice: evalRes.totalCost,
          },
        ],
        finalProfitMargin: evalRes.effectiveMarginPercent,
        contractPrice: evalRes.totalCost,
        assemblySummary: `${complex.name} 총회에서 ${compName} 단독 입찰에 대한 찬반 투표 결과, 찬성 압도 다수로 수의계약 우선협상대상자로 공식 확정되었습니다.`,
        keyVoteFactor: '단독 입찰에 따른 수의계약 총회 인준',
      };
    } else {
      // 1회차 단독 응찰 -> 유찰 후 재입찰로 전환
      return {
        complexId: complex.id,
        complexName: complex.name,
        totalEligibleVoters,
        totalCastVotes: 0,
        winnerId: null,
        winnerName: null,
        isSoleBid: true,
        isRebid: true,
        negotiatedContract: false,
        bidders: [],
        finalProfitMargin: complex.baseExpectedProfitMargin,
        contractPrice: complex.expectedCost,
        assemblySummary: `${compName}가 단독 입찰하였으나, 정비사업 시공사 선정 기준(경쟁입찰 성립 요건 미충족)에 따라 자동 유찰 처리되었습니다.`,
        keyVoteFactor: '2개사 이상 경쟁 요건 미충족으로 인한 자동 유찰',
      };
    }
  }

  // 케이스 C: 2개사 이상 경쟁 총회 투표
  interface BidderScoreRaw {
    companyId: string;
    companyName: string;
    isPlayer: boolean;
    isConsortium: boolean;
    partnerName?: string;
    brandAppeal: number;
    pragmatistAppeal: number;
    floatingAppeal: number;
    effectiveMarginPercent: number;
    contractPrice: number;
  }

  const rawBidders: BidderScoreRaw[] = participatingCompanyIds.map(compId => {
    const isPlayer = compId === playerCompanyId;
    const comp = companyMap.get(compId)!;
    const isConsortium = isPlayer && !!consortiumPartnerId;
    const partnerComp = isConsortium && consortiumPartnerId ? companyMap.get(consortiumPartnerId) : undefined;

    // 제안서 가져오기 및 평가
    const proposal = isPlayer
      ? (playerProposal || generateCompetitorProposal(comp, complex))
      : generateCompetitorProposal(comp, complex);

    const evalRes = evaluateProposal(proposal, complex, comp);
    const stance = state.supportScores[compId];

    // 1. 브랜드 충성파 점수
    let brandAppeal = evalRes.brandLoyalistAppeal;
    if (isConsortium) {
      // 컨소시엄은 브랜드 단독 가치를 희석시켜 브랜드 충성파에게 비선호 (-18점)
      brandAppeal -= 18;
    }
    // 인접 단지 수주 시 브랜드타운 프리미엄 가산 (+12점)
    if (comp.attributes.brand >= 85) {
      brandAppeal += 8;
    }

    // 2. 실리파 점수
    let pragmatistAppeal = evalRes.pragmatistAppeal;
    if (isConsortium) {
      // 컨소시엄은 공사 리스크 분산 및 자금 안정성 측면에서 실리파에게 호평 (+10점)
      pragmatistAppeal += 10;
    }

    // 3. 부동층 점수
    let floatingAppeal = 50;
    if (stance) {
      floatingAppeal += (stance.totalFavorability - 50) * 0.4;
      floatingAppeal += (stance.trustScore - 50) * 0.3;
    }

    // 홍보 피로도 감점 (피로도가 40 이상일 경우 부동층 급격 이탈)
    if (state.prFatigue > 40) {
      const fatiguePenalty = (state.prFatigue - 40) * 0.6;
      floatingAppeal -= fatiguePenalty;
    }

    // 조합 전략 행동 반영
    state.unionActions.forEach(act => {
      if (act.type === 'PUBLIC_WARNING' && act.targetCompanyId === compId) {
        floatingAppeal -= 25;
        brandAppeal -= 10;
      }
      if (act.type === 'ENCOURAGE_COMPETITOR' && !isPlayer) {
        floatingAppeal += 12;
      }
    });

    // 4. 조합의 반독점 및 캐파 과부하(공기 지연 리스크) 페널티 (특정 건설사 독식 방지)
    const alreadyWonCount = builderWonCounts[compId] || 0;
    const remainingCapa = builderRemainingCapas[compId] ?? comp.attributes.capa;

    if (alreadyWonCount === 1) {
      // 1건 수주 상태: 주민들의 인력 분산 및 일정 지연 우려 발생
      pragmatistAppeal -= 8;
      floatingAppeal -= 8;
    } else if (alreadyWonCount >= 2) {
      // 2건 이상 수주 상태: 독점 횡포 우려 및 공기 지연/하자 위험에 대한 조합원들의 거센 경계
      brandAppeal -= 12;
      pragmatistAppeal -= 20;
      floatingAppeal -= 20;
    }

    // 잔여 캐파 부족 시 추가 페널티
    if (remainingCapa < complex.expectedCost * 1.3) {
      pragmatistAppeal -= 14;
      floatingAppeal -= 12;
    }

    // 현장 분위기 랜덤성 (-5 ~ +5)
    const luckNoise = (Math.random() - 0.5) * 10;
    floatingAppeal += luckNoise;

    return {
      companyId: compId,
      companyName: comp.name,
      isPlayer,
      isConsortium,
      partnerName: partnerComp?.name,
      brandAppeal: Math.max(10, brandAppeal),
      pragmatistAppeal: Math.max(10, pragmatistAppeal),
      floatingAppeal: Math.max(10, floatingAppeal),
      effectiveMarginPercent: evalRes.effectiveMarginPercent,
      contractPrice: evalRes.totalCost,
    };
  });

  // 계층별 득표 배분 (소프트맥스/비례 가중치)
  const sumBrand = rawBidders.reduce((sum, b) => sum + Math.max(1, b.brandAppeal), 0);
  const sumPragmatic = rawBidders.reduce((sum, b) => sum + Math.max(1, b.pragmatistAppeal), 0);
  const sumFloating = rawBidders.reduce((sum, b) => sum + Math.max(1, b.floatingAppeal), 0);

  const bidderDetails: BidderVoteDetail[] = rawBidders.map(b => {
    const bVotes = Math.round(brandVoterCount * (b.brandAppeal / sumBrand));
    const pVotes = Math.round(pragmatistVoterCount * (b.pragmatistAppeal / sumPragmatic));
    const fVotes = Math.round(floatingVoterCount * (b.floatingAppeal / sumFloating));
    const totalVotes = bVotes + pVotes + fVotes;
    const share = Number(((totalVotes / totalCastVotes) * 100).toFixed(1));
    const compositeScore = Math.round(
      (b.brandAppeal * complex.voterSegments.brandLoyalistRatio +
        b.pragmatistAppeal * complex.voterSegments.pragmatistRatio +
        b.floatingAppeal * complex.voterSegments.floatingVoterRatio) / 100
    );

    return {
      companyId: b.companyId,
      companyName: b.companyName,
      isPlayer: b.isPlayer,
      isConsortium: b.isConsortium,
      consortiumPartnerName: b.partnerName,
      totalVotes,
      voteSharePercent: share,
      brandLoyalistVotes: bVotes,
      pragmatistVotes: pVotes,
      floatingVotes: fVotes,
      appealScore: compositeScore,
      effectiveMarginPercent: b.effectiveMarginPercent,
      contractPrice: b.contractPrice,
    };
  });

  // 득표순 정렬
  bidderDetails.sort((a, b) => b.totalVotes - a.totalVotes);

  const winner = bidderDetails[0];
  const runnerUp = bidderDetails[1];
  const marginVoteDiff = winner.totalVotes - runnerUp.totalVotes;

  let keyFactor = '전반적인 사업 조건 및 브랜드 선호도 우위';
  if (winner.brandLoyalistVotes > runnerUp.brandLoyalistVotes * 1.3) {
    keyFactor = '압도적인 하이엔드 브랜드 인지도 및 랜드마크 외관 설계';
  } else if (winner.pragmatistVotes > runnerUp.pragmatistVotes * 1.3) {
    keyFactor = '파격적인 공사비 할인 및 분담금 금융 조건';
  } else if (marginVoteDiff <= 25) {
    keyFactor = `불과 ${marginVoteDiff}표 차이의 초박빙 승부! 부동층 현장 표심`;
  }

  const assemblySummary = `${complex.name} 시공사 선정 임시총회 개표 결과, 총 투표수 ${totalCastVotes.toLocaleString()}표 중 ${winner.totalVotes.toLocaleString()}표(${winner.voteSharePercent}%)를 획득한 ${winner.companyName}${winner.isConsortium ? `·${winner.consortiumPartnerName} 컨소시엄` : ''}이(가) 최종 시공사로 당선되었습니다!`;

  return {
    complexId: complex.id,
    complexName: complex.name,
    totalEligibleVoters,
    totalCastVotes,
    winnerId: winner.companyId,
    winnerName: winner.companyName,
    winnerIsConsortium: winner.isConsortium,
    isSoleBid: false,
    isRebid: false,
    negotiatedContract: false,
    bidders: bidderDetails,
    finalProfitMargin: winner.effectiveMarginPercent,
    contractPrice: winner.contractPrice,
    assemblySummary,
    keyVoteFactor: keyFactor,
  };
}
