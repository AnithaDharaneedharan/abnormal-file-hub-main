from rest_framework import serializers
from .models import File
from django.conf import settings

class FileSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    def get_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(f"{settings.MEDIA_URL}{obj.file.name}")
            return f"{settings.MEDIA_URL}{obj.file.name}"
        return None

    class Meta:
        model = File
        fields = ['id', 'file', 'original_filename', 'file_type', 'category', 'size', 'uploaded_at', 'file_hash', 'url']
