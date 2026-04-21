import { create } from 'zustand'

export interface CanvasState {
  // Extend as features are added
}

export const useCanvasStore = create<CanvasState>()(() => ({}))
