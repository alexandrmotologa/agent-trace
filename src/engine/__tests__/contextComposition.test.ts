import { describe, it, expect } from 'vitest'
import { computeContextComposition, findWorstRunBloat } from '../contextComposition'
import type { ChatMessage, AgentRun } from '../../types/trace'

describe('contextComposition engine', () => {
  it('handles empty messages gracefully', () => {
    const comp = computeContextComposition([])
    expect(comp.totalTokens).toBe(0)
    expect(comp.segments).toHaveLength(0)
    expect(comp.bloatContributor).toBeUndefined()
  })

  it('correctly aggregates system, user, assistant, and tool tokens', () => {
    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are an autonomous research agent.' },
      { role: 'user', content: 'Find recent arxiv papers on diffusion models.' },
      { role: 'assistant', content: 'I will query the search API.' },
      { role: 'tool', content: '{"papers": ["Paper 1", "Paper 2"]}' },
    ]

    const comp = computeContextComposition(messages)
    expect(comp.totalTokens).toBeGreaterThan(0)
    expect(comp.segments.length).toBe(4)

    const sysSeg = comp.segments.find((s) => s.type === 'system')
    const toolSeg = comp.segments.find((s) => s.type === 'tool')
    expect(sysSeg).toBeDefined()
    expect(toolSeg).toBeDefined()
    expect(sysSeg?.tokenCount).toBeGreaterThan(0)
  })

  it('detects tool bloat when tool output dominates the context window', () => {
    const hugeToolOutput = 'A'.repeat(20000)
    const messages: ChatMessage[] = [
      { role: 'system', content: 'Brief instruction' },
      { role: 'user', content: 'Do something' },
      { role: 'tool', content: hugeToolOutput },
    ]

    const comp = computeContextComposition(messages)
    expect(comp.bloatContributor).toBeDefined()
    expect(comp.bloatContributor?.label).toBe('Tool Outputs')
    expect(comp.bloatContributor?.isDangerousBloat).toBe(true)
  })

  it('finds the worst run bloat step correctly', () => {
    const mockRun: AgentRun = {
      runId: 'run-bloat',
      name: 'Bloat Test Run',
      startTimeMs: 1000,
      endTimeMs: 5000,
      durationMs: 4000,
      status: 'success',
      totalTokens: 10000,
      promptTokens: 8000,
      completionTokens: 2000,
      totalCostUsd: 0.05,
      steps: [
        {
          stepIndex: 1,
          timestampMs: 1000,
          state: 'plan',
          toolSpanIds: [],
          thought: 'Plan step',
          contextTokenCount: 500,
          contextMessages: [],
        },
        {
          stepIndex: 2,
          timestampMs: 2000,
          state: 'act',
          toolSpanIds: ['span-tool-1'],
          thought: 'Tool return huge payload',
          contextTokenCount: 5500, // Delta 5000 tokens
          contextMessages: [],
        },
      ],
      spans: [
        {
          id: 'span-tool-1',
          traceId: 'run-bloat',
          name: 'rag_fetch',
          type: 'tool_call',
          startTimeMs: 2000,
          endTimeMs: 4000,
          durationMs: 2000,
          status: 'success',
          stepIndex: 2,
          toolCall: {
            toolName: 'rag_fetch',
            inputArgs: {},
            outputResult: 'data',
            executionTimeMs: 2000,
          },
        },
      ],
    }

    const worstBloat = findWorstRunBloat(mockRun)
    expect(worstBloat).not.toBeNull()
    expect(worstBloat?.stepIndex).toBe(2)
    expect(worstBloat?.deltaTokens).toBe(5000)
    expect(worstBloat?.toolName).toBe('rag_fetch')
  })
})
