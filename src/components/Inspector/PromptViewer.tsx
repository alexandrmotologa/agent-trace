import React, { useState } from 'react'
import type { Span } from '../../types/trace'
import { Copy, Check, Cpu, MessageSquare } from 'lucide-react'
import { formatTokens, formatCost } from '../../utils/formatters'

export const PromptViewer: React.FC<{ span: Span }> = ({ span }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  return (
    <div className="flex flex-col gap-4 p-4 text-xs">
      {/* Model & Token stats banner */}
      {span.modelUsage && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-200">{span.modelName || 'LLM Model'}</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-slate-400">
              Prompt: <strong className="text-slate-200">{formatTokens(span.modelUsage.promptTokens)}</strong>
            </span>
            <span className="text-slate-400">
              Completion: <strong className="text-slate-200">{formatTokens(span.modelUsage.completionTokens)}</strong>
            </span>
            <span className="text-slate-400">
              Total: <strong className="text-sky-300">{formatTokens(span.modelUsage.totalTokens)}</strong>
            </span>
            <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              {formatCost(span.modelUsage.costEstimateUsd || 0)}
            </span>
          </div>
        </div>
      )}

      {/* Input / Prompt section */}
      {span.promptText && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
              <span>Prompt / Context Input</span>
            </div>
            <button
              onClick={() => handleCopy(span.promptText || '', 'prompt')}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
            >
              {copiedSection === 'prompt' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg font-mono text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
            {span.promptText}
          </pre>
        </div>
      )}

      {/* Completion / Generation section */}
      {span.completionText && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>Model Completion</span>
            </div>
            <button
              onClick={() => handleCopy(span.completionText || '', 'completion')}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
            >
              {copiedSection === 'completion' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg font-mono text-emerald-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
            {span.completionText}
          </pre>
        </div>
      )}

      {/* Agent thought if present */}
      {span.agentThought && (
        <div className="flex flex-col gap-1.5">
          <div className="text-slate-400 font-semibold text-slate-300">
            Agent Reasoning Monologue
          </div>
          <div className="p-3 bg-violet-950/20 border border-violet-800/30 rounded-lg text-violet-200 leading-relaxed font-mono">
            {span.agentThought}
          </div>
        </div>
      )}
    </div>
  )
}
