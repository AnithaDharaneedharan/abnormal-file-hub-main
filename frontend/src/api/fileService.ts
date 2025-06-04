import { apiClient } from './client';
import { FileType } from '../types/fileTypes';

export const fileService = {
    uploadFile: async (file: File): Promise<FileType> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<FileType>('/files/', formData);
        return response.data;
    },

    getFiles: async (): Promise<FileType[]> => {
        const response = await apiClient.get<FileType[]>('/files/');
        return response.data;
    },
};