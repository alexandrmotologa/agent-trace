import type { ChatMessage } from '../types/trace'
import * as diff from 'diff'

export interface ContextDiffStats {
  prevTokens: number
  currTokens: number
  tokenDelta: number
  addedLines: number
  removedLines: number
  bloatRatio: number
  warningBloat: boolean
}

export function formatMessagesToText(messages: ChatMessage[]): string {
  if (!messages || messages.length === 0) return ''

  return messages
    .map((msg, idx) => {
      const header = `--- [Message ${idx + 1}] Role: ${msg.role.toUpperCase()}${msg.name ? ` (${msg.name})` : ''} ---`
      let content = msg.content || ''
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        content += '\n[Tool Calls]:\n' + JSON.stringify(msg.toolCalls, null, 2)
      }
      return `${header}\n${content.trim()}`
    })
    .join('\n\n')
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0
  // Approximation ~4 characters per token for English/code
  return Math.ceil(text.length / 4)
}

export function computeContextDiff(
  prevMessages: ChatMessage[],
  currMessages: ChatMessage[]
): {
  prevText: string
  currText: string
  stats: ContextDiffStats
} {
  const prevText = formatMessagesToText(prevMessages)
  const currText = formatMessagesToText(currMessages)

  const prevTokens = estimateTokenCount(prevText)
  const currTokens = estimateTokenCount(currText)
  const tokenDelta = currTokens - prevTokens

  const lineDiff = diff.diffLines(prevText, currText)
  let addedLines = 0
  let removedLines = 0

  for (const part of lineDiff) {
    if (part.added) {
      addedLines += part.count || 0
    } else if (part.removed) {
      removedLines += part.count || 0
    }
  }

  const bloatRatio = prevTokens > 0 ? Number(((tokenDelta / prevTokens) * 100).toFixed(1)) : 100
  const warningBloat = tokenDelta > 3000 || (prevTokens > 1000 && bloatRatio > 120)

  return {
    prevText,
    currText,
    stats: {
      prevTokens,
      currTokens,
      tokenDelta,
      addedLines,
      removedLines,
      bloatRatio,
      warningBloat,
    },
  }
}
