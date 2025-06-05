export interface FileUpload {
    id: string;
    file: File;
    name: string;
    size: number;
    status: 'pending' | 'uploading' | 'completed' | 'error' | 'success';
    progress: number;
    type: string;
    errorMessage?: string;
    successMessage?: string;
    fileId?: string; // ID of the uploaded file from the server
    onProgress?: (progress: number) => void;
}

export interface FileType {
    id: string;
    original_filename: string;
    file_type: string;
    size: number;
    uploaded_at: string;
    url: string;
    category: string;
    isDuplicate?: boolean;
}

// Response from the server when uploading a file
export interface UploadResponse {
    id: string;
    original_filename: string;
    file_type: string;
    size: number;
    uploaded_at: string;
    url: string;
    category: string;
    isDuplicate?: boolean;
}

export interface FileListItem {
    id: string;
    filename: string;
    size: number;
    url: string;
    file_hash: string;
    uploadedAt: string;
}