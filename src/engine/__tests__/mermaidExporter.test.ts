import { describe, it, expect } from 'vitest'
import { generateMermaidSequenceDiagram, generateMermaidFlowchart } from '../mermaidExporter'
import { generateStandaloneHtmlReport } from '../htmlReportExporter'
import type { AgentRun } from '../../types/trace'

const sampleRun: AgentRun = {
  runId: 'test-trace-1',
  name: 'Autonomous Agent Trajectory',
  startTimeMs: 1000,
  endTimeMs: 4000,
  durationMs: 3000,
  status: 'success',
  totalTokens: 2500,
  promptTokens: 2000,
  completionTokens: 500,
  totalCostUsd: 0.012,
  steps: [
    {
      stepIndex: 1,
      timestampMs: 1000,
      state: 'reason',
      toolSpanIds: [],
      thought: 'Analyzing user request and deciding to query vector store',
      contextTokenCount: 1200,
      contextMessages: [],
    },
    {
      stepIndex: 2,
      timestampMs: 2000,
      state: 'act',
      toolSpanIds: ['span-3'],
      thought: 'Executing search tool',
      contextTokenCount: 2500,
      contextMessages: [],
    },
  ],
  spans: [
    {
      id: 'span-1',
      traceId: 'test-trace-1',
      name: 'Agent Reason',
      type: 'agent_state',
      startTimeMs: 1000,
      endTimeMs: 1200,
      durationMs: 200,
      status: 'success',
      stepIndex: 1,
      agentThought: 'Analyzing user request and deciding to query vector store',
    },
    {
      id: 'span-2',
      traceId: 'test-trace-1',
      name: 'gpt-4o',
      type: 'llm_call',
      startTimeMs: 1200,
      endTimeMs: 2000,
      durationMs: 800,
      status: 'success',
      stepIndex: 1,
      modelName: 'gpt-4o',
      promptText: 'System prompt and question',
      completionText: 'Call tool search',
    },
    {
      id: 'span-3',
      traceId: 'test-trace-1',
      name: 'vector_search',
      type: 'tool_call',
      startTimeMs: 2000,
      endTimeMs: 3800,
      durationMs: 1800,
      status: 'success',
      stepIndex: 2,
      toolCall: {
        toolName: 'vector_search',
        inputArgs: { query: 'machine learning' },
        outputResult: { results: ['doc1', 'doc2'] },
        executionTimeMs: 1800,
      },
    },
  ],
}

describe('mermaidExporter engine', () => {
  it('generates valid sequence diagram syntax', () => {
    const seq = generateMermaidSequenceDiagram(sampleRun)
    expect(seq).toContain('sequenceDiagram')
    expect(seq).toContain('autonumber')
    expect(seq).toContain('User->>Agent: Start Trajectory')
    expect(seq).toContain('Agent->>LLM: [gpt-4o]')
    expect(seq).toContain('Agent->>Tool: vector_search')
    expect(seq).toContain('Agent-->>User: Trajectory Completed')
  })

  it('generates valid flowchart syntax', () => {
    const flow = generateMermaidFlowchart(sampleRun)
    expect(flow).toContain('flowchart TD')
    expect(flow).toContain('Start([User Request]) --> Step1')
    expect(flow).toContain('Step1["<b>Step 1 [REASON]</b>')
    expect(flow).toContain('LLM_1["🤖 gpt-4o (800ms)"]')
    expect(flow).toContain('Tool_2_0["🔧 vector_search (1800ms)"]')
    expect(flow).toContain('--> Finish([Completed Trajectory])')
  })
})

describe('htmlReportExporter engine', () => {
  it('generates a full standalone HTML document with embedded diagram and stats', () => {
    const html = generateStandaloneHtmlReport(sampleRun, [], [
      {
        modelName: 'gpt-4o',
        callCount: 1,
        promptTokens: 2000,
        completionTokens: 500,
        totalTokens: 2500,
        totalCostUsd: 0.012,
      },
    ])
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Agent-Trace Audit: Autonomous Agent Trajectory')
    expect(html).toContain('sequenceDiagram')
    expect(html).toContain('gpt-4o')
    expect(html).toContain('mermaid.initialize')
  })
})
