import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { CATEGORY_CONFIG } from '../types'
import type { Report } from '../types'

export default function RealtimeFeed() {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    // Graceful degradation: if supabase isn't configured, skip silently
    const url = import.meta.env.VITE_SUPABASE_URL
    if (!url || url === 'https://placeholder.supabase.co') return

    try {
      const channel = supabase
        .channel('public:reports')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'reports' },
          (payload) => {
            try {
              const report = payload.new as Report
              const cfg = CATEGORY_CONFIG[report.category] || CATEGORY_CONFIG.other
              toast(
                `${cfg.emoji} New ${cfg.label} report nearby`,
                {
                  id: `report-${report.id}`,
                  duration: 4000,
                  style: {
                    background: '#111827',
                    color: '#e2e8f0',
                    border: `1px solid ${cfg.color}40`,
                    borderRadius: '12px'
                  }
                }
              )
            } catch {
              // Silently swallow malformed payloads
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            // Silently degrade — don't show error to user
            console.warn('[Realtime] Channel error — realtime feed disabled')
          }
        })

      channelRef.current = channel
    } catch (err) {
      console.warn('[Realtime] Failed to subscribe:', err)
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(() => {})
      }
    }
  }, [])

  return null // No UI — uses toast system
}
