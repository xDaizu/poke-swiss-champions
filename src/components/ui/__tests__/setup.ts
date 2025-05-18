// Set up JSDOM for testing
import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setupJSDOM } from '../../../test-utils/jsdom';

// Setup JSDOM
beforeAll(() => {
  setupJSDOM();
});

// Clean up after tests
afterEach(() => {
  cleanup();
});

// Clean up after all tests
afterAll(() => {
  // Clean up any global objects if needed
}); 