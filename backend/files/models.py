import mimetypes
from django.db import models
from django.core.exceptions import ValidationError
from .utils import get_file_category
import uuid
import os
import re
import logging
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

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
    content = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['original_filename']),
            models.Index(fields=['file_type']),
            models.Index(fields=['uploaded_at']),
            models.Index(fields=['size']),
        ]
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

    @classmethod
    def search(cls, **kwargs):
        """
        Advanced search method that efficiently uses database indexes.
        """
        queryset = cls.objects.all()

        # Text search
        search_term = kwargs.get('search')
        search_type = kwargs.get('search_type', 'filename')

        if search_term and len(search_term) >= 2:
            if search_type == 'content':
                queryset = queryset.filter(content__icontains=search_term)
            else:
                # Use trigram similarity for better filename search if available
                queryset = queryset.filter(
                    Q(original_filename__icontains=search_term) |
                    Q(file_type__icontains=search_term)
                )

        # File type filtering
        file_type = kwargs.get('type')
        if file_type:
            type_filters = {
                'image': Q(file_type__startswith='image/'),
                'document': Q(file_type__in=[
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain',
                ]) | Q(file_type__startswith='application/vnd.ms-'),
                'spreadsheet': Q(file_type__in=[
                    'text/csv',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ]),
                'video': Q(file_type__startswith='video/'),
                'audio': Q(file_type__startswith='audio/'),
                'archive': Q(file_type__in=[
                    'application/zip',
                    'application/x-rar-compressed',
                    'application/x-7z-compressed',
                    'application/x-tar',
                    'application/gzip'
                ])
            }
            if file_type in type_filters:
                queryset = queryset.filter(type_filters[file_type])

        # Date filtering
        date_filter = kwargs.get('date')
        if date_filter:
            now = timezone.now()
            date_filters = {
                'today': Q(uploaded_at__date=now.date()),
                'week': Q(uploaded_at__gte=now - timedelta(days=7)),
                'month': Q(uploaded_at__gte=now - timedelta(days=30)),
                'year': Q(uploaded_at__gte=now - timedelta(days=365))
            }
            if date_filter in date_filters:
                queryset = queryset.filter(date_filters[date_filter])

        # Custom date range
        start_date = kwargs.get('start_date')
        end_date = kwargs.get('end_date')
        if start_date:
            queryset = queryset.filter(uploaded_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(uploaded_at__date__lte=end_date)

        # Size filtering
        size_filter = kwargs.get('size')
        if size_filter:
            size_filters = {
                'small': Q(size__lt=1024 * 1024),  # < 1MB
                'medium': Q(size__gte=1024 * 1024, size__lt=10 * 1024 * 1024),  # 1-10MB
                'large': Q(size__gte=10 * 1024 * 1024)  # > 10MB
            }
            if size_filter in size_filters:
                queryset = queryset.filter(size_filters[size_filter])

        return queryset
