import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TrashIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  FunnelIcon,
} from "@heroicons/react/24/solid";
import { fileService, FileFilterType } from "../services/fileService";
import { FileType } from "../types/fileTypes";
import { FileIcon } from "./FileIcon";
import debounce from "lodash/debounce";

export const FileList: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"filename" | "content">(
    "filename"
  );
  const [dateFilter, setDateFilter] = useState("");
  const [sizeFilter, setSizeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<FileFilterType>(null);

  const {
    data: files,
    isLoading,
    error,
  } = useQuery<FileType[]>({
    queryKey: [
      "files",
      searchTerm,
      searchType,
      dateFilter,
      sizeFilter,
      typeFilter,
    ],
    queryFn: () =>
      fileService.getFiles({
        search: searchTerm,
        searchType,
        date: dateFilter,
        size: sizeFilter,
        type: typeFilter,
      }),
    enabled: !searchTerm || searchTerm.length >= 2,
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => fileService.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        if (!value || value.length >= 2) {
          setSearchTerm(value);
        }
      }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleDelete = (fileId: string) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      deleteMutation.mutate(fileId);
    }
  };

  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value as FileFilterType);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-8 bg-black">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-8 text-white bg-black">
          Failed to load files. Please try again.
        </div>
      );
    }

    if (!files?.length) {
      return (
        <div className="text-center p-8 text-gray-400 bg-black">
          {searchTerm
            ? "No files match your search."
            : "No files uploaded yet."}
        </div>
      );
    }

    return (
      <ul className="divide-y divide-gray-800 bg-black">
        {files.map((file) => (
          <li
            key={file.id}
            className="px-6 py-5 sm:px-8 hover:bg-gray-900 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl group"
          >
            <div className="flex items-center">
              <FileIcon category={file.category} />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">
                    {file.original_filename}
                  </p>
                  {file.isDuplicate && (
                    <span className="inline-flex items-center rounded-full bg-gray-800 px-3 py-0.5 text-xs font-medium text-gray-200 shadow-sm shadow-gray-900/50">
                      Duplicate
                    </span>
                  )}
                </div>
                <div className="mt-1 flex text-xs text-gray-400">
                  <span>{formatFileSize(file.size)}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(file.uploaded_at).toLocaleString()}</span>
                </div>
                <div className="mt-2 flex items-center space-x-4">
                  <a
                    href={file.url}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 shadow-sm shadow-gray-900/50"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </a>
                </div>
              </div>
              <button
                onClick={() => handleDelete(file.id)}
                className="text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded-xl hover:bg-gray-800 shadow-sm shadow-gray-900/50 opacity-0 group-hover:opacity-100"
                disabled={deleteMutation.isPending}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-4 p-6 bg-black min-h-screen">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-md shadow-gray-900/50">
        {/* Search Box with Type Toggle */}
        <div className="relative flex-1">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                className="block w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-10 pr-3 text-sm placeholder-gray-500 text-white focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 shadow-sm shadow-gray-900/50"
                placeholder={`Search ${
                  searchType === "content" ? "inside files" : "filenames"
                }...`}
                onChange={handleSearchChange}
                defaultValue={searchTerm}
              />
            </div>
            <select
              className="rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-3 pr-10 text-sm text-white focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 shadow-sm shadow-gray-900/50"
              value={searchType}
              onChange={(e) =>
                setSearchType(e.target.value as "filename" | "content")
              }
            >
              <option value="filename">Filename</option>
              <option value="content">Content</option>
            </select>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex space-x-2">
          <select
            className="rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-3 pr-10 text-sm text-white focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 shadow-sm shadow-gray-900/50"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="year">This year</option>
          </select>
        </div>

        {/* Size Filter */}
        <div className="w-full sm:w-48">
          <select
            className="block w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-3 pr-10 text-sm text-white focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 shadow-sm shadow-gray-900/50"
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
          >
            <option value="">Filter by size</option>
            <option value="small">Small (&lt; 1MB)</option>
            <option value="medium">Medium (1-10MB)</option>
            <option value="large">Large (&gt; 10MB)</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="w-full sm:w-48">
          <select
            className="block w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-3 pr-10 text-sm text-white focus:border-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-600 shadow-sm shadow-gray-900/50"
            value={typeFilter || ""}
            onChange={handleTypeFilterChange}
          >
            <option value="">All file types</option>
            <option value="image">Images</option>
            <option value="document">Documents</option>
            <option value="spreadsheet">Spreadsheets</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="archive">Archives</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden bg-black border border-gray-800 rounded-xl shadow-md shadow-gray-900/50">
        {renderContent()}
      </div>
    </div>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
