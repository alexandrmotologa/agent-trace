import type { AgentRun } from '../types/trace'
import type { AnomalyReport } from '../types/analytics'

function stringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0
  if (!str1 || !str2) return 0.0

  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  if (s1 === s2) return 1.0

  // Bigram Dice similarity coefficient
  const getBigrams = (s: string) => {
    const bigrams = new Set<string>()
    for (let i = 0; i < s.length - 1; i++) {
      bigrams.add(s.slice(i, i + 2))
    }
    return bigrams
  }

  const b1 = getBigrams(s1)
  const b2 = getBigrams(s2)
  if (b1.size === 0 || b2.size === 0) return 0.0

  let intersection = 0
  for (const b of b1) {
    if (b2.has(b)) intersection++
  }

  return (2.0 * intersection) / (b1.size + b2.size)
}

function normalizeArgs(args: Record<string, unknown> | string | undefined): string {
  if (!args) return ''
  if (typeof args === 'string') return args.trim()
  try {
    return JSON.stringify(args)
  } catch {
    return String(args)
  }
}

export function detectAnomalies(run: AgentRun): AnomalyReport[] {
  const anomalies: AnomalyReport[] = []
  const toolSpans = run.spans.filter((s) => s.type === 'tool_call' && s.toolCall)

  // 1. Consecutive identical or near-identical tool calls
  let consecutiveCount = 1
  let consecutiveSpans = [toolSpans[0]]

  for (let i = 1; i < toolSpans.length; i++) {
    const prev = toolSpans[i - 1]
    const curr = toolSpans[i]

    const prevTool = prev.toolCall?.toolName || ''
    const currTool = curr.toolCall?.toolName || ''
    const prevArgs = normalizeArgs(prev.toolCall?.inputArgs)
    const currArgs = normalizeArgs(curr.toolCall?.inputArgs)

    const sameTool = prevTool.toLowerCase() === currTool.toLowerCase()
    const similarity = stringSimilarity(prevArgs, currArgs)

    if (sameTool && similarity >= 0.9) {
      consecutiveCount++
      consecutiveSpans.push(curr)
    } else {
      if (consecutiveCount >= 3) {
        anomalies.push({
          id: `loop-${prev.id}`,
          type: 'infinite_loop',
          severity: consecutiveCount >= 4 ? 'critical' : 'high',
          title: `Cyclic Tool Call Loop (${prevTool})`,
          description: `The agent called tool '${prevTool}' ${consecutiveCount} consecutive times with nearly identical arguments.`,
          stepIndices: consecutiveSpans.map((s) => s.stepIndex),
          spanIds: consecutiveSpans.map((s) => s.id),
          detectedPattern: `${prevTool} invoked ${consecutiveCount}x with similarity >= 90%`,
          recommendation:
            'Implement max retry caps or detect repeated tool arguments in your agent runtime prompts.',
        })
      }
      consecutiveCount = 1
      consecutiveSpans = [curr]
    }
  }

  if (consecutiveCount >= 3 && consecutiveSpans.length > 0) {
    const toolName = consecutiveSpans[0].toolCall?.toolName || 'unknown'
    anomalies.push({
      id: `loop-${consecutiveSpans[0].id}`,
      type: 'infinite_loop',
      severity: consecutiveCount >= 4 ? 'critical' : 'high',
      title: `Cyclic Tool Call Loop (${toolName})`,
      description: `The agent called tool '${toolName}' ${consecutiveCount} consecutive times with nearly identical arguments.`,
      stepIndices: consecutiveSpans.map((s) => s.stepIndex),
      spanIds: consecutiveSpans.map((s) => s.id),
      detectedPattern: `${toolName} invoked ${consecutiveCount}x with similarity >= 90%`,
      recommendation:
        'Add a loop-breaker hook or verify why the agent is not receiving output that satisfies its goal.',
    })
  }

  // 2. Alternating oscillation loop (A -> B -> A -> B -> A -> B)
  if (toolSpans.length >= 4) {
    for (let i = 0; i <= toolSpans.length - 4; i++) {
      const s0 = toolSpans[i]
      const s1 = toolSpans[i + 1]
      const s2 = toolSpans[i + 2]
      const s3 = toolSpans[i + 3]

      const t0 = s0.toolCall?.toolName
      const t1 = s1.toolCall?.toolName
      const t2 = s2.toolCall?.toolName
      const t3 = s3.toolCall?.toolName

      if (t0 && t1 && t0 === t2 && t1 === t3 && t0 !== t1) {
        const id = `oscillation-${s0.id}`
        if (!anomalies.some((a) => a.id === id)) {
          anomalies.push({
            id,
            type: 'infinite_loop',
            severity: 'high',
            title: `Tool Oscillation Loop (${t0} ↔ ${t1})`,
            description: `The agent is flip-flopping repeatedly between '${t0}' and '${t1}'.`,
            stepIndices: [s0.stepIndex, s1.stepIndex, s2.stepIndex, s3.stepIndex],
            spanIds: [s0.id, s1.id, s2.id, s3.id],
            detectedPattern: `Repeated sequence: ${t0} -> ${t1} -> ${t0} -> ${t1}`,
            recommendation:
              'Check whether either tool fails silently or returns instructions that contradict the other tool.',
          })
        }
      }
    }
  }

  // 3. State thrashing detection (agent states flipping without task completion)
  const agentStateSpans = run.spans.filter((s) => s.type === 'agent_state')
  if (agentStateSpans.length >= 6) {
    const states = agentStateSpans.map((s) => s.agentState || 'custom')
    let planCount = 0
    for (const st of states) {
      if (st === 'plan' || st === 'reflect') planCount++
    }
    if (planCount >= 4 && states.length / planCount <= 2.2) {
      anomalies.push({
        id: `thrash-${run.runId}`,
        type: 'state_thrashing',
        severity: 'medium',
        title: 'Cognitive State Thrashing',
        description: `The trajectory shows high frequency of replanning and reflection (${planCount} times) across ${states.length} steps.`,
        stepIndices: agentStateSpans.map((s) => s.stepIndex),
        spanIds: agentStateSpans.map((s) => s.id),
        detectedPattern: 'Excessive re-planning without concrete forward action',
        recommendation:
          'Ensure agent prompt gives definitive guidance on step boundaries and criteria for task satisfaction.',
      })
    }
  }

  // 4. Token bloat / context explosion detection
  for (let i = 1; i < run.steps.length; i++) {
    const prev = run.steps[i - 1]
    const curr = run.steps[i]
    const delta = curr.contextTokenCount - prev.contextTokenCount

    if (delta > 4000) {
      anomalies.push({
        id: `bloat-step-${curr.stepIndex}`,
        type: 'context_bloat',
        severity: delta > 8000 ? 'high' : 'medium',
        title: `Sudden Context Bloat (+${delta.toLocaleString()} tokens)`,
        description: `Step ${curr.stepIndex} introduced a large surge of ${delta.toLocaleString()} tokens into the context window.`,
        stepIndices: [prev.stepIndex, curr.stepIndex],
        spanIds: curr.toolSpanIds,
        detectedPattern: `Token jump from ${prev.contextTokenCount} to ${curr.contextTokenCount}`,
        recommendation:
          'Truncate raw HTML or serialize large JSON query results before injecting into agent context.',
      })
    }
  }

  // 5. Tool failure rate anomaly
  const failedToolSpans = toolSpans.filter((s) => s.status === 'error' || s.toolCall?.isError)
  if (failedToolSpans.length >= 3 || (toolSpans.length > 0 && failedToolSpans.length / toolSpans.length >= 0.5)) {
    anomalies.push({
      id: `tool-failures-${run.runId}`,
      type: 'tool_failure',
      severity: failedToolSpans.length >= 4 ? 'critical' : 'high',
      title: `High Tool Failure Rate (${failedToolSpans.length}/${toolSpans.length})`,
      description: `${failedToolSpans.length} tool executions returned errors or exceptions during this run.`,
      stepIndices: failedToolSpans.map((s) => s.stepIndex),
      spanIds: failedToolSpans.map((s) => s.id),
      detectedPattern: `${Math.round((failedToolSpans.length / (toolSpans.length || 1)) * 100)}% of tool calls failed`,
      recommendation:
        'Inspect tool error outputs in the detail drawer to fix schema mismatches or environmental faults.',
    })
  }

  return anomalies
}
