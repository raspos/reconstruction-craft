import React, { useState } from 'react';
import { ComplexData, ComplexBiddingState, ExternalMarketProject, CompanyData } from '../types/game';
import {
  X,
  Target,
  Users2,
  Network,
  Globe2,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface StrategyWarRoomModalProps {
  complexes: ComplexData[];
  complexStates: Record<number, ComplexBiddingState>;
  staffAllocation: Record<number, number>;
  totalSalesStaff: number;
  externalProjects: ExternalMarketProject[];
  allCompanies: CompanyData[];
  playerCompanyId: string;
  onClose: () => void;
  onAllocateStaff: (newAllocation: Record<number, number>) => void;
}

export const StrategyWarRoomModal: React.FC<StrategyWarRoomModalProps> = ({
  complexes,
  complexStates,
  staffAllocation,
  totalSalesStaff,
  externalProjects,
  allCompanies,
  playerCompanyId,
  onClose,
  onAllocateStaff,
}) => {
  const [activeTab, setActiveTab] = useState<'STAFF' | 'BRAND_TOWN' | 'EXTERNAL'>('STAFF');
  const [currentAllocations, setCurrentAllocations] = useState<Record<number, number>>({
    ...staffAllocation,
  });

  const companyMap = new Map(allCompanies.map((c) => [c.id, c]));

  // 인력 합계 계산
  const allocatedStaffSum = Object.values(currentAllocations).reduce(
    (sum, count) => sum + (Number(count) || 0),
    0
  );
  const remainingStaff = totalSalesStaff - allocatedStaffSum;

  const handleStaffChange = (complexId: number, value: number) => {
    const val = Math.max(0, Math.min(100, value));
    setCurrentAllocations((prev) => ({
      ...prev,
      [complexId]: val,
    }));
  };

  const handleSaveStaff = () => {
    onAllocateStaff(currentAllocations);
  };

  // 활성 단지 (아직 계약 완료되지 않은 단지)
  const activeComplexes = complexes.filter((c) => {
    const s = complexStates[c.id];
    return s && s.currentStage !== 'contracted';
  });

  // 플레이어가 수주한 단지 목록
  const playerWonComplexIds = complexes
    .filter((c) => complexStates[c.id]?.winnerId === playerCompanyId)
    .map((c) => c.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800/90 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                주택영업 전략 상황실 (Strategy War Room)
              </h2>
              <p className="text-xs text-slate-400">
                영업 인력 100명 전술 배치, 가온 브랜드 타운 연계망, 외부 메가 수주전을 총괄 지휘합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 내비게이션 */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 px-5 shrink-0">
          <button
            onClick={() => setActiveTab('STAFF')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'STAFF'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users2 className="w-4 h-4" />
            1. 영업 인력 배치 본부 ({allocatedStaffSum}/{totalSalesStaff}명)
          </button>
          <button
            onClick={() => setActiveTab('BRAND_TOWN')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'BRAND_TOWN'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-4 h-4" />
            2. 가온 브랜드 타운 연계망 ({playerWonComplexIds.length}개소 확보)
          </button>
          <button
            onClick={() => setActiveTab('EXTERNAL')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'EXTERNAL'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            3. 외부 대형 수주전 현황
          </button>
        </div>

        {/* 탭 본문 */}
        <div className="overflow-y-auto p-5 flex-1 bg-slate-950/30 text-xs">
          {/* TAB 1: 영업 인력 배치 */}
          {activeTab === 'STAFF' && (
            <div className="space-y-4">
              {/* 상단 인력 현황 카드 */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-slate-400">보유 영업 인력 풀</div>
                  <div className="text-xl font-bold text-white mt-0.5">총 {totalSalesStaff}명</div>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-slate-400">현장 투입 인원</div>
                    <div className="text-xl font-bold text-indigo-400 mt-0.5">{allocatedStaffSum}명</div>
                  </div>
                  <div>
                    <div className="text-slate-400">본사 대기 예비군</div>
                    <div
                      className={`text-xl font-bold mt-0.5 ${
                        remainingStaff < 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {remainingStaff}명
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSaveStaff}
                  disabled={remainingStaff < 0}
                  className={`px-4 py-2 rounded-lg font-bold shadow-lg transition-all ${
                    remainingStaff < 0
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  }`}
                >
                  배치 확정 및 지시
                </button>
              </div>

              {/* 안내 문구 */}
              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-indigo-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold">영업 인력 투입 효과:</span>
                  <p className="text-slate-300">
                    단지에 투입된 영업 인력 20명당 홍보 실행 시 호감도 +1 보너스가 가산되며, 매 턴 패시브 지지율 상승 및 경쟁사의 정보 공작을 방어합니다.
                  </p>
                </div>
              </div>

              {/* 단지별 인력 슬라이더 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeComplexes.map((complex) => {
                  const currentCount = currentAllocations[complex.id] || 0;
                  const state = complexStates[complex.id];

                  return (
                    <div
                      key={complex.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-bold text-white text-sm">{complex.name}</div>
                          <div className="text-[11px] text-slate-400">
                            단계: {state.currentStage} | 공사비 {(complex.expectedCost / 10000).toFixed(1)}조원
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-indigo-400 font-mono">
                            {currentCount}
                          </span>
                          <span className="text-[11px] text-slate-500">명 투입</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        <input
                          type="range"
                          min="0"
                          max="60"
                          step="5"
                          value={currentCount}
                          onChange={(e) => handleStaffChange(complex.id, Number(e.target.value))}
                          className="flex-1 accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStaffChange(complex.id, currentCount - 5)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-center font-bold"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleStaffChange(complex.id, currentCount + 5)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: 브랜드 타운 연계망 */}
          {activeTab === 'BRAND_TOWN' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/40 text-purple-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
                <div>
                  <span className="font-semibold text-purple-200">브랜드 타운 시너지 효과:</span>
                  <p className="text-slate-300 mt-0.5">
                    지리적으로 인접한 단지들을 연달아 수주할 경우,{' '}
                    <span className="text-emerald-400 font-semibold">공사 원가 마진 +0.4%p 방어</span>,{' '}
                    <span className="text-amber-400 font-semibold">브랜드 충성파 지지율 +12점 보너스</span>, 통합 홍보관 공유 혜택이 발생합니다.
                  </p>
                </div>
              </div>

              {/* 15개 단지 연계 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {complexes.map((c) => {
                  const state = complexStates[c.id];
                  const isWonByPlayer = state.winnerId === playerCompanyId;
                  const winnerComp = state.winnerId ? companyMap.get(state.winnerId) : null;

                  return (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isWonByPlayer
                          ? 'bg-purple-950/30 border-purple-500/80 shadow-lg shadow-purple-900/20'
                          : winnerComp
                          ? 'bg-slate-900/60 border-slate-800 opacity-60'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-white text-sm">{c.name}</span>
                        {isWonByPlayer ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> 우리 브랜드 확보
                          </span>
                        ) : winnerComp ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {winnerComp.name} 수주
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            경쟁 진행 중
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mb-2">
                        계획 세대수: {c.plannedUnits.toLocaleString()}세대 | 공사비 {(c.expectedCost / 10000).toFixed(1)}조원
                      </div>

                      {/* 인접 단지 연계 목록 */}
                      <div className="pt-2 border-t border-slate-800 flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-slate-500">인접 단지:</span>
                        {c.adjacentComplexIds.map((adjId) => {
                          const isAdjWon = playerWonComplexIds.includes(adjId);
                          return (
                            <span
                              key={adjId}
                              className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                isAdjWon
                                  ? 'bg-purple-900 text-purple-200 font-bold'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {adjId}단지
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 외부 대형 수주전 */}
          {activeTab === 'EXTERNAL' && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-blue-300 flex items-start gap-2">
                <Globe2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                <div>
                  <span className="font-semibold text-blue-200">외부 수주 시장 연동 안내:</span>
                  <p className="text-slate-300 mt-0.5">
                    가온 신시가지 외부(강남, 한남, 여의도 등)의 조 단위 메가 프로젝트에 경쟁 대형사들이 전력을 집중하면,{' '}
                    <span className="text-emerald-400 font-semibold">가온 신시가지 내 경쟁사의 캐파가 잠식되어 입찰 의지가 꺾입니다.</span>{' '}
                    적수가 없는 틈새를 공략하여 단독 응찰 무혈입성을 노리십시오.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {externalProjects.map((proj) => {
                  const winnerComp = proj.competitorWinnerId ? companyMap.get(proj.competitorWinnerId) : null;

                  return (
                    <div
                      key={proj.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{proj.name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {(proj.scaleVolume / 10000).toFixed(1)}조원 규모
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">{proj.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        {winnerComp ? (
                          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg text-emerald-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>
                              <strong>{winnerComp.name}</strong> 최종 수주 (캐파 급감)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-950/40 border border-amber-800/50 px-3 py-1.5 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            <span>제{proj.turnResolved}턴 시공사 선정 예정</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-t border-slate-700 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors"
          >
            전략실 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
