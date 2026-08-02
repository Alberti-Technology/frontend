import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  connectNotificationsWebSocket, 
  disconnectNotificationsWebSocket,
  MICROGRAPHY_MEASURE_COMPLETED_EVENT,
  REPORT_GENERATION_STATUS_EVENT
} from '../notifications';

// Para mockear el WebSocket global
class MockWebSocket {
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulamos que se conecta asíncronamente
    setTimeout(() => this.onopen?.(), 10);
  }
  close() {
    this.onclose?.();
  }
}

describe('notifications', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockWebSocket);
    vi.clearAllMocks();
  });

  afterEach(() => {
    disconnectNotificationsWebSocket();
    vi.unstubAllGlobals();
  });

  it('debe despachar evento micrography_measure_completed', () => {
    return new Promise<void>((resolve) => {
      const socket = connectNotificationsWebSocket('fake-token') as unknown as MockWebSocket;
      expect(socket).not.toBeNull();
      
      window.addEventListener(MICROGRAPHY_MEASURE_COMPLETED_EVENT, (e: any) => {
        expect(e.detail.status).toBe('completed');
        resolve();
      }, { once: true });

      // Simular recepción del mensaje
      setTimeout(() => {
        socket.onmessage?.({
          data: JSON.stringify({ type: 'micrography_measure.completed', status: 'completed' })
        });
      }, 50);
    });
  });

  it('debe despachar evento report_generation_status_update', () => {
    return new Promise<void>((resolve) => {
      const socket = connectNotificationsWebSocket('fake-token') as unknown as MockWebSocket;
      
      window.addEventListener(REPORT_GENERATION_STATUS_EVENT, (e: any) => {
        expect(e.detail.status).toBe('processing');
        resolve();
      }, { once: true });

      setTimeout(() => {
        socket.onmessage?.({
          data: JSON.stringify({ type: 'report_generation.status_update', status: 'processing', report_id: 1 })
        });
      }, 50);
    });
  });

  it('debe despachar evento show_toast si hay error', () => {
    return new Promise<void>((resolve) => {
      const socket = connectNotificationsWebSocket('fake-token') as unknown as MockWebSocket;
      
      window.addEventListener('show_toast', (e: any) => {
        expect(e.detail.type).toBe('warning');
        resolve();
      }, { once: true });

      setTimeout(() => {
        socket.onerror?.();
      }, 50);
    });
  });
});
