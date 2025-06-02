import React from 'react';
import { FileUpload } from '../../types/file.types';
import { formatFileSize } from '../../utils/file.utils';
import { 
  DocumentIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XMarkIcon 
} from '../ui/Icons';

interface FileItemProps {
  file: FileUpload;
  onRemove: (fileId: string) => void;
}

export const FileItem: React.FC<FileItemProps> = ({ file, onRemove }) => {
  const getStatusIcon = (status: FileUpload['status']): React.ReactNode => {
    switch (status) {
      case 'completed': 
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error': 
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default: 
        return <DocumentIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: FileUpload['status']): string => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'uploading': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getStatusIcon(file.status)}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{file.name}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{formatFileSize(file.size)}</span>
              {file.type && (
                <>
                  <span>•</span>
                  <span className="uppercase">{file.type.split('/')[1] || file.type}</span>
                </>
              )}
            </div>
            {file.errorMessage && (
              <p className="text-sm text-red-600 mt-1">{file.errorMessage}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {file.status === 'uploading' && (
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(file.status)}`}
                  style={{ width: `${file.progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 min-w-[3rem]">
                {Math.round(file.progress)}%
              </span>
            </div>
          )}
          
          {file.status === 'completed' && (
            <span className="text-sm text-green-600 font-medium">Uploaded</span>
          )}

          {file.status === 'error' && (
            <span className="text-sm text-red-600 font-medium">Failed</span>
          )}
          
          {(file.status === 'pending' || file.status === 'error') && (
            <button
              onClick={() => onRemove(file.id)}
              className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
              type="button"
              aria-label={`Remove ${file.name}`}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};