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
import time
from rest_framework.decorators import action
from django.http import FileResponse
from urllib.parse import quote

# Get an instance of the custom logger
logger = logging.getLogger('files')

class FileViewSet(viewsets.ModelViewSet):
    """ViewSet for handling file operations.

    This ViewSet provides CRUD operations for files with additional features:
    - File deduplication using SHA-256 hashing
    - Progress tracking during uploads
    - Automatic file type detection
    - File categorization
    - Advanced search and filtering

    Attributes:
        serializer_class: Serializer for File model
        parser_classes: Supported request parsers (MultiPartParser for file uploads)
        queryset: Base queryset for File objects
    """

    serializer_class = FileSerializer
    parser_classes = (MultiPartParser,)
    queryset = File.objects.all()

    def get_serializer_context(self):
        """Extra context provided to the serializer class.

        Returns:
            dict: Context dictionary containing the request object
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Download endpoint that serves the file with its original filename
        """
        instance = self.get_object()
        if not instance.file:
            return Response(
                {'error': 'File not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Open the file and create a FileResponse
        file_path = instance.file.path
        if not os.path.exists(file_path):
            return Response(
                {'error': 'File not found on disk'},
                status=status.HTTP_404_NOT_FOUND
            )

        # URL encode the filename to handle special characters
        encoded_filename = quote(instance.original_filename)

        response = FileResponse(
            open(file_path, 'rb'),
            content_type=instance.file_type or 'application/octet-stream'
        )
        response['Content-Disposition'] = f'attachment; filename="{encoded_filename}"'
        return response

    def list(self, request, *args, **kwargs):
        start_time = time.time()

        # Get the queryset
        queryset = self.get_queryset()

        # Time the serialization separately
        serialize_start = time.time()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        serialize_time = (time.time() - serialize_start) * 1000  # Convert to milliseconds

        # Calculate total query time
        total_time = (time.time() - start_time) * 1000  # Convert to milliseconds

        # Log the timing information
        logger.info(f"Query executed in {total_time:.2f}ms (Serialization: {serialize_time:.2f}ms)")

        # Include timing information in the response data
        response_data = {
            'files': data,
            'metrics': {
                'queryTime': round(total_time, 2),
                'serializeTime': round(serialize_time, 2)
            }
        }

        return Response(response_data)

    def get_queryset(self):
        # Log filter operations
        search = self.request.query_params.get('search', None)
        search_type = self.request.query_params.get('searchType', 'filename')
        date_filter = self.request.query_params.get('date', None)
        size_filter = self.request.query_params.get('size', None)
        file_type = self.request.query_params.get('type', None)
        start_date = self.request.query_params.get('startDate', None)
        end_date = self.request.query_params.get('endDate', None)

        if any([search, date_filter, size_filter, file_type, start_date, end_date]):
            logger.info(
                f"Filtering files with params: search='{search}', type='{search_type}', "
                f"date='{date_filter}', size='{size_filter}', file_type='{file_type}', "
                f"startDate='{start_date}', endDate='{end_date}'"
            )

        # Use the new search method
        return File.search(
            search=search,
            search_type=search_type,
            date=date_filter,
            size=size_filter,
            type=file_type,
            start_date=start_date,
            end_date=end_date
        )

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
        """Handle file upload with deduplication check.

        Processes file upload, calculates SHA-256 hash, checks for duplicates,
        and stores the file if it's unique.

        Args:
            request: HTTP request containing the file in request.FILES
            *args: Additional positional arguments
            **kwargs: Additional keyword arguments

        Returns:
            Response: JSON response containing:
                - File metadata
                - isDuplicate flag
                - Success/error message
                - File ID

        Raises:
            400 Bad Request: If no file is provided
            500 Internal Server Error: If file processing fails
        """
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
