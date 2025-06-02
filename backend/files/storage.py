from django.core.files.storage import FileSystemStorage
from django.conf import settings
import os
import shutil

class SafeFileStorage(FileSystemStorage):
    def _save(self, name, content):
        """
        Save the file content with proper handling of both temporary and in-memory files
        """
        full_path = os.path.join(self.location, name)
        directory = os.path.dirname(full_path)

        if not os.path.exists(directory):
            os.makedirs(directory)

        if hasattr(content, 'temporary_file_path'):
            # For TemporaryUploadedFile
            if os.path.exists(content.temporary_file_path()):
                shutil.copy2(content.temporary_file_path(), full_path)
            return name
        else:
            # For InMemoryUploadedFile
            with open(full_path, 'wb') as dest:
                for chunk in content.chunks():
                    dest.write(chunk)
            return name

    def get_available_name(self, name, max_length=None):
        """
        Returns a filename that's free on the target storage system.
        """
        dir_name, file_name = os.path.split(name)
        file_root, file_ext = os.path.splitext(file_name)

        while self.exists(name):
            # Add a UUID to ensure uniqueness
            import uuid
            name = os.path.join(dir_name, f"{file_root}_{uuid.uuid4().hex[:8]}{file_ext}")

        return name