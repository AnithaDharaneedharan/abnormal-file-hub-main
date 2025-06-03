from django.db import migrations, models
import uuid
import os

def get_file_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('uploads', filename)

class Migration(migrations.Migration):
    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='File',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('file', models.FileField(upload_to=get_file_path)),
                ('original_filename', models.CharField(max_length=255)),
                ('file_type', models.CharField(max_length=255)),
                ('size', models.BigIntegerField()),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('file_hash', models.CharField(max_length=64)),
                ('content', models.TextField(blank=True, null=True)),
            ],
        ),
    ]