import React from 'react'
import { useTraceStore } from '../../store/traceStore'
import { formatDuration, formatTokens, formatCost } from '../../utils/formatters'
import { Clock, Flame, DollarSign, Layers, ShieldAlert } from 'lucide-react'

export const RunMetricsBar: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const anomalies = useTraceStore((state) => state.anomalies)

  if (!activeRun) return null


  return (
    <div className="h-10 border-b border-slate-800 bg-slate-950/80 px-4 flex items-center justify-between text-xs text-slate-300 font-mono select-none overflow-x-auto">
      {/* Left: Run identity & framework */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-sans font-semibold text-white tracking-tight">
          {activeRun.name}
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {activeRun.framework || 'CUSTOM'}
        </span>
        <span
          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
            activeRun.status === 'error'
              ? 'bg-red-950/80 text-red-300 border border-red-800/50'
              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
          }`}
        >
          {activeRun.status}
        </span>
      </div>

      {/* Right: Key metrics */}
      <div className="flex items-center gap-5 shrink-0 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Duration:</span>
          <strong className="text-white font-medium">{formatDuration(activeRun.durationMs)}</strong>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Flame className="w-3.5 h-3.5 text-violet-400" />
          <span>Tokens:</span>
          <strong className="text-white font-medium">{formatTokens(activeRun.totalTokens)}</strong>
          <span className="text-slate-500 text-[10px]">
            ({formatTokens(activeRun.promptTokens)}p / {formatTokens(activeRun.completionTokens)}c)
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cost:</span>
          <strong className="text-emerald-400 font-medium">
            {formatCost(activeRun.totalCostUsd)}
          </strong>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Trajectory:</span>
          <strong className="text-white font-medium">{activeRun.steps.length} steps</strong>
          <span className="text-slate-500">({activeRun.spans.length} spans)</span>
        </div>

        {anomalies.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/80 border border-red-800/50 text-red-300 font-semibold text-[10px]">
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>
              {anomalies.length} {anomalies.length === 1 ? 'alert' : 'alerts'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
