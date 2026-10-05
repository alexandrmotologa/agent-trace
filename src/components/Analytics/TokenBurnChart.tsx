import React from 'react'
import { useTraceStore } from '../../store/traceStore'
import { formatTokens, formatCost, formatDuration } from '../../utils/formatters'
import { Flame, DollarSign, Cpu, BarChart2, TrendingUp } from 'lucide-react'

export const TokenBurnChart: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const tokenBurnRate = useTraceStore((state) => state.tokenBurnRate)
  const modelStats = useTraceStore((state) => state.modelStats)

  if (!activeRun) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active trace run loaded to display token analytics.
      </div>
    )
  }

  const maxStepTokens = Math.max(...tokenBurnRate.map((b) => b.totalTokens), 1)

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto text-xs text-slate-200">
      {/* Top summary metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-400 font-medium">Total Token Burn</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {formatTokens(activeRun.totalTokens)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {formatTokens(activeRun.promptTokens)} prompt • {formatTokens(activeRun.completionTokens)} comp
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-violet-950/60 border border-violet-800/40 text-violet-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-400 font-medium">Estimated Run Cost</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {formatCost(activeRun.totalCostUsd)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              across {modelStats.length} model {modelStats.length === 1 ? 'type' : 'types'}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-400 font-medium">Trajectory Duration</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {formatDuration(activeRun.durationMs)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {activeRun.steps.length} steps • {activeRun.spans.length} total spans
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-950/60 border border-sky-800/40 text-sky-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-400 font-medium">Model Calls</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {activeRun.spans.filter((s) => s.type === 'llm_call').length}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {activeRun.spans.filter((s) => s.type === 'tool_call').length} tool calls
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Step-by-step token burn bar chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-violet-400" />
            <h3 className="font-semibold text-slate-200 text-sm">Step-by-Step Token Consumption</h3>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
              <span>Prompt Tokens</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
              <span>Completion Tokens</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {tokenBurnRate.map((b) => {
            const promptPct = (b.promptTokens / maxStepTokens) * 100
            const compPct = (b.completionTokens / maxStepTokens) * 100

            return (
              <div key={b.stepIndex} className="flex items-center gap-3 font-mono text-[11px]">
                <span className="w-16 text-slate-400 shrink-0">Step {b.stepIndex}</span>

                <div className="flex-1 bg-slate-950/80 rounded-md h-6 overflow-hidden flex border border-slate-800/60 relative">
                  <div
                    style={{ width: `${promptPct}%` }}
                    className="bg-sky-600/80 h-full transition-all duration-300"
                    title={`Prompt: ${b.promptTokens} tokens`}
                  />
                  <div
                    style={{ width: `${compPct}%` }}
                    className="bg-violet-600/80 h-full transition-all duration-300"
                    title={`Completion: ${b.completionTokens} tokens`}
                  />
                </div>

                <div className="w-24 text-right text-slate-300 shrink-0">
                  {formatTokens(b.totalTokens)} tok
                </div>
                <div className="w-20 text-right text-emerald-400 shrink-0">
                  {formatCost(b.cumulativeCostUsd)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Model pricing & usage table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-slate-200 text-sm">Model Cost & Token Distribution</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2 px-3 font-medium">Model</th>
                <th className="py-2 px-3 font-medium">Calls</th>
                <th className="py-2 px-3 font-medium">Prompt Tokens</th>
                <th className="py-2 px-3 font-medium">Completion Tokens</th>
                <th className="py-2 px-3 font-medium">Total Tokens</th>
                <th className="py-2 px-3 font-medium text-right">Calculated Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {modelStats.map((stat) => (
                <tr key={stat.modelName} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 text-white font-sans font-medium flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-sky-400" />
                    <span>{stat.modelName}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{stat.callCount}</td>
                  <td className="py-2.5 px-3 text-slate-300">{formatTokens(stat.promptTokens)}</td>
                  <td className="py-2.5 px-3 text-slate-300">{formatTokens(stat.completionTokens)}</td>
                  <td className="py-2.5 px-3 text-sky-300 font-semibold">{formatTokens(stat.totalTokens)}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold text-right">
                    {formatCost(stat.totalCostUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
