import { describe, it, expect } from 'vitest'
import { computeContextDiff, formatMessagesToText, estimateTokenCount } from '../diffEngine'
import type { ChatMessage } from '../../types/trace'

describe('Context Memory Diff Engine', () => {
  it('formats messages into structured readable markdown', () => {
    const msgs: ChatMessage[] = [
      { role: 'system', content: 'You are an assistant.' },
      { role: 'user', content: 'What is 2+2?' },
    ]
    const text = formatMessagesToText(msgs)
    expect(text).toContain('Role: SYSTEM')
    expect(text).toContain('Role: USER')
    expect(text).toContain('What is 2+2?')
  })

  it('estimates token count roughly based on character length', () => {
    const text = '1234567890123456' // 16 chars
    expect(estimateTokenCount(text)).toBe(4)
  })

  it('computes context diff and detects bloat ratio', () => {
    const prevMsgs: ChatMessage[] = [{ role: 'user', content: 'Small query' }]
    const currMsgs: ChatMessage[] = [
      { role: 'user', content: 'Small query' },
      { role: 'tool', content: 'A'.repeat(16000) }, // ~4000 tokens added
    ]

    const { stats } = computeContextDiff(prevMsgs, currMsgs)
    expect(stats.currTokens).toBeGreaterThan(stats.prevTokens)
    expect(stats.tokenDelta).toBeGreaterThan(3000)
    expect(stats.warningBloat).toBe(true)
  })
})
