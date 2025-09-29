import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import amplifyConfig from '@/config/amplify.config';

// Initialize Amplify client for GraphQL operations
const client = generateClient();

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
 * AWS Amplify Product Service
 * Complete migration from Firebase to AWS Amplify
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
        description: productData.description,
        category: productData.category,
        subcategory: productData.subcategory,
        images: imageUrls.map((url, index) => ({
          url,
          alt: productData.title,
          isPrimary: index === 0,
          order: index,
        })),
        price: productData.price,
        originalPrice: productData.originalPrice,
        currency: 'EGP',
        inStock: true,
        quantity: productData.quantity,
        specifications: productData.specifications,
        features: productData.features,
        tags: productData.tags,
        condition: productData.condition,
        warranty: productData.warranty,
        carDetails: productData.carDetails,
        status: 'pending',
        views: 0,
        favorites: 0,
        rating: 0,
        reviewCount: 0,
        seoData: {
          slug: this.generateSlug(productData.title),
          metaTitle: productData.title,
          metaDescription: productData.description.substring(0, 160),
          keywords: productData.tags,
        },
      };

      const result = await client.graphql({
        query: `
          mutation CreateProduct($input: CreateProductInput!) {
            createProduct(input: $input) {
              id
            }
          }
        `,
        variables: {
          input: productDataForAPI
        }
      });

      return result.data.createProduct.id;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  /**
   * Get product by ID
   */
  static async getProduct(productId: string): Promise<Product | null> {
    try {
      const result = await client.graphql({
        query: `
          query GetProduct($id: ID!) {
            getProduct(id: $id) {
              id
              vendorId
              title
              description
              category
              subcategory
              images {
                url
                alt
                isPrimary
                order
              }
              price
              originalPrice
              currency
              inStock
              quantity
              specifications {
                name
                value
                category
              }
              features
              tags
              condition
              warranty {
                type
                duration
                coverage
              }
              carDetails {
                make
                model
                year
                mileage
                fuelType
                transmission
                color
                engineSize
                power
                drivetrain
                bodyType
                doors
                seats
                fuelEfficiency
                accidentHistory
                serviceHistory
              }
              status
              views
              favorites
              rating
              reviewCount
              createdAt
              updatedAt
              publishedAt
              seoData {
                slug
                metaTitle
                metaDescription
                keywords
              }
            }
          }
        `,
        variables: { id: productId }
      });

      if (result.data.getProduct) {
        const product = result.data.getProduct;
        return {
          ...product,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
          publishedAt: product.publishedAt ? new Date(product.publishedAt) : null,
        } as Product;
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error getting product:', error);
      throw new Error('Failed to get product');
    }
  }

  /**
   * Update product
   */
  static async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    try {
      const updateData: any = {
        id: productId,
        updatedAt: new Date().toISOString(),
      };

      // Map the updates to the API format
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.category) updateData.category = updates.category;
      if (updates.subcategory) updateData.subcategory = updates.subcategory;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.originalPrice !== undefined) updateData.originalPrice = updates.originalPrice;
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.status) updateData.status = updates.status;
      if (updates.specifications) updateData.specifications = updates.specifications;
      if (updates.features) updateData.features = updates.features;
      if (updates.tags) updateData.tags = updates.tags;
      if (updates.condition) updateData.condition = updates.condition;
      if (updates.warranty) updateData.warranty = updates.warranty;
      if ((updates as any).carDetails) updateData.carDetails = (updates as any).carDetails;
      if (updates.seoData) updateData.seoData = updates.seoData;

      await client.graphql({
        query: `
          mutation UpdateProduct($input: UpdateProductInput!) {
            updateProduct(input: $input) {
              id
            }
          }
        `,
        variables: { input: updateData }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error updating product:', error);
      throw new Error('Failed to update product');
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(productId: string): Promise<void> {
    try {
      await client.graphql({
        query: `
          mutation DeleteProduct($input: DeleteProductInput!) {
            deleteProduct(input: $input) {
              id
            }
          }
        `,
        variables: { input: { id: productId } }
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }

  /**
   * Get products with filters
   */
  static async getProducts(filters: SearchFilters = {}, limit: number = 20): Promise<SearchResult> {
    try {
      // In development mode, use mock data to prevent API errors
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Development mode - Using mock products data');
        const { enhancedProductCatalog } = await import('../data/enhanced-products');
        const products = enhancedProductCatalog.getAllProducts().slice(0, limit);
        return {
          products,
          total: products.length,
          facets: { categories: [], conditions: [], priceRanges: [], locations: [], makes: [], models: [] },
          hasMore: false,
        };
      }

      const result = await client.graphql({
        query: `
          query ListProducts($filter: ModelProductFilterInput, $limit: Int) {
            listProducts(filter: $filter, limit: $limit) {
              items {
                id
                vendorId
                title
                description
                category
                subcategory
                images {
                  url
                  alt
                  isPrimary
                  order
                }
                price
                originalPrice
                currency
                inStock
                quantity
                condition
                status
                views
                favorites
                rating
                reviewCount
                createdAt
                updatedAt
                seoData {
                  slug
                  metaTitle
                  metaDescription
                  keywords
                }
              }
            }
          }
        `,
        variables: {
          filter: this.buildFilter(filters),
          limit
        }
      });

      return {
        products: result.data.listProducts.items.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })),
        total: result.data.listProducts.items.length,
        facets: { categories: [], conditions: [], priceRanges: [], locations: [], makes: [], models: [] },
        hasMore: false, // TODO: Implement pagination
      } as any;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting products:', error);
        console.log('🔄 Falling back to mock products data');
        const { enhancedProductCatalog } = await import('../data/enhanced-products');
        const products = enhancedProductCatalog.getAllProducts().slice(0, limit);
        return {
          products,
          total: products.length,
          facets: { categories: [], conditions: [], priceRanges: [], locations: [], makes: [], models: [] },
          hasMore: false,
        };
      }
      throw new Error('Failed to get products');
    }
  }

  /**
   * Upload product images to AWS S3
   */
  private static async uploadProductImages(images: File[]): Promise<string[]> {
    const uploadPromises = images.map(async (image, index) => {
      const fileName = `product_image_${index}_${Date.now()}.jpg`;
      const result = await uploadData({
        key: `products/${fileName}`,
        data: image,
        options: {
          contentType: 'image/jpeg',
        },
      });

      // Get the URL for the uploaded image
      const urlResult = await getUrl({
        key: `products/${fileName}`,
        options: {
          expiresIn: 3600, // 1 hour
        },
      });

      return urlResult.url.toString();
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Build GraphQL filter from search filters
   */
  private static buildFilter(filters: SearchFilters): any {
    const filter: any = {};

    if (filters.category) filter.category = { eq: filters.category };
    if (filters.subcategory) filter.subcategory = { eq: filters.subcategory };
    if (filters.condition) filter.condition = { eq: filters.condition };
    if (filters.status) filter.status = { eq: filters.status };
    if (filters.vendorId) filter.vendorId = { eq: filters.vendorId };
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      filter.price = {};
      if (filters.minPrice !== undefined) filter.price.ge = filters.minPrice;
      if (filters.maxPrice !== undefined) filter.price.le = filters.maxPrice;
    }
    if (filters.searchTerm) {
      filter.or = [
        { title: { contains: filters.searchTerm } },
        { description: { contains: filters.searchTerm } },
        { tags: { contains: filters.searchTerm } },
      ];
    }

    return filter;
  }

  /**
   * Generate SEO-friendly slug
   */
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Placeholder methods for compatibility - will be implemented as needed
  static async getProductsByVendor(vendorId: string): Promise<Product[]> {
    return this.getProducts({ vendorId }).then(result => result.products);
  }

  static async getProductsByCategory(category: ProductCategory): Promise<Product[]> {
    return this.getProducts({ category }).then(result => result.products);
  }

  static async getFeaturedProducts(): Promise<Product[]> {
    return this.getProducts({ status: 'approved' }, 10).then(result => result.products);
  }

  static async getRecommendations(productId: string, count: number = 4): Promise<Product[]> {
    // Placeholder: return latest products or empty array for now
    try {
      const { products } = await this.getProducts({}, count);
      return products.filter(p => p.id !== productId).slice(0, count);
    } catch (error) {
      return [];
    }
  }

  static async getSampleProducts(): Promise<Product[]> {
    // Return a small list of featured products for quick UI prototypes
    try {
      // In development mode, directly use mock data to avoid circular calls
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Development mode - Using mock sample products');
        const { enhancedProductCatalog } = await import('../data/enhanced-products');
        return enhancedProductCatalog.getAllProducts().slice(0, 6);
      }

      const { products } = await this.getProducts({}, 6);
      return products.slice(0, 6);
    } catch (error) {
      // Fallback to mock data in case of error
      try {
        const { enhancedProductCatalog } = await import('../data/enhanced-products');
        return enhancedProductCatalog.getAllProducts().slice(0, 6);
      } catch (importError) {
        return [];
      }
    }
  }

  static async incrementViews(productId: string): Promise<void> {
    try {
      await client.graphql({
        query: `
          mutation IncrementViews($id: ID!) {
            incrementProductViews(id: $id) {
              id
              views
            }
          }
        `,
        variables: { id: productId }
      });
    } catch (error) {
      // No-op fallback for demo
      if (process.env.NODE_ENV === 'development') console.warn('incrementViews not implemented in backend');
    }
  }
}

export interface UpdateProductData extends Partial<CreateProductData> {
  status?: ProductStatus;
}
