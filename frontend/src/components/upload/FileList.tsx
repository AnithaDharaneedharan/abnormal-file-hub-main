import React from 'react';
import { FileUpload } from '../../types/fileTypes';
import { FileItem } from './FileItem';

interface FileListProps {
  files: FileUpload[];
  onRemoveFile: (fileId: string) => void;
  onUploadFiles: () => void;
  onClearCompleted: () => void;
  isUploading: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onRemoveFile,
  onUploadFiles,
  onClearCompleted,
  isUploading
}) => {
  const pendingCount = files.filter(f => f.status === 'pending').length;
  const completedCount = files.filter(f => f.status === 'completed').length;

  if (files.length === 0) return null;

  return (
    <div className="border-t bg-gray-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Files ({files.length})
          </h3>
          <div className="flex gap-2">
            {completedCount > 0 && (
              <button
                onClick={onClearCompleted}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded border hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                type="button"
              >
                Clear Completed ({completedCount})
              </button>
            )}
            {pendingCount > 0 && (
              <button
                onClick={onUploadFiles}
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                type="button"
              >
                {isUploading ? 'Uploading...' : `Upload ${pendingCount} Files`}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              onRemove={onRemoveFile}
            />
          ))}
        </div>
      </div>
    </div>
  );
};