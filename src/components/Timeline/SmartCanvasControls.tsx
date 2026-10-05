import React from 'react'
import { useReactFlow } from '@xyflow/react'
import { useTraceStore } from '../../store/traceStore'
import { Maximize2, AlertOctagon, Target } from 'lucide-react'

export const SmartCanvasControls: React.FC = () => {
  const { fitView, setCenter, getNodes } = useReactFlow()
  const anomalies = useTraceStore((state) => state.anomalies)
  const playbackStep = useTraceStore((state) => state.playbackStep)

  const handleFitAll = () => {
    fitView({ padding: 0.2, duration: 500 })
  }

  const handleFocusAnomaly = () => {
    if (!anomalies || anomalies.length === 0) return
    const targetSpanId = anomalies[0].spanIds[0]
    const nodes = getNodes()
    const targetNode = nodes.find((n) => n.id === targetSpanId)
    if (targetNode) {
      setCenter(targetNode.position.x + 110, targetNode.position.y + 45, {
        zoom: 1.15,
        duration: 600,
      })
    }
  }

  const handleFocusStep = () => {
    const nodes = getNodes()
    const stepNodes = nodes.filter((n) => {
      const data = n.data as { span?: { stepIndex?: number } }
      return data?.span?.stepIndex === playbackStep
    })

    if (stepNodes.length > 0) {
      const first = stepNodes[0]
      setCenter(first.position.x + 110, 220, {
        zoom: 1.05,
        duration: 500,
      })
    }
  }

  return (
    <div className="absolute top-12 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 shadow-xl text-xs">
      <button
        onClick={handleFitAll}
        title="Fit all spans into viewport"
        className="flex items-center gap-1 px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
      >
        <Maximize2 className="w-3.5 h-3.5 text-violet-400" />
        <span className="hidden sm:inline">Fit All</span>
      </button>

      {anomalies.length > 0 && (
        <button
          onClick={handleFocusAnomaly}
          title="Zoom to anomaly location"
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/40 transition"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">Zoom Anomaly</span>
        </button>
      )}

      <button
        onClick={handleFocusStep}
        title="Focus viewport on active step"
        className="flex items-center gap-1 px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
      >
        <Target className="w-3.5 h-3.5 text-sky-400" />
        <span className="hidden sm:inline">Focus Step</span>
      </button>
    </div>
  )
}
