import React, { useState } from 'react';
import {
  Calendar,
  X,
  Clock,
  Building,
  CheckCircle2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { ComplexData, GameState } from '../types/game';
import { turnToYearMonth, getEstimatedSelectionTurn } from '../data/schedules';
import { formatKRW } from '../utils/formatters';
import { sound } from '../utils/sound';

interface Props {
  complexes: ComplexData[];
  gameState: GameState;
  onClose: () => void;
  onSelectComplex: (id: number) => void;
}

export const ScheduleTimelineModal: React.FC<Props> = ({
  complexes,
  gameState,
  onClose,
  onSelectComplex,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'WON' | 'UPCOMING'>('ALL');

  const { currentTurn, totalTurns } = gameState;

  // 정렬: 수주 시작 턴 순
  const sortedComplexes = [...complexes].sort((a, b) => a.startTurn - b.startTurn);

  const filteredComplexes = sortedComplexes.filter((c) => {
    const bState = gameState.complexStates[c.id];
    if (filter === 'WON') return bState?.winnerId !== null;
    if (filter === 'ACTIVE') {
      return (
        bState &&
        bState.winnerId === null &&
        c.startTurn <= currentTurn &&
        bState.currentStage !== 'contracted'
      );
    }
    if (filter === 'UPCOMING') {
      return c.startTurn > currentTurn && !bState?.winnerId;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/80 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-pixel text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>가온 신시가지 15개 단지 시공사 선정 마스터플랜 타임라인</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                  현재: {currentTurn}턴 ({turnToYearMonth(currentTurn)})
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                각 단지의 사전 영업 개시, 입찰 마감, 시공사 선정 총회 예정 시기를 한눈에 확인하십시오.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-pixel">단지 필터:</span>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded font-pixel transition-colors ${
                filter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              전체 15개 단지
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded font-pixel transition-colors ${
                filter === 'ACTIVE'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              현재 수주전 진행 중
            </button>
            <button
              onClick={() => setFilter('WON')}
              className={`px-2.5 py-1 rounded font-pixel transition-colors ${
                filter === 'WON'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              선정 완료 단지
            </button>
            <button
              onClick={() => setFilter('UPCOMING')}
              className={`px-2.5 py-1 rounded font-pixel transition-colors ${
                filter === 'UPCOMING'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              향후 입찰 예정
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> 사전 홍보
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> 입찰/총회
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> 당사 수주
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-600" /> 경쟁사 수주
            </span>
          </div>
        </div>

        {/* Timeline Rows */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5">
          {filteredComplexes.map((complex) => {
            const bState = gameState.complexStates[complex.id];
            const startTurn = complex.startTurn;
            const selectionTurn = getEstimatedSelectionTurn(startTurn);
            const isWonByPlayer = bState?.winnerId === gameState.playerCompanyId;
            const isWonByRival = bState?.winnerId && !isWonByPlayer;
            const isCurrentMonth = currentTurn >= startTurn && currentTurn <= selectionTurn;

            return (
              <div
                key={complex.id}
                onClick={() => {
                  sound.playClick();
                  onSelectComplex(complex.id);
                  onClose();
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrentMonth && !bState?.winnerId
                    ? 'bg-slate-950 border-amber-500 shadow-md'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {/* Left Info */}
                <div className="min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-sm font-bold text-white">
                      {complex.name}
                    </span>
                    {isWonByPlayer ? (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500 text-[10px] font-bold">
                        당사 수주
                      </span>
                    ) : isWonByRival ? (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500 text-[10px] font-bold">
                        {bState?.winnerId?.toUpperCase()} 수주
                      </span>
                    ) : isCurrentMonth ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500 text-[10px] font-bold animate-pulse">
                        수주전 진행 중
                      </span>
                    ) : startTurn > currentTurn ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                        D-{startTurn - currentTurn}개월 후 입찰
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                        종료
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formatKRW(complex.expectedCost)} • {complex.plannedUnits.toLocaleString()}세대 계획
                  </div>
                </div>

                {/* Center Gantt Bar */}
                <div className="flex-1 w-full bg-slate-900 h-6 rounded-md overflow-hidden relative border border-slate-800 flex items-center">
                  {/* Current Turn Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 shadow"
                    style={{ left: `${Math.min(100, (currentTurn / totalTurns) * 100)}%` }}
                    title={`현재 ${currentTurn}턴`}
                  />

                  {/* Active Schedule Span */}
                  <div
                    className={`absolute top-1 bottom-1 rounded transition-all flex items-center justify-center text-[10px] font-mono font-bold ${
                      isWonByPlayer
                        ? 'bg-blue-600 text-white'
                        : isWonByRival
                        ? 'bg-purple-600 text-white'
                        : isCurrentMonth
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                    style={{
                      left: `${Math.max(0, ((startTurn - 1) / totalTurns) * 100)}%`,
                      width: `${Math.max(6, ((selectionTurn - startTurn + 1) / totalTurns) * 100)}%`,
                    }}
                  >
                    {isWonByPlayer
                      ? '수주 완료'
                      : isWonByRival
                      ? '경쟁사'
                      : `${turnToYearMonth(selectionTurn)} 총회`}
                  </div>
                </div>

                {/* Right Date Details */}
                <div className="text-right text-[11px] font-mono text-slate-300 shrink-0 min-w-[140px] flex items-center justify-between sm:justify-end gap-2">
                  <div>
                    <div className="text-slate-400">선정 총회:</div>
                    <strong className="text-amber-400">
                      {turnToYearMonth(selectionTurn)} ({selectionTurn}턴)
                    </strong>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            * 단지 행을 클릭하면 해당 단지의 상세 정보와 영업 지시 창이 즉시 열립니다.
          </span>
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
