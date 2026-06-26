// Shared types for Community Hero

export type Category =
  | 'pothole'
  | 'garbage'
  | 'water_leak'
  | 'fallen_tree'
  | 'broken_sidewalk'
  | 'other'
  | 'invalid'

export type Severity = 'low' | 'medium' | 'high'

export type ReportStatus =
  | 'pending_verification'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'suspicious'

export interface Report {
  id: string
  created_at: string
  reporter_id: string | null
  photo_url: string
  location?: unknown
  latitude: number
  longitude: number
  category: Category
  severity: Severity
  ai_confidence: number
  ai_reasoning: string
  trust_score: number
  status: ReportStatus
  duplicate_of: string | null
  confirmation_count: number
  positive_confirmations: number
  negative_confirmations: number
  resolved_at: string | null
}

export interface StatusHistory {
  id: string
  report_id: string
  old_status: ReportStatus | null
  new_status: ReportStatus
  changed_at: string
}

export interface AIResult {
  category: Category
  severity: Severity
  confidence: number
  reasoning: string
  safety_risk: string
  usedFallback?: boolean
}

export interface DuplicateInfo {
  merged: boolean
  primaryReportId: string
  distanceMeters: number
  newConfirmationCount: number
  message: string
}

export const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string; bgColor: string }> = {
  pothole: { label: 'Pothole', emoji: '🕳️', color: '#f87171', bgColor: 'rgba(248,113,113,0.15)' },
  garbage: { label: 'Garbage', emoji: '🗑️', color: '#a78bfa', bgColor: 'rgba(167,139,250,0.15)' },
  water_leak: { label: 'Water Leak', emoji: '💧', color: '#38bdf8', bgColor: 'rgba(56,189,248,0.15)' },
  fallen_tree: { label: 'Fallen Tree', emoji: '🌳', color: '#34d399', bgColor: 'rgba(52,211,153,0.15)' },
  broken_sidewalk: { label: 'Broken Sidewalk', emoji: '🚶', color: '#fb923c', bgColor: 'rgba(251,146,60,0.15)' },
  other: { label: 'Other', emoji: '⚠️', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.15)' },
  invalid: { label: 'Invalid', emoji: '❌', color: '#6b7280', bgColor: 'rgba(107,114,128,0.15)' },
}

export const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string }> = {
  pending_verification: { label: 'Needs Verification', color: '#f59e0b' },
  verified: { label: 'Verified', color: '#38bdf8' },
  assigned: { label: 'Assigned', color: '#a78bfa' },
  in_progress: { label: 'In Progress', color: '#fbbf24' },
  resolved: { label: 'Resolved', color: '#34d399' },
  suspicious: { label: 'Suspicious', color: '#ef4444' },
}

export const STATUS_ORDER: ReportStatus[] = [
  'pending_verification', 'verified', 'assigned', 'in_progress', 'resolved', 'suspicious'
]

// If we are in production, the frontend and backend are on the same domain (Node serves React)
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
