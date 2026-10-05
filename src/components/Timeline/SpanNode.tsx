import React, { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { Span } from '../../types/trace'
import { formatDuration, formatTokens, formatCost } from '../../utils/formatters'
import { Brain, Cpu, Wrench, AlertTriangle, CheckCircle2, Clock, Copy, Check, Bot } from 'lucide-react'
import { useTraceStore } from '../../store/traceStore'

interface SpanNodeData {
  span: Span
  isSelected: boolean
}

export const SpanNode: React.FC<{ data: SpanNodeData }> = ({ data }) => {
  const { span, isSelected } = data
  const selectSpan = useTraceStore((state) => state.selectSpan)
  const [showTooltip, setShowTooltip] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  const isError = span.status === 'error' || span.toolCall?.isError

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(span.id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 1500)
  }

  const getLaneStyle = () => {
    switch (span.type) {
      case 'agent_state':
        return {
          border: isSelected ? 'border-violet-400' : 'border-violet-500/30',
          bg: isSelected ? 'bg-violet-950/80 shadow-lg shadow-violet-500/20' : 'bg-slate-900/90',
          badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
          icon: <Brain className="w-3.5 h-3.5 text-violet-400" />,
        }
      case 'llm_call':
        return {
          border: isSelected ? 'border-sky-400' : 'border-sky-500/30',
          bg: isSelected ? 'bg-sky-950/80 shadow-lg shadow-sky-500/20' : 'bg-slate-900/90',
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          icon: <Cpu className="w-3.5 h-3.5 text-sky-400" />,
        }
      case 'tool_call':
        return {
          border: isError
            ? 'border-red-500 shadow-md shadow-red-500/20'
            : isSelected
              ? 'border-emerald-400'
              : 'border-emerald-500/30',
          bg: isError
            ? 'bg-red-950/70'
            : isSelected
              ? 'bg-emerald-950/80 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/90',
          badgeBg: isError
            ? 'bg-red-500/20 text-red-300 border-red-500/30'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <Wrench className="w-3.5 h-3.5 text-emerald-400" />,
        }
    }
  }

  const style = getLaneStyle()

  return (
    <div
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        e.stopPropagation()
        selectSpan(span.id)
      }}
      className={`group relative rounded-lg border px-3 py-2.5 transition-all duration-150 cursor-pointer min-w-[200px] max-w-[280px] backdrop-blur-md ${style.bg} ${style.border}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !w-2 !h-2 !border-none"
      />

      {span.agentName && (
        <div className="flex items-center gap-1 mb-1 text-[10px] font-mono text-violet-300 bg-violet-950/60 border border-violet-800/40 rounded px-1.5 py-0.5 w-fit">
          <Bot className="w-2.5 h-2.5 text-violet-400 shrink-0" />
          <span className="truncate max-w-[170px]">{span.agentName}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="p-1 rounded bg-slate-800/80 shrink-0">{style.icon}</div>
          <span className="text-xs font-semibold text-slate-100 truncate tracking-tight">
            {span.toolCall?.toolName || span.modelName || span.name}
          </span>
        </div>

        <div className="shrink-0 flex items-center gap-1">
          {isError ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          ) : (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          )}
        </div>
      </div>

      {/* Snippet / Context preview */}
      <div className="text-[11px] text-slate-400 line-clamp-1 mb-2 font-mono">
        {span.type === 'agent_state' && (span.agentThought || 'Reasoning phase')}
        {span.type === 'llm_call' && (span.completionText || 'Inference execution')}
        {span.type === 'tool_call' &&
          (span.toolCall?.error || JSON.stringify(span.toolCall?.inputArgs || ''))}
      </div>

      {/* Bottom status & metric bar */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
        <div className="flex items-center gap-1 font-mono">
          <Clock className="w-2.5 h-2.5 text-slate-500" />
          <span>{formatDuration(span.durationMs)}</span>
        </div>

        {span.modelUsage && (
          <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-sky-300">
            {formatTokens(span.modelUsage.totalTokens)} tok
          </span>
        )}

        {span.type === 'agent_state' && span.agentState && (
          <span className="uppercase tracking-wider font-semibold text-[9px] text-violet-400">
            {span.agentState}
          </span>
        )}

        {span.type === 'tool_call' && (
          <span
            className={`font-mono px-1 rounded ${
              isError ? 'text-red-400 bg-red-950/60' : 'text-emerald-400 bg-emerald-950/60'
            }`}
          >
            {isError ? 'ERR' : 'OK'}
          </span>
        )}
      </div>

      {/* Rich Hover Tooltip */}
      {showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-24 z-50 w-64 p-2.5 bg-slate-900/95 backdrop-blur-md border border-slate-750 rounded-lg shadow-2xl text-[11px] text-slate-300 pointer-events-auto select-text animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 font-semibold text-white">
            <span className="truncate">{span.name}</span>
            <button
              onClick={handleCopyId}
              title="Copy Span ID"
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-1 py-0.5 rounded hover:bg-slate-800 transition"
            >
              {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span className="font-mono">{span.id.slice(0, 8)}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 pt-1.5 text-[10px] font-mono">
            <div>
              <span className="text-slate-500">Duration: </span>
              <span className="text-slate-200">{formatDuration(span.durationMs)}</span>
            </div>
            <div>
              <span className="text-slate-500">Step: </span>
              <span className="text-slate-200">#{span.stepIndex}</span>
            </div>
            {span.modelUsage && (
              <>
                <div>
                  <span className="text-slate-500">Prompt: </span>
                  <span className="text-sky-300">{formatTokens(span.modelUsage.promptTokens)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Cost: </span>
                  <span className="text-emerald-400">{formatCost(span.modelUsage.costEstimateUsd || 0)}</span>
                </div>
              </>
            )}
            {span.toolCall && (
              <div className="col-span-2 truncate">
                <span className="text-slate-500">Tool: </span>
                <span className="text-emerald-300">{span.toolCall.toolName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-400 !w-2 !h-2 !border-none"
      />
    </div>
  )
}
