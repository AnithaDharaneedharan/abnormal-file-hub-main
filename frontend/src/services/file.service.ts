import { UploadResponse } from '../types/file.types';

export class FileUploadService {
  private static readonly BASE_URL = '/api/files';
  private static readonly TIMEOUT = 30000; // 30 seconds

  static async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response: UploadResponse = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.message || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.open('POST', `${this.BASE_URL}/upload`);
      xhr.timeout = this.TIMEOUT;
      xhr.send(formData);
    });
  }

  static async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.BASE_URL}/${fileId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  static async getFiles(): Promise<UploadResponse[]> {
    const response = await fetch(`${this.BASE_URL}`);

    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    return response.json();
  }
}