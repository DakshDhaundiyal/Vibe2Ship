import React from 'react';
import { Check } from 'lucide-react';

export type IssueStatus = 'reported' | 'verified' | 'assigned' | 'in_progress' | 'resolved';

const STATUS_STAGES = [
  { id: 'reported', label: 'Reported' },
  { id: 'verified', label: 'Verified' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' }
];

export default function ProgressTracker({ currentStatus }: { currentStatus: string }) {
  // Determine current index. If unknown, assume reported.
  let currentIndex = STATUS_STAGES.findIndex(s => s.id === currentStatus);
  if (currentIndex === -1) currentIndex = 0;

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between relative">
        {/* Background track line */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-700/50 z-0 mx-2"></div>
        
        {/* Active track line */}
        <div 
          className="absolute top-3 left-0 h-0.5 bg-sky-500 z-0 mx-2 transition-all duration-500 ease-in-out"
          style={{ width: `calc(${(currentIndex / (STATUS_STAGES.length - 1)) * 100}% - 16px)` }}
        ></div>

        {STATUS_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all duration-300 ${
                  isCompleted ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.5)]' :
                  isActive ? 'bg-white text-sky-500 border-2 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.8)]' :
                  'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {isCompleted ? <Check size={12} strokeWidth={3} /> : (idx + 1)}
              </div>
              <span 
                className={`text-[9px] uppercase tracking-wider font-semibold whitespace-nowrap absolute -bottom-4 ${
                  isActive ? 'text-sky-400' :
                  isCompleted ? 'text-slate-300' :
                  'text-slate-600'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-6"></div> {/* Spacer for the absolute positioned labels */}
    </div>
  );
}
