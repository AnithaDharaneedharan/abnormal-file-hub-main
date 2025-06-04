import React, { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpTrayIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { fileService } from "../services/fileService";
import {
  FileUpload as FileUploadType,
  UploadResponse,
} from "../types/fileTypes";
import { v4 as uuidv4 } from "uuid";

// CSS Animation for the border
const borderAnimation = `@keyframes dash {
    to {
        stroke-dashoffset: -20;
    }
}`;

export const FileUpload: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<FileUploadType | null>(
    null
  );
  const queryClient = useQueryClient();

  const uploadMutation = useMutation<UploadResponse, Error, FileUploadType>({
    mutationFn: (fileUpload) => {
      return fileService.uploadFile(fileUpload, (progress) => {
        setCurrentUpload((prev) =>
          prev ? { ...prev, progress, status: "uploading" } : null
        );
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      if (response.isDuplicate) {
        setCurrentUpload((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                errorMessage: "File already exists in the system",
                fileId: response.id,
              }
            : null
        );
      } else {
        setCurrentUpload((prev) =>
          prev
            ? {
                ...prev,
                status: "success",
                successMessage: "File uploaded successfully",
                fileId: response.id,
              }
            : null
        );
      }
    },
    onError: (error) => {
      setCurrentUpload((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              errorMessage: error.message || "Upload failed. Please try again.",
            }
          : null
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => fileService.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      setCurrentUpload(null);
    },
    onError: (error) => {
      setCurrentUpload((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              errorMessage: "Failed to delete file. Please try again.",
            }
          : null
      );
    },
  });

  const createFileUpload = (file: File): FileUploadType => ({
    id: uuidv4(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    status: "pending",
    progress: 0,
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const fileUpload = createFileUpload(files[0]);
        setCurrentUpload(fileUpload);
        uploadMutation.mutate(fileUpload);
      }
    },
    [uploadMutation]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const fileUpload = createFileUpload(files[0]);
        setCurrentUpload(fileUpload);
        uploadMutation.mutate(fileUpload);
      }
    },
    [uploadMutation]
  );

  const handleDelete = useCallback(
    (fileId: string) => {
      if (fileId) {
        deleteMutation.mutate(fileId);
      }
    },
    [deleteMutation]
  );

  return (
    <>
      <style>{borderAnimation}</style>
      <div className="w-full max-w-xl mx-auto p-6">
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            isDragging
              ? "border-white bg-gray-900"
              : "border-gray-700 hover:border-gray-500"
          } bg-black shadow-md shadow-gray-900/50 overflow-hidden group`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Animated Border Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-30 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <rect
                width="100%"
                height="100%"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="10 10"
                rx="12"
                className="animate-[dash_20s_linear_infinite]"
              />
            </svg>
          </div>

          <div className="relative">
            <ArrowUpTrayIcon
              className={`mx-auto h-12 w-12 transition-colors duration-200 ${
                isDragging
                  ? "text-white"
                  : "text-gray-400 group-hover:text-gray-300"
              }`}
            />
            <h3 className="mt-2 text-sm font-medium text-white">
              {currentUpload?.status === "uploading"
                ? `Uploading ${currentUpload.name}...`
                : "Drag and drop your file here"}
            </h3>
            {currentUpload?.status === "uploading" && (
              <div className="mt-4">
                <div className="w-full bg-gray-800 rounded-full h-2.5">
                  <div
                    className="bg-white h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${currentUpload.progress}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {currentUpload.progress}% complete
                </p>
              </div>
            )}
            {!currentUpload && (
              <>
                <p className="mt-1 text-sm text-gray-500">Or</p>
                <div className="mt-4">
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 cursor-pointer transition-colors duration-200 shadow-sm shadow-gray-900/50"
                  >
                    Select file
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              </>
            )}
            {(currentUpload?.status === "error" ||
              currentUpload?.status === "completed" ||
              currentUpload?.status === "success") && (
              <div className="mt-2">
                <div
                  className={`text-sm flex items-center justify-center ${
                    currentUpload.status === "error"
                      ? "text-gray-200"
                      : currentUpload.status === "success"
                      ? "text-white"
                      : "text-gray-300"
                  }`}
                >
                  {currentUpload.status === "success" && (
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                  )}
                  {currentUpload.status === "success"
                    ? currentUpload.successMessage
                    : currentUpload.errorMessage}
                </div>
                <div className="mt-2 flex justify-center space-x-2">
                  <button
                    onClick={() => setCurrentUpload(null)}
                    className="text-sm text-gray-400 hover:text-white underline transition-colors duration-200"
                  >
                    {currentUpload.status === "success"
                      ? "Upload another file"
                      : "Try another file"}
                  </button>
                  {currentUpload.fileId && (
                    <button
                      onClick={() => handleDelete(currentUpload.fileId!)}
                      className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors duration-200"
                      disabled={deleteMutation.isPending}
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      {deleteMutation.isPending ? "Deleting..." : "Delete file"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
