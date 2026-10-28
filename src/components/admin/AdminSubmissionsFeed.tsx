import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp,
  Plus
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

export const AdminSubmissionsFeed: React.FC = () => {
  const { submissions, teams, adminOverrideSubmission } = useCompetition();

  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  // Custom manual points input per submission
  const [customPointsInput, setCustomPointsInput] = useState<{ [id: string]: number }>({});

  const filteredSubmissions = submissions.filter(sub => {
    if (selectedTeamFilter !== 'all' && sub.teamCode !== selectedTeamFilter && sub.teamId !== selectedTeamFilter) {
      return false;
    }
    if (selectedStatusFilter !== 'all' && sub.status !== selectedStatusFilter) {
      return false;
    }
    return true;
  });

  const getPointsForSub = (subId: string) => {
    return customPointsInput[subId] !== undefined ? customPointsInput[subId] : 20;
  };

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-neutral-900" />
          <h2 className="text-base font-bold text-neutral-950">Live Student Submissions Feed</h2>
          <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full font-mono font-medium border border-neutral-200">
            {filteredSubmissions.length} reports
          </span>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-black"
          >
            <option value="all">All Teams</option>
            {teams.map(t => (
              <option key={t.id} value={t.code}>{t.name}</option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:border-black"
          >
            <option value="all">All Statuses</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Submissions Stream */}
      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 bg-neutral-50/60 rounded-xl border border-dashed border-neutral-200">
            <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No bug submissions match the selected filters.</p>
          </div>
        ) : (
          filteredSubmissions.map((sub) => {
            const isAccepted = sub.status === 'accepted';
            const isExpanded = expandedSubId === sub.id;
            const team = teams.find(t => t.code === sub.teamCode || t.id === sub.teamId);
            const time = new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const currentPoints = getPointsForSub(sub.id);

            return (
              <div
                key={sub.id}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  isAccepted
                    ? 'bg-neutral-50/80 border-neutral-200/90'
                    : 'bg-white border-neutral-200/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-neutral-900 text-white">
                      {sub.teamName}
                    </span>

                    <span className="font-semibold text-neutral-900">
                      {sub.targetComponent || sub.category}
                    </span>

                    <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded uppercase border border-neutral-200">
                      {sub.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] flex items-center gap-1 ${
                      isAccepted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}>
                      {isAccepted ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-neutral-400" />}
                      <span>{isAccepted ? `+${sub.pointsAwarded} PTS (Accepted)` : '0 PTS (Rejected)'}</span>
                    </span>

                    <span className="text-neutral-400 text-[10px] flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {time}
                    </span>
                  </div>
                </div>

                <p className="text-neutral-700 mb-2 leading-relaxed">
                  {sub.description}
                </p>

                {/* Expanded Reproduction Steps & Admin Manual Scoring */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-neutral-200 space-y-2 bg-white p-3 rounded-lg border border-neutral-200/60">
                    <div>
                      <strong className="text-neutral-700 block mb-0.5 font-semibold">Reproduction Steps:</strong>
                      <p className="text-neutral-600 whitespace-pre-line">{sub.stepsToReproduce}</p>
                    </div>

                    {sub.bugKey && (
                      <div className="text-[11px] text-neutral-700 font-mono">
                        Matched Challenge Key: <strong>{sub.bugKey}</strong>
                      </div>
                    )}

                    {/* Manual Points & Override */}
                    <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-600 font-semibold text-[11px]">Points:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={currentPoints}
                          onChange={(e) => setCustomPointsInput({
                            ...customPointsInput,
                            [sub.id]: parseInt(e.target.value, 10) || 0
                          })}
                          className="w-14 bg-neutral-50 border border-neutral-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-center text-neutral-900 focus:outline-none focus:border-black"
                        />
                        <span className="text-[10px] text-neutral-400">custom points</span>
                      </div>

                      <div className="flex gap-2">
                        {!isAccepted ? (
                          <button
                            onClick={() => adminOverrideSubmission(sub.id, 'accepted', currentPoints)}
                            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Award +{currentPoints} pts</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => adminOverrideSubmission(sub.id, 'rejected', 0)}
                            className="px-2.5 py-1 bg-neutral-200 hover:bg-rose-50 text-neutral-800 hover:text-rose-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                          >
                            <X className="w-3 h-3" />
                            <span>Revoke Points</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                  className="mt-1 text-[11px] text-neutral-600 hover:text-neutral-950 flex items-center gap-1 font-medium"
                >
                  <span>{isExpanded ? 'Hide reproduction steps' : 'View reproduction steps & award custom points'}</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
