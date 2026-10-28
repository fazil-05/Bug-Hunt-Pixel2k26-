import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  MousePointer
} from 'lucide-react';
import { useCompetition } from '../../context/CompetitionContext';
import { BugCategory } from '../../types';
import { GradeResult } from '../../lib/gradingEngine';

interface BugReportModalProps {
  teamCode: string;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ teamCode }) => {
  const { 
    isReportModalOpen, 
    closeReportModal, 
    selectedElement, 
    activeReportMethod, 
    submitBug 
  } = useCompetition();

  const [category, setCategory] = useState<BugCategory>('search');
  const [targetComponent, setTargetComponent] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [selector, setSelector] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<GradeResult | null>(null);

  useEffect(() => {
    if (selectedElement) {
      setTargetComponent(selectedElement.component || '');
      setSelector(selectedElement.selector || '');
      if (selectedElement.category) {
        setCategory(selectedElement.category);
      }
      setTitle(`Issue identified in ${selectedElement.component}`);
    } else {
      setTargetComponent('');
      setSelector('');
      setTitle('');
    }
    setSubmissionResult(null);
  }, [selectedElement, isReportModalOpen]);

  if (!isReportModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !stepsToReproduce.trim()) return;

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const result = await submitBug(teamCode, {
        category,
        targetComponent: targetComponent || `${category} section`,
        title: title || `${category} defect`,
        description,
        stepsToReproduce,
        selector
      });

      setSubmissionResult(result);

      if (result.accepted) {
        setTimeout(() => {
          closeReportModal();
          setDescription('');
          setStepsToReproduce('');
          setTitle('');
          setSubmissionResult(null);
        }, 2200);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white border border-neutral-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
              {activeReportMethod === 'inspect' ? <MousePointer className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-950">
                {activeReportMethod === 'inspect' ? 'Target Element Bug Report' : 'Submit Defect Report'}
              </h3>
              <p className="text-[11px] text-neutral-500">
                Accurate details will be verified by the competition engine
              </p>
            </div>
          </div>
          <button 
            onClick={closeReportModal}
            className="text-neutral-400 hover:text-black p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {submissionResult && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in zoom-in-95 duration-150 ${
              submissionResult.accepted 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                : 'bg-neutral-100 border-neutral-300 text-neutral-800'
            }`}>
              {submissionResult.accepted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-neutral-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-xs sm:text-sm">{submissionResult.message}</p>
                {submissionResult.accepted && (
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Your team score has been awarded. This dialog will close automatically.
                  </p>
                )}
                {!submissionResult.accepted && (
                  <p className="text-[11px] text-neutral-600 mt-1">
                    Check your reproduction steps, category, or element details and verify the website behavior.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {selectedElement && (
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 font-mono text-[11px] text-neutral-800 flex items-center justify-between">
                <span className="truncate">
                  <span className="text-neutral-500">Target:</span> {selectedElement.component}
                </span>
                <span className="bg-white px-2 py-0.5 rounded text-neutral-600 border border-neutral-200">
                  {selectedElement.selector}
                </span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Affected Website Section / Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BugCategory)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
              >
                <option value="search">Product Search Functionality</option>
                <option value="cart">Shopping Cart & Add to Cart</option>
                <option value="pricing">Price Calculation & Totals (INR ₹)</option>
                <option value="navigation">Navigation & Links</option>
                <option value="form_validation">Checkout & Form Validation</option>
                <option value="other">Other / UI Component</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Target Element / Component Name
              </label>
              <input
                type="text"
                value={targetComponent}
                onChange={(e) => setTargetComponent(e.target.value)}
                placeholder="e.g. Search Input, Add to Cart Button, Total Summary..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Description of the Bug <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what is broken or malfunctioning. What did you observe?"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900 placeholder-neutral-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Steps to Reproduce <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder="1. Go to... 2. Click... 3. Enter... 4. Notice that..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-neutral-900 focus:outline-none focus:bg-white focus:border-neutral-900 placeholder-neutral-400"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeReportModal}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl transition text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !description.trim() || !stepsToReproduce.trim()}
                className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 text-xs"
              >
                {isSubmitting ? (
                  <span>Validating...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
