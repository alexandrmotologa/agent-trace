import React, { useEffect } from 'react'
import { useTraceStore } from '../../store/traceStore'
import { formatDuration, formatTokens, formatCost } from '../../utils/formatters'
import { GitCompare, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'

export const TraceComparisonView: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const compareRun = useTraceStore((state) => state.compareRun)
  const loadCompareSample = useTraceStore((state) => state.loadCompareSample)


  useEffect(() => {
    if (!compareRun) {
      loadCompareSample('coding_agent_loop.json')
    }
  }, [compareRun, loadCompareSample])

  if (!activeRun) {
    return <div className="p-8 text-center text-slate-500">No active trace to compare.</div>
  }

  const runB = compareRun || activeRun

  const tokenDelta = runB.totalTokens - activeRun.totalTokens
  const costDelta = runB.totalCostUsd - activeRun.totalCostUsd
  const durationDelta = runB.durationMs - activeRun.durationMs
  const stepsDelta = runB.steps.length - activeRun.steps.length

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto text-xs text-slate-200">
      {/* Top Header & Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/40 text-emerald-400">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Trace A/B Trajectory Comparison</h3>
            <span className="text-[11px] text-slate-400">
              Compare token burn, execution latency, and cost divergence across two runs
            </span>
          </div>
        </div>

        {/* Run B sample picker */}
        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400 text-[11px]">Compare With Run B:</span>
          <select
            onChange={(e) => loadCompareSample(e.target.value)}
            defaultValue="coding_agent_loop.json"
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
          >
            <option value="research_agent_trace.json">Research Agent (Parallel Tools)</option>
            <option value="coding_agent_loop.json">Debugger (Infinite Loop Bug)</option>
            <option value="rag_eval_trace.json">RAG Vector Retrieval</option>
            <option value="tool_failure_trace.json">Database Agent (SQL Recovery)</option>
          </select>
        </div>
      </div>

      {/* Side-by-side metric comparison cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Token Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <span className="text-slate-400 font-medium">Total Token Burn</span>
          <div className="flex items-center justify-between font-mono">
            <div>
              <div className="text-[10px] text-slate-500">Run A (Base)</div>
              <div className="text-base font-bold text-white">{formatTokens(activeRun.totalTokens)}</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <div>
              <div className="text-[10px] text-slate-500">Run B (Compare)</div>
              <div className="text-base font-bold text-slate-200">{formatTokens(runB.totalTokens)}</div>
            </div>
          </div>
          <div
            className={`flex items-center gap-1 text-[11px] font-mono font-semibold pt-1 border-t border-slate-800/80 ${
              tokenDelta < 0 ? 'text-emerald-400' : tokenDelta > 0 ? 'text-red-400' : 'text-slate-400'
            }`}
          >
            {tokenDelta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{tokenDelta > 0 ? `+${formatTokens(tokenDelta)}` : formatTokens(tokenDelta)} tokens</span>
          </div>
        </div>

        {/* Cost Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <span className="text-slate-400 font-medium">Estimated Cost</span>
          <div className="flex items-center justify-between font-mono">
            <div>
              <div className="text-[10px] text-slate-500">Run A</div>
              <div className="text-base font-bold text-emerald-400">{formatCost(activeRun.totalCostUsd)}</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <div>
              <div className="text-[10px] text-slate-500">Run B</div>
              <div className="text-base font-bold text-slate-200">{formatCost(runB.totalCostUsd)}</div>
            </div>
          </div>
          <div
            className={`flex items-center gap-1 text-[11px] font-mono font-semibold pt-1 border-t border-slate-800/80 ${
              costDelta < 0 ? 'text-emerald-400' : costDelta > 0 ? 'text-red-400' : 'text-slate-400'
            }`}
          >
            {costDelta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{costDelta > 0 ? `+${formatCost(costDelta)}` : formatCost(costDelta)}</span>
          </div>
        </div>

        {/* Duration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <span className="text-slate-400 font-medium">Execution Duration</span>
          <div className="flex items-center justify-between font-mono">
            <div>
              <div className="text-[10px] text-slate-500">Run A</div>
              <div className="text-base font-bold text-white">{formatDuration(activeRun.durationMs)}</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <div>
              <div className="text-[10px] text-slate-500">Run B</div>
              <div className="text-base font-bold text-slate-200">{formatDuration(runB.durationMs)}</div>
            </div>
          </div>
          <div className="text-[11px] font-mono font-semibold pt-1 border-t border-slate-800/80 text-slate-400">
            <span>{durationDelta > 0 ? `+${formatDuration(durationDelta)}` : formatDuration(durationDelta)}</span>
          </div>
        </div>

        {/* Steps Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
          <span className="text-slate-400 font-medium">Trajectory Steps</span>
          <div className="flex items-center justify-between font-mono">
            <div>
              <div className="text-[10px] text-slate-500">Run A</div>
              <div className="text-base font-bold text-white">{activeRun.steps.length}</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            <div>
              <div className="text-[10px] text-slate-500">Run B</div>
              <div className="text-base font-bold text-slate-200">{runB.steps.length}</div>
            </div>
          </div>
          <div className="text-[11px] font-mono font-semibold pt-1 border-t border-slate-800/80 text-slate-400">
            <span>{stepsDelta > 0 ? `+${stepsDelta}` : stepsDelta} steps</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Diff Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <h4 className="font-semibold text-slate-200 text-sm">Detailed Metrics Comparison</h4>
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
              <th className="py-2.5 px-3">Metric</th>
              <th className="py-2.5 px-3">Run A ({activeRun.name})</th>
              <th className="py-2.5 px-3">Run B ({runB.name})</th>
              <th className="py-2.5 px-3 text-right">Variance (Δ)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            <tr>
              <td className="py-2.5 px-3 text-slate-300 font-sans">Prompt Tokens</td>
              <td className="py-2.5 px-3 text-slate-300">{formatTokens(activeRun.promptTokens)}</td>
              <td className="py-2.5 px-3 text-slate-300">{formatTokens(runB.promptTokens)}</td>
              <td className="py-2.5 px-3 text-right text-slate-300">
                {formatTokens(runB.promptTokens - activeRun.promptTokens)}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 text-slate-300 font-sans">Completion Tokens</td>
              <td className="py-2.5 px-3 text-slate-300">{formatTokens(activeRun.completionTokens)}</td>
              <td className="py-2.5 px-3 text-slate-300">{formatTokens(runB.completionTokens)}</td>
              <td className="py-2.5 px-3 text-right text-slate-300">
                {formatTokens(runB.completionTokens - activeRun.completionTokens)}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 text-slate-300 font-sans">Tool Invocations</td>
              <td className="py-2.5 px-3 text-slate-300">
                {activeRun.spans.filter((s) => s.type === 'tool_call').length}
              </td>
              <td className="py-2.5 px-3 text-slate-300">
                {runB.spans.filter((s) => s.type === 'tool_call').length}
              </td>
              <td className="py-2.5 px-3 text-right text-slate-300">
                {runB.spans.filter((s) => s.type === 'tool_call').length -
                  activeRun.spans.filter((s) => s.type === 'tool_call').length}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 text-slate-300 font-sans">Execution Status</td>
              <td className="py-2.5 px-3">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                    activeRun.status === 'error' ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'
                  }`}
                >
                  {activeRun.status}
                </span>
              </td>
              <td className="py-2.5 px-3">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                    runB.status === 'error' ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'
                  }`}
                >
                  {runB.status}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right text-slate-400 font-sans">
                {activeRun.status === runB.status ? 'Matched' : 'Diverged'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
