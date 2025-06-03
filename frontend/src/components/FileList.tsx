import React, { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { fileService } from '../services/fileService';
import { FileType } from '../types/fileTypes';
import debounce from 'lodash/debounce';

export const FileList: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState<'filename' | 'content'>('filename');
    const [dateFilter, setDateFilter] = useState('');
    const [sizeFilter, setSizeFilter] = useState('');

    const { data: files, isLoading, error } = useQuery<FileType[]>({
        queryKey: ['files', searchTerm, searchType, dateFilter, sizeFilter],
        queryFn: () => fileService.getFiles({
            search: searchTerm,
            searchType,
            date: dateFilter || undefined,
            size: sizeFilter || undefined
        }),
        enabled: !searchTerm || searchTerm.length >= 2,
    });

    const deleteMutation = useMutation({
        mutationFn: (fileId: string) => fileService.deleteFile(fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });

    const debouncedSearch = useMemo(
        () => debounce((value: string) => {
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
        if (window.confirm('Are you sure you want to delete this file?')) {
            deleteMutation.mutate(fileId);
        }
    };

    const handleDateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setDateFilter(e.target.value);
    };

    const handleSizeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSizeFilter(e.target.value);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center p-8 text-red-600">
                    Failed to load files. Please try again.
                </div>
            );
        }

        if (!files?.length) {
            return (
                <div className="text-center p-8 text-gray-500">
                    {searchTerm ? 'No files match your search.' : 'No files uploaded yet.'}
                </div>
            );
        }

        return (
            <ul className="divide-y divide-gray-200">
                {files.map((file) => (
                    <li key={file.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center">
                            <DocumentIcon className="h-6 w-6 text-gray-400" />
                            <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900">
                                        {file.original_filename}
                                    </p>
                                    {file.isDuplicate && (
                                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                            Duplicate
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 flex text-xs text-gray-500">
                                    <span>{formatFileSize(file.size)}</span>
                                    <span className="mx-2">•</span>
                                    <span>{new Date(file.uploaded_at).toLocaleString()}</span>
                                </div>
                                <div className="mt-2 flex items-center space-x-4">
                                    <a
                                        href={file.url}
                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </a>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(file.id)}
                                className="text-red-600 hover:text-red-800"
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
        <div className="space-y-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                {/* Search Box with Type Toggle */}
                <div className="relative flex-1">
                    <div className="flex space-x-2">
                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder={`Search ${searchType === 'content' ? 'inside files' : 'filenames'}...`}
                                onChange={handleSearchChange}
                                defaultValue={searchTerm}
                            />
                        </div>
                        <select
                            className="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value as 'filename' | 'content')}
                        >
                            <option value="filename">Filename</option>
                            <option value="content">Content</option>
                        </select>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="w-full sm:w-48">
                    <select
                        className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={dateFilter}
                        onChange={handleDateFilterChange}
                    >
                        <option value="">Filter by date</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 days</option>
                        <option value="month">Last 30 days</option>
                        <option value="year">Last year</option>
                    </select>
                </div>

                {/* Size Filter */}
                <div className="w-full sm:w-48">
                    <select
                        className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={sizeFilter}
                        onChange={handleSizeFilterChange}
                    >
                        <option value="">Filter by size</option>
                        <option value="small">Small (&lt; 1MB)</option>
                        <option value="medium">Medium (1-10MB)</option>
                        <option value="large">Large (&gt; 10MB)</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                {renderContent()}
            </div>
        </div>
    );
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};