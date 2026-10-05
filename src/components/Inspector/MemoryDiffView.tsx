import React, { useState } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import { useTraceStore } from '../../store/traceStore'
import { computeContextDiff } from '../../engine/diffEngine'
import { formatTokens } from '../../utils/formatters'
import { AlertTriangle, ArrowRight, Layers, Sparkles } from 'lucide-react'

export const MemoryDiffView: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const selectedStepIndex = useTraceStore((state) => state.selectedStepIndex) || 1
  const selectStep = useTraceStore((state) => state.selectStep)

  const [compareStepIndex, setCompareStepIndex] = useState<number>(
    Math.max(1, selectedStepIndex - 1)
  )

  if (!activeRun || activeRun.steps.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active trace run loaded to compute context memory diffs.
      </div>
    )
  }

  const prevStep = activeRun.steps.find((s) => s.stepIndex === compareStepIndex) || activeRun.steps[0]
  const currStep = activeRun.steps.find((s) => s.stepIndex === selectedStepIndex) || activeRun.steps[0]

  const { prevText, currText, stats } = computeContextDiff(
    prevStep.contextMessages,
    currStep.contextMessages
  )

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Top selector toolbar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-slate-300">Context Memory Evolution</span>
        </div>

        {/* Comparison step selectors */}
        <div className="flex items-center gap-2 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Baseline Step:</span>
            <select
              value={compareStepIndex}
              onChange={(e) => setCompareStepIndex(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none"
            >
              {activeRun.steps.map((st) => (
                <option key={st.stepIndex} value={st.stepIndex}>
                  Step {st.stepIndex} ({formatTokens(st.contextTokenCount)} tok)
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Target Step:</span>
            <select
              value={selectedStepIndex}
              onChange={(e) => selectStep(Number(e.target.value))}
              className="bg-slate-800 border border-violet-500/50 rounded px-2 py-1 text-violet-300 focus:outline-none"
            >
              {activeRun.steps.map((st) => (
                <option key={st.stepIndex} value={st.stepIndex}>
                  Step {st.stepIndex} ({formatTokens(st.contextTokenCount)} tok)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">
            Baseline: <strong className="text-slate-200">{stats.prevTokens}</strong> tok
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">
            Target: <strong className="text-slate-200">{stats.currTokens}</strong> tok
          </span>
          <span
            className={`px-2 py-0.5 rounded font-semibold ${
              stats.tokenDelta > 0
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                : stats.tokenDelta < 0
                  ? 'bg-red-950/80 text-red-300 border border-red-800/50'
                  : 'bg-slate-800 text-slate-400'
            }`}
          >
            {stats.tokenDelta > 0 ? `+${stats.tokenDelta}` : stats.tokenDelta} tok
          </span>
        </div>
      </div>

      {/* Bloat Warning Banner if triggered */}
      {stats.warningBloat && (
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-800/50 flex items-center gap-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Token Bloat Warning:</strong> This transition introduced a high surge of{' '}
            {stats.tokenDelta.toLocaleString()} tokens (+{stats.bloatRatio}%). Tool payloads may be
            flooding agent memory.
          </span>
        </div>
      )}

      {/* Side-by-side Monaco diff container */}
      <div className="flex-1 min-h-[350px] relative">
        <DiffEditor
          height="100%"
          original={prevText || '// No baseline context recorded'}
          modified={currText || '// No target context recorded'}
          language="markdown"
          theme="vs-dark"
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            renderIndicators: true,
            diffWordWrap: 'on',
          }}
          loading={
            <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-violet-400" />
              Initializing Monaco Diff Editor...
            </div>
          }
        />
      </div>
    </div>
  )
}
