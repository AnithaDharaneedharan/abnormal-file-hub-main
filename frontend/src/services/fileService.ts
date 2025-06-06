import { apiClient } from '../api/client';
import { FileType, UploadResponse, FileUpload } from '../types/fileTypes';

export type FileFilterType = 'image' | 'document' | 'spreadsheet' | 'video' | 'audio' | 'archive' | null;

export const fileService = {
    uploadFile: async (fileUpload: FileUpload, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', fileUpload.file);

        const response = await apiClient.post<UploadResponse>('/files/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress?.(progress);
                }
            },
        });

        return response.data;
    },

    getFiles: async (params?: {
        search?: string;
        date?: string;
        size?: string;
        searchType?: 'filename' | 'content';
        type?: FileFilterType;
        startDate?: string;
        endDate?: string;
    }): Promise<{ files: FileType[], metrics: { queryTime: number, serializeTime: number } }> => {
        const searchParams = new URLSearchParams();
        if (params?.search) {
            searchParams.append('search', params.search);
        }
        if (params?.date) {
            searchParams.append('date', params.date);
        }
        if (params?.size) {
            searchParams.append('size', params.size);
        }
        if (params?.searchType) {
            searchParams.append('searchType', params.searchType);
        }
        if (params?.type) {
            searchParams.append('type', params.type);
        }
        if (params?.startDate) {
            searchParams.append('startDate', params.startDate);
        }
        if (params?.endDate) {
            searchParams.append('endDate', params.endDate);
        }

        const response = await apiClient.get<{
            files: FileType[],
            metrics: { queryTime: number, serializeTime: number }
        }>('/files/', { params: searchParams });

        return response.data;
    },

    deleteFile: async (fileId: string): Promise<void> => {
        await apiClient.delete(`/files/${fileId}/`);
    },
};