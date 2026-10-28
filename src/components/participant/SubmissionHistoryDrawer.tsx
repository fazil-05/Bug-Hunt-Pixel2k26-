import React from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Clock
} from 'lucide-react';
import { Submission, Team } from '../../types';

interface SubmissionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  submissions: Submission[];
}

export const SubmissionHistoryDrawer: React.FC<SubmissionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  team,
  submissions
}) => {
  if (!isOpen) return null;

  const teamSubmissions = submissions.filter(s => s.teamId === team.id || s.teamCode === team.code);
  const acceptedCount = teamSubmissions.filter(s => s.status === 'accepted').length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border-l border-neutral-200 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-neutral-900" />
            <div>
              <h3 className="font-bold text-sm text-neutral-950">Submission History</h3>
              <p className="text-[11px] text-neutral-500">{team.name} &bull; {team.score} Points</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded-md hover:bg-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-neutral-50/50 border-b border-neutral-200 text-center text-xs">
          <div className="bg-white p-2 rounded-xl border border-neutral-200">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Accepted</span>
            <span className="text-base font-extrabold text-neutral-950 font-mono">{acceptedCount} / 5</span>
          </div>
          <div className="bg-white p-2 rounded-xl border border-neutral-200">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Submitted</span>
            <span className="text-base font-extrabold text-neutral-950 font-mono">{teamSubmissions.length}</span>
          </div>
        </div>

        {/* List of submissions */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {teamSubmissions.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No bug submissions recorded yet.</p>
            </div>
          ) : (
            teamSubmissions.map((sub) => {
              const isAccepted = sub.status === 'accepted';
              const time = new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div 
                  key={sub.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                    isAccepted
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-neutral-50 border-neutral-200/90'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold">
                      {isAccepted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      )}
                      <span className={isAccepted ? 'text-emerald-900' : 'text-neutral-800'}>
                        {sub.targetComponent || sub.category}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] ${
                      isAccepted 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {isAccepted ? `+${sub.pointsAwarded || 20} PTS` : '0 PTS'}
                    </span>
                  </div>

                  <p className="text-neutral-600 line-clamp-2">
                    {sub.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-200/50">
                    <span className="capitalize">Category: {sub.category}</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {time}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
