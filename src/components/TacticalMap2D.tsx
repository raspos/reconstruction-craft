import React from 'react';
import { ComplexData, GameState } from '../types/game';
import { formatKRW } from '../utils/formatters';
import { sound } from '../utils/sound';

interface Props {
  complexes: ComplexData[];
  gameState: GameState;
  selectedComplexId: number | null;
  onSelectComplex: (id: number) => void;
}

export const TacticalMap2D: React.FC<Props> = ({
  complexes,
  gameState,
  selectedComplexId,
  onSelectComplex,
}) => {
  const getStatusBadge = (complex: ComplexData) => {
    const bState = gameState.complexStates[complex.id];
    if (!bState) return null;

    if (bState.winnerId === gameState.playerCompanyId) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500 text-blue-300 text-[10px] font-bold">
          수주 완료
        </span>
      );
    }
    if (bState.winnerId) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500 text-purple-300 text-[10px] font-bold">
          경쟁사 수주
        </span>
      );
    }

    if (bState.currentStage === 'interest') {
      return (
        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-[10px]">
          관심 단계
        </span>
      );
    }

    const myScore = bState.supportScores[gameState.playerCompanyId]?.totalFavorability || 0;
    const otherScores = Object.entries(bState.supportScores)
      .filter(([id, s]) => id !== gameState.playerCompanyId && !s.isWithdrawn)
      .map(([, s]) => s.totalFavorability);
    const topOther = otherScores.length > 0 ? Math.max(...otherScores) : 0;

    if (myScore >= 60 && myScore > topOther + 10) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-[10px] font-bold">
          당사 우세 ({myScore}%)
        </span>
      );
    }
    if (topOther >= 60 && topOther > myScore + 10) {
      return (
        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500 text-rose-300 text-[10px] font-bold">
          경쟁사 우세 ({topOther}%)
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500 text-amber-300 text-[10px] font-bold">
        박빙 경합 ({myScore}% vs {topOther}%)
      </span>
    );
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'interest':
        return '관심 단계';
      case 'pre_sales':
        return '사전 홍보';
      case 'bidding_prep':
        return '입찰 준비';
      case 'bidding':
        return '본 입찰 진행';
      case 'selection':
        return '총회 표결 임박';
      case 'contracted':
        return '시공사 확정';
      default:
        return stage;
    }
  };

  return (
    <div className="w-full bg-slate-900 border-2 border-slate-800 rounded-lg p-3 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <h3 className="font-pixel text-sm font-bold text-slate-200">
          가온 신시가지 2D 전술 지도 (15개 단지 현황판)
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          클릭하여 단지별 영업 활동 및 제안 관리
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {complexes.map((complex) => {
          const bState = gameState.complexStates[complex.id];
          const isSelected = selectedComplexId === complex.id;
          const myScore = bState?.supportScores[gameState.playerCompanyId]?.totalFavorability || 0;

          return (
            <div
              key={complex.id}
              onClick={() => {
                sound.playClick();
                onSelectComplex(complex.id);
              }}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-950/40 border-amber-500 shadow-md transform -translate-y-0.5'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-pixel text-xs sm:text-sm font-bold text-white">
                    {complex.name}
                  </span>
                  {getStatusBadge(complex)}
                </div>
                <div className="text-[11px] text-slate-400 mb-1.5 line-clamp-1">
                  {complex.tagline}
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300">
                  {formatKRW(complex.expectedCost)}
                </span>
                <span className="text-amber-400 font-bold">
                  {bState ? getStageLabel(bState.currentStage) : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
