import '@testing-library/jest-dom';

// Mock Web Worker for jsdom environment
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

globalThis.Worker = MockWorker as unknown as typeof Worker;
