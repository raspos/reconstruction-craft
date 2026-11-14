import React, { useState } from 'react';
import {
  Building2,
  Volume2,
  VolumeX,
  RotateCcw,
  BookOpen,
  BarChart3,
  ExternalLink,
  Coffee,
} from 'lucide-react';
import { DATABREW_PORTAL } from '../config/craftUniverse';
import { sound } from '../utils/sound';

interface Props {
  onOpenDataLab?: () => void;
  onOpenSimulator?: () => void;
  onResetGame?: () => void;
  showInGameControls?: boolean;
}

export const CraftUniverseNavbar: React.FC<Props> = ({
  onOpenDataLab,
  onOpenSimulator,
  onResetGame,
  showInGameControls = true,
}) => {
  const [muted, setMuted] = useState(!sound.enabled);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setMuted(!sound.enabled);
    if (sound.enabled) sound.playClick();
  };

  return (
    <header className="w-full bg-slate-950/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-3 py-2 sm:px-5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Brand & Universe Identity */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            {/* data BREW Hub Button */}
            <a
              href={DATABREW_PORTAL.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-[#062433] border border-[#f2c4a0]/40 hover:border-[#f2c4a0] flex items-center gap-1.5 transition-all shadow-sm group shrink-0"
              title="데이터브루(data BREW) 포털 홈으로 이동"
            >
              <span className="w-2 h-2 rounded-full bg-[#f2c4a0] group-hover:scale-125 transition-transform" />
              <span className="font-pixel text-[11px] font-bold text-[#f2c4a0] tracking-tight group-hover:text-white">
                data BREW
              </span>
              <ExternalLink className="w-2.5 h-2.5 text-[#f2c4a0]/70 group-hover:text-white" />
            </a>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 border border-amber-300 flex items-center justify-center text-slate-950 shadow-md shrink-0 font-bold">
                <Building2 className="w-4 h-4 text-slate-950" />
              </div>
              <h1 className="font-pixel text-xs sm:text-sm text-white font-extrabold tracking-tight whitespace-nowrap leading-none">
                재건축 크래프트 <span className="text-amber-400 font-normal">시공사 수주전쟁</span>
              </h1>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1.5 md:hidden">
            {showInGameControls && (
              <>
                <button
                  onClick={toggleSound}
                  className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                  title={muted ? '소리 켜기' : '소리 끄기'}
                >
                  {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
                {onResetGame && (
                  <button
                    onClick={onResetGame}
                    className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-red-400"
                    title="게임 다시 시작"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Tools (Data Lab, Balance Simulator, Sound, Restart) */}
        {showInGameControls && (
          <div className="hidden md:flex items-center gap-2">
            {onOpenDataLab && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenDataLab();
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 font-pixel"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span>데이터 출처</span>
              </button>
            )}

            {onOpenSimulator && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenSimulator();
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 font-pixel"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>시뮬레이터 검증</span>
              </button>
            )}

            <button
              onClick={toggleSound}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
              title={muted ? '소리 켜기' : '소리 끄기'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {onResetGame && (
              <button
                onClick={onResetGame}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400 border border-slate-700"
                title="게임 다시 시작"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
