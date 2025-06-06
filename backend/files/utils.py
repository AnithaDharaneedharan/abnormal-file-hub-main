def get_file_category(mime_type: str) -> str:
    """
    Determine file category based on MIME type.
    """
    if not mime_type:
        return 'other'

    mime_type = mime_type.lower()

    # Images
    if mime_type.startswith('image/'):
        return 'image'

    # Videos
    if mime_type.startswith('video/'):
        return 'video'

    # Audio
    if mime_type.startswith('audio/'):
        return 'audio'

    # Spreadsheets - Check before general text/* to catch CSV
    if mime_type in ['application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/csv']:
        return 'spreadsheet'

    # Code files - Check before general text/* to catch specific code types
    if mime_type in ['text/x-python', 'application/javascript',
                    'text/html', 'text/css', 'application/json']:
        return 'code'

    # Documents - General text/* check comes after specific text/* types
    if mime_type.startswith('text/') or \
       mime_type in ['application/pdf', 'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
        return 'document'

    # Archives
    if mime_type in ['application/zip', 'application/x-rar-compressed',
                    'application/x-tar', 'application/x-7z-compressed',
                    'application/gzip']:
        return 'archive'

    return 'other'
