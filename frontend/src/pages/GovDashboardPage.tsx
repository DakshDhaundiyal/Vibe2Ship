import React, { useState, useEffect } from 'react';
import AnimatedList from '../components/AnimatedList';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Route, CheckCircle2, Truck, Users, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CATEGORY_CONFIG, BACKEND_URL, type Report } from '../types';
import MagicCard from '../components/MagicCard';
import toast from 'react-hot-toast';

const TEAMS_DATA = [
  {
    id: 'road',
    name: 'Road Repair Division',
    units: [
      { name: 'Unit A', status: 'available' },
      { name: 'Unit B', status: 'busy', eta: '2 hrs' },
      { name: 'Unit C', status: 'available' },
    ]
  },
  {
    id: 'sanitation',
    name: 'Sanitation Dept',
    units: [
      { name: 'Unit A', status: 'busy', eta: '1 hr' },
      { name: 'Unit B', status: 'busy', eta: '4 hrs' },
      { name: 'Unit C', status: 'busy', eta: '30 mins' },
    ]
  },
  {
    id: 'water',
    name: 'Water Works Dept',
    units: [
      { name: 'Unit A', status: 'available' },
      { name: 'Unit B', status: 'dispatched' },
      { name: 'Unit C', status: 'busy', eta: '1.5 hrs' },
    ]
  },
  {
    id: 'rapid',
    name: 'Rapid Response Unit',
    units: [
      { name: 'Alpha Squad', status: 'dispatched' },
      { name: 'Bravo Squad', status: 'busy', eta: '30 mins' },
      { name: 'Charlie Squad', status: 'available' },
    ]
  }
];

const getTeamForCategory = (cat: string) => {
  switch(cat) {
    case 'pothole':
    case 'broken_sidewalk':
      return { department: 'Road Repair Division', unit: 'Unit A', available: true };
    case 'garbage':
      return { department: 'Sanitation Dept', unit: 'None Available', available: false };
    case 'water_leak':
      return { department: 'Water Works Dept', unit: 'Unit A', available: true };
    case 'fallen_tree':
    case 'other':
    case 'invalid':
    default:
      return { department: 'Rapid Response Unit', unit: 'Charlie Squad', available: true };
  }
};

const getDummyLocation = (id: string) => {
  const locs = ['Cyber City', 'Sohna Road', 'DLF Phase 3', 'MG Road', 'Golf Course Road', 'Sector 56'];
  let num = 0;
  for (let i=0; i<id.length; i++) num += id.charCodeAt(i);
  return locs[num % locs.length];
};

const getDummyDistance = (id: string) => {
  let num = 0;
  for (let i=0; i<id.length; i++) num += id.charCodeAt(i);
  const dist = (num % 45) * 100 + 200; // 200m to 4700m
  return dist >= 1000 ? `${(dist/1000).toFixed(1)} km` : `${dist}m`;
};

const DispatchActionPanel = ({ reportId, category, onDispatch }: { reportId: string, category: string, onDispatch: (id: string, team: string) => void }) => {
  const team = getTeamForCategory(category);
  const distance = getDummyDistance(reportId);

  return (
    <div className="mt-4 pt-4 border-t border-[#222]" onClick={e => e.stopPropagation()}>
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-medium text-[#666]">Required Team</label>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[#050505] border border-[#222] rounded-lg text-sm text-white px-4 py-3 flex flex-col justify-center">
            <span className="font-medium text-[#eee] tracking-tight">{team.department}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[#888] text-xs">{team.unit}</span>
              {team.available ? (
                <>
                  <span className="text-emerald-500 text-[10px] font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">Available</span>
                  <span className="text-sky-500 text-[10px] font-medium bg-sky-500/10 px-1.5 py-0.5 rounded">{distance} Away</span>
                </>
              ) : (
                <span className="text-[#888] text-[10px] font-medium bg-white/5 px-1.5 py-0.5 rounded">Unavailable</span>
              )}
            </div>
          </div>
          <button 
            onClick={() => team.available && onDispatch(reportId, `${team.department} - ${team.unit}`)}
            disabled={!team.available}
            className={`font-medium px-4 py-3 rounded-lg text-[13px] transition-colors flex items-center gap-2 ${
              team.available 
                ? 'bg-[#111] border border-[#222] hover:bg-[#222] text-[#eee]' 
                : 'bg-transparent text-[#444] cursor-not-allowed border border-[#111]'
            }`}
          >
            <Truck size={14} />
            Dispatch
          </button>
        </div>
      </div>
    </div>
  );
};

export default function GovDashboardPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: reportsData } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (reportsData) setReports(reportsData);
    setLoading(false);
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Action Successful`);
        setExpandedReportId(null);
        fetchData();
      } else {
        toast.error('Failed to perform action');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center pt-14 pb-24"><div className="w-8 h-8 border-4 border-[#333] border-t-[#888] rounded-full animate-spin"></div></div>;
  }

  // Score = AI trust (0-100) + community confirms weighted at 5 pts each.
  // Both factors contribute equally — sorted descending so highest combined score comes first.
  const getPriorityScore = (r: Report) => {
    const trustScore = r.ai_confidence || 0;               // 0–100
    const confScore  = (r.confirmation_count || 0) * 5;    // each confirm = 5 pts
    return trustScore + confScore;
  };

  const urgentQueue = reports
    .filter(r => ['reported', 'verified', 'assigned'].includes(r.status))
    .sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

  const dispatchedQueue = reports
    .filter(r => r.status === 'in_progress')
    .sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

  const top3Urgent = urgentQueue.slice(0, 3);

  return (
    <div className="p-5 pt-12 pb-32 min-h-screen text-[#ededed] selection:bg-sky-500/30 font-sans" style={{ maxWidth: 500, margin: '0 auto', backgroundColor: '#000' }}>
      
      {/* Premium Header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <p className="text-[#888] font-medium text-[13px] tracking-wide uppercase mb-1">Command Center</p>
          <h1 className="text-[32px] font-bold tracking-tight leading-none text-white">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bento-glass-sm bg-emerald-500/10 border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[12px] font-semibold text-emerald-400">Live</span>
        </div>
      </div>

      {/* 1. Metrics Layout */}
      <div className="mb-8 flex flex-col gap-3">
        {/* Total Issues Rectangle */}
        <div className="bento-glass-sm p-5 relative overflow-hidden group rounded-2xl w-full">
          <p className="text-[#888] text-[12px] font-semibold uppercase tracking-wider mb-2 relative z-10">Total Issues</p>
          <p className="text-white text-[36px] font-bold tracking-tighter leading-none relative z-10">{reports.length}</p>
        </div>
        
        {/* Pending & Solved Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pending Issues (No Glow) */}
          <div className="bento-glass-sm p-5 relative overflow-hidden group col-span-1 rounded-2xl">
            <p className="text-[#888] text-[12px] font-semibold uppercase tracking-wider mb-2 relative z-10">Pending Issues</p>
            <p className="text-white text-[32px] font-bold tracking-tighter leading-none relative z-10">{urgentQueue.length}</p>
          </div>
          
          {/* Issues Solved (With Glow) */}
          <div className="bento-glass-sm p-5 relative overflow-hidden group col-span-1 rounded-2xl border-emerald-500/20 bg-emerald-500/5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
            <p className="text-emerald-500/70 text-[12px] font-semibold uppercase tracking-wider mb-2 relative z-10">Issues Solved</p>
            <p className="text-emerald-400 text-[32px] font-bold tracking-tighter leading-none relative z-10">{reports.filter(r => r.status === 'resolved').length}</p>
          </div>
        </div>
      </div>

      {/* 2. AI Insight Widget */}
      <div className="bento-glass mb-8 p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent"></div>
        <div className="flex gap-4 items-start relative z-10">
          <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
            <span className="text-[18px]">✨</span>
          </div>
          <div>
            <h3 className="text-white font-semibold text-[16px] tracking-tight mb-1">AI Insight</h3>
            <p className="text-[#aaa] text-[13px] leading-relaxed">
              Detected a <strong className="text-sky-400 font-medium">30% surge</strong> in pothole complaints near Cyber City over the last 48 hours. Suggesting preemptive road repair deployment.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Urgent Queue (Glassmorphism List) */}
      <div className="mb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-white tracking-tight">Urgent Actions</h2>
          <span className="text-[11px] text-amber-500 font-medium px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5">
            <AlertTriangle size={12} /> Needs Dispatch
          </span>
        </div>
           {urgentQueue.length === 0 ? (
          <div className="bento-glass-sm p-8 text-center text-[#666]">
            Queue is clear. Great job!
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatedList items={urgentQueue} displayScrollbar={false} className="w-full space-y-3" renderItem={(report) => {
              const isExpanded = expandedReportId === report.id;
              return (
                <div 
                  className={`bento-glass-sm p-4 cursor-pointer transition-all ${isExpanded ? 'bg-white/10' : 'bg-[#0a0a0a]'}`}
                  onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[18px] shrink-0 border border-white/10">
                      {CATEGORY_CONFIG[report.category]?.emoji || '🚧'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-white font-semibold text-[15px] tracking-tight">{CATEGORY_CONFIG[report.category]?.label || 'Issue'}</p>
                        {report.severity === 'high' && <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-red-500/30">Critical</span>}
                      </div>
                      <p className="text-[#888] text-[13px] mb-2">{getDummyLocation(report.id)}</p>
                      <div className="flex items-center gap-3 text-[11px] font-semibold tracking-wider text-[#666] uppercase">
                        <span>Trust <span className="text-sky-400">{report.ai_confidence || 0}%</span></span>
                        <span className="w-1 h-1 rounded-full bg-[#333]"></span>
                        <span>Confirms <span className="text-emerald-400">{report.confirmation_count || 0}</span></span>
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <DispatchActionPanel 
                      reportId={report.id}
                      category={report.category}
                      onDispatch={(id) => handleStatusChange(id, 'in_progress')} 
                    />
                  )}
                </div>
              );
            }} />
          </div>
        )}
      </div>

      {/* Currently Dispatched Teams Queue */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-white tracking-tight">In the Field</h2>
          <span className="text-[11px] text-sky-400 font-medium px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center gap-1.5">
            <Truck size={12} /> Dispatched
          </span>
        </div>
        {dispatchedQueue.length === 0 ? (
          <div className="bento-glass-sm p-8 text-center text-[#666]">No teams currently in the field.</div>
        ) : (
          <AnimatedList
            items={dispatchedQueue}
            displayScrollbar={false}
            className="w-full space-y-3"
            renderItem={(report) => {
              const isExpanded = expandedReportId === report.id;
              return (
                <div 
                  className={`bento-glass-sm p-4 cursor-pointer transition-all ${isExpanded ? 'bg-white/10' : ''}`}
                  onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-[18px] shrink-0">
                      {CATEGORY_CONFIG[report.category]?.emoji || '🚧'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-white font-semibold text-[15px] tracking-tight">{CATEGORY_CONFIG[report.category]?.label}</p>
                        <span className="text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span> IN PROGRESS
                        </span>
                      </div>
                      <p className="text-[#888] text-[13px] mb-1">{getDummyLocation(report.id)}</p>
                      <p className="text-[#666] text-[12px]">Team: <span className="text-[#aaa]">{getTeamForCategory(report.category).department}</span></p>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(report.id, 'resolved'); }}
                        className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-semibold py-3 rounded-xl text-[14px] transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} /> Mark as Resolved
                      </button>
                    </div>
                  )}
                </div>
              );
            }}
          />
        )}
      </div>

      {/* Suggested Routes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-white tracking-tight">Suggested Route</h2>
          <span className="text-[11px] text-indigo-400 font-medium px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-1.5">
            <Route size={12} /> AI Optimized
          </span>
        </div>
        {top3Urgent.length === 0 ? (
          <div className="bento-glass-sm p-8 text-center text-[#666]">No urgent routes to plan.</div>
        ) : (
          <div className="bento-glass p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
            <div className="relative z-10">
              {top3Urgent.map((report, idx) => (
                <div key={report.id} className="flex gap-4 items-start relative">
                  {idx !== top3Urgent.length - 1 && (
                    <div className="absolute left-[11px] top-7 bottom-[-16px] w-[2px] bg-white/10 z-0" />
                  )}
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[11px] font-bold text-indigo-400 shrink-0 mt-1 z-10">
                    {idx + 1}
                  </div>
                  <div className="flex-1 pb-5 last:pb-0">
                    <p className="text-white font-semibold text-[15px] tracking-tight">{getDummyLocation(report.id)}</p>
                    <p className="text-[#888] text-[13px] mt-0.5">{CATEGORY_CONFIG[report.category]?.label} · {getDummyDistance(report.id)} away</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fleet Status */}
      <div className="mb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-white tracking-tight">Fleet Status</h2>
          <span className="text-[11px] text-[#888] font-medium px-2.5 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5">
            <Users size={12} /> {TEAMS_DATA.length} Departments
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TEAMS_DATA.map(team => {
            const availableCount = team.units.filter(u => u.status === 'available').length;
            const isAllBusy = availableCount === 0;
            return (
              <div key={team.id} className={`bento-glass-sm p-4 rounded-2xl border ${isAllBusy ? 'border-red-500/20 bg-red-500/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
                <p className="text-white text-[13px] font-semibold tracking-tight mb-3 leading-snug">{team.name}</p>
                <div className="space-y-1.5 mb-3">
                  {team.units.map(unit => (
                    <div key={unit.name} className="flex justify-between items-center">
                      <span className="text-[#aaa] text-[12px]">{unit.name}</span>
                      {unit.status === 'available' && <span className="text-emerald-400 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">Ready</span>}
                      {unit.status === 'busy' && <span className="text-amber-400 text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">ETA {unit.eta}</span>}
                      {unit.status === 'dispatched' && <span className="text-sky-400 text-[10px] font-bold bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded-full">In Field</span>}
                    </div>
                  ))}
                </div>
                <div className="flex items-baseline gap-1 border-t border-white/5 pt-2">
                  <p className={`text-[24px] font-bold tracking-tighter leading-none ${isAllBusy ? 'text-red-400' : 'text-emerald-400'}`}>{availableCount}</p>
                  <p className="text-[#666] text-[12px]">/ {team.units.length} free</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
