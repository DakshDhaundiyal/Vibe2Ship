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
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) *
    Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [pendingReports, setPendingReports] = useState<(Report & { distance?: number })[]>([]);
  const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);

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
    <div className="p-5 pt-12 pb-32 min-h-screen text-[#ededed] selection:bg-sky-500/30 font-sans" style={{ maxWidth: 500, margin: '0 auto', backgroundColor: '#000' }}>

      {/* 1. Welcome Header (Full Width) */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <p className="text-[#888] font-medium text-[13px] tracking-wide uppercase mb-1">Welcome back</p>
          <h1 className="text-[32px] font-bold tracking-tight leading-none text-white">Daksh</h1>
        </div>
        <div className="w-10 h-10 rounded-full bento-glass flex items-center justify-center overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Daksh&backgroundColor=b6e3f4" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* 2. Action Bento Grid (2x2) */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Big Report Button */}
        <button
          onClick={() => navigate('/report')}
          className="bento-glass p-5 flex flex-col items-start justify-between h-[160px] relative overflow-hidden group col-span-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-indigo-500/5 group-hover:opacity-100 opacity-80 transition-opacity"></div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30 z-10">
            <Camera size={22} className="text-sky-400" />
          </div>
          <div className="z-10 text-left">
            <p className="text-white font-semibold text-[17px] tracking-tight">New Report</p>
            <p className="text-sky-400/80 text-[12px] font-medium mt-0.5">Earn +50 XP</p>
          </div>
        </button>

        <div className="grid grid-rows-2 gap-3 col-span-1 h-[160px]">
          {/* Mini Stats Rectangle */}
          <button
            onClick={() => navigate('/activity')}
            className="bento-glass-sm p-4 flex flex-col justify-center relative overflow-hidden group h-full"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
            <div className="flex items-center justify-between z-10 w-full mb-1">
              <span className="text-[#888] text-[12px] font-medium uppercase tracking-wider">Resolved</span>
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <p className="text-white text-[24px] font-bold tracking-tighter leading-none z-10">24 <span className="text-[#666] text-[14px] font-normal tracking-normal">this mo.</span></p>
          </button>

          {/* Location Rectangle */}
          <div className="bento-glass-sm p-4 flex flex-col justify-center relative overflow-hidden h-full">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={12} className="text-[#888]" />
              <span className="text-[#888] text-[11px] font-medium uppercase tracking-wider">Location</span>
            </div>
            <p className="text-white text-[14px] font-medium tracking-tight truncate">
              Sector 43, Gurgaon
            </p>
          </div>
        </div>
      </div>

      {/* 3. Map Widget */}
      <MagicCard className="w-full mb-6 rounded-[28px]">
        <button
          onClick={() => navigate('/map')}
          className="bento-glass w-full h-[140px] p-4 relative overflow-hidden group flex flex-col justify-end"
        >
          <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity bg-[url('https://maps.geoapify.com/v1/staticmap?style=dark-matter&width=600&height=300&center=lonlat:77.0266,28.4595&zoom=14&apiKey=556c4bd3f45749dfb3252a129d2bfebc')] bg-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

          <div className="relative z-10 flex justify-between items-end w-full">
            <div className="text-left">
              <h3 className="text-white font-semibold text-[17px] tracking-tight">Interactive Map</h3>
              <p className="text-[#aaa] text-[13px]">12 active issues nearby</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <MapPin size={14} className="text-white" />
            </div>
          </div>
        </button>
      </MagicCard>

      {/* 4. Verification Bento Carousel */}
      {pendingReports.length > 0 && (
        <div className="mb-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-white tracking-tight">Needs Verification</h2>
            <span className="text-[11px] text-amber-500 font-medium px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
              &lt;50m
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 snap-x hide-scrollbar">
            {pendingReports.map(report => (
              <div key={report.id} className="min-w-[240px] snap-start h-full">
                <div className="bento-glass-sm p-5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[16px]">
                        {CATEGORY_CONFIG[report.category]?.icon || '🚧'}
                      </div>
                      <span className="text-[#888] text-[12px] font-medium bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                        {report.distance ? Math.round(report.distance) : '?'}m
                      </span>
                    </div>

                    <p className="text-white font-semibold text-[15px] tracking-tight mb-1 leading-tight">
                      {report.category === 'other'
                        ? (report.ai_reasoning ? report.ai_reasoning.split('.')[0].slice(0, 35) + '…' : 'Civic Issue')
                        : CATEGORY_CONFIG[report.category]?.label}
                    </p>
                    <p className="text-[#666] text-[12px] mb-4 flex items-center gap-1">
                      <ShieldAlert size={12} className="text-sky-500" />
                      {report.ai_confidence}% AI Confidence
                    </p>
                  </div>

                  {(() => {
                    const dist = report.distance ?? Infinity;
                    const isClose = dist <= 50;
                    return (
                      <button
                        onClick={() => isClose && setVerifyReport(report)}
                        className={`w-full font-medium py-2.5 rounded-xl text-[13px] transition-colors border ${isClose
                            ? 'bg-white text-black border-transparent hover:bg-gray-200'
                            : 'bg-transparent border-white/10 text-[#555] cursor-not-allowed'
                          }`}
                        disabled={!isClose}
                      >
                        {isClose ? 'Verify Issue' : 'Too far to verify'}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Modal Overlay (Glassmorphism) */}
      {verifyReport && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-[500px] bento-glass rounded-b-none p-6 pb-12 animate-slide-up border-b-0 border-x-0">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold text-white tracking-tight">Verify Issue</h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X size={16} className="text-[#aaa]" />
              </button>
            </div>

            <div className="bento-glass-sm p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[20px]">
                  {CATEGORY_CONFIG[verifyReport.category]?.icon || '🚧'}
                </div>
                <div>
                  <p className="text-white font-semibold">{CATEGORY_CONFIG[verifyReport.category]?.label || 'Issue'}</p>
                  <p className="text-[#888] text-[13px]">{verifyReport.distance ? Math.round(verifyReport.distance) : '?'}m away</p>
                </div>
              </div>
            </div>

            <p className="text-[#ccc] text-[14px] mb-4 leading-relaxed">
              To verify this issue and earn <strong className="text-sky-400 font-semibold">10 XP</strong>, please upload a real-time photo showing the current status.
            </p>

            <div
              className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center mb-6 cursor-pointer hover:bg-white/5 transition-colors relative overflow-hidden bg-black/40"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                    <ImageIcon size={20} className="text-[#888]" />
                  </div>
                  <p className="text-[#eee] font-medium text-[14px]">Tap to take photo</p>
                  <p className="text-[#666] text-[12px] mt-1">Required for verification</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>
            <button
              onClick={handleSubmitVerification}
              disabled={confirming || !photoFile}
              className={`w-full py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all ${photoFile && !confirming
                  ? 'bg-white text-black hover:scale-[0.98]'
                  : 'bg-white/10 text-[#666] cursor-not-allowed'
                }`}
            >
              {confirming ? (
                <span className="w-5 h-5 border-2 border-[#666] border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Submit Verification
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
