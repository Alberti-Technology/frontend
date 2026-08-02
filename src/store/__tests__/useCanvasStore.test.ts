import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../useCanvasStore';

const initialState = useCanvasStore.getState();

describe('useCanvasStore', () => {
  beforeEach(() => {
    useCanvasStore.setState(initialState, true);
  });

  it('debe inicializar correctamente', () => {
    const state = useCanvasStore.getState();
    expect(state.zoomScale).toBe(1);
    expect(state.panOffset).toEqual({ x: 0, y: 0 });
    expect(state.pencilColor).toBe('#000000');
    expect(state.isMaskDrawing).toBe(false);
  });

  it('debe permitir hacer zoom y pan', () => {
    useCanvasStore.getState().setZoomScale(2);
    expect(useCanvasStore.getState().zoomScale).toBe(2);

    useCanvasStore.getState().setPanOffset({ x: 10, y: 20 });
    expect(useCanvasStore.getState().panOffset).toEqual({ x: 10, y: 20 });
  });

  it('debe activar y desactivar herramientas de máscara', () => {
    useCanvasStore.getState().setMaskEditTool('pencil');
    expect(useCanvasStore.getState().maskEditTool).toBe('pencil');
    
    useCanvasStore.getState().setIsMaskDrawing(true);
    expect(useCanvasStore.getState().isMaskDrawing).toBe(true);
  });
});
