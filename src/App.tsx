import { useEffect } from 'react'
import { useTraceStore } from './store/traceStore'
import { useUiStore } from './store/uiStore'
import { Navbar } from './components/Header/Navbar'
import { RunMetricsBar } from './components/Header/RunMetricsBar'
import { AnomalyBanner } from './components/Analytics/AnomalyBanner'
import { TimelineCanvas } from './components/Timeline/TimelineCanvas'
import { DetailDrawer } from './components/Inspector/DetailDrawer'
import { TokenBurnChart } from './components/Analytics/TokenBurnChart'
import { MemoryDiffView } from './components/Inspector/MemoryDiffView'
import { TraceComparisonView } from './components/Analytics/TraceComparisonView'
import { FileDropzone } from './components/Ingestion/FileDropzone'
import { LiveSimulator } from './components/Ingestion/LiveSimulator'
import { MermaidModal } from './components/Modals/MermaidModal'
import { ForkStepModal } from './components/Modals/ForkStepModal'
import { Sparkles, AlertCircle } from 'lucide-react'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export function App() {
  useKeyboardShortcuts()
  const loadSample = useTraceStore((state) => state.loadSample)
  const isLoading = useTraceStore((state) => state.isLoading)
  const error = useTraceStore((state) => state.error)
  const activeTab = useUiStore((state) => state.activeTab)

  useEffect(() => {
    // Load initial sample
    loadSample('research_agent_trace.json')
  }, [loadSample])

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      <Navbar />
      <RunMetricsBar />
      <AnomalyBanner />

      {/* Main View Area */}
      <main className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Sparkles className="w-4 h-4 animate-spin text-violet-400" />
              <span>Parsing agent trajectory...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-red-950/90 border border-red-800 text-xs text-red-200 flex items-center gap-2 shadow-2xl">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="w-full h-full relative">
            <TimelineCanvas />
            <DetailDrawer />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="w-full h-full overflow-y-auto">
            <TokenBurnChart />
          </div>
        )}

        {activeTab === 'diff' && (
          <div className="w-full h-full">
            <MemoryDiffView />
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="w-full h-full overflow-y-auto">
            <TraceComparisonView />
          </div>
        )}
      </main>

      {/* Overlays / Modals */}
      <FileDropzone />
      <LiveSimulator />
      <MermaidModal />
      <ForkStepModal />
    </div>
  )
}

export default App
