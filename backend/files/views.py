from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from .models import File
from .serializers import FileSerializer
import hashlib
from django.core.files.base import ContentFile
import mimetypes
import os

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    parser_classes = (MultiPartParser,)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            file_path = instance.file.path if instance.file else None

            # Delete the physical file first
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError as e:
                    return Response(
                        {'error': f'Failed to delete file: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            # Delete the database record
            instance.delete()

            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {'error': f'Delete failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get the original filename as string
            original_filename = os.path.basename(file_obj.name)

            # Calculate SHA256 hash without modifying the original object
            sha256 = hashlib.sha256()
            file_bytes = b''

            for chunk in file_obj.chunks():
                sha256.update(chunk)
                file_bytes += chunk

            file_hash = sha256.hexdigest()

            # Check if file with same hash already exists
            existing_file = File.objects.filter(file_hash=file_hash).first()
            if existing_file:
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

            # Create file instance without UUID validation
            file_instance = File.objects.create(
                file=new_file,
                original_filename=original_filename,
                file_type=file_type,
                size=len(file_bytes),
                file_hash=file_hash
            )

            # Now validate the UUID filename after creation
            file_instance.full_clean()
            file_instance.save()

            serializer = self.get_serializer(file_instance)
            return Response({
                **serializer.data,
                'isDuplicate': False
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            return Response(
                {
                    'error': f'Upload failed: {str(e)}',
                    'traceback': traceback.format_exc()
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
