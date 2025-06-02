import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DocumentIcon } from '@heroicons/react/24/solid';
import { fileService } from '../services/fileService';
import { FileType } from '../types/fileTypes';

export const FileList: React.FC = () => {
    const { data: files, isLoading, error } = useQuery<FileType[]>({
        queryKey: ['files'],
        queryFn: fileService.getFiles,
    });

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
                No files uploaded yet.
            </div>
        );
    }

    return (
        <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <ul role="list" className="divide-y divide-gray-200">
                {files.map((file) => (
                    <li key={file.id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center">
                            <DocumentIcon className="h-6 w-6 text-gray-400" />
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {file.filename}
                                </p>
                                <div className="mt-1 flex text-xs text-gray-500">
                                    <span>{formatFileSize(file.size)}</span>
                                    <span className="mx-2">•</span>
                                    <span>{new Date(file.uploaded_at).toLocaleString()}</span>
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                    Hash: {file.hash}
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