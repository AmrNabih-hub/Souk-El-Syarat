import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';

import { db, storage } from '@/config/firebase.config';
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
import { errorHandler } from './enhanced-error-handler.service';

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

export interface UpdateProductData extends Partial<CreateProductData> {
  status?: ProductStatus;
}

export class EnhancedProductService {
  private static COLLECTION_NAME = 'products';
  private static RETRY_CONFIG = { maxRetries: 3, retryDelay: 1000 };

  /**
   * Create a new product with error handling and retry logic
   */
  static async createProduct(vendorId: string, productData: CreateProductData): Promise<string> {
    return errorHandler.retryWithBackoff(
      async () => {
        const productId = doc(collection(db, this.COLLECTION_NAME)).id;

        // Upload images with error handling
        const imageUrls = await this.uploadProductImagesWithFallback(productId, productData.images);

        const product: Omit<Product, 'id'> = {
          vendorId,
          title: productData.title,
          description: productData.description,
          category: productData.category,
          subcategory: productData.subcategory,
          images: imageUrls.map((url, index) => ({
            id: `${productId}_${index}`,
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
          status: 'pending',
          views: 0,
          favorites: 0,
          rating: 0,
          reviewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          seoData: {
            slug: this.generateSlug(productData.title),
            metaTitle: productData.title,
            metaDescription: productData.description.substring(0, 160),
            keywords: productData.tags,
          },
        };

        await setDoc(doc(db, this.COLLECTION_NAME, productId), {
          ...product,
          id: productId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        return productId;
      },
      {
        operation: 'createProduct',
        userId: vendorId,
        metadata: { title: productData.title, category: productData.category },
        timestamp: new Date(),
      }
    );
  }

  /**
   * Create a car product with specific car details and enhanced error handling
   */
  static async createCarProduct(
    vendorId: string,
    productData: CreateProductData & { carDetails: CarDetails }
  ): Promise<string> {
    return errorHandler.retryWithBackoff(
      async () => {
        const productId = await this.createProduct(vendorId, productData);

        await updateDoc(doc(db, this.COLLECTION_NAME, productId), {
          carDetails: productData.carDetails,
          updatedAt: serverTimestamp(),
        });

        return productId;
      },
      {
        operation: 'createCarProduct',
        userId: vendorId,
        metadata: { 
          title: productData.title, 
          carMake: productData.carDetails.make,
          carModel: productData.carDetails.model 
        },
        timestamp: new Date(),
      }
    );
  }

  /**
   * Get product by ID with error handling and fallback
   */
  static async getProduct(productId: string): Promise<Product | null> {
    return errorHandler.retryWithBackoff(
      async () => {
        const docSnap = await getDoc(doc(db, this.COLLECTION_NAME, productId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            ...(data as any),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            publishedAt: data.publishedAt?.toDate() || null,
          } as Product;
        }
        return null;
      },
      {
        operation: 'getProduct',
        metadata: { productId },
        timestamp: new Date(),
      }
    );
  }

  /**
   * Get products by vendor with pagination and error handling
   */
  static async getProductsByVendor(
    vendorId: string,
    status?: ProductStatus,
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ products: Product[]; lastDoc: DocumentSnapshot | null }> {
    return errorHandler.retryWithBackoff(
      async () => {
        let q = query(
          collection(db, this.COLLECTION_NAME),
          where('vendorId', '==', vendorId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        if (status) {
          q = query(
            collection(db, this.COLLECTION_NAME),
            where('vendorId', '==', vendorId),
            where('status', '==', status),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          );
        }

        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...(data as any),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Product;
        });

        return {
          products,
          lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        };
      },
      {
        operation: 'getProductsByVendor',
        userId: vendorId,
        metadata: { status, limitCount },
        timestamp: new Date(),
      }
    );
  }

  /**
   * Get all products with filters and pagination
   */
  static async getProducts(
    filters: SearchFilters = {},
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<SearchResult> {
    return errorHandler.retryWithBackoff(
      async () => {
        let q = query(
          collection(db, this.COLLECTION_NAME),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        // Apply filters
        if (filters.category) {
          q = query(q, where('category', '==', filters.category));
        }
        if (filters.subcategory) {
          q = query(q, where('subcategory', '==', filters.subcategory));
        }
        if (filters.minPrice !== undefined) {
          q = query(q, where('price', '>=', filters.minPrice));
        }
        if (filters.maxPrice !== undefined) {
          q = query(q, where('price', '<=', filters.maxPrice));
        }
        if (filters.condition) {
          q = query(q, where('condition', '==', filters.condition));
        }
        if (filters.location) {
          q = query(q, where('location', '==', filters.location));
        }

        if (lastDoc) {
          q = query(q, startAfter(lastDoc));
        }

        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...(data as any),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Product;
        });

        return {
          products,
          totalCount: products.length,
          hasMore: products.length === limitCount,
          lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        };
      },
      {
        operation: 'getProducts',
        metadata: { filters, limitCount },
        timestamp: new Date(),
      }
    );
  }

  /**
   * Search products with enhanced search and error handling
   */
  static async searchProducts(
    query: string,
    filters: SearchFilters = {},
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<SearchResult> {
    return errorHandler.retryWithBackoff(
      async () => {
        // Simple text search - in production, use full-text search service
        const allProducts = await this.getProducts({}, 100);
        
        const searchTerms = query.toLowerCase().split(' ');
        const filteredProducts = allProducts.products.filter(product => {
          const searchableText = [
            product.title,
            product.description,
            product.tags?.join(' '),
            product.category,
            product.subcategory,
            product.carDetails?.make,
            product.carDetails?.model,
            product.carDetails?.year?.toString(),
          ].join(' ').toLowerCase();

          return searchTerms.every(term => searchableText.includes(term));
        });

        // Apply additional filters
        let finalProducts = filteredProducts;
        if (filters.category) {
          finalProducts = finalProducts.filter(p => p.category === filters.category);
        }
        if (filters.minPrice !== undefined) {
          finalProducts = finalProducts.filter(p => p.price >= filters.minPrice!);
        }
        if (filters.maxPrice !== undefined) {
          finalProducts = finalProducts.filter(p => p.price <= filters.maxPrice!);
        }

        // Paginate results
        const startIndex = lastDoc ? allProducts.products.findIndex(p => p.id === (lastDoc as any).id) + 1 : 0;
        const paginatedProducts = finalProducts.slice(startIndex, startIndex + limitCount);

        return {
          products: paginatedProducts,
          totalCount: finalProducts.length,
          hasMore: paginatedProducts.length === limitCount && startIndex + limitCount < finalProducts.length,
          lastDoc: paginatedProducts.length > 0 ? { id: paginatedProducts[paginatedProducts.length - 1].id } as any : null,
        };
      },
      {
        operation: 'searchProducts',
        metadata: { query, filters, limitCount },
        timestamp: new Date(),
      }
    );
  }

  /**
   * Update product with error handling
   */
  static async updateProduct(productId: string, updateData: UpdateProductData): Promise<void> {
    return errorHandler.retryWithBackoff(
      async () => {
        const updatePayload = {
          ...updateData,
          updatedAt: serverTimestamp(),
        };

        await updateDoc(doc(db, this.COLLECTION_NAME, productId), updatePayload);
      },
      {
        operation: 'updateProduct',
        metadata: { productId, updateFields: Object.keys(updateData) },
        timestamp: new Date(),
      }
    );
  }

  /**
   * Delete product with cleanup
   */
  static async deleteProduct(productId: string): Promise<void> {
    return errorHandler.retryWithBackoff(
      async () => {
        // Get product to clean up images
        const product = await this.getProduct(productId);
        if (product) {
          // Delete images from storage
          await this.deleteProductImages(productId, product.images.map(img => img.url));
        }

        await deleteDoc(doc(db, this.COLLECTION_NAME, productId));
      },
      {
        operation: 'deleteProduct',
        metadata: { productId },
        timestamp: new Date(),
      }
    );
  }

  /**
   * Increment product views
   */
  static async incrementViews(productId: string): Promise<void> {
    return errorHandler.retryWithBackoff(
      async () => {
        await updateDoc(doc(db, this.COLLECTION_NAME, productId), {
          views: increment(1),
        });
      },
      {
        operation: 'incrementViews',
        metadata: { productId },
        timestamp: new Date(),
      }
    );
  }

  /**
   * Upload product images with fallback handling
   */
  private static async uploadProductImagesWithFallback(
    productId: string,
    images: File[]
  ): Promise<string[]> {
    if (!images || images.length === 0) {
      return ['/placeholder-product.jpg'];
    }

    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      try {
        const image = images[i];
        const imageRef = ref(storage, `products/${productId}/image_${Date.now()}_${i}`);
        const snapshot = await uploadBytes(imageRef, image);
        const url = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(url);
      } catch (error) {
        console.warn(`Failed to upload image ${i + 1}, using placeholder`);
        uploadedUrls.push('/placeholder-product.jpg');
      }
    }

    return uploadedUrls.length > 0 ? uploadedUrls : ['/placeholder-product.jpg'];
  }

  /**
   * Upload product images (legacy method)
   */
  private static async uploadProductImages(productId: string, images: File[]): Promise<string[]> {
    const uploadPromises = images.map(async (image, index) => {
      const imageRef = ref(storage, `products/${productId}/image_${Date.now()}_${index}`);
      const snapshot = await uploadBytes(imageRef, image);
      return getDownloadURL(snapshot.ref);
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Delete product images
   */
  private static async deleteProductImages(productId: string, imageUrls: string[]): Promise<void> {
    const deletePromises = imageUrls.map(async (url) => {
      try {
        const imageRef = ref(storage, url);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn('Failed to delete image:', error);
      }
    });

    await Promise.all(deletePromises);
  }

  /**
   * Generate SEO-friendly slug
   */
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }
}

// Re-export for backward compatibility
export const ProductService = EnhancedProductService;