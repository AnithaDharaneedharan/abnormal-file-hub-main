from django.test import TransactionTestCase
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from datetime import timedelta
from ..models import File, file_upload_path
import uuid
import os
import hashlib

class TestFileModel(TransactionTestCase):
    def setUp(self):
        """Set up test data"""
        self.test_content = b'Test file content'
        self.test_file = SimpleUploadedFile(
            name='test.txt',
            content=self.test_content,
            content_type='text/plain'
        )
        # Calculate file hash
        self.file_hash = hashlib.sha256(self.test_content).hexdigest()

    def test_file_creation(self):
        """Test basic file creation"""
        file = File.objects.create(
            file=self.test_file,
            original_filename='test.txt',
            file_type='text/plain',
            size=len(self.test_content),
            file_hash=self.file_hash
        )
        self.assertIsNotNone(file.id)
        self.assertEqual(file.original_filename, 'test.txt')
        self.assertEqual(file.file_type, 'text/plain')
        self.assertEqual(file.size, len(self.test_content))
        self.assertEqual(file.file_hash, self.file_hash)

    def test_file_upload_path(self):
        """Test file upload path generation"""
        test_file = SimpleUploadedFile('test.txt', b'content')
        path = file_upload_path(None, test_file.name)

        # Check path format
        self.assertTrue(path.startswith('uploads/'))
        self.assertTrue(path.endswith('.txt'))

        # Verify UUID format in path
        filename = os.path.basename(path)
        uuid_part = filename[:-4]  # Remove extension
        try:
            uuid.UUID(uuid_part)
        except ValueError:
            self.fail("Upload path does not contain valid UUID")

    def test_search_functionality(self):
        """Test file search functionality"""
        # Create test files
        file1 = File.objects.create(
            file=SimpleUploadedFile('test1.txt', b'content1'),
            original_filename='test_document.txt',
            file_type='text/plain',
            size=100,
            content='This is a test document',
            file_hash=hashlib.sha256(b'content1').hexdigest()
        )

        file2 = File.objects.create(
            file=SimpleUploadedFile('test2.pdf', b'content2'),
            original_filename='important.pdf',
            file_type='application/pdf',
            size=200,
            content='Important PDF content',
            file_hash=hashlib.sha256(b'content2').hexdigest()
        )

        # Test filename search
        results = File.search(search='document', search_type='filename')
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first(), file1)

        # Test content search
        results = File.search(search='important', search_type='content')
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first(), file2)

        # Test file type filter
        results = File.search(type='document')
        self.assertTrue(file1 in results)
        self.assertTrue(file2 in results)

    def test_file_properties(self):
        """Test file model properties"""
        test_content = b'content'
        test_file = SimpleUploadedFile('test.txt', test_content)
        file = File.objects.create(
            file=test_file,
            original_filename='test.txt',
            file_type='text/plain',
            size=len(test_content),
            file_hash=hashlib.sha256(test_content).hexdigest()
        )

        # Test filename property
        self.assertIsNotNone(file.filename)
        self.assertTrue(file.filename.endswith('.txt'))

        # Test stored_filename property
        self.assertIsNotNone(file.stored_filename)
        self.assertTrue(file.stored_filename.endswith('.txt'))

    def tearDown(self):
        """Clean up test files"""
        for file in File.objects.all():
            if file.file:
                try:
                    file.file.delete()
                except Exception:
                    pass  # Ignore deletion errors in cleanup