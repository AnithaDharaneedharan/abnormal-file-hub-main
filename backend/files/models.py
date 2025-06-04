import mimetypes
from django.db import models
from django.core.exceptions import ValidationError
from .utils import get_file_category
import uuid
import os
import re
import logging

logger = logging.getLogger(__name__)

def validate_uuid_filename(filename):
    """Validate that filename follows UUID pattern"""
    if hasattr(filename, 'name'):  # Handle FieldFile objects
        filename = filename.name

    if not filename:
        return

    pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$'
    basename = os.path.basename(str(filename)).lower()
    if not re.match(pattern, basename):
        raise ValidationError('Filename must be a UUID with extension')

def file_upload_path(instance, filename):
    """Generate file path for new file upload"""
    # Get the file extension
    _, ext = os.path.splitext(filename)
    ext = ext.lower() if ext else ''

    # Generate a new UUID filename
    new_filename = f"{uuid.uuid4()}{ext}"
    return os.path.join('uploads', new_filename)

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(
        upload_to=file_upload_path,
        max_length=255
    )
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    size = models.BigIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_hash = models.CharField(max_length=64, blank=True, null=True)
    category = models.CharField(max_length=50, blank=True)
    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.original_filename

    def clean(self):
        """Additional model validation"""
        super().clean()
        if self.file and not self._state.adding:  # Only validate for updates, not creation
            # Validate filename
            validate_uuid_filename(self.file.name)

    def save(self, *args, validate_uuid=True, **kwargs):
        """
        Save the model instance.

        Args:
            validate_uuid (bool): Whether to validate UUID filename format.
                                Set to False during initial file upload.
        """
        if validate_uuid:
            self.full_clean()

        # Automatically determine file category from MIME type
        if self.file:
            mime_type, _ = mimetypes.guess_type(self.original_filename)
            logger.info(f"File: {self.original_filename}, MIME type: {mime_type}")
            self.file_type = mime_type or 'application/octet-stream'
            self.category = get_file_category(self.file_type)
            logger.info(f"Categorized as: {self.category}")

        super().save(*args, **kwargs)

    @property
    def filename(self):
        """Get the current filename on disk"""
        return os.path.basename(self.file.name) if self.file else None

    @property
    def stored_filename(self):
        """Get the UUID-based filename without path"""
        return os.path.basename(self.file.name) if self.file else None
