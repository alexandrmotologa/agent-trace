import type { AgentRun } from '../types/trace'
import type { AnomalyReport, ModelCostStats } from '../types/analytics'
import { formatDuration, formatTokens, formatCost } from './formatters'

export function generateMarkdownReport(
  run: AgentRun,
  anomalies: AnomalyReport[],
  modelStats: ModelCostStats[]
): string {
  const lines: string[] = []

  lines.push(`# Agent-Trace Audit Report: ${run.name}`)
  lines.push(`- **Run ID**: \`${run.runId}\``)
  lines.push(`- **Framework**: ${run.framework?.toUpperCase() || 'UNKNOWN'}`)
  lines.push(`- **Status**: ${run.status.toUpperCase()}`)
  lines.push(`- **Duration**: ${formatDuration(run.durationMs)}`)
  lines.push(`- **Total Tokens**: ${formatTokens(run.totalTokens)} (Prompt: ${formatTokens(run.promptTokens)}, Completion: ${formatTokens(run.completionTokens)})`)
  lines.push(`- **Estimated Cost**: ${formatCost(run.totalCostUsd)}`)
  lines.push(`- **Steps**: ${run.steps.length}`)
  lines.push(`- **Spans**: ${run.spans.length}`)
  lines.push('')

  lines.push('## Anomaly & Loop Diagnostic')
  if (anomalies.length === 0) {
    lines.push('No anomalies, cyclic loops, or context bloat detected during this run.')
  } else {
    for (const anom of anomalies) {
      lines.push(`### [${anom.severity.toUpperCase()}] ${anom.title}`)
      lines.push(`${anom.description}`)
      lines.push(`- Pattern: \`${anom.detectedPattern}\``)
      lines.push(`- Recommendation: ${anom.recommendation}`)
      lines.push('')
    }
  }

  lines.push('## Model Usage & Cost Breakdown')
  lines.push('| Model | Calls | Prompt Tokens | Completion Tokens | Total Cost |')
  lines.push('| :--- | :--- | :--- | :--- | :--- |')
  for (const stat of modelStats) {
    lines.push(
      `| \`${stat.modelName}\` | ${stat.callCount} | ${formatTokens(stat.promptTokens)} | ${formatTokens(stat.completionTokens)} | ${formatCost(stat.totalCostUsd)} |`
    )
  }
  lines.push('')

  lines.push('## Step Trajectory Summary')
  lines.push('| Step | State | Thought | Tool Calls | Context Tokens |')
  lines.push('| :--- | :--- | :--- | :--- | :--- |')
  for (const step of run.steps) {
    const thought = (step.thought || 'N/A').replace(/\|/g, '\\|')
    const toolCount = step.toolSpanIds.length
    lines.push(
      `| ${step.stepIndex} | \`${step.state || 'none'}\` | ${thought.slice(0, 75)}${thought.length > 75 ? '...' : ''} | ${toolCount} | ${step.contextTokenCount} |`
    )
  }

  return lines.join('\n')
}
