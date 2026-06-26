import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, MapPin, Upload, AlertCircle, CheckCircle2, XCircle, RotateCcw, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { BACKEND_URL, CATEGORY_CONFIG, type AIResult, type DuplicateInfo, type Category, type Severity } from '../types'

// Loading messages for the submit flow
const LOADING_MESSAGES = [
  '📸 Analyzing your photo with AI...',
  '🔍 Identifying the civic issue...',
  '📍 Cross-referencing location data...',
  '🗺️ Checking for nearby reports...',
  '💾 Saving your report...',
  '✅ Almost done...'
]

// Client-side image compression (max 1600px, ~80% quality)
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX_PX = 1600
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) {
          height = Math.round((height / width) * MAX_PX)
          width = MAX_PX
        } else {
          width = Math.round((width / height) * MAX_PX)
          height = MAX_PX
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Compression failed'))
      }, 'image/jpeg', 0.82)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

type FlowStep = 'idle' | 'preview' | 'locating' | 'confirming' | 'submitting' | 'result' | 'error'

interface SubmitResult {
  report: Record<string, unknown>
  ai: AIResult
  duplicate: DuplicateInfo | null
}

export default function ReportPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<FlowStep>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [compressedFile, setCompressedFile] = useState<Blob | null>(null)
  const [originalFilename, setOriginalFilename] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | null>(null)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0])
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [geoError, setGeoError] = useState('')
  // Confidence-based UI state
  const [showAiOverride, setShowAiOverride] = useState(false)
  const [overrideCategory, setOverrideCategory] = useState<Category | ''>('')
  const [overrideSeverity, setOverrideSeverity] = useState<Severity | ''>('')

  // Manual location (simple lat/lng inputs as fallback)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [showManualLocation, setShowManualLocation] = useState(false)

  // Cycle loading messages
  useEffect(() => {
    if (step !== 'submitting') return
    const interval = setInterval(() => {
      setLoadingMsgIdx(i => {
        const next = Math.min(i + 1, LOADING_MESSAGES.length - 1)
        setLoadingMsg(LOADING_MESSAGES[next])
        return next
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [step])

  const handleFileSelect = useCallback(async (file: File) => {
    // 5MB client-side limit
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5MB. Please choose a smaller image.')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.')
      return
    }

    setOriginalFilename(file.name)

    // Compress
    let blob: Blob
    try {
      blob = await compressImage(file)
    } catch {
      blob = file // use original if compression fails
    }

    setCompressedFile(blob)
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
    setStep('locating')

    // Auto-capture geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude)
          setLng(pos.coords.longitude)
          setLocationSource('gps')
          setGeoError('')
          setStep('confirming')
        },
        (err) => {
          setGeoError(`GPS unavailable (${err.message}) — please enter location manually.`)
          setShowManualLocation(true)
          setStep('confirming')
        },
        { timeout: 8000, enableHighAccuracy: true }
      )
    } else {
      setGeoError('Geolocation not supported — please enter location manually.')
      setShowManualLocation(true)
      setStep('confirming')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleManualLocation = () => {
    const parsedLat = parseFloat(manualLat)
    const parsedLng = parseFloat(manualLng)
    if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
      toast.error('Please enter valid coordinates (lat: -90 to 90, lng: -180 to 180)')
      return
    }
    setLat(parsedLat)
    setLng(parsedLng)
    setLocationSource('manual')
    setGeoError('')
    setShowManualLocation(false)
  }

  const handleSubmit = async () => {
    if (!compressedFile || lat === null || lng === null) {
      toast.error('Please provide a photo and location.')
      return
    }

    setStep('submitting')
    setLoadingMsgIdx(0)
    setLoadingMsg(LOADING_MESSAGES[0])

    try {
      const formData = new FormData()
      formData.append('photo', compressedFile, originalFilename || 'photo.jpg')
      formData.append('latitude', String(lat))
      formData.append('longitude', String(lng))

      const response = await fetch(`${BACKEND_URL}/api/reports`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to submit report. Please try again.')
        setStep('error')
        return
      }

      // Apply any user overrides to the display (not re-submitted to AI)
      const finalAi = {
        ...data.ai,
        category: overrideCategory || data.ai.category,
        severity: overrideSeverity || data.ai.severity
      }

      setResult({ ...data, ai: finalAi })
      setStep('result')
    } catch (err) {
      console.error('[ReportPage] Submit error:', err)
      setErrorMsg('Network error — check your connection and try again.')
      setStep('error')
    }
  }

  const reset = () => {
    setStep('idle')
    setPreviewUrl(null)
    setCompressedFile(null)
    setOriginalFilename('')
    setLat(null)
    setLng(null)
    setLocationSource(null)
    setResult(null)
    setErrorMsg('')
    setGeoError('')
    setShowManualLocation(false)
    setManualLat('')
    setManualLng('')
    setShowAiOverride(false)
    setOverrideCategory('')
    setOverrideSeverity('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen px-4 py-6 flex flex-col items-center bg-black" style={{ maxWidth: 480, margin: '0 auto' }}>
      
      {/* ── IDLE: Upload Zone ── */}
      {step === 'idle' && (
        <div className="w-full flex-1 flex flex-col items-center justify-center fade-in">
          <div
            className="w-full aspect-[3/4] rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group"
            style={{ border: '2px dashed rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
            <div className="z-20 flex flex-col items-center gap-4 text-center p-6">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
                <Camera size={36} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-xl mb-1">Tap to capture</p>
                <p className="text-slate-400 text-sm font-medium">Take a clear photo of the issue.</p>
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]) }}
          />
        </div>
      )}

      {/* ── LOCATING & CONFIRMING ── */}
      {(step === 'locating' || step === 'confirming') && previewUrl && (
        <div className="w-full fade-in flex flex-col h-full">
          <div className="w-full aspect-square rounded-3xl overflow-hidden relative mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
              <MapPin size={14} className={lat ? 'text-emerald-400' : 'text-amber-400 animate-pulse'} />
              <span className="text-white text-xs font-bold uppercase tracking-wider">{lat ? 'Location Captured' : 'Locating...'}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end gap-3 pb-8">
            <button
              className="w-full bg-white text-black font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              disabled={!lat || !lng || step === 'locating'}
              onClick={handleSubmit}
            >
              🚀 SUBMIT REPORT
            </button>
            <button onClick={reset} className="w-full text-slate-500 font-bold uppercase tracking-widest text-xs py-3 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── SUBMITTING: Loading state ── */}
      {step === 'submitting' && (
        <div className="w-full flex-1 flex flex-col items-center justify-center gap-6 fade-in">
          <div className="w-24 h-24 relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
            <span className="text-3xl animate-pulse">✨</span>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-xl mb-2">{loadingMsg}</p>
            <p className="text-sky-400 text-xs font-bold tracking-widest uppercase">AI Analysis</p>
          </div>
        </div>
      )}

      {/* ── RESULT: Success screen ── */}
      {step === 'result' && result && (
        <div className="w-full slide-up">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 mb-6 text-center shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <AlertCircle size={48} className="text-amber-400 mx-auto mb-3" />
            <h2 className="text-white font-black text-2xl mb-1">Pending Verification</h2>
            <p className="text-amber-300/80 font-medium text-sm">Nearby citizens will now verify your report.</p>
          </div>

          <div className="glass-card p-6 rounded-3xl mb-6">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Category</span>
              <span className="text-white font-bold text-sm bg-white/10 px-3 py-1 rounded-full">{CATEGORY_CONFIG[result.ai.category]?.label || result.ai.category}</span>
            </div>
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Severity</span>
              <span className={`font-bold text-sm px-3 py-1 rounded-full ${result.ai.severity === 'high' ? 'bg-red-500/20 text-red-400' : result.ai.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {result.ai.severity.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Confidence</span>
              <span className="text-sky-400 font-bold text-sm">{result.ai.confidence}%</span>
            </div>
            <div className="flex flex-col mb-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Reason</span>
              <p className="text-slate-300 text-sm leading-relaxed">{result.ai.reasoning}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/map')} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-2xl transition-colors border border-white/10">
              View Map
            </button>
            <button onClick={reset} className="flex-1 bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 rounded-2xl transition-transform active:scale-95 shadow-[0_4px_20px_rgba(14,165,233,0.3)]">
              Report Again
            </button>
          </div>
        </div>
      )}

      {/* ── ERROR state ── */}
      {step === 'error' && (
        <div className="w-full flex-1 flex flex-col items-center justify-center fade-in">
          <div className="glass-card p-8 rounded-3xl text-center w-full" style={{ border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.05)' }}>
            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-white font-black text-xl mb-2">Submission Failed</h2>
            <p className="text-slate-400 text-sm mb-8">{errorMsg}</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => setStep('confirming')} className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-4 rounded-2xl transition-colors shadow-[0_4px_20px_rgba(239,68,68,0.3)]">
                Try Again
              </button>
              <button onClick={reset} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-colors border border-white/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
