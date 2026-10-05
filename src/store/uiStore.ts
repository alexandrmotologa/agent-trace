import { create } from 'zustand'

export type ViewTab = 'timeline' | 'diff' | 'analytics' | 'raw'

interface UiStoreState {
  activeTab: ViewTab
  isDrawerOpen: boolean
  isDropzoneOpen: boolean
  isSimulatorOpen: boolean
  isReportModalOpen: boolean
  zoomLevel: number
  showMiniMap: boolean
  showRuler: boolean

  // Actions
  setActiveTab: (tab: ViewTab) => void
  setDrawerOpen: (open: boolean) => void
  setDropzoneOpen: (open: boolean) => void
  setSimulatorOpen: (open: boolean) => void
  setReportModalOpen: (open: boolean) => void
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
  zoomLevel: 1,
  showMiniMap: true,
  showRuler: true,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
  setDropzoneOpen: (open) => set({ isDropzoneOpen: open }),
  setSimulatorOpen: (open) => set({ isSimulatorOpen: open }),
  setReportModalOpen: (open) => set({ isReportModalOpen: open }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  toggleMiniMap: () => set((state) => ({ showMiniMap: !state.showMiniMap })),
  toggleRuler: () => set((state) => ({ showRuler: !state.showRuler })),
}))
