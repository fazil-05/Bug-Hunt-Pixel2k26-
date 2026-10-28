import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  Award, 
  Download, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  LogOut,
  Clock,
  Sparkles
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

interface AdminHeaderProps {
  onOpenSettings: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenSettings }) => {
  const { 
    round, 
    remainingSeconds, 
    formattedTime, 
    startRound, 
    pauseRound, 
    resumeRound, 
    endRound, 
    resetRound, 
    publishResults, 
    exportCSV, 
    isSoundMuted, 
    toggleSound, 
    logoutAdmin 
  } = useCompetition();

  const getStatusBadge = () => {
    switch (round.status) {
      case 'draft':
        return <span className="bg-neutral-100 text-neutral-700 border border-neutral-200 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Ready / Draft</span>;
      case 'running':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Running</span>;
      case 'paused':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Paused</span>;
      case 'ended':
        return <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Ended</span>;
      case 'published':
        return <span className="bg-neutral-900 text-white px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3" /> Results Published</span>;
    }
  };

  return (
    <header className="bg-white/90 border-b border-neutral-200/80 p-4 sm:p-5 sticky top-0 z-40 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Title and status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
                Bug Hunt Pixel2k26
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-neutral-500">
              Organizer Panel &bull; Challenge: <strong className="text-neutral-800">{round.challengeName} (₹ INR)</strong>
            </p>
          </div>
        </div>

        {/* Live Master Timer */}
        <div className="flex items-center gap-3 self-center lg:self-auto bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-200/90 shadow-inner">
          <Clock className="w-4 h-4 text-neutral-500" />
          <div className="text-center font-mono">
            <span className="text-2xl font-black text-neutral-950 tracking-wider">
              {formattedTime}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
            {round.status}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {round.status === 'draft' && (
            <button
              onClick={() => startRound()}
              className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Round</span>
            </button>
          )}

          {round.status === 'running' && (
            <>
              <button
                onClick={pauseRound}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
              <button
                onClick={endRound}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Square className="w-3.5 h-3.5" />
                <span>End Round</span>
              </button>
            </>
          )}

          {round.status === 'paused' && (
            <>
              <button
                onClick={resumeRound}
                className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Resume</span>
              </button>
              <button
                onClick={endRound}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Square className="w-3.5 h-3.5" />
                <span>End</span>
              </button>
            </>
          )}

          {round.status === 'ended' && (
            <button
              onClick={publishResults}
              className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Publish Results</span>
            </button>
          )}

          {/* Reset Round */}
          <button
            onClick={() => {
              if (window.confirm('Reset this round and clear all team progress?')) {
                resetRound();
              }
            }}
            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-neutral-200 transition"
            title="Reset Round"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-neutral-200 transition"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs border border-neutral-200 transition"
            title={isSoundMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4 text-neutral-800" />}
          </button>

          {/* Logout Admin */}
          <button
            onClick={logoutAdmin}
            className="p-2 bg-neutral-100 hover:bg-rose-50 text-neutral-500 hover:text-rose-600 rounded-xl text-xs border border-neutral-200 transition"
            title="Exit Admin Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
