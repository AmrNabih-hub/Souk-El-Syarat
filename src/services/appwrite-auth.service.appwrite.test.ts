// 🧪 Appwrite Auth Service Integration Tests
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authService } from '../services/appwrite-auth.service'
import { mockAppwriteClient } from './setup-appwrite'

describe('Appwrite Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        $id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }

      mockAppwriteClient.account.create.mockResolvedValue(mockUser)

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })

      expect(mockAppwriteClient.account.create).toHaveBeenCalledWith(
        expect.any(String),
        'test@example.com',
        'password123',
        'Test User'
      )
      expect(result).toEqual(mockUser)
    })

    it('should handle registration errors', async () => {
      mockAppwriteClient.account.create.mockRejectedValue(
        new Error('Email already exists')
      )

      await expect(authService.register({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User'
      })).rejects.toThrow('Email already exists')
    })
  })

  describe('User Login', () => {
    it('should login user successfully', async () => {
      const mockSession = {
        $id: 'test-session-id',
        userId: 'test-user-id'
      }

      mockAppwriteClient.account.createEmailSession.mockResolvedValue(mockSession)

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(mockAppwriteClient.account.createEmailSession).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      )
      expect(result).toEqual(mockSession)
    })

    it('should handle login errors', async () => {
      mockAppwriteClient.account.createEmailSession.mockRejectedValue(
        new Error('Invalid credentials')
      )

      await expect(authService.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow('Invalid credentials')
    })
  })

  describe('User Logout', () => {
    it('should logout user successfully', async () => {
      mockAppwriteClient.account.deleteSession.mockResolvedValue({})

      await authService.logout()

      expect(mockAppwriteClient.account.deleteSession).toHaveBeenCalledWith('current')
    })
  })

  describe('Get Current User', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        $id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }

      mockAppwriteClient.account.get.mockResolvedValue(mockUser)

      const result = await authService.getCurrentUser()

      expect(mockAppwriteClient.account.get).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should handle unauthenticated user', async () => {
      mockAppwriteClient.account.get.mockRejectedValue(
        new Error('User not authenticated')
      )

      const result = await authService.getCurrentUser()

      expect(result).toBeNull()
    })
  })
})