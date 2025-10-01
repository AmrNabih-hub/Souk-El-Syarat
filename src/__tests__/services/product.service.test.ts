/**
 * Product Service Integration Tests
 * Tests for product CRUD operations and business logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '@/services/product.service';
import type { Product } from '@/types';

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
  });

  describe('Product Retrieval', () => {
    it('should fetch all products', async () => {
      const products = await productService.getProducts();
      
      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
    });

    it('should fetch product by ID', async () => {
      const productId = 'test-product-id';
      const product = await productService.getProductById(productId);
      
      expect(product).toBeDefined();
      expect(product?.id).toBe(productId);
    });

    it('should return null for non-existent product', async () => {
      const product = await productService.getProductById('non-existent-id');
      
      expect(product).toBeNull();
    });

    it('should fetch products by category', async () => {
      const category = 'cars';
      const products = await productService.getProductsByCategory(category);
      
      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      products.forEach(product => {
        expect(product.category).toBe(category);
      });
    });

    it('should fetch products by vendor', async () => {
      const vendorId = 'test-vendor-id';
      const products = await productService.getProductsByVendor(vendorId);
      
      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      products.forEach(product => {
        expect(product.vendorId).toBe(vendorId);
      });
    });
  });

  describe('Product Search', () => {
    it('should search products by query', async () => {
      const query = 'BMW';
      const results = await productService.searchProducts(query);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should filter products by price range', async () => {
      const minPrice = 10000;
      const maxPrice = 50000;
      const products = await productService.filterByPriceRange(minPrice, maxPrice);
      
      expect(products).toBeDefined();
      products.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(minPrice);
        expect(product.price).toBeLessThanOrEqual(maxPrice);
      });
    });

    it('should return empty array for no matches', async () => {
      const results = await productService.searchProducts('nonexistentproduct12345');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('Product Creation', () => {
    it('should create new product with valid data', async () => {
      const newProduct: Partial<Product> = {
        name: 'Test Product',
        nameAr: 'منتج تجريبي',
        description: 'Test description',
        descriptionAr: 'وصف تجريبي',
        price: 25000,
        category: 'cars',
        vendorId: 'test-vendor',
        images: ['test-image.jpg'],
        stock: 5,
      };

      const created = await productService.createProduct(newProduct as Product);
      
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.name).toBe(newProduct.name);
    });

    it('should validate required fields', async () => {
      const invalidProduct: Partial<Product> = {
        name: 'Test Product',
        // Missing required fields
      };

      await expect(
        productService.createProduct(invalidProduct as Product)
      ).rejects.toThrow();
    });

    it('should validate price is positive', async () => {
      const invalidProduct: Partial<Product> = {
        name: 'Test Product',
        price: -100, // Invalid negative price
      };

      await expect(
        productService.createProduct(invalidProduct as Product)
      ).rejects.toThrow();
    });
  });

  describe('Product Updates', () => {
    it('should update existing product', async () => {
      const productId = 'test-product-id';
      const updates = {
        price: 30000,
        stock: 10,
      };

      const updated = await productService.updateProduct(productId, updates);
      
      expect(updated).toBeDefined();
      expect(updated.price).toBe(updates.price);
      expect(updated.stock).toBe(updates.stock);
    });

    it('should not update non-existent product', async () => {
      const updates = { price: 30000 };

      await expect(
        productService.updateProduct('non-existent-id', updates)
      ).rejects.toThrow();
    });
  });

  describe('Product Deletion', () => {
    it('should delete existing product', async () => {
      const productId = 'test-product-to-delete';
      
      await expect(
        productService.deleteProduct(productId)
      ).resolves.not.toThrow();
    });

    it('should handle deletion of non-existent product', async () => {
      await expect(
        productService.deleteProduct('non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('Stock Management', () => {
    it('should check product availability', async () => {
      const productId = 'test-product-id';
      const quantity = 2;
      
      const isAvailable = await productService.checkAvailability(productId, quantity);
      
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should reduce stock after purchase', async () => {
      const productId = 'test-product-id';
      const quantity = 1;
      
      const product = await productService.getProductById(productId);
      const originalStock = product?.stock || 0;
      
      await productService.reduceStock(productId, quantity);
      
      const updatedProduct = await productService.getProductById(productId);
      expect(updatedProduct?.stock).toBe(originalStock - quantity);
    });

    it('should not allow negative stock', async () => {
      const productId = 'test-product-id';
      const quantity = 9999; // More than available
      
      await expect(
        productService.reduceStock(productId, quantity)
      ).rejects.toThrow();
    });
  });

  describe('Product Validation', () => {
    it('should validate Egyptian phone numbers', () => {
      const validPhone = '01012345678';
      const invalidPhone = '123456';
      
      expect(productService.validateEgyptianPhone(validPhone)).toBe(true);
      expect(productService.validateEgyptianPhone(invalidPhone)).toBe(false);
    });

    it('should validate product images', () => {
      const validImages = ['image1.jpg', 'image2.jpg'];
      const invalidImages: string[] = []; // Empty array
      
      expect(productService.validateImages(validImages)).toBe(true);
      expect(productService.validateImages(invalidImages)).toBe(false);
    });

    it('should validate price format', () => {
      expect(productService.validatePrice(25000)).toBe(true);
      expect(productService.validatePrice(-100)).toBe(false);
      expect(productService.validatePrice(0)).toBe(false);
    });
  });
});
