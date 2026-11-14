import React from 'react';
import { Newspaper, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { IndustryRumor, GameState } from '../types/game';
import { sound } from '../utils/sound';

interface Props {
  rumors: IndustryRumor[];
  gameState: GameState;
  onInvestigateRumor: (rumorId: string) => void;
}

export const RumorBoardPanel: React.FC<Props> = ({
  rumors,
  gameState,
  onInvestigateRumor,
}) => {
  return (
    <div className="w-full bg-slate-900/90 border-t border-slate-800 p-3 sm:p-4 text-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-amber-400" />
            <h4 className="font-pixel text-xs sm:text-sm font-bold text-slate-200">
              가온 신시가지 주택정비업계 소문 & 물밑 첩보 (월간 찌라시)
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            * 모든 소문이 진실은 아닙니다. 정보원을 가동하여 실사를 진행할 수 있습니다.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {rumors.map((rumor) => {
            const canInvestigate = gameState.availableAP >= 1 && gameState.budget >= 4;

            return (
              <div
                key={rumor.id}
                className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between text-xs hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="font-bold text-amber-300 font-pixel mb-1 flex items-start justify-between gap-2">
                    <span>{rumor.headline}</span>
                    {rumor.investigated && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 font-mono ${
                          rumor.isTrue
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {rumor.isTrue ? '사실 확인' : '허위 역정보'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                    {rumor.detail}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                  {rumor.investigated ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle className="w-3 h-3" />
                      신뢰도 분석 완료 ({rumor.truthRate}%)
                    </span>
                  ) : (
                    <button
                      disabled={!canInvestigate}
                      onClick={() => {
                        sound.playClick();
                        onInvestigateRumor(rumor.id);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[10px] text-slate-300 font-pixel flex items-center gap-1 border border-slate-700"
                    >
                      <Search className="w-3 h-3 text-sky-400" />
                      <span>첩보 실사 확인 (1 AP / 4억)</span>
                    </button>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono">
                    {rumor.turn}턴 발행
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
