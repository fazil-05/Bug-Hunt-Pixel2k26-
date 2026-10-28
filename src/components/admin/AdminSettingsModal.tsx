import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Check 
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ isOpen, onClose }) => {
  const { round, resetRound } = useCompetition();

  const [selectedDuration, setSelectedDuration] = useState<number>(round.durationSeconds);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    let finalSeconds = selectedDuration;

    if (customMinutes && parseInt(customMinutes, 10) > 0) {
      finalSeconds = parseInt(customMinutes, 10) * 60;
    }

    if (window.confirm('Applying new round settings will reset the timer for the next round. Continue?')) {
      resetRound(finalSeconds);
      setSavedNotice(true);
      setTimeout(() => {
        setSavedNotice(false);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-neutral-900" />
            <h3 className="font-bold text-sm text-neutral-900">Competition Settings</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-6 space-y-4 text-xs sm:text-sm">
          {savedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Settings applied! Round has been refreshed.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-2">
              Round Duration Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '5 Min', secs: 300 },
                { label: '10 Min', secs: 600 },
                { label: '15 Min', secs: 900 }
              ].map(preset => (
                <button
                  type="button"
                  key={preset.secs}
                  onClick={() => {
                    setSelectedDuration(preset.secs);
                    setCustomMinutes('');
                  }}
                  className={`py-2 px-3 rounded-xl border text-center font-medium transition ${
                    selectedDuration === preset.secs && !customMinutes
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Custom Duration (Minutes)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              placeholder="e.g. 20"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Challenge Store
            </label>
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-neutral-900 block text-xs">ShopEasy (India INR Store)</span>
                <span className="text-[11px] text-neutral-500">5 Intentionally Engineered Bugs</span>
              </div>
              <span className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                Active
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium transition text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl font-bold shadow-xs transition text-xs"
            >
              Apply & Reset Timer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
