/**
 * ProductCard Component Tests
 * Comprehensive unit testing for ProductCard component
 */

import { screen, fireEvent, waitFor } from '@testing-library/react';

import ProductCard from '../ProductCard';

// Mock stores
vi.mock('@/stores/appStore', () => ({
  useAppStore: () => ({
    language: 'en',
    addToFavorites: vi.fn(),
    removeFromFavorites: vi.fn(),
    isFavorite: vi.fn(() => false),
  }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { uid: 'test-user' },
  }),
}));

describe('ProductCard', () => {
  const mockProduct = createMockProduct();
  const mockOnAddToCart = vi.fn();
  const mockOnToggleFavorite = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product information correctly', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
    expect(screen.getByText(/EGP 1,500,000/)).toBeInTheDocument();
    expect(screen.getByAltText(mockProduct.images[0].alt)).toBeInTheDocument();
  });

  it('handles add to cart functionality', async () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct.id);
    });
  });

  it('handles favorite toggle functionality', async () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const favoriteButton = screen.getByRole('button', { name: /favorite/i });
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockProduct.id);
    });
  });

  it('displays product condition badge', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText('Used')).toBeInTheDocument();
  });

  it('shows out of stock state correctly', () => {
    const outOfStockProduct = createMockProduct({ inStock: false });

    render(
      <ProductCard
        product={outOfStockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
  });

  it('handles image loading states', async () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const image = screen.getByAltText(mockProduct.images[0].alt);

    // Initially should show loading state
    expect(image).toHaveClass('opacity-0');

    // Simulate image load
    fireEvent.load(image);

    await waitFor(() => {
      expect(image).toHaveClass('opacity-100');
    });
  });

  it('displays price with proper formatting', () => {
    const expensiveProduct = createMockProduct({ price: 2500000 });

    render(
      <ProductCard
        product={expensiveProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText(/EGP 2,500,000/)).toBeInTheDocument();
  });

  it('shows discount badge when original price is higher', () => {
    const discountedProduct = createMockProduct({
      price: 1200000,
      originalPrice: 1500000,
    });

    render(
      <ProductCard
        product={discountedProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText(/20% off/i)).toBeInTheDocument();
    expect(screen.getByText(/EGP 1,500,000/)).toHaveClass('line-through');
  });
});
