import React, { useState } from 'react';
import { 
  Bug, 
  Timer, 
  MousePointer, 
  PlusCircle, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  History, 
  CheckCircle, 
  Lock, 
  ShieldAlert,
  Flame,
  Rocket,
  Zap,
  Pause,
  AlertTriangle
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { Team } from '../../types';

interface ParticipantHeaderProps {
  team: Team;
  onOpenHistory: () => void;
  submissionsCount: number;
}

export const ParticipantHeader: React.FC<ParticipantHeaderProps> = ({ 
  team, 
  onOpenHistory,
  submissionsCount
}) => {
  const { 
    round, 
    remainingSeconds, 
    formattedTime, 
    isInspectMode, 
    setInspectMode, 
    openReportModal, 
    isSoundMuted, 
    toggleSound 
  } = useCompetition();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const getTeamIcon = (iconName: string) => {
    switch (iconName) {
      case 'Rocket': return <Rocket className="w-3.5 h-3.5" />;
      case 'Zap': return <Zap className="w-3.5 h-3.5" />;
      case 'ShieldAlert': return <ShieldAlert className="w-3.5 h-3.5" />;
      case 'Flame': return <Flame className="w-3.5 h-3.5" />;
      default: return <Bug className="w-3.5 h-3.5" />;
    }
  };

  const isPaused = round.status === 'paused';
  const isCriticalTime = round.status === 'running' && remainingSeconds <= 30;
  const isWarningTime = round.status === 'running' && remainingSeconds <= 60 && remainingSeconds > 30;

  return (
    <header className="bg-white/90 border-b border-neutral-200/90 px-4 py-3 sticky top-0 z-40 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Branding & Team Identifier */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center text-white shadow-xs">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-neutral-950 block leading-tight">
                BUG HUNT PIXEL2K26
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">Live Competition</span>
            </div>
          </div>

          {/* Team Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-900 shadow-xs">
            {getTeamIcon(team.avatarIcon)}
            <span>{team.name}</span>
            <span className="bg-neutral-900 px-1.5 py-0.2 rounded-full text-[10px] font-mono text-white">
              {team.score} PTS
            </span>
          </div>
        </div>

        {/* Live Synchronized Countdown Timer */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-1.5 rounded-xl border flex items-center gap-2 transition-all font-mono ${
            isPaused 
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : isCriticalTime
                ? 'bg-rose-50 border-rose-400 text-rose-700 animate-pulse shadow-sm'
                : isWarningTime
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-900 shadow-inner'
          }`}>
            {isPaused ? (
              <Pause className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            ) : isCriticalTime ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
            ) : (
              <Timer className="w-3.5 h-3.5 text-neutral-500" />
            )}

            <div className="text-center">
              <span className="text-lg sm:text-xl font-black tracking-wider">
                {formattedTime}
              </span>
            </div>

            {isPaused && (
              <span className="text-[9px] font-bold uppercase bg-amber-200/80 px-1.5 py-0.2 rounded text-amber-900">
                Paused
              </span>
            )}
            {isCriticalTime && (
              <span className="text-[9px] font-bold uppercase bg-rose-600 text-white px-1.5 py-0.2 rounded">
                Ending!
              </span>
            )}
            {isWarningTime && (
              <span className="text-[9px] font-bold uppercase bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                &lt; 60s
              </span>
            )}
          </div>

          {/* Bugs Progress Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200">
            <span className="text-[11px] text-neutral-500 mr-1 font-semibold">Bugs:</span>
            {[1, 2, 3, 4, 5].map((num) => {
              const isFound = team.bugsIdentified.includes(`BUG-${num}`);
              return (
                <div 
                  key={num}
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold transition-all border ${
                    isFound
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-400 border-neutral-200'
                  }`}
                  title={isFound ? `Bug #${num} Discovered (+20 pts)` : `Bug #${num} Undiscovered`}
                >
                  {isFound ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Lock className="w-2.5 h-2.5" />}
                </div>
              );
            })}
            <span className="text-xs font-bold text-neutral-900 ml-1 font-mono">
              {team.bugsIdentified.length}/5
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end overflow-x-auto">
          {/* Method 2: Inspect Bug Mode */}
          <button
            onClick={() => setInspectMode(!isInspectMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs border ${
              isInspectMode
                ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>{isInspectMode ? 'Inspect: ON' : 'Inspect Bug'}</span>
          </button>

          {/* Method 1: Report Bug Button */}
          <button
            onClick={() => openReportModal('click')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-950 hover:bg-neutral-800 text-white flex items-center gap-1.5 shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Bug</span>
          </button>

          {/* Submission History Drawer */}
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 relative transition"
            title="View Submission History"
          >
            <History className="w-3.5 h-3.5" />
            {submissionsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-neutral-900 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {submissionsCount}
              </span>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition"
            title={isSoundMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 text-neutral-400" /> : <Volume2 className="w-3.5 h-3.5 text-neutral-800" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
