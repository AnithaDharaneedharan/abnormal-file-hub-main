import React from "react";
import { expect, jest, describe, test, beforeEach } from "@jest/globals";
import "../setupTests";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileUpload } from "../components/FileUpload";
import * as fileService from "../services/fileService";

jest.mock("../services/fileService");

const queryClient = new QueryClient();

const renderWithClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("FileUpload Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders dropzone", () => {
    renderWithClient(<FileUpload />);
    expect(
      screen.getByText(/drag and drop your file here/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/select file/i)).toBeInTheDocument();
  });

  test("uploads file on file selection", async () => {
    const mockFile = new File(["hello"], "hello.png", { type: "image/png" });

    fileService.fileService.uploadFile = jest
      .fn()
      .mockImplementation((_file, onProgress) => {
        onProgress(50);
        return Promise.resolve({ id: "123", isDuplicate: false });
      });

    renderWithClient(<FileUpload />);
    const input = screen.getByLabelText(/select file/i);
    fireEvent.change(input, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByText(/uploading hello.png/i)).toBeInTheDocument();
      expect(fileService.fileService.uploadFile).toHaveBeenCalled();
    });
  });

  test("shows success message", async () => {
    const mockFile = new File(["hello"], "hello.txt", { type: "text/plain" });

    fileService.fileService.uploadFile = jest.fn().mockResolvedValue({
      id: "1",
      isDuplicate: false,
    });

    renderWithClient(<FileUpload />);
    const input = screen.getByLabelText(/select file/i);
    fireEvent.change(input, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/file uploaded successfully/i)
      ).toBeInTheDocument();
    });
  });

  test("shows error message", async () => {
    const mockFile = new File(["bad"], "bad.txt", { type: "text/plain" });

    fileService.fileService.uploadFile = jest
      .fn()
      .mockRejectedValue(new Error("Upload failed"));

    renderWithClient(<FileUpload />);
    const input = screen.getByLabelText(/select file/i);
    fireEvent.change(input, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  test("allows re-upload after success", async () => {
    const mockFile = new File(["good"], "good.txt", { type: "text/plain" });

    fileService.fileService.uploadFile = jest.fn().mockResolvedValue({
      id: "2",
      isDuplicate: false,
    });

    renderWithClient(<FileUpload />);
    const input = screen.getByLabelText(/select file/i);
    fireEvent.change(input, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByText(/upload another file/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/upload another file/i));
    expect(
      screen.getByText(/drag and drop your file here/i)
    ).toBeInTheDocument();
  });
});
