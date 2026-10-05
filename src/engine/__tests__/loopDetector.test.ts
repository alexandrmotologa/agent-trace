import { describe, it, expect } from 'vitest'
import { detectAnomalies } from '../loopDetector'
import type { AgentRun } from '../../types/trace'

describe('Anomaly & Loop Detector Engine', () => {
  it('detects cyclic repetitive tool calls with identical arguments', () => {
    const loopRun: AgentRun = {
      runId: 'loop-run',
      name: 'Loop Test',
      startTimeMs: 0,
      endTimeMs: 4000,
      durationMs: 4000,
      status: 'error',
      totalTokens: 1000,
      promptTokens: 800,
      completionTokens: 200,
      totalCostUsd: 0.005,
      steps: [],
      spans: [
        {
          id: 'tool-1',
          traceId: 'loop-run',
          name: 'bash_command',
          type: 'tool_call',
          startTimeMs: 100,
          endTimeMs: 500,
          durationMs: 400,
          status: 'error',
          stepIndex: 1,
          toolCall: { toolName: 'bash_command', inputArgs: { cmd: 'pytest' }, executionTimeMs: 400 },
        },
        {
          id: 'tool-2',
          traceId: 'loop-run',
          name: 'bash_command',
          type: 'tool_call',
          startTimeMs: 600,
          endTimeMs: 1000,
          durationMs: 400,
          status: 'error',
          stepIndex: 2,
          toolCall: { toolName: 'bash_command', inputArgs: { cmd: 'pytest' }, executionTimeMs: 400 },
        },
        {
          id: 'tool-3',
          traceId: 'loop-run',
          name: 'bash_command',
          type: 'tool_call',
          startTimeMs: 1100,
          endTimeMs: 1500,
          durationMs: 400,
          status: 'error',
          stepIndex: 3,
          toolCall: { toolName: 'bash_command', inputArgs: { cmd: 'pytest' }, executionTimeMs: 400 },
        },
      ],
    }

    const anomalies = detectAnomalies(loopRun)
    expect(anomalies.some((a) => a.type === 'infinite_loop')).toBe(true)
    const loopAnomaly = anomalies.find((a) => a.type === 'infinite_loop')
    expect(loopAnomaly?.detectedPattern).toContain('bash_command invoked 3x')
  })

  it('detects tool oscillation between two distinct tools', () => {
    const oscRun: AgentRun = {
      runId: 'osc-run',
      name: 'Oscillation Test',
      startTimeMs: 0,
      endTimeMs: 4000,
      durationMs: 4000,
      status: 'success',
      totalTokens: 1000,
      promptTokens: 800,
      completionTokens: 200,
      totalCostUsd: 0.005,
      steps: [],
      spans: [
        {
          id: 's1',
          traceId: 'osc',
          name: 'read_file',
          type: 'tool_call',
          startTimeMs: 100,
          endTimeMs: 200,
          durationMs: 100,
          status: 'success',
          stepIndex: 1,
          toolCall: { toolName: 'read_file', inputArgs: 'a.txt', executionTimeMs: 100 },
        },
        {
          id: 's2',
          traceId: 'osc',
          name: 'write_file',
          type: 'tool_call',
          startTimeMs: 300,
          endTimeMs: 400,
          durationMs: 100,
          status: 'success',
          stepIndex: 2,
          toolCall: { toolName: 'write_file', inputArgs: 'b.txt', executionTimeMs: 100 },
        },
        {
          id: 's3',
          traceId: 'osc',
          name: 'read_file',
          type: 'tool_call',
          startTimeMs: 500,
          endTimeMs: 600,
          durationMs: 100,
          status: 'success',
          stepIndex: 3,
          toolCall: { toolName: 'read_file', inputArgs: 'a.txt', executionTimeMs: 100 },
        },
        {
          id: 's4',
          traceId: 'osc',
          name: 'write_file',
          type: 'tool_call',
          startTimeMs: 700,
          endTimeMs: 800,
          durationMs: 100,
          status: 'success',
          stepIndex: 4,
          toolCall: { toolName: 'write_file', inputArgs: 'b.txt', executionTimeMs: 100 },
        },
      ],
    }

    const anomalies = detectAnomalies(oscRun)
    expect(anomalies.some((a) => a.title.includes('Oscillation'))).toBe(true)
  })

  it('detects sudden context bloat across consecutive steps', () => {
    const bloatRun: AgentRun = {
      runId: 'bloat-run',
      name: 'Bloat Test',
      startTimeMs: 0,
      endTimeMs: 2000,
      durationMs: 2000,
      status: 'success',
      totalTokens: 10000,
      promptTokens: 9000,
      completionTokens: 1000,
      totalCostUsd: 0.05,
      steps: [
        {
          stepIndex: 1,
          timestampMs: 0,
          toolSpanIds: [],
          contextMessages: [],
          contextTokenCount: 200,
        },
        {
          stepIndex: 2,
          timestampMs: 1000,
          toolSpanIds: ['tool-vector'],
          contextMessages: [],
          contextTokenCount: 5200, // +5000 tokens spike
        },
      ],
      spans: [],
    }

    const anomalies = detectAnomalies(bloatRun)
    expect(anomalies.some((a) => a.type === 'context_bloat')).toBe(true)
  })
})
