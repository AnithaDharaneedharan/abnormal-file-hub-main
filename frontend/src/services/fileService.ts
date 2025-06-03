import { apiClient } from '../api/client';
import { FileType, UploadResponse, FileUpload } from '../types/fileTypes';

export const fileService = {
    uploadFile: async (fileUpload: FileUpload, onProgress?: (progress: number) => void): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', fileUpload.file);

        const response = await apiClient.post<UploadResponse>('/files/', formData, {
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress?.(progress);
                }
            },
        });

        return {
            ...response.data,
            isDuplicate: response.data.isDuplicate || false
        };
    },

    getFiles: async (params?: {
        search?: string;
        date?: string;
        size?: string;
        searchType?: 'filename' | 'content';
    }): Promise<FileType[]> => {
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
        const response = await apiClient.get<FileType[]>('/files/', { params: searchParams });
        return response.data;
    },

    deleteFile: async (fileId: string): Promise<void> => {
        await apiClient.delete(`/files/${fileId}/`);
    },
};