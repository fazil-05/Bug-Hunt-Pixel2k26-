import React, { useState } from 'react';
import { 
  Bug, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Eye,
  Check,
  X
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { DEFAULT_BUGS } from '../../data/initialData';

export const AdminBugsTracker: React.FC = () => {
  const { teams, toggleTeamBugManual } = useCompetition();
  const [expandedBugId, setExpandedBugId] = useState<string | null>('bug-1');

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              <Bug className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-neutral-950">
              Challenge Bugs & Student Solver Tracker
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            The 5 intentional defects students must identify. Shows live solver status per team with manual overrides.
          </p>
        </div>

        <span className="text-[11px] font-mono bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full self-start sm:self-auto font-semibold border border-neutral-200">
          5 Required Challenges
        </span>
      </div>

      {/* 5 Bugs List */}
      <div className="space-y-3">
        {DEFAULT_BUGS.map((bug) => {
          const isExpanded = expandedBugId === bug.id;

          // Check which teams have solved this bug
          const teamsSolved = teams.filter(t => t.bugsIdentified.includes(bug.bugKey));

          return (
            <div 
              key={bug.id}
              className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl overflow-hidden transition-all text-xs"
            >
              {/* Header */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div 
                  className="flex items-start sm:items-center gap-3 cursor-pointer flex-1"
                  onClick={() => setExpandedBugId(isExpanded ? null : bug.id)}
                >
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-neutral-900 text-white text-[11px] shrink-0">
                    {bug.bugKey}
                  </span>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm hover:text-black">
                      {bug.title}
                    </h3>
                    <div className="flex items-center gap-2 text-neutral-500 text-[11px] mt-0.5">
                      <span className="capitalize">Category: {bug.category}</span>
                      <span>&bull;</span>
                      <span className="font-mono text-neutral-700">{bug.targetElementSelector}</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-neutral-900">+20 Points</span>
                    </div>
                  </div>
                </div>

                {/* Teams Solved Status Matrix */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="text-[11px] text-neutral-500 font-medium">Solved by:</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      teamsSolved.length > 0 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {teamsSolved.length} / {teams.length} Teams
                    </span>
                  </div>

                  {/* Team Solver Badges with Manual Toggle Click */}
                  <div className="flex items-center gap-1">
                    {teams.map(team => {
                      const isSolved = team.bugsIdentified.includes(bug.bugKey);

                      return (
                        <button
                          key={team.id}
                          onClick={() => toggleTeamBugManual(team.id, bug.bugKey, !isSolved)}
                          title={`${team.name}: ${isSolved ? 'Solved (Click to revoke)' : 'Unsolved (Click to mark solved)'}`}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold font-mono transition-all flex items-center gap-1 border ${
                            isSolved
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-neutral-400 border-neutral-200 hover:border-neutral-400 hover:text-neutral-700'
                          }`}
                        >
                          {isSolved ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                          <span>{team.code.toUpperCase()}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setExpandedBugId(isExpanded ? null : bug.id)}
                    className="p-1 text-neutral-400 hover:text-neutral-700"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Bug Inspection Guide */}
              {isExpanded && (
                <div className="p-4 bg-white border-t border-neutral-200/80 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <strong className="text-neutral-700 font-semibold block">Expected Normal Behavior:</strong>
                      <p className="text-neutral-600 leading-relaxed">{bug.expectedBehavior}</p>
                    </div>
                    <div className="space-y-1">
                      <strong className="text-rose-700 font-semibold block">What Student Must Discover:</strong>
                      <p className="text-neutral-600 leading-relaxed">{bug.actualBehavior}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100">
                    <strong className="text-neutral-700 font-semibold block mb-1">
                      Reproduction Steps for Student:
                    </strong>
                    <ol className="list-decimal list-inside space-y-0.5 text-neutral-600 pl-1">
                      {bug.reproductionSteps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-neutral-500">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-semibold">Evaluation Keywords:</span>
                      {bug.matchingKeywords.map((kw, i) => (
                        <span key={i} className="bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded font-mono text-[10px] border border-neutral-200">
                          {kw}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      Tip: Click team buttons above to manually mark as solved/unsolved
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
