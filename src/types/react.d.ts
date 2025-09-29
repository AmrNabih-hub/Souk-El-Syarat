// This file provides minimal React type extensions only where needed
// The main React types should come from @types/react

/// <reference types="react" />
/// <reference types="react-dom" />

// Only declare global extensions, not module overrides
declare global {
  namespace JSX {
    // Catch-all for any additional custom elements if needed
    interface IntrinsicElements {
      [elemName: string]: unknown;
    }
  }
}

export {};
