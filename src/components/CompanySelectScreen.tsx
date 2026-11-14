import React, { useState } from 'react';
import {
  Building2,
  Shield,
  Zap,
  Coins,
  TrendingUp,
  Target,
  Clock,
  Sparkles,
  ChevronRight,
  Dice5,
} from 'lucide-react';
import { CONSTRUCTION_COMPANIES } from '../data/companies';
import { CompanyData, PlayerTarget } from '../types/game';
import { formatKRW } from '../utils/formatters';
import { sound } from '../utils/sound';

interface Props {
  onStartGame: (
    companyId: string,
    gameMode: 'FULL_24' | 'FAST_12',
    target: PlayerTarget
  ) => void;
}

export const CompanySelectScreen: React.FC<Props> = ({ onStartGame }) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('taeseong');
  const [gameMode, setGameMode] = useState<'FULL_24' | 'FAST_12'>('FULL_24');
  const [targetLevel, setTargetLevel] = useState<'SAFE' | 'CHALLENGE' | 'AGGRESSIVE' | 'RECKLESS'>('CHALLENGE');

  const selectedCompany =
    CONSTRUCTION_COMPANIES.find((c) => c.id === selectedCompanyId) ||
    CONSTRUCTION_COMPANIES[0];

  // 회사의 기본 캐파에 따른 맞춤형 수주 목표 생성
  const getTargetsForCompany = (comp: CompanyData) => {
    const baseCapa = comp.attributes.capa;
    return {
      SAFE: {
        targetVolume: Math.round(baseCapa * 0.5),
        targetLabel: `${(Math.round(baseCapa * 0.5) / 10000).toFixed(1)}조원 (안전한 목표)`,
        riskMultiplier: 0.8,
        desc: '무리하지 않고 알짜 단지 1~2곳만 선점하여 마진을 지키는 안정 추구형',
      },
      CHALLENGE: {
        targetVolume: Math.round(baseCapa * 0.8),
        targetLabel: `${(Math.round(baseCapa * 0.8) / 10000).toFixed(1)}조원 (도전적인 목표)`,
        riskMultiplier: 1.0,
        desc: '경영진의 기대치에 부응하며 랜드마크 및 중대형 단지를 조화롭게 공략',
      },
      AGGRESSIVE: {
        targetVolume: Math.round(baseCapa * 1.1),
        targetLabel: `${(Math.round(baseCapa * 1.1) / 10000).toFixed(1)}조원 (공격적인 목표)`,
        riskMultiplier: 1.3,
        desc: '업계 1위를 노리고 캐파 한계치까지 밀어붙이는 저돌적인 수주 전략',
      },
      RECKLESS: {
        targetVolume: Math.round(baseCapa * 1.5),
        targetLabel: `${(Math.round(baseCapa * 1.5) / 10000).toFixed(1)}조원 (무모한 목표)`,
        riskMultiplier: 1.8,
        desc: '신시가지 전체를 집어삼키겠다는 야망! 실패 시 즉시 해고의 위험 감수',
      },
    };
  };

  const targets = getTargetsForCompany(selectedCompany);
  const selectedTarget = targets[targetLevel];

  const handleRandomSelect = () => {
    sound.playClick();
    const randomComp =
      CONSTRUCTION_COMPANIES[Math.floor(Math.random() * CONSTRUCTION_COMPANIES.length)];
    setSelectedCompanyId(randomComp.id);
  };

  const handleStart = () => {
    sound.playGavelSuccess();
    onStartGame(selectedCompanyId, gameMode, selectedTarget);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/50 text-amber-400 text-xs font-pixel">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CRAFT UNIVERSE 제3탄 — 턴제 정통 경영·전략 시뮬레이션</span>
          </div>
          <h2 className="font-pixel text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            재건축 크래프트: <span className="text-amber-400">시공사 수주전쟁</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            가온 신시가지 15개 아파트 단지의 재건축 시공권을 둘러싼 국내 8대 건설사의 치열한 수주전쟁!
            <br className="hidden sm:inline" />
            주택사업 영업본부장으로 취임하여 수주 잔고와 회사의 이익을 극대화하십시오.
          </p>
        </div>

        {/* 8 Construction Companies Selector Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-pixel text-sm sm:text-base font-bold text-slate-200">
              1. 소속 건설사 선택 (총 8개사)
            </h3>
            <button
              onClick={handleRandomSelect}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 font-pixel flex items-center gap-1.5 border border-slate-700"
            >
              <Dice5 className="w-3.5 h-3.5" />
              <span>랜덤 배정</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CONSTRUCTION_COMPANIES.map((comp) => {
              const isSelected = selectedCompanyId === comp.id;
              return (
                <div
                  key={comp.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedCompanyId(comp.id);
                  }}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 shadow-xl scale-[1.02]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-pixel text-sm font-bold text-white">
                        {comp.name}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: comp.color }}
                      />
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono mb-2 line-clamp-1">
                      {comp.badge}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono border-t border-slate-800 pt-1.5 flex justify-between">
                    <span>캐파 {formatKRW(comp.attributes.capa)}</span>
                    <span className="text-emerald-400">AP {comp.startingAP}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Company Profile Details */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-lg sm:text-xl font-bold text-white">
                  {selectedCompany.name} 주택사업본부
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-amber-400 font-mono">
                  난이도: {selectedCompany.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-300 italic mt-0.5">"{selectedCompany.motto}"</p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              초기 가용 영업예산: <strong className="text-emerald-400">{formatKRW(selectedCompany.startingBudget)}</strong>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {selectedCompany.flavorDescription}
          </p>

          {/* Stats Bar Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">브랜드 파워</span>
              <div className="text-sm font-bold text-sky-400">{selectedCompany.attributes.brand} / 100</div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">자금력 및 신용도</span>
              <div className="text-sm font-bold text-emerald-400">{selectedCompany.attributes.funds} / 100</div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">원가 경쟁력</span>
              <div className="text-sm font-bold text-yellow-400">{selectedCompany.attributes.costComp} / 100</div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">금융조건 제안력</span>
              <div className="text-sm font-bold text-purple-400">{selectedCompany.attributes.finance} / 100</div>
            </div>
          </div>
        </div>

        {/* Target and Game Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Selector */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <h4 className="font-pixel text-sm font-bold text-white">
                2. 올해의 수주 목표 설정
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['SAFE', 'CHALLENGE', 'AGGRESSIVE', 'RECKLESS'] as const).map((lvl) => {
                const isSelected = targetLevel === lvl;
                const t = targets[lvl];
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      sound.playClick();
                      setTargetLevel(lvl);
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-pixel text-xs font-bold text-slate-200">
                      {t.targetLabel}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Game Mode Selector */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h4 className="font-pixel text-sm font-bold text-white">
                3. 게임 기간 모드 선택
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setGameMode('FULL_24');
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  gameMode === 'FULL_24'
                    ? 'bg-sky-950/40 border-sky-500 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-pixel text-xs font-bold text-slate-200">
                  정규 2년 모드 (총 24턴)
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  15개 단지의 수주 일정을 월별로 심층 조율하는 표준 모드
                </div>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setGameMode('FAST_12');
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  gameMode === 'FAST_12'
                    ? 'bg-sky-950/40 border-sky-500 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-pixel text-xs font-bold text-slate-200">
                  단축 1년 모드 (총 12턴)
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  빠르고 박진감 넘치는 속전속결 수주전
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Start Game Action Button */}
        <div className="text-center pt-2">
          <button
            onClick={handleStart}
            className="pixel-btn-mc pixel-btn-mc-amber px-8 py-3.5 text-base sm:text-lg font-bold text-white tracking-wide shadow-2xl flex items-center gap-2 mx-auto"
          >
            <span>{selectedCompany.name} 영업본부장으로 취임 및 게임 시작</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
