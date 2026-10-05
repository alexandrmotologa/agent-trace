import React, { useState, useEffect } from 'react'
import {
  getAllTraceRecords,
  deleteTraceRecord,
  toggleFavoriteTraceRecord,
  updateTraceTags,
  type SavedTraceRecord,
} from '../../engine/db'
import { useTraceStore } from '../../store/traceStore'
import { useUiStore } from '../../store/uiStore'
import { formatDuration, formatTokens, formatCost } from '../../utils/formatters'
import {
  Database,
  X,
  Search,
  Star,
  Trash2,
  Play,
  Tag,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react'

export const TraceLibraryModal: React.FC = () => {
  const isLibraryModalOpen = useUiStore((state) => state.isLibraryModalOpen)
  const setLibraryModalOpen = useUiStore((state) => state.setLibraryModalOpen)
  const loadRun = useTraceStore((state) => state.loadRun)

  const [records, setRecords] = useState<SavedTraceRecord[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'favorites' | 'errors'>('all')
  const [newTagInput, setNewTagInput] = useState<{ [runId: string]: string }>({})
  const [activeTagInputRunId, setActiveTagInputRunId] = useState<string | null>(null)

  const reloadRecords = async () => {
    try {
      const all = await getAllTraceRecords()
      setRecords(all)
    } catch (err) {
      console.error('Failed to load trace library records', err)
    }
  }

  useEffect(() => {
    if (isLibraryModalOpen) {
      reloadRecords()
    }
  }, [isLibraryModalOpen])

  if (!isLibraryModalOpen) return null

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.runId.toLowerCase().includes(search.toLowerCase()) ||
      (r.framework && r.framework.toLowerCase().includes(search.toLowerCase())) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))

    if (!matchesSearch) return false
    if (filter === 'favorites') return r.isFavorite
    if (filter === 'errors') return r.status === 'error'
    return true
  })

  const handleToggleFavorite = async (runId: string) => {
    await toggleFavoriteTraceRecord(runId)
    reloadRecords()
  }

  const handleDelete = async (runId: string) => {
    if (confirm('Delete this trace from local storage?')) {
      await deleteTraceRecord(runId)
      reloadRecords()
    }
  }

  const handleAddTag = async (runId: string) => {
    const tag = (newTagInput[runId] || '').trim()
    if (!tag) return
    const record = records.find((r) => r.runId === runId)
    if (!record) return

    if (!record.tags.includes(tag)) {
      const nextTags = [...record.tags, tag]
      await updateTraceTags(runId, nextTags)
      setNewTagInput((prev) => ({ ...prev, [runId]: '' }))
      setActiveTagInputRunId(null)
      reloadRecords()
    }
  }

  const handleRemoveTag = async (runId: string, tagToRemove: string) => {
    const record = records.find((r) => r.runId === runId)
    if (!record) return
    const nextTags = record.tags.filter((t) => t !== tagToRemove)
    await updateTraceTags(runId, nextTags)
    reloadRecords()
  }

  const handleLoad = (record: SavedTraceRecord) => {
    loadRun(record.run)
    setLibraryModalOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Trace Library & Local History
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {records.length} runs stored
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Persistent local database powered by IndexedDB with zero cloud exposure.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLibraryModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search traces by name, framework, ID or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition ${
                filter === 'all'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              All Runs
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                filter === 'favorites'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50 font-medium'
                  : 'text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Favorites</span>
            </button>
            <button
              onClick={() => setFilter('errors')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                filter === 'errors'
                  ? 'bg-red-950/80 text-red-300 border border-red-800/50 font-medium'
                  : 'text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>Errors Only</span>
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No matching traces found in local database. Ingested traces automatically persist here.
            </div>
          ) : (
            filteredRecords.map((r) => (
              <div
                key={r.runId}
                className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition flex flex-col gap-3 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleFavorite(r.runId)}
                      className="mt-0.5 text-slate-500 hover:text-amber-400 transition"
                      title="Star favorite"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          r.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-sm">{r.name}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded uppercase font-mono font-medium flex items-center gap-1 ${
                            r.status === 'success'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : 'bg-red-950/60 text-red-400 border border-red-800/40'
                          }`}
                        >
                          {r.status === 'success' ? (
                            <CheckCircle className="w-2.5 h-2.5" />
                          ) : (
                            <AlertCircle className="w-2.5 h-2.5" />
                          )}
                          {r.status}
                        </span>
                        <span className="text-[10px] bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded font-mono">
                          {r.framework}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatDuration(r.durationMs)}
                        </span>
                        <span>•</span>
                        <span>{formatTokens(r.totalTokens)} tokens</span>
                        <span>•</span>
                        <span className="text-emerald-400">{formatCost(r.totalCostUsd)}</span>
                        <span>•</span>
                        <span className="text-slate-500">{new Date(r.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoad(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/40 text-xs font-medium transition shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Load Viewport</span>
                    </button>
                    <button
                      onClick={() => handleDelete(r.runId)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition"
                      title="Delete run"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/40">
                  <Tag className="w-3 h-3 text-slate-500 mr-1" />
                  {r.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded-md"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(r.runId, tag)}
                        className="text-slate-500 hover:text-slate-200 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {activeTagInputRunId === r.runId ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Tag name"
                        value={newTagInput[r.runId] || ''}
                        onChange={(e) =>
                          setNewTagInput((prev) => ({ ...prev, [r.runId]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTag(r.runId)
                          if (e.key === 'Escape') setActiveTagInputRunId(null)
                        }}
                        autoFocus
                        className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-violet-500 w-24"
                      />
                      <button
                        onClick={() => handleAddTag(r.runId)}
                        className="text-[11px] px-1.5 py-0.5 rounded bg-violet-600 text-white font-medium"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTagInputRunId(r.runId)}
                      className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tag</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
