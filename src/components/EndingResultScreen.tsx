import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import {
  Trophy,
  Share2,
  Download,
  RotateCcw,
  Building2,
  TrendingUp,
  UserCheck,
  Check,
  Award,
} from 'lucide-react';
import { GameState, ComplexData } from '../types/game';
import { EndingEngine, FinalGameEvaluation } from '../engine/endingEngine';
import { formatKRW, formatPercent } from '../utils/formatters';
import { sound } from '../utils/sound';

interface Props {
  gameState: GameState;
  allComplexes: ComplexData[];
  onRestart: () => void;
}

export const EndingResultScreen: React.FC<Props> = ({
  gameState,
  allComplexes,
  onRestart,
}) => {
  const [evaluation, setEvaluation] = useState<FinalGameEvaluation | null>(null);
  const [copied, setCopied] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const result = EndingEngine.evaluateGame(gameState, allComplexes);
    setEvaluation(result);

    if (result.ending.grade === 'S' || result.ending.grade === 'A') {
      sound.playGavelSuccess();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } else if (result.ending.grade === 'F') {
      sound.playWarningAlert();
    }
  }, [gameState, allComplexes]);

  if (!evaluation) return null;

  const { ending, playerSummary, allCompanyRankings, targetVolume, targetAchievementRate, evaluationNarrative } =
    evaluation;

  const handleShareCopy = () => {
    sound.playClick();
    const shareText = `[재건축 크래프트: 시공사 수주전쟁]\n엔딩: [${ending.title} - ${ending.subtitle}]\n수주 실적: ${formatKRW(playerSummary.totalWonVolume)} (목표 달성률 ${targetAchievementRate}%)\n영업이익: 업계 ${playerSummary.profitRank}위 (${formatKRW(playerSummary.totalExpectedProfit)})\nhttps://raspos.github.io/reconstruction-craft/`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadCard = async () => {
    if (!shareCardRef.current) return;
    sound.playClick();
    try {
      const dataUrl = await toPng(shareCardRef.current, { quality: 0.95 });
      const link = document.createElement('a');
      link.download = `reconstruction-craft-${ending.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full space-y-6 animate-in fade-in zoom-in-95">
        {/* Printable/Shareable Newspaper Card */}
        <div
          ref={shareCardRef}
          className="newspaper-frontpage rounded-lg p-5 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top Newspaper Masthead */}
          <div className="border-b-4 border-slate-950 pb-3 mb-4 text-center">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 uppercase tracking-widest border-b border-slate-300 pb-1 mb-2">
              <span>GAON HOUSING RECONSTRUCTION CHRONICLE</span>
              <span>SPECIAL EDITION</span>
              <span>2028년 결산 호외</span>
            </div>
            <h1 className="font-pixel text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              가온경제신문 <span className="text-red-700 text-lg sm:text-2xl font-normal">[호외]</span>
            </h1>
          </div>

          {/* Ending Stamp */}
          <div className="absolute top-8 right-6 z-10">
            <div
              className={`newspaper-stamp text-sm sm:text-base ${
                ending.grade === 'S' || ending.grade === 'A'
                  ? 'stamp-green'
                  : ending.grade === 'F'
                  ? ''
                  : 'stamp-amber'
              }`}
            >
              {ending.grade}등급 • {ending.title}
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-3 mb-6">
            <h2 className="font-pixel text-xl sm:text-3xl font-extrabold text-slate-950 leading-snug">
              {ending.headline}
            </h2>
            <p className="text-sm sm:text-base font-bold text-red-800 font-pixel">
              {ending.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans bg-amber-50/60 p-3 rounded border border-amber-200">
              {ending.story}
            </p>
          </div>

          {/* Performance Comparison & Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded bg-slate-100 border-2 border-slate-900 mb-6 font-mono text-slate-900">
            <div>
              <span className="text-[11px] text-slate-600 block">수주 목표 및 실적</span>
              <div className="text-base font-bold text-slate-950">
                {formatKRW(playerSummary.totalWonVolume)}
              </div>
              <div className="text-xs text-slate-600">
                목표 {formatKRW(targetVolume)} ({targetAchievementRate}%)
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-600 block">위험조정 영업이익</span>
              <div className="text-base font-bold text-slate-950">
                {formatKRW(playerSummary.totalExpectedProfit)}
              </div>
              <div className="text-xs text-emerald-700 font-bold">
                업계 {playerSummary.profitRank}위 (마진 {playerSummary.avgMarginPercent}%)
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-600 block">수주 단지 수</span>
              <div className="text-base font-bold text-slate-950">
                총 {playerSummary.wonCount}개 단지
              </div>
              <div className="text-xs text-slate-600">
                수주액 순위: 업계 {playerSummary.volumeRank}위
              </div>
            </div>
          </div>

          {/* Executive Dialogue Breakdown */}
          <div className="p-3.5 rounded bg-slate-900 text-slate-100 space-y-2 mb-6 text-xs">
            <div className="flex items-center gap-1.5 font-pixel text-amber-400 font-bold">
              <UserCheck className="w-4 h-4" />
              <span>본사 수뇌부 최종 평가</span>
            </div>
            <div className="space-y-1 font-sans">
              <div className="text-slate-300">
                <strong>대표이사 사장:</strong> {ending.ceoVerdict}
              </div>
              <div className="text-slate-300">
                <strong>최고재무책임자(CFO):</strong> {ending.cfoVerdict}
              </div>
            </div>
          </div>

          {/* Industry Company Rankings Table */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <div className="bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 font-pixel flex justify-between">
              <span>8대 건설사 최종 수주 실적 결산표</span>
              <span>(수주액 순)</span>
            </div>
            <div className="divide-y divide-slate-200 text-xs font-mono text-slate-800 bg-white">
              {allCompanyRankings.map((comp, idx) => {
                const isPlayer = comp.companyId === gameState.playerCompanyId;
                return (
                  <div
                    key={comp.companyId}
                    className={`px-3 py-1.5 flex items-center justify-between ${
                      isPlayer ? 'bg-amber-100 font-bold text-slate-950' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center">{idx + 1}위</span>
                      <span>{comp.companyId.toUpperCase()} 건설 {isPlayer && '(당사)'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>수주 {comp.wonCount}건</span>
                      <span>{formatKRW(comp.totalWonVolume)}</span>
                      <span className="text-slate-500">
                        이익: {formatKRW(comp.totalExpectedProfit)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleShareCopy}
            className="pixel-btn-mc pixel-btn-mc-primary px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 text-white"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? '복사 완료!' : '결과 공유 텍스트 복사'}</span>
          </button>

          <button
            onClick={handleDownloadCard}
            className="pixel-btn-mc px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-200"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>호외 신문 이미지 저장</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="pixel-btn-mc pixel-btn-mc-emerald px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 text-white"
          >
            <RotateCcw className="w-4 h-4" />
            <span>새로운 수주전쟁 시작</span>
          </button>
        </div>
      </div>
    </div>
  );
};
