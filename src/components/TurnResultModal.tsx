import React, { useEffect } from 'react';
import {
  FileText,
  Gavel,
  AlertCircle,
  TrendingUp,
  UserCheck,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { GameState, MarketEvent } from '../types/game';
import { formatKRW } from '../utils/formatters';
import { sound } from '../utils/sound';

interface Props {
  gameState: GameState;
  contractsSigned: Array<{ complexName: string; winnerName: string; price: number }>;
  newEvents: MarketEvent[];
  onClose: () => void;
}

export const TurnResultModal: React.FC<Props> = ({
  gameState,
  contractsSigned,
  newEvents,
  onClose,
}) => {
  const { currentTurn, ceoTrust, cfoTrust } = gameState;

  useEffect(() => {
    if (contractsSigned.length > 0) {
      sound.playGavelSuccess();
    }
  }, [contractsSigned]);

  // 임원진 촌철살인 코멘트 생성
  const getExecutiveComment = () => {
    if (cfoTrust < 40) {
      return {
        speaker: '최고재무책임자(CFO)',
        quote: '"본부장님, 수주액 10조원은 화려한데 남는 돈은 얼마입니까? 우리가 자선사업 합니까?"',
        color: 'text-rose-400',
      };
    }
    if (ceoTrust < 45) {
      return {
        speaker: '대표이사(사장)',
        quote: '"경쟁사들이 알짜배기 단지를 싹쓸이하는 동안 우리 주택사업본부는 낮잠이라도 잤습니까?"',
        color: 'text-amber-400',
      };
    }
    if (ceoTrust >= 80 && cfoTrust >= 75) {
      return {
        speaker: '대표이사(사장)',
        quote: '"영업본부장 아주 잘하고 있어! 이 기세로 연말 수주고를 휩쓸어 보세."',
        color: 'text-emerald-400',
      };
    }
    return {
      speaker: '최고재무책임자(CFO)',
      quote: '"공사비 덤핑보다는 현금 흐름과 원가율 방어가 최우선입니다. 명심하십시오."',
      color: 'text-sky-400',
    };
  };

  const execComment = getExecutiveComment();

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-pixel text-base sm:text-lg font-bold text-white">
              {currentTurn - 1}월차 주택사업영업본부 월간 결산 보고
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {gameState.playerCompanyId.toUpperCase()} CORP.
          </span>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Executive Dialogue Card */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-300 font-pixel">
                {execComment.speaker}의 한마디:
              </div>
              <p className={`text-xs mt-1 italic font-medium ${execComment.color}`}>
                {execComment.quote}
              </p>
            </div>
          </div>

          {/* Contracts Signed Section */}
          {contractsSigned.length > 0 ? (
            <div className="p-3.5 rounded-lg bg-blue-950/30 border border-blue-600/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-300 font-pixel">
                <Gavel className="w-4 h-4 text-amber-400" />
                <span>이번 달 시공사 선정 총회 결과</span>
              </div>
              <div className="space-y-1.5">
                {contractsSigned.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-white">{c.complexName}</span>
                    <span className="text-slate-300 font-mono">
                      낙찰: <strong className="text-amber-400">{c.winnerName}</strong> (
                      {formatKRW(c.price)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 text-center">
              이번 달에는 시공사 선정 총회가 진행된 단지가 없습니다.
            </div>
          )}

          {/* Market Events Triggered */}
          {newEvents.length > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-600/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-pixel">
                <AlertCircle className="w-4 h-4" />
                <span>업계 돌발 사건 및 시장 변동</span>
              </div>
              {newEvents.map((evt) => (
                <div key={evt.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="font-bold text-amber-400">{evt.title}</div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{evt.description}</p>
                  <div className="text-emerald-400 text-[10px] font-mono">
                    효과: {evt.effectDescription}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="pixel-btn-mc pixel-btn-mc-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 text-white"
          >
            <span>확인하고 다음 달 업무 개시</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
