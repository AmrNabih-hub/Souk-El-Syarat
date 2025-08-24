import React, { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
/**
 * Custom Testing Utilities
 * Enhanced React Testing Library setup with providers
 */

import { render, RenderOptions } from '@testing-library/react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Test providers wrapper
interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom render function
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: Providers, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  id: 'test-product-id',
  title: 'Test BMW X5',
  description: 'Test luxury SUV',
  price: 1500000,
  currency: 'EGP' as const,
  category: 'cars' as const,
  subcategory: 'suv',
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/test.jpg',
      alt: 'Test Image',
      isPrimary: true,
      order: 0,
    },
  ],
  vendorId: 'test-vendor-id',
  inStock: true,
  quantity: 1,
  condition: 'used' as const,
  tags: ['bmw', 'luxury', 'suv'],
  specifications: [],
  features: [],
  warranty: {
    type: 'seller' as const,
    duration: 12,
    coverage: 'Test warranty',
  },
  location: {
    governorate: 'Cairo',
    city: 'New Cairo',
  },
  status: 'published' as const,
  views: 0,
  favorites: 0,
  rating: 0,
  reviewCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockVendor = (overrides = {}) => ({
  id: 'test-vendor-id',
  userId: 'test-user-id',
  businessName: 'Test Motors',
  businessType: 'dealership' as const,
  description: 'Test automotive dealer',
  contactPerson: 'Test Person',
  email: 'vendor@test.com',
  phoneNumber: '01234567890',
  address: {
    street: 'Test Street',
    city: 'Cairo',
    governorate: 'Cairo',
    country: 'Egypt',
  },
  rating: 4.5,
  totalReviews: 100,
  totalSales: 50,
  totalProducts: 25,
  joinedDate: new Date(),
  lastActive: new Date(),
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
