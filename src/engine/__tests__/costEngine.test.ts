import { describe, it, expect } from 'vitest'
import { calculateModelCost, computeRunCostBreakdown } from '../costEngine'
import type { AgentRun } from '../../types/trace'

describe('Cost Engine', () => {
  it('calculates expected pricing for OpenAI GPT-4o', () => {
    // 1M prompt = $2.5, 1M completion = $10.0
    const cost = calculateModelCost('gpt-4o', 100_000, 20_000)
    // 0.1 * 2.5 + 0.02 * 10 = 0.25 + 0.2 = 0.45
    expect(cost).toBeCloseTo(0.45, 3)
  })

  it('calculates zero cost for local / Ollama models', () => {
    const cost = calculateModelCost('llama3.1', 500_000, 100_000)
    expect(cost).toBe(0)
  })

  it('computes aggregated breakdown across multiple model spans', () => {
    const mockRun: AgentRun = {
      runId: 'r1',
      name: 'Run',
      startTimeMs: 0,
      endTimeMs: 1000,
      durationMs: 1000,
      status: 'success',
      totalTokens: 3000,
      promptTokens: 2500,
      completionTokens: 500,
      totalCostUsd: 0.01,
      steps: [],
      spans: [
        {
          id: '1',
          traceId: 'r1',
          name: 'call 1',
          type: 'llm_call',
          startTimeMs: 0,
          endTimeMs: 500,
          durationMs: 500,
          status: 'success',
          stepIndex: 1,
          modelName: 'gpt-4o',
          modelUsage: { promptTokens: 1000, completionTokens: 200, totalTokens: 1200 },
        },
        {
          id: '2',
          traceId: 'r1',
          name: 'call 2',
          type: 'llm_call',
          startTimeMs: 550,
          endTimeMs: 950,
          durationMs: 400,
          status: 'success',
          stepIndex: 2,
          modelName: 'gpt-4o',
          modelUsage: { promptTokens: 1500, completionTokens: 300, totalTokens: 1800 },
        },
      ],
    }

    const breakdown = computeRunCostBreakdown(mockRun)
    expect(breakdown.length).toBe(1)
    expect(breakdown[0].modelName).toBe('gpt-4o')
    expect(breakdown[0].callCount).toBe(2)
    expect(breakdown[0].totalTokens).toBe(3000)
    expect(breakdown[0].totalCostUsd).toBeGreaterThan(0)
  })
})
