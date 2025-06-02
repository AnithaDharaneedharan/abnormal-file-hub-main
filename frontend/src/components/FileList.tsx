import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentIcon, TrashIcon } from '@heroicons/react/24/solid';
import { fileService } from '../services/fileService';
import { FileType } from '../types/fileTypes';

export const FileList: React.FC = () => {
    const queryClient = useQueryClient();
    const { data: files, isLoading, error } = useQuery<FileType[]>({
        queryKey: ['files'],
        queryFn: fileService.getFiles,
    });

    const deleteMutation = useMutation({
        mutationFn: (fileId: string) => fileService.deleteFile(fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const handleDelete = (fileId: string) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            deleteMutation.mutate(fileId);
        }
    };

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
                No files uploaded yet.
            </div>
        );
    }

    return (
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
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
                                <div className="mt-1">
                                    <a
                                        href={file.url}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Download
                                    </a>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(file.id)}
                            className="text-red-600 hover:text-red-800"
                            disabled={deleteMutation.isPending}
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </li>
                ))}
            </ul>
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