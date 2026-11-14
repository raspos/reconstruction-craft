import React, { useState, useEffect, useMemo } from 'react';
import { GameEngine } from './engine/gameEngine';
import { GameState, ComplexData, PlayerTarget, BidProposal } from './types/game';
import { CONSTRUCTION_COMPANIES } from './data/companies';
import { ScheduleMasterplanId } from './data/schedules';
import { CraftUniverseNavbar } from './components/CraftUniverseNavbar';
import { TopHUD } from './components/TopHUD';
import { CityMapCanvas } from './components/3d/CityMapCanvas';
import { TacticalMap2D } from './components/TacticalMap2D';
import { ComplexDetailModal } from './components/ComplexDetailModal';
import { TurnResultModal } from './components/TurnResultModal';
import { RumorBoardPanel } from './components/RumorBoardPanel';
import { CompanySelectScreen } from './components/CompanySelectScreen';
import { EndingResultScreen } from './components/EndingResultScreen';
import { DataLabModal } from './components/DataLabModal';
import { BalanceSimulatorModal } from './components/BalanceSimulatorModal';
import { ScheduleTimelineModal } from './components/ScheduleTimelineModal';
import { CompetitorRosterModal } from './components/CompetitorRosterModal';
import { ProposalBuilderModal } from './components/ProposalBuilderModal';
import { VirtualCommunityModal } from './components/VirtualCommunityModal';
import { StrategyWarRoomModal } from './components/StrategyWarRoomModal';
import { VisitorCounter } from './components/VisitorCounter';
import { trackFunnelStep } from './utils/funnelTracker';
import { saveGameToStorage, loadGameFromStorage, clearSavedGame } from './utils/storage';
import { formatKRW } from './utils/formatters';
import { sound } from './utils/sound';
import { Box, Map, History, Users, Calendar, MessageSquare, Target } from 'lucide-react';

export const App: React.FC = () => {
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [phase, setPhase] = useState<'SELECT' | 'GAME' | 'ENDING'>('SELECT');
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');

  // Modals
  const [selectedComplexId, setSelectedComplexId] = useState<number | null>(null);
  const [proposalComplex, setProposalComplex] = useState<ComplexData | null>(null);
  const [isDataLabOpen, setIsDataLabOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isWarRoomOpen, setIsWarRoomOpen] = useState(false);

  const [turnResultData, setTurnResultData] = useState<{
    isOpen: boolean;
    contracts: any[];
    events: any[];
  }>({
    isOpen: false,
    contracts: [],
    events: [],
  });

  // Action status message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 게임 시작 (회사, 모드, 목표, 시공사 선정 일정 마스터플랜 설정)
  const handleStartGame = (
    companyId: string,
    gameMode: 'STANDARD_18' | 'FAST_12',
    target: PlayerTarget,
    scheduleId: ScheduleMasterplanId = 'STANDARD'
  ) => {
    const newEngine = new GameEngine(companyId, gameMode, Date.now(), target, scheduleId);
    setEngine(newEngine);
    const st = newEngine.getState();
    setGameState({ ...st });
    setPhase('GAME');
    saveGameToStorage(st);
    trackFunnelStep('start');
  };

  // 영업 행동 실행
  const handleExecuteAction = (complexId: number, actionId: string) => {
    if (!engine) return;
    const result = engine.executePlayerAction(complexId, actionId);
    setGameState({ ...engine.getState() });

    if (result.success) {
      sound.playClick();
      showToast(result.message);
    } else {
      sound.playWarningAlert();
      showToast(result.message);
    }
  };

  // 입찰 제안서 제출
  const handleSubmitProposal = (proposal: BidProposal, consortiumPartnerId?: string | null) => {
    if (!engine || !proposalComplex) return;
    const result = engine.submitPlayerProposal(proposalComplex.id, proposal, consortiumPartnerId);
    setGameState({ ...engine.getState() });

    if (result.success) {
      sound.playGavelSuccess();
      showToast(
        `[제안서 접수] ${proposalComplex.name} 맞춤 제안서 공식 접수 완료! (예상 마진: ${result.evalResult.effectiveMarginPercent}%)`
      );
      setProposalComplex(null);
    } else {
      sound.playWarningAlert();
      showToast(result.message);
    }
  };

  // 영업 인력(100명) 재배치
  const handleAllocateStaff = (allocations: Record<number, number>) => {
    if (!engine) return;
    const res = engine.allocateStaff(allocations);
    setGameState({ ...engine.getState() });
    if (res.success) {
      sound.playClick();
      showToast(res.message);
    } else {
      sound.playWarningAlert();
      showToast(res.message);
    }
  };

  // 경쟁사 첩보 조사
  const handleInvestigateCompetitor = (complexId: number, competitorId: string) => {
    if (!engine) return;
    const res = engine.investigateCompetitor(complexId, competitorId);
    setGameState({ ...engine.getState() });
    if (res.success) {
      sound.playClick();
      showToast(res.message);
    } else {
      sound.playWarningAlert();
      showToast(res.message);
    }
  };

  // 월말 마감 & 다음 턴 진행
  const handleNextTurn = () => {
    if (!engine) return;
    const { newEvents, contractsSigned } = engine.nextTurn();
    const st = engine.getState();
    setGameState({ ...st });
    saveGameToStorage(st);

    if (contractsSigned.some((c) => c.winnerName === playerCompany.name)) {
      trackFunnelStep('first_win');
    }

    if (st.isGameOver) {
      setPhase('ENDING');
    } else {
      setTurnResultData({
        isOpen: true,
        contracts: contractsSigned,
        events: newEvents,
      });
    }
  };

  // 소문 실사 확인
  const handleInvestigateRumor = (rumorId: string) => {
    if (!engine || !gameState) return;
    if (gameState.availableAP < 1 || gameState.budget < 4) {
      showToast('실사 행동력(1 AP) 또는 예산(4억원)이 부족합니다.');
      return;
    }

    const r = gameState.rumors.find((item) => item.id === rumorId);
    if (r) {
      gameState.availableAP -= 1;
      gameState.budget -= 4;
      gameState.totalSalesCostSpent += 4;
      r.investigated = true;
      setGameState({ ...gameState });
      sound.playClick();
      showToast(`[실사 완료] ${r.headline} 첩보 검증을 완료했습니다.`);
    }
  };

  // 게임 초기화
  const handleResetGame = () => {
    if (window.confirm('현재 진행 중인 수주전을 초기화하고 처음부터 다시 시작하시겠습니까?')) {
      clearSavedGame();
      setEngine(null);
      setGameState(null);
      setPhase('SELECT');
      setSelectedComplexId(null);
      setProposalComplex(null);
    }
  };

  // 플레이어 회사 및 수주액 합산
  const playerCompany = useMemo(() => {
    if (!gameState) return CONSTRUCTION_COMPANIES[0];
    return (
      CONSTRUCTION_COMPANIES.find((c) => c.id === gameState.playerCompanyId) ||
      CONSTRUCTION_COMPANIES[0]
    );
  }, [gameState]);

  const { totalWonVolume, totalExpectedProfit } = useMemo(() => {
    if (!gameState || !engine) return { totalWonVolume: 0, totalExpectedProfit: 0 };
    let volume = 0;
    let profit = 0;

    Object.entries(gameState.complexStates).forEach(([cIdStr, st]) => {
      const cId = Number(cIdStr);
      const comp = engine.allComplexes.find((c) => c.id === cId);
      if (comp && st.winnerId === gameState.playerCompanyId) {
        volume += comp.expectedCost;
        const margin = comp.baseExpectedProfitMargin + (st.supportScores[gameState.playerCompanyId]?.costOfferedMarginDelta || 0);
        profit += Math.round(comp.expectedCost * (margin / 100));
      }
    });

    profit = Math.max(0, profit - gameState.totalSalesCostSpent);
    return { totalWonVolume: volume, totalExpectedProfit: profit };
  }, [gameState, engine]);

  const selectedComplex = useMemo(() => {
    if (!selectedComplexId || !engine) return null;
    return engine.allComplexes.find((c) => c.id === selectedComplexId) || null;
  }, [selectedComplexId, engine]);

  // Phase Router
  if (phase === 'SELECT') {
    return (
      <>
        <CraftUniverseNavbar
          onOpenDataLab={() => setIsDataLabOpen(true)}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onResetGame={handleResetGame}
        />
        <CompanySelectScreen onStartGame={handleStartGame} />
        {isDataLabOpen && <DataLabModal onClose={() => setIsDataLabOpen(false)} />}
        {isSimulatorOpen && <BalanceSimulatorModal onClose={() => setIsSimulatorOpen(false)} />}
      </>
    );
  }

  if (phase === 'ENDING' && gameState && engine) {
    return (
      <>
        <CraftUniverseNavbar
          onOpenDataLab={() => setIsDataLabOpen(true)}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onResetGame={handleResetGame}
        />
        <EndingResultScreen
          gameState={gameState}
          allComplexes={engine.allComplexes}
          onRestart={handleResetGame}
        />
        {isDataLabOpen && <DataLabModal onClose={() => setIsDataLabOpen(false)} />}
        {isSimulatorOpen && <BalanceSimulatorModal onClose={() => setIsSimulatorOpen(false)} />}
      </>
    );
  }

  if (!gameState || !engine) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <CraftUniverseNavbar
        onOpenDataLab={() => setIsDataLabOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onResetGame={handleResetGame}
      />

      {/* Main Top HUD */}
      <TopHUD
        gameState={gameState}
        playerCompany={playerCompany}
        totalWonVolume={totalWonVolume}
        totalExpectedProfit={totalExpectedProfit}
        onNextTurn={handleNextTurn}
        onOpenSchedule={() => setIsScheduleModalOpen(true)}
        onOpenCompetitors={() => setIsCompetitorModalOpen(true)}
        onOpenCommunity={() => setIsCommunityOpen(true)}
        onOpenWarRoom={() => setIsWarRoomOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 border-2 border-amber-500 rounded-lg px-4 py-2 text-xs font-pixel text-amber-300 shadow-2xl animate-in slide-in-from-top-3">
          {toastMessage}
        </div>
      )}

      {/* Main Play Area */}
      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4 flex-1">
        {/* Competitor Real-Time Intelligence Ticker Strip */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2 overflow-x-auto text-xs shadow-sm">
          <div className="flex items-center gap-1.5 shrink-0 text-slate-400 font-pixel">
            <Users className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">경쟁 7개 건설사 현황:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            {CONSTRUCTION_COMPANIES.filter((c) => c.id !== gameState.playerCompanyId).map((comp) => {
              const cState = gameState.competitorStates[comp.id];
              const wonVol = cState?.totalWonVolume || 0;
              const wonCount = cState?.wonComplexIds.length || 0;
              return (
                <button
                  key={comp.id}
                  onClick={() => {
                    sound.playClick();
                    setIsCompetitorModalOpen(true);
                  }}
                  className="px-2 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center gap-1.5 shrink-0 text-[11px] font-mono transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: comp.color }}
                  />
                  <span className="font-bold text-white">{comp.name}</span>
                  <span className="text-emerald-400 font-bold">{formatKRW(wonVol)}</span>
                  {wonCount > 0 && (
                    <span className="text-[10px] text-slate-400">({wonCount}곳)</span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => {
              sound.playClick();
              setIsCompetitorModalOpen(true);
            }}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 font-pixel text-[11px] border border-slate-700"
          >
            상세 전력 분석 →
          </button>
        </div>

        {/* Map View Mode Switcher Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-pixel text-base sm:text-lg font-bold text-white">
              가온 신시가지 15개 단지 수주 관제 지도
            </h2>
            <button
              onClick={() => {
                sound.playClick();
                setIsScheduleModalOpen(true);
              }}
              className="text-xs px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/60 text-amber-300 font-pixel flex items-center gap-1 hover:bg-amber-900/60"
            >
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>전체 선정 일정표</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setIsWarRoomOpen(true);
              }}
              className="text-xs px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/60 text-indigo-300 font-pixel flex items-center gap-1 hover:bg-indigo-900/60"
            >
              <Target className="w-3 h-3 text-indigo-400" />
              <span>수주 전략실</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setIsCommunityOpen(true);
              }}
              className="text-xs px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 font-pixel flex items-center gap-1 hover:bg-emerald-900/60"
            >
              <MessageSquare className="w-3 h-3 text-emerald-400" />
              <span>주민 소통방</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-pixel">
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('3D');
              }}
              className={`px-3 py-1 rounded flex items-center gap-1.5 transition-colors ${
                viewMode === '3D'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D 입체 도시</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setViewMode('2D');
              }}
              className={`px-3 py-1 rounded flex items-center gap-1.5 transition-colors ${
                viewMode === '2D'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>2D 전술 지도</span>
            </button>
          </div>
        </div>

        {/* View Component: 3D City or 2D Tactical Map */}
        {viewMode === '3D' ? (
          <CityMapCanvas
            complexes={engine.allComplexes}
            gameState={gameState}
            selectedComplexId={selectedComplexId}
            onSelectComplex={(id) => setSelectedComplexId(id)}
          />
        ) : (
          <TacticalMap2D
            complexes={engine.allComplexes}
            gameState={gameState}
            selectedComplexId={selectedComplexId}
            onSelectComplex={(id) => setSelectedComplexId(id)}
          />
        )}

        {/* Recent Activity Log Strip */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 flex items-center gap-2 text-xs overflow-x-auto">
          <History className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-pixel text-slate-400 shrink-0">[최근 동향]:</span>
          <span className="text-slate-200 truncate">
            {gameState.turnLogs[gameState.turnLogs.length - 1]?.message || '신규 수주전 개막'}
          </span>
        </div>
      </main>

      {/* Bottom Rumor Board */}
      <RumorBoardPanel
        rumors={gameState.rumors}
        gameState={gameState}
        onInvestigateRumor={handleInvestigateRumor}
      />

      {/* Complex Detail Modal */}
      {selectedComplex && (
        <ComplexDetailModal
          complex={selectedComplex}
          gameState={gameState}
          onClose={() => setSelectedComplexId(null)}
          onExecuteAction={handleExecuteAction}
          onOpenProposalBuilder={(comp) => {
            setSelectedComplexId(null);
            setProposalComplex(comp);
          }}
          onInvestigateCompetitor={handleInvestigateCompetitor}
        />
      )}

      {/* Proposal Builder Modal */}
      {proposalComplex && (
        <ProposalBuilderModal
          complex={proposalComplex}
          playerCompany={playerCompany}
          allCompanies={CONSTRUCTION_COMPANIES}
          existingProposal={gameState.complexStates[proposalComplex.id]?.playerProposal}
          consortiumPartnerId={gameState.complexStates[proposalComplex.id]?.consortiumPartnerId}
          onClose={() => setProposalComplex(null)}
          onSubmit={handleSubmitProposal}
        />
      )}

      {/* Turn Result Monthly Briefing Modal */}
      {turnResultData.isOpen && (
        <TurnResultModal
          gameState={gameState}
          contractsSigned={turnResultData.contracts}
          newEvents={turnResultData.events}
          onClose={() => setTurnResultData({ isOpen: false, contracts: [], events: [] })}
        />
      )}

      {/* Schedule Timeline Modal */}
      {isScheduleModalOpen && (
        <ScheduleTimelineModal
          complexes={engine.allComplexes}
          gameState={gameState}
          onClose={() => setIsScheduleModalOpen(false)}
          onSelectComplex={(id) => setSelectedComplexId(id)}
        />
      )}

      {/* Competitor Roster Intelligence Modal */}
      {isCompetitorModalOpen && (
        <CompetitorRosterModal
          gameState={gameState}
          complexes={engine.allComplexes}
          onClose={() => setIsCompetitorModalOpen(false)}
          onSelectComplex={(id) => setSelectedComplexId(id)}
        />
      )}

      {/* Virtual Community Modal (가온 소통방) */}
      {isCommunityOpen && (
        <VirtualCommunityModal
          posts={gameState.communityPosts}
          complexes={engine.allComplexes}
          currentTurn={gameState.currentTurn}
          onClose={() => setIsCommunityOpen(false)}
        />
      )}

      {/* Strategy War Room Modal (수주 전략실) */}
      {isWarRoomOpen && (
        <StrategyWarRoomModal
          complexes={engine.allComplexes}
          complexStates={gameState.complexStates}
          staffAllocation={gameState.staffAllocation}
          totalSalesStaff={gameState.totalSalesStaff}
          externalProjects={gameState.externalProjects}
          allCompanies={CONSTRUCTION_COMPANIES}
          playerCompanyId={gameState.playerCompanyId}
          onClose={() => setIsWarRoomOpen(false)}
          onAllocateStaff={handleAllocateStaff}
        />
      )}

      {/* Data Lab Modal */}
      {isDataLabOpen && <DataLabModal onClose={() => setIsDataLabOpen(false)} />}

      {/* Balance Simulator Modal */}
      {isSimulatorOpen && <BalanceSimulatorModal onClose={() => setIsSimulatorOpen(false)} />}

      {/* Footer Strip with Public Visitor Counter */}
      <footer className="w-full bg-slate-950 border-t border-slate-800/80 px-4 py-3 mt-6 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-pixel">
          <div className="flex items-center gap-2">
            <a
              href="https://raspos.github.io/databrew/"
              target="_blank"
              rel="noreferrer"
              className="text-[#f2c4a0] hover:text-white font-bold font-mono transition-colors"
            >
              databrew
            </a>
            <span>•</span>
            <span className="text-slate-300 font-bold">재건축 크래프트: 시공사 수주전쟁</span>
          </div>

          <VisitorCounter />

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <a
              href="https://raspos.github.io/databrew/"
              target="_blank"
              rel="noreferrer"
              className="text-[#f2c4a0] hover:text-white font-bold font-mono transition-colors"
            >
              databrew
            </a>
            <span>© All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
