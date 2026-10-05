import React, { useState } from 'react'
import { useTraceStore } from '../../store/traceStore'
import { useUiStore } from '../../store/uiStore'
import { AlertOctagon, AlertTriangle, ArrowRight, ChevronDown, ChevronUp, ShieldAlert, Stethoscope } from 'lucide-react'

export const AnomalyBanner: React.FC = () => {
  const anomalies = useTraceStore((state) => state.anomalies)
  const selectStep = useTraceStore((state) => state.selectStep)
  const setPlaybackStep = useTraceStore((state) => state.setPlaybackStep)
  const setAutopsyModalOpen = useUiStore((state) => state.setAutopsyModalOpen)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!anomalies || anomalies.length === 0) return null

  const topAnomaly = anomalies[0]

  const handleJumpToStep = (stepIndex: number) => {
    setPlaybackStep(stepIndex)
    selectStep(stepIndex)
  }

  return (
    <div className="border-b border-red-900/60 bg-red-950/40 backdrop-blur-md px-4 py-2.5 text-xs text-red-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span className="font-semibold text-white">
            {anomalies.length} {anomalies.length === 1 ? 'Anomaly' : 'Anomalies'} Detected:
          </span>
          <span className="truncate text-red-300">
            {topAnomaly.title} - {topAnomaly.description}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setAutopsyModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-800/80 hover:bg-red-700 text-white font-medium transition text-[11px] shadow-sm"
          >
            <Stethoscope className="w-3 h-3" />
            <span>Trajectory Autopsy</span>
          </button>

          {topAnomaly.stepIndices.length > 0 && (
            <button
              onClick={() => handleJumpToStep(topAnomaly.stepIndices[0])}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800 text-white font-medium transition text-[11px]"
            >
              <span>Jump to Step {topAnomaly.stepIndices[0]}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {anomalies.length > 1 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 p-1 text-red-400 hover:text-white transition"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded list of anomalies */}
      {isExpanded && anomalies.length > 1 && (
        <div className="mt-3 pt-3 border-t border-red-900/40 flex flex-col gap-2">
          {anomalies.map((anom) => (
            <div
              key={anom.id}
              className="bg-red-950/60 border border-red-900/40 rounded-lg p-2.5 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2">
                {anom.severity === 'critical' ? (
                  <AlertOctagon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    <span>{anom.title}</span>
                    <span className="text-[10px] font-mono uppercase bg-red-900/50 px-1.5 py-0.2 rounded text-red-300">
                      {anom.severity}
                    </span>
                  </div>
                  <div className="text-red-300 mt-0.5">{anom.description}</div>
                  <div className="text-[11px] text-red-400 mt-1 font-mono">
                    Fix: {anom.recommendation}
                  </div>
                </div>
              </div>

              {anom.stepIndices.length > 0 && (
                <button
                  onClick={() => handleJumpToStep(anom.stepIndices[0])}
                  className="px-2 py-1 rounded bg-red-900/40 hover:bg-red-900/80 text-white text-[11px] whitespace-nowrap"
                >
                  Step {anom.stepIndices[0]}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
