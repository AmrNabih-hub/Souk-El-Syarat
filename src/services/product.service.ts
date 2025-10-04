/**
 * 🛍️ Product Service
 * Professional product management service using Supabase
 */

import { databaseService } from './supabase-database.service';
import { storageService } from './supabase-storage.service';
import { functionsService } from './supabase-functions.service';
import { realtimeService } from './supabase-realtime.service';
import type { Database } from '@/types/supabase';
import type { Product, ProductImage, CarDetails, Specifications } from '@/types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export interface CreateProductData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  inStock?: boolean;
  quantity?: number;
  specifications?: Specifications;
  features?: string[];
  tags?: string[];
  condition?: 'new' | 'used' | 'refurbished';
  warranty?: string;
  carDetails?: CarDetails;
  images?: File[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
  status?: 'draft' | 'active' | 'inactive' | 'sold';
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  condition?: string;
  priceRange?: { min: number; max: number };
  vendorId?: string;
  status?: string;
  inStock?: boolean;
  tags?: string[];
}

export interface ProductSearchOptions {
  query?: string;
  filters?: ProductFilters;
  sortBy?: 'price' | 'created_at' | 'views' | 'rating';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

class ProductService {
  /**
   * Create a new product
   */
  async createProduct(vendorId: string, data: CreateProductData): Promise<Product> {
    try {
      // Upload images first
      const imageUrls = await this.uploadProductImages(vendorId, data.images || []);

      // Auto-categorize if AI is available
      let category = data.category;
      let subcategory = data.subcategory;
      let tags = data.tags || [];

      try {
        const aiResult = await functionsService.categorizeProduct(
          data.title,
          data.description,
          imageUrls.map(img => img.url)
        );
        
        if (aiResult.data && aiResult.data.confidence > 0.7) {
          category = aiResult.data.category;
          subcategory = aiResult.data.subcategory;
          tags = [...tags, ...aiResult.data.suggestedTags];
        }
      } catch (error) {
        console.warn('⚠️ AI categorization failed:', error);
      }

      // Generate SEO data
      let seoData = null;
      try {
        const seoResult = await functionsService.generateSEO({
          title: data.title,
          description: data.description,
          category,
        });
        
        if (seoResult.data) {
          seoData = seoResult.data;
        }
      } catch (error) {
        console.warn('⚠️ SEO generation failed:', error);
      }

      const productData: ProductInsert = {
        vendor_id: vendorId,
        title: data.title,
        description: data.description,
        category,
        subcategory,
        images: imageUrls,
        price: data.price,
        original_price: data.originalPrice,
        currency: data.currency || 'EGP',
        in_stock: data.inStock ?? true,
        quantity: data.quantity ?? 1,
        specifications: data.specifications || null,
        features: data.features || [],
        tags,
        condition: data.condition || 'new',
        warranty: data.warranty,
        car_details: data.carDetails || null,
        status: 'active',
        views: 0,
        favorites: 0,
        rating: 0,
        review_count: 0,
        seo_data: seoData,
        published_at: new Date().toISOString(),
      };

      const result = await databaseService.create('products', productData);

      console.log('✅ Product created successfully:', result.id);
      return this.mapRowToProduct(result);
    } catch (error) {
      console.error('❌ Create product error:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: string): Promise<Product | null> {
    try {
      const result = await databaseService.readOne('products', productId, {
        select: `
          *,
          vendors (
            business_name,
            rating,
            is_verified
          )
        `,
      });

      if (!result) return null;

      // Increment view count
      await this.incrementViews(productId);

      return this.mapRowToProduct(result);
    } catch (error) {
      console.error('❌ Get product error:', error);
      throw error;
    }
  }

  /**
   * Map database row to Product type
   */
  private mapRowToProduct(row: ProductRow): Product {
    return {
      id: row.id,
      vendorId: row.vendor_id,
      title: row.title,
      description: row.description,
      category: row.category,
      subcategory: row.subcategory || undefined,
      images: (row.images as ProductImage[]) || [],
      price: row.price,
      originalPrice: row.original_price || undefined,
      currency: row.currency,
      inStock: row.in_stock,
      quantity: row.quantity,
      specifications: (row.specifications as Specifications) || undefined,
      features: row.features || [],
      tags: row.tags || [],
      condition: row.condition as 'new' | 'used' | 'refurbished',
      warranty: row.warranty || undefined,
      carDetails: (row.car_details as CarDetails) || undefined,
      status: row.status as 'draft' | 'active' | 'inactive' | 'sold',
      views: row.views,
      favorites: row.favorites,
      rating: row.rating,
      reviewCount: row.review_count,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Upload product images
   */
  private async uploadProductImages(vendorId: string, files: File[]): Promise<ProductImage[]> {
    try {
      const imageUrls: ProductImage[] = [];

      for (const file of files) {
        const path = storageService.generateFilePath(vendorId, file.name, 'products');
        
        const result = await storageService.uploadFile('productImages', path, file, {
          contentType: file.type,
          upsert: false,
        });

        if (result.data) {
          const publicUrl = storageService.getPublicUrl('productImages', result.data.path);
          
          imageUrls.push({
            id: result.data.id,
            url: publicUrl,
            alt: file.name,
            size: file.size,
            type: file.type,
          });
        }
      }

      return imageUrls;
    } catch (error) {
      console.error('❌ Upload product images error:', error);
      throw error;
    }
  }

  /**
   * Increment product views
   */
  private async incrementViews(productId: string): Promise<void> {
    try {
      const product = await databaseService.readOne('products', productId);
      if (product) {
        await databaseService.update('products', productId, {
          views: product.views + 1,
        });
      }
    } catch (error) {
      console.warn('⚠️ Increment views warning:', error);
    }
  }
}

// Static methods for sample products
export class ProductServiceExtensions {
  /**
   * Get sample products for marketplace display
   * Professional sample data for development and demo
   */
  static async getSampleProducts(): Promise<Product[]> {
    try {
      // Try to fetch real products from Supabase first
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(20);

      if (!error && products && products.length > 0) {
        // Return real products from database
        return products.map(this.transformSupabaseProduct);
      }

      // Fallback to sample data if no real products
      return this.generateSampleProducts();
    } catch (error) {
      console.warn('⚠️ Using sample products - Database not ready:', error);
      return this.generateSampleProducts();
    }
  }

  /**
   * Generate professional sample products
   */
  private static generateSampleProducts(): Product[] {
    const sampleProducts: Product[] = [
      {
        id: 'sample-1',
        title: 'BMW X5 2023 فاخرة',
        description: 'سيارة BMW X5 موديل 2023 بحالة ممتازة، مزودة بأحدث التقنيات والميزات الفاخرة',
        price: 1250000,
        originalPrice: 1350000,
        currency: 'EGP',
        images: [
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop&crop=center'
        ],
        category: 'cars',
        condition: 'used',
        brand: 'BMW',
        model: 'X5',
        year: 2023,
        stockQuantity: 1,
        isActive: true,
        isFeatured: true,
        tags: ['فاخرة', 'SUV', 'BMW', 'موديل حديث'],
        vendor: {
          id: 'vendor-1',
          name: 'معرض القاهرة للسيارات الفاخرة',
          rating: 4.8,
          isVerified: true,
        },
        specifications: {
          engine: '3.0L Twin Turbo',
          transmission: 'أوتوماتيك',
          fuel: 'بنزين',
          mileage: '25,000 كم',
          color: 'أسود معدني'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-2',
        title: 'Mercedes C200 2022 نظيفة جداً',
        description: 'مرسيدس C200 موديل 2022، بحالة ممتازة، صيانة منتظمة، فحص كامل',
        price: 950000,
        currency: 'EGP',
        images: [
          'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&h=600&fit=crop&crop=center'
        ],
        category: 'cars',
        condition: 'used',
        brand: 'Mercedes',
        model: 'C200',
        year: 2022,
        stockQuantity: 1,
        isActive: true,
        isFeatured: false,
        tags: ['Mercedes', 'سيدان', 'فاخرة', 'اقتصادية'],
        vendor: {
          id: 'vendor-2',
          name: 'شركة النجم للسيارات المستعملة',
          rating: 4.5,
          isVerified: true,
        },
        specifications: {
          engine: '2.0L Turbo',
          transmission: 'أوتوماتيك',
          fuel: 'بنزين',
          mileage: '45,000 كم',
          color: 'أبيض لؤلؤي'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-3',
        title: 'طقم فرامل أصلي BMW',
        description: 'طقم فرامل أصلي من BMW للموديلات 2018-2023، جودة المصنع الأصلي',
        price: 3500,
        currency: 'EGP',
        images: [
          'https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=800&h=600&fit=crop&crop=center'
        ],
        category: 'parts',
        condition: 'new',
        brand: 'BMW',
        stockQuantity: 25,
        isActive: true,
        isFeatured: false,
        tags: ['قطع غيار', 'فرامل', 'BMW', 'أصلي'],
        vendor: {
          id: 'vendor-3',
          name: 'مركز قطع غيار BMW الأصلية',
          rating: 4.9,
          isVerified: true,
        },
        specifications: {
          compatibility: 'BMW 2018-2023',
          warranty: 'سنتان',
          origin: 'ألمانيا'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-4',
        title: 'إطارات ميشلان 225/60R17',
        description: 'إطارات ميشلان عالية الجودة مقاس 225/60R17، مناسبة لمعظم السيارات المتوسطة',
        price: 1200,
        currency: 'EGP',
        images: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&crop=center'
        ],
        category: 'tires',
        condition: 'new',
        brand: 'Michelin',
        stockQuantity: 50,
        isActive: true,
        isFeatured: true,
        tags: ['إطارات', 'ميشلان', 'جديد', 'جودة عالية'],
        vendor: {
          id: 'vendor-4',
          name: 'محل الإطارات المتخصص',
          rating: 4.6,
          isVerified: true,
        },
        specifications: {
          size: '225/60R17',
          season: 'جميع المواسم',
          warranty: 'خمس سنوات'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-5',
        title: 'Toyota Corolla 2021 اقتصادية',
        description: 'تويوتا كورولا 2021، اقتصادية في الوقود، مناسبة للاستخدام اليومي',
        price: 420000,
        currency: 'EGP',
        images: [
          'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop&crop=center'
        ],
        category: 'cars',
        condition: 'used',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2021,
        stockQuantity: 1,
        isActive: true,
        isFeatured: false,
        tags: ['Toyota', 'اقتصادية', 'موثوقة', 'عائلية'],
        vendor: {
          id: 'vendor-5',
          name: 'معرض الشرق للسيارات اليابانية',
          rating: 4.4,
          isVerified: true,
        },
        specifications: {
          engine: '1.6L',
          transmission: 'أوتوماتيك',
          fuel: 'بنزين',
          mileage: '65,000 كم',
          color: 'فضي'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return sampleProducts;
  }

  /**
   * Transform Supabase product to frontend format
   */
  private static transformSupabaseProduct(dbProduct: any): Product {
    return {
      id: dbProduct.id,
      title: dbProduct.title,
      description: dbProduct.description,
      price: dbProduct.price,
      originalPrice: dbProduct.original_price,
      currency: dbProduct.currency || 'EGP',
      images: Array.isArray(dbProduct.images) ? dbProduct.images : [dbProduct.images].filter(Boolean),
      category: dbProduct.category,
      condition: dbProduct.condition,
      brand: dbProduct.brand,
      model: dbProduct.model,
      year: dbProduct.year,
      stockQuantity: dbProduct.stock_quantity || 0,
      isActive: dbProduct.is_active,
      isFeatured: dbProduct.is_featured || false,
      tags: Array.isArray(dbProduct.tags) ? dbProduct.tags : [],
      vendor: {
        id: dbProduct.vendor_id,
        name: 'Verified Vendor', // This would come from a join in real implementation
        rating: 4.5,
        isVerified: true,
      },
      specifications: dbProduct.specifications || {},
      createdAt: dbProduct.created_at,
      updatedAt: dbProduct.updated_at
    };
  }
}

// Export singleton instance with extended functionality
export const productService = Object.assign(new ProductService(), {
  getSampleProducts: ProductServiceExtensions.getSampleProducts.bind(ProductServiceExtensions)
});

export default productService;