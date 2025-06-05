import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

// Mock the child components
jest.mock("../components/Header", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-header">Header</div>,
}));

jest.mock("../components/FileUpload", () => ({
  FileUpload: () => <div data-testid="mock-file-upload">FileUpload</div>,
}));

jest.mock("../components/FileList", () => ({
  FileList: () => <div data-testid="mock-file-list">FileList</div>,
}));

// Mock ReactQueryDevtools to avoid errors
jest.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => null,
}));

describe("App Component", () => {
  test("renders main components", () => {
    render(<App />);

    // Check if all main components are rendered
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();
    expect(screen.getByTestId("mock-file-upload")).toBeInTheDocument();
    expect(screen.getByTestId("mock-file-list")).toBeInTheDocument();
  });

  test("has correct layout structure", () => {
    render(<App />);

    // Check if the main container has the correct classes
    const mainContainer =
      screen.getByTestId("mock-header").parentElement?.parentElement;
    expect(mainContainer).toHaveClass("min-h-screen", "bg-gray-100", "py-6");

    // Check if the content wrapper has the correct classes
    const contentWrapper = screen.getByTestId("mock-header").parentElement;
    expect(contentWrapper).toHaveClass("max-w-7xl", "mx-auto", "px-4");
  });
});
