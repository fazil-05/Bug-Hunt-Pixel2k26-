import React from 'react';
import { 
  Trophy, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

export const AdminLeaderboard: React.FC = () => {
  const { leaderboard, round, toggleTeamLeaderboard } = useCompetition();

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-neutral-900" />
          <h2 className="text-base font-bold text-neutral-950">Live Competition Leaderboard</h2>
          <span className="text-[11px] bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded font-mono font-medium border border-neutral-200">
            Auto-Ranked
          </span>
        </div>

        {/* Broadcast to Teams */}
        <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs">
          <span className="text-neutral-500">Broadcast to Teams:</span>
          <button
            onClick={() => toggleTeamLeaderboard(!round.showLeaderboardToTeams)}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              round.showLeaderboardToTeams
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            {round.showLeaderboardToTeams ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Visible</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hidden</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-semibold border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Bugs Found</th>
              <th className="px-4 py-3">Total Score</th>
              <th className="px-4 py-3">Time Taken</th>
              <th className="px-4 py-3 text-right">Incorrect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 font-medium text-neutral-900">
            {leaderboard.map((entry) => (
              <tr 
                key={entry.teamId}
                className="hover:bg-neutral-50/70 transition-colors"
              >
                <td className="px-4 py-3 text-neutral-700 font-bold">
                  {entry.rank === 1 ? (
                    <span className="text-neutral-950 font-black flex items-center gap-1">
                      🥇 #1
                    </span>
                  ) : entry.rank === 2 ? (
                    <span className="text-neutral-800 font-bold">🥈 #2</span>
                  ) : entry.rank === 3 ? (
                    <span className="text-neutral-700 font-bold">🥉 #3</span>
                  ) : (
                    <span className="text-neutral-500">#{entry.rank}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-950 font-semibold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                  <span>{entry.teamName}</span>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                  {entry.bugsCount} / 5
                </td>
                <td className="px-4 py-3 font-mono font-extrabold text-neutral-950">
                  {entry.score} pts
                </td>
                <td className="px-4 py-3 text-neutral-500 font-mono text-xs">
                  {entry.timeTakenFormatted}
                </td>
                <td className="px-4 py-3 text-right text-neutral-400 font-mono text-xs">
                  {entry.incorrectCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 text-[11px] text-neutral-400 flex items-center justify-between">
        <span>Criteria: (1) Total Points &bull; (2) Bugs Found &bull; (3) Fastest Time &bull; (4) Fewest Errors</span>
        <span className="text-neutral-600 font-medium">Real-Time Sync Active</span>
      </div>
    </div>
  );
};
