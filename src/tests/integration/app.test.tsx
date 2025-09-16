/**
 * Integration Tests for Souk El-Sayarat App
 * Tests the complete application workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../App';

// Mock Firebase
vi.mock('../../config/firebase.config', () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
    currentUser: null,
  },
  db: {},
  storage: {},
}));

// Mock services
vi.mock('../../services/auth.service', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../services/product.service', () => ({
  ProductService: {
    getProducts: vi.fn().mockResolvedValue([]),
    getProductById: vi.fn().mockResolvedValue(null),
  },
}));

describe('App Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderApp = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should render the app without crashing', () => {
    renderApp();
    expect(screen.getByTestId('app')).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    renderApp();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should navigate to home page', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('Souk El-Sayarat')).toBeInTheDocument();
    });
  });

  it('should handle navigation between pages', async () => {
    renderApp();
    
    await waitFor(() => {
      expect(screen.getByText('Souk El-Sayarat')).toBeInTheDocument();
    });

    // Test navigation to marketplace
    const marketplaceLink = screen.getByText('Marketplace');
    fireEvent.click(marketplaceLink);
    
    await waitFor(() => {
      expect(screen.getByText('Browse Products')).toBeInTheDocument();
    });
  });

  it('should handle authentication flow', async () => {
    renderApp();
    
    // Test login button
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });
});
