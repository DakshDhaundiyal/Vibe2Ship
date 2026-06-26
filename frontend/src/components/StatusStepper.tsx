import { CheckCircle2, Circle } from 'lucide-react'
import { STATUS_ORDER, STATUS_CONFIG } from '../types'
import type { ReportStatus } from '../types'

interface StatusStepperProps {
  currentStatus: ReportStatus
  compact?: boolean
}

export default function StatusStepper({ currentStatus, compact = false }: StatusStepperProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)

  return (
    <div className={`flex items-center w-full ${compact ? 'gap-0' : 'gap-0'}`}>
      {STATUS_ORDER.map((status, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex
        const cfg = STATUS_CONFIG[status]

        return (
          <div key={status} className="flex items-center flex-1 min-w-0">
            {/* Step */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                  compact ? 'w-6 h-6' : 'w-8 h-8'
                }`}
                style={{
                  background: isDone || isCurrent
                    ? `${cfg.color}20`
                    : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${isDone || isCurrent ? cfg.color : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: isCurrent ? `0 0 12px ${cfg.color}60` : undefined
                }}
              >
                {isDone ? (
                  <CheckCircle2
                    size={compact ? 12 : 16}
                    style={{ color: cfg.color }}
                  />
                ) : (
                  <Circle
                    size={compact ? 10 : 14}
                    style={{ color: isCurrent ? cfg.color : 'rgba(255,255,255,0.2)' }}
                    fill={isCurrent ? cfg.color : 'transparent'}
                  />
                )}
              </div>
              {!compact && (
                <span
                  className="text-xs mt-1 font-medium whitespace-nowrap"
                  style={{ color: isCurrent ? cfg.color : isDone ? cfg.color + 'cc' : 'rgba(255,255,255,0.3)' }}
                >
                  {cfg.label}
                </span>
              )}
            </div>

            {/* Connector line */}
            {i < STATUS_ORDER.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1 transition-all duration-500"
                style={{
                  background: i < currentIndex
                    ? `linear-gradient(90deg, ${cfg.color}, ${STATUS_CONFIG[STATUS_ORDER[i + 1]].color})`
                    : 'rgba(255,255,255,0.08)'
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
