import React, { useState } from 'react'
import { useTraceStore } from '../../store/traceStore'
import { useUiStore } from '../../store/uiStore'
import { PromptViewer } from './PromptViewer'
import { ToolCallView } from './ToolCallView'
import { MemoryDiffView } from './MemoryDiffView'
import { RawJsonView } from './RawJsonView'
import { X, Maximize2, Minimize2, Brain, Cpu, Wrench, Layers, Code } from 'lucide-react'

export const DetailDrawer: React.FC = () => {
  const selectedSpan = useTraceStore((state) => state.getSelectedSpan())
  const selectSpan = useTraceStore((state) => state.selectSpan)
  const isDrawerOpen = useUiStore((state) => state.isDrawerOpen)
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen)

  const [activeTab, setActiveTab] = useState<'details' | 'tools' | 'diff' | 'raw'>('details')
  const [isExpanded, setIsExpanded] = useState(false)

  React.useEffect(() => {
    if (selectedSpan?.type === 'tool_call') {
      setActiveTab('tools')
    } else if (activeTab === 'tools') {
      setActiveTab('details')
    }
  }, [selectedSpan?.id, selectedSpan?.type])

  if (!isDrawerOpen || !selectedSpan) return null


  return (
    <aside
      className={`fixed top-14 bottom-0 right-0 z-30 flex flex-col bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl transition-all duration-200 ${
        isExpanded ? 'w-[85vw]' : 'w-[480px] max-w-[95vw]'
      }`}
    >
      {/* Drawer header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-slate-800 shrink-0">
            {selectedSpan.type === 'agent_state' && <Brain className="w-4 h-4 text-violet-400" />}
            {selectedSpan.type === 'llm_call' && <Cpu className="w-4 h-4 text-sky-400" />}
            {selectedSpan.type === 'tool_call' && <Wrench className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className="overflow-hidden">
            <h3 className="text-xs font-semibold text-white truncate">
              {selectedSpan.toolCall?.toolName || selectedSpan.modelName || selectedSpan.name}
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Step {selectedSpan.stepIndex} • {selectedSpan.type.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand full width'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setDrawerOpen(false)
              selectSpan(null)
            }}
            title="Close drawer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900/30 px-3 text-xs">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition ${
            activeTab === 'details'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Prompt & Monologue</span>
        </button>

        {selectedSpan.toolCall && (
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition ${
              activeTab === 'tools'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Tool I/O</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('diff')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition ${
            activeTab === 'diff'
              ? 'border-sky-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Context Diff</span>
        </button>

        <button
          onClick={() => setActiveTab('raw')}
          className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition ${
            activeTab === 'raw'
              ? 'border-slate-400 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Raw JSON</span>
        </button>
      </div>

      {/* Drawer content area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'details' && <PromptViewer span={selectedSpan} />}
        {activeTab === 'tools' && selectedSpan.toolCall && (
          <ToolCallView toolCall={selectedSpan.toolCall} />
        )}
        {activeTab === 'diff' && <MemoryDiffView />}
        {activeTab === 'raw' && <RawJsonView span={selectedSpan} />}
      </div>
    </aside>
  )
}
