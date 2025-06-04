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
}

export interface FileType {
    id: string;
    url: string;
    file: string;
    original_filename: string;
    file_type: string;
    size: number;
    uploaded_at: string;
    file_hash: string;
    isDuplicate?: boolean;
    message?: string;
}

// Response from the server when uploading a file
export interface UploadResponse extends FileType {}

export interface FileListItem {
    id: string;
    filename: string;
    size: number;
    url: string;
    file_hash: string;
    uploadedAt: string;
}