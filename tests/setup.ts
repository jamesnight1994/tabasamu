import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';
import { resetMockState, configureMocks } from '../src/adapters/mock';
import { resetAdapters } from '../src/adapters';

beforeEach(() => {
  resetMockState();
  resetAdapters();
  // Deterministic and instant in unit tests.
  configureMocks({ latencyMs: 0, failureRate: 0 });
});
