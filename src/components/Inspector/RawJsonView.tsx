import React, { useState } from 'react'
import type { Span } from '../../types/trace'
import { Copy, Check, FileCode } from 'lucide-react'

export const RawJsonView: React.FC<{ span: Span }> = ({ span }) => {
  const [copied, setCopied] = useState(false)
  const jsonString = JSON.stringify(span, null, 2)

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2 p-4 text-xs h-full">
      <div className="flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <FileCode className="w-3.5 h-3.5 text-slate-400" />
          <span>Raw Span JSON</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Copy JSON
            </>
          )}
        </button>
      </div>

      <pre className="flex-1 p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-slate-300 whitespace-pre overflow-auto leading-relaxed">
        {jsonString}
      </pre>
    </div>
  )
}
