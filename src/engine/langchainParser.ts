import type { AgentRun, Span, AgentStep, ChatMessage } from '../types/trace'
import { calculateModelCost } from './costEngine'

interface LangChainRun {
  id: string
  name: string
  run_type: 'chain' | 'llm' | 'tool' | string
  start_time: string | number
  end_time?: string | number
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  error?: string
  child_runs?: LangChainRun[]
  extra?: {
    metadata?: Record<string, unknown>
    invocation_params?: Record<string, unknown>
    runtime?: Record<string, unknown>
  }
}

function parseTimeToMs(t?: string | number): number {
  if (!t) return 0
  if (typeof t === 'number') {
    return t > 10_000_000_000 ? Math.floor(t / 1_000_000) : t
  }
  return new Date(t).getTime()
}

export function parseLangChainRun(data: unknown): AgentRun {
  const rootRuns: LangChainRun[] = Array.isArray(data)
    ? data
    : (data as { runs?: LangChainRun[] }).runs
      ? (data as { runs: LangChainRun[] }).runs
      : [data as LangChainRun]

  const flatSpans: Span[] = []
  let minStart = Infinity
  let maxEnd = -Infinity

  function flatten(run: LangChainRun, parentId?: string, depth = 0) {
    const startMs = parseTimeToMs(run.start_time)
    const endMs = parseTimeToMs(run.end_time) || startMs + 150

    if (startMs < minStart) minStart = startMs
    if (endMs > maxEnd) maxEnd = endMs

    const isLlm = run.run_type === 'llm'
    const isTool = run.run_type === 'tool'

    const spanType = isLlm ? 'llm_call' : isTool ? 'tool_call' : 'agent_state'

    const span: Span = {
      id: run.id || `lc-${Math.random().toString(36).slice(2, 9)}`,
      traceId: rootRuns[0]?.id || 'langchain-trace',
      parentId,
      name: run.name || run.run_type || 'Agent Step',
      type: spanType,
      startTimeMs: startMs,
      endTimeMs: endMs,
      durationMs: Math.max(1, endMs - startMs),
      status: run.error ? 'error' : 'success',
      stepIndex: 1,
      rawAttributes: run.extra as Record<string, unknown>,
    }

    if (isLlm) {
      const model =
        String(
          run.extra?.invocation_params?.model_name ||
          run.extra?.invocation_params?.model ||
          run.extra?.metadata?.ls_model_name ||
          'gpt-4o'
        )
      span.modelName = model

      const usage = run.outputs?.llm_output as { token_usage?: { prompt_tokens?: number; completion_tokens?: number } } | undefined
      const promptTokens = usage?.token_usage?.prompt_tokens || 350
      const completionTokens = usage?.token_usage?.completion_tokens || 120
      const totalTokens = promptTokens + completionTokens

      span.modelUsage = {
        promptTokens,
        completionTokens,
        totalTokens,
        costEstimateUsd: calculateModelCost(model, promptTokens, completionTokens),
      }

      span.promptText = typeof run.inputs === 'string' ? run.inputs : JSON.stringify(run.inputs, null, 2)
      span.completionText = typeof run.outputs === 'string' ? run.outputs : JSON.stringify(run.outputs, null, 2)
    } else if (isTool) {
      span.toolCall = {
        toolName: run.name,
        inputArgs: (run.inputs?.input || run.inputs) as Record<string, unknown> || {},
        outputResult: run.outputs?.output || run.outputs,
        error: run.error,
        isError: Boolean(run.error),
        executionTimeMs: span.durationMs,
      }
    } else {
      span.agentThought =
        typeof run.inputs === 'string'
          ? run.inputs
          : run.inputs?.input
            ? String(run.inputs.input)
            : run.name
      span.agentState = depth === 0 ? 'plan' : 'reason'
    }

    flatSpans.push(span)

    if (run.child_runs && run.child_runs.length > 0) {
      for (const child of run.child_runs) {
        flatten(child, span.id, depth + 1)
      }
    }
  }

  for (const root of rootRuns) {
    flatten(root)
  }

  flatSpans.sort((a, b) => a.startTimeMs - b.startTimeMs)

  const baseTime = minStart !== Infinity ? minStart : 0
  for (const s of flatSpans) {
    s.startTimeMs = Math.max(0, s.startTimeMs - baseTime)
    s.endTimeMs = Math.max(s.startTimeMs + s.durationMs, s.endTimeMs - baseTime)
  }

  // Construct steps
  const steps: AgentStep[] = []
  let currentStepIdx = 1
  let promptTokens = 0
  let completionTokens = 0
  let totalCost = 0

  for (const s of flatSpans) {
    if (s.type === 'agent_state') {
      currentStepIdx = steps.length + 1
      s.stepIndex = currentStepIdx

      const contextMsgs: ChatMessage[] = []
      if (s.agentThought) {
        contextMsgs.push({
          role: 'assistant',
          content: s.agentThought,
        })
      }

      steps.push({
        stepIndex: currentStepIdx,
        timestampMs: s.startTimeMs,
        thought: s.agentThought,
        state: s.agentState || 'reason',
        toolSpanIds: [],
        contextMessages: contextMsgs,
        contextTokenCount: 500 * currentStepIdx,
      })
    } else {
      s.stepIndex = Math.max(1, currentStepIdx)
      if (steps.length === 0) {
        steps.push({
          stepIndex: 1,
          timestampMs: s.startTimeMs,
          thought: 'Execution Run',
          state: 'plan',
          toolSpanIds: [],
          contextMessages: [],
          contextTokenCount: 500,
        })
      }
      const activeStep = steps[steps.length - 1]
      if (s.type === 'llm_call') {
        activeStep.llmSpanId = s.id
        if (s.modelUsage) {
          promptTokens += s.modelUsage.promptTokens
          completionTokens += s.modelUsage.completionTokens
          totalCost += s.modelUsage.costEstimateUsd || 0
          activeStep.contextTokenCount = s.modelUsage.promptTokens
        }
      } else if (s.type === 'tool_call') {
        activeStep.toolSpanIds.push(s.id)
      }
    }
  }

  return {
    runId: rootRuns[0]?.id || `lc-${Date.now()}`,
    name: rootRuns[0]?.name || 'LangChain Agent Run',
    framework: 'langchain',
    startTimeMs: 0,
    endTimeMs: maxEnd !== -Infinity && minStart !== Infinity ? maxEnd - minStart : 1500,
    durationMs: maxEnd !== -Infinity && minStart !== Infinity ? maxEnd - minStart : 1500,
    status: flatSpans.some((s) => s.status === 'error') ? 'error' : 'success',
    spans: flatSpans,
    steps,
    totalTokens: promptTokens + completionTokens,
    promptTokens,
    completionTokens,
    totalCostUsd: Number(totalCost.toFixed(6)),
  }
}
