import type { AgentRun } from '../types/trace'

function cleanText(str: string): string {
  return str
    .replace(/["\n\r;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function generateMermaidSequenceDiagram(run: AgentRun): string {
  const lines: string[] = []
  lines.push('sequenceDiagram')
  lines.push('  autonumber')
  lines.push('  actor User as User')
  lines.push('  participant Agent as Agent Reasoner')
  lines.push('  participant LLM as Model Inference')
  lines.push('  participant Tool as Tool Execution')

  lines.push('  User->>Agent: Start Trajectory')

  for (const step of run.steps) {
    const stepSpans = run.spans.filter((s) => s.stepIndex === step.stepIndex)
    const agentSpan = stepSpans.find((s) => s.type === 'agent_state')
    const llmSpan = stepSpans.find((s) => s.type === 'llm_call')
    const toolSpans = stepSpans.filter((s) => s.type === 'tool_call')

    if (agentSpan?.agentThought) {
      const thought = cleanText(agentSpan.agentThought).slice(0, 60)
      lines.push(`  Note over Agent: Step ${step.stepIndex} [${(step.state || 'reason').toUpperCase()}]: ${thought}...`)
    }

    if (llmSpan) {
      const model = llmSpan.modelName || 'LLM'
      const promptSnippet = cleanText(llmSpan.promptText || 'Input context').slice(0, 45)
      const compSnippet = cleanText(llmSpan.completionText || 'Generated completion').slice(0, 45)
      lines.push(`  Agent->>LLM: [${model}] ${promptSnippet}...`)
      lines.push(`  LLM-->>Agent: ${compSnippet}...`)
    }

    for (const ts of toolSpans) {
      const toolName = ts.toolCall?.toolName || 'tool'
      const isErr = ts.status === 'error' || ts.toolCall?.isError
      const args = cleanText(JSON.stringify(ts.toolCall?.inputArgs || '')).slice(0, 40)
      lines.push(`  Agent->>Tool: ${toolName}(${args}...)`)
      if (isErr) {
        lines.push(`  Tool--xAgent: [ERROR] ${cleanText(ts.toolCall?.error || 'Failed').slice(0, 45)}`)
      } else {
        lines.push(`  Tool-->>Agent: [SUCCESS] Returned data`)
      }
    }
  }

  lines.push('  Agent-->>User: Trajectory Completed')
  return lines.join('\n')
}

export function generateMermaidFlowchart(run: AgentRun): string {
  const lines: string[] = []
  lines.push('flowchart TD')
  lines.push('  Start([User Request]) --> Step1')

  for (let i = 0; i < run.steps.length; i++) {
    const step = run.steps[i]
    const stepId = `Step${step.stepIndex}`
    const stateName = (step.state || 'reason').toUpperCase()
    const thought = cleanText(step.thought || 'Processing').slice(0, 40)

    lines.push(`  ${stepId}["<b>Step ${step.stepIndex} [${stateName}]</b><br/>${thought}"]`)

    const stepSpans = run.spans.filter((s) => s.stepIndex === step.stepIndex)
    const llmSpan = stepSpans.find((s) => s.type === 'llm_call')
    const toolSpans = stepSpans.filter((s) => s.type === 'tool_call')

    if (llmSpan) {
      const llmId = `LLM_${step.stepIndex}`
      lines.push(`  ${stepId} --> ${llmId}["🤖 ${llmSpan.modelName || 'LLM'} (${llmSpan.durationMs}ms)"]`)
    }

    for (let t = 0; t < toolSpans.length; t++) {
      const ts = toolSpans[t]
      const toolId = `Tool_${step.stepIndex}_${t}`
      const isErr = ts.status === 'error' || ts.toolCall?.isError
      const toolLabel = `🔧 ${ts.toolCall?.toolName || 'Tool'} (${ts.durationMs}ms)`
      lines.push(`  ${stepId} --> ${toolId}["${toolLabel}"]`)
      if (isErr) {
        lines.push(`  style ${toolId} fill:#450a0a,stroke:#dc2626,color:#fca5a5`)
      }
    }

    if (i < run.steps.length - 1) {
      const nextStepId = `Step${run.steps[i + 1].stepIndex}`
      lines.push(`  ${stepId} -.-> ${nextStepId}`)
    }
  }

  lines.push(`  Step${run.steps[run.steps.length - 1].stepIndex} --> Finish([Completed Trajectory])`)
  return lines.join('\n')
}
