import type { OtlpTracePayload, OtlpKeyValue } from '../types/otlp'
import type { AgentRun, Span, SpanType, AgentStep } from '../types/trace'
import { calculateModelCost } from './costEngine'

function extractAttributeValue(kv: OtlpKeyValue): unknown {
  const v = kv.value
  if (v.stringValue !== undefined) return v.stringValue
  if (v.boolValue !== undefined) return v.boolValue
  if (v.intValue !== undefined) return Number(v.intValue)
  if (v.doubleValue !== undefined) return v.doubleValue
  if (v.arrayValue?.values) {
    return v.arrayValue.values.map((item) => {
      const temp: OtlpKeyValue = { key: '', value: item }
      return extractAttributeValue(temp)
    })
  }
  return null
}

function attributesToMap(attributes?: OtlpKeyValue[]): Record<string, unknown> {
  const map: Record<string, unknown> = {}
  if (!attributes) return map
  for (const attr of attributes) {
    map[attr.key] = extractAttributeValue(attr)
  }
  return map
}

function parseNanoToMs(nanoStrOrNum: string | number | undefined): number {
  if (!nanoStrOrNum) return 0
  const num = typeof nanoStrOrNum === 'string' ? Number(nanoStrOrNum) : nanoStrOrNum
  // Convert nanoseconds to milliseconds
  return Math.floor(num / 1_000_000)
}

export function parseOtlpTrace(payload: OtlpTracePayload): AgentRun {
  const spans: Span[] = []
  let minStart = Infinity
  let maxEnd = -Infinity

  for (const resSpan of payload.resourceSpans || []) {
    for (const scopeSpan of resSpan.scopeSpans || []) {
      for (const otlpSpan of scopeSpan.spans || []) {
        const startMs = parseNanoToMs(otlpSpan.startTimeUnixNano)
        const endMs = parseNanoToMs(otlpSpan.endTimeUnixNano) || startMs + 100
        if (startMs < minStart) minStart = startMs
        if (endMs > maxEnd) maxEnd = endMs

        const attrs = attributesToMap(otlpSpan.attributes)
        const nameLower = otlpSpan.name.toLowerCase()

        let spanType: SpanType = 'agent_state'
        if (
          attrs['gen_ai.system'] ||
          attrs['gen_ai.request.model'] ||
          nameLower.includes('chat') ||
          nameLower.includes('completion') ||
          nameLower.includes('llm')
        ) {
          spanType = 'llm_call'
        } else if (
          attrs['gen_ai.tool.name'] ||
          nameLower.includes('tool') ||
          nameLower.includes('search') ||
          nameLower.includes('bash') ||
          nameLower.includes('read_') ||
          nameLower.includes('execute')
        ) {
          spanType = 'tool_call'
        }

        const promptTokens = Number(
          attrs['gen_ai.usage.input_tokens'] ?? attrs['gen_ai.usage.prompt_tokens'] ?? 0
        )
        const completionTokens = Number(
          attrs['gen_ai.usage.output_tokens'] ?? attrs['gen_ai.usage.completion_tokens'] ?? 0
        )
        const totalTokens = promptTokens + completionTokens
        const modelName = String(
          attrs['gen_ai.response.model'] ?? attrs['gen_ai.request.model'] ?? 'unknown'
        )

        const isError =
          (otlpSpan.status?.code !== undefined && otlpSpan.status.code === 2) ||
          Boolean(attrs['error'])

        const span: Span = {
          id: otlpSpan.spanId,
          traceId: otlpSpan.traceId,
          parentId: otlpSpan.parentSpanId,
          name: otlpSpan.name,
          type: spanType,
          startTimeMs: startMs,
          endTimeMs: endMs,
          durationMs: Math.max(1, endMs - startMs),
          status: isError ? 'error' : 'success',
          stepIndex: 1, // Will be computed in chronological order
          rawAttributes: attrs,
        }

        if (spanType === 'llm_call') {
          span.modelName = modelName
          span.modelUsage = {
            promptTokens,
            completionTokens,
            totalTokens,
            costEstimateUsd: calculateModelCost(modelName, promptTokens, completionTokens),
          }
          span.promptText = String(attrs['gen_ai.prompt'] || '')
          span.completionText = String(attrs['gen_ai.completion'] || '')
        } else if (spanType === 'tool_call') {
          const toolName = String(attrs['gen_ai.tool.name'] || otlpSpan.name)
          const args = (attrs['gen_ai.tool.args'] as Record<string, unknown>) || {}
          span.toolCall = {
            toolName,
            inputArgs: args,
            outputResult: attrs['gen_ai.tool.result'],
            error: attrs['gen_ai.tool.error'] ? String(attrs['gen_ai.tool.error']) : undefined,
            isError,
            executionTimeMs: span.durationMs,
          }
        } else {
          span.agentThought = String(attrs['agent.thought'] || attrs['description'] || otlpSpan.name)
          span.agentState = 'reason'
        }

        spans.push(span)
      }
    }
  }

  // Sort spans chronologically
  spans.sort((a, b) => a.startTimeMs - b.startTimeMs)

  // Re-base times to 0-offset
  const baseTime = minStart !== Infinity ? minStart : 0
  for (const s of spans) {
    s.startTimeMs = Math.max(0, s.startTimeMs - baseTime)
    s.endTimeMs = Math.max(s.startTimeMs + s.durationMs, s.endTimeMs - baseTime)
  }

  // Assign step indices based on sequence
  let currentStep = 1
  const steps: AgentStep[] = []
  let promptTokensTotal = 0
  let completionTokensTotal = 0
  let totalCost = 0

  for (let i = 0; i < spans.length; i++) {
    const s = spans[i]
    if (s.type === 'agent_state') {
      currentStep = steps.length + 1
      s.stepIndex = currentStep
      steps.push({
        stepIndex: currentStep,
        timestampMs: s.startTimeMs,
        thought: s.agentThought,
        state: s.agentState || 'reason',
        toolSpanIds: [],
        contextMessages: [],
        contextTokenCount: 0,
      })
    } else {
      s.stepIndex = Math.max(1, currentStep)
      if (steps.length === 0) {
        steps.push({
          stepIndex: 1,
          timestampMs: s.startTimeMs,
          thought: 'Initial Step',
          state: 'plan',
          toolSpanIds: [],
          contextMessages: [],
          contextTokenCount: 0,
        })
      }
      const activeStep = steps[steps.length - 1]
      if (s.type === 'llm_call') {
        activeStep.llmSpanId = s.id
        if (s.modelUsage) {
          promptTokensTotal += s.modelUsage.promptTokens
          completionTokensTotal += s.modelUsage.completionTokens
          totalCost += s.modelUsage.costEstimateUsd || 0
          activeStep.contextTokenCount = s.modelUsage.promptTokens
        }
      } else if (s.type === 'tool_call') {
        activeStep.toolSpanIds.push(s.id)
      }
    }
  }

  return {
    runId: spans[0]?.traceId || `otlp-${Date.now()}`,
    name: 'OTLP OpenTelemetry Trace Run',
    framework: 'otlp',
    startTimeMs: 0,
    endTimeMs: maxEnd !== -Infinity && minStart !== Infinity ? maxEnd - minStart : 1000,
    durationMs: maxEnd !== -Infinity && minStart !== Infinity ? maxEnd - minStart : 1000,
    status: spans.some((s) => s.status === 'error') ? 'error' : 'success',
    spans,
    steps,
    totalTokens: promptTokensTotal + completionTokensTotal,
    promptTokens: promptTokensTotal,
    completionTokens: completionTokensTotal,
    totalCostUsd: Number(totalCost.toFixed(6)),
  }
}
