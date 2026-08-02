import { describe, it, expect, beforeEach } from 'vitest';
import { useReportStore } from '../useReportStore';

describe('useReportStore', () => {
  beforeEach(() => {
    useReportStore.setState({
      queuedPdfMuestraIds: new Set(),
      dirtyPdfMuestraIds: new Set(),
      reportConfig: {
        include_masks: true,
        include_histograms: true,
        custom_text: "",
        manual_conclusion: "",
        send_email: true,
      },
      pdfHistory: [],
      pdfStatusMessage: null,
      selectedPdfMuestraId: null,
    });
  });

  it('debe actualizar el estado con un valor directo', () => {
    const store = useReportStore.getState();

    store.setQueuedPdfMuestraIds(new Set(['1', '2']));
    expect(useReportStore.getState().queuedPdfMuestraIds.has('1')).toBe(true);

    store.setDirtyPdfMuestraIds(new Set(['3']));
    expect(useReportStore.getState().dirtyPdfMuestraIds.has('3')).toBe(true);

    store.setPdfHistory([{ id: 1 }]);
    expect(useReportStore.getState().pdfHistory).toEqual([{ id: 1 }]);

    store.setPdfStatusMessage('Generando...');
    expect(useReportStore.getState().pdfStatusMessage).toBe('Generando...');

    store.setSelectedPdfMuestraId('10');
    expect(useReportStore.getState().selectedPdfMuestraId).toBe('10');
  });

  it('debe actualizar el estado con una función updater', () => {
    const store = useReportStore.getState();

    store.setReportConfig(prev => ({ ...prev, custom_text: 'Nuevo texto' }));
    expect(useReportStore.getState().reportConfig.custom_text).toBe('Nuevo texto');

    store.setPdfHistory(prev => [...prev, { id: 2 }]);
    expect(useReportStore.getState().pdfHistory).toHaveLength(1);
    expect(useReportStore.getState().pdfHistory[0]).toEqual({ id: 2 });
  });
});
