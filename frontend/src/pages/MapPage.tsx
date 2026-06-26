import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X, ThumbsUp, AlertCircle, CheckCircle2, Clock, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import StatusStepper from '../components/StatusStepper'
import { BACKEND_URL, CATEGORY_CONFIG, STATUS_CONFIG, type Report, type StatusHistory } from '../types'

// Fix Leaflet default icon issue with Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Create custom colored markers
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

function createCategoryIcon(category: string, severity: string): L.DivIcon {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other
  const size = severity === 'high' ? 38 : severity === 'medium' ? 32 : 26
  const pulse = severity === 'high'

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${cfg.color}22;
        border:2.5px solid ${cfg.color};
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:${size * 0.45}px;
        box-shadow:0 0 ${severity === 'high' ? '14px' : '8px'} ${cfg.color}60;
        ${pulse ? `animation:pulse-glow 2s infinite;` : ''}
        cursor:pointer;
        transition:transform 0.15s;
      ">${cfg.emoji}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)]
  })
}

// Fly-to-bounds controller
function MapController({ reports }: { reports: Report[] }) {
  const map = useMap()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current || reports.length === 0) return
    initialized.current = true
    const bounds = L.latLngBounds(
      reports
        .filter(r => r.latitude && r.longitude)
        .map(r => [r.latitude, r.longitude] as [number, number])
    )
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 })
    }
  }, [reports, map])

  return null
}

interface DetailState {
  report: Report
  history: StatusHistory[]
  loading: boolean
}

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<DetailState | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [confirming, setConfirming] = useState(false)
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null)
  
  // Verification flow state
  const [showUploadPrompt, setShowUploadPrompt] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset upload state when detail changes
  useEffect(() => {
    setShowUploadPrompt(false)
    setPhotoFile(null)
    setPhotoPreview(null)
  }, [detail?.report?.id])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLoc({ lat: 28.4595, lng: 77.0266 })
      );
    } else {
      setUserLoc({ lat: 28.4595, lng: 77.0266 });
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (filterCategory !== 'all') params.set('category', filterCategory)
      if (filterStatus !== 'all') params.set('status', filterStatus)

      const res = await fetch(`${BACKEND_URL}/api/reports?${params}`)
      if (!res.ok) throw new Error('Failed to fetch reports')
      const data = await res.json()
      setReports(data.reports || [])
    } catch (err) {
      setError('Could not load reports. Check your connection.')
      console.error('[MapPage] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus])

  useEffect(() => { fetchReports() }, [fetchReports])

  const fetchDetail = async (reportId: string) => {
    setDetail({ report: reports.find(r => r.id === reportId)!, history: [], loading: true })
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/${reportId}`)
      const data = await res.json()
      setDetail({ report: data.report, history: data.statusHistory || [], loading: false })
    } catch {
      setDetail(d => d ? { ...d, loading: false } : null)
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
    }
  }

  const handleConfirm = async () => {
    if (!detail) return
    if (!photoFile) {
      toast.error('Please attach a photo to verify authenticity')
      return
    }

    setConfirming(true)
    try {
      // Use a demo user ID for anonymous confirmations
      const demoUserId = localStorage.getItem('demoUserId') || (() => {
        const id = crypto.randomUUID()
        localStorage.setItem('demoUserId', id)
        return id
      })()

      const formData = new FormData()
      formData.append('confirmerId', demoUserId)
      formData.append('isPositive', 'true')
      if (userLoc) {
        formData.append('userLat', String(userLoc.lat))
        formData.append('userLng', String(userLoc.lng))
      }
      formData.append('photo', photoFile)

      const res = await fetch(`${BACKEND_URL}/api/reports/${detail.report.id}/confirm`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Could not add confirmation')
        return
      }
      toast.success(`✅ Confirmed! ${data.newConfirmationCount} people have reported this`)
      // Refresh detail
      fetchDetail(detail.report.id)
      fetchReports()
    } catch {
      toast.error('Network error — could not confirm')
    } finally {
      setConfirming(false)
      setShowUploadPrompt(false)
      setPhotoFile(null)
      setPhotoPreview(null)
    }
  }


  const filteredReports = reports.filter(r => r.latitude && r.longitude && !r.duplicate_of)


  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 56px - 64px)' }}>
      {/* Top Floating Filters & Stats */}
      <div className="absolute top-0 left-0 right-0 z-[400] flex flex-col gap-2 p-3 pointer-events-none">
        
        {/* Statistics Bar */}
        <div className="glass-card flex items-center justify-between px-4 py-3 rounded-2xl pointer-events-auto" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(10,15,30,0.85)' }}>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Open Issues</span>
            <span className="text-white font-black text-lg">{filteredReports.length}</span>
          </div>
          <div className="h-8 w-[1px] bg-white/10 mx-4"></div>
          <div className="flex flex-col text-right">
            <span className="text-red-400 text-[10px] font-bold uppercase tracking-wider">Critical</span>
            <span className="text-red-400 font-black text-lg">{filteredReports.filter(r => r.severity === 'high').length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar pointer-events-auto">
          <button 
            onClick={() => setFilterCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${filterCategory === 'all' ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)]' : 'bg-slate-800/80 text-slate-300 border border-slate-700 backdrop-blur-md hover:bg-slate-700'}`}
          >
            All
          </button>
          {Object.entries(CATEGORY_CONFIG).filter(([k]) => k !== 'invalid' && k !== 'other').map(([k, v]) => (
            <button 
              key={k}
              onClick={() => setFilterCategory(k)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${filterCategory === k ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)]' : 'bg-slate-800/80 text-slate-300 border border-slate-700 backdrop-blur-md hover:bg-slate-700'}`}
            >
              <span>{v.emoji}</span> {v.label}
            </button>
          ))}
        </div>

      </div>

      {/* Error banner */}
      {error && (
        <div className="absolute top-16 left-3 right-3 z-[400] glass-card p-3 flex items-center gap-2"
          style={{ border: '1px solid rgba(248,113,113,0.3)' }}>
          <AlertCircle size={14} style={{ color: '#f87171' }} />
          <span className="text-red-300 text-sm">{error}</span>
          <button onClick={fetchReports} className="ml-auto text-sky-400 text-xs">Retry</button>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={[28.4595, 77.0266]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController reports={filteredReports} />
        {filteredReports.map(report => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createCategoryIcon(report.category, report.severity)}
            eventHandlers={{ click: () => fetchDetail(report.id) }}
          >
            <Popup className="custom-popup" closeButton={false}>
              <div className="text-white text-sm font-medium p-1">
                {CATEGORY_CONFIG[report.category]?.emoji} {CATEGORY_CONFIG[report.category]?.label}
                <span className="ml-2 text-xs opacity-60 capitalize">{report.severity} severity</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Detail Panel */}
      {detail && (
        <div
          className="absolute bottom-4 left-4 right-4 z-[500] glass-card rounded-3xl slide-up"
          style={{
            maxHeight: '80vh',
            overflowY: 'auto',
            background: 'rgba(10,15,30,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setDetail(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10 z-20 bg-black/40"
            style={{ color: '#94a3b8' }}>
            <X size={18} />
          </button>

          <div className="p-5">
            {detail.loading ? (
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded shimmer" />
                  <div className="h-3 w-full rounded shimmer" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-800 border border-white/5">
                    {detail.report.photo_url ? (
                      <img
                        src={detail.report.photo_url}
                        alt="Report photo"
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={20} style={{ color: '#475569' }} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">
                      {CATEGORY_CONFIG[detail.report.category]?.label || 'Issue'}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${detail.report.severity === 'high' ? 'bg-red-500' : detail.report.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'}`}></span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${detail.report.severity === 'high' ? 'text-red-400' : detail.report.severity === 'medium' ? 'text-orange-400' : 'text-yellow-400'}`}>
                        {detail.report.severity} Severity
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs font-medium">
                      Reported by {detail.report.confirmation_count} users
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Status</span>
                  <span className="text-sky-400 text-sm font-bold capitalize">{detail.report.status.replace('_', ' ')}</span>
                </div>

                {detail.report.status !== 'resolved' && (() => {
                  const dist = userLoc && detail.report.latitude && detail.report.longitude 
                    ? getDistanceMeters(userLoc.lat, userLoc.lng, detail.report.latitude, detail.report.longitude) 
                    : Infinity;
                  const isClose = dist <= 50;
                  
                  if (!showUploadPrompt) {
                    return (
                      <button
                        className={`w-full font-bold py-3.5 rounded-2xl transition-transform flex items-center justify-center gap-2 mt-2 ${
                          isClose 
                            ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 active:scale-95 shadow-[0_4px_15px_rgba(245,158,11,0.3)]' 
                            : 'bg-white/10 text-slate-400 cursor-not-allowed'
                        }`}
                        onClick={() => setShowUploadPrompt(true)}
                        disabled={confirming || !isClose}
                      >
                        {!isClose ? (
                          'Too far to verify (must be <50m)'
                        ) : (
                          'Verify Issue'
                        )}
                      </button>
                    );
                  }

                  // Photo upload prompt UI
                  return (
                    <div className="mt-4 p-4 bg-black/40 border border-amber-500/30 rounded-2xl animate-in fade-in zoom-in duration-200">
                      <h4 className="text-amber-400 font-bold mb-1 text-sm">Authenticity Check</h4>
                      <p className="text-slate-400 text-xs mb-4">Please upload a photo of the area right now to prove the issue is real.</p>
                      
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex flex-col items-center justify-center cursor-pointer mb-3 relative overflow-hidden"
                      >
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <ImageIcon size={24} className="text-amber-500/70 mb-2" />
                            <span className="text-amber-500/70 text-xs font-bold uppercase tracking-wider">Tap to open camera</span>
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

                      <div className="flex gap-2">
                        <button
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                          onClick={() => setShowUploadPrompt(false)}
                          disabled={confirming}
                        >
                          Cancel
                        </button>
                        <button
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold py-3 rounded-xl transition-colors text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleConfirm}
                          disabled={confirming || !photoFile}
                        >
                          {confirming ? <div className="w-4 h-4 rounded-full border-2 border-amber-950/30 border-t-amber-950 animate-spin" /> : 'Submit Photo'}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
