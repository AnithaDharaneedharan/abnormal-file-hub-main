from django.contrib import admin
from .models import File

@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'file_type', 'size', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['original_filename', 'file_hash']
    readonly_fields = ['id', 'uploaded_at', 'file_hash', 'size']