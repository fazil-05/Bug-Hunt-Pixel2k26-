import React, { useState } from 'react';
import { 
  Bug, 
  Rocket, 
  Zap, 
  ShieldAlert, 
  Flame, 
  ArrowRight, 
  Copy, 
  Check, 
  ChevronLeft,
  Users
} from 'lucide-react';
import { useCompetition } from '../context/CompetitionContext';

interface JoinPageProps {
  onNavigate: (route: string) => void;
}

export const JoinPage: React.FC<JoinPageProps> = ({ onNavigate }) => {
  const { teams, getTeamByCode } = useCompetition();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getTeamIcon = (iconName: string) => {
    switch (iconName) {
      case 'Rocket': return <Rocket className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5" />;
      case 'Flame': return <Flame className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customCode.trim().toLowerCase();
    const foundTeam = getTeamByCode(clean);

    if (foundTeam) {
      onNavigate(`/play/${foundTeam.code}`);
    } else {
      setErrorMsg(`Code "${customCode}" is not registered. Choose from aries, invictus, atlas, or phoenix.`);
    }
  };

  const copyUrl = (code: string) => {
    const url = `${window.location.origin}/play/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between mb-8">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-500 hover:text-black transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Arena Home</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
            <Bug className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-neutral-950">
            BUG HUNT PIXEL2K26
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center my-auto">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            Participant Entrance
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
            Select Your Team
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm">
            Four teams compete in the live challenge. Select your designated team or enter an access code below.
          </p>
        </div>

        {/* 4 Team Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {teams.map((team) => {
            const isCopied = copiedCode === team.code;

            return (
              <div
                key={team.id}
                className="bg-white border border-neutral-200/90 rounded-2xl p-6 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] hover:border-neutral-300 transition-all duration-200"
              >
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-4 shadow-xs">
                    {getTeamIcon(team.avatarIcon)}
                  </div>
                  <h3 className="text-lg font-bold text-neutral-950 mb-1">{team.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                    <span>Access Code:</span>
                    <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-900 font-bold border border-neutral-200">
                      {team.code}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Compete on ShopEasy India, identify all 5 defects in ₹ INR store, and climb the live standings.
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-neutral-100">
                  <button
                    onClick={() => onNavigate(`/play/${team.code}`)}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-neutral-950 hover:bg-neutral-800 shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <span>Enter as {team.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => copyUrl(team.code)}
                    className="w-full py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-black rounded-xl text-xs font-semibold border border-neutral-200 transition flex items-center justify-center gap-1.5"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Copy Team Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Manual Code Entry */}
        <div className="max-w-md mx-auto w-full bg-white border border-neutral-200/90 p-5 rounded-2xl text-center shadow-xs">
          <span className="text-xs text-neutral-600 font-medium block mb-2">
            Have a custom competition code?
          </span>
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. aries, invictus, atlas, phoenix"
              value={customCode}
              onChange={(e) => {
                setCustomCode(e.target.value);
                setErrorMsg('');
              }}
              className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900 placeholder-neutral-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              Join
            </button>
          </form>
          {errorMsg && (
            <p className="text-xs text-rose-600 mt-2">{errorMsg}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-neutral-400 pt-8">
        Bug Hunt Pixel2k26 &bull; Clean Realtime Architecture
      </footer>
    </div>
  );
};
