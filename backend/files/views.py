from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from .models import File
from .serializers import FileSerializer
import hashlib
from django.core.files.base import ContentFile
import mimetypes

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    parser_classes = (MultiPartParser,)

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Calculate SHA256 hash without modifying the original object
            sha256 = hashlib.sha256()
            file_bytes = b''

            for chunk in file_obj.chunks():
                sha256.update(chunk)
                file_bytes += chunk  # store for later re-wrapping

            file_hash = sha256.hexdigest()

            # Re-wrap file content so Django can store it (since original was consumed)
            new_file = ContentFile(file_bytes)
            new_file.name = file_obj.name

            # Ensure we have a valid file type
            file_type = file_obj.content_type
            if not file_type:
                # Try to guess the type from the filename
                guessed_type = mimetypes.guess_type(file_obj.name)[0]
                file_type = guessed_type or 'application/octet-stream'

            file_instance = File.objects.create(
                file=new_file,
                original_filename=file_obj.name,
                file_type=file_type,
                size=len(file_bytes),
                file_hash=file_hash
            )

            serializer = self.get_serializer(file_instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': f'Upload failed: {str(e)}'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
