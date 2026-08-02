import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './tests/mocks/server';
import { act } from '@testing-library/react';
import { resetAllStores } from './tests/utils/resetStores';

beforeAll(() => {
  server.listen({
    onUnhandledRequest(req, print) {
      const url = req.url;
      if (url.includes('hf.space') || url.includes('duckdns.org') || url.includes('nullimage') || url.includes('ws://')) {
        return;
      }
      
      if (url.includes('localhost:8000')) {
        print.warning();
      }
    },
  });
});

afterEach(() => {
  server.resetHandlers();
  act(() => {
    resetAllStores();
  });
});

afterAll(() => server.close());


