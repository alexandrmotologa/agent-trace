import type { AgentRun } from '../types/trace'
import type { AnomalyReport } from '../types/analytics'

export interface AutopsyResult {
  isAIGenerated: boolean
  modelUsed: string
  summary: string
  rootCause: string
  poisoningSpan?: string
  suggestedPromptFix: string
}

export function generateDiagnosticPrompt(run: AgentRun, anomalies: AnomalyReport[]): string {
  const errorSpans = run.spans.filter((s) => s.status === 'error' || s.toolCall?.isError)
  const lastStep = run.steps[run.steps.length - 1]

  return `You are an expert AI agent debugger. Analyze this trajectory failure.
Agent Run: "${run.name}" (${run.framework || 'Custom'} framework)
Total Steps: ${run.steps.length}, Total Tokens: ${run.totalTokens}, Duration: ${run.durationMs}ms
Status: ${run.status}

Detected Anomalies:
${anomalies.map((a) => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.description}`).join('\n')}

Failed Spans:
${errorSpans
  .map(
    (s) =>
      `- Span "${s.name}" (Type: ${s.type}): Tool: ${s.toolCall?.toolName || 'none'}, Error: ${
        s.toolCall?.error || 'Unknown error'
      }, Args: ${JSON.stringify(s.toolCall?.inputArgs || {})}`
  )
  .join('\n')}

Last Step Thought:
"${lastStep?.thought || 'No thought recorded'}"

Provide a concise, 3-section autopsy:
1. Root Cause: Why did the agent fail or loop?
2. Poisoning Factor: Which tool call or context chunk triggered the failure?
3. Recommended System Prompt Fix: Exact instruction to add to system prompt to prevent this.`
}

export async function explainFailureLocally(
  run: AgentRun,
  anomalies: AnomalyReport[],
  ollamaModel = 'llama3.2',
  ollamaUrl = 'http://localhost:11434'
): Promise<AutopsyResult> {
  const prompt = generateDiagnosticPrompt(run, anomalies)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      const responseText = data.response as string

      return {
        isAIGenerated: true,
        modelUsed: `Ollama (${ollamaModel})`,
        summary: 'Root-cause analysis generated locally via Ollama without cloud telemetry.',
        rootCause: responseText,
        poisoningSpan: run.spans.find((s) => s.status === 'error')?.name,
        suggestedPromptFix:
          'Review the generated recommendations from your local model above.',
      }
    }
  } catch {
    // Fall through to deterministic heuristic autopsy engine
  }

  // Heuristic rule-based expert autopsy engine
  return generateRuleBasedAutopsy(run, anomalies)
}

function generateRuleBasedAutopsy(
  run: AgentRun,
  anomalies: AnomalyReport[]
): AutopsyResult {
  const errorSpan = run.spans.find((s) => s.status === 'error' || s.toolCall?.isError)
  const infiniteLoopAnomaly = anomalies.find((a) => a.type === 'infinite_loop')
  const bloatAnomaly = anomalies.find((a) => a.type === 'context_bloat')

  let rootCause = ''
  let suggestedPromptFix = ''
  let poisoningSpan = errorSpan?.name || undefined

  if (infiniteLoopAnomaly) {
    rootCause = `The agent entered a recursive reasoning loop on step ${infiniteLoopAnomaly.stepIndices.join(
      ', '
    )}. It called the same tool with identical or trivial argument variations without receiving new information, causing cyclic retry starvation.`
    suggestedPromptFix = `Add to System Prompt:
"When a tool call produces identical output or fails twice consecutively, stop retrying immediately. Synthesize an explanation of the impediment and request human clarification or pivot to an alternative search strategy."`
  } else if (bloatAnomaly) {
    rootCause = `Context window explosion detected at step ${bloatAnomaly.stepIndices.join(
      ', '
    )}. A verbose tool payload overwhelmed the prompt token budget, degrading reasoning comprehension and triggering high latency.`
    suggestedPromptFix = `Add to System Prompt:
"Always summarize or select relevant JSON fields from external tool responses before appending them into internal reasoning memory. Never echo raw HTML or verbose dumps exceeding 500 words."`
  } else if (errorSpan) {
    const toolName = errorSpan.toolCall?.toolName || 'tool'
    const errorMsg = errorSpan.toolCall?.error || 'execution failed'
    rootCause = `Tool failure in "${toolName}" (${errorMsg}). The model did not anticipate an exception from this tool and lacked error-handling fallback logic in its step plan.`
    suggestedPromptFix = `Add to System Prompt:
"Tool calls may return errors or network timeouts. Always inspect tool status codes. If ${toolName} fails, execute fallback procedure or clearly report the error state instead of hallucinating parameters."`
  } else {
    rootCause = `The trajectory concluded without catastrophic errors, but displayed high latency (${run.durationMs}ms) or sub-optimal step chaining across ${run.steps.length} sequential turns.`
    suggestedPromptFix = `Add to System Prompt:
"Plan tool invocations in parallel whenever operations are independent. Aim to minimize sequential round-trips."`
  }

  return {
    isAIGenerated: false,
    modelUsed: 'Agent-Trace Heuristic Diagnostic Engine',
    summary:
      'Deterministic root cause analysis synthesized from span graph anomalies and execution attributes.',
    rootCause,
    poisoningSpan,
    suggestedPromptFix,
  }
}
