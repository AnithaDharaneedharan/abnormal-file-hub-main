/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R extends void | Promise<void>, T> {
      toBeInTheDocument(): R;
    }
  }
}