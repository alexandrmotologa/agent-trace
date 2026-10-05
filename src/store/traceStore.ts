import { create } from 'zustand'
import type { AgentRun, Span } from '../types/trace'
import type { AnomalyReport, ModelCostStats, TokenBurnPoint } from '../types/analytics'
import { detectAnomalies } from '../engine/loopDetector'
import { computeRunCostBreakdown } from '../engine/costEngine'
import { normalizeTraceData } from '../engine/normalizer'

interface TraceStoreState {
  activeRun: AgentRun | null
  selectedSpanId: string | null
  selectedStepIndex: number | null
  anomalies: AnomalyReport[]
  modelStats: ModelCostStats[]
  tokenBurnRate: TokenBurnPoint[]
  playbackStep: number
  isPlaying: boolean
  playbackSpeed: number
  filterLane: 'all' | 'agent' | 'llm' | 'tool'
  searchQuery: string
  isLoading: boolean
  error: string | null

  // Actions
  loadRun: (run: AgentRun) => void
  loadTraceContent: (content: string) => void
  loadSample: (sampleFileName: string) => Promise<void>
  selectSpan: (spanId: string | null) => void
  selectStep: (stepIndex: number | null) => void
  setFilterLane: (lane: 'all' | 'agent' | 'llm' | 'tool') => void
  setSearchQuery: (query: string) => void
  setPlaybackStep: (step: number) => void
  setIsPlaying: (playing: boolean) => void
  setPlaybackSpeed: (speed: number) => void
  stepForward: () => void
  stepBackward: () => void
  getSelectedSpan: () => Span | undefined
}

import { useUiStore } from './uiStore'

export const useTraceStore = create<TraceStoreState>((set, get) => ({
  activeRun: null,
  selectedSpanId: null,
  selectedStepIndex: null,
  anomalies: [],
  modelStats: [],
  tokenBurnRate: [],
  playbackStep: 1,
  isPlaying: false,
  playbackSpeed: 1,
  filterLane: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,

  loadRun: (run: AgentRun) => {
    const anomalies = detectAnomalies(run)
    const modelStats = computeRunCostBreakdown(run)

    // Calculate burn points
    let cumulativeToks = 0
    let cumulativeCost = 0
    const tokenBurnRate: TokenBurnPoint[] = run.steps.map((step) => {
      const stepSpans = run.spans.filter((s) => s.stepIndex === step.stepIndex)
      let pTokens = 0
      let cTokens = 0
      let cost = 0

      for (const sp of stepSpans) {
        if (sp.modelUsage) {
          pTokens += sp.modelUsage.promptTokens
          cTokens += sp.modelUsage.completionTokens
          cost += sp.modelUsage.costEstimateUsd || 0
        }
      }

      cumulativeToks += pTokens + cTokens
      cumulativeCost += cost

      return {
        timestampMs: step.timestampMs,
        stepIndex: step.stepIndex,
        promptTokens: pTokens,
        completionTokens: cTokens,
        totalTokens: pTokens + cTokens,
        cumulativeTotalTokens: cumulativeToks,
        cumulativeCostUsd: Number(cumulativeCost.toFixed(6)),
      }
    })

    const initialSpan = run.spans[0]?.id || null

    set({
      activeRun: run,
      selectedSpanId: initialSpan,
      selectedStepIndex: 1,
      playbackStep: run.steps.length,
      anomalies,
      modelStats,
      tokenBurnRate,
      error: null,
    })
  },

  loadTraceContent: (content: string) => {
    try {
      set({ isLoading: true, error: null })
      const normalized = normalizeTraceData(content)
      get().loadRun(normalized)
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to parse trace' })
    } finally {
      set({ isLoading: false })
    }
  },

  loadSample: async (sampleFileName: string) => {
    try {
      set({ isLoading: true, error: null })
      const response = await fetch(`/samples/${sampleFileName}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch sample: ${response.statusText}`)
      }
      const data = await response.json()
      const normalized = normalizeTraceData(data)
      get().loadRun(normalized)
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Failed to load sample' })
    } finally {
      set({ isLoading: false })
    }
  },

  selectSpan: (spanId: string | null) => {
    const { activeRun } = get()
    if (!spanId || !activeRun) {
      set({ selectedSpanId: spanId })
      return
    }
    useUiStore.getState().setDrawerOpen(true)
    const found = activeRun.spans.find((s) => s.id === spanId)
    set({
      selectedSpanId: spanId,
      selectedStepIndex: found ? found.stepIndex : get().selectedStepIndex,
    })
  },

  selectStep: (stepIndex: number | null) => {
    const { activeRun } = get()
    if (!stepIndex || !activeRun) {
      set({ selectedStepIndex: stepIndex })
      return
    }
    const stepSpans = activeRun.spans.filter((s) => s.stepIndex === stepIndex)
    set({
      selectedStepIndex: stepIndex,
      selectedSpanId: stepSpans[0]?.id || get().selectedSpanId,
    })
  },

  setFilterLane: (lane) => set({ filterLane: lane }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPlaybackStep: (step) => set({ playbackStep: step }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  stepForward: () => {
    const { activeRun, playbackStep } = get()
    if (!activeRun) return
    const maxSteps = activeRun.steps.length
    if (playbackStep < maxSteps) {
      const next = playbackStep + 1
      set({ playbackStep: next, selectedStepIndex: next })
    }
  },

  stepBackward: () => {
    const { playbackStep } = get()
    if (playbackStep > 1) {
      const prev = playbackStep - 1
      set({ playbackStep: prev, selectedStepIndex: prev })
    }
  },

  getSelectedSpan: () => {
    const { activeRun, selectedSpanId } = get()
    if (!activeRun || !selectedSpanId) return undefined
    return activeRun.spans.find((s) => s.id === selectedSpanId)
  },
}))
