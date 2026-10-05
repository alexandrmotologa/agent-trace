import type { AgentRun } from '../types/trace'
import type { AnomalyReport, ModelCostStats } from '../types/analytics'
import { formatDuration, formatTokens, formatCost } from '../utils/formatters'
import { generateMermaidSequenceDiagram } from './mermaidExporter'

export function generateStandaloneHtmlReport(
  run: AgentRun,
  anomalies: AnomalyReport[],
  modelStats: ModelCostStats[]
): string {
  const mermaidDiagram = generateMermaidSequenceDiagram(run)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent-Trace Audit: ${run.name}</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #030712;
      --card-bg: #0f172a;
      --border: #1e293b;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --primary: #8b5cf6;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
    }
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .badge { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge-success { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-error { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
    .card-title { font-size: 12px; color: var(--muted); margin-bottom: 4px; }
    .card-val { font-size: 20px; font-weight: 700; font-family: monospace; }
    .section-title { font-size: 16px; font-weight: 600; margin: 24px 0 12px 0; border-left: 3px solid var(--primary); padding-left: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
    th { padding: 10px; border-bottom: 1px solid var(--border); color: var(--muted); font-weight: 600; }
    td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .anomaly-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 10px; }
    pre { background: #020617; padding: 12px; border-radius: 8px; border: 1px solid var(--border); overflow-x: auto; font-size: 12px; font-family: monospace; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: var(--muted); border-top: 1px solid var(--border); padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>${run.name}</h1>
        <div style="font-size: 12px; color: var(--muted); margin-top: 4px;">Run ID: ${run.runId} • Framework: ${run.framework || 'Custom'}</div>
      </div>
      <div>
        <span class="badge ${run.status === 'error' ? 'badge-error' : 'badge-success'}">${run.status}</span>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-title">Duration</div>
        <div class="card-val">${formatDuration(run.durationMs)}</div>
      </div>
      <div class="card">
        <div class="card-title">Total Tokens</div>
        <div class="card-val">${formatTokens(run.totalTokens)}</div>
      </div>
      <div class="card">
        <div class="card-title">Estimated Cost</div>
        <div class="card-val" style="color: #34d399;">${formatCost(run.totalCostUsd)}</div>
      </div>
      <div class="card">
        <div class="card-title">Trajectory Steps</div>
        <div class="card-val">${run.steps.length}</div>
      </div>
    </div>

    ${
      anomalies.length > 0
        ? `
      <div class="section-title">Anomalies & Loops Detected (${anomalies.length})</div>
      ${anomalies
        .map(
          (a) => `
        <div class="anomaly-box">
          <div style="font-weight: 600; color: #f87171;">[${a.severity.toUpperCase()}] ${a.title}</div>
          <div style="margin: 4px 0;">${a.description}</div>
          <div style="font-size: 11px; color: var(--muted); font-family: monospace;">Recommendation: ${a.recommendation}</div>
        </div>
      `
        )
        .join('')}
    `
        : ''
    }

    <div class="section-title">Model Usage & Cost Breakdown</div>
    <div class="card" style="padding: 0; overflow: hidden;">
      <table>
        <thead>
          <tr>
            <th>Model</th>
            <th>Calls</th>
            <th>Prompt Tokens</th>
            <th>Completion Tokens</th>
            <th>Total Cost</th>
          </tr>
        </thead>
        <tbody>
          ${modelStats
            .map(
              (m) => `
            <tr>
              <td style="font-weight: 600;">${m.modelName}</td>
              <td>${m.callCount}</td>
              <td>${formatTokens(m.promptTokens)}</td>
              <td>${formatTokens(m.completionTokens)}</td>
              <td style="color: #34d399; font-weight: 600;">${formatCost(m.totalCostUsd)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="section-title">Step-by-Step Trajectory Log</div>
    <div class="card" style="padding: 0; overflow: hidden;">
      <table>
        <thead>
          <tr>
            <th>Step</th>
            <th>State</th>
            <th>Thought & Action</th>
            <th>Context Tokens</th>
          </tr>
        </thead>
        <tbody>
          ${run.steps
            .map(
              (s) => `
            <tr>
              <td style="font-family: monospace;">#${s.stepIndex}</td>
              <td><span style="font-family: monospace; font-size: 11px; text-transform: uppercase;">${s.state || 'reason'}</span></td>
              <td>${(s.thought || 'Processing').replace(/</g, '&lt;')}</td>
              <td style="font-family: monospace;">${formatTokens(s.contextTokenCount)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <div class="section-title">Mermaid Trajectory Diagram</div>
    <pre class="mermaid">${mermaidDiagram}</pre>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    </script>

    <div class="footer">
      Generated automatically by Agent-Trace • Local-first AI agent visual debugger
    </div>
  </div>
</body>
</html>`
}
