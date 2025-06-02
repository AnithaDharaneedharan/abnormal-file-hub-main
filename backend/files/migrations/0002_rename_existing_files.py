from django.db import migrations
import uuid
import os
from django.core.files.storage import default_storage
from django.core.files import File

def rename_existing_files(apps, schema_editor):
    # Get the historical model
    FileModel = apps.get_model('files', 'File')

    for file_obj in FileModel.objects.all():
        if not file_obj.file:
            continue

        try:
            # Get current file path and check if file exists
            current_path = file_obj.file.name
            if not default_storage.exists(current_path):
                continue

            # Generate new UUID filename
            _, ext = os.path.splitext(current_path)
            ext = ext.lower() if ext else ''
            new_filename = f"{uuid.uuid4()}{ext}"
            new_path = os.path.join('uploads', new_filename)

            # Only rename if the current filename doesn't match UUID pattern
            if not current_path.endswith(new_filename):
                # Open and read the current file
                with default_storage.open(current_path, 'rb') as current_file:
                    # Save to new location
                    file_obj.file.save(new_filename, File(current_file), save=False)

                # Delete the old file
                default_storage.delete(current_path)

                # Save the model
                file_obj.save()
        except Exception as e:
            print(f"Error processing file {file_obj.original_filename}: {str(e)}")

def reverse_migrate(apps, schema_editor):
    # No reverse migration needed as we can't reliably restore original filenames
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('files', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(rename_existing_files, reverse_migrate),
    ]