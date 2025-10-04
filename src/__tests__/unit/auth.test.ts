/**
 * Authentication Unit Tests
 * Tests authentication flows and user management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';

describe('Authentication Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
      error: null,
      isInitialized: false,
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('Sign In', () => {
    it('should set loading state during sign in', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
    });

    it('should set user after successful sign in', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'customer' as const,
        isActive: true,
        emailVerified: true,
        phoneVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      act(() => {
        result.current.setUser(mockUser);
      });
      
      expect(result.current.user).toEqual(mockUser);
    });

    it('should set error on failed sign in', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setError('Invalid credentials');
      });
      
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  describe('Sign Out', () => {
    it('should clear user on sign out', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      // Set user first
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'customer' as const,
        isActive: true,
        emailVerified: true,
        phoneVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      act(() => {
        result.current.setUser(mockUser);
      });
      
      expect(result.current.user).toEqual(mockUser);
      
      // Sign out
      act(() => {
        result.current.setUser(null);
        result.current.setSession(null);
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should clear error', async () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setError('Test error');
      });
      
      expect(result.current.error).toBe('Test error');
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });
});
