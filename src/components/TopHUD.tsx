import React from 'react';
import {
  Calendar,
  Coins,
  TrendingUp,
  Layers,
  Zap,
  UserCheck,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { GameState, CompanyData } from '../types/game';
import { formatKRW, formatPercent } from '../utils/formatters';
import { sound } from '../utils/sound';

interface Props {
  gameState: GameState;
  playerCompany: CompanyData;
  totalWonVolume: number;
  totalExpectedProfit: number;
  onNextTurn: () => void;
}

export const TopHUD: React.FC<Props> = ({
  gameState,
  playerCompany,
  totalWonVolume,
  totalExpectedProfit,
  onNextTurn,
}) => {
  const { currentTurn, totalTurns, availableAP, maxAP, budget, usedCapa, maxCapa, ceoTrust, cfoTrust, legalRisk } =
    gameState;

  const targetVolume = gameState.playerTarget.targetVolume;
  const targetPercent = Math.min(150, Math.round((totalWonVolume / (targetVolume || 1)) * 100));
  const remainingCapa = Math.max(0, maxCapa - usedCapa);
  const capaUsagePercent = Math.min(100, Math.round((usedCapa / (maxCapa || 1)) * 100));

  // 턴 -> 년/월 환산 (2026년 3월 시작)
  const startYear = 2026;
  const startMonth = 3;
  const totalMonths = currentTurn - 1;
  const displayYear = startYear + Math.floor((startMonth + totalMonths - 1) / 12);
  const displayMonth = ((startMonth + totalMonths - 1) % 12) + 1;

  const handleNextTurnClick = () => {
    sound.playTurnAdvance();
    onNextTurn();
  };

  return (
    <div className="w-full bg-slate-900/95 border-b border-slate-800 px-3 py-2 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Row 1: Company Badge & Turn & Target Progress */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Company Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: playerCompany.color }}
            />
            <span className="font-pixel text-sm font-bold text-white">
              {playerCompany.name}
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 font-mono">
              영업본부
            </span>
          </div>

          {/* Turn Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-950 border border-slate-800">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="font-pixel text-sm font-bold text-amber-400">
              {currentTurn} / {totalTurns}턴
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({displayYear}년 {displayMonth}월)
            </span>
          </div>

          {/* Target & Won Volume Progress */}
          <div className="flex-1 min-w-[200px] px-3 py-1.5 rounded bg-slate-950 border border-slate-800 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">수주 실적 / 목표</span>
              <span className="font-pixel text-amber-300 font-bold">
                {formatKRW(totalWonVolume)} / {formatKRW(targetVolume)} ({targetPercent}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  targetPercent >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, targetPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Resources & Trusts & Next Turn Button */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5">
          {/* Action Points (AP) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800">
            <Zap className="w-4 h-4 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-tight">행동력</span>
              <span className="font-pixel text-xs font-bold text-yellow-300">
                {availableAP} / {maxAP} AP
              </span>
            </div>
          </div>

          {/* Sales Budget */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800">
            <Coins className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-tight">영업예산</span>
              <span className="font-pixel text-xs font-bold text-emerald-400">
                {formatKRW(budget)}
              </span>
            </div>
          </div>

          {/* Construction Capacity */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800">
            <Layers className="w-4 h-4 text-sky-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-tight">시공 캐파</span>
              <span className="font-pixel text-xs font-bold text-sky-300">
                {formatKRW(remainingCapa)} 남음
              </span>
            </div>
          </div>

          {/* Expected Profit */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-tight">예상 순이익</span>
              <span className="font-pixel text-xs font-bold text-purple-300">
                {formatKRW(totalExpectedProfit)}
              </span>
            </div>
          </div>

          {/* Executive Trust (CEO / CFO) */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800">
            <div className="flex flex-col text-[10px]">
              <span className="text-slate-400">사장 신뢰: <strong className={ceoTrust >= 70 ? 'text-emerald-400' : 'text-amber-400'}>{ceoTrust}%</strong></span>
              <span className="text-slate-400">CFO 신뢰: <strong className={cfoTrust >= 70 ? 'text-emerald-400' : 'text-rose-400'}>{cfoTrust}%</strong></span>
            </div>
          </div>

          {/* Legal Risk Warning if any */}
          {legalRisk > 20 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/80 border border-rose-500/80 text-rose-300 text-xs animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>수사 리스크 {legalRisk}%</span>
            </div>
          )}

          {/* Next Turn Button */}
          <button
            onClick={handleNextTurnClick}
            className="pixel-btn-mc pixel-btn-mc-amber px-3.5 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 text-white tracking-wide"
          >
            <span>월말 마감 & 다음 달</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
