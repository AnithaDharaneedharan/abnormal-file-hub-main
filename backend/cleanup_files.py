import os
import uuid
import re
import django
from django.core.files import File
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from files.models import File as FileModel

def is_uuid_filename(filename):
    """Check if filename follows UUID pattern"""
    pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$'
    return bool(re.match(pattern, filename.lower()))

def cleanup_files():
    """Rename any remaining non-UUID files"""
    media_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')

    # Get all files in the uploads directory
    for filename in os.listdir(media_dir):
        if not is_uuid_filename(filename):
            old_path = os.path.join(media_dir, filename)

            # Generate new UUID filename
            _, ext = os.path.splitext(filename)
            ext = ext.lower() if ext else ''
            new_filename = f"{uuid.uuid4()}{ext}"
            new_path = os.path.join(media_dir, new_filename)

            try:
                # Rename the file
                os.rename(old_path, new_path)
                print(f"Renamed: {filename} -> {new_filename}")

                # Update any database records
                for file_obj in FileModel.objects.filter(file__endswith=filename):
                    with open(new_path, 'rb') as f:
                        file_obj.file.save(new_filename, File(f), save=True)
                    print(f"Updated database record for {filename}")

            except Exception as e:
                print(f"Error processing {filename}: {str(e)}")

if __name__ == '__main__':
    cleanup_files()