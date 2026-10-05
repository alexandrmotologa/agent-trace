import { describe, it, expect } from 'vitest'
import { generateDiagnosticPrompt, explainFailureLocally } from '../autopsyEngine'
import type { AgentRun } from '../../types/trace'
import type { AnomalyReport } from '../../types/analytics'

const mockFailedRun: AgentRun = {
  runId: 'trace-autopsy-1',
  name: 'Looping Code Debugger',
  framework: 'langchain',
  startTimeMs: 0,
  endTimeMs: 4000,
  durationMs: 4000,
  status: 'error',
  totalTokens: 6000,
  promptTokens: 5000,
  completionTokens: 1000,
  totalCostUsd: 0.03,
  steps: [
    {
      stepIndex: 1,
      timestampMs: 0,
      thought: 'Trying to run bash test',
      state: 'act',
      toolSpanIds: ['span-err-1'],
      contextMessages: [],
      contextTokenCount: 1500,
    },
    {
      stepIndex: 2,
      timestampMs: 2000,
      thought: 'Retrying bash test with same command',
      state: 'act',
      toolSpanIds: ['span-err-2'],
      contextMessages: [],
      contextTokenCount: 3000,
    },
  ],
  spans: [
    {
      id: 'span-err-1',
      traceId: 'trace-autopsy-1',
      name: 'execute_bash',
      type: 'tool_call',
      startTimeMs: 500,
      endTimeMs: 1500,
      durationMs: 1000,
      status: 'error',
      stepIndex: 1,
      toolCall: {
        toolName: 'execute_bash',
        inputArgs: { command: 'pytest tests/' },
        error: 'Exit code 1: ModuleNotFoundError: No module named requests',
        isError: true,
        executionTimeMs: 1000,
      },
    },
  ],
}

const mockLoopAnomaly: AnomalyReport = {
  id: 'anom-loop',
  type: 'infinite_loop',
  severity: 'critical',
  title: 'Cyclic Tool Retry Loop',
  description: 'Repeated identical tool call execute_bash 3 times without progress.',
  stepIndices: [1, 2],
  spanIds: ['span-err-1'],
  detectedPattern: 'repeated_identical_tool',
  recommendation: 'Break retry loop',
}

describe('autopsyEngine', () => {
  it('generates a comprehensive diagnostic prompt with run metadata and anomalies', () => {
    const prompt = generateDiagnosticPrompt(mockFailedRun, [mockLoopAnomaly])
    expect(prompt).toContain('Looping Code Debugger')
    expect(prompt).toContain('Cyclic Tool Retry Loop')
    expect(prompt).toContain('execute_bash')
    expect(prompt).toContain('ModuleNotFoundError')
  })

  it('synthesizes a structured root cause autopsy with actionable prompt fix', async () => {
    // Calling explainFailureLocally will fallback to the expert rule engine if Ollama is offline
    const autopsy = await explainFailureLocally(mockFailedRun, [mockLoopAnomaly], 'test-model', 'http://127.0.0.1:9999')
    expect(autopsy).toBeDefined()
    expect(autopsy.rootCause).toContain('recursive reasoning loop')
    expect(autopsy.suggestedPromptFix).toContain('Add to System Prompt')
    expect(autopsy.suggestedPromptFix).toContain('stop retrying immediately')
  })
})
