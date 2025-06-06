import os
import time
import hashlib
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from datetime import timedelta
from ..models import File
import random
import string
import logging

logger = logging.getLogger(__name__)

def generate_random_string(length):
    """Generate a random string of specified length.

    Args:
        length (int): Length of the string to generate

    Returns:
        str: Random string containing letters and digits
    """
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def calculate_file_hash(content):
    """Calculate SHA-256 hash of file content.

    Args:
        content (bytes): File content to hash

    Returns:
        str: Hexadecimal representation of SHA-256 hash
    """
    return hashlib.sha256(content).hexdigest()

class FilePerformanceTests(TestCase):
    """Performance test suite for file operations.

    Tests the performance of file operations with a large dataset (10,000 files).
    Measures query execution times for various search and filter operations.

    Attributes:
        NUM_FILES (int): Number of test files to create (10,000)
    """

    @classmethod
    def setUpTestData(cls):
        """Create a large dataset for testing.

        Creates NUM_FILES test files with:
        - Random content
        - Random file type
        - Random size (1KB to 10MB)
        - Random upload date (within last year)
        - Calculated file hash
        """
        logger.info("Setting up test data...")
        start_time = time.time()

        # File types for random selection
        file_types = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'text/plain',
            'application/msword',
            'application/vnd.ms-excel'
        ]

        # Create 10,000 test files
        cls.NUM_FILES = 10000
        for i in range(cls.NUM_FILES):
            # Create a dummy file
            file_content = generate_random_string(100).encode()
            file_type = random.choice(file_types)
            ext = file_type.split('/')[-1]
            filename = f"test_file_{i}.{ext}"

            # Calculate file hash
            file_hash = calculate_file_hash(file_content)

            # Random file size between 1KB and 10MB
            size = random.randint(1024, 10 * 1024 * 1024)

            # Random upload date within last year
            days_ago = random.randint(0, 365)
            upload_date = timezone.now() - timedelta(days=days_ago)

            File.objects.create(
                file=SimpleUploadedFile(filename, file_content),
                original_filename=filename,
                file_type=file_type,
                size=size,
                uploaded_at=upload_date,
                file_hash=file_hash
            )

            if (i + 1) % 1000 == 0:
                logger.info(f"Created {i + 1} test files...")

        total_time = time.time() - start_time
        logger.info(f"Finished creating {cls.NUM_FILES} test files in {total_time:.2f} seconds")

    def measure_query_time(self, query_func):
        """Helper to measure query execution time.

        Args:
            query_func (callable): Function that performs the database query

        Returns:
            float: Query execution time in milliseconds

        Note:
            Forces query evaluation if result is a queryset
        """
        start_time = time.time()
        result = query_func()
        if hasattr(result, 'exists'):
            result.exists()
        end_time = time.time()
        return (end_time - start_time) * 1000

    def test_filename_search_performance(self):
        """Test search performance by filename.

        Verifies that searching files by filename completes within 1 second.
        Tests the efficiency of database indexes on the filename field.
        """
        query_time = self.measure_query_time(
            lambda: File.search(search='test', search_type='filename')
        )
        logger.info(f"Filename search took {query_time:.2f}ms")
        self.assertLess(query_time, 1000)

    def test_date_filter_performance(self):
        """Test date filtering performance.

        Verifies that filtering files by date completes within 1 second.
        Tests the efficiency of database indexes on the uploaded_at field.
        """
        query_time = self.measure_query_time(
            lambda: File.search(date='month')
        )
        logger.info(f"Date filter search took {query_time:.2f}ms")
        self.assertLess(query_time, 1000)

    def test_size_filter_performance(self):
        """Test size filtering performance.

        Verifies that filtering files by size completes within 1 second.
        Tests the efficiency of database indexes on the size field.
        """
        query_time = self.measure_query_time(
            lambda: File.search(size='large')
        )
        logger.info(f"Size filter search took {query_time:.2f}ms")
        self.assertLess(query_time, 1000)

    def test_combined_search_performance(self):
        """Test performance with multiple search criteria.

        Verifies that complex searches with multiple criteria complete within 2 seconds.
        Tests the efficiency of combined database indexes and query optimization.

        Criteria tested:
        - Filename search
        - Date filter
        - Size filter
        - File type filter
        """
        query_time = self.measure_query_time(
            lambda: File.search(
                search='test',
                date='month',
                size='large',
                type='document'
            )
        )
        logger.info(f"Combined search took {query_time:.2f}ms")
        self.assertLess(query_time, 2000)

    def test_type_filter_performance(self):
        """Test file type filtering performance"""
        # Get all PDF files
        query_time = self.measure_query_time(
            lambda: File.search(type='document')
        )
        logger.info(f"File type filter took {query_time:.2f}ms")
        self.assertLess(query_time, 1000)