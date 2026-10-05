import React, { useState } from 'react'
import { useTraceStore } from '../../store/traceStore'
import { useUiStore } from '../../store/uiStore'
import {
  generateMermaidSequenceDiagram,
  generateMermaidFlowchart,
} from '../../engine/mermaidExporter'
import { triggerDownload } from '../../utils/exportFixture'
import { GitBranch, Copy, Check, Download, X } from 'lucide-react'

export const MermaidModal: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const isMermaidModalOpen = useUiStore((state) => state.isMermaidModalOpen)
  const setMermaidModalOpen = useUiStore((state) => state.setMermaidModalOpen)

  const [diagramType, setDiagramType] = useState<'sequence' | 'flowchart'>('sequence')
  const [copied, setCopied] = useState(false)

  if (!isMermaidModalOpen || !activeRun) return null

  const code =
    diagramType === 'sequence'
      ? generateMermaidSequenceDiagram(activeRun)
      : generateMermaidFlowchart(activeRun)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    triggerDownload(code, `${activeRun.runId}-${diagramType}.mmd`, 'text/plain')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white text-sm">Export Mermaid Diagram</h3>
          </div>
          <button
            onClick={() => setMermaidModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setDiagramType('sequence')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                diagramType === 'sequence'
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sequence Diagram
            </button>
            <button
              onClick={() => setDiagramType('flowchart')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                diagramType === 'flowchart'
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Flowchart State DAG
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .mmd</span>
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="p-4 flex-1 overflow-auto bg-slate-950">
          <pre className="font-mono text-xs text-slate-300 whitespace-pre leading-relaxed select-text">
            {code}
          </pre>
        </div>

        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center bg-slate-950/50">
          Paste this code into GitHub README markdown, Notion, or Mermaid Live Editor.
        </div>
      </div>
    </div>
  )
}
