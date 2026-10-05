import React, { useState, useRef } from 'react'
import { useTraceStore } from '../../store/traceStore'
import { useUiStore } from '../../store/uiStore'
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react'

export const FileDropzone: React.FC = () => {
  const isDropzoneOpen = useUiStore((state) => state.isDropzoneOpen)
  const setDropzoneOpen = useUiStore((state) => state.setDropzoneOpen)
  const loadTraceContent = useTraceStore((state) => state.loadTraceContent)
  const storeError = useTraceStore((state) => state.error)

  const [dragOver, setDragOver] = useState(false)
  const [pasteContent, setPasteContent] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isDropzoneOpen) return null

  const handleFile = (file: File) => {
    setLocalError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        loadTraceContent(text)
        setDropzoneOpen(false)
      } catch (err: unknown) {
        setLocalError(err instanceof Error ? err.message : 'Error reading file')
      }
    }
    reader.onerror = () => setLocalError('Failed to read file')
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) return
    setLocalError(null)
    try {
      loadTraceContent(pasteContent)
      setDropzoneOpen(false)
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Failed to parse pasted trace')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white text-sm">Import Trace File</h3>
          </div>
          <button
            onClick={() => setDropzoneOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              dragOver
                ? 'border-violet-500 bg-violet-950/20'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              accept=".json,.jsonl,.txt"
              className="hidden"
            />
            <div className="p-3 rounded-full bg-slate-800 text-slate-300">
              <FileText className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="font-medium text-slate-200">
                Click or drag & drop trace file here
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports OpenTelemetry OTLP JSON, LangChain run export, or Agent-Trace JSON/JSONL
              </p>
            </div>
          </div>

          {/* Or Paste Raw JSON */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-400 font-medium">Or Paste Raw Trace JSON / JSONL</label>
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder='{"resourceSpans": [...]} or LangChain run JSON'
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-violet-500 text-xs"
            />
            <button
              onClick={handlePasteSubmit}
              disabled={!pasteContent.trim()}
              className="self-end px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg font-medium transition shadow-sm"
            >
              Parse & Visualize
            </button>
          </div>

          {/* Error notice */}
          {(localError || storeError) && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{localError || storeError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
