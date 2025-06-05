import { apiClient } from '../../api/client';
import { fileService } from '../../services/fileService';
import { FileType, FileUpload } from '../../types/fileTypes';

// Mock the API client
jest.mock('../../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('fileService', () => {
  // Clear all mocks and timers before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers(); // Use real timers by default
  });

  // Clean up after each test
  afterEach(async () => {
    jest.resetAllMocks();
    // Clear any pending timers
    jest.clearAllTimers();
    // Wait for any pending promises to resolve
    await Promise.resolve();
  });

  // Clean up after all tests
  afterAll(() => {
    jest.restoreAllMocks();
    jest.clearAllTimers();
  });

  describe('uploadFile', () => {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const mockFileUpload: FileUpload = {
      id: '123',
      file: mockFile,
      name: 'test.txt',
      size: mockFile.size,
      status: 'pending',
      progress: 0,
      type: mockFile.type
    };
    const mockResponse = {
      data: {
        id: '123',
        original_filename: 'test.txt',
        file_type: 'text/plain',
        size: mockFile.size,
        uploaded_at: '2024-03-20',
        url: 'http://example.com/test.txt',
        category: 'document',
        isDuplicate: false
      }
    };

    it('uploads a file successfully', async () => {
      const postMock = (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fileService.uploadFile(mockFileUpload);

      expect(postMock).toHaveBeenCalledWith(
        '/files/',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockResponse.data);

      // Ensure all promises are resolved
      await Promise.resolve();
    });

    it('calls onProgress callback during upload', async () => {
      jest.useFakeTimers(); // Use fake timers for this test
      const onProgress = jest.fn();
      const postMock = (apiClient.post as jest.Mock).mockImplementation((url, data, config) => {
        // Simulate async progress update
        setTimeout(() => {
          config.onUploadProgress({ loaded: 50, total: 100 });
        }, 0);
        return Promise.resolve(mockResponse);
      });

      const uploadPromise = fileService.uploadFile(mockFileUpload, onProgress);

      // Fast-forward timers and wait for promises
      jest.runAllTimers();
      await uploadPromise;

      expect(onProgress).toHaveBeenCalledWith(50);
      expect(postMock).toHaveBeenCalled();
      onProgress.mockClear();
    });

    it('handles upload errors', async () => {
      const error = new Error('Upload failed');
      const postMock = (apiClient.post as jest.Mock).mockRejectedValue(error);

      await expect(fileService.uploadFile(mockFileUpload)).rejects.toThrow('Upload failed');
      expect(postMock).toHaveBeenCalled();

      // Ensure all promises are rejected and handled
      await Promise.resolve();
    });
  });

  describe('getFiles', () => {
    const mockFiles: FileType[] = [
      {
        id: '1',
        original_filename: 'test.txt',
        file_type: 'text/plain',
        size: 1000,
        uploaded_at: '2024-03-20',
        url: 'http://example.com/test.txt',
        category: 'document'
      }
    ];

    it('fetches files without parameters', async () => {
      const getMock = (apiClient.get as jest.Mock).mockResolvedValue({ data: mockFiles });

      const result = await fileService.getFiles();

      expect(getMock).toHaveBeenCalledWith('/files/', { params: expect.any(URLSearchParams) });
      expect(result).toEqual(mockFiles);

      // Ensure all promises are resolved
      await Promise.resolve();
    });

    it('fetches files with search parameters', async () => {
      const getMock = (apiClient.get as jest.Mock).mockResolvedValue({ data: mockFiles });

      const params = {
        search: 'test',
        date: '2024-03-20',
        size: '1000',
        searchType: 'filename' as const,
        type: 'document' as const,
        startDate: '2024-03-01',
        endDate: '2024-03-31'
      };

      await fileService.getFiles(params);

      const expectedParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        expectedParams.append(key, value);
      });

      expect(getMock).toHaveBeenCalledWith('/files/', { params: expectedParams });

      // Ensure all promises are resolved
      await Promise.resolve();
    });

    it('handles fetch errors', async () => {
      const error = new Error('Fetch failed');
      const getMock = (apiClient.get as jest.Mock).mockRejectedValue(error);

      await expect(fileService.getFiles()).rejects.toThrow('Fetch failed');
      expect(getMock).toHaveBeenCalled();

      // Ensure all promises are rejected and handled
      await Promise.resolve();
    });
  });

  describe('deleteFile', () => {
    it('deletes a file successfully', async () => {
      const deleteMock = (apiClient.delete as jest.Mock).mockResolvedValue({});

      await fileService.deleteFile('123');

      expect(deleteMock).toHaveBeenCalledWith('/files/123/');

      // Ensure all promises are resolved
      await Promise.resolve();
    });

    it('handles delete file error', async () => {
      const error = new Error('File not found');
      const deleteMock = (apiClient.delete as jest.Mock).mockRejectedValue(error);

      await expect(fileService.deleteFile('123')).rejects.toThrow('File not found');
      expect(deleteMock).toHaveBeenCalledWith('/files/123/');

      // Ensure all promises are rejected and handled
      await Promise.resolve();
    });
  });
});