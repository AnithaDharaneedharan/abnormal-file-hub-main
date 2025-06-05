/// <reference types="@testing-library/jest-dom" />

declare namespace jest {
  interface Matchers<R, T> {
    toBeInTheDocument(): R;
  }
}

export {};