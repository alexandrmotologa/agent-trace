import React, { useState } from 'react'
import { useTraceStore } from '../../store/traceStore'
import { useUiStore } from '../../store/uiStore'
import { Play, Sparkles, X, Activity } from 'lucide-react'
import type { AgentRun } from '../../types/trace'

export const LiveSimulator: React.FC = () => {
  const isSimulatorOpen = useUiStore((state) => state.isSimulatorOpen)
  const setSimulatorOpen = useUiStore((state) => state.setSimulatorOpen)
  const loadRun = useTraceStore((state) => state.loadRun)

  const [scenario, setScenario] = useState<'coding' | 'research' | 'loop'>('research')
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  if (!isSimulatorOpen) return null

  const handleStartSimulation = async () => {
    setIsRunning(true)
    setCurrentStep(1)

    // Load full sample as base, then feed it in increments
    const sampleFile =
      scenario === 'coding'
        ? 'tool_failure_trace.json'
        : scenario === 'loop'
          ? 'coding_agent_loop.json'
          : 'research_agent_trace.json'

    try {
      const res = await fetch(`/samples/${sampleFile}`)
      const fullRun: AgentRun = await res.json()

      // Progressive simulation
      for (let s = 1; s <= fullRun.steps.length; s++) {
        setCurrentStep(s)
        const partialSpans = fullRun.spans.filter((sp) => sp.stepIndex <= s)
        const partialSteps = fullRun.steps.filter((st) => st.stepIndex <= s)

        const simulatedRun: AgentRun = {
          ...fullRun,
          spans: partialSpans,
          steps: partialSteps,
          durationMs: partialSpans[partialSpans.length - 1]?.endTimeMs || 1000,
        }

        loadRun(simulatedRun)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsRunning(false)
      setSimulatorOpen(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">Real-Time Agent Simulator</h3>
          </div>
          <button
            onClick={() => setSimulatorOpen(false)}
            disabled={isRunning}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="text-slate-400 text-xs">
            Simulate a live autonomous agent streaming spans to the local OTLP collector. Spans
            will populate the canvas in real-time.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-slate-300 font-medium">Select Agent Scenario:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setScenario('research')}
                className={`p-2.5 rounded-lg border text-center transition ${
                  scenario === 'research'
                    ? 'border-violet-500 bg-violet-950/50 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold">Research</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Parallel Search</div>
              </button>

              <button
                onClick={() => setScenario('coding')}
                className={`p-2.5 rounded-lg border text-center transition ${
                  scenario === 'coding'
                    ? 'border-emerald-500 bg-emerald-950/50 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold">Tool Fail</div>
                <div className="text-[10px] text-slate-500 mt-0.5">SQL Recovery</div>
              </button>

              <button
                onClick={() => setScenario('loop')}
                className={`p-2.5 rounded-lg border text-center transition ${
                  scenario === 'loop'
                    ? 'border-red-500 bg-red-950/50 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-semibold">Loop Bug</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Infinite Pytest</div>
              </button>
            </div>
          </div>

          {isRunning && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between font-mono">
              <div className="flex items-center gap-2 text-violet-400">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Simulating Step {currentStep}...</span>
              </div>
              <span className="text-[10px] text-slate-500">1000ms delay/step</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setSimulatorOpen(false)}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleStartSimulation}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Streaming Spans...' : 'Start Live Stream'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
