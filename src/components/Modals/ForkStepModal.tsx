import React, { useState } from 'react'
import { useTraceStore } from '../../store/traceStore'
import { useUiStore } from '../../store/uiStore'
import { estimateTokenCount } from '../../engine/diffEngine'
import { formatTokens } from '../../utils/formatters'
import { GitFork, X, Plus } from 'lucide-react'
import type { AgentStep, Span } from '../../types/trace'

export const ForkStepModal: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const loadRun = useTraceStore((state) => state.loadRun)
  const selectedStepIndex = useTraceStore((state) => state.selectedStepIndex) || 1
  const isForkModalOpen = useUiStore((state) => state.isForkModalOpen)
  const setForkModalOpen = useUiStore((state) => state.setForkModalOpen)

  const activeStep = activeRun?.steps.find((s) => s.stepIndex === selectedStepIndex)

  const [thought, setThought] = useState(activeStep?.thought || '')
  const [editedPrompt, setEditedPrompt] = useState(
    activeStep?.contextMessages[activeStep.contextMessages.length - 1]?.content || ''
  )
  const [simulatedReturn, setSimulatedReturn] = useState(
    '{"status": "success", "result": "Alternative tool response with strict JSON"}'
  )

  if (!isForkModalOpen || !activeRun || !activeStep) return null

  const tokenEstimate = estimateTokenCount(editedPrompt) + estimateTokenCount(simulatedReturn)

  const handleApplyFork = () => {
    // Clone run and insert forked step
    const nextStepIndex = activeRun.steps.length + 1
    const newStep: AgentStep = {
      stepIndex: nextStepIndex,
      timestampMs: activeRun.durationMs + 300,
      thought: `[Forked from #${selectedStepIndex}] ${thought}`,
      state: 'act',
      toolSpanIds: [`tool-fork-${Date.now()}`],
      contextMessages: [
        ...activeStep.contextMessages,
        { role: 'assistant', content: thought },
        { role: 'user', content: editedPrompt },
      ],
      contextTokenCount: tokenEstimate,
    }

    const newSpan: Span = {
      id: `span-fork-${Date.now()}`,
      traceId: activeRun.runId,
      name: `Forked Reasoning #${nextStepIndex}`,
      type: 'agent_state',
      startTimeMs: activeRun.durationMs + 300,
      endTimeMs: activeRun.durationMs + 900,
      durationMs: 600,
      status: 'success',
      stepIndex: nextStepIndex,
      agentThought: thought,
      agentState: 'act',
    }

    const updatedRun = {
      ...activeRun,
      steps: [...activeRun.steps, newStep],
      spans: [...activeRun.spans, newSpan],
      durationMs: activeRun.durationMs + 1000,
      endTimeMs: activeRun.durationMs + 1000,
    }

    loadRun(updatedRun)
    setForkModalOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">
              What-If Sandbox: Fork Step #{selectedStepIndex}
            </h3>
          </div>
          <button
            onClick={() => setForkModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          <p className="text-slate-400 text-xs">
            Edit the reasoning instruction or simulated tool return to test an alternative trajectory
            without re-running expensive LLM APIs.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-medium">Alternative Agent Thought / Action</label>
            <input
              type="text"
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              placeholder="e.g. Instead of retrying pytest, format JSON query"
              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-medium">Prompt / Instruction Modification</label>
            <textarea
              rows={4}
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-medium">Simulated Tool Return Payload</label>
            <textarea
              rows={3}
              value={simulatedReturn}
              onChange={(e) => setSimulatedReturn(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-slate-400 font-mono text-[11px]">
            <span>Estimated Token Impact:</span>
            <span className="text-emerald-400 font-semibold">{formatTokens(tokenEstimate)} tok</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setForkModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFork}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Fork & Append Step #{activeRun.steps.length + 1}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
