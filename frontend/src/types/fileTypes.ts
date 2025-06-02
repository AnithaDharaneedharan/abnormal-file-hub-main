export interface FileUpload {
    id: string;
    file: File;
    name: string;
    size: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    progress: number;
    type: string;
    errorMessage?: string;
}

export interface FileType {
    id: string;
    url: string;
    filename: string;
    file_type: string;
    size: number;
    uploaded_at: string;
    hash: string;
    isDuplicate?: boolean;
}

// Response from the server when uploading a file
export interface UploadResponse extends FileType {}

export interface FileListItem {
    id: string;
    filename: string;
    size: number;
    url: string;
    hash: string;
    uploadedAt: string;
} 