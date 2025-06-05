/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Expect {
      toBeInTheDocument(): any;
    }
  }
}

export {};