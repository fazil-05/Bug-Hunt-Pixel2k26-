import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  Clock, 
  AlertCircle, 
  Trophy, 
  Sparkles
} from 'lucide-react';
import { useCompetition } from '../context/CompetitionContext';
import { ParticipantHeader } from '../components/participant/ParticipantHeader';
import { ShopEasy } from '../components/challenge/ShopEasy';
import { BugReportModal } from '../components/participant/BugReportModal';
import { SubmissionHistoryDrawer } from '../components/participant/SubmissionHistoryDrawer';
import { CompetitionCompletionScreen } from '../components/participant/CompetitionCompletionScreen';

interface PlayPageProps {
  teamCode: string;
  onNavigate: (route: string) => void;
}

export const PlayPage: React.FC<PlayPageProps> = ({ teamCode, onNavigate }) => {
  const { 
    teams, 
    round, 
    submissions, 
    registerHeartbeat, 
    leaderboard 
  } = useCompetition();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const team = teams.find(t => t.code.toLowerCase() === teamCode.toLowerCase());

  useEffect(() => {
    if (team) {
      registerHeartbeat(team.code);
      const interval = setInterval(() => {
        registerHeartbeat(team.code);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [team, registerHeartbeat]);

  if (!team) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white border border-neutral-200 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-neutral-950">Team Not Found</h2>
          <p className="text-neutral-500 text-xs sm:text-sm">
            Could not find an active competition team with code <code className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-800 font-mono">"{teamCode}"</code>.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('/join')}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              Choose from Active Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  // End or Published: Completion Screen
  if (round.status === 'ended' || round.status === 'published') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex flex-col">
        <ParticipantHeader 
          team={team} 
          onOpenHistory={() => setIsHistoryOpen(true)}
          submissionsCount={submissions.filter(s => s.teamId === team.id).length}
        />
        <main className="flex-1">
          <CompetitionCompletionScreen team={team} />
        </main>
        <SubmissionHistoryDrawer
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          team={team}
          submissions={submissions}
        />
      </div>
    );
  }

  // Draft Waiting Screen
  if (round.status === 'draft') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex flex-col">
        <header className="border-b border-neutral-200 bg-white px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
              <Bug className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-neutral-950">
              BUG HUNT PIXEL2K26
            </span>
          </div>

          <div className="px-3 py-1 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-900">
            {team.name}
          </div>
        </header>

        <main className="flex-1 max-w-xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 shadow-xs">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div>
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200 mb-2">
              Waiting for Organizer
            </span>
            <h1 className="text-3xl font-black text-neutral-950 tracking-tight">
              Get Ready, {team.name}!
            </h1>
            <p className="text-neutral-500 text-xs sm:text-sm max-w-md mx-auto mt-1 leading-relaxed">
              The competition administrator will start the countdown timer shortly. When the round begins, your challenge store (**ShopEasy India** in ₹ INR) will appear with 5 hidden bugs.
            </p>
          </div>

          <div className="w-full bg-white border border-neutral-200/90 p-5 rounded-2xl text-left space-y-2.5 text-xs text-neutral-600 shadow-xs">
            <h3 className="font-bold text-neutral-950 text-xs sm:text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-neutral-900" />
              <span>Championship Briefing</span>
            </h3>
            <ul className="space-y-1.5 list-disc list-inside text-neutral-600">
              <li>Challenge: <strong>ShopEasy India E-Commerce Store</strong> (All prices in ₹ INR).</li>
              <li>There are exactly <strong>5 intentional defects</strong> hidden across search, cart, pricing, navigation, and checkout.</li>
              <li>Each confirmed bug awards <strong>+20 points</strong> (Maximum 100 points).</li>
              <li>Use <strong>"Inspect Bug"</strong> mode to click elements directly, or <strong>"Report Bug"</strong> to describe the flaw manually.</li>
              <li>Submissions are synchronized in real-time across all 4 competing teams.</li>
            </ul>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-neutral-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Connection active &bull; Waiting for round start signal...</span>
          </div>
        </main>
      </div>
    );
  }

  // Active Running or Paused Round
  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex flex-col selection:bg-neutral-900 selection:text-white">
      {/* Top Header */}
      <ParticipantHeader 
        team={team} 
        onOpenHistory={() => setIsHistoryOpen(true)}
        submissionsCount={submissions.filter(s => s.teamId === team.id).length}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Optional participant leaderboard */}
        {round.showLeaderboardToTeams && (
          <div className="mb-4 bg-white border border-neutral-200/90 rounded-2xl p-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 text-xs">
              <Trophy className="w-3.5 h-3.5 text-neutral-900" />
              <span className="font-bold text-neutral-950">Live Arena Standings:</span>
              <div className="flex items-center gap-2.5 overflow-x-auto text-[11px] font-mono">
                {leaderboard.map(entry => (
                  <span 
                    key={entry.teamId} 
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                      entry.teamId === team.id 
                        ? 'bg-neutral-900 text-white border-neutral-900 font-bold' 
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                    }`}
                  >
                    <span>#{entry.rank} {entry.teamName}:</span>
                    <strong>{entry.score} pts</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Embedded ShopEasy Challenge Website */}
        <ShopEasy />
      </main>

      {/* Bug Report Modal */}
      <BugReportModal teamCode={team.code} />

      {/* Submission History Drawer */}
      <SubmissionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        team={team}
        submissions={submissions}
      />
    </div>
  );
};
