import { describe, it, expect } from 'vitest'
import { normalizeTraceData, isNativeAgentRun, isOtlpPayload, isLangChainPayload } from '../normalizer'
import type { OtlpTracePayload } from '../../types/otlp'

describe('Trace Normalizer Engine', () => {
  it('identifies and normalizes native AgentRun JSON', () => {
    const nativeTrace = {
      runId: 'trace-test-1',
      name: 'Test Native Agent',
      framework: 'custom',
      startTimeMs: 0,
      endTimeMs: 1200,
      durationMs: 1200,
      status: 'success',
      totalTokens: 500,
      promptTokens: 400,
      completionTokens: 100,
      totalCostUsd: 0.002,
      steps: [
        {
          stepIndex: 1,
          timestampMs: 0,
          thought: 'Test step',
          toolSpanIds: [],
          contextMessages: [],
          contextTokenCount: 100,
        },
      ],
      spans: [
        {
          id: 'span-1',
          traceId: 'trace-test-1',
          name: 'Step 1',
          type: 'agent_state',
          startTimeMs: 0,
          endTimeMs: 500,
          durationMs: 500,
          status: 'success',
          stepIndex: 1,
        },
      ],
    }

    expect(isNativeAgentRun(nativeTrace)).toBe(true)
    const normalized = normalizeTraceData(JSON.stringify(nativeTrace))
    expect(normalized.runId).toBe('trace-test-1')
    expect(normalized.spans.length).toBe(1)
  })

  it('identifies and parses OTLP GenAI traces', () => {
    const otlpPayload: OtlpTracePayload = {
      resourceSpans: [
        {
          scopeSpans: [
            {
              spans: [
                {
                  traceId: 'trace-otlp-abc',
                  spanId: 'span-101',
                  name: 'chat.completion',
                  startTimeUnixNano: '1700000000000000000',
                  endTimeUnixNano: '1700000001000000000',
                  attributes: [
                    { key: 'gen_ai.system', value: { stringValue: 'openai' } },
                    { key: 'gen_ai.request.model', value: { stringValue: 'gpt-4o' } },
                    { key: 'gen_ai.usage.prompt_tokens', value: { intValue: 1200 } },
                    { key: 'gen_ai.usage.completion_tokens', value: { intValue: 300 } },
                    { key: 'gen_ai.prompt', value: { stringValue: 'Summarize news' } },
                    { key: 'gen_ai.completion', value: { stringValue: 'News summary...' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    expect(isOtlpPayload(otlpPayload)).toBe(true)
    const normalized = normalizeTraceData(otlpPayload)
    expect(normalized.framework).toBe('otlp')
    expect(normalized.spans.length).toBe(1)
    expect(normalized.spans[0].type).toBe('llm_call')
    expect(normalized.spans[0].modelName).toBe('gpt-4o')
    expect(normalized.totalTokens).toBe(1500)
  })

  it('identifies and parses LangChain run exports', () => {
    const lcPayload = {
      id: 'lc-run-99',
      name: 'AgentExecutor',
      run_type: 'chain',
      start_time: '2026-09-01T12:00:00.000Z',
      end_time: '2026-09-01T12:00:02.000Z',
      child_runs: [
        {
          id: 'lc-llm-1',
          name: 'ChatOpenAI',
          run_type: 'llm',
          start_time: '2026-09-01T12:00:00.100Z',
          end_time: '2026-09-01T12:00:01.000Z',
          extra: { invocation_params: { model: 'gpt-4o' } },
          inputs: { messages: [{ role: 'user', content: 'hello' }] },
          outputs: {
            generations: [[{ text: 'hi' }]],
            llm_output: { token_usage: { prompt_tokens: 150, completion_tokens: 50 } },
          },
        },
      ],
    }

    expect(isLangChainPayload(lcPayload)).toBe(true)
    const normalized = normalizeTraceData(lcPayload)
    expect(normalized.framework).toBe('langchain')
    expect(normalized.spans.length).toBe(2)
  })
})
