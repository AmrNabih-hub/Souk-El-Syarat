/**
 * HomePage Component Tests
 * Integration testing for the main landing page
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/test/utils/test-utils';
import HomePage from '../HomePage';

// Mock stores
const mockUseAppStore = vi.fn(() => ({
  language: 'en',
}));

vi.mock('@/stores/appStore', () => ({
  useAppStore: mockUseAppStore,
}));

// Mock services
vi.mock('@/services/product.service', () => ({
  ProductService: {
    getFeaturedProducts: vi.fn(() => Promise.resolve([])),
    getPopularProducts: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('@/services/sample-vendors.service', () => ({
  SampleVendorsService: {
    getTopVendors: vi.fn(() => Promise.resolve([])),
  },
}));

describe('HomePage', () => {
  it('renders hero section correctly', () => {
    render(<HomePage />);

    expect(screen.getByText(/premium automotive marketplace/i)).toBeInTheDocument();
    expect(screen.getByText(/discover luxury vehicles/i)).toBeInTheDocument();
  });

  it('displays main navigation buttons', () => {
    render(<HomePage />);

    expect(screen.getByRole('link', { name: /browse cars/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /find parts/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /services/i })).toBeInTheDocument();
  });

  it('shows feature highlights', () => {
    render(<HomePage />);

    expect(screen.getByText(/certified luxury vehicles/i)).toBeInTheDocument();
    expect(screen.getByText(/genuine oem parts/i)).toBeInTheDocument();
    expect(screen.getByText(/professional services/i)).toBeInTheDocument();
    expect(screen.getByText(/comprehensive warranty/i)).toBeInTheDocument();
  });

  it('displays statistics section', () => {
    render(<HomePage />);

    expect(screen.getByText(/10,000\+/)).toBeInTheDocument();
    expect(screen.getByText(/500\+/)).toBeInTheDocument();
    expect(screen.getByText(/50,000\+/)).toBeInTheDocument();
  });

  it('handles language switching', async () => {
    const mockUseAppStore = vi.fn(() => ({
      language: 'ar',
    }));

    mockUseAppStore.mockImplementation(() => ({
      language: 'en',
    }));

    render(<HomePage />);

    // Should display Arabic content
    expect(screen.getByText(/سوق السيارات المتميز/)).toBeInTheDocument();
  });

  it('renders responsive design elements', () => {
    render(<HomePage />);

    const heroSection = screen.getByRole('main');
    expect(heroSection).toHaveClass('min-h-screen');

    // Check for responsive grid layouts
    const featuresGrid = screen.getByTestId('features-grid');
    expect(featuresGrid).toHaveClass('grid', 'md:grid-cols-2', 'lg:grid-cols-4');
  });

  it('loads featured products section', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/featured vehicles/i)).toBeInTheDocument();
    });
  });

  it('handles scroll-to-section functionality', async () => {
    render(<HomePage />);

    const scrollButton = screen.getByRole('button', { name: /explore now/i });
    fireEvent.click(scrollButton);

    // Should scroll to features section
    await waitFor(() => {
      const featuresSection = screen.getByTestId('features-section');
      expect(featuresSection).toBeInTheDocument();
    });
  });
});
