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

  // 1. 실제 공식 입찰 확정사 식별 (호감도와 무관하게 명시적 입찰자격 및 보증금 납부사만 참여)
  const participatingCompanyIds: string[] = [];

  // 플레이어 참여 여부 (입찰 확정 및 제안서 제출 완료 시에만 참여)
  if (playerParticipates && playerCompany) {
    participatingCompanyIds.push(playerCompanyId);
  }

  // 경쟁사 참여 여부 (공식 입찰 등록 hasBid 가 true 인 건설사만 참여)
  Object.entries(state.supportScores).forEach(([compId, stance]) => {
    if (compId === playerCompanyId) return;
    if (stance.isWithdrawn) return;
    if (stance.hasBid) {
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
    const alreadyWon = builderWonCounts[soleId] || 0;

    // 단일 건설사 수주 한도 상한 (최대 5개 단지 제한)
    if (alreadyWon >= 5) {
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
        assemblySummary: `${compName}이(가) 단독 응찰하였으나, 독점 방지 상한 규정(단일 건설사 최대 5개 단지 제한)에 도달하여 입찰 자격이 박탈되어 유찰 처리되었습니다.`,
        keyVoteFactor: '단일 건설사 수주 상한(최대 5개 단지) 초과',
      };
    }

    // 정비사업 시공사 선정 기준 법령 적용:
    // 1회차 입찰에서 단독 응찰 시: 2개사 이상 경쟁입찰 요건 미충족으로 자동 유찰 (수의계약 불가)
    // 2회차 재입찰에서도 단독 응찰 시: 조합 총회에 '수의계약 우선협상대상자 지정 찬반 투표' 부의
    if (!state.isRebid) {
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
        assemblySummary: `${compName}가 단독 응찰하였으나, 정비사업 계약업무 처리기준(경쟁입찰 성립 요건 2개사 미달)에 따라 1회차 자동 유찰되었습니다. 2회차 재입찰이 공고됩니다.`,
        keyVoteFactor: '1회차 단독 응찰로 인한 자동 유찰 (경쟁 성립 요건 미달)',
      };
    }

    // 2회차 이상 단독 응찰인 경우: 조합원 찬반 투표 실시
    const proposal =
      soleId === playerCompanyId && playerProposal
        ? playerProposal
        : comp
        ? generateCompetitorProposal(comp, complex)
        : null;

    const evalRes =
      proposal && comp
        ? evaluateProposal(proposal, complex, comp)
        : null;

    const stance = state.supportScores[soleId];
    const favorability = stance?.totalFavorability || 50;
    const trust = stance?.trustScore || 70;
    const appeal = evalRes ? evalRes.pragmatistAppeal : 50;
    const effectiveMargin = evalRes ? evalRes.effectiveMarginPercent : complex.baseExpectedProfitMargin;
    const finalCost = evalRes ? evalRes.totalCost : complex.expectedCost;

    // 찬성률 산출: 호감도 50%, 신뢰도 30%, 제안서 매력도 20%
    const approvalPercent = Math.min(
      96,
      Math.max(25, Math.round(favorability * 0.5 + trust * 0.3 + appeal * 0.2))
    );

    const yesVotes = Math.round(totalCastVotes * (approvalPercent / 100));
    const noVotes = totalCastVotes - yesVotes;
    const isApproved = yesVotes > totalCastVotes * 0.5;

    if (isApproved) {
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
            totalVotes: yesVotes,
            voteSharePercent: approvalPercent,
            brandLoyalistVotes: Math.round(brandVoterCount * (approvalPercent / 100)),
            pragmatistVotes: Math.round(pragmatistVoterCount * (approvalPercent / 100)),
            floatingVotes: Math.round(floatingVoterCount * (approvalPercent / 100)),
            appealScore: approvalPercent,
            effectiveMarginPercent: effectiveMargin,
            contractPrice: finalCost,
          },
        ],
        finalProfitMargin: effectiveMargin,
        contractPrice: finalCost,
        assemblySummary: `${complex.name} 2회 유찰 후 열린 시공사 선정 총회에서 조합원 찬성률 ${approvalPercent}%(찬성 ${yesVotes}표 / 반대 ${noVotes}표)로 ${compName}과의 수의계약이 최종 인준되었습니다.`,
        keyVoteFactor: `수의계약 조합원 총회 인준 가결 (찬성률 ${approvalPercent}%)`,
      };
    } else {
      // 찬성 과반 미달로 수의계약 부결!
      return {
        complexId: complex.id,
        complexName: complex.name,
        totalEligibleVoters,
        totalCastVotes,
        winnerId: null,
        winnerName: null,
        isSoleBid: true,
        isRebid: true,
        negotiatedContract: false,
        bidders: [
          {
            companyId: soleId,
            companyName: compName,
            isPlayer: soleId === playerCompanyId,
            totalVotes: yesVotes,
            voteSharePercent: approvalPercent,
            brandLoyalistVotes: Math.round(brandVoterCount * (approvalPercent / 100)),
            pragmatistVotes: Math.round(pragmatistVoterCount * (approvalPercent / 100)),
            floatingVotes: Math.round(floatingVoterCount * (approvalPercent / 100)),
            appealScore: approvalPercent,
            effectiveMarginPercent: effectiveMargin,
            contractPrice: finalCost,
          },
        ],
        finalProfitMargin: complex.baseExpectedProfitMargin,
        contractPrice: complex.expectedCost,
        assemblySummary: `${complex.name} 총회에서 ${compName} 단독 입찰안에 대한 수의계약 찬반 투표 결과, 찬성률이 ${approvalPercent}%에 그쳐 과반 미달로 부결되었습니다.`,
        keyVoteFactor: `조합원 수의계약 안건 부결 (찬성률 ${approvalPercent}%로 과반 미달)`,
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

    // 4. 조합의 반독점 및 캐파 과부하(공기 지연 리스크) 페널티 (단일 건설사 최대 5개 제한)
    const alreadyWonCount = builderWonCounts[compId] || 0;
    const remainingCapa = builderRemainingCapas[compId] ?? comp.attributes.capa;

    const isExceededMaxCap = alreadyWonCount >= 5;

    if (isExceededMaxCap) {
      // 5개 이상 수주 시: 반독점 및 시공능력 초과로 전면 득표 배제 (0점)
      brandAppeal = 0;
      pragmatistAppeal = 0;
      floatingAppeal = 0;
    } else {
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
    }

    return {
      companyId: compId,
      companyName: comp.name,
      isPlayer,
      isConsortium,
      partnerName: partnerComp?.name,
      brandAppeal: isExceededMaxCap ? 0 : Math.max(10, brandAppeal),
      pragmatistAppeal: isExceededMaxCap ? 0 : Math.max(10, pragmatistAppeal),
      floatingAppeal: isExceededMaxCap ? 0 : Math.max(10, floatingAppeal),
      effectiveMarginPercent: evalRes.effectiveMarginPercent,
      contractPrice: evalRes.totalCost,
    };
  });

  // 계층별 득표 배분 (소프트맥스/비례 가중치)
  const sumBrand = rawBidders.reduce((sum, b) => sum + (b.brandAppeal > 0 ? b.brandAppeal : 0), 0) || 1;
  const sumPragmatic = rawBidders.reduce((sum, b) => sum + (b.pragmatistAppeal > 0 ? b.pragmatistAppeal : 0), 0) || 1;
  const sumFloating = rawBidders.reduce((sum, b) => sum + (b.floatingAppeal > 0 ? b.floatingAppeal : 0), 0) || 1;

  const bidderDetails: BidderVoteDetail[] = rawBidders.map(b => {
    const isExceeded = (builderWonCounts[b.companyId] || 0) >= 5;
    const bVotes = isExceeded ? 0 : Math.round(brandVoterCount * (b.brandAppeal / sumBrand));
    const pVotes = isExceeded ? 0 : Math.round(pragmatistVoterCount * (b.pragmatistAppeal / sumPragmatic));
    const fVotes = isExceeded ? 0 : Math.round(floatingVoterCount * (b.floatingAppeal / sumFloating));
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
