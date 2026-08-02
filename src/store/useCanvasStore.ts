import { create } from 'zustand';

type Updater<T> = T | ((prev: T) => T);

interface CanvasState {
  zoomScale: number;
  panOffset: { x: number; y: number };
  isPanning: boolean;
  pencilColor: string;
  maskEditTool: "pencil" | "eraser" | null;
  isMaskDrawing: boolean;
  
  setZoomScale: (updater: Updater<number>) => void;
  setPanOffset: (updater: Updater<{ x: number; y: number }>) => void;
  setIsPanning: (updater: Updater<boolean>) => void;
  setPencilColor: (updater: Updater<string>) => void;
  setMaskEditTool: (updater: Updater<"pencil" | "eraser" | null>) => void;
  setIsMaskDrawing: (updater: Updater<boolean>) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  zoomScale: 1,
  panOffset: { x: 0, y: 0 },
  isPanning: false,
  pencilColor: "#000000",
  maskEditTool: null,
  isMaskDrawing: false,

  setZoomScale: (updater) => set((state) => ({ 
      zoomScale: typeof updater === 'function' ? updater(state.zoomScale) : updater 
  })),
  setPanOffset: (updater) => set((state) => ({ 
      panOffset: typeof updater === 'function' ? updater(state.panOffset) : updater 
  })),
  setIsPanning: (updater) => set((state) => ({ 
      isPanning: typeof updater === 'function' ? updater(state.isPanning) : updater 
  })),
  setPencilColor: (updater) => set((state) => ({ 
      pencilColor: typeof updater === 'function' ? updater(state.pencilColor) : updater 
  })),
  setMaskEditTool: (updater) => set((state) => ({ 
      maskEditTool: typeof updater === 'function' ? updater(state.maskEditTool) : updater 
  })),
  setIsMaskDrawing: (updater) => set((state) => ({ 
      isMaskDrawing: typeof updater === 'function' ? updater(state.isMaskDrawing) : updater 
  })),
}));
