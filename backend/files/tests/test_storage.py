import os
import shutil
import tempfile
from django.test import TransactionTestCase
from django.core.files.base import ContentFile
from django.core.files.uploadedfile import SimpleUploadedFile, TemporaryUploadedFile
from ..storage import SafeFileStorage

class TestSafeFileStorage(TransactionTestCase):
    def setUp(self):
        """Set up test environment"""
        # Create a temporary directory for test files
        self.test_dir = tempfile.mkdtemp()
        self.storage = SafeFileStorage(location=self.test_dir)

    def test_save_in_memory_file(self):
        """Test saving an in-memory file"""
        content = b'Test content for in-memory file'
        content_file = ContentFile(content)
        name = 'test_in_memory.txt'

        # Save the file
        saved_name = self.storage._save(name, content_file)

        # Verify file was saved correctly
        self.assertTrue(os.path.exists(os.path.join(self.test_dir, saved_name)))
        with open(os.path.join(self.test_dir, saved_name), 'rb') as f:
            self.assertEqual(f.read(), content)

    def test_save_temporary_file(self):
        """Test saving a temporary uploaded file"""
        content = b'Test content for temporary file'

        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(content)
            temp_file.flush()

            # Create a TemporaryUploadedFile instance
            uploaded_file = TemporaryUploadedFile(
                name='test_temp.txt',
                content_type='text/plain',
                size=len(content),
                charset='utf-8'
            )
            uploaded_file.file = open(temp_file.name, 'rb')

            # Save the file
            name = 'test_temporary.txt'
            saved_name = self.storage._save(name, uploaded_file)

            # Verify file was saved correctly
            self.assertTrue(os.path.exists(os.path.join(self.test_dir, saved_name)))
            with open(os.path.join(self.test_dir, saved_name), 'rb') as f:
                self.assertEqual(f.read(), content)

            uploaded_file.file.close()
            os.unlink(temp_file.name)

    def test_get_available_name(self):
        """Test getting available filename when file exists"""
        # Create an initial file
        name = 'test_file.txt'
        content = b'Initial content'
        self.storage._save(name, ContentFile(content))

        # Get available name for same filename
        new_name = self.storage.get_available_name(name)

        # Verify new name is different and includes UUID
        self.assertNotEqual(new_name, name)
        self.assertTrue(new_name.startswith('test_file_'))
        self.assertTrue(new_name.endswith('.txt'))

        # Verify original file still exists
        self.assertTrue(os.path.exists(os.path.join(self.test_dir, name)))

    def test_create_directory_structure(self):
        """Test creating nested directory structure"""
        nested_path = os.path.join('nested', 'directory', 'test.txt')
        content = b'Test content'

        # Save file in nested directory
        self.storage._save(nested_path, ContentFile(content))

        # Verify directory structure was created
        self.assertTrue(os.path.exists(os.path.join(self.test_dir, 'nested', 'directory')))
        self.assertTrue(os.path.exists(os.path.join(self.test_dir, nested_path)))

    def tearDown(self):
        """Clean up test environment"""
        shutil.rmtree(self.test_dir)