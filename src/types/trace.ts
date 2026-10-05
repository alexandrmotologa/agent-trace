export type SpanType = 'agent_state' | 'llm_call' | 'tool_call'

export type AgentState = 'plan' | 'reason' | 'act' | 'reflect' | 'synthesize' | 'custom'

export type SpanStatus = 'success' | 'error' | 'running' | 'pending'

export interface ModelUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costEstimateUsd?: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string
  toolCallId?: string
  toolCalls?: Array<{
    id: string
    name: string
    arguments: Record<string, unknown> | string
  }>
}

export interface ToolCallInfo {
  toolName: string
  inputArgs: Record<string, unknown> | string
  outputResult?: unknown
  error?: string
  isError?: boolean
  executionTimeMs: number
}

export interface Span {
  id: string
  traceId: string
  parentId?: string
  name: string
  type: SpanType
  startTimeMs: number
  endTimeMs: number
  durationMs: number
  status: SpanStatus
  stepIndex: number
  agentId?: string
  agentName?: string
  isSubagent?: boolean
  parentSpanId?: string
  agentThought?: string
  agentState?: AgentState
  modelName?: string
  modelUsage?: ModelUsage
  toolCall?: ToolCallInfo
  contextMessages?: ChatMessage[]
  promptText?: string
  completionText?: string
  rawAttributes?: Record<string, unknown>
}

export interface AgentStep {
  stepIndex: number
  timestampMs: number
  agentId?: string
  agentName?: string
  thought?: string
  state?: AgentState
  llmSpanId?: string
  toolSpanIds: string[]
  contextMessages: ChatMessage[]
  contextTokenCount: number
}

export interface AgentRun {
  runId: string
  name: string
  framework?: 'langchain' | 'otlp' | 'crewai' | 'autogen' | 'custom'
  startTimeMs: number
  endTimeMs: number
  durationMs: number
  status: 'success' | 'error' | 'in_progress'
  spans: Span[]
  steps: AgentStep[]
  totalTokens: number
  promptTokens: number
  completionTokens: number
  totalCostUsd: number
  metadata?: Record<string, unknown>
}
