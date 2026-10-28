import React, { useState } from 'react';
import { 
  Rocket, 
  Zap, 
  ShieldAlert, 
  Flame, 
  CheckCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  Plus, 
  Minus, 
  Edit3, 
  Save, 
  X,
  Users
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { Team } from '../../types';

export const AdminTeamCards: React.FC = () => {
  const { teams, setTeamScoreManual, adjustTeamPoints } = useCompetition();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Manual score editing state
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [manualScoreInput, setManualScoreInput] = useState<string>('');

  const getTeamIcon = (iconName: string) => {
    switch (iconName) {
      case 'Rocket': return <Rocket className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4" />;
      case 'Flame': return <Flame className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const copyInviteLink = (code: string) => {
    const origin = window.location.origin;
    const url = `${origin}/play/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }).catch(() => {});
  };

  const handleStartScoreEdit = (team: Team) => {
    setEditingTeamId(team.id);
    setManualScoreInput(team.score.toString());
  };

  const handleSaveScoreEdit = (teamId: string) => {
    const parsed = parseInt(manualScoreInput, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setTeamScoreManual(teamId, parsed);
    }
    setEditingTeamId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-neutral-950 flex items-center gap-2">
          <span>Active Teams</span>
          <span className="text-xs text-neutral-500 font-normal">({teams.length} Competitors)</span>
        </h2>
        <span className="text-xs text-neutral-500">
          Manual score adjustment & bug claim tracking active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teams.map((team) => {
          const isCopied = copiedCode === team.code;
          const isEditing = editingTeamId === team.id;
          const lastSubTime = team.lastSubmissionTimestamp 
            ? new Date(team.lastSubmissionTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'No submissions';

          return (
            <div
              key={team.id}
              className="bg-white border border-neutral-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-neutral-300 transition-all duration-200"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                      {getTeamIcon(team.avatarIcon)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-neutral-950 leading-snug">{team.name}</h3>
                      <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1 rounded">
                        code: {team.code}
                      </span>
                    </div>
                  </div>

                  {/* Online status indicator */}
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className={`w-2 h-2 rounded-full ${team.isOnline ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                    <span className={team.isOnline ? 'text-emerald-700 font-medium' : 'text-neutral-400'}>
                      {team.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* Score & Manual Points Box */}
                <div className="bg-neutral-50/90 p-3 rounded-xl border border-neutral-200/80 mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-600 font-semibold">Current Score:</span>
                    
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="500"
                          value={manualScoreInput}
                          onChange={(e) => setManualScoreInput(e.target.value)}
                          className="w-16 bg-white border border-neutral-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-neutral-900 text-right focus:outline-none focus:border-black"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveScoreEdit(team.id)}
                          className="p-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded"
                          title="Save Score"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingTeamId(null)}
                          className="p-1 text-neutral-500 hover:text-black"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-neutral-950 font-mono">
                          {team.score} <span className="text-xs text-neutral-400 font-normal">pts</span>
                        </span>
                        <button
                          onClick={() => handleStartScoreEdit(team)}
                          className="text-neutral-400 hover:text-neutral-900 p-0.5"
                          title="Manually Set Exact Points"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Manual Quick Points Adjust Buttons */}
                  <div className="pt-1 flex items-center justify-between text-[10px]">
                    <span className="text-neutral-500 font-medium">Quick Points:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => adjustTeamPoints(team.id, 10)}
                        className="px-1.5 py-0.5 bg-white hover:bg-neutral-200 text-neutral-800 rounded border border-neutral-300 font-mono font-bold"
                        title="Add +10 Points"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => adjustTeamPoints(team.id, 20)}
                        className="px-1.5 py-0.5 bg-white hover:bg-neutral-200 text-neutral-800 rounded border border-neutral-300 font-mono font-bold"
                        title="Add +20 Points"
                      >
                        +20
                      </button>
                      <button
                        onClick={() => adjustTeamPoints(team.id, -10)}
                        className="px-1.5 py-0.5 bg-white hover:bg-neutral-200 text-neutral-700 rounded border border-neutral-300 font-mono"
                        title="Deduct -10 Points"
                      >
                        -10
                      </button>
                    </div>
                  </div>

                  {/* Bug Slots (1 to 5) */}
                  <div className="space-y-1 pt-1 border-t border-neutral-200/60">
                    <div className="flex items-center justify-between text-[11px] text-neutral-600">
                      <span>Bugs Identified:</span>
                      <span className="font-bold text-neutral-900 font-mono">{team.bugsIdentified.length} / 5</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5].map((bNum) => {
                        const hasFound = team.bugsIdentified.includes(`BUG-${bNum}`);
                        return (
                          <div
                            key={bNum}
                            className={`h-6 rounded flex items-center justify-center text-[10px] font-bold font-mono transition-all border ${
                              hasFound
                                ? 'bg-neutral-900 text-white border-neutral-900'
                                : 'bg-white text-neutral-400 border-neutral-200'
                            }`}
                            title={hasFound ? `Bug #${bNum} Found (+20pts)` : `Bug #${bNum} Pending`}
                          >
                            {hasFound ? `✓ #${bNum}` : `#${bNum}`}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Incorrect count & last submission */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 mb-3">
                  <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/60">
                    <span className="block text-[10px] text-neutral-400">Incorrect:</span>
                    <span className="font-mono text-neutral-900 font-semibold">{team.incorrectSubmissionsCount}</span>
                  </div>
                  <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200/60 truncate">
                    <span className="block text-[10px] text-neutral-400">Last Action:</span>
                    <span className="font-mono text-neutral-900">{lastSubTime}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
                <button
                  onClick={() => copyInviteLink(team.code)}
                  className="flex-1 py-1.5 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-neutral-200 transition"
                  title="Copy Participant Link"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <a
                  href={`/play/${team.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black rounded-lg border border-neutral-200 transition"
                  title="Open Team Play View in New Tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
