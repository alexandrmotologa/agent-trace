import React from 'react'
import { Brain, Cpu, Wrench, Layers } from 'lucide-react'
import { useTraceStore } from '../../store/traceStore'

export const LaneHeader: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const filterLane = useTraceStore((state) => state.filterLane)
  const setFilterLane = useTraceStore((state) => state.setFilterLane)

  const agentSpansCount =
    activeRun?.spans.filter((s) => s.type === 'agent_state').length || 0
  const llmSpansCount =
    activeRun?.spans.filter((s) => s.type === 'llm_call').length || 0
  const toolSpansCount =
    activeRun?.spans.filter((s) => s.type === 'tool_call').length || 0

  return (
    <div className="absolute top-12 left-3 z-10 flex flex-col gap-2.5 pointer-events-auto">
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
    </div>
  )
}
