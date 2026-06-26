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
  { id: "h1", category: "Garbage issue fixed", date: "June 24" },
  { id: "h2", category: "Water leakage repaired", date: "June 22" },
  { id: "h3", category: "Fallen tree removed", date: "June 20" },
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
  const [statsExpanded, setStatsExpanded] = useState(false);

  return (
    <div className="p-6 pt-12 pb-32 min-h-screen text-[#ededed] selection:bg-sky-500/30" style={{ maxWidth: 500, margin: '0 auto', backgroundColor: '#000' }}>
      
      {/* Page Title */}
      <h1 className="text-[28px] font-semibold tracking-tight mb-10">Activity</h1>

      {/* 1. Stats Card — tap to expand */}
      <div className="mb-20">
        <AnimatePresence mode="wait">
          {!statsExpanded ? (
            // ── Collapsed: single card with 3 numbers ──
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <MagicCard className="rounded-2xl w-full" clickEffect={false}>
                <div
                  className="bg-[#111] border border-[#222] rounded-2xl relative cursor-pointer select-none overflow-hidden"
                  onClick={() => setStatsExpanded(true)}
                >
                  <div className="flex items-center justify-between p-6 pb-8">
                    <div className="flex flex-col items-center flex-1">
                      <p className="text-[32px] font-semibold tracking-tighter leading-none text-white">{STATS.submitted}</p>
                      <p className="text-[#666] text-[12px] font-medium mt-2 text-center">Submitted</p>
                    </div>
                    <div className="w-px h-10 bg-[#222]" />
                    <div className="flex flex-col items-center flex-1">
                      <p className="text-[32px] font-semibold tracking-tighter leading-none text-emerald-400">{STATS.resolved}</p>
                      <p className="text-[#666] text-[12px] font-medium mt-2 text-center">Resolved</p>
                    </div>
                    <div className="w-px h-10 bg-[#222]" />
                    <div className="flex flex-col items-center flex-1">
                      <p className="text-[32px] font-semibold tracking-tighter leading-none text-sky-400">{STATS.verified}</p>
                      <p className="text-[#666] text-[12px] font-medium mt-2 text-center leading-tight">Verified<br />by You</p>
                    </div>
                  </div>
                  <div className="absolute bottom-1.5 left-0 right-0 flex justify-center text-[#444] pointer-events-none">
                    <ChevronDown size={16} />
                  </div>
                </div>
              </MagicCard>
            </motion.div>
          ) : (
            // ── Expanded: 3 individual cards stacked ──
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3"
            >
              {[
                {
                  count: STATS.submitted,
                  color: 'text-white',
                  accent: 'bg-white/5',
                  title: 'You put it on the map.',
                  sub: 'Every issue you reported is a step toward a better city.',
                },
                {
                  count: STATS.resolved,
                  color: 'text-emerald-400',
                  accent: 'bg-emerald-500/8',
                  title: 'Real change, thanks to you.',
                  sub: 'These fixes happened because you spoke up. The city heard you.',
                },
                {
                  count: STATS.verified,
                  color: 'text-sky-400',
                  accent: 'bg-sky-500/8',
                  title: 'You made it count.',
                  sub: 'Your on-ground verification gave these issues the credibility to act on.',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                >
                  <MagicCard className="rounded-xl w-full" clickEffect={false}>
                    <div
                      className="bg-[#111] border border-[#222] rounded-xl px-5 py-5 flex items-center gap-5 cursor-pointer"
                      onClick={() => i === 0 && setStatsExpanded(false)}
                    >
                      <div className={`w-14 h-14 rounded-xl ${item.accent} flex items-center justify-center shrink-0`}>
                        <p className={`text-[26px] font-bold tracking-tighter leading-none ${item.color}`}>{item.count}</p>
                      </div>
                      <div>
                        <p className="text-white text-[15px] font-semibold tracking-tight leading-snug">{item.title}</p>
                        <p className="text-[#555] text-[12px] mt-1 leading-relaxed">{item.sub}</p>
                      </div>
                    </div>
                  </MagicCard>
                </motion.div>
              ))}
              <button
                onClick={() => setStatsExpanded(false)}
                className="text-[#444] text-[12px] font-medium text-center py-2 hover:text-[#666] transition-colors"
              >
                Collapse
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Recent Updates (No borders, massive spacing) */}
      <div className="mb-20">
        <h2 className="text-[14px] font-medium text-[#666] mb-8">Recent Updates</h2>
        <div className="space-y-8 pl-1">
          {UPDATES.map((update) => (
            <div key={update.id} className="flex gap-4 items-start">
              <div className="mt-1">
                {update.type === 'success' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                {update.type === 'info' && <div className="w-2 h-2 rounded-full bg-sky-500"></div>}
                {update.type === 'resolved' && <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></div>}
              </div>
              <div className="flex-1">
                <p className="text-[15px] text-[#ddd] leading-snug tracking-tight">{update.text}</p>
                <p className="text-[13px] text-[#666] mt-1.5">{update.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. My Submitted Reports */}
      <div className="mb-20">
        <h2 className="text-[14px] font-medium text-[#666] mb-6">Active Reports</h2>
        <div className="space-y-4">
          {MY_REPORTS.map(report => {
            const isExpanded = expandedReportId === report.id;
            return (
              <MagicCard key={report.id} className="rounded-xl w-full">
                <div 
                  className="bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden cursor-pointer w-full"
                  onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                >
                  <div className="p-5 flex items-center gap-4">
                    <span className="text-[16px]">{report.emoji}</span>
                    <div className="flex-1">
                      <p className="text-[15px] text-[#eee] font-medium tracking-tight leading-tight">{report.category}</p>
                      <p className="text-[#666] text-[13px] mt-1">{report.location}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-medium text-[#888]">{report.statusLabel}</span>
                      <ChevronDown size={14} className={`text-[#666] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[#222] bg-[#050505]"
                      >
                        <div className="p-6 pt-8 pb-8 pl-8">
                          <div className="relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[3px] top-2 bottom-2 w-[1px] bg-[#333]"></div>
                            
                            <div className="space-y-7 relative z-10">
                              {STATUS_STEPS.map((step) => {
                                const state = getStepState(report.status, step.key);
                                return (
                                  <div key={step.key} className="flex gap-5 items-center">
                                    <div className="bg-[#050505] py-1">
                                      <div className={`w-1.5 h-1.5 rounded-full ${
                                        state === 'completed' ? 'bg-[#555]' :
                                        state === 'current' ? 'bg-sky-500 ring-4 ring-sky-500/20' :
                                        'bg-[#222]'
                                      }`}></div>
                                    </div>
                                    <span className={`text-[14px] tracking-tight ${
                                      state === 'completed' ? 'text-[#888]' :
                                      state === 'current' ? 'text-sky-500 font-medium' :
                                      'text-[#444]'
                                    }`}>
                                      {step.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </MagicCard>
            );
          })}
        </div>
      </div>

      {/* 5. Resolved History (Text-only layout) */}
      <div className="mb-8">
        <h2 className="text-[14px] font-medium text-[#666] mb-6">History</h2>
        <div className="space-y-1">
          {RESOLVED_HISTORY.map(history => (
            <div key={history.id} className="flex items-center justify-between py-4 border-b border-[#111] last:border-0">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={14} className="text-[#444]" />
                <p className="text-[#ccc] text-[15px] tracking-tight">{history.category}</p>
              </div>
              <p className="text-[#666] text-[13px]">{history.date}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
