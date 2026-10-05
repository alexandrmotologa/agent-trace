import React, { useState } from 'react'
import { useTraceStore } from '../../store/traceStore'
import { useUiStore } from '../../store/uiStore'
import { CollectorStatus } from '../Ingestion/CollectorStatus'
import { sanitizeAndExportFixture, triggerDownload } from '../../utils/exportFixture'
import { generateMarkdownReport } from '../../utils/exportReport'
import { generateStandaloneHtmlReport } from '../../engine/htmlReportExporter'
import {
  Compass,
  UploadCloud,
  FileDown,
  FileText,
  Search,
  Activity,
  Layers,
  BarChart2,
  GitCompare,
  GitBranch,
  GitFork,
  Globe,
} from 'lucide-react'

export const Navbar: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const loadSample = useTraceStore((state) => state.loadSample)
  const anomalies = useTraceStore((state) => state.anomalies)
  const modelStats = useTraceStore((state) => state.modelStats)
  const searchQuery = useTraceStore((state) => state.searchQuery)
  const setSearchQuery = useTraceStore((state) => state.setSearchQuery)

  const activeTab = useUiStore((state) => state.activeTab)
  const setActiveTab = useUiStore((state) => state.setActiveTab)
  const setDropzoneOpen = useUiStore((state) => state.setDropzoneOpen)
  const setSimulatorOpen = useUiStore((state) => state.setSimulatorOpen)
  const setMermaidModalOpen = useUiStore((state) => state.setMermaidModalOpen)
  const setForkModalOpen = useUiStore((state) => state.setForkModalOpen)

  const [selectedSample, setSelectedSample] = useState('research_agent_trace.json')

  const handleSampleChange = (sampleFile: string) => {
    setSelectedSample(sampleFile)
    loadSample(sampleFile)
  }

  const handleExportFixture = () => {
    if (!activeRun) return
    const content = sanitizeAndExportFixture(activeRun)
    triggerDownload(content, `${activeRun.runId}-mock-fixture.json`)
  }

  const handleExportReport = () => {
    if (!activeRun) return
    const reportMd = generateMarkdownReport(activeRun, anomalies, modelStats)
    triggerDownload(reportMd, `${activeRun.runId}-audit-report.md`, 'text/markdown')
  }

  const handleExportHtml = () => {
    if (!activeRun) return
    const reportHtml = generateStandaloneHtmlReport(activeRun, anomalies, modelStats)
    triggerDownload(reportHtml, `${activeRun.runId}-audit-report.html`, 'text/html')
  }

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between gap-4 text-xs select-none">
      {/* Brand Identity */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20 text-white">
            <Compass className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Agent-Trace
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-violet-950/80 text-violet-300 border border-violet-800/50">
                v1.1
              </span>
            </span>
            <span className="text-[10px] text-slate-400">Local-first AI Observability</span>
          </div>
        </div>

        {/* View Tabs */}
        <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 ml-2">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'timeline'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'analytics'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Tokens</span>
          </button>

          <button
            onClick={() => setActiveTab('diff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'diff'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Memory Diff</span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'compare'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-amber-400" />
            <span>A/B Compare</span>
          </button>
        </div>
      </div>

      {/* Middle: Search & Sample Picker */}
      <div className="flex items-center gap-2.5 flex-1 max-w-sm">
        {/* Sample selector */}
        <select
          value={selectedSample}
          onChange={(e) => handleSampleChange(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-violet-500 font-sans cursor-pointer text-xs w-full truncate"
        >
          <option value="research_agent_trace.json">Sample: Research Agent (Parallel)</option>
          <option value="coding_agent_loop.json">Sample: Debugger (Infinite Loop)</option>
          <option value="rag_eval_trace.json">Sample: RAG Retrieval (Bloat)</option>
          <option value="tool_failure_trace.json">Sample: Database Agent (SQL Recovery)</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 hidden xl:block">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spans, tools, models..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 text-xs"
          />
        </div>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <CollectorStatus />

        <button
          onClick={() => setForkModalOpen(true)}
          title="What-if sandbox: fork step with alternative prompt"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-300 hover:text-white transition"
        >
          <GitFork className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Fork Step</span>
        </button>

        <button
          onClick={() => setMermaidModalOpen(true)}
          title="Export Mermaid sequence or flowchart code"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
        >
          <GitBranch className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden xl:inline">Mermaid</span>
        </button>

        <button
          onClick={() => setSimulatorOpen(true)}
          title="Simulate live agent trace stream"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Simulator</span>
        </button>

        <button
          onClick={() => setDropzoneOpen(true)}
          title="Import JSON/JSONL trace"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
        >
          <UploadCloud className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden sm:inline">Import</span>
        </button>

        <button
          onClick={handleExportHtml}
          title="Export offline self-contained HTML report"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-300 hover:text-white transition"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Export HTML</span>
        </button>

        <button
          onClick={handleExportFixture}
          title="Export offline test mock fixture for CI/CD"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
        >
          <FileDown className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden 2xl:inline">Mock</span>
        </button>

        <button
          onClick={handleExportReport}
          title="Export Markdown audit report"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Report</span>
        </button>
      </div>
    </header>
  )
}
