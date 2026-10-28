import React from 'react';
import { 
  Users, 
  Bug, 
  Send, 
  Clock 
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

export const AdminStats: React.FC = () => {
  const { teams, submissions, round } = useCompetition();

  const totalTeams = teams.length;
  const onlineTeams = teams.filter(t => t.isOnline).length;
  
  const discoveredBugsSet = new Set<string>();
  teams.forEach(t => t.bugsIdentified.forEach(b => discoveredBugsSet.add(b)));
  const totalBugsDiscovered = discoveredBugsSet.size;

  const totalSubmissions = submissions.length;
  const acceptedSubmissions = submissions.filter(s => s.status === 'accepted').length;
  const accuracyRate = totalSubmissions > 0 
    ? Math.round((acceptedSubmissions / totalSubmissions) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Teams Metric */}
      <div className="bg-white border border-neutral-200/90 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Registered Teams
          </span>
          <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-800">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-neutral-950 font-mono">{totalTeams}</span>
          <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {onlineTeams} Active Online
          </span>
        </div>
      </div>

      {/* Bugs Discovered */}
      <div className="bg-white border border-neutral-200/90 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Bugs Discovered
          </span>
          <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-800">
            <Bug className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-neutral-950 font-mono">{totalBugsDiscovered} / 5</span>
          <span className="text-xs text-neutral-500">
            across teams
          </span>
        </div>
      </div>

      {/* Total Submissions */}
      <div className="bg-white border border-neutral-200/90 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Submissions & Accuracy
          </span>
          <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-800">
            <Send className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-neutral-950 font-mono">{totalSubmissions}</span>
          <span className="text-xs text-neutral-600 font-mono">
            {accuracyRate}% ({acceptedSubmissions} verified)
          </span>
        </div>
      </div>

      {/* Round Configuration */}
      <div className="bg-white border border-neutral-200/90 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Round Timer
          </span>
          <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-800">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-neutral-950 font-mono">
            {Math.round(round.durationSeconds / 60)}m
          </span>
          <span className="text-xs text-neutral-500 capitalize">
            State: {round.status}
          </span>
        </div>
      </div>
    </div>
  );
};
