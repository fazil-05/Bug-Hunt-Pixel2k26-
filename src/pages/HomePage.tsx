import React, { useState } from 'react';
import { 
  Bug, 
  ShieldCheck, 
  Trophy, 
  Timer, 
  ArrowRight, 
  CheckCircle2, 
  Target,
  Award,
  ChevronRight
} from 'lucide-react';
import { useCompetition } from '../context/CompetitionContext';

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { teams, getTeamByCode } = useCompetition();
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim().toLowerCase();
    const foundTeam = getTeamByCode(cleanCode);

    if (foundTeam) {
      onNavigate(`/play/${foundTeam.code}`);
    } else {
      setErrorMsg(`No team found with code "${inputCode}". Use aries, invictus, atlas, or phoenix.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-8 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white shadow-xs">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-neutral-950 block leading-tight">
                BUG HUNT PIXEL2K26
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                COMPETITION PLATFORM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('/join')}
              className="text-xs sm:text-sm font-semibold text-neutral-600 hover:text-black px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition"
            >
              Select Team
            </button>
            <button
              onClick={() => onNavigate('/admin')}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-700 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-neutral-900" />
              <span>Real-Time 4-Team Bug Hunting Arena</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-neutral-950 tracking-tight leading-tight sm:leading-none">
              Hunt Bugs.<br />
              Race The Clock.<br />
              <span className="text-neutral-500 font-extrabold">
                Claim The Trophy.
              </span>
            </h1>

            <p className="text-neutral-600 text-sm sm:text-base max-w-xl leading-relaxed">
              Four teams enter a live, fully-functional Indian e-commerce challenge website (**ShopEasy** in ₹ INR) with five intentionally introduced defects. Identify them before time expires.
            </p>

            {/* Quick Team Join Box */}
            <div className="bg-white border border-neutral-200/90 p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] max-w-md">
              <h3 className="text-xs uppercase font-bold text-neutral-500 tracking-wider mb-2 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-neutral-900" />
                <span>Enter with Team Code</span>
              </h3>
              <form onSubmit={handleJoinByCode} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. aries, invictus, atlas, phoenix"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    setErrorMsg('');
                  }}
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900 placeholder-neutral-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center gap-1.5 shrink-0"
                >
                  <span>Join</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
              {errorMsg && (
                <p className="text-xs text-rose-600 mt-2">{errorMsg}</p>
              )}
            </div>

            {/* Quick Team Select Links */}
            <div className="pt-1">
              <span className="text-xs text-neutral-500 block mb-2 font-medium">
                Direct access for 4 competition teams:
              </span>
              <div className="flex flex-wrap gap-2">
                {teams.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onNavigate(`/play/${t.code}`)}
                    className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-xs font-semibold rounded-xl border border-neutral-200/90 shadow-xs transition flex items-center gap-1.5 text-neutral-800"
                  >
                    <span>{t.name}</span>
                    <span className="text-[10px] text-neutral-400 font-mono">({t.code})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Hero: Rules Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-neutral-900" />
                  <h3 className="font-bold text-neutral-950 text-base">Competition Rules</h3>
                </div>
                <span className="bg-neutral-100 text-neutral-800 text-xs px-2.5 py-0.5 rounded-full font-bold border border-neutral-200">
                  Standard Format
                </span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-neutral-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 border border-neutral-200">
                    +20
                  </div>
                  <div>
                    <strong className="text-neutral-950 block font-semibold">20 Points Per Unique Bug</strong>
                    <span>Each verified defect discovered by your team awards 20 points. Maximum 100 points.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 border border-neutral-200">
                    <Timer className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-neutral-950 block font-semibold">Synchronized Master Timer</strong>
                    <span>All 4 teams compete with authoritative server-synchronized countdown timestamps.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 border border-neutral-200">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-neutral-950 block font-semibold">Dual Reporting System</strong>
                    <span>Use the "Report Bug" modal or activate "Inspect Bug" mode to select elements directly.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-900 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 border border-neutral-200">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-neutral-950 block font-semibold">Leaderboard Ranking</strong>
                    <span>(1) Score &rarr; (2) Bugs Found &rarr; (3) Fastest Time &rarr; (4) Fewest incorrect attempts.</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
                <span>Active Challenge: <strong className="text-neutral-800">ShopEasy (₹ INR Store)</strong></span>
                <span className="font-mono text-neutral-700 font-semibold">5 Bugs Hidden</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 bg-white px-4 sm:px-8 py-5 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">Bug Hunt Pixel2k26</span>
            <span>&bull;</span>
            <span>Clean Architecture Platform</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-600">
            <button onClick={() => onNavigate('/admin')} className="hover:text-black transition">
              Admin Login
            </button>
            <button onClick={() => onNavigate('/join')} className="hover:text-black transition">
              Participant Join
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
