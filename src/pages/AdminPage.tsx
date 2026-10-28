import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ChevronLeft, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { useCompetition } from '../context/CompetitionContext';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminStats } from '../components/admin/AdminStats';
import { AdminTeamCards } from '../components/admin/AdminTeamCards';
import { AdminBugsTracker } from '../components/admin/AdminBugsTracker';
import { AdminLeaderboard } from '../components/admin/AdminLeaderboard';
import { AdminSubmissionsFeed } from '../components/admin/AdminSubmissionsFeed';
import { AdminAnswerKey } from '../components/admin/AdminAnswerKey';
import { AdminSettingsModal } from '../components/admin/AdminSettingsModal';

interface AdminPageProps {
  onNavigate: (route: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { isAdminAuthenticated, loginAdmin } = useCompetition();

  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;

    const ok = loginAdmin(passcode);
    if (!ok) {
      setErrorMsg('Incorrect admin passcode. Try "admin123" for competition access.');
    } else {
      setErrorMsg('');
    }
  };

  // Login Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex flex-col justify-between p-4 sm:p-8">
        <div className="max-w-md mx-auto w-full flex items-center justify-between mb-8">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-500 hover:text-black transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Arena</span>
          </button>
        </div>

        <div className="max-w-md mx-auto w-full bg-white border border-neutral-200/90 rounded-3xl p-8 shadow-[0_4px_30px_rgba(0,0,0,0.04)] space-y-6 my-auto">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 flex items-center justify-center text-white mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
              Organizer Panel
            </h2>
            <p className="text-xs text-neutral-500">
              Enter administrator authorization key to manage live rounds and inspect answers
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Admin Passcode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter passcode..."
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900 placeholder-neutral-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-2"
            >
              <span>Unlock Admin Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-[11px] text-neutral-500 text-center font-mono">
            Default tournament passcode: <strong className="text-neutral-900">admin123</strong>
          </div>
        </div>

        <footer className="text-center text-xs text-neutral-400 pt-8">
          Bug Hunt Pixel2k26 &bull; Secured with RBAC and Server Validation
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-neutral-900 flex flex-col selection:bg-neutral-900 selection:text-white">
      {/* Top Header */}
      <AdminHeader onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Navigation & Fast Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-neutral-200/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="text-xs text-neutral-500 hover:text-black flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Public Arena</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-800 rounded-xl text-xs font-semibold border border-neutral-200/90 flex items-center gap-1.5 transition shadow-xs"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-700" />
              <span>Configure Round / Timer</span>
            </button>
          </div>
        </div>

        {/* Section 1: Tournament Stats */}
        <AdminStats />

        {/* Section 2: 4 Teams Live Grid with Manual Point Adjustments */}
        <AdminTeamCards />

        {/* Section 3: Challenge Bugs & Live Student Solver Tracker */}
        <AdminBugsTracker />

        {/* Section 4: Live Leaderboard */}
        <AdminLeaderboard />

        {/* Section 5: Submissions Feed & Diagnostic Technical Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminSubmissionsFeed />
          <AdminAnswerKey />
        </div>
      </main>

      {/* Settings Modal */}
      <AdminSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
