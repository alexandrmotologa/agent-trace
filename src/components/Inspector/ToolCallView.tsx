import React, { useState } from 'react'
import type { ToolCallInfo } from '../../types/trace'
import { formatDuration } from '../../utils/formatters'
import { Wrench, CheckCircle2, AlertTriangle, Clock, Copy, Check } from 'lucide-react'

export const ToolCallView: React.FC<{ toolCall: ToolCallInfo }> = ({ toolCall }) => {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatPayload = (data: unknown) => {
    if (typeof data === 'string') return data
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  const argsString = formatPayload(toolCall.inputArgs)
  const outputString = formatPayload(toolCall.outputResult)

  return (
    <div className="flex flex-col gap-4 p-4 text-xs">
      {/* Tool header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-100 font-mono text-sm">
            {toolCall.toolName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-mono text-slate-400 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatDuration(toolCall.executionTimeMs)}</span>
          </div>

          {toolCall.isError ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/80 border border-red-800/50 text-red-300 font-semibold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Failed
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 font-semibold text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Success
            </span>
          )}
        </div>
      </div>

      {/* Input arguments */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-slate-400">
          <span className="font-semibold text-slate-300">Input Arguments</span>
          <button
            onClick={() => handleCopy(argsString, 'args')}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
          >
            {copied === 'args' ? (
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
        <pre className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg font-mono text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
          {argsString || '{}'}
        </pre>
      </div>

      {/* Output result */}
      {toolCall.outputResult !== undefined && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Tool Return Value</span>
            <button
              onClick={() => handleCopy(outputString, 'output')}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
            >
              {copied === 'output' ? (
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
          <pre className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg font-mono text-emerald-300 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
            {outputString}
          </pre>
        </div>
      )}

      {/* Error stack / exception if present */}
      {toolCall.error && (
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Error Diagnostic
          </span>
          <pre className="p-3 bg-red-950/30 border border-red-800/40 rounded-lg font-mono text-red-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
            {toolCall.error}
          </pre>
        </div>
      )}
    </div>
  )
}
