import React, { useCallback, useRef } from 'react';
import { CloudArrowUpIcon } from '../ui/Icons';

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void;
  isDragging: boolean;
  onDragStateChange: (isDragging: boolean) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesAdded,
  isDragging,
  onDragStateChange,
  acceptedTypes,
  maxFiles
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragStateChange(true);
  }, [onDragStateChange]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragStateChange(false);
  }, [onDragStateChange]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragStateChange(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const filesToAdd = maxFiles ? droppedFiles.slice(0, maxFiles) : droppedFiles;
    onFilesAdded(filesToAdd);
  }, [onFilesAdded, onDragStateChange, maxFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const filesToAdd = maxFiles ? selectedFiles.slice(0, maxFiles) : selectedFiles;
    onFilesAdded(filesToAdd);
  };

  const acceptString = acceptedTypes?.join(',') || '*/*';

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
        ${isDragging 
          ? 'border-blue-500 bg-blue-50 scale-105' 
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept={acceptString}
      />
      
      <CloudArrowUpIcon className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
      
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        {isDragging ? 'Drop files here!' : 'Upload Files to Vault'}
      </h3>
      
      <p className="text-gray-500 mb-6">
        Drag and drop files here, or click to select files
      </p>
      
      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        type="button"
      >
        Select Files
      </button>
    </div>
  );
};