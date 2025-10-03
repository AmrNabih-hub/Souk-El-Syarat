// 🧪 Appwrite Database Service Integration Tests
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { databaseService } from '../services/appwrite-database.service'
import { mockAppwriteClient } from './setup-appwrite'

describe('Appwrite Database Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Product Operations', () => {
    it('should create a product successfully', async () => {
      const mockProduct = {
        $id: 'test-product-id',
        title: 'Test Car',
        price: 25000,
        description: 'Test description'
      }

      mockAppwriteClient.databases.createDocument.mockResolvedValue(mockProduct)

      const result = await databaseService.createProduct({
        title: 'Test Car',
        price: 25000,
        description: 'Test description'
      })

      expect(mockAppwriteClient.databases.createDocument).toHaveBeenCalled()
      expect(result).toEqual(mockProduct)
    })

    it('should get products successfully', async () => {
      const mockProducts = {
        documents: [
          { $id: '1', title: 'Car 1', price: 25000 },
          { $id: '2', title: 'Car 2', price: 30000 }
        ],
        total: 2
      }

      mockAppwriteClient.databases.listDocuments.mockResolvedValue(mockProducts)

      const result = await databaseService.getProducts()

      expect(mockAppwriteClient.databases.listDocuments).toHaveBeenCalled()
      expect(result.documents).toHaveLength(2)
    })

    it('should update a product successfully', async () => {
      const mockUpdatedProduct = {
        $id: 'test-product-id',
        title: 'Updated Car',
        price: 27000
      }

      mockAppwriteClient.databases.updateDocument.mockResolvedValue(mockUpdatedProduct)

      const result = await databaseService.updateProduct('test-product-id', {
        title: 'Updated Car',
        price: 27000
      })

      expect(mockAppwriteClient.databases.updateDocument).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'test-product-id',
        { title: 'Updated Car', price: 27000 }
      )
      expect(result).toEqual(mockUpdatedProduct)
    })

    it('should delete a product successfully', async () => {
      mockAppwriteClient.databases.deleteDocument.mockResolvedValue({})

      await databaseService.deleteProduct('test-product-id')

      expect(mockAppwriteClient.databases.deleteDocument).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'test-product-id'
      )
    })
  })

  describe('User Operations', () => {
    it('should create a user profile successfully', async () => {
      const mockUser = {
        $id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer'
      }

      mockAppwriteClient.databases.createDocument.mockResolvedValue(mockUser)

      const result = await databaseService.createUserProfile({
        userId: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer'
      })

      expect(mockAppwriteClient.databases.createDocument).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should get user profile successfully', async () => {
      const mockUser = {
        $id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer'
      }

      mockAppwriteClient.databases.getDocument.mockResolvedValue(mockUser)

      const result = await databaseService.getUserProfile('test-user-id')

      expect(mockAppwriteClient.databases.getDocument).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'test-user-id'
      )
      expect(result).toEqual(mockUser)
    })
  })

  describe('Order Operations', () => {
    it('should create an order successfully', async () => {
      const mockOrder = {
        $id: 'test-order-id',
        productId: 'test-product-id',
        buyerId: 'test-buyer-id',
        status: 'pending',
        amount: 25000
      }

      mockAppwriteClient.databases.createDocument.mockResolvedValue(mockOrder)

      const result = await databaseService.createOrder({
        productId: 'test-product-id',
        buyerId: 'test-buyer-id',
        amount: 25000
      })

      expect(mockAppwriteClient.databases.createDocument).toHaveBeenCalled()
      expect(result).toEqual(mockOrder)
    })

    it('should get orders for a user', async () => {
      const mockOrders = {
        documents: [
          { $id: '1', productId: 'prod1', status: 'pending' },
          { $id: '2', productId: 'prod2', status: 'completed' }
        ],
        total: 2
      }

      mockAppwriteClient.databases.listDocuments.mockResolvedValue(mockOrders)

      const result = await databaseService.getUserOrders('test-user-id')

      expect(mockAppwriteClient.databases.listDocuments).toHaveBeenCalled()
      expect(result.documents).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAppwriteClient.databases.createDocument.mockRejectedValue(
        new Error('Database connection failed')
      )

      await expect(databaseService.createProduct({
        title: 'Test Car',
        price: 25000
      })).rejects.toThrow('Database connection failed')
    })

    it('should handle document not found errors', async () => {
      mockAppwriteClient.databases.getDocument.mockRejectedValue(
        new Error('Document not found')
      )

      await expect(databaseService.getUserProfile('non-existent-id'))
        .rejects.toThrow('Document not found')
    })
  })
})