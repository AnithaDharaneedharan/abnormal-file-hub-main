import React, { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpTrayIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { fileService } from '../services/fileService';
import { FileUpload as FileUploadType, UploadResponse } from '../types/fileTypes';
import { v4 as uuidv4 } from 'uuid';

export const FileUpload: React.FC = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [currentUpload, setCurrentUpload] = useState<FileUploadType | null>(null);
    const queryClient = useQueryClient();

    const uploadMutation = useMutation<UploadResponse, Error, FileUploadType>({
        mutationFn: (fileUpload) => {
            return fileService.uploadFile(fileUpload, (progress) => {
                setCurrentUpload((prev) =>
                    prev ? { ...prev, progress, status: 'uploading' } : null
                );
            });
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            if (response.isDuplicate) {
                setCurrentUpload((prev) =>
                    prev ? {
                        ...prev,
                        status: 'completed',
                        errorMessage: 'File already exists in the system',
                        fileId: response.id
                    } : null
                );
            } else {
                setCurrentUpload((prev) =>
                    prev ? {
                        ...prev,
                        status: 'success',
                        successMessage: 'File uploaded successfully',
                        fileId: response.id
                    } : null
                );
            }
        },
        onError: (error) => {
            setCurrentUpload((prev) =>
                prev ? {
                    ...prev,
                    status: 'error',
                    errorMessage: error.message || 'Upload failed. Please try again.'
                } : null
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (fileId: string) => fileService.deleteFile(fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            setCurrentUpload(null);
        },
        onError: (error) => {
            setCurrentUpload((prev) =>
                prev ? {
                    ...prev,
                    status: 'error',
                    errorMessage: 'Failed to delete file. Please try again.'
                } : null
            );
        },
    });

    const createFileUpload = (file: File): FileUploadType => ({
        id: uuidv4(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
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

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const fileUpload = createFileUpload(files[0]);
            setCurrentUpload(fileUpload);
            uploadMutation.mutate(fileUpload);
        }
    }, [uploadMutation]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const fileUpload = createFileUpload(files[0]);
            setCurrentUpload(fileUpload);
            uploadMutation.mutate(fileUpload);
        }
    }, [uploadMutation]);

    const handleDelete = useCallback((fileId: string) => {
        if (fileId) {
            deleteMutation.mutate(fileId);
        }
    }, [deleteMutation]);

    return (
        <div className="w-full max-w-xl mx-auto p-6">
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {currentUpload?.status === 'uploading'
                        ? `Uploading ${currentUpload.name}...`
                        : 'Drag and drop your file here'}
                </h3>
                {currentUpload?.status === 'uploading' && (
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${currentUpload.progress}%` }}
                            ></div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
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
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
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
                {(currentUpload?.status === 'error' || currentUpload?.status === 'completed' || currentUpload?.status === 'success') && (
                    <div className="mt-2">
                        <div className={`text-sm flex items-center justify-center ${
                            currentUpload.status === 'error'
                                ? 'text-red-600'
                                : currentUpload.status === 'success'
                                    ? 'text-green-600'
                                    : 'text-yellow-600'
                        }`}>
                            {currentUpload.status === 'success' && (
                                <CheckCircleIcon className="h-5 w-5 mr-1" />
                            )}
                            {currentUpload.status === 'success'
                                ? currentUpload.successMessage
                                : currentUpload.errorMessage}
                        </div>
                        <div className="mt-2 flex justify-center space-x-2">
                            <button
                                onClick={() => setCurrentUpload(null)}
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                                {currentUpload.status === 'success' ? 'Upload another file' : 'Try another file'}
                            </button>
                            {currentUpload.fileId && (
                                <button
                                    onClick={() => handleDelete(currentUpload.fileId!)}
                                    className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
                                    disabled={deleteMutation.isPending}
                                >
                                    <TrashIcon className="h-4 w-4 mr-1" />
                                    {deleteMutation.isPending ? 'Deleting...' : 'Delete file'}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};