import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, CheckCircle2, TrendingUp, ShieldAlert, Camera, X, ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CATEGORY_CONFIG, BACKEND_URL, type Report } from '../types';
import MagicCard from '../components/MagicCard';
import toast from 'react-hot-toast';

// Simple haversine formula for demo
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [pendingReports, setPendingReports] = useState<(Report & { distance?: number })[]>([]);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  // Verification modal state
  const [verifyReport, setVerifyReport] = useState<(Report & { distance?: number }) | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeModal = () => {
    setVerifyReport(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitVerification = async () => {
    if (!verifyReport || !photoFile) {
      toast.error('Please attach a photo first');
      return;
    }
    setConfirming(true);
    try {
      const demoUserId = localStorage.getItem('demoUserId') || (() => {
        const id = crypto.randomUUID();
        localStorage.setItem('demoUserId', id);
        return id;
      })();

      const formData = new FormData();
      formData.append('confirmerId', demoUserId);
      formData.append('isPositive', 'true');
      if (userLoc) {
        formData.append('userLat', String(userLoc.lat));
        formData.append('userLng', String(userLoc.lng));
      }
      formData.append('photo', photoFile);

      const res = await fetch(`${BACKEND_URL}/api/reports/${verifyReport.id}/confirm`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Verification failed');
        return;
      }

      toast.success('✅ Issue verified! Thank you for your contribution.');
      closeModal();
    } catch {
      toast.error('Network error — could not verify');
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLoc({ lat: 28.4595, lng: 77.0266 }) // Fallback Gurgaon
      );
    } else {
      setUserLoc({ lat: 28.4595, lng: 77.0266 });
    }
  }, []);

  useEffect(() => {
    async function fetchPending() {
      const { data } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'reported');
      
      if (data && userLoc) {
        const VALID_CATEGORIES = ['pothole', 'garbage', 'water_leak', 'fallen_tree', 'broken_sidewalk'];
        const withDistance = data
          .filter(r => VALID_CATEGORIES.includes(r.category))
          .map(r => ({
            ...r,
            distance: getDistanceMeters(userLoc.lat, userLoc.lng, r.latitude, r.longitude)
          }))
          .filter(r => r.distance !== undefined && r.distance <= 500)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setPendingReports(withDistance.slice(0, 3)); // show top 3 closest
      }
    }
    if (userLoc) fetchPending();
  }, [userLoc]);

  return (
    <div className="p-6 pt-12 pb-32 min-h-screen text-[#ededed] selection:bg-sky-500/30" style={{ maxWidth: 500, margin: '0 auto', backgroundColor: '#000' }}>
      
      {/* 1. Greeting Card (No borders, massive text) */}
      <div className="mb-20 mt-4">
        <h1 className="text-[32px] font-semibold tracking-tighter mb-1 text-white">Hello Daksh</h1>
        <p className="text-[#888] font-medium text-[15px] tracking-tight">Making cities better together.</p>
      </div>

      {/* 2. AI Insight Card (Wide, flat) */}
      <MagicCard className="mb-20 rounded-xl w-full">
        <div className="bg-[#111] border border-[#222] p-5 rounded-xl flex gap-4 items-start">
          <TrendingUp size={16} className="text-[#666] mt-0.5 shrink-0" />
          <p className="text-[#ccc] text-[14px] leading-snug tracking-tight">
            AI detected increasing <span className="text-white font-medium">pothole complaints</span> in <span className="text-white font-medium">Cyber City</span> over the last 48 hours.
          </p>
        </div>
      </MagicCard>

      {/* 3. Nearby Issues Preview (Textual list, tight icons) */}
      <div className="mb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[17px] font-semibold text-white tracking-tight">Nearby Issues</h2>
          <span className="text-[12px] font-medium text-[#555] bg-[#111] border border-[#222] px-2 py-0.5 rounded-md">500m radius</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5"></div>
            <div className="flex-1 flex justify-between items-center">
              <p className="text-[#eee] text-[15px] font-medium tracking-tight">Large pothole</p>
              <p className="text-[#666] text-[13px]">120m</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5"></div>
            <div className="flex-1 flex justify-between items-center">
              <p className="text-[#eee] text-[15px] font-medium tracking-tight">Garbage overflow</p>
              <p className="text-[#666] text-[13px]">200m</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => navigate('/map')}
          className="mt-6 w-full bg-[#111] hover:bg-[#1a1a1a] text-[#888] font-medium py-3 rounded-lg text-[14px] transition-colors border border-[#222]"
        >
          Open Full Map
        </button>
      </div>

      {/* 4. Needs Verification (Horizontal scroll snap) */}
      {pendingReports.length > 0 && (
        <div className="mb-20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShieldAlert size={15} className="text-amber-400" />
              <h2 className="text-[17px] font-semibold text-white tracking-tight">Needs Verification</h2>
            </div>
            <span className="text-[11px] text-amber-500/70 font-medium px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">Must be &lt;50m</span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 snap-x hide-scrollbar">
            {pendingReports.map(report => (
              <MagicCard key={report.id} className="min-w-[260px] snap-start rounded-xl h-full">
                <div className="bg-[#111] border border-[#222] rounded-xl p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-white font-medium text-[15px] tracking-tight">
                        {report.category === 'other'
                          ? (report.ai_reasoning
                              ? report.ai_reasoning.split('.')[0].slice(0, 40) + (report.ai_reasoning.length > 40 ? '…' : '')
                              : 'Civic Issue')
                          : CATEGORY_CONFIG[report.category]?.label}
                      </p>
                      <span className="text-[#888] text-[12px]">{report.distance ? Math.round(report.distance) : '?'}m</span>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-[#666]">Reported by</span>
                        <span className="text-[#ccc]">{report.confirmation_count || 1} citizen</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-[#666]">AI Confidence</span>
                        <span className="text-sky-400 font-medium">{report.ai_confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const dist = report.distance ?? Infinity;
                    const isClose = dist <= 50;
                    return (
                      <button 
                        onClick={() => isClose && setVerifyReport(report)}
                        className={`w-full font-medium py-2.5 rounded-lg text-[13px] transition-colors ${
                          isClose 
                            ? 'bg-[#222] hover:bg-[#333] text-white' 
                            : 'bg-transparent border border-[#222] text-[#555] cursor-not-allowed'
                        }`}
                        disabled={!isClose}
                      >
                        {isClose ? 'Verify Issue' : 'Get closer to verify (<50m)'}
                      </button>
                    );
                  })()}
                </div>
              </MagicCard>
            ))}
          </div>
        </div>
      )}

      {/* Verification Modal Overlay */}
      {verifyReport && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-[500px] rounded-t-3xl p-6 pb-10"
            style={{ background: 'rgba(15,15,15,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full bg-[#333] mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-white font-semibold text-[18px] tracking-tight">Authenticity Check</h3>
                <p className="text-[#555] text-[13px] mt-0.5">{CATEGORY_CONFIG[verifyReport.category]?.label} · {verifyReport.distance ? Math.round(verifyReport.distance) : '?'}m away</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#666] hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <p className="text-[#666] text-[13px] mb-6 leading-relaxed">
              Take a live photo of the issue right now to confirm it exists. Our AI will analyse the image to ensure authenticity.
            </p>

            {/* Photo Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer mb-6 transition-all relative overflow-hidden"
              style={{ borderColor: photoPreview ? 'transparent' : 'rgba(255,255,255,0.1)', background: photoPreview ? 'transparent' : 'rgba(255,255,255,0.02)' }}
            >
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-[13px] font-medium">Tap to change</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-3">
                    <Camera size={20} className="text-[#666]" />
                  </div>
                  <p className="text-[#888] text-[14px] font-medium">Tap to take photo</p>
                  <p className="text-[#444] text-[12px] mt-1">Opens your camera</p>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 bg-[#111] border border-[#222] hover:bg-[#1a1a1a] text-[#888] font-medium py-3.5 rounded-xl text-[14px] transition-colors"
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitVerification}
                disabled={confirming || !photoFile}
                className="flex-1 font-semibold py-3.5 rounded-xl text-[14px] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: photoFile ? 'rgba(245,158,11,1)' : 'rgba(245,158,11,0.3)', color: photoFile ? '#1a0a00' : '#888' }}
              >
                {confirming
                  ? <div className="w-4 h-4 rounded-full border-2 border-amber-950/30 border-t-amber-950 animate-spin" />
                  : 'Submit & Verify'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Recent Government Actions */}
      <div className="mb-8">
        <h2 className="text-[17px] font-semibold text-white tracking-tight mb-6">Recent Actions</h2>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 size={14} className="text-[#444] mt-0.5 shrink-0" />
            <div>
              <p className="text-[#eee] text-[15px] tracking-tight leading-snug">Garbage cleared near Cyber Hub</p>
              <p className="text-[#666] text-[13px] mt-1">Verified 2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <CheckCircle2 size={14} className="text-[#444] mt-0.5 shrink-0" />
            <div>
              <p className="text-[#eee] text-[15px] tracking-tight leading-snug">Road repaired near IFFCO Chowk</p>
              <p className="text-[#666] text-[13px] mt-1">Verified yesterday</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <CheckCircle2 size={14} className="text-[#444] mt-0.5 shrink-0" />
            <div>
              <p className="text-[#eee] text-[15px] tracking-tight leading-snug">Pipeline fixed near HUDA Metro</p>
              <p className="text-[#666] text-[13px] mt-1">Verified 2 days ago</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
