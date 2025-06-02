from django.db import models
import uuid
import os

def file_upload_path(instance, filename):
    """Generate file path for new file upload"""
    name, ext = os.path.splitext(filename)
    ext = ext.lower() if ext else ''
    new_filename = f"{uuid.uuid4()}{ext}"
    return os.path.join('uploads', new_filename)

class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=file_upload_path, max_length=255)
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    size = models.BigIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_hash = models.CharField(max_length=64, blank=True, null=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.original_filename
