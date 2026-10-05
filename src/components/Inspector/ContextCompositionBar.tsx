import React from 'react'
import type { ChatMessage } from '../../types/trace'
import { computeContextComposition } from '../../engine/contextComposition'
import { formatTokens } from '../../utils/formatters'
import { AlertTriangle, PieChart, Zap } from 'lucide-react'

export const ContextCompositionBar: React.FC<{
  messages: ChatMessage[]
  onPinpointBloat?: () => void
}> = ({ messages, onPinpointBloat }) => {
  const composition = computeContextComposition(messages)

  if (composition.segments.length === 0) return null

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
          <PieChart className="w-3.5 h-3.5 text-violet-400" />
          <span>Context Window Composition ({formatTokens(composition.totalTokens)} tok)</span>
        </div>

        {composition.bloatContributor && (
          <div className="flex items-center gap-1.5">
            <span
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                composition.bloatContributor.isDangerousBloat
                  ? 'bg-red-950/80 text-red-300 border border-red-800/50'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>
                Bloat: {composition.bloatContributor.percentage}% {composition.bloatContributor.label}
              </span>
            </span>

            {onPinpointBloat && (
              <button
                onClick={onPinpointBloat}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-900/40 hover:bg-violet-900/80 text-violet-200 text-[10px] transition"
              >
                <Zap className="w-2.5 h-2.5" />
                <span>Pinpoint</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stacked bar */}
      <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/60">
        {composition.segments.map((seg) => (
          <div
            key={seg.type}
            style={{ width: `${seg.percentage}%`, backgroundColor: seg.color }}
            className="h-full transition-all duration-300 relative group"
            title={`${seg.label}: ${formatTokens(seg.tokenCount)} tokens (${seg.percentage}%)`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-slate-400 pt-0.5">
        {composition.segments.map((seg) => (
          <div key={seg.type} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-slate-300">{seg.label}:</span>
            <span className="text-slate-400 font-semibold">{formatTokens(seg.tokenCount)}</span>
            <span className="text-slate-500">({seg.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}
