import React, { useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, FastForward, RotateCcw } from 'lucide-react'
import { useTraceStore } from '../../store/traceStore'
import { formatDuration } from '../../utils/formatters'

export const TimeScrubber: React.FC = () => {
  const activeRun = useTraceStore((state) => state.activeRun)
  const playbackStep = useTraceStore((state) => state.playbackStep)
  const isPlaying = useTraceStore((state) => state.isPlaying)
  const playbackSpeed = useTraceStore((state) => state.playbackSpeed)
  const setPlaybackStep = useTraceStore((state) => state.setPlaybackStep)
  const setIsPlaying = useTraceStore((state) => state.setIsPlaying)
  const setPlaybackSpeed = useTraceStore((state) => state.setPlaybackSpeed)
  const stepForward = useTraceStore((state) => state.stepForward)
  const stepBackward = useTraceStore((state) => state.stepBackward)
  const selectStep = useTraceStore((state) => state.selectStep)

  const totalSteps = activeRun?.steps.length || 1
  const durationMs = activeRun?.durationMs || 1000

  // Playback timer effect
  useEffect(() => {
    if (!isPlaying) return

    const intervalMs = Math.max(250, 1000 / playbackSpeed)
    const timer = setInterval(() => {
      const current = useTraceStore.getState().playbackStep
      if (current >= totalSteps) {
        setIsPlaying(false)
      } else {
        stepForward()
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }, [isPlaying, playbackSpeed, totalSteps, stepForward, setIsPlaying])

  if (!activeRun) return null

  const currentStepData = activeRun.steps[playbackStep - 1]
  const currentTimestamp = currentStepData?.timestampMs || 0

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4 text-xs select-none">
      {/* Step scrubber controls */}
      <div className="flex items-center gap-1.5 border-r border-slate-800 pr-3">
        <button
          onClick={() => {
            setPlaybackStep(1)
            selectStep(1)
          }}
          title="Restart from step 1"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={stepBackward}
          disabled={playbackStep <= 1}
          title="Step back"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause' : 'Play trajectory'}
          className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition shadow-sm shadow-violet-500/20"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>

        <button
          onClick={stepForward}
          disabled={playbackStep >= totalSteps}
          title="Step forward"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Playback speed selector */}
      <div className="flex items-center gap-1 border-r border-slate-800 pr-3">
        <FastForward className="w-3.5 h-3.5 text-slate-500" />
        <select
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          className="bg-transparent text-slate-300 font-mono text-xs focus:outline-none cursor-pointer"
        >
          <option value={0.5} className="bg-slate-900 text-white">0.5x</option>
          <option value={1} className="bg-slate-900 text-white">1x</option>
          <option value={2} className="bg-slate-900 text-white">2x</option>
          <option value={4} className="bg-slate-900 text-white">4x</option>
        </select>
      </div>

      {/* Scrub range */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-slate-400 whitespace-nowrap">
          Step <strong className="text-white font-semibold">{playbackStep}</strong> of {totalSteps}
        </span>

        <input
          type="range"
          min={1}
          max={totalSteps}
          value={playbackStep}
          onChange={(e) => {
            const step = Number(e.target.value)
            setPlaybackStep(step)
            selectStep(step)
          }}
          className="w-36 accent-violet-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
        />

        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
          <span>{formatDuration(currentTimestamp)}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-500">{formatDuration(durationMs)}</span>
        </div>
      </div>
    </div>
  )
}
