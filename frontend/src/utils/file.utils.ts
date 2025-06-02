export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const generateFileId = (): string => {
    return Math.random().toString(36).substr(2, 9);
};

export const getFileExtension = (filename: string): string => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
    const extension = getFileExtension(file.name).toLowerCase();
    return allowedTypes.includes(extension);
};

export const isValidFileSize = (file: File, maxSizeInBytes: number): boolean => {
    return file.size <= maxSizeInBytes;
};
