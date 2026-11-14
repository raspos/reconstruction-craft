// 3,000-Game Monte Carlo Balance Simulator for RECONSTRUCTION CRAFT (고도화 2.0 - 18개월/12개월 모드 및 캐파 타깃팅 밸런스)

class SeededRNG {
  constructor(seed = 20261114) {
    this.state = seed >>> 0;
  }
  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  chance(p) {
    return this.next() < p;
  }
}

const COMPANIES = [
  { id: 'taeseong', name: '태성건설', capa: 70000, brand: 92, funds: 92, costComp: 74, finance: 80, salesOrg: 75, targetComplexIds: [1, 3, 5, 7, 9, 11, 13, 15], avoidedComplexIds: [] },
  { id: 'hangang', name: '한강건설', capa: 72000, brand: 88, funds: 88, costComp: 76, finance: 84, salesOrg: 82, targetComplexIds: [2, 4, 6, 8, 10, 12, 14], avoidedComplexIds: [] },
  { id: 'daeryuk', name: '대륙건설', capa: 62000, brand: 83, funds: 80, costComp: 80, finance: 75, salesOrg: 94, targetComplexIds: [7, 8, 11, 14], avoidedComplexIds: [] },
  { id: 'mirae', name: '미래건설', capa: 58000, brand: 89, funds: 80, costComp: 76, finance: 78, salesOrg: 82, targetComplexIds: [2, 4, 9, 11, 12], avoidedComplexIds: [] },
  { id: 'jungwoo', name: '정우건설', capa: 54000, brand: 82, funds: 85, costComp: 95, finance: 82, salesOrg: 72, targetComplexIds: [6, 7, 14], avoidedComplexIds: [] },
  { id: 'sewon', name: '세원건설', capa: 58000, brand: 85, funds: 84, costComp: 80, finance: 96, salesOrg: 80, targetComplexIds: [1, 2, 4], avoidedComplexIds: [] },
  { id: 'dongbang', name: '동방건설', capa: 48000, brand: 82, funds: 78, costComp: 82, finance: 76, salesOrg: 80, targetComplexIds: [2, 7, 11, 14], avoidedComplexIds: [] },
  { id: 'shinhwa', name: '신화건설', capa: 42000, brand: 78, funds: 74, costComp: 88, finance: 74, salesOrg: 78, targetComplexIds: [8, 11, 15], avoidedComplexIds: [] },
];

const COMPLEXES = [
  { id: 1, name: '가온 1단지', cost: 23500, margin: 4.8, startTurn: 1, adj: [2, 6], personality: 'conservative', voterSegments: { brand: 35, pragmatic: 40, floating: 25 }, rules: { consortiumAllowed: true } },
  { id: 2, name: '가온 2단지', cost: 22800, margin: 5.2, startTurn: 3, adj: [1, 3], personality: 'hard_bargainer', voterSegments: { brand: 20, pragmatic: 55, floating: 25 }, rules: { consortiumAllowed: true } },
  { id: 3, name: '가온 3단지', cost: 22400, margin: 4.2, startTurn: 7, adj: [2, 4], personality: 'pragmatic_compromise', voterSegments: { brand: 30, pragmatic: 45, floating: 25 }, rules: { consortiumAllowed: false } },
  { id: 4, name: '가온 4단지', cost: 16500, margin: 6.2, startTurn: 2, adj: [3, 7], personality: 'fast_track', voterSegments: { brand: 25, pragmatic: 50, floating: 25 }, rules: { consortiumAllowed: true } },
  { id: 5, name: '가온 5단지', cost: 26800, margin: 4.0, startTurn: 6, adj: [6, 9], personality: 'brand_centric', voterSegments: { brand: 55, pragmatic: 30, floating: 15 }, rules: { consortiumAllowed: false } },
  { id: 6, name: '가온 6단지', cost: 14800, margin: 5.5, startTurn: 1, adj: [1, 5], personality: 'fast_track', voterSegments: { brand: 35, pragmatic: 35, floating: 30 }, rules: { consortiumAllowed: true } },
  { id: 7, name: '가온 7단지', cost: 31000, margin: 4.5, startTurn: 9, adj: [4, 8, 10], personality: 'brand_centric', voterSegments: { brand: 50, pragmatic: 30, floating: 20 }, rules: { consortiumAllowed: false } },
  { id: 8, name: '가온 8단지', cost: 12800, margin: 6.8, startTurn: 2, adj: [7, 11], personality: 'pragmatic_profit', voterSegments: { brand: 15, pragmatic: 65, floating: 20 }, rules: { consortiumAllowed: true } },
  { id: 9, name: '가온 9단지', cost: 27000, margin: 3.8, startTurn: 11, adj: [5, 10], personality: 'conservative', voterSegments: { brand: 40, pragmatic: 35, floating: 25 }, rules: { consortiumAllowed: false } },
  { id: 10, name: '가온 10단지', cost: 27800, margin: 4.1, startTurn: 10, adj: [7, 9, 14], personality: 'competition_driver', voterSegments: { brand: 35, pragmatic: 40, floating: 25 }, rules: { consortiumAllowed: true } },
  { id: 11, name: '가온 11단지', cost: 18200, margin: 5.8, startTurn: 5, adj: [8, 12], personality: 'internal_feud', voterSegments: { brand: 20, pragmatic: 50, floating: 30 }, rules: { consortiumAllowed: true } },
  { id: 12, name: '가온 12단지', cost: 19200, margin: 5.0, startTurn: 8, adj: [11, 13], personality: 'pragmatic_profit', voterSegments: { brand: 20, pragmatic: 60, floating: 20 }, rules: { consortiumAllowed: true } },
  { id: 13, name: '가온 13단지', cost: 26500, margin: 4.6, startTurn: 12, adj: [12, 14], personality: 'competition_driver', voterSegments: { brand: 30, pragmatic: 45, floating: 25 }, rules: { consortiumAllowed: true } },
  { id: 14, name: '가온 14단지', cost: 36500, margin: 3.5, startTurn: 13, adj: [10, 13, 15], personality: 'brand_centric', voterSegments: { brand: 50, pragmatic: 35, floating: 15 }, rules: { consortiumAllowed: false } },
  { id: 15, name: '가온 15단지', cost: 17000, margin: 7.2, startTurn: 4, adj: [14], personality: 'pragmatic_profit', voterSegments: { brand: 20, pragmatic: 55, floating: 25 }, rules: { consortiumAllowed: true } },
];

function runSingleSimulation(gameIndex, rng) {
  const companyWonVolume = {};
  const companyWonProfit = {};
  const companyWonCount = {};
  const companyCapaUsed = {};
  const wonComplexes = {};

  COMPANIES.forEach(c => {
    companyWonVolume[c.id] = 0;
    companyWonProfit[c.id] = 0;
    companyWonCount[c.id] = 0;
    companyCapaUsed[c.id] = 0;
    wonComplexes[c.id] = [];
  });

  const complexState = {};
  COMPLEXES.forEach(c => {
    complexState[c.id] = {
      winnerId: null,
      withdrawals: 0,
      isSoleBid: false,
      unionPushbackTriggered: false,
    };
  });

  let totalSoleBids = 0;
  let totalWithdrawals = 0;
  let totalUnionPushbacks = 0;
  let totalBrandTownChains = 0;

  // External Market resolution on turns 5, 11
  const extTurns = [5, 11];

  // 18-Turn Standard Game
  for (let turn = 1; turn <= 18; turn++) {
    // External market drain
    if (extTurns.includes(turn)) {
      const bigs = ['hangang', 'taeseong', 'daeryuk'];
      const chosen = bigs[rng.range(0, bigs.length - 1)];
      companyCapaUsed[chosen] += 16000;
    }

    COMPLEXES.forEach(c => {
      if (c.startTurn > turn || complexState[c.id].winnerId) return;

      // Candidate bidding evaluation
      const candidates = [];
      COMPANIES.forEach(comp => {
        // 1. 배제 단지 검사
        if (comp.avoidedComplexIds.includes(c.id)) return;

        // 2. 캐파 한계 검사
        const remaining = comp.capa - companyCapaUsed[comp.id];
        if (remaining < c.cost) return;

        // 3. 기수주 2건 이상 시 추가 입찰 자제
        if (companyWonCount[comp.id] >= 2) return;

        // 3-Segment Voter calculations
        let brandScore = comp.brand * 0.9;
        let pragmaticScore = comp.costComp * 0.75 + comp.finance * 0.25;
        let floatingScore = comp.salesOrg * 0.7 + comp.funds * 0.3;

        // 성향별 디테일 보정
        if (comp.id === 'hangang') {
          // 화려한 랜드마크 옵션: 브랜드 충성파에겐 높으나 실리파에겐 추가분담금 부담
          brandScore += 8;
          pragmaticScore -= 6;
        } else if (comp.id === 'jungwoo') {
          // 원가 1위: 실리파에게 압도적 호평
          pragmaticScore += 12;
        } else if (comp.id === 'sewon') {
          // 금융 1위: LTV 패키지 호평
          pragmaticScore += 10;
          floatingScore += 6;
        } else if (comp.id === 'shinhwa') {
          // 소형 틈새 단지 특화
          if (c.cost <= 18000) {
            pragmaticScore += 10;
            floatingScore += 8;
          }
        }

        // 주력 타깃 단지 보너스
        if (comp.targetComplexIds.includes(c.id)) {
          floatingScore += 8;
          brandScore += 4;
        }

        // 시장 선점/우호 단지 살짝 우대 (6 정우, 10 한강, 12 미래, 13 태성)
        const isPrecedent =
          (c.id === 6 && comp.id === 'jungwoo') ||
          (c.id === 10 && comp.id === 'hangang') ||
          (c.id === 12 && comp.id === 'mirae') ||
          (c.id === 13 && comp.id === 'taeseong');
        if (isPrecedent) {
          floatingScore += 6;
          brandScore += 6;
        }

        // Brand town adjacency synergy bonus
        const hasAdjacentWon = c.adj.some(adjId => wonComplexes[comp.id].includes(adjId));
        if (hasAdjacentWon) {
          brandScore += 10;
          pragmaticScore += 5;
        }

        // 단일 건설사 최대 5개 단지 제한
        if (companyWonCount[comp.id] >= 5) return;

        // 반독점/캐파 과부하 페널티 (조합원 공기 지연 및 독점 우려)
        if (companyWonCount[comp.id] >= 3) {
          pragmaticScore -= 22;
          floatingScore -= 22;
          brandScore -= 15;
        } else if (companyWonCount[comp.id] === 2) {
          pragmaticScore -= 14;
          floatingScore -= 14;
        } else if (companyWonCount[comp.id] === 1) {
          pragmaticScore -= 8;
          floatingScore -= 8;
        }

        // Weighted appeal
        const totalAppeal =
          (brandScore * c.voterSegments.brand +
            pragmaticScore * c.voterSegments.pragmatic +
            floatingScore * c.voterSegments.floating) / 100;

        candidates.push({ comp, appeal: Math.max(10, Math.round(totalAppeal + rng.range(-5, 5))) });
      });

      candidates.sort((a, b) => b.appeal - a.appeal);

      // Union AI Pushback logic: if leader is too dominant (>= 74), union encourages rival
      if (candidates.length >= 2 && candidates[0].appeal >= 74 && (candidates[0].appeal - candidates[1].appeal >= 18)) {
        if (!complexState[c.id].unionPushbackTriggered && rng.chance(0.6)) {
          complexState[c.id].unionPushbackTriggered = true;
          totalUnionPushbacks++;
          candidates[1].appeal += 14;
          candidates.sort((a, b) => b.appeal - a.appeal);
        }
      }

      // Tactical withdrawal logic
      const active = [];
      candidates.forEach((cand, idx) => {
        if (idx > 1 && candidates[0].appeal >= 72 && cand.appeal <= 42 && rng.chance(0.65)) {
          totalWithdrawals++;
          complexState[c.id].withdrawals++;
        } else {
          active.push(cand);
        }
      });

      // Selection round (starts at startTurn + 4 or final turn)
      const isUrgent = turn >= 18; // 완결 보장
      if ((turn >= c.startTurn + 4 || isUrgent) && !complexState[c.id].winnerId) {
        if (active.length === 1) {
          totalSoleBids++;
          complexState[c.id].isSoleBid = true;
          const winner = active[0].comp;
          complexState[c.id].winnerId = winner.id;
          wonComplexes[winner.id].push(c.id);
          companyWonVolume[winner.id] += c.cost;
          companyWonProfit[winner.id] += c.cost * (c.margin / 100);
          companyWonCount[winner.id]++;
          companyCapaUsed[winner.id] += c.cost;
        } else if (active.length > 1) {
          active.sort((a, b) => (b.appeal + rng.range(-4, 4)) - (a.appeal + rng.range(-4, 4)));
          const winner = active[0].comp;
          complexState[c.id].winnerId = winner.id;
          wonComplexes[winner.id].push(c.id);
          companyWonVolume[winner.id] += c.cost;
          companyWonProfit[winner.id] += c.cost * (c.margin / 100);
          companyWonCount[winner.id]++;
          companyCapaUsed[winner.id] += c.cost;
        } else {
          // 비상 fallback (단일 건설사 최대 5개 미만인 건설사 중 선택)
          const eligible = COMPANIES.filter((cp) => companyWonCount[cp.id] < 5);
          const winner = eligible.length > 0 ? eligible[rng.range(0, eligible.length - 1)] : COMPANIES[0];
          complexState[c.id].winnerId = winner.id;
          wonComplexes[winner.id].push(c.id);
          companyWonVolume[winner.id] += c.cost;
          companyWonProfit[winner.id] += c.cost * (c.margin / 100);
          companyWonCount[winner.id]++;
          companyCapaUsed[winner.id] += c.cost;
        }
      }
    });
  }

  // Count brand town chains (>= 2 adjacent won)
  COMPANIES.forEach(c => {
    const list = wonComplexes[c.id];
    let hasChain = false;
    list.forEach(cId => {
      const compObj = COMPLEXES.find(x => x.id === cId);
      if (compObj && compObj.adj.some(aId => list.includes(aId))) {
        hasChain = true;
      }
    });
    if (hasChain) totalBrandTownChains++;
  });

  // Determine volume rank 1 & profit rank 1
  let bestVolumeComp = COMPANIES[0].id;
  let maxVol = -1;
  let bestProfitComp = COMPANIES[0].id;
  let maxProfit = -1;

  COMPANIES.forEach(c => {
    if (companyWonVolume[c.id] > maxVol) {
      maxVol = companyWonVolume[c.id];
      bestVolumeComp = c.id;
    }
    if (companyWonProfit[c.id] > maxProfit) {
      maxProfit = companyWonProfit[c.id];
      bestProfitComp = c.id;
    }
  });

  // Check unresolved complexes
  let unresolvedCount = 0;
  COMPLEXES.forEach(c => {
    if (!complexState[c.id].winnerId) unresolvedCount++;
  });

  return {
    bestVolumeComp,
    bestProfitComp,
    companyWonVolume,
    companyWonProfit,
    companyWonCount,
    totalSoleBids,
    totalWithdrawals,
    totalUnionPushbacks,
    totalBrandTownChains,
    unresolvedCount,
  };
}

console.log('=========================================================================================');
console.log('RECONSTRUCTION CRAFT: 3,000-Game Monte Carlo Balance Simulator (18-Turn & Anti-Monopoly)');
console.log('=========================================================================================');

const TOTAL_RUNS = 3000;
const rng = new SeededRNG(20261114);

const volumeWinCounts = {};
const profitWinCounts = {};
const volumeSums = {};
const profitSums = {};
const countSums = {};

COMPANIES.forEach(c => {
  volumeWinCounts[c.id] = 0;
  profitWinCounts[c.id] = 0;
  volumeSums[c.id] = 0;
  profitSums[c.id] = 0;
  countSums[c.id] = 0;
});

let totalSoleBidsAll = 0;
let totalWithdrawalsAll = 0;
let totalUnionPushbacksAll = 0;
let totalBrandTownChainsAll = 0;
let totalUnresolvedAll = 0;

for (let i = 0; i < TOTAL_RUNS; i++) {
  const result = runSingleSimulation(i, rng);
  volumeWinCounts[result.bestVolumeComp]++;
  profitWinCounts[result.bestProfitComp]++;
  totalSoleBidsAll += result.totalSoleBids;
  totalWithdrawalsAll += result.totalWithdrawals;
  totalUnionPushbacksAll += result.totalUnionPushbacks;
  totalBrandTownChainsAll += result.totalBrandTownChains;
  totalUnresolvedAll += result.unresolvedCount;

  COMPANIES.forEach(c => {
    volumeSums[c.id] += result.companyWonVolume[c.id];
    profitSums[c.id] += result.companyWonProfit[c.id];
    countSums[c.id] += result.companyWonCount[c.id];
  });
}

console.log('\n[3,000회 시뮬레이션 결과 종합 - 건설사별 수주액 1위율 / 순이익 1위율 / 평균 수주 건수]');
console.log('-----------------------------------------------------------------------------------------');
console.log('건설사명    | 수주액 1위율 | 순이익 1위율 | 평균 수주액 (조원) | 평균 순이익 (억원) | 평균 수주 건수');
console.log('-----------------------------------------------------------------------------------------');

COMPANIES.forEach(c => {
  const volRate = ((volumeWinCounts[c.id] / TOTAL_RUNS) * 100).toFixed(1);
  const profitRate = ((profitWinCounts[c.id] / TOTAL_RUNS) * 100).toFixed(1);
  const avgVol = (volumeSums[c.id] / TOTAL_RUNS / 10000).toFixed(2);
  const avgProfit = Math.round(profitSums[c.id] / TOTAL_RUNS);
  const avgCount = (countSums[c.id] / TOTAL_RUNS).toFixed(1);

  console.log(
    `${c.name.padEnd(8)} | ${volRate.padStart(10)}% | ${profitRate.padStart(10)}% | ${avgVol.padStart(16)}조 | ${String(avgProfit).padStart(16)}억 | ${avgCount.padStart(11)}건`
  );
});

console.log('-----------------------------------------------------------------------------------------');
console.log(`- 게임당 단독 입찰/수의계약 평균: ${(totalSoleBidsAll / TOTAL_RUNS).toFixed(1)}건 (${((totalSoleBidsAll / (TOTAL_RUNS * 15)) * 100).toFixed(1)}%)`);
console.log(`- 게임당 전략적 철수 발생 평균: ${(totalWithdrawalsAll / TOTAL_RUNS).toFixed(1)}건`);
console.log(`- 게임당 조합 견제(Pushback) 발동: ${(totalUnionPushbacksAll / TOTAL_RUNS).toFixed(1)}회`);
console.log(`- 18턴 내 미결(낙오) 단지 수: ${(totalUnresolvedAll / TOTAL_RUNS).toFixed(2)}건 (100% 완결 보장)`);
console.log('=========================================================================================\n');
