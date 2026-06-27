import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronDown, CheckCircle2 } from 'lucide-react';
import MagicCard from '../components/MagicCard';

// --- MOCK DATA ---
const STATS = {
  submitted: 12,
  verified: 19,
  resolved: 8
};

const UPDATES = [
  { id: 1, text: "Your pothole complaint was verified.", time: "2 hrs ago", type: "success" },
  { id: 2, text: "Road repair team assigned to FC Road.", time: "4 hrs ago", type: "info" },
  { id: 3, text: "Garbage complaint resolved.", time: "Yesterday", type: "resolved" }
];

const MY_REPORTS = [
  {
    id: "r1",
    category: "Pothole",
    location: "FC Road, Pune",
    time: "Submitted 2 hours ago",
    status: "in_progress",
    statusLabel: "In Progress",
    emoji: "🔴"
  },
  {
    id: "r2",
    category: "Water Leak",
    location: "Baner",
    time: "Submitted yesterday",
    status: "verified",
    statusLabel: "Verified",
    emoji: "💧"
  }
];

const VERIFIED_ISSUES = [
  { id: "v1", category: "Garbage Overflow", location: "JM Road", emoji: "🗑️" },
  { id: "v2", category: "Pothole", location: "Shivajinagar", emoji: "🔴" },
  { id: "v3", category: "Broken Sidewalk", location: "Aundh", emoji: "🧱" },
];

const RESOLVED_HISTORY = [
  { id: "h1", category: "Garbage issue fixed", location: "JM Road, Pune", date: "June 24" },
  { id: "h2", category: "Water leakage repaired", location: "Baner, Pune", date: "June 22" },
  { id: "h3", category: "Fallen tree removed", location: "Koregaon Park, Pune", date: "June 20" },
];

const STATUS_STEPS = [
  { key: 'reported', label: 'Reported' },
  { key: 'verified', label: 'Community Verified' },
  { key: 'assigned', label: 'Authority Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' }
];

const getStepState = (currentStatus: string, stepKey: string) => {
  const indexMap: Record<string, number> = {
    'reported': 0,
    'verified': 1,
    'assigned': 2,
    'in_progress': 3,
    'resolved': 4
  };
  const currentIndex = indexMap[currentStatus] || 0;
  const stepIndex = indexMap[stepKey] || 0;

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'upcoming';
};


export default function ActivityPage() {
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  return (
    <div className="p-5 pt-12 pb-32 min-h-screen text-[#ededed] selection:bg-sky-500/30 font-sans" style={{ maxWidth: 500, margin: '0 auto', backgroundColor: '#000' }}>
      
      {/* Page Title */}
      <h1 className="text-[32px] font-bold tracking-tight mb-6 text-white">Activity</h1>

      {/* 1. Bento Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bento-glass-sm p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group col-span-1 rounded-2xl border border-white/5 bg-white/5">
          <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent"></div>
          <p className="text-white text-[32px] font-bold tracking-tighter leading-none z-10">{STATS.submitted}</p>
          <p className="text-[#888] text-[11px] font-semibold mt-1 uppercase tracking-wider z-10">Submitted</p>
        </div>
        <div className="bento-glass-sm p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group col-span-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent"></div>
          <p className="text-emerald-400 text-[32px] font-bold tracking-tighter leading-none z-10">{STATS.resolved}</p>
          <p className="text-emerald-500/70 text-[11px] font-semibold mt-1 uppercase tracking-wider z-10">Resolved</p>
        </div>
        <div className="bento-glass-sm p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group col-span-1 rounded-2xl border border-sky-500/20 bg-sky-500/5">
          <div className="absolute inset-0 bg-gradient-to-t from-sky-500/10 to-transparent"></div>
          <p className="text-sky-400 text-[32px] font-bold tracking-tighter leading-none z-10">{STATS.verified}</p>
          <p className="text-sky-500/70 text-[11px] font-semibold mt-1 uppercase tracking-wider z-10">Verified</p>
        </div>
      </div>

      {/* 2. My Reports */}
      <div className="mb-10">
        <h2 className="text-[18px] font-bold text-white tracking-tight mb-4">My Reports</h2>
        <div className="space-y-3">
          {MY_REPORTS.map((report) => {
            const isExpanded = expandedReportId === report.id;
            return (
              <div key={report.id} className="bento-glass p-5 transition-all duration-300 rounded-2xl border border-white/10 bg-[#0a0a0a]">
                <div 
                  className="flex items-start justify-between cursor-pointer select-none"
                  onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                >
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[20px]">
                      {report.emoji}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-[16px] tracking-tight">{report.category}</p>
                      <p className="text-[#888] text-[13px]">{report.location}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      report.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      report.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}>
                      {report.statusLabel}
                    </span>
                    <ChevronDown size={14} className={`text-[#666] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-6 pt-5 border-t border-white/10"
                  >
                    <div className="flex justify-between items-center relative">
                      <div className="absolute left-0 right-0 top-[14px] h-[2px] bg-white/5 z-0" />
                      {STATUS_STEPS.map((step) => {
                        const state = getStepState(report.status, step.key);
                        return (
                          <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 group w-16">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] transition-colors border-2 ${
                              state === 'completed' ? 'bg-sky-500 border-sky-500 text-white' :
                              state === 'current' ? 'bg-[#111] border-sky-500 text-sky-500' :
                              'bg-[#111] border-[#333] text-[#555]'
                            }`}>
                              {state === 'completed' ? <CheckCircle2 size={14} /> : <span className="w-2 h-2 rounded-full bg-current" />}
                            </div>
                            <span className={`text-[10px] font-medium text-center leading-tight ${
                              state === 'upcoming' ? 'text-[#555]' : 'text-[#aaa]'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Resolved History */}
      <div className="mb-8">
        <h2 className="text-[18px] font-bold text-white tracking-tight mb-4">History</h2>
        <div className="space-y-3">
          {RESOLVED_HISTORY.map(history => (
            <div key={history.id} className="bento-glass-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-white font-semibold text-[14px] tracking-tight leading-tight">{history.category}</p>
                  <p className="text-[#888] text-[12px] mt-0.5">{history.location}</p>
                </div>
              </div>
              <p className="text-[#666] text-[11px] font-medium uppercase tracking-wider">{history.date}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
