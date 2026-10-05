import type { AgentRun } from '../types/trace'
import { parseOtlpTrace } from './otlpParser'
import { parseLangChainRun } from './langchainParser'
import type { OtlpTracePayload } from '../types/otlp'

export function isOtlpPayload(data: unknown): data is OtlpTracePayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    'resourceSpans' in data &&
    Array.isArray((data as OtlpTracePayload).resourceSpans)
  )
}

export function isLangChainPayload(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false
  if (Array.isArray(data)) {
    return data.some((item) => item && typeof item === 'object' && 'run_type' in item)
  }
  return 'run_type' in data || ('runs' in data && Array.isArray((data as { runs: unknown[] }).runs))
}

export function isNativeAgentRun(data: unknown): data is AgentRun {
  if (typeof data !== 'object' || data === null) return false
  const run = data as Partial<AgentRun>
  return Boolean(
    run.runId &&
    Array.isArray(run.spans) &&
    run.spans.length > 0 &&
    typeof run.durationMs === 'number'
  )
}

export function parseJsonl(content: string): unknown[] {
  const lines = content.split('\n')
  const results: unknown[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      results.push(JSON.parse(trimmed))
    } catch {
      // Skip invalid JSON lines
    }
  }
  return results
}

export function normalizeTraceData(input: string | unknown): AgentRun {
  let parsed: unknown = input

  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsed = JSON.parse(trimmed)
      } catch {
        // Might be JSONL
        const jsonlItems = parseJsonl(trimmed)
        if (jsonlItems.length > 0) {
          parsed = jsonlItems
        } else {
          throw new Error('Invalid JSON or JSONL format')
        }
      }
    } else {
      const jsonlItems = parseJsonl(trimmed)
      if (jsonlItems.length > 0) {
        parsed = jsonlItems
      } else {
        throw new Error('Invalid trace data string')
      }
    }
  }

  // 1. Native AgentRun
  if (isNativeAgentRun(parsed)) {
    // Ensure all steps and totals are populated
    let promptToks = parsed.promptTokens || 0
    let compToks = parsed.completionTokens || 0
    if (!promptToks && !compToks) {
      for (const span of parsed.spans) {
        if (span.modelUsage) {
          promptToks += span.modelUsage.promptTokens
          compToks += span.modelUsage.completionTokens
        }
      }
      parsed.promptTokens = promptToks
      parsed.completionTokens = compToks
      parsed.totalTokens = promptToks + compToks
    }
    return parsed
  }

  // 2. OpenTelemetry JSON
  if (isOtlpPayload(parsed)) {
    return parseOtlpTrace(parsed)
  }

  // 3. LangChain Run JSON
  if (isLangChainPayload(parsed)) {
    return parseLangChainRun(parsed)
  }

  // Fallback: If it's an array of items
  if (Array.isArray(parsed) && parsed.length > 0) {
    if (isLangChainPayload(parsed[0])) {
      return parseLangChainRun(parsed)
    }
  }

  throw new Error(
    'Unrecognized trace format. Supported formats: Agent-Trace Native JSON, OpenTelemetry (OTLP) HTTP payload, LangChain run export JSON.'
  )
}
