import { vi } from 'vitest';
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
  browser: false,
  dev: true,
  version: '1.0.0'
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn()
  },
  navigating: {
    subscribe: vi.fn()
  },
  updated: {
    subscribe: vi.fn()
  }
}));

// Mock environment variables
process.env.NODE_ENV = 'test';