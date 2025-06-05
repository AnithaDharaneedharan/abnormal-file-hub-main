from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from django.db.models import Q
from .models import File
from .serializers import FileSerializer
import hashlib
from django.core.files.base import ContentFile
import mimetypes
import os
from django.utils import timezone
from datetime import timedelta
import logging
from django.utils.dateparse import parse_date

# Get an instance of the custom logger
logger = logging.getLogger('files')

class FileViewSet(viewsets.ModelViewSet):
    serializer_class = FileSerializer
    parser_classes = (MultiPartParser,)
    queryset = File.objects.all()

    def get_serializer_context(self):
        """
        Extra context provided to the serializer class.
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        queryset = File.objects.all()
        search = self.request.query_params.get('search', None)
        search_type = self.request.query_params.get('searchType', 'filename')  # 'filename' or 'content'
        date_filter = self.request.query_params.get('date', None)
        size_filter = self.request.query_params.get('size', None)
        file_type = self.request.query_params.get('type', None)
        start_date = self.request.query_params.get('startDate', None)
        end_date = self.request.query_params.get('endDate', None)

        # Log filter operations
        if any([search, date_filter, size_filter, file_type, start_date, end_date]):
            logger.info(
                f"Filtering files with params: search='{search}', type='{search_type}', "
                f"date='{date_filter}', size='{size_filter}', file_type='{file_type}', "
                f"startDate='{start_date}', endDate='{end_date}'"
            )

        # File type filtering
        if file_type:
            if file_type == 'image':
                queryset = queryset.filter(file_type__startswith='image/')
            elif file_type == 'document':
                queryset = queryset.filter(
                    Q(file_type__in=[
                        'application/pdf',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'text/plain',
                    ]) |
                    Q(file_type__startswith='application/vnd.ms-')
                )
            elif file_type == 'spreadsheet':
                queryset = queryset.filter(
                    Q(file_type__in=[
                        'text/csv',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    ])
                )
            elif file_type == 'video':
                queryset = queryset.filter(file_type__startswith='video/')
            elif file_type == 'audio':
                queryset = queryset.filter(file_type__startswith='audio/')
            elif file_type == 'archive':
                queryset = queryset.filter(
                    file_type__in=[
                        'application/zip',
                        'application/x-rar-compressed',
                        'application/x-7z-compressed',
                        'application/x-tar',
                        'application/gzip'
                    ]
                )

        if search and len(search) >= 2:
            if search_type == 'content':
                queryset = queryset.filter(content__icontains=search)
            else:  # filename search
                queryset = queryset.filter(
                    Q(original_filename__icontains=search) |
                    Q(file_type__icontains=search)
                )

        if date_filter:
            now = timezone.now()
            if date_filter == 'today':
                queryset = queryset.filter(uploaded_at__date=now.date())
            elif date_filter == 'week':
                queryset = queryset.filter(uploaded_at__gte=now - timedelta(days=7))
            elif date_filter == 'month':
                queryset = queryset.filter(uploaded_at__gte=now - timedelta(days=30))
            elif date_filter == 'year':
                queryset = queryset.filter(uploaded_at__gte=now - timedelta(days=365))

        # Custom date range filtering
        if start_date:
            parsed_start = parse_date(start_date)
            if parsed_start:
                queryset = queryset.filter(uploaded_at__date__gte=parsed_start)
        if end_date:
            parsed_end = parse_date(end_date)
            if parsed_end:
                queryset = queryset.filter(uploaded_at__date__lte=parsed_end)

        if size_filter:
            if size_filter == 'small':
                queryset = queryset.filter(size__lt=1024 * 1024)  # < 1MB
            elif size_filter == 'medium':
                queryset = queryset.filter(size__gte=1024 * 1024, size__lt=10 * 1024 * 1024)
            elif size_filter == 'large':
                queryset = queryset.filter(size__gte=10 * 1024 * 1024)

        return queryset.order_by('-uploaded_at')

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            file_path = instance.file.path if instance.file else None

            logger.info(f"Attempting to delete file: {instance.original_filename} (ID: {instance.id})")

            # Delete the physical file first
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"Physical file deleted successfully: {file_path}")
                except OSError as e:
                    error_msg = f"Failed to delete physical file: {str(e)}"
                    logger.error(error_msg)
                    return Response(
                        {'error': error_msg},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            # Delete the database record
            instance.delete()
            logger.info(f"File record deleted from database: {instance.original_filename}")

            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            error_msg = f"Delete operation failed: {str(e)}"
            logger.error(error_msg)
            return Response(
                {'error': error_msg},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            logger.warning("Upload attempted without file")
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            logger.info(f"Starting upload process for file: {file_obj.name}")

            # Get the original filename as string
            original_filename = os.path.basename(file_obj.name)

            # Calculate SHA256 hash without modifying the original object
            sha256 = hashlib.sha256()
            file_bytes = b''

            for chunk in file_obj.chunks():
                sha256.update(chunk)
                file_bytes += chunk

            file_hash = sha256.hexdigest()
            logger.info(f"File hash calculated: {file_hash[:8]}... (truncated)")

            # Check if file with same hash already exists
            existing_file = File.objects.filter(file_hash=file_hash).first()
            if existing_file:
                logger.info(f"Duplicate file detected: {original_filename} matches existing file {existing_file.original_filename}")
                serializer = self.get_serializer(existing_file)
                return Response({
                    **serializer.data,
                    'isDuplicate': True,
                    'message': 'File already exists'
                }, status=status.HTTP_200_OK)

            # Re-wrap file content so Django can store it
            new_file = ContentFile(file_bytes)
            new_file.name = original_filename

            # Ensure we have a valid file type
            file_type = getattr(file_obj, 'content_type', None)
            if not file_type:
                # Try to guess the type from the filename
                guessed_type = mimetypes.guess_type(original_filename)[0]
                file_type = guessed_type or 'application/octet-stream'
                logger.info(f"File type determined: {file_type}")

            # Create file instance
            file_instance = File.objects.create(
                file=new_file,
                original_filename=original_filename,
                file_type=file_type,
                size=len(file_bytes),
                file_hash=file_hash
            )

            logger.info(
                f"File uploaded successfully: {original_filename} "
                f"(ID: {file_instance.id}, Size: {len(file_bytes)} bytes, Type: {file_type})"
            )

            serializer = self.get_serializer(file_instance)
            return Response({
                **serializer.data,
                'isDuplicate': False
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            error_msg = f"Upload failed for {file_obj.name if file_obj else 'unknown file'}: {str(e)}"
            logger.error(error_msg)
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response(
                {
                    'error': error_msg,
                    'traceback': traceback.format_exc()
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
