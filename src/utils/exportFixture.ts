import type { AgentRun } from '../types/trace'

export function sanitizeAndExportFixture(run: AgentRun): string {
  const fixture = {
    metadata: {
      exportedAt: new Date().toISOString(),
      agentTraceVersion: '1.0.0',
      runId: run.runId,
      name: run.name,
      framework: run.framework || 'agent-trace',
      totalDurationMs: run.durationMs,
      totalTokens: run.totalTokens,
      estimatedCostUsd: run.totalCostUsd,
    },
    mockSteps: run.steps.map((step) => {
      const stepSpans = run.spans.filter((s) => s.stepIndex === step.stepIndex)
      const llmSpan = stepSpans.find((s) => s.type === 'llm_call')
      const toolSpans = stepSpans.filter((s) => s.type === 'tool_call')

      return {
        stepIndex: step.stepIndex,
        thought: step.thought,
        state: step.state,
        simulatedLlmResponse: llmSpan
          ? {
              model: llmSpan.modelName,
              prompt: llmSpan.promptText,
              completion: llmSpan.completionText,
              usage: llmSpan.modelUsage,
            }
          : undefined,
        mockToolOutputs: toolSpans.map((ts) => ({
          toolName: ts.toolCall?.toolName,
          input: ts.toolCall?.inputArgs,
          output: ts.toolCall?.outputResult,
          error: ts.toolCall?.error,
        })),
      }
    }),
    fullTrace: run,
  }

  return JSON.stringify(fixture, null, 2)
}

export function triggerDownload(content: string, filename: string, mimeType = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
