export interface File {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
}

export interface FileType {
    id: string;
    file: string;
    original_filename: string;
    file_type: string;
    size: number;
    uploaded_at: string;
    file_hash: string;
}

export interface FileUploadResponse {
    data: FileType;
}

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

export interface UploadResponse {
    id: string;
    filename: string;
    size: number;
    url: string;
    hash: string;
    isDuplicate: boolean;
}

// Extended interface for file list display
export interface FileListItem extends Omit<UploadResponse, 'isDuplicate'> {
    uploadedAt: string;
} 