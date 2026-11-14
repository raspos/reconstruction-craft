import React from 'react';
import {
  Users,
  X,
  Shield,
  TrendingUp,
  Layers,
  AlertTriangle,
  Building,
  Target,
} from 'lucide-react';
import { CONSTRUCTION_COMPANIES } from '../data/companies';
import { GameState, ComplexData } from '../types/game';
import { formatKRW } from '../utils/formatters';

interface Props {
  gameState: GameState;
  complexes: ComplexData[];
  onClose: () => void;
  onSelectComplex: (id: number) => void;
}

export const CompetitorRosterModal: React.FC<Props> = ({
  gameState,
  complexes,
  onClose,
  onSelectComplex,
}) => {
  const { playerCompanyId, competitorStates } = gameState;
  const complexMap = new Map(complexes.map((c) => [c.id, c]));

  const getThreatAnalysis = (compId: string) => {
    switch (compId) {
      case 'hangang':
        return {
          threat: '최고 위험 (HIGH)',
          strategy: '7단지와 14단지 등 초대형 랜드마크에 사활을 걸고 대규모 자금 투입 중',
          color: 'text-rose-400',
        };
      case 'taeseong':
        return {
          threat: '고위험 (HIGH)',
          strategy: '압도적 브랜드 선호도로 일반 조합원 표심 장악, 선별 수주 추구',
          color: 'text-amber-400',
        };
      case 'daeryuk':
        return {
          threat: '중위험 (MID)',
          strategy: '최강의 OS 요원 밀착 스킨십과 돌파형 현장 영업으로 기습 역전 시도',
          color: 'text-yellow-400',
        };
      case 'sewon':
        return {
          threat: '특수 위협 (FINANCE)',
          strategy: 'LTV 100% 보장 및 무이자 금융 패키지로 2·12·15단지 표심 공략',
          color: 'text-purple-400',
        };
      case 'jungwoo':
        return {
          threat: '실속 위협 (MARGIN)',
          strategy: '독보적 원가 절감력으로 알짜 단지들의 지지율을 조용히 잠식',
          color: 'text-sky-400',
        };
      case 'mirae':
        return {
          threat: '디자인 위협 (DESIGN)',
          strategy: '감성 커뮤니티와 특화설계로 중상류층 거주 단지 집중 침투',
          color: 'text-emerald-400',
        };
      case 'shinhwa':
        return {
          threat: '틈새 포식자 (NICHE)',
          strategy: '대형사들의 시선이 닿지 않은 소형 알짜 단지나 15단지 기습 선점',
          color: 'text-amber-400',
        };
      case 'dongbang':
        return {
          threat: '라이벌 마킹 (BLOCKER)',
          strategy: '당사가 1위를 달리는 단지에 고춧가루를 뿌리며 출혈 경쟁 유도',
          color: 'text-rose-400',
        };
      default:
        return {
          threat: '보통',
          strategy: '기본 입찰 조건 유지',
          color: 'text-slate-400',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/80 flex items-center justify-center">
              <Users className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-pixel text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>경쟁 건설사 전력 분석</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  실시간 첩보
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3.5">
          {CONSTRUCTION_COMPANIES.map((company) => {
            const isPlayer = company.id === playerCompanyId;
            const cState = competitorStates[company.id];
            const threatInfo = getThreatAnalysis(company.id);

            // 회사의 캐파/전략에 따른 주력 타깃 단지
            const coreTargetComplexes = company.targetComplexIds
              .map((id) => complexMap.get(id))
              .filter((c): c is ComplexData => !!c);

            // 현재 실제 활성 교전 중인 단지 (자사 캐파 집중 단지 중 미체결 단지)
            const activeEngagedComplexes = complexes.filter((c) => {
              const bState = gameState.complexStates[c.id];
              if (!bState || bState.winnerId || bState.currentStage === 'contracted') return false;
              const supp = bState.supportScores[company.id];
              return (
                supp &&
                !supp.isWithdrawn &&
                company.targetComplexIds.includes(c.id)
              );
            });

            // 해당 회사가 이미 따낸 단지들
            const wonComplexIds = isPlayer
              ? Object.entries(gameState.complexStates)
                  .filter(([, b]) => b.winnerId === playerCompanyId)
                  .map(([id]) => Number(id))
              : cState?.wonComplexIds || [];

            const totalWonVolume = isPlayer
              ? wonComplexIds.reduce((sum, id) => sum + (complexMap.get(id)?.expectedCost || 0), 0)
              : cState?.totalWonVolume || 0;

            const remainingCapa = Math.max(
              0,
              company.attributes.capa - (isPlayer ? gameState.usedCapa : cState?.usedCapa || 0)
            );

            return (
              <div
                key={company.id}
                className={`p-4 rounded-xl border transition-all ${
                  isPlayer
                    ? 'bg-blue-950/30 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: company.color }}
                    />
                    <h4 className="font-pixel text-base font-bold text-white flex items-center gap-2">
                      <span>{company.name}</span>
                      {isPlayer && (
                        <span className="px-1.5 py-0.2 rounded bg-blue-500 text-slate-950 text-[10px] font-bold">
                          당사 (플레이어)
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-amber-300 font-mono">
                      {company.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400">
                      수주액:{' '}
                      <strong className="text-emerald-400">{formatKRW(totalWonVolume)}</strong> (
                      {wonComplexIds.length}건)
                    </span>
                    <span className="text-slate-400">
                      잔여 캐파:{' '}
                      <strong className="text-sky-400">{formatKRW(remainingCapa)}</strong>
                    </span>
                  </div>
                </div>

                {/* Company Specs & Threat Intelligence */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Left: Strategy & Threat */}
                  <div className="space-y-1.5">
                    <div className="text-slate-300 text-[11px]">
                      <strong>모토:</strong> "{company.motto}"
                    </div>
                    {!isPlayer && (
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-pixel">위협도 평가:</span>
                          <span className={`font-bold font-mono ${threatInfo.color}`}>
                            {threatInfo.threat}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {threatInfo.strategy}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Core Targets & Active Battles & Won List */}
                  <div className="space-y-2 text-[11px]">
                    {/* Core Targets by Capacity */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-amber-400 font-pixel font-bold flex items-center gap-1">
                          <Target className="w-3 h-3 text-amber-400" />
                          캐파 맞춤 집중 공략 단지 ({coreTargetComplexes.length}곳):
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {coreTargetComplexes.map((tc) => (
                          <span
                            key={tc.id}
                            onClick={() => {
                              onSelectComplex(tc.id);
                              onClose();
                            }}
                            className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800 cursor-pointer text-[10px] font-mono flex items-center gap-1 font-bold"
                          >
                            {tc.name}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-snug">
                        {company.targetFocusDescription}
                      </p>
                      {company.avoidedComplexIds && company.avoidedComplexIds.length > 0 && (
                        <div className="text-[10px] text-rose-400/80 font-mono mt-0.5">
                          ⛔ 캐파/리스크 배제: {company.avoidedComplexIds.map((id) => `${id}단지`).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Active Engaged Battles */}
                    {activeEngagedComplexes.length > 0 && (
                      <div className="pt-1 border-t border-slate-900">
                        <span className="text-slate-400 font-pixel block mb-1">
                          현재 실시간 총력 교전 중 ({activeEngagedComplexes.length}곳):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {activeEngagedComplexes.map((ac) => (
                            <span
                              key={ac.id}
                              onClick={() => {
                                onSelectComplex(ac.id);
                                onClose();
                              }}
                              className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800 cursor-pointer text-[10px] font-mono flex items-center gap-1 animate-pulse"
                            >
                              🔥 {ac.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-1 border-t border-slate-900">
                      <span className="text-slate-400 font-pixel block mb-1">
                        시공권 확보 완료 단지:
                      </span>
                      {wonComplexIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {wonComplexIds.map((wid) => {
                            const c = complexMap.get(wid);
                            return (
                              <span
                                key={wid}
                                className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono"
                              >
                                {c ? c.name : `${wid}단지`}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[10px]">
                          아직 수주한 단지 없음
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-pixel"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
