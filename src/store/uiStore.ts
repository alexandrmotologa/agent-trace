import { create } from 'zustand'

export type ViewTab = 'timeline' | 'diff' | 'analytics' | 'compare'

interface UiStoreState {
  activeTab: ViewTab
  isDrawerOpen: boolean
  isDropzoneOpen: boolean
  isSimulatorOpen: boolean
  isReportModalOpen: boolean
  isMermaidModalOpen: boolean
  isForkModalOpen: boolean
  isCompareModalOpen: boolean
  zoomLevel: number
  showMiniMap: boolean
  showRuler: boolean

  // Actions
  setActiveTab: (tab: ViewTab) => void
  setDrawerOpen: (open: boolean) => void
  setDropzoneOpen: (open: boolean) => void
  setSimulatorOpen: (open: boolean) => void
  setReportModalOpen: (open: boolean) => void
  setMermaidModalOpen: (open: boolean) => void
  setForkModalOpen: (open: boolean) => void
  setCompareModalOpen: (open: boolean) => void
  setZoomLevel: (zoom: number) => void
  toggleMiniMap: () => void
  toggleRuler: () => void
}

export const useUiStore = create<UiStoreState>((set) => ({
  activeTab: 'timeline',
  isDrawerOpen: true,
  isDropzoneOpen: false,
  isSimulatorOpen: false,
  isReportModalOpen: false,
  isMermaidModalOpen: false,
  isForkModalOpen: false,
  isCompareModalOpen: false,
  zoomLevel: 1,
  showMiniMap: true,
  showRuler: true,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
  setDropzoneOpen: (open) => set({ isDropzoneOpen: open }),
  setSimulatorOpen: (open) => set({ isSimulatorOpen: open }),
  setReportModalOpen: (open) => set({ isReportModalOpen: open }),
  setMermaidModalOpen: (open) => set({ isMermaidModalOpen: open }),
  setForkModalOpen: (open) => set({ isForkModalOpen: open }),
  setCompareModalOpen: (open) => set({ isCompareModalOpen: open }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  toggleMiniMap: () => set((state) => ({ showMiniMap: !state.showMiniMap })),
  toggleRuler: () => set((state) => ({ showRuler: !state.showRuler })),
}))
