import React from 'react'
import { Handle, Position } from '@xyflow/react'
import type { Span } from '../../types/trace'
import { formatDuration, formatTokens } from '../../utils/formatters'
import { Brain, Cpu, Wrench, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { useTraceStore } from '../../store/traceStore'

interface SpanNodeData {
  span: Span
  isSelected: boolean
}

export const SpanNode: React.FC<{ data: SpanNodeData }> = ({ data }) => {
  const { span, isSelected } = data
  const selectSpan = useTraceStore((state) => state.selectSpan)

  const isError = span.status === 'error' || span.toolCall?.isError

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
      onClick={(e) => {
        e.stopPropagation()
        selectSpan(span.id)
      }}
      className={`group relative rounded-lg border px-3 py-2.5 transition-all duration-150 cursor-pointer min-w-[190px] max-w-[280px] backdrop-blur-md ${style.bg} ${style.border}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !w-2 !h-2 !border-none"
      />

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
        <div className="flex items-center gap-1">
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

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-400 !w-2 !h-2 !border-none"
      />
    </div>
  )
}
