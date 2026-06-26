import React from 'react';
import { ShieldCheck, MapPin, Award, CheckCircle2, TrendingUp, Medal, User } from 'lucide-react';
import MagicCard from '../components/MagicCard';

export default function ProfilePage() {
  return (
    <div className="p-6 pt-12 pb-32 min-h-screen text-[#ededed] selection:bg-sky-500/30" style={{ maxWidth: 500, margin: '0 auto', backgroundColor: '#000' }}>
      
      {/* 1. Profile Header */}
      <div className="mb-20 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-[#111] border border-[#333] mb-5 overflow-hidden flex items-center justify-center">
          <User size={40} className="text-[#666]" />
        </div>
        <h1 className="text-[28px] font-semibold tracking-tighter text-white mb-1">Daksh</h1>
        <div className="flex items-center gap-1.5 text-[#666] mb-4">
          <MapPin size={12} />
          <span className="text-[14px] tracking-tight">Gurgaon, Haryana</span>
        </div>
        
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/20">
          <ShieldCheck size={12} className="text-sky-500" />
          <span className="text-sky-500 text-[11px] font-medium tracking-tight">Verified Citizen</span>
        </div>
      </div>

      {/* 2. Contribution Stats (One Clean Section) */}
      <div className="mb-20">
        <h2 className="text-[14px] font-medium text-[#666] mb-6 border-b border-[#111] pb-2">Contributions</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#aaa] text-[15px] tracking-tight">Reports Submitted</span>
            <span className="text-white font-medium text-[16px]">12</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#aaa] text-[15px] tracking-tight">Issues Verified</span>
            <span className="text-white font-medium text-[16px]">19</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#aaa] text-[15px] tracking-tight">Issues Resolved</span>
            <span className="text-white font-medium text-[16px]">8</span>
          </div>
        </div>
      </div>

      {/* 3. Reputation / Score */}
      <div className="mb-20">
        <h2 className="text-[14px] font-medium text-[#666] mb-6 border-b border-[#111] pb-2">Reputation</h2>
        
        <MagicCard className="rounded-xl w-full">
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-[#666] text-[13px] font-medium mb-1">Community Score</p>
              <div className="flex items-end gap-2">
                <span className="text-[32px] font-semibold tracking-tighter leading-none text-white">340</span>
                <span className="text-[#888] text-[14px] mb-0.5 tracking-tight">points</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center mb-2">
                <TrendingUp size={16} className="text-[#eee]" />
              </div>
              <span className="text-[#eee] text-[14px] font-medium tracking-tight">Level 4</span>
            </div>
          </div>
        </MagicCard>
      </div>

      {/* 4. Achievements */}
      <div className="mb-8">
        <h2 className="text-[14px] font-medium text-[#666] mb-6 border-b border-[#111] pb-2">Achievements</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Award size={14} className="text-amber-500" />
            </div>
            <p className="text-[#eee] text-[15px] font-medium tracking-tight">Civic Hero</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 size={14} className="text-emerald-500" />
            </div>
            <p className="text-[#eee] text-[15px] font-medium tracking-tight">Trusted Verifier</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Medal size={14} className="text-slate-800" />
            </div>
            <p className="text-[#eee] text-[15px] font-medium tracking-tight">Active Contributor</p>
          </div>
        </div>
      </div>

    </div>
  );
}
