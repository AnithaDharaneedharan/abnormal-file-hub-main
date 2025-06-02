from django.db import models
from django.core.exceptions import ValidationError
import uuid
import os
import re

def validate_uuid_filename(filename):
    """Validate that filename follows UUID pattern"""
    pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$'
    if not re.match(pattern, os.path.basename(filename).lower()):
        raise ValidationError('Filename must be a UUID with extension')

def file_upload_path(instance, filename):
    """Generate file path for new file upload"""
    # Get the file extension
    _, ext = os.path.splitext(filename)
    ext = ext.lower() if ext else ''

    # Generate a new UUID filename
    new_filename = f"{uuid.uuid4()}{ext}"

    # Validate the generated filename
    validate_uuid_filename(new_filename)

    return os.path.join('uploads', new_filename)

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(
        upload_to=file_upload_path,
        max_length=255,
        validators=[validate_uuid_filename]
    )
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    size = models.BigIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_hash = models.CharField(max_length=64, blank=True, null=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.original_filename

    def clean(self):
        """Additional model validation"""
        super().clean()
        if self.file:
            # Validate filename
            validate_uuid_filename(os.path.basename(self.file.name))

    def save(self, *args, **kwargs):
        """Ensure validation runs on save"""
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def filename(self):
        """Get the current filename on disk"""
        return os.path.basename(self.file.name)

    @property
    def stored_filename(self):
        """Get the UUID-based filename without path"""
        return os.path.basename(self.file.name) if self.file else None
