import React, { useState } from 'react';
import { 
  Key, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { DEFAULT_BUGS } from '../../data/initialData';

export const AdminAnswerKey: React.FC = () => {
  const [expandedBugId, setExpandedBugId] = useState<string | null>('bug-1');

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-neutral-900" />
          <h2 className="text-base font-bold text-neutral-950">Diagnostic Technical Specs</h2>
          <span className="text-[10px] uppercase font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded border border-neutral-200">
            Admin Only
          </span>
        </div>
        <span className="text-xs text-neutral-400">
          5 Bugs Reference
        </span>
      </div>

      <div className="space-y-2.5">
        {DEFAULT_BUGS.map((bug) => {
          const isExpanded = expandedBugId === bug.id;

          return (
            <div 
              key={bug.id}
              className="bg-neutral-50/70 rounded-xl border border-neutral-200/80 overflow-hidden text-xs transition-colors"
            >
              <button
                onClick={() => setExpandedBugId(isExpanded ? null : bug.id)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-neutral-100/60 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-900 text-white text-[10px]">
                    {bug.bugKey}
                  </span>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-xs sm:text-sm">{bug.title}</h3>
                    <div className="flex items-center gap-2 text-neutral-500 text-[10px] mt-0.5">
                      <span className="capitalize">{bug.category}</span>
                      <span>&bull;</span>
                      <span className="text-neutral-700 font-mono">{bug.targetElementSelector}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-neutral-900 font-bold bg-white px-2 py-0.5 rounded border border-neutral-200 text-[11px]">
                    +{bug.points} PTS
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                </div>
              </button>

              {isExpanded && (
                <div className="p-3.5 border-t border-neutral-200/80 space-y-2.5 bg-white text-neutral-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <strong className="text-neutral-900 font-semibold block mb-0.5">Expected Behavior:</strong>
                      <p className="text-neutral-600 leading-relaxed">{bug.expectedBehavior}</p>
                    </div>
                    <div>
                      <strong className="text-rose-700 font-semibold block mb-0.5">Defect Behavior:</strong>
                      <p className="text-neutral-600 leading-relaxed">{bug.actualBehavior}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100">
                    <strong className="text-neutral-900 font-semibold block mb-1">
                      Reproduction Steps:
                    </strong>
                    <ol className="list-decimal list-inside space-y-0.5 text-neutral-600 pl-1">
                      {bug.reproductionSteps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                  </div>

                  {bug.explanationPostRound && (
                    <div className="pt-2 border-t border-neutral-100 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/60">
                      <strong className="text-neutral-900 font-semibold block mb-0.5 text-[11px] flex items-center gap-1.5">
                        <span>📢 Post-Quiz Explanation Script (Explain to Students):</span>
                      </strong>
                      <p className="text-neutral-700 leading-relaxed text-[11px] font-mono">
                        {bug.explanationPostRound}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
