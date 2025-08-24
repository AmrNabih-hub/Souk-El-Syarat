/**
 * ProductCard Component Tests
 * Comprehensive unit testing for ProductCard component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import ProductCard from '../ProductCard';
import { createMockProduct } from '@/test/test-setup';

describe('ProductCard', () => {
  const mockProduct = createMockProduct();
  const mockOnAddToCart = vi.fn();
  const mockOnToggleFavorite = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    )).not.toThrow();
  });

  it('displays product information', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    // Check that product name is displayed
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    
    // Check that price is displayed (converted to EGP format)
    expect(screen.getByText(/25,000/)).toBeInTheDocument();
  });

  it('displays product image', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('alt', mockProduct.images[0].alt);
  });

  it('handles add to cart action', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    // Find and click add to cart button (look for Arabic text)
    const addToCartButton = screen.getByText(/أضف للسلة|Add to Cart/i);
    fireEvent.click(addToCartButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('handles favorite toggle action', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    // Find heart icon using data-testid
    const favoriteButton = screen.getByTestId('heart-icon');
    fireEvent.click(favoriteButton.parentElement!);

    expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockProduct);
  });

  it('displays product details', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    // Check for basic product details
    expect(screen.getByText(mockProduct.year.toString())).toBeInTheDocument();
    expect(screen.getByText(/50,000/)).toBeInTheDocument(); // mileage
  });

  it('handles component lifecycle', () => {
    const { unmount } = render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(() => unmount()).not.toThrow();
  });

  it('displays vendor information', () => {
    render(
      <ProductCard
        product={mockProduct}
        onAddToCart={mockOnAddToCart}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText(mockProduct.vendorName)).toBeInTheDocument();
    expect(screen.getByText(mockProduct.location)).toBeInTheDocument();
  });
});
