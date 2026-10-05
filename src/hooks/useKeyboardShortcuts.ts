import { useEffect } from 'react'
import { useTraceStore } from '../store/traceStore'
import { useUiStore } from '../store/uiStore'

export function useKeyboardShortcuts() {
  const isPlaying = useTraceStore((state) => state.isPlaying)
  const setIsPlaying = useTraceStore((state) => state.setIsPlaying)
  const stepForward = useTraceStore((state) => state.stepForward)
  const stepBackward = useTraceStore((state) => state.stepBackward)
  const selectSpan = useTraceStore((state) => state.selectSpan)

  const setActiveTab = useUiStore((state) => state.setActiveTab)
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen)
  const setDropzoneOpen = useUiStore((state) => state.setDropzoneOpen)
  const setSimulatorOpen = useUiStore((state) => state.setSimulatorOpen)
  const setMermaidModalOpen = useUiStore((state) => state.setMermaidModalOpen)
  const setForkModalOpen = useUiStore((state) => state.setForkModalOpen)
  const setCompareModalOpen = useUiStore((state) => state.setCompareModalOpen)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is focused inside input, textarea, or contentEditable
      const target = e.target as HTMLElement
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.classList.contains('monaco-editor') ||
          target.closest('.monaco-editor'))
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        setIsPlaying(!isPlaying)
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        stepForward()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        stepBackward()
      } else if (e.code === 'Digit1') {
        setActiveTab('timeline')
      } else if (e.code === 'Digit2') {
        setActiveTab('analytics')
      } else if (e.code === 'Digit3') {
        setActiveTab('diff')
      } else if (e.code === 'Digit4') {
        setActiveTab('compare')
      } else if (e.code === 'Escape') {
        setDrawerOpen(false)
        selectSpan(null)
        setDropzoneOpen(false)
        setSimulatorOpen(false)
        setMermaidModalOpen(false)
        setForkModalOpen(false)
        setCompareModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isPlaying,
    setIsPlaying,
    stepForward,
    stepBackward,
    selectSpan,
    setActiveTab,
    setDrawerOpen,
    setDropzoneOpen,
    setSimulatorOpen,
    setMermaidModalOpen,
    setForkModalOpen,
    setCompareModalOpen,
  ])
}
