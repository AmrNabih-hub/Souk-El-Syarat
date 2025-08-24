/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';

declare global {
  namespace Vi {
    interface JestAssertion<T = any> {
      toBeInTheDocument(): T;
      toHaveClass(className: string): T;
      toHaveTextContent(text: string | RegExp): T;
      toBeVisible(): T;
      toBeDisabled(): T;
      toBeEnabled(): T;
      toHaveValue(value: string | number): T;
      toBeChecked(): T;
      toHaveAttribute(attr: string, value?: string): T;
    }
  }
}
