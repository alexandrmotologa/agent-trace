import React from 'react'
import { Brain, Cpu, Wrench, Layers, AlertTriangle, Clock, Flame, Filter } from 'lucide-react'
import { useTraceStore } from '../../store/traceStore'

export const LaneHeader: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const filterLane = useTraceStore((state) => state.filterLane)
  const setFilterLane = useTraceStore((state) => state.setFilterLane)
  const triageFilter = useTraceStore((state) => state.triageFilter)
  const setTriageFilter = useTraceStore((state) => state.setTriageFilter)

  const agentSpansCount =
    activeRun?.spans.filter((s) => s.type === 'agent_state').length || 0
  const llmSpansCount =
    activeRun?.spans.filter((s) => s.type === 'llm_call').length || 0
  const toolSpansCount =
    activeRun?.spans.filter((s) => s.type === 'tool_call').length || 0

  const errorCount =
    activeRun?.spans.filter((s) => s.status === 'error' || s.toolCall?.isError).length || 0
  const slowCount =
    activeRun?.spans.filter((s) => s.durationMs >= 1000).length || 0
  const highTokenCount =
    activeRun?.spans.filter((s) => (s.modelUsage?.totalTokens || 0) >= 1000).length || 0

  return (
    <div className="absolute top-12 left-3 z-10 flex flex-col gap-2.5 pointer-events-auto">
      {/* Lane filters */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-lg p-1.5 shadow-xl flex flex-col gap-1 w-44">
        <button
          onClick={() => setFilterLane('all')}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            filterLane === 'all'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>All Lanes</span>
          </div>
          <span className="text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-400">
            {activeRun?.spans.length || 0}
          </span>
        </button>

        <button
          onClick={() => setFilterLane('agent')}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            filterLane === 'agent'
              ? 'bg-violet-950/80 text-violet-200 border border-violet-800/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-violet-400" />
            <span>Agent State</span>
          </div>
          <span className="text-[10px] bg-violet-900/40 text-violet-300 px-1.5 py-0.5 rounded">
            {agentSpansCount}
          </span>
        </button>

        <button
          onClick={() => setFilterLane('llm')}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            filterLane === 'llm'
              ? 'bg-sky-950/80 text-sky-200 border border-sky-800/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>LLM Calls</span>
          </div>
          <span className="text-[10px] bg-sky-900/40 text-sky-300 px-1.5 py-0.5 rounded">
            {llmSpansCount}
          </span>
        </button>

        <button
          onClick={() => setFilterLane('tool')}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            filterLane === 'tool'
              ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tool Calls</span>
          </div>
          <span className="text-[10px] bg-emerald-900/40 text-emerald-300 px-1.5 py-0.5 rounded">
            {toolSpansCount}
          </span>
        </button>
      </div>

      {/* Quick Triage filter section */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-lg p-1.5 shadow-xl flex flex-col gap-1 w-44">
        <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-800/60 mb-0.5">
          <Filter className="w-3 h-3 text-slate-500" />
          <span>Quick Triage</span>
        </div>

        <button
          onClick={() => setTriageFilter('all')}
          className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium transition ${
            triageFilter === 'all'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <span>All Events</span>
          <span className="text-[10px] text-slate-500">Normal</span>
        </button>

        <button
          onClick={() => setTriageFilter('errors_only')}
          className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium transition ${
            triageFilter === 'errors_only'
              ? 'bg-red-950/80 text-red-200 border border-red-800/60'
              : 'text-slate-400 hover:text-red-300 hover:bg-red-950/30'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>Errors Only</span>
          </div>
          <span className={`text-[10px] px-1 rounded ${errorCount > 0 ? 'bg-red-900/50 text-red-300' : 'text-slate-600'}`}>
            {errorCount}
          </span>
        </button>

        <button
          onClick={() => setTriageFilter('slow_only')}
          className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium transition ${
            triageFilter === 'slow_only'
              ? 'bg-amber-950/80 text-amber-200 border border-amber-800/60'
              : 'text-slate-400 hover:text-amber-300 hover:bg-amber-950/30'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Slow (&gt;1s)</span>
          </div>
          <span className="text-[10px] text-slate-500">{slowCount}</span>
        </button>

        <button
          onClick={() => setTriageFilter('high_tokens')}
          className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium transition ${
            triageFilter === 'high_tokens'
              ? 'bg-sky-950/80 text-sky-200 border border-sky-800/60'
              : 'text-slate-400 hover:text-sky-300 hover:bg-sky-950/30'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-sky-400" />
            <span>&gt;1k Tokens</span>
          </div>
          <span className="text-[10px] text-slate-500">{highTokenCount}</span>
        </button>
      </div>
    </div>
  )
}
