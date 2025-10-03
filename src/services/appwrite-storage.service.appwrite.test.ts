// 🧪 Appwrite Storage Service Integration Tests
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { storageService } from '../services/appwrite-storage.service'
import { mockAppwriteClient } from './setup-appwrite'

describe('Appwrite Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('File Upload', () => {
    it('should upload a file successfully', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const mockUploadResult = {
        $id: 'test-file-id',
        name: 'test.jpg',
        sizeOriginal: 1024
      }

      mockAppwriteClient.storage.createFile.mockResolvedValue(mockUploadResult)

      const result = await storageService.uploadFile('product_images', mockFile)

      expect(mockAppwriteClient.storage.createFile).toHaveBeenCalledWith(
        'product_images',
        expect.any(String),
        mockFile
      )
      expect(result).toEqual(mockUploadResult)
    })

    it('should handle upload errors', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })

      mockAppwriteClient.storage.createFile.mockRejectedValue(
        new Error('File too large')
      )

      await expect(storageService.uploadFile('product_images', mockFile))
        .rejects.toThrow('File too large')
    })

    it('should validate file types', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

      await expect(storageService.uploadFile('product_images', mockFile))
        .rejects.toThrow('Invalid file type')
    })

    it('should validate file size', async () => {
      // Create a large file mock
      const largeContent = 'x'.repeat(15 * 1024 * 1024) // 15MB
      const mockFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })

      await expect(storageService.uploadFile('product_images', mockFile))
        .rejects.toThrow('File too large')
    })
  })

  describe('File Retrieval', () => {
    it('should get file preview successfully', async () => {
      const mockPreviewUrl = 'https://test.appwrite.io/v1/storage/buckets/product_images/files/test-file-id/preview'

      mockAppwriteClient.storage.getFilePreview.mockReturnValue(mockPreviewUrl)

      const result = storageService.getFilePreview('product_images', 'test-file-id')

      expect(mockAppwriteClient.storage.getFilePreview).toHaveBeenCalledWith(
        'product_images',
        'test-file-id',
        expect.any(Number),
        expect.any(Number)
      )
      expect(result).toBe(mockPreviewUrl)
    })

    it('should get file download URL successfully', async () => {
      const mockDownloadUrl = 'https://test.appwrite.io/v1/storage/buckets/product_images/files/test-file-id/download'

      mockAppwriteClient.storage.getFile.mockReturnValue(mockDownloadUrl)

      const result = storageService.getFileDownload('product_images', 'test-file-id')

      expect(mockAppwriteClient.storage.getFile).toHaveBeenCalledWith(
        'product_images',
        'test-file-id'
      )
      expect(result).toBe(mockDownloadUrl)
    })
  })

  describe('File Deletion', () => {
    it('should delete file successfully', async () => {
      mockAppwriteClient.storage.deleteFile.mockResolvedValue({})

      await storageService.deleteFile('product_images', 'test-file-id')

      expect(mockAppwriteClient.storage.deleteFile).toHaveBeenCalledWith(
        'product_images',
        'test-file-id'
      )
    })

    it('should handle deletion errors', async () => {
      mockAppwriteClient.storage.deleteFile.mockRejectedValue(
        new Error('File not found')
      )

      await expect(storageService.deleteFile('product_images', 'non-existent-id'))
        .rejects.toThrow('File not found')
    })
  })

  describe('Multiple File Upload', () => {
    it('should upload multiple files successfully', async () => {
      const mockFiles = [
        new File(['content1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
      ]

      const mockResults = [
        { $id: 'file1', name: 'test1.jpg' },
        { $id: 'file2', name: 'test2.jpg' }
      ]

      mockAppwriteClient.storage.createFile
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])

      const results = await storageService.uploadMultipleFiles('product_images', mockFiles)

      expect(mockAppwriteClient.storage.createFile).toHaveBeenCalledTimes(2)
      expect(results).toHaveLength(2)
      expect(results[0]).toEqual(mockResults[0])
      expect(results[1]).toEqual(mockResults[1])
    })

    it('should handle partial upload failures', async () => {
      const mockFiles = [
        new File(['content1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
      ]

      mockAppwriteClient.storage.createFile
        .mockResolvedValueOnce({ $id: 'file1', name: 'test1.jpg' })
        .mockRejectedValueOnce(new Error('Upload failed'))

      const results = await storageService.uploadMultipleFiles('product_images', mockFiles)

      expect(results).toHaveLength(2)
      expect(results[0]).toEqual({ $id: 'file1', name: 'test1.jpg' })
      expect(results[1]).toBeInstanceOf(Error)
    })
  })

  describe('Bucket Operations', () => {
    it('should handle different bucket types', async () => {
      const buckets = ['product_images', 'vendor_documents', 'car_listing_images']
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

      mockAppwriteClient.storage.createFile.mockResolvedValue({ $id: 'test-id' })

      for (const bucket of buckets) {
        await storageService.uploadFile(bucket, mockFile)
        expect(mockAppwriteClient.storage.createFile).toHaveBeenCalledWith(
          bucket,
          expect.any(String),
          mockFile
        )
      }
    })
  })
})