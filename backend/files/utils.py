def get_file_category(mime_type):
    if mime_type.startswith("image/"):
        return "image"
    elif mime_type.startswith("video/"):
        return "video"
    elif mime_type.startswith("text/"):
        return "text"
    elif mime_type in ["application/pdf"]:
        return "pdf"
    elif mime_type.startswith("application/vnd"):
        return "doc"  # MS Office formats
    else:
        return "other"
