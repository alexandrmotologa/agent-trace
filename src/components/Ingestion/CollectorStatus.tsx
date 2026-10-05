import React, { useState } from 'react'
import { Radio, Info, Check, Copy } from 'lucide-react'

export const CollectorStatus: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [copied, setCopied] = useState(false)

  const envVar = 'OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318'

  const handleCopy = () => {
    navigator.clipboard.writeText(envVar)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Radio className="w-3 h-3 text-emerald-400" />
        <span className="font-mono">OTLP 4318</span>
      </button>

      {showTooltip && (
        <div className="absolute top-8 right-0 z-50 w-72 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl text-xs text-slate-300 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-semibold text-white mb-1.5">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>OTLP Collector Endpoint</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
            Point your LangChain, AutoGen, or OpenTelemetry SDK to this localhost collector to stream agent traces directly:
          </p>
          <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] text-emerald-300 overflow-hidden">
            <span className="truncate">{envVar}</span>
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-white shrink-0 ml-1.5"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
