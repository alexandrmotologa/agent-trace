#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const args = process.argv.slice(2)

function printHelp() {
  console.log(`
Agent-Trace CLI: Local-first visual timeline and debugger for AI agents

Usage:
  npx agent-trace [options] [trace-file.json]

Options:
  --live, -l       Start the local OpenTelemetry (OTLP) HTTP collector on port 4318
  --port <number>  Port for OTLP collector (default: 4318)
  --ui             Start Vite UI dev server along with collector
  --help, -h       Show this help message
  --version, -v    Show version

Examples:
  npx agent-trace ./my-trace.json
  npx agent-trace --live
  npx agent-trace --live --port 4318 --ui
`)
}

if (args.includes('--help') || args.includes('-h')) {
  printHelp()
  process.exit(0)
}

if (args.includes('--version') || args.includes('-v')) {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
  console.log(`agent-trace v${pkg.version || '0.1.0'}`)
  process.exit(0)
}

const isLive = args.includes('--live') || args.includes('-l')
const portIdx = args.indexOf('--port')
const port = portIdx !== -1 && args[portIdx + 1] ? Number(args[portIdx + 1]) : 4318
const fileArg = args.find((a) => !a.startsWith('-'))

console.log(`\x1b[35m
  ┌────────────────────────────────────────────────────────┐
  │                 AGENT-TRACE CLI v0.1.0                 │
  │     Local-First AI Agent Timeline & Memory Debugger    │
  └────────────────────────────────────────────────────────┘\x1b[0m`)

if (fileArg) {
  const filePath = path.resolve(process.cwd(), fileArg)
  if (!fs.existsSync(filePath)) {
    console.error(`\x1b[31mError: File not found at ${filePath}\x1b[0m`)
    process.exit(1)
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(content)
    const runName = parsed.name || parsed.runId || path.basename(filePath)
    const stepsCount = Array.isArray(parsed.steps) ? parsed.steps.length : 'N/A'
    const spansCount = Array.isArray(parsed.spans) ? parsed.spans.length : 'N/A'
    const totalTokens = parsed.totalTokens || 'N/A'
    const status = parsed.status || 'unknown'

    console.log(`\x1b[32m✓ Loaded trace file:\x1b[0m ${filePath}`)
    console.log(`  \x1b[90mRun Name:\x1b[0m     ${runName}`)
    console.log(`  \x1b[90mSteps:\x1b[0m        ${stepsCount}`)
    console.log(`  \x1b[90mSpans:\x1b[0m        ${spansCount}`)
    console.log(`  \x1b[90mTotal Tokens:\x1b[0m ${totalTokens}`)
    console.log(`  \x1b[90mStatus:\x1b[0m       ${status.toUpperCase()}`)
    console.log(`\n\x1b[36mTip:\x1b[0m Open the Agent-Trace web studio and drop this file to inspect memory diffs and loops.`)
  } catch (err) {
    console.error(`\x1b[31mError parsing JSON: ${err.message}\x1b[0m`)
    process.exit(1)
  }
}

if (isLive || !fileArg) {
  const collectorScript = path.join(rootDir, 'server', 'otlpCollector.mjs')
  console.log(`\x1b[34m[Agent-Trace]\x1b[0m Starting local OTLP collector on port \x1b[1m${port}\x1b[0m...`)
  console.log(`\x1b[34m[Agent-Trace]\x1b[0m Set in your agent script:`)
  console.log(`  \x1b[33mexport OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:${port}"\x1b[0m\n`)

  const child = spawn(process.execPath, [collectorScript], {
    env: { ...process.env, PORT: String(port) },
    stdio: 'inherit',
  })

  child.on('exit', (code) => {
    process.exit(code || 0)
  })
}
