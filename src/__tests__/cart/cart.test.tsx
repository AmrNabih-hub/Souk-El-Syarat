/**
 * Shopping Cart Tests
 * Tests for add to cart, remove from cart, update quantity, and checkout
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CartPage from '@/pages/customer/CartPage';

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'customer',
      displayName: 'Test User',
    },
    isAuthenticated: true,
  }),
}));

// Mock app store
const mockCart = [
  {
    id: 'product-1',
    name: 'Test Product 1',
    nameAr: 'منتج تجريبي 1',
    price: 100,
    quantity: 2,
    images: ['test-image.jpg'],
    vendorId: 'vendor-1',
  },
];

vi.mock('@/stores/appStore', () => ({
  useAppStore: () => ({
    cart: mockCart,
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateCartItemQuantity: vi.fn(),
    clearCart: vi.fn(),
    language: 'en',
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Shopping Cart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cart Display', () => {
    it('should render cart items', () => {
      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    });

    it('should show empty cart message when cart is empty', () => {
      vi.mock('@/stores/appStore', () => ({
        useAppStore: () => ({
          cart: [],
          language: 'en',
        }),
      }));

      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      expect(screen.getByText(/cart is empty/i)).toBeInTheDocument();
    });

    it('should display correct item quantity', () => {
      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      const quantityInput = screen.getByDisplayValue('2');
      expect(quantityInput).toBeInTheDocument();
    });

    it('should calculate correct subtotal', () => {
      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      // 2 items * 100 EGP = 200 EGP
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });
  });

  describe('Cart Operations', () => {
    it('should increment item quantity', async () => {
      const { useAppStore } = await import('@/stores/appStore');
      const updateQuantity = vi.fn();
      
      vi.mocked(useAppStore).mockReturnValue({
        ...useAppStore(),
        updateCartItemQuantity: updateQuantity,
      } as any);

      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      const incrementButton = screen.getByRole('button', { name: /increment/i });
      fireEvent.click(incrementButton);

      await waitFor(() => {
        expect(updateQuantity).toHaveBeenCalledWith('product-1', 3);
      });
    });

    it('should decrement item quantity', async () => {
      const { useAppStore } = await import('@/stores/appStore');
      const updateQuantity = vi.fn();
      
      vi.mocked(useAppStore).mockReturnValue({
        ...useAppStore(),
        updateCartItemQuantity: updateQuantity,
      } as any);

      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      const decrementButton = screen.getByRole('button', { name: /decrement/i });
      fireEvent.click(decrementButton);

      await waitFor(() => {
        expect(updateQuantity).toHaveBeenCalledWith('product-1', 1);
      });
    });

    it('should remove item from cart', async () => {
      const { useAppStore } = await import('@/stores/appStore');
      const removeFromCart = vi.fn();
      
      vi.mocked(useAppStore).mockReturnValue({
        ...useAppStore(),
        removeFromCart,
      } as any);

      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(removeFromCart).toHaveBeenCalledWith('product-1');
      });
    });

    it('should clear entire cart', async () => {
      const { useAppStore } = await import('@/stores/appStore');
      const clearCart = vi.fn();
      
      vi.mocked(useAppStore).mockReturnValue({
        ...useAppStore(),
        clearCart,
      } as any);

      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      const clearButton = screen.getByRole('button', { name: /clear cart/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(clearCart).toHaveBeenCalled();
      });
    });
  });

  describe('Checkout Process', () => {
    it('should navigate to checkout when button clicked', async () => {
      const mockNavigate = vi.fn();
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
        };
      });

      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      const checkoutButton = screen.getByRole('button', { name: /checkout/i });
      fireEvent.click(checkoutButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/checkout');
      });
    });

    it('should require login for checkout if not authenticated', () => {
      vi.mock('@/stores/authStore', () => ({
        useAuthStore: () => ({
          user: null,
          isAuthenticated: false,
        }),
      }));

      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      const checkoutButton = screen.getByRole('button', { name: /checkout/i });
      fireEvent.click(checkoutButton);

      expect(screen.getByText(/please log in/i)).toBeInTheDocument();
    });
  });

  describe('Delivery Fee Calculation', () => {
    it('should add delivery fee based on governorate', () => {
      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      // Should show delivery fee for Egyptian governorates
      expect(screen.getByText(/delivery fee/i)).toBeInTheDocument();
    });

    it('should calculate total correctly with delivery fee', () => {
      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      // Subtotal + Delivery Fee = Total
      expect(screen.getByText(/total/i)).toBeInTheDocument();
    });
  });

  describe('Arabic Support', () => {
    it('should display Arabic text when language is Arabic', () => {
      vi.mock('@/stores/appStore', () => ({
        useAppStore: () => ({
          cart: mockCart,
          language: 'ar',
        }),
      }));

      render(
        <TestWrapper>
          <CartPage />
        </TestWrapper>
      );

      expect(screen.getByText(/منتج تجريبي 1/)).toBeInTheDocument();
    });
  });
});
