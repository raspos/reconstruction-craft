import React, { useState, useEffect, useMemo } from 'react';
import { GameEngine } from './engine/gameEngine';
import { GameState, ComplexData, PlayerTarget } from './types/game';
import { CONSTRUCTION_COMPANIES } from './data/companies';
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
import { saveGameToStorage, loadGameFromStorage, clearSavedGame } from './utils/storage';
import { sound } from './utils/sound';
import { Box, Map, History, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [phase, setPhase] = useState<'SELECT' | 'GAME' | 'ENDING'>('SELECT');
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');

  // Modals
  const [selectedComplexId, setSelectedComplexId] = useState<number | null>(null);
  const [isDataLabOpen, setIsDataLabOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
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

  // 게임 시작 (회사, 모드, 목표 설정)
  const handleStartGame = (
    companyId: string,
    gameMode: 'FULL_24' | 'FAST_12',
    target: PlayerTarget
  ) => {
    const newEngine = new GameEngine(companyId, gameMode, Date.now(), target);
    setEngine(newEngine);
    const st = newEngine.getState();
    setGameState({ ...st });
    setPhase('GAME');
    saveGameToStorage(st);
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

  // 월말 마감 & 다음 턴 진행
  const handleNextTurn = () => {
    if (!engine) return;
    const { newEvents, contractsSigned } = engine.nextTurn();
    const st = engine.getState();
    setGameState({ ...st });
    saveGameToStorage(st);

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
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 border-2 border-amber-500 rounded-lg px-4 py-2 text-xs font-pixel text-amber-300 shadow-2xl animate-in slide-in-from-top-3">
          {toastMessage}
        </div>
      )}

      {/* Main Play Area */}
      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4 flex-1">
        {/* Map View Mode Switcher Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-pixel text-base sm:text-lg font-bold text-white">
              가온 신시가지 15개 단지 수주 관제 지도
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              시공사 선정 2년 대장정
            </span>
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

      {/* Data Lab Modal */}
      {isDataLabOpen && <DataLabModal onClose={() => setIsDataLabOpen(false)} />}

      {/* Balance Simulator Modal */}
      {isSimulatorOpen && <BalanceSimulatorModal onClose={() => setIsSimulatorOpen(false)} />}
    </div>
  );
};
