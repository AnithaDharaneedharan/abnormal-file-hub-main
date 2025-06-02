import React from 'react';
import { FolderIcon } from '../ui/Icons';

export const Header: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
      <div className="flex items-center gap-3">
        <FolderIcon className="w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold">Abnormal File Vault</h1>
          <p className="text-purple-100">Secure file storage with intelligent deduplication</p>
        </div>
      </div>
    </div>
  );
};