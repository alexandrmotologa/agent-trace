import React, { useState } from 'react'
import { Radio, Info, Check, Copy } from 'lucide-react'
import { useLiveCollector } from '../../hooks/useLiveCollector'

export const CollectorStatus: React.FC = () => {
  const { isConnected } = useLiveCollector()
  const [showTooltip, setShowTooltip] = useState(false)
  const [copied, setCopied] = useState(false)

  const envVar = 'OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"'
  const runCmd = 'npm run collector'

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative flex items-center">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono transition ${
          isConnected
            ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isConnected ? 'bg-emerald-400' : 'bg-slate-600'
            }`}
          ></span>
        </span>
        <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
        <span>{isConnected ? 'LIVE 4318' : 'OTLP 4318'}</span>
      </button>

      {showTooltip && (
        <div className="absolute top-8 right-0 z-50 w-80 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl text-xs text-slate-300 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-semibold text-white mb-1.5">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {isConnected ? 'Collector Connected (Port 4318)' : 'Local OTLP Collector (Standby)'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
            {isConnected
              ? 'Agent-Trace is actively listening for live spans from your agent processes.'
              : 'Run the lightweight local collector to stream live traces directly from LangChain or OpenTelemetry:'}
          </p>

          {!isConnected && (
            <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] text-amber-300 mb-2 overflow-hidden">
              <span className="truncate">{runCmd}</span>
              <button
                onClick={() => handleCopy(runCmd)}
                className="text-slate-400 hover:text-white shrink-0 ml-1.5"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] text-emerald-300 overflow-hidden">
            <span className="truncate">{envVar}</span>
            <button
              onClick={() => handleCopy(envVar)}
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
