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
    <div className="p-6 pt-12 pb-32 min-h-screen text-[#ededed] selection:bg-sky-500/30" style={{ maxWidth: 500, margin: '0 auto', backgroundColor: '#000' }}>
      
      {/* Premium Header (No big container, just text + live dot) */}
      <div className="mb-20 flex justify-between items-start mt-4">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tighter mb-1 text-white">Response Center</h1>
          <p className="text-[#666] font-medium text-[15px] tracking-tight">Real-time city infrastructure.</p>
        </div>
        <div className="flex items-center gap-2 mt-2 px-2.5 py-1 rounded-full bg-[#111] border border-[#222]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-medium text-[#888]">Live</span>
        </div>
      </div>

      {/* Main Urgent Queue */}
      <div className="mb-20">
        <h2 className="text-[14px] font-medium text-[#666] mb-6 flex items-center gap-2">
          <AlertTriangle size={14} className="text-[#888]" /> Urgent Queue
        </h2>
        {urgentQueue.length === 0 ? (
          <p className="text-[#444] text-sm">Queue is clear.</p>
        ) : (
          <AnimatedList
            items={urgentQueue}
            displayScrollbar={true}
            className="w-full space-y-3"
            renderItem={(report) => {
              const isExpanded = expandedReportId === report.id;
              return (
                <div 
                  className={`border ${isExpanded ? 'border-[#444] bg-[#0a0a0a]' : 'border-[#222] bg-[#111]'} rounded-xl overflow-hidden cursor-pointer transition-colors`}
                  onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <span className="text-[16px] mt-0.5">{CATEGORY_CONFIG[report.category]?.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-white text-[15px] font-medium tracking-tight">
                            {CATEGORY_CONFIG[report.category]?.label}
                          </p>
                          {report.severity === 'high' && <span className="bg-red-500/10 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-medium">Critical</span>}
                        </div>
                        <p className="text-[#666] text-[13px]">{getDummyLocation(report.id)}</p>
                        
                        <div className="flex items-center gap-4 text-[12px] mt-3 text-[#555]">
                          <span>Trust: <span className="text-[#eee]">{report.ai_confidence || 0}%</span></span>
                          <span className="text-[#333]">•</span>
                          <span>Confirms: <span className="text-[#eee]">{report.confirmation_count || 0}</span></span>
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
                </div>
              );
            }}
          />
        )}
      </div>

      {/* Suggested Routes (Top 3 Urgent Issues) - Minimal list format */}
      <div className="mb-20">
        <h2 className="text-[14px] font-medium text-[#666] mb-6 flex items-center gap-2">
          <Route size={14} className="text-[#888]" /> Suggested Routes
        </h2>
        <div className="space-y-4">
          {top3Urgent.length === 0 ? (
            <p className="text-[#444] text-[13px]">No urgent issues to route.</p>
          ) : top3Urgent.map((report, idx) => (
             <div key={report.id} className="flex gap-4 items-start">
               <div className="mt-1 text-[#666] font-medium text-[12px] w-4">
                 #{idx + 1}
               </div>
               <div className="flex-1">
                 <p className="text-[#eee] text-[14px] tracking-tight leading-snug">
                   Send <span className="text-white font-medium">Team {['A','B','C'][idx]}</span> to <span className="text-white font-medium">{getDummyLocation(report.id)}</span> for {CATEGORY_CONFIG[report.category]?.label.toLowerCase()}.
                 </p>
                 <p className="text-[#666] text-[13px] mt-1.5">
                   Team is <span className="text-[#888]">{getDummyDistance(report.id)} away</span>
                 </p>
               </div>
             </div>
          ))}
        </div>
      </div>

      {/* Teams Availability Section (Horizontal snap rhythm) */}
      <div className="mb-20">
        <h2 className="text-[14px] font-medium text-[#666] mb-6 flex items-center gap-2">
          <Users size={14} className="text-[#888]" /> Teams Availability
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 snap-x hide-scrollbar">
          {TEAMS_DATA.map(team => {
            const isExpanded = expandedReportId === `team-${team.id}`;
            const availableCount = team.units.filter(u => u.status === 'available').length;
            
            return (
              <MagicCard key={team.id} className="min-w-[240px] snap-start rounded-xl h-full">
                <div className="bg-[#111] border border-[#222] rounded-xl h-full flex flex-col">
                  <div className="p-5 border-b border-[#222]">
                    <p className="text-white font-medium text-[14px] tracking-tight mb-1">{team.name}</p>
                    <p className="text-[#666] text-[12px]">{availableCount} / {team.units.length} Units Available</p>
                  </div>
                  
                  <div className="p-3 space-y-1 flex-1">
                    {team.units.map(unit => (
                      <div key={unit.name} className="flex justify-between items-center p-2 rounded-lg">
                        <span className="text-[#aaa] text-[13px]">{unit.name}</span>
                        {unit.status === 'available' && <span className="text-emerald-500 text-[10px] font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">Ready</span>}
                        {unit.status === 'busy' && <span className="text-sky-500 text-[10px] font-medium bg-sky-500/10 px-1.5 py-0.5 rounded">ETA {unit.eta}</span>}
                        {unit.status === 'dispatched' && <span className="text-[#888] text-[10px] font-medium bg-[#222] px-1.5 py-0.5 rounded">In Field</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </MagicCard>
            );
          })}
        </div>
      </div>

      {/* Currently Dispatched Teams Queue */}
      <div className="mb-20">
        <h2 className="text-[14px] font-medium text-[#666] mb-6 flex items-center gap-2">
          <Truck size={14} className="text-[#888]" /> Currently Dispatched
        </h2>
        {dispatchedQueue.length === 0 ? (
          <p className="text-[#444] text-[13px]">No teams currently in the field.</p>
        ) : (
          <AnimatedList
            items={dispatchedQueue}
            displayScrollbar={true}
            className="w-full space-y-3"
            renderItem={(report) => {
              const isExpanded = expandedReportId === report.id;
              return (
                <div 
                  className={`p-5 border ${isExpanded ? 'border-[#444] bg-[#0a0a0a]' : 'border-[#222] bg-[#111]'} rounded-xl cursor-pointer transition-colors`}
                  onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-[16px] mt-0.5">{CATEGORY_CONFIG[report.category]?.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-white text-[15px] font-medium tracking-tight">
                          {CATEGORY_CONFIG[report.category]?.label}
                        </p>
                        <span className="text-sky-400 text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-500/10 flex items-center gap-1.5">
                           <span className="w-1 h-1 rounded-full bg-sky-400 animate-pulse"></span> IN PROGRESS
                        </span>
                      </div>
                      <p className="text-[#666] text-[13px] mb-3">{getDummyLocation(report.id)}</p>
                      <p className="text-[#888] text-[12px]">Dispatched: <span className="text-[#ccc]">{getTeamForCategory(report.category).department} - {getTeamForCategory(report.category).unit}</span></p>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-[#222]">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(report.id, 'resolved'); }}
                        className="w-full bg-[#111] hover:bg-[#222] text-[#eee] border border-[#222] font-medium py-2.5 rounded-lg text-[13px] transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} className="text-[#888]" /> Mark Issue Resolved
                      </button>
                    </div>
                  )}
                </div>
              );
            }}
          />
        )}
      </div>

    </div>
  );
}
