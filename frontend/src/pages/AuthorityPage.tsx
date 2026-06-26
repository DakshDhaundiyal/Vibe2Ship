import { useEffect, useState, useCallback } from 'react'
import { Shield, ChevronRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import StatusStepper from '../components/StatusStepper'
import { BACKEND_URL, CATEGORY_CONFIG, STATUS_CONFIG, STATUS_ORDER, type Report, type ReportStatus } from '../types'

export default function AuthorityPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports?limit=100`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setReports(data.reports || [])
    } catch (err) {
      setError('Could not load reports. Check your connection.')
      console.error('[Authority] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReports() }, [fetchReports])

  const advanceStatus = async (reportId: string, currentStatus: ReportStatus) => {
    const currentIdx = STATUS_ORDER.indexOf(currentStatus)
    if (currentIdx >= STATUS_ORDER.length - 1) {
      toast('Already at final status (Resolved)', { icon: '✅' })
      return
    }
    const nextStatus = STATUS_ORDER[currentIdx + 1]
    setUpdatingId(reportId)
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Update failed')
        return
      }
      toast.success(`Status → ${STATUS_CONFIG[nextStatus].label}`)
      setReports(rs => rs.map(r => r.id === reportId ? { ...r, status: nextStatus } : r))
    } catch {
      toast.error('Network error — update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const setStatus = async (reportId: string, status: ReportStatus) => {
    setUpdatingId(reportId)
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Update failed')
        return
      }
      toast.success(`Status → ${STATUS_CONFIG[status].label}`)
      setReports(rs => rs.map(r => r.id === reportId ? { ...r, status } : r))
    } catch {
      toast.error('Network error — update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredReports = reports.filter(r => {
    if (filter === 'active') return r.status !== 'resolved'
    if (filter === 'resolved') return r.status === 'resolved'
    return true
  }).sort((a, b) => {
    // Sort: high severity first, then by date
    const sevMap = { high: 0, medium: 1, low: 2 }
    if (sevMap[a.severity] !== sevMap[b.severity]) return sevMap[a.severity] - sevMap[b.severity]
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const pendingCount = reports.filter(r => r.status !== 'resolved').length
  const resolvedCount = reports.filter(r => r.status === 'resolved').length

  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2 fade-in">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}>
          <Shield size={20} style={{ color: '#a78bfa' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#a78bfa', fontFamily: 'Space Grotesk' }}>Authority View</h1>
          <p className="text-slate-500 text-xs">Manage and advance report statuses</p>
        </div>
        <button
          id="authority-refresh-btn"
          onClick={fetchReports}
          className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          disabled={loading}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Demo notice */}
      <div className="glass-card p-3 mb-4 flex items-center gap-2"
        style={{ border: '1px solid rgba(167,139,250,0.2)', background: 'rgba(167,139,250,0.05)' }}>
        <AlertCircle size={13} style={{ color: '#a78bfa' }} />
        <p className="text-slate-400 text-xs">Demo mode — no auth required. Status changes are real and permanent.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-white">{reports.length}</p>
          <p className="text-slate-500 text-xs">Total</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold" style={{ color: '#fbbf24' }}>{pendingCount}</p>
          <p className="text-slate-500 text-xs">Pending</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold" style={{ color: '#34d399' }}>{resolvedCount}</p>
          <p className="text-slate-500 text-xs">Resolved</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['active', 'all', 'resolved'] as const).map(f => (
          <button
            key={f}
            id={`filter-${f}-btn`}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize"
            style={{
              background: filter === f ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
              color: filter === f ? '#a78bfa' : '#94a3b8',
              border: `1px solid ${filter === f ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.05)'}`
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-card p-4 mb-4 flex items-center gap-3"
          style={{ border: '1px solid rgba(248,113,113,0.3)' }}>
          <AlertCircle size={16} style={{ color: '#f87171' }} />
          <span className="text-red-300 text-sm">{error}</span>
          <button onClick={fetchReports} className="ml-auto text-sky-400 text-xs">Retry</button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-4 h-36 shimmer" />
          ))}
        </div>
      )}

      {/* Report list */}
      {!loading && filteredReports.length === 0 && (
        <div className="glass-card p-8 text-center fade-in">
          <CheckCircle2 size={40} style={{ color: '#34d399', margin: '0 auto 12px' }} />
          <p className="text-slate-300 font-semibold">No {filter !== 'all' ? filter : ''} reports</p>
          <p className="text-slate-500 text-sm mt-1">
            {filter === 'active' ? "All clear — every report is resolved!" : "Nothing here yet."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filteredReports.map(report => {
          const cfg = CATEGORY_CONFIG[report.category] || CATEGORY_CONFIG.other
          const isResolved = report.status === 'resolved'
          const isUpdating = updatingId === report.id

          return (
            <div key={report.id} className="glass-card p-4 fade-in transition-all hover:border-violet-500/20"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Report header */}
              <div className="flex items-start gap-3 mb-3">
                {/* Photo thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                  <img
                    src={report.photo_url}
                    alt="Issue"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="category-badge" style={{ background: cfg.bgColor, color: cfg.color, fontSize: 11 }}>
                      {cfg.emoji} {cfg.label}
                    </span>
                    <span className={`severity-dot ${report.severity}`} />
                    <span className="text-xs capitalize text-slate-400">{report.severity}</span>
                    {report.ai_confidence < 50 && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontSize: 10 }}>
                        Low confidence
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2">{report.ai_reasoning}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-slate-500 text-xs">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-slate-500 text-xs">
                      👥 {report.confirmation_count} confirmations
                    </span>
                  </div>
                </div>
              </div>

              {/* Status stepper (compact) */}
              <div className="mb-3 px-1">
                <StatusStepper currentStatus={report.status} compact />
              </div>

              {/* Status selector + advance button */}
              <div className="flex gap-2 items-center">
                <select
                  id={`status-select-${report.id}`}
                  value={report.status}
                  onChange={e => setStatus(report.id, e.target.value as ReportStatus)}
                  disabled={isUpdating}
                  className="flex-1 text-xs py-2 px-3 rounded-xl outline-none cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: STATUS_CONFIG[report.status]?.color || '#94a3b8'
                  }}
                >
                  {STATUS_ORDER.map(s => (
                    <option key={s} value={s} style={{ background: '#111827', color: STATUS_CONFIG[s].color }}>
                      {STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>

                {!isResolved && (
                  <button
                    id={`advance-status-${report.id}`}
                    onClick={() => advanceStatus(report.id, report.status)}
                    disabled={isUpdating || isResolved}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}
                  >
                    {isUpdating ? (
                      <div className="w-3 h-3 rounded-full border-2 border-violet-400/30 border-t-violet-400 animate-spin" />
                    ) : (
                      <>
                        <span>Advance</span>
                        <ChevronRight size={12} />
                      </>
                    )}
                  </button>
                )}

                {isResolved && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                    <CheckCircle2 size={12} />
                    Resolved
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
