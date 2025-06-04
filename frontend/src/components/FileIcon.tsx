import React from "react";
import {
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  TableCellsIcon,
  ArchiveBoxIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/solid";

type FileIconProps = {
  category: string;
  className?: string;
};

export const FileIcon: React.FC<FileIconProps> = ({
  category,
  className = "h-6 w-6",
}) => {


  const combinedClassName = `${className} text-gray-400`;

  switch (category?.toLowerCase()) {
    case "image":
      return <PhotoIcon className={combinedClassName} />;
    case "video":
      return <VideoCameraIcon className={combinedClassName} />;
    case "audio":
      return <MusicalNoteIcon className={combinedClassName} />;
    case "spreadsheet":
      return <TableCellsIcon className={combinedClassName} />;
    case "archive":
      return <ArchiveBoxIcon className={combinedClassName} />;
    case "code":
      return <CodeBracketIcon className={combinedClassName} />;
    case "document":
    default:
      return <DocumentIcon className={combinedClassName} />;
  }
};
