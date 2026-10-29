import React from 'react';
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  Award,
  RotateCcw,
  Play
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { Team } from '../../types';
import { DEFAULT_BUGS } from '../../data/initialData';

interface CompetitionCompletionScreenProps {
  team: Team;
}

export const CompetitionCompletionScreen: React.FC<CompetitionCompletionScreenProps> = ({ team }) => {
  const { round, leaderboard, resetRound, startRound } = useCompetition();

  const isPublished = round.status === 'published';
  const winner = leaderboard[0];
  const isTeamWinner = winner && winner.teamId === team.id;
  const userRankEntry = leaderboard.find(l => l.teamId === team.id);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="w-full bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
        {!isPublished ? (
          /* STAGE 1: TIME'S UP WAITING SCREEN */
          <div className="text-center py-8 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto text-neutral-800 shadow-xs">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200 mb-2">
                Submissions Closed
              </span>
              <h2 className="text-3xl font-black text-neutral-950 tracking-tight">
                Time's Up!
              </h2>
              <p className="text-neutral-500 text-xs sm:text-sm max-w-md mx-auto mt-1">
                The competition round has concluded. New reports are locked while the tournament organizer reviews and publishes final scores.
              </p>
            </div>

            {/* Score Snapshot */}
            <div className="max-w-xs mx-auto bg-neutral-50 p-4 rounded-2xl border border-neutral-200 grid grid-cols-2 gap-3 text-center">
              <div className="border-r border-neutral-200 pr-2">
                <span className="text-[11px] text-neutral-500 block font-semibold">Bugs Found</span>
                <span className="text-2xl font-black text-neutral-950 font-mono">
                  {team.bugsIdentified.length} / 5
                </span>
              </div>
              <div className="pl-2">
                <span className="text-[11px] text-neutral-500 block font-semibold">Final Score</span>
                <span className="text-2xl font-black text-neutral-950 font-mono">
                  {team.score} PTS
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-500">
              <span className="w-2 h-2 rounded-full bg-neutral-900 animate-ping" />
              <span>Waiting for organizer to publish tournament standings...</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  resetRound();
                  startRound();
                }}
                className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Start New Round</span>
              </button>
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-semibold border border-neutral-200 transition shadow-xs cursor-pointer"
              >
                Sync with Admin ↻
              </button>
            </div>
          </div>
        ) : (
          /* STAGE 2: PUBLISHED RESULTS */
          <div className="py-4 space-y-7 animate-in fade-in duration-300">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-neutral-900 text-white shadow-md">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                  Tournament Concluded
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight mt-0.5">
                  {winner ? `${winner.teamName} Wins!` : 'Results Announced'}
                </h2>
                <p className="text-neutral-500 text-xs sm:text-sm max-w-md mx-auto mt-1">
                  Congratulations! All 5 intentional defects in ShopEasy have been revealed below.
                </p>
              </div>
            </div>

            {/* Team's Placement Banner */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isTeamWinner 
                ? 'bg-neutral-900 text-white' 
                : 'bg-neutral-50 border-neutral-200 text-neutral-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                  isTeamWinner ? 'bg-white text-neutral-950' : 'bg-neutral-900 text-white'
                }`}>
                  #{userRankEntry?.rank || 1}
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-sm">{team.name}</h4>
                  <p className={`text-xs ${isTeamWinner ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    Finished with {team.score} points ({team.bugsIdentified.length} / 5 bugs identified)
                  </p>
                </div>
              </div>
              <div>
                <span className="text-2xl font-black font-mono">{team.score} PTS</span>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div>
              <h3 className="font-bold text-sm text-neutral-950 mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-neutral-800" />
                <span>Championship Standings</span>
              </h3>
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-semibold border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-2.5">Rank</th>
                      <th className="px-4 py-2.5">Team</th>
                      <th className="px-4 py-2.5">Bugs Found</th>
                      <th className="px-4 py-2.5">Score</th>
                      <th className="px-4 py-2.5 text-right">Time Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-800 font-medium">
                    {leaderboard.map((entry) => (
                      <tr 
                        key={entry.teamId}
                        className={entry.teamId === team.id ? 'bg-neutral-50 font-bold' : ''}
                      >
                        <td className="px-4 py-2.5 text-neutral-700">
                          {entry.rank === 1 ? '🥇 #1' : entry.rank === 2 ? '🥈 #2' : entry.rank === 3 ? '🥉 #3' : `#${entry.rank}`}
                        </td>
                        <td className="px-4 py-2.5 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-neutral-900" />
                          <span>{entry.teamName}</span>
                          {entry.teamId === team.id && (
                            <span className="text-[10px] bg-neutral-200 px-1 rounded">You</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-neutral-900">
                          {entry.bugsCount} / 5
                        </td>
                        <td className="px-4 py-2.5 font-mono text-neutral-950 font-bold">
                          {entry.score} pts
                        </td>
                        <td className="px-4 py-2.5 text-right text-neutral-400 font-mono text-xs">
                          {entry.timeTakenFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Revealing the 5 Bugs & Solutions */}
            <div>
              <h3 className="font-bold text-sm text-neutral-950 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>The 5 Intentional Defects Explained</span>
              </h3>
              <div className="space-y-2.5 text-xs">
                {DEFAULT_BUGS.map((bug) => {
                  const wasFoundByTeam = team.bugsIdentified.includes(bug.bugKey);

                  return (
                    <div 
                      key={bug.id}
                      className={`p-3.5 rounded-xl border space-y-1.5 ${
                        wasFoundByTeam 
                          ? 'bg-neutral-50 border-neutral-300' 
                          : 'bg-white border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-900 text-white text-[10px]">
                            {bug.bugKey}
                          </span>
                          <h4 className="font-bold text-neutral-900">{bug.title}</h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          wasFoundByTeam 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {wasFoundByTeam ? 'Identified (+20 pts)' : 'Missed (0 pts)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-600 pt-1">
                        <div>
                          <strong className="text-neutral-700 block mb-0.5">Expected:</strong>
                          <p>{bug.expectedBehavior}</p>
                        </div>
                        <div>
                          <strong className="text-rose-700 block mb-0.5">Actual Defect:</strong>
                          <p>{bug.actualBehavior}</p>
                        </div>
                      </div>

                      <div className="bg-neutral-100 p-2 rounded-lg font-mono text-[11px] text-neutral-700 mt-1">
                        <strong>Code Logic: </strong>{bug.explanationPostRound}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
