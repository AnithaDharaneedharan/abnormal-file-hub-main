from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('files', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='file',
            name='category',
            field=models.CharField(max_length=50, blank=True, default=''),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='file',
            name='file_type',
            field=models.CharField(max_length=100),
        ),
    ]