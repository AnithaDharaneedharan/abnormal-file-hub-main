import React from 'react';
import {
    DocumentIcon,
    PhotoIcon,
    VideoCameraIcon,
    MusicalNoteIcon,
    TableCellsIcon,
    ArchiveBoxIcon,
    CodeBracketIcon,
} from '@heroicons/react/24/solid';

type FileIconProps = {
    category: string;
    className?: string;
};

export const FileIcon: React.FC<FileIconProps> = ({ category, className = "h-6 w-6" }) => {
    const getColorClass = (category: string): string => {
        switch (category?.toLowerCase()) {
            case 'image':
                return 'text-pink-500';
            case 'video':
                return 'text-purple-500';
            case 'audio':
                return 'text-green-500';
            case 'spreadsheet':
                return 'text-emerald-500';
            case 'archive':
                return 'text-amber-500';
            case 'code':
                return 'text-blue-500';
            case 'document':
            default:
                return 'text-gray-400';
        }
    };

    const combinedClassName = `${className} ${getColorClass(category)}`;

    switch (category?.toLowerCase()) {
        case 'image':
            return <PhotoIcon className={combinedClassName} />;
        case 'video':
            return <VideoCameraIcon className={combinedClassName} />;
        case 'audio':
            return <MusicalNoteIcon className={combinedClassName} />;
        case 'spreadsheet':
            return <TableCellsIcon className={combinedClassName} />;
        case 'archive':
            return <ArchiveBoxIcon className={combinedClassName} />;
        case 'code':
            return <CodeBracketIcon className={combinedClassName} />;
        case 'document':
        default:
            return <DocumentIcon className={combinedClassName} />;
    }
};