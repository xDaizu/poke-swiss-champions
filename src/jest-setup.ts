// Set up Jest global types
import '@testing-library/jest-dom';

// Extend expect
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeEmptyDOMElement(): R;
    }
  }
} 