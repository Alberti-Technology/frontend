import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWebSocketSync } from '../useWebSocketSync';
import { 
  MICROGRAPHY_MEASURE_COMPLETED_EVENT, 
  REPORT_GENERATION_STATUS_EVENT 
} from '../../services/notifications';

describe('useWebSocketSync', () => {
  let fetchAllMock: any;
  let refreshReportHistoryMock: any;
  let setMeasureEventsByIdMock: any;
  let missingActiveMicrografiaRefreshRef: any;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchAllMock = vi.fn().mockResolvedValue({});
    refreshReportHistoryMock = vi.fn().mockResolvedValue({});
    setMeasureEventsByIdMock = vi.fn();
    missingActiveMicrografiaRefreshRef = { current: 'test' };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('debe despachar show_toast de éxito cuando llega un reporte completado', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderHook(() => useWebSocketSync({
      token: 'fake',
      companyEnabled: true,
      fetchAll: fetchAllMock,
      refreshReportHistory: refreshReportHistoryMock,
      setMeasureEventsById: setMeasureEventsByIdMock,
      missingActiveMicrografiaRefreshRef
    }));

    window.dispatchEvent(new CustomEvent(REPORT_GENERATION_STATUS_EVENT, {
      detail: { status: 'completed', report_name: 'TestReport' }
    }));

    expect(refreshReportHistoryMock).toHaveBeenCalled();
    const lastCall = dispatchSpy.mock.calls.find(c => (c[0] as CustomEvent).type === 'show_toast');
    expect(lastCall).toBeTruthy();
    expect((lastCall?.[0] as CustomEvent).detail.type).toBe('success');
  });

  it('debe actualizar estado cuando una medición se completa', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    renderHook(() => useWebSocketSync({
      token: 'fake',
      companyEnabled: true,
      fetchAll: fetchAllMock,
      refreshReportHistory: refreshReportHistoryMock,
      setMeasureEventsById: setMeasureEventsByIdMock,
      missingActiveMicrografiaRefreshRef
    }));

    window.dispatchEvent(new CustomEvent(MICROGRAPHY_MEASURE_COMPLETED_EVENT, {
      detail: { micrografia_id: 1, status: 'completed', is_valid: true }
    }));

    expect(setMeasureEventsByIdMock).toHaveBeenCalled();
    expect(fetchAllMock).toHaveBeenCalled();
    expect(missingActiveMicrografiaRefreshRef.current).toBeNull();
    
    const lastCall = dispatchSpy.mock.calls.find(c => (c[0] as CustomEvent).type === 'show_toast');
    expect((lastCall?.[0] as CustomEvent).detail.type).toBe('success');
  });
});
