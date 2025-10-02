/**
 * 🛍️ Appwrite Product Service
 * Professional product management service using Appwrite Cloud
 * Replaces AWS Amplify product service
 */

import { appwriteDatabaseService } from './appwrite-database.service';
import { appwriteStorageService } from './appwrite-storage.service';

import {
  Product,
  CarProduct,
  ProductCategory,
  ProductCondition,
  ProductStatus,
  SearchFilters,
  SearchResult,
  CarDetails,
} from '@/types';

export interface CreateProductData {
  title: string;
  description: string;
  category: ProductCategory;
  subcategory: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  condition: ProductCondition;
  specifications: Array<{ name: string; value: string; category: string }>;
  features: string[];
  tags: string[];
  images: File[];
  warranty?: {
    type: 'manufacturer' | 'seller' | 'extended' | 'service';
    duration: number;
    coverage: string;
  };
  carDetails?: Partial<CarDetails>;
}

/**
 * Appwrite Product Service
 * Complete product management using Appwrite Cloud
 */
export class ProductService {
  /**
   * Create a new product
   */
  static async createProduct(vendorId: string, productData: CreateProductData): Promise<string> {
    try {
      // Upload images first
      const imageUrls = await this.uploadProductImages(productData.images);

      const productDataForAPI = {
        vendorId,
        title: productData.title,
        titleAr: productData.title, // For Arabic support
        description: productData.description,
        descriptionAr: productData.description, // For Arabic support
        category: productData.category,
        subcategory: productData.subcategory,
        images: imageUrls,
        price: productData.price,
        originalPrice: productData.originalPrice,
        currency: 'EGP',
        inStock: true,
        stock: productData.quantity,
        specifications: productData.specifications,
        features: productData.features,
        tags: productData.tags,
        condition: productData.condition,
        warranty: productData.warranty,
        carDetails: productData.carDetails,
        status: 'pending_approval' as ProductStatus,
        views: 0,
        favorites: 0,
        rating: 0,
        reviewCount: 0,
        sku: this.generateSKU(productData.title),
        brand: productData.carDetails?.make || 'Unknown',
        model: productData.carDetails?.model || 'Unknown',
        year: productData.carDetails?.year || new Date().getFullYear(),
        seoData: {
          slug: this.generateSlug(productData.title),
          metaTitle: productData.title,
          metaDescription: productData.description.substring(0, 160),
          keywords: productData.tags,
        },
      };

      const product = await appwriteDatabaseService.createProduct(productDataForAPI);
      return product?.id || '';
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  /**
   * Get product by ID
   */
  static async getProduct(productId: string): Promise<Product | null> {
    try {
      return await appwriteDatabaseService.getProduct(productId);
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  }

  /**
   * Get products with filters
   */
  static async getProducts(
    filters: {
      category?: string;
      subcategory?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
      condition?: string;
      status?: string;
      vendorId?: string;
    } = {},
    limit: number = 25,
    offset: number = 0
  ): Promise<SearchResult> {
    try {
      const result = await appwriteDatabaseService.getProducts(limit, offset, filters);
      return {
        products: result.products,
        total: result.total,
        hasMore: result.products.length === limit,
        nextOffset: offset + limit
      };
    } catch (error) {
      console.error('Error getting products:', error);
      return {
        products: [],
        total: 0,
        hasMore: false,
        nextOffset: 0
      };
    }
  }

  /**
   * Search products
   */
  static async searchProducts(query: { query: string }): Promise<SearchResult> {
    try {
      const result = await appwriteDatabaseService.searchProducts(query.query);
      return {
        products: result.products,
        total: result.total,
        hasMore: false,
        nextOffset: 0
      };
    } catch (error) {
      console.error('Error searching products:', error);
      return {
        products: [],
        total: 0,
        hasMore: false,
        nextOffset: 0
      };
    }
  }

  /**
   * Update product
   */
  static async updateProduct(productId: string, updates: Partial<Product>): Promise<boolean> {
    try {
      const product = await appwriteDatabaseService.updateProduct(productId, updates);
      return product !== null;
    } catch (error) {
      console.error('Error updating product:', error);
      return false;
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(productId: string): Promise<boolean> {
    try {
      return await appwriteDatabaseService.deleteProduct(productId);
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  /**
   * Get products by vendor
   */
  static async getVendorProducts(
    vendorId: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<SearchResult> {
    try {
      const result = await appwriteDatabaseService.getProducts(limit, offset, { vendorId });
      return {
        products: result.products,
        total: result.total,
        hasMore: result.products.length === limit,
        nextOffset: offset + limit
      };
    } catch (error) {
      console.error('Error getting vendor products:', error);
      return {
        products: [],
        total: 0,
        hasMore: false,
        nextOffset: 0
      };
    }
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    try {
      const result = await appwriteDatabaseService.getProducts(limit, 0, { status: 'active' });
      return result.products.slice(0, limit);
    } catch (error) {
      console.error('Error getting featured products:', error);
      return [];
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(
    category: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<SearchResult> {
    try {
      const result = await appwriteDatabaseService.getProducts(limit, offset, { category });
      return {
        products: result.products,
        total: result.total,
        hasMore: result.products.length === limit,
        nextOffset: offset + limit
      };
    } catch (error) {
      console.error('Error getting products by category:', error);
      return {
        products: [],
        total: 0,
        hasMore: false,
        nextOffset: 0
      };
    }
  }

  /**
   * Get products by brand
   */
  static async getProductsByBrand(
    brand: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<SearchResult> {
    try {
      const result = await appwriteDatabaseService.getProducts(limit, offset, { brand });
      return {
        products: result.products,
        total: result.total,
        hasMore: result.products.length === limit,
        nextOffset: offset + limit
      };
    } catch (error) {
      console.error('Error getting products by brand:', error);
      return {
        products: [],
        total: 0,
        hasMore: false,
        nextOffset: 0
      };
    }
  }

  /**
   * Get products by price range
   */
  static async getProductsByPriceRange(
    minPrice: number,
    maxPrice: number,
    limit: number = 25,
    offset: number = 0
  ): Promise<SearchResult> {
    try {
      const result = await appwriteDatabaseService.getProducts(limit, offset, { minPrice, maxPrice });
      return {
        products: result.products,
        total: result.total,
        hasMore: result.products.length === limit,
        nextOffset: offset + limit
      };
    } catch (error) {
      console.error('Error getting products by price range:', error);
      return {
        products: [],
        total: 0,
        hasMore: false,
        nextOffset: 0
      };
    }
  }

  /**
   * Upload product images
   */
  private static async uploadProductImages(images: File[]): Promise<string[]> {
    try {
      const uploadPromises = images.map(file => 
        appwriteStorageService.uploadProductImage(file)
      );
      
      const results = await Promise.all(uploadPromises);
      return results
        .filter((result): result is NonNullable<typeof result> => result !== null)
        .map(result => result.url);
    } catch (error) {
      console.error('Error uploading product images:', error);
      return [];
    }
  }

  /**
   * Generate product SKU
   */
  private static generateSKU(title: string): string {
    const timestamp = Date.now().toString(36);
    const titleCode = title
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);
    return `PRD-${titleCode}-${timestamp}`;
  }

  /**
   * Generate product slug
   */
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Get product statistics
   */
  static async getProductStats(vendorId?: string): Promise<{
    total: number;
    active: number;
    pending: number;
    inactive: number;
  }> {
    try {
      const allProducts = await appwriteDatabaseService.getProducts(1000, 0, vendorId ? { vendorId } : {});
      
      const stats = {
        total: allProducts.total,
        active: 0,
        pending: 0,
        inactive: 0
      };

      allProducts.products.forEach(product => {
        switch (product.status) {
          case 'active':
            stats.active++;
            break;
          case 'pending_approval':
            stats.pending++;
            break;
          case 'inactive':
            stats.inactive++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting product stats:', error);
      return { total: 0, active: 0, pending: 0, inactive: 0 };
    }
  }

  /**
   * Get product categories
   */
  static async getProductCategories(): Promise<string[]> {
    try {
      // This would typically come from a categories collection
      // For now, return static categories
      return [
        'cars',
        'parts',
        'accessories',
        'tools',
        'electronics',
        'maintenance',
        'tires',
        'batteries',
        'oils',
        'filters'
      ];
    } catch (error) {
      console.error('Error getting product categories:', error);
      return [];
    }
  }

  /**
   * Get product brands
   */
  static async getProductBrands(): Promise<string[]> {
    try {
      // This would typically come from a brands collection
      // For now, return static brands
      return [
        'Toyota',
        'Honda',
        'BMW',
        'Mercedes',
        'Audi',
        'Nissan',
        'Hyundai',
        'Kia',
        'Ford',
        'Chevrolet',
        'Mitsubishi',
        'Suzuki',
        'Mazda',
        'Subaru',
        'Volkswagen'
      ];
    } catch (error) {
      console.error('Error getting product brands:', error);
      return [];
    }
  }
}
