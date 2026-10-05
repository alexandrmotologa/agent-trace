import React, { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react'
import { useTraceStore } from '../../store/traceStore'
import { SpanNode } from './SpanNode'
import { LaneHeader } from './LaneHeader'
import { TimeScrubber } from './TimeScrubber'
import { SmartCanvasControls } from './SmartCanvasControls'
import type { Span } from '../../types/trace'

const nodeTypes = {
  spanNode: SpanNode,
}

export const TimelineCanvas: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const selectedSpanId = useTraceStore((state) => state.selectedSpanId)
  const filterLane = useTraceStore((state) => state.filterLane)
  const triageFilter = useTraceStore((state) => state.triageFilter)
  const searchQuery = useTraceStore((state) => state.searchQuery.toLowerCase().trim())
  const playbackStep = useTraceStore((state) => state.playbackStep)

  // Layout calculation
  const { nodes, edges } = useMemo(() => {
    if (!activeRun || activeRun.spans.length === 0) {
      return { nodes: [], edges: [] }
    }

    const visibleSpans = activeRun.spans.filter((s) => {
      // Step playback filter
      if (s.stepIndex > playbackStep) return false

      // Lane filter
      if (filterLane === 'agent' && s.type !== 'agent_state') return false
      if (filterLane === 'llm' && s.type !== 'llm_call') return false
      if (filterLane === 'tool' && s.type !== 'tool_call') return false

      // Triage filter
      if (triageFilter === 'errors_only') {
        const isErr = s.status === 'error' || s.toolCall?.isError
        if (!isErr) return false
      } else if (triageFilter === 'slow_only') {
        if (s.durationMs < 1000) return false
      } else if (triageFilter === 'high_tokens') {
        if ((s.modelUsage?.totalTokens || 0) < 1000) return false
      }

      // Search filter
      if (searchQuery) {
        const text = `${s.name} ${s.modelName || ''} ${s.toolCall?.toolName || ''} ${s.agentThought || ''} ${s.promptText || ''}`.toLowerCase()
        if (!text.includes(searchQuery)) return false
      }

      return true
    })


    const nodesList: Node[] = []
    const edgesList: Edge[] = []

    // Lane Y coordinates
    const LANE_Y: Record<string, number> = {
      agent_state: 70,
      llm_call: 220,
      tool_call: 370,
    }

    // Lane tracking for horizontal layout
    const laneLastRight: Record<string, number> = {
      agent_state: 40,
      llm_call: 40,
      tool_call: 40,
    }

    // Time scaling: ~0.4 px per millisecond
    const TIME_SCALE = 0.45

    for (const span of visibleSpans) {
      const laneKey = span.type
      const idealX = 40 + span.startTimeMs * TIME_SCALE
      const lastRight = laneLastRight[laneKey] || 40

      // Ensure at least 15px margin between nodes in the same lane
      const x = Math.max(idealX, lastRight + 15)
      const y = LANE_Y[laneKey] || 70

      const nodeWidth = 230
      laneLastRight[laneKey] = x + nodeWidth

      nodesList.push({
        id: span.id,
        type: 'spanNode',
        position: { x, y },
        data: {
          span,
          isSelected: span.id === selectedSpanId,
        },
      })
    }

    // Build edges for parent-child relations and sequential reasoning
    for (const span of visibleSpans) {
      if (span.parentId && visibleSpans.some((s) => s.id === span.parentId)) {
        edgesList.push({
          id: `e-${span.parentId}-${span.id}`,
          source: span.parentId,
          target: span.id,
          animated: true,
          style: { stroke: '#6366f1', strokeWidth: 1.5, opacity: 0.6 },
        })
      }
    }

    // Connect consecutive agent states to show reasoning trajectory
    const agentStates = visibleSpans.filter((s) => s.type === 'agent_state')
    for (let i = 0; i < agentStates.length - 1; i++) {
      const from = agentStates[i]
      const to = agentStates[i + 1]
      edgesList.push({
        id: `flow-${from.id}-${to.id}`,
        source: from.id,
        target: to.id,
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 1.5, strokeDasharray: '4,4', opacity: 0.7 },
      })
    }

    return { nodes: nodesList, edges: edgesList }
  }, [activeRun, selectedSpanId, filterLane, searchQuery, playbackStep])

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* Visual Lane backdrop lanes */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <div className="absolute top-[40px] left-0 right-0 h-[130px] border-y border-violet-950/20 bg-violet-950/5 flex items-start pl-48 pt-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-violet-500/40">
            Lane A: Agent Thoughts & Plan States
          </span>
        </div>
        <div className="absolute top-[190px] left-0 right-0 h-[130px] border-y border-sky-950/20 bg-sky-950/5 flex items-start pl-48 pt-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-sky-500/40">
            Lane B: LLM Inferences & Token Generations
          </span>
        </div>
        <div className="absolute top-[340px] left-0 right-0 h-[130px] border-y border-emerald-950/20 bg-emerald-950/5 flex items-start pl-48 pt-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-500/40">
            Lane C: Tool Executions & External I/O
          </span>
        </div>
      </div>

      <LaneHeader />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#334155"
          className="opacity-40"
        />
        <Controls
          className="!bg-slate-900 !border-slate-800 !rounded-lg !shadow-xl !fill-slate-300"
          showInteractive={false}
        />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-slate-900/90 !border-slate-800 !rounded-lg !overflow-hidden"
          nodeColor={(node) => {
            const span = (node.data as { span?: Span })?.span
            if (!span) return '#64748b'
            if (span.status === 'error') return '#ef4444'
            if (span.type === 'agent_state') return '#8b5cf6'
            if (span.type === 'llm_call') return '#0284c7'
            return '#10b981'
          }}
        />
        <SmartCanvasControls />
      </ReactFlow>

      <TimeScrubber />
    </div>
  )
}
