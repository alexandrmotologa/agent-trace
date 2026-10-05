export type AnomalyType =
  | 'infinite_loop'
  | 'context_bloat'
  | 'state_thrashing'
  | 'high_latency'
  | 'tool_failure'

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AnomalyReport {
  id: string
  type: AnomalyType
  severity: AnomalySeverity
  title: string
  description: string
  stepIndices: number[]
  spanIds: string[]
  detectedPattern: string
  recommendation: string
}

export interface TokenBurnPoint {
  timestampMs: number
  stepIndex: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  cumulativeTotalTokens: number
  cumulativeCostUsd: number
}

export interface ModelCostStats {
  modelName: string
  callCount: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  totalCostUsd: number
}

export interface TrajectoryAnalytics {
  runId: string
  durationMs: number
  totalTokens: number
  promptTokens: number
  completionTokens: number
  totalCostUsd: number
  toolExecutionCount: number
  llmCallCount: number
  errorCount: number
  anomalies: AnomalyReport[]
  burnRate: TokenBurnPoint[]
  modelBreakdown: ModelCostStats[]
}
