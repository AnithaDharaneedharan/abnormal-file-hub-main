import unittest
from ..utils import get_file_category

class TestFileCategories(unittest.TestCase):
    def test_image_categories(self):
        """Test image file type categorization"""
        self.assertEqual(get_file_category('image/jpeg'), 'image')
        self.assertEqual(get_file_category('image/png'), 'image')
        self.assertEqual(get_file_category('image/gif'), 'image')
        self.assertEqual(get_file_category('image/webp'), 'image')

    def test_video_categories(self):
        """Test video file type categorization"""
        self.assertEqual(get_file_category('video/mp4'), 'video')
        self.assertEqual(get_file_category('video/quicktime'), 'video')
        self.assertEqual(get_file_category('video/x-msvideo'), 'video')

    def test_audio_categories(self):
        """Test audio file type categorization"""
        self.assertEqual(get_file_category('audio/mpeg'), 'audio')
        self.assertEqual(get_file_category('audio/wav'), 'audio')
        self.assertEqual(get_file_category('audio/ogg'), 'audio')

    def test_document_categories(self):
        """Test document file type categorization"""
        self.assertEqual(get_file_category('text/plain'), 'document')
        self.assertEqual(get_file_category('application/pdf'), 'document')
        self.assertEqual(get_file_category('application/msword'), 'document')
        self.assertEqual(get_file_category('application/vnd.openxmlformats-officedocument.wordprocessingml.document'), 'document')

    def test_spreadsheet_categories(self):
        """Test spreadsheet file type categorization"""
        self.assertEqual(get_file_category('application/vnd.ms-excel'), 'spreadsheet')
        self.assertEqual(get_file_category('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), 'spreadsheet')
        self.assertEqual(get_file_category('text/csv'), 'spreadsheet')

    def test_archive_categories(self):
        """Test archive file type categorization"""
        self.assertEqual(get_file_category('application/zip'), 'archive')
        self.assertEqual(get_file_category('application/x-rar-compressed'), 'archive')
        self.assertEqual(get_file_category('application/x-tar'), 'archive')
        self.assertEqual(get_file_category('application/gzip'), 'archive')

    def test_code_categories(self):
        """Test code file type categorization"""
        self.assertEqual(get_file_category('text/x-python'), 'code')
        self.assertEqual(get_file_category('application/javascript'), 'code')
        self.assertEqual(get_file_category('text/html'), 'code')
        self.assertEqual(get_file_category('text/css'), 'code')
        self.assertEqual(get_file_category('application/json'), 'code')

    def test_other_categories(self):
        """Test other/unknown file type categorization"""
        self.assertEqual(get_file_category(''), 'other')
        self.assertEqual(get_file_category(None), 'other')
        self.assertEqual(get_file_category('application/unknown'), 'other')
        self.assertEqual(get_file_category('invalid/type'), 'other')

if __name__ == '__main__':
    unittest.main()