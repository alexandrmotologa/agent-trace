import { useState, useMemo } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import { useTraceStore } from '../../store/traceStore'
import { computeContextDiff, estimateTokenCount, formatMessagesToText } from '../../engine/diffEngine'
import { formatTokens } from '../../utils/formatters'
import {
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Scissors,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { ContextCompositionBar } from './ContextCompositionBar'

export const MemoryDiffView: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const selectedStepIndex = useTraceStore((state) => state.selectedStepIndex) || 1
  const selectStep = useTraceStore((state) => state.selectStep)

  const [compareStepIndex, setCompareStepIndex] = useState<number>(
    Math.max(1, selectedStepIndex - 1)
  )
  const [showSimulator, setShowSimulator] = useState(false)
  const [retentionTurns, setRetentionTurns] = useState<number>(0) // 0 = keep all
  const [truncateToolResults, setTruncateToolResults] = useState(false)

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

  const evictionStats = useMemo(() => {
    const rawMsgs = currStep.contextMessages || []
    if (rawMsgs.length === 0) return null

    const systemMsgs = rawMsgs.filter((m) => m.role === 'system')
    const nonSystemMsgs = rawMsgs.filter((m) => m.role !== 'system')

    let prunedNonSystem = nonSystemMsgs
    if (retentionTurns > 0) {
      prunedNonSystem = nonSystemMsgs.slice(-retentionTurns)
    }

    let pruned = [...systemMsgs, ...prunedNonSystem]
    if (truncateToolResults) {
      pruned = pruned.map((m) => {
        if (m.role === 'tool' && (m.content?.length || 0) > 400) {
          return {
            ...m,
            content: m.content.slice(0, 400) + '... [TRUNCATED]',
          }
        }
        return m
      })
    }

    const prunedText = formatMessagesToText(pruned)
    const simulatedTokens = estimateTokenCount(prunedText)
    const originalTokens = stats.currTokens
    const tokensSaved = Math.max(0, originalTokens - simulatedTokens)
    const pctSaved = originalTokens > 0 ? ((tokensSaved / originalTokens) * 100).toFixed(1) : '0'

    const hasInitialUser = pruned.some((m) => m.role === 'user')
    const hasSystem = pruned.some((m) => m.role === 'system')

    return {
      originalTokens,
      simulatedTokens,
      tokensSaved,
      pctSaved,
      hasInitialUser,
      hasSystem,
      messageCount: pruned.length,
      originalCount: rawMsgs.length,
    }
  }, [currStep.contextMessages, retentionTurns, truncateToolResults, stats.currTokens])

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

      {/* Context Composition Breakdown */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40">
        <ContextCompositionBar messages={currStep.contextMessages} />
      </div>

      {/* Interactive Context Eviction Simulator */}
      <div className="border-b border-slate-800 bg-slate-900/40 text-xs">
        <button
          onClick={() => setShowSimulator(!showSimulator)}
          className="w-full px-4 py-2 flex items-center justify-between text-slate-300 hover:text-white hover:bg-slate-800/40 transition"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />
            <span className="font-semibold text-slate-200">Context Eviction & Sliding Window Simulator</span>
            {evictionStats && Number(evictionStats.pctSaved) > 0 && (
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.2 rounded font-mono font-medium">
                -{evictionStats.pctSaved}% potential token reduction
              </span>
            )}
          </div>
          {showSimulator ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showSimulator && evictionStats && (
          <div className="p-4 border-t border-slate-800/60 bg-slate-950/60 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Controls */}
              <div className="flex flex-col gap-2.5 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-sky-400" />
                  <span>Retention Policies</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 text-[11px]">Sliding Window Retention:</span>
                  <select
                    value={retentionTurns}
                    onChange={(e) => setRetentionTurns(Number(e.target.value))}
                    className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value={0}>Retain All Messages (Default)</option>
                    <option value={8}>Keep Last 8 Non-System Turns</option>
                    <option value={6}>Keep Last 6 Non-System Turns</option>
                    <option value={4}>Keep Last 4 Non-System Turns</option>
                    <option value={2}>Keep Last 2 Non-System Turns</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 text-[11px]">
                  <input
                    type="checkbox"
                    checked={truncateToolResults}
                    onChange={(e) => setTruncateToolResults(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-violet-600 focus:ring-0"
                  />
                  <span>Truncate verbose tool outputs to 400 chars (RAG / Web docs)</span>
                </label>
              </div>

              {/* Simulation Result Metrics */}
              <div className="flex flex-col gap-2 bg-slate-900/60 border border-slate-800 rounded-lg p-3 font-mono">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 font-sans">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simulated Pruning Impact</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-sans">Original Tokens:</span>
                  <span className="text-slate-300">{formatTokens(evictionStats.originalTokens)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-sans">Simulated Context:</span>
                  <span className="text-sky-300 font-semibold">{formatTokens(evictionStats.simulatedTokens)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                  <span className="text-emerald-400 font-sans font-medium">Estimated Token Savings:</span>
                  <span className="text-emerald-400 font-bold">
                    -{formatTokens(evictionStats.tokensSaved)} ({evictionStats.pctSaved}%)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-sans mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>
                    System Prompt: {evictionStats.hasSystem ? 'Preserved' : 'Dropped'} • Task Query:{' '}
                    {evictionStats.hasInitialUser ? 'Active' : 'Evicted'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


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
