import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, Zap, RefreshCw } from 'lucide-react'
import { BACKEND_URL, CATEGORY_CONFIG, STATUS_CONFIG } from '../types'

interface Stats {
  total: number
  resolved: number
  pending: number
  by_category: Array<{ category: string; count: number }>
  by_status: Array<{ status: string; count: number }>
  avg_resolution_hours: number | null
  high_severity_pending: number
  recent_7d: Array<{ day: string; reports_filed: number; resolved: number }>
}

interface Insight {
  insight: string
  type: string
  data: Record<string, unknown>
}

const STATUS_COLORS: Record<string, string> = {
  reported: '#94a3b8',
  verified: '#38bdf8',
  assigned: '#a78bfa',
  in_progress: '#fbbf24',
  resolved: '#34d399'
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>{value}</p>
        <p className="text-slate-400 text-xs font-medium">{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [insight, setInsight] = useState<Insight | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [statsRes, insightRes] = await Promise.allSettled([
        fetch(`${BACKEND_URL}/api/reports/stats`),
        fetch(`${BACKEND_URL}/api/insights`)
      ])

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        setStats(await statsRes.value.json())
      }
      if (insightRes.status === 'fulfilled' && insightRes.value.ok) {
        setInsight(await insightRes.value.json())
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.')
      console.error('[Dashboard] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Prepare chart data
  const categoryData = stats?.by_category?.map(d => ({
    name: CATEGORY_CONFIG[d.category]?.label || d.category,
    emoji: CATEGORY_CONFIG[d.category]?.emoji || '📋',
    count: d.count,
    color: CATEGORY_CONFIG[d.category]?.color || '#94a3b8'
  })) || []

  const statusData = stats?.by_status?.map(d => ({
    name: STATUS_CONFIG[d.status as keyof typeof STATUS_CONFIG]?.label || d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] || '#94a3b8'
  })) || []

  const trend7d = stats?.recent_7d?.map(d => ({
    day: new Date(d.day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    reported: d.reports_filed,
    resolved: d.resolved
  })) || []

  const resolutionRate = stats ? Math.round((stats.resolved / Math.max(stats.total, 1)) * 100) : 0

  const insightIconColor = insight?.type === 'warning' ? '#f87171'
    : insight?.type === 'success' ? '#34d399'
    : insight?.type === 'cluster' ? '#a78bfa'
    : '#38bdf8'

  return (
    <div className="min-h-screen px-4 py-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Impact Dashboard</h1>
          <p className="text-slate-400 text-sm">Community issue tracking & trends</p>
        </div>
        <button
          id="refresh-dashboard-btn"
          onClick={fetchData}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-white/5"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="glass-card p-4 mb-6 flex items-center gap-3"
          style={{ border: '1px solid rgba(248,113,113,0.3)' }}>
          <AlertTriangle size={16} style={{ color: '#f87171' }} />
          <span className="text-red-300 text-sm">{error}</span>
          <button onClick={fetchData} className="ml-auto text-sky-400 text-xs">Retry</button>
        </div>
      )}

      {/* Predictive Insight Card */}
      {insight && (
        <div className="glass-card p-4 mb-6 fade-in"
          style={{ border: `1px solid ${insightIconColor}30`, background: `${insightIconColor}08` }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${insightIconColor}20`, border: `1px solid ${insightIconColor}40` }}>
              <Zap size={18} style={{ color: insightIconColor }} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: insightIconColor }}>
                AI Insight
              </p>
              <p className="text-slate-200 text-sm leading-relaxed">{insight.insight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-4 h-20 shimmer" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3 mb-6 fade-in">
          <StatCard label="Total Reports" value={stats.total} icon={TrendingUp} color="#38bdf8" />
          <StatCard
            label="Resolved"
            value={stats.resolved}
            sub={`${resolutionRate}% resolution rate`}
            icon={CheckCircle2}
            color="#34d399"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            sub={stats.high_severity_pending > 0 ? `${stats.high_severity_pending} high severity` : undefined}
            icon={Clock}
            color="#fbbf24"
          />
          <StatCard
            label="Avg Resolution"
            value={stats.avg_resolution_hours != null ? `${stats.avg_resolution_hours}h` : 'N/A'}
            sub="from report to resolve"
            icon={Zap}
            color="#a78bfa"
          />
        </div>
      ) : null}

      {/* Issues by Category (Bar Chart) */}
      {categoryData.length > 0 && (
        <div className="glass-card p-4 mb-4 fade-in">
          <h2 className="text-slate-300 font-semibold text-sm mb-4">Issues by Category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="emoji"
                tick={{ fill: '#94a3b8', fontSize: 16 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, color: '#e2e8f0' }}
                formatter={(value, _, props) => [value, props.payload.name]}
                labelFormatter={() => ''}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Two-column: Status Pie + 7-day Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Status Breakdown */}
        {statusData.length > 0 && (
          <div className="glass-card p-4 fade-in">
            <h2 className="text-slate-300 font-semibold text-sm mb-4">Status Breakdown</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.9} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, color: '#e2e8f0' }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 7-day Trend */}
        {trend7d.length > 0 && (
          <div className="glass-card p-4 fade-in">
            <h2 className="text-slate-300 font-semibold text-sm mb-4">7-Day Activity</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trend7d} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, color: '#e2e8f0' }}
                />
                <Line type="monotone" dataKey="reported" stroke="#38bdf8" strokeWidth={2} dot={{ fill: '#38bdf8', r: 3 }} name="Reported" />
                <Line type="monotone" dataKey="resolved" stroke="#34d399" strokeWidth={2} dot={{ fill: '#34d399', r: 3 }} name="Resolved" />
                <Legend formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!loading && !error && (!stats || stats.total === 0) && (
        <div className="glass-card p-8 text-center fade-in">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-slate-300 font-semibold mb-1">No data yet</p>
          <p className="text-slate-500 text-sm">Submit some reports to see the dashboard come alive</p>
        </div>
      )}
    </div>
  )
}
