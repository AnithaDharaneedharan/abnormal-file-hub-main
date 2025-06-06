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
    """Validate that filename follows UUID pattern.

    Args:
        filename (str or FieldFile): The filename to validate. Can be a string or a FieldFile object.

    Raises:
        ValidationError: If the filename is invalid, None, empty, or doesn't match UUID pattern.

    Example:
        >>> validate_uuid_filename("123e4567-e89b-12d3-a456-426614174000.jpg")
        # Valid filename, no exception raised
        >>> validate_uuid_filename("invalid.jpg")
        # Raises ValidationError
    """
    logger.info(f"Validating filename: {filename!r}")

    if hasattr(filename, 'name'):  # Handle FieldFile objects
        filename = filename.name
        logger.info(f"Got filename from FieldFile: {filename!r}")

    if filename is None:
        logger.info("Filename is None")
        raise ValidationError('Filename cannot be None')

    if not isinstance(filename, str):
        logger.info(f"Filename is not a string, got {type(filename)}")
        raise ValidationError('Filename must be a string')

    if not filename.strip():
        logger.info("Filename is empty or whitespace")
        raise ValidationError('Filename cannot be empty')

    basename = os.path.basename(filename).lower()
    logger.info(f"Basename: {basename!r}")

    if not basename:
        logger.info("Basename is empty")
        raise ValidationError('Invalid filename format')

    pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$'
    if not re.match(pattern, basename):
        logger.info(f"Basename {basename!r} does not match UUID pattern")
        raise ValidationError('Filename must be a UUID with extension')

    logger.info("Filename validation passed")

def file_upload_path(instance, filename):
    """Generate file path for new file upload"""
    # Get the file extension
    _, ext = os.path.splitext(filename)
    ext = ext.lower() if ext else ''

    # Generate a new UUID filename
    new_filename = f"{uuid.uuid4()}{ext}"
    return os.path.join('uploads', new_filename)

class File(models.Model):
    """File model for storing uploaded files with deduplication support.

    This model handles file storage with deduplication based on SHA-256 hashing.
    It supports various file types and includes metadata like size, type, and upload date.

    Attributes:
        id (UUIDField): Primary key, auto-generated UUID
        file (FileField): The actual file stored on disk
        original_filename (str): Original name of the uploaded file
        file_type (str): MIME type of the file
        size (int): File size in bytes
        uploaded_at (datetime): Timestamp of upload
        file_hash (str): SHA-256 hash for deduplication
        category (str): File category based on type
        content (str): Optional text content for searchable files

    Indexes:
        - original_filename
        - file_type
        - uploaded_at
        - size
    """

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
        """Additional model validation.

        Validates UUID filename format for existing files.
        Called automatically during model.full_clean().

        Raises:
            ValidationError: If file validation fails
        """
        super().clean()
        if self.file and not self._state.adding:
            validate_uuid_filename(self.file.name)

    def save(self, *args, validate_uuid=True, **kwargs):
        """Save the model instance with optional UUID validation.

        Args:
            validate_uuid (bool): Whether to validate UUID filename format.
                                Set to False during initial file upload.
            *args: Additional positional arguments for model.save()
            **kwargs: Additional keyword arguments for model.save()

        Note:
            Automatically determines file category from MIME type
            and updates file_type field.
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
        """Get the current filename on disk.

        Returns:
            str or None: Basename of the file on disk, or None if no file
        """
        return os.path.basename(self.file.name) if self.file else None

    @property
    def stored_filename(self):
        """Get the UUID-based filename without path.

        Returns:
            str or None: UUID-based filename without path, or None if no file
        """
        return os.path.basename(self.file.name) if self.file else None

    @classmethod
    def search(cls, **kwargs):
        """Advanced search method that efficiently uses database indexes.

        Args:
            **kwargs: Search parameters
                search (str): Text to search in filename or content
                search_type (str): Type of search ('filename' or 'content')
                type (str): File type filter
                date (str): Date filter ('today', 'week', 'month', 'year')
                size (str): Size filter ('small', 'medium', 'large')
                start_date (date): Start date for custom range
                end_date (date): End date for custom range

        Returns:
            QuerySet: Filtered queryset of File objects

        Example:
            >>> File.search(search='document', type='pdf', date='month')
            <QuerySet [<File: document.pdf>, ...]>
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
