import React, { useState } from 'react';
import {
  X,
  Building,
  TrendingUp,
  AlertTriangle,
  Shield,
  Zap,
  Coins,
  ChevronRight,
  Eye,
  Info,
  CheckCircle2,
  Skull,
  FileCheck2,
  Sparkles,
  Users,
  Flame,
  Search,
  Radio,
} from 'lucide-react';
import { ComplexData, GameState, SalesAction } from '../types/game';
import { SALES_ACTIONS } from '../data/actions';
import { CONSTRUCTION_COMPANIES } from '../data/companies';
import { formatKRW, formatNumber, formatPercent } from '../utils/formatters';
import { sound } from '../utils/sound';

interface Props {
  complex: ComplexData;
  gameState: GameState;
  onClose: () => void;
  onExecuteAction: (complexId: number, actionId: string) => void;
  onOpenProposalBuilder?: (complex: ComplexData) => void;
  onInvestigateCompetitor?: (complexId: number, competitorId: string) => void;
}

export const ComplexDetailModal: React.FC<Props> = ({
  complex,
  gameState,
  onClose,
  onExecuteAction,
  onOpenProposalBuilder,
  onInvestigateCompetitor,
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'UNION_AI' | 'SENTIMENT' | 'COMPETITORS'>('ACTIONS');
  const [actionCategory, setActionCategory] = useState<'ALL' | 'LEGAL' | 'RISKY'>('ALL');
  const [confirmRiskyAction, setConfirmRiskyAction] = useState<SalesAction | null>(null);

  const bState = gameState.complexStates[complex.id];
  const mySupport = bState?.supportScores[gameState.playerCompanyId];
  const myScore = mySupport?.totalFavorability || 0;

  // 경쟁사 지지율 목록 (본 사업장에 참여 중인 유효 경쟁사)
  const rivalScores = Object.entries(bState?.supportScores || {})
    .filter(([id, s]) => {
      if (id === gameState.playerCompanyId) return false;
      return !s.isWithdrawn;
    })
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.totalFavorability - a.totalFavorability);

  const topRival = rivalScores[0];
  const topRivalComp = CONSTRUCTION_COMPANIES.find((c) => c.id === topRival?.id);

  // 단지 관련 소문 필터
  const relatedRumors = gameState.rumors.filter((r) => r.relatedComplexId === complex.id);

  // 실행 가능한 액션 필터
  const availableActions = SALES_ACTIONS.filter((a) => {
    if (actionCategory !== 'ALL' && a.category !== actionCategory) return false;
    return a.targetStages.includes(bState.currentStage);
  });

  const handleActionClick = (action: SalesAction) => {
    sound.playClick();
    if (action.category === 'RISKY') {
      sound.playWarningAlert();
      setConfirmRiskyAction(action);
    } else {
      onExecuteAction(complex.id, action.id);
    }
  };

  const confirmAndExecuteRisky = () => {
    if (confirmRiskyAction) {
      onExecuteAction(complex.id, confirmRiskyAction.id);
      setConfirmRiskyAction(null);
    }
  };

  // 조합 AI 최근 전략 성명
  const recentUnionAction =
    bState.unionActions && bState.unionActions.length > 0
      ? bState.unionActions[bState.unionActions.length - 1]
      : null;

  const isBiddingActiveStage =
    bState.currentStage === 'bidding_prep' ||
    bState.currentStage === 'bidding' ||
    bState.currentStage === 'selection';

  const prFatiguePercent = Math.min(100, bState.prFatigue || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/80 flex items-center justify-center">
              <Building className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-pixel text-lg sm:text-xl font-bold text-white">
                  {complex.name}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono border border-slate-700">
                  {bState.currentStage.toUpperCase()} 단계
                </span>
                {bState.winnerId && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-900 text-blue-200 border border-blue-500 font-bold">
                    수주 확정: {bState.winnerId === gameState.playerCompanyId ? '당사 당선' : '경쟁사 선정'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{complex.tagline}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400">세대 수</span>
              <div className="text-sm font-bold text-slate-100 font-mono">
                {formatNumber(complex.originalUnits)} →{' '}
                <strong className="text-amber-400">{formatNumber(complex.plannedUnits)}세대</strong>
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">예상 공사비</span>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {formatKRW(complex.expectedCost)}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">기준 예상 마진</span>
              <div className="text-sm font-bold text-purple-400 font-mono">
                {formatPercent(complex.baseExpectedProfitMargin)}
                {mySupport && mySupport.costOfferedMarginDelta !== 0 && (
                  <span className="text-xs text-rose-400 ml-1">
                    ({mySupport.costOfferedMarginDelta > 0 ? '+' : ''}
                    {mySupport.costOfferedMarginDelta.toFixed(1)}%p)
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">사업 위험도</span>
              <div className="text-sm font-bold text-slate-200">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    complex.riskLevel === 'LOW'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : complex.riskLevel === 'MID'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {complex.riskLevel}
                </span>
              </div>
            </div>
          </div>

          {/* 제안서 작성 CTA 배너 (입찰 준비/진행 단계) */}
          {isBiddingActiveStage && !bState.winnerId && onOpenProposalBuilder && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-blue-950/60 border border-indigo-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-indigo-950/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {bState.playerProposal ? '맞춤형 입찰 제안서 제출 완료' : '입찰 제안서(사업제안서) 미작성'}
                    </span>
                    {bState.playerProposal && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 font-mono border border-emerald-700">
                        접수 완료
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {bState.playerProposal
                      ? `브랜드 티어: ${bState.playerProposal.brandTier} | 공사비 할인: ${bState.playerProposal.costDiscount}`
                      : '11대 옵션을 조립하여 총회 비밀투표에서 부동층과 실리파를 공략하십시오.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenProposalBuilder(complex)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 shrink-0"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>{bState.playerProposal ? '제안서 수정 / 재검토' : '제안서 조립하기'}</span>
              </button>
            </div>
          )}

          {/* 조합 AI 최근 성명 배너 */}
          {recentUnionAction && (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-600/50 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-pixel">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>{recentUnionAction.title}</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed pl-5">
                {recentUnionAction.message}
              </p>
              <div className="text-[10px] text-amber-400/80 pl-5 font-mono">
                ※ 효과: {recentUnionAction.effectDescription}
              </div>
            </div>
          )}

          {/* Voting Support Comparison Bar */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-pixel">
              <span className="text-sky-300 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                당사 지지율: {mySupport?.isWithdrawn ? '철수' : `${myScore}%`}
              </span>
              <span className="text-rose-300 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                경쟁 1위: {topRivalComp ? `${topRivalComp.name} (${topRival.totalFavorability}%)` : '없음'}
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${mySupport?.isWithdrawn ? 0 : myScore}%` }}
              />
              <div
                className="h-full bg-rose-500 ml-auto transition-all duration-300"
                style={{ width: `${topRival ? topRival.totalFavorability : 0}%` }}
              />
            </div>

            {/* 홍보 피로도 게이지 */}
            <div className="pt-2 border-t border-slate-900">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  단지 내 홍보 피로도 (PR Fatigue)
                </span>
                <span
                  className={`font-mono font-bold ${
                    prFatiguePercent >= 50
                      ? 'text-red-400'
                      : prFatiguePercent >= 30
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {prFatiguePercent}/100
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    prFatiguePercent >= 50
                      ? 'bg-red-500'
                      : prFatiguePercent >= 30
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${prFatiguePercent}%` }}
                />
              </div>
              {prFatiguePercent >= 50 && (
                <p className="text-[10px] text-red-400 mt-1">
                  경고: 과도한 영업으로 홍보 피로도가 한계에 달했습니다! 추가 영업 시 주민 반발로 부동층 표심이 급격히 이탈합니다.
                </p>
              )}
            </div>

            {/* Competitor Chips in this complex */}
            <div className="pt-2 border-t border-slate-900">
              <span className="text-[11px] text-slate-400 font-pixel block mb-1.5">
                경쟁 건설사 동향 ({rivalScores.length}곳):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {rivalScores.length === 0 ? (
                  <span className="text-[11px] text-slate-500 font-mono">
                    ※ 현재 공식 참여 중인 경쟁사가 없습니다. (당사 단독 입찰 유리)
                  </span>
                ) : (
                  rivalScores.map((rival) => {
                    const comp = CONSTRUCTION_COMPANIES.find((c) => c.id === rival.id);
                    if (!comp) return null;
                    const isTarget = comp.targetComplexIds.includes(complex.id);
                    const isPrecedent =
                      (complex.id === 6 && comp.id === 'jungwoo') ||
                      (complex.id === 10 && comp.id === 'hangang') ||
                      (complex.id === 12 && comp.id === 'mirae') ||
                      (complex.id === 13 && comp.id === 'taeseong');

                    return (
                      <div
                        key={rival.id}
                        className={`px-2 py-1 rounded text-[11px] font-mono border flex items-center gap-1.5 ${
                          rival.isWithdrawn
                            ? 'bg-slate-900 text-slate-500 border-slate-800 line-through'
                            : rival.totalFavorability >= 55
                            ? 'bg-rose-950/60 text-rose-300 border-rose-700/80 font-bold'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: comp.color }}
                        />
                        <span>{comp.name}</span>
                        {isPrecedent ? (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            유력
                          </span>
                        ) : isTarget ? (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                            우선
                          </span>
                        ) : null}
                        <strong className="text-amber-400">
                          {rival.isWithdrawn ? '철수' : `${rival.totalFavorability}%`}
                        </strong>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                ※ [우선 관심] 표기 건설사는 사전 선호도가 높지만, 당사의 전략적 영업 및 제안서 조건으로 충분히 표심을 뒤집을 수 있습니다.
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-1">
              <span>{complex.description}</span>
            </div>
          </div>

          {/* Rumors Alert Banner if any */}
          {relatedRumors.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-600/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-pixel">
                <Info className="w-4 h-4" />
                <span>단지 관련 찌라시 & 입수 첩보</span>
              </div>
              {relatedRumors.map((r) => (
                <div key={r.id} className="text-xs text-amber-200/90 pl-5 relative">
                  <span className="absolute left-1 top-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <strong>{r.headline}</strong> — {r.detail}
                  {r.investigated ? (
                    <span className="ml-2 px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-emerald-400 border border-emerald-500/50">
                      [실사 검증 완료: {r.isTrue ? '사실로 확인' : '허위 역정보'}]
                    </span>
                  ) : (
                    <span className="ml-2 text-[10px] text-slate-400 font-mono">
                      (신뢰도 미검증)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('ACTIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-pixel transition-colors ${
                activeTab === 'ACTIONS'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              영업 활동 지시 (Action)
            </button>
            <button
              onClick={() => setActiveTab('UNION_AI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-pixel transition-colors ${
                activeTab === 'UNION_AI'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              조합 AI & 유권자 ({complex.voterSegments.brandLoyalistRatio}% / {complex.voterSegments.pragmatistRatio}%)
            </button>
            <button
              onClick={() => setActiveTab('SENTIMENT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-pixel transition-colors ${
                activeTab === 'SENTIMENT'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              조합원 성향 분석 (Radar)
            </button>
            <button
              onClick={() => setActiveTab('COMPETITORS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-pixel transition-colors ${
                activeTab === 'COMPETITORS'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              경쟁사 동향 & 첩보 ({rivalScores.length}개 사)
            </button>
          </div>

          {/* TAB 1: ACTIONS */}
          {activeTab === 'ACTIONS' && (
            <div className="space-y-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">카테고리:</span>
                <button
                  onClick={() => setActionCategory('ALL')}
                  className={`px-2 py-0.5 rounded text-xs ${
                    actionCategory === 'ALL'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setActionCategory('LEGAL')}
                  className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
                    actionCategory === 'LEGAL'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold'
                      : 'text-emerald-400/70 hover:text-emerald-300'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  합법적 영업
                </button>
                <button
                  onClick={() => setActionCategory('RISKY')}
                  className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
                    actionCategory === 'RISKY'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700 font-bold'
                      : 'text-rose-400/70 hover:text-rose-300'
                  }`}
                >
                  <Skull className="w-3 h-3" />
                  위험한 영업 (고수익/고위험)
                </button>
              </div>

              {/* Action List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {availableActions.map((action) => {
                  const canAfford =
                    gameState.availableAP >= action.apCost &&
                    gameState.budget >= action.budgetCost;

                  return (
                    <div
                      key={action.id}
                      className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                        action.category === 'RISKY'
                          ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-600'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-pixel text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            {action.name}
                            {action.category === 'RISKY' && (
                              <span className="px-1 py-0.2 rounded bg-rose-900/80 text-rose-300 text-[9px] font-mono">
                                적발위험 {Math.round(action.riskChance * 100)}%
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="flex items-center gap-0.5 text-yellow-400">
                              <Zap className="w-3 h-3" />
                              {action.apCost} AP
                            </span>
                            <span className="flex items-center gap-0.5 text-emerald-400">
                              <Coins className="w-3 h-3" />
                              {formatKRW(action.budgetCost)}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                          {action.description}
                        </p>
                        <div className="text-[10px] space-y-0.5 mb-2.5">
                          <div className="text-emerald-400">
                            <strong>장점:</strong> {action.pros}
                          </div>
                          <div className="text-rose-400">
                            <strong>단점/대가:</strong> {action.cons}
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={!canAfford || bState.winnerId !== null}
                        onClick={() => handleActionClick(action)}
                        className={`w-full py-1.5 rounded text-xs font-pixel font-bold flex items-center justify-center gap-1 transition-all ${
                          action.category === 'RISKY'
                            ? 'pixel-btn-mc pixel-btn-mc-danger text-white'
                            : 'pixel-btn-mc pixel-btn-mc-primary text-white'
                        }`}
                      >
                        <span>행동 지시 투입</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UNION AI & VOTER SEGMENTS */}
          {activeTab === 'UNION_AI' && (
            <div className="space-y-3">
              {/* 조합 AI 성향 */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-xs font-bold text-amber-400">조합 AI 의사결정 성향</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 font-semibold font-mono">
                    {complex.unionPersonality}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  이 조합은 <strong>{complex.unionPersonality}</strong> 성향으로, 단순히 인지도 높은 대형사에 끌려가지 않고 전략적 밀당을 벌입니다. 특정 건설사가 압도적 우세를 보이면 경쟁사의 추가 입찰을 독려하거나 공사비 추가 인하를 요구할 수 있습니다.
                </p>
              </div>

              {/* 3대 유권자 계층 비율 */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-pixel text-xs font-bold text-slate-200">
                  총회 비밀투표 3대 유권자 계층 비율
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40">
                    <span className="text-amber-400 font-semibold flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" /> 브랜드 충성파
                    </span>
                    <div className="text-base font-black text-amber-300 mt-1 font-mono">
                      {complex.voterSegments.brandLoyalistRatio}%
                    </div>
                    <span className="text-[10px] text-slate-400">하이엔드·외관 중시</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40">
                    <span className="text-cyan-400 font-semibold flex items-center justify-center gap-1">
                      <Flame className="w-3 h-3" /> 실리파
                    </span>
                    <div className="text-base font-black text-cyan-300 mt-1 font-mono">
                      {complex.voterSegments.pragmatistRatio}%
                    </div>
                    <span className="text-[10px] text-slate-400">공사비·금융조건 우선</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/40">
                    <span className="text-indigo-400 font-semibold flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" /> 부동층
                    </span>
                    <div className="text-base font-black text-indigo-300 mt-1 font-mono">
                      {complex.voterSegments.floatingVoterRatio}%
                    </div>
                    <span className="text-[10px] text-slate-400">총회장 당일 여론 좌우</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SENTIMENT RADAR */}
          {activeTab === 'SENTIMENT' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="font-pixel text-xs font-bold text-amber-400 mb-2.5">
                  가온 {complex.id}단지 조합원 의사결정 가중치
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>브랜드 및 외관 특화 선호</span>
                      <strong className="text-sky-400">{complex.sentimentProfile.brandWeight}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500"
                        style={{ width: `${complex.sentimentProfile.brandWeight}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>공사비 인하 민감도 (저가 선호)</span>
                      <strong className="text-emerald-400">{complex.sentimentProfile.costSensitivity}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${complex.sentimentProfile.costSensitivity}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>이주비 등 금융조건 민감도</span>
                      <strong className="text-yellow-400">{complex.sentimentProfile.financeWeight}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500"
                        style={{ width: `${complex.sentimentProfile.financeWeight}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>사업 추진 속도 선호</span>
                      <strong className="text-purple-400">{complex.sentimentProfile.speedPreference}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${complex.sentimentProfile.speedPreference}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>비대위 및 반대파 영향력</span>
                      <strong className="text-rose-400">{complex.sentimentProfile.oppositionPower}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500"
                        style={{ width: `${complex.sentimentProfile.oppositionPower}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Source Citation */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>
                  <strong>데이터 출처:</strong> {complex.dataSource}
                </div>
                <div>
                  <strong>자료 기준일:</strong> {complex.sourceDate}
                </div>
                <div className="text-[10px] text-slate-500">
                  * 1~14단지는 실제 서울 목동 신시가지 재건축 정비계획 공개데이터를 바탕으로 게임 내 변환 모델을 적용하였으며, 15단지는 밸런스용 가상 단지입니다.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMPETITORS & INTEL */}
          {activeTab === 'COMPETITORS' && (
            <div className="space-y-2">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-400 mb-2">
                경쟁사들의 관찰 가능한 겉보기 행동과 실제 숨겨진 입찰 의지 상태입니다. 첩보 조사를 통해 진정성을 밝혀내십시오.
              </div>
              <div className="space-y-2">
                {rivalScores.map((rival) => {
                  const comp = CONSTRUCTION_COMPANIES.find((c) => c.id === rival.id);
                  const isHighReliability = rival.intelReliability === 'HIGH';

                  return (
                    <div
                      key={rival.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: comp?.color || '#94a3b8' }}
                          />
                          <span className="font-pixel text-slate-200 font-bold text-sm">
                            {comp?.name || rival.id}
                          </span>
                          {rival.isWithdrawn ? (
                            <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 text-[10px] border border-rose-800">
                              철수 선언
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                              신뢰도: {rival.intelReliability}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">
                            예상 지지율: <strong className="text-amber-400">{rival.totalFavorability}%</strong>
                          </span>
                          {onInvestigateCompetitor && !isHighReliability && !rival.isWithdrawn && (
                            <button
                              onClick={() => onInvestigateCompetitor(complex.id, rival.id)}
                              className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/50 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Search className="w-3 h-3" />
                              <span>첩보 조사 (1AP / 5억)</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 관찰 가능 활동 목록 */}
                      {rival.observableActions && rival.observableActions.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-900 space-y-1">
                          <span className="text-[10px] text-slate-500">최근 포착된 현장 활동:</span>
                          {rival.observableActions.slice(-2).map((act, i) => (
                            <div key={i} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              <span>{act.description}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 첩보 조사 완료 시 실제 의지 노출 */}
                      {isHighReliability && (
                        <div className="pt-1.5 border-t border-slate-900 text-emerald-400 text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            실제 숨겨진 입찰 의지: <strong>{rival.hiddenBidIntent}%</strong> (정밀 첩보 확인)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-4 py-3 sm:px-6 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            남은 AP: <strong className="text-yellow-400">{gameState.availableAP}</strong> / 영업예산:{' '}
            <strong className="text-emerald-400">{formatKRW(gameState.budget)}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-pixel"
          >
            닫기
          </button>
        </div>
      </div>

      {/* Dangerous Risky Action Confirmation Modal */}
      {confirmRiskyAction && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-500 font-pixel text-base font-bold">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <span>위험 영업 실행 경고 (리스크 승인)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>[{confirmRiskyAction.name}]</strong>을(를) 실행하시겠습니까?
              <br />
              이 행동은 적발 확률이{' '}
              <strong className="text-rose-400">{Math.round(confirmRiskyAction.riskChance * 100)}%</strong>에 달하며,
              적발 시 경찰·검찰 수사, 입찰 자격 박탈, CFO 분노 및 평판 폭락으로 직결될 수 있습니다.
            </p>
            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-900 text-[11px] text-rose-300">
              {confirmRiskyAction.riskPenaltyDesc || '적발 시 막대한 법적 처벌과 감사가 뒤따릅니다.'}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setConfirmRiskyAction(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-pixel"
              >
                취소 (발 빼기)
              </button>
              <button
                onClick={confirmAndExecuteRisky}
                className="pixel-btn-mc pixel-btn-mc-danger px-4 py-1.5 text-xs text-white font-bold"
              >
                리스크 감수하고 결재
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
