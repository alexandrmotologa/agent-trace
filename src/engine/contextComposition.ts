import type { ChatMessage, AgentRun } from '../types/trace'
import { estimateTokenCount } from './diffEngine'

export interface ContextSegment {
  type: 'system' | 'user' | 'assistant' | 'tool'
  label: string
  tokenCount: number
  percentage: number
  color: string
}

export interface ContextComposition {
  totalTokens: number
  segments: ContextSegment[]
  bloatContributor?: {
    label: string
    tokenCount: number
    percentage: number
    isDangerousBloat: boolean
  }
}

export function computeContextComposition(messages: ChatMessage[]): ContextComposition {
  if (!messages || messages.length === 0) {
    return { totalTokens: 0, segments: [] }
  }

  let systemChars = 0
  let userChars = 0
  let assistantChars = 0
  let toolChars = 0

  for (const msg of messages) {
    const len = (msg.content?.length || 0) + (msg.toolCalls ? JSON.stringify(msg.toolCalls).length : 0)
    if (msg.role === 'system') systemChars += len
    else if (msg.role === 'user') userChars += len
    else if (msg.role === 'assistant') assistantChars += len
    else if (msg.role === 'tool') toolChars += len
  }

  const systemTokens = estimateTokenCount(' '.repeat(systemChars))
  const userTokens = estimateTokenCount(' '.repeat(userChars))
  const assistantTokens = estimateTokenCount(' '.repeat(assistantChars))
  const toolTokens = estimateTokenCount(' '.repeat(toolChars))

  const totalTokens = Math.max(1, systemTokens + userTokens + assistantTokens + toolTokens)

  const segments: ContextSegment[] = [
    {
      type: 'system',
      label: 'System Prompt',
      tokenCount: systemTokens,
      percentage: Number(((systemTokens / totalTokens) * 100).toFixed(1)),
      color: '#8b5cf6', // violet
    },
    {
      type: 'user',
      label: 'User Query',
      tokenCount: userTokens,
      percentage: Number(((userTokens / totalTokens) * 100).toFixed(1)),
      color: '#0284c7', // sky
    },
    {
      type: 'assistant',
      label: 'Assistant Monologue',
      tokenCount: assistantTokens,
      percentage: Number(((assistantTokens / totalTokens) * 100).toFixed(1)),
      color: '#6366f1', // indigo
    },
    {
      type: 'tool',
      label: 'Tool Outputs',
      tokenCount: toolTokens,
      percentage: Number(((toolTokens / totalTokens) * 100).toFixed(1)),
      color: '#10b981', // emerald
    },
  ]

  let bloatContributor: ContextComposition['bloatContributor'] = undefined
  if (toolTokens > 2000 || (toolTokens / totalTokens) > 0.5) {
    bloatContributor = {
      label: 'Tool Outputs',
      tokenCount: toolTokens,
      percentage: Number(((toolTokens / totalTokens) * 100).toFixed(1)),
      isDangerousBloat: toolTokens > 4000,
    }
  }

  return {
    totalTokens,
    segments: segments.filter((s) => s.tokenCount > 0),
    bloatContributor,
  }
}

export function findWorstRunBloat(run: AgentRun): {
  stepIndex: number
  deltaTokens: number
  toolName?: string
} | null {
  let worstDelta = 0
  let worstStep = 1
  let worstTool: string | undefined

  for (let i = 1; i < run.steps.length; i++) {
    const prev = run.steps[i - 1]
    const curr = run.steps[i]
    const delta = curr.contextTokenCount - prev.contextTokenCount
    if (delta > worstDelta) {
      worstDelta = delta
      worstStep = curr.stepIndex
      const stepTools = run.spans.filter((s) => s.stepIndex === curr.stepIndex && s.type === 'tool_call')
      worstTool = stepTools[0]?.toolCall?.toolName
    }
  }

  if (worstDelta > 2000) {
    return {
      stepIndex: worstStep,
      deltaTokens: worstDelta,
      toolName: worstTool,
    }
  }
  return null
}
