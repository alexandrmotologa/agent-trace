import React, { useState, useEffect } from 'react'
import { useTraceStore } from '../../store/traceStore'
import { useUiStore } from '../../store/uiStore'
import { explainFailureLocally, type AutopsyResult } from '../../engine/autopsyEngine'
import {
  Stethoscope,
  X,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  ShieldAlert,
  Lightbulb,
  Radio,
} from 'lucide-react'

export const AutopsyModal: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const anomalies = useTraceStore((state) => state.anomalies)
  const isAutopsyModalOpen = useUiStore((state) => state.isAutopsyModalOpen)
  const setAutopsyModalOpen = useUiStore((state) => state.setAutopsyModalOpen)

  const [loading, setLoading] = useState(false)
  const [autopsy, setAutopsy] = useState<AutopsyResult | null>(null)
  const [ollamaModel, setOllamaModel] = useState('llama3.2')
  const [copiedFix, setCopiedFix] = useState(false)

  const runAutopsy = async (model = ollamaModel) => {
    if (!activeRun) return
    setLoading(true)
    try {
      const res = await explainFailureLocally(activeRun, anomalies, model)
      setAutopsy(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAutopsyModalOpen && activeRun) {
      runAutopsy()
    }
  }, [isAutopsyModalOpen, activeRun])

  if (!isAutopsyModalOpen || !activeRun) return null

  const handleCopyPrompt = () => {
    if (!autopsy) return
    navigator.clipboard.writeText(autopsy.suggestedPromptFix)
    setCopiedFix(true)
    setTimeout(() => setCopiedFix(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Trajectory Autopsy & Root-Cause Explainer
              </h2>
              <p className="text-xs text-slate-400">
                Automated post-mortem diagnosis for reasoning failures, loops, and context degradation.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutopsyModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span>Diagnostic Engine:</span>
            <select
              value={ollamaModel}
              onChange={(e) => {
                setOllamaModel(e.target.value)
                runAutopsy(e.target.value)
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-violet-500 font-mono"
            >
              <option value="llama3.2">Local Ollama (llama3.2)</option>
              <option value="mistral">Local Ollama (mistral)</option>
              <option value="deepseek-r1">Local Ollama (deepseek-r1)</option>
              <option value="qwen2.5">Local Ollama (qwen2.5)</option>
              <option value="builtin">Built-in Rule Engine (Offline)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              100% Private (Zero Cloud)
            </span>
            <button
              onClick={() => runAutopsy()}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Re-analyze</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
              <span>Synthesizing trajectory post-mortem autopsy...</span>
            </div>
          ) : autopsy ? (
            <>
              {/* Engine Badge banner */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400">Diagnostic Method:</span>
                <span className="font-mono text-violet-300 font-medium">
                  {autopsy.modelUsed}
                </span>
              </div>

              {/* Section 1: Root Cause */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4" />
                  <span>1. Failure Root Cause Analysis</span>
                </div>
                <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {autopsy.rootCause}
                </div>
              </div>

              {/* Section 2: Poisoning Span */}
              {autopsy.poisoningSpan && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-center justify-between">
                  <span>Context Poisoning Trigger:</span>
                  <span className="font-mono font-semibold">{autopsy.poisoningSpan}</span>
                </div>
              )}

              {/* Section 3: Recommended Prompt Fix */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                    <Lightbulb className="w-4 h-4" />
                    <span>2. Actionable System Prompt Fix</span>
                  </div>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                  >
                    {copiedFix ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Fix</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {autopsy.suggestedPromptFix}
                </pre>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
