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

export class ProductService {
  private static COLLECTION_NAME = 'products';

  /**
   * Create a new product
   */
  static async createProduct(vendorId: string, productData: CreateProductData): Promise<string> {
    try {
      const productId = doc(collection(db, this.COLLECTION_NAME)).id;

      // Upload images
      const imageUrls = await this.uploadProductImages(productId, productData.images);

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
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  /**
   * Create a car product with specific car details
   */
  static async createCarProduct(
    vendorId: string,
    productData: CreateProductData & { carDetails: CarDetails }
  ): Promise<string> {
    try {
      const productId = await this.createProduct(vendorId, productData);

      // Update with car-specific details
      await updateDoc(doc(db, this.COLLECTION_NAME, productId), {
        carDetails: productData.carDetails,
        updatedAt: serverTimestamp(),
      });

      return productId;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error creating car product:', error);
      throw new Error('Failed to create car product');
    }
  }

  /**
   * Get product by ID
   */
  static async getProduct(productId: string): Promise<Product | null> {
    try {
      const docSnap = await getDoc(doc(db, this.COLLECTION_NAME, productId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...(data as any),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
          publishedAt: data.publishedAt.toDate() || new Date() || null,
        } as Product;
      }
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting product:', error);
      throw new Error('Failed to get product');
    }
  }

  /**
   * Get products by vendor
   */
  static async getProductsByVendor(
    vendorId: string,
    status?: ProductStatus,
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ products: Product[]; lastDoc: DocumentSnapshot | null }> {
    try {
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
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
          publishedAt: data.publishedAt.toDate() || new Date() || null,
        } as Product;
      });

      const lastDocument =
        querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;

      return { products, lastDoc: lastDocument };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting vendor products:', error);
      throw new Error('Failed to get vendor products');
    }
  }

  /**
   * Search products with filters
   */
  static async searchProducts(
    filters: SearchFilters,
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<SearchResult> {
    try {
      let q = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      // Apply filters
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }

      if (filters.condition) {
        q = query(q, where('condition', '==', filters.condition));
      }

      if (filters.inStock !== null) {
        q = query(q, where('inStock', '==', filters.inStock));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      let products = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...(data as any),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
          publishedAt: data.publishedAt.toDate() || new Date() || null,
        } as Product;
      });

      // Client-side filtering for complex queries
      if (filters.query) {
        const searchTerm = filters.query.toLowerCase();
        products = products.filter(
          product =>
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (filters.priceRange) {
        products = products.filter(
          product =>
            product.price >= filters.priceRange!.min && product.price <= filters.priceRange!.max
        );
      }

      // Car-specific filters
      if (filters.make && products.length > 0) {
        products = products.filter(product => {
          const carProduct = product as CarProduct;
          return carProduct.carDetails?.make?.toLowerCase().includes(filters.make!.toLowerCase());
        });
      }

      if (filters.yearRange && products.length > 0) {
        products = products.filter(product => {
          const carProduct = product as CarProduct;
          const year = carProduct.carDetails?.year;
          return year && year >= filters.yearRange!.min && year <= filters.yearRange!.max;
        });
      }

      return {
        products,
        total: products.length,
        facets: {
          categories: [],
          conditions: [],
          priceRanges: [],
          locations: [],
          makes: [],
          models: [],
        },
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error searching products:', error);
      throw new Error('Failed to search products');
    }
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limitCount: number = 8): Promise<Product[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', 'published'),
        orderBy('views', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...(data as any),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
          publishedAt: data.publishedAt.toDate() || new Date() || null,
        } as Product;
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting featured products:', error);
      throw new Error('Failed to get featured products');
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(
    category: ProductCategory,
    limitCount: number = 20
  ): Promise<Product[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('category', '==', category),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...(data as any),
          createdAt: data.createdAt.toDate() || new Date(),
          updatedAt: data.updatedAt.toDate() || new Date(),
          publishedAt: data.publishedAt.toDate() || new Date() || null,
        } as Product;
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting products by category:', error);
      throw new Error('Failed to get products by category');
    }
  }

  /**
   * Update product
   */
  static async updateProduct(productId: string, updates: UpdateProductData): Promise<void> {
    try {
      const updateData: unknown = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Handle image uploads if new images provided
      if (updates.images && updates.images.length > 0) {
        const imageUrls = await this.uploadProductImages(productId, updates.images);
        updateData.images = imageUrls.map((url, index) => ({
          id: `${productId}_${index}`,
          url,
          alt: updates.title || 'Product image',
          isPrimary: index === 0,
          order: index,
        }));
      }

      await updateDoc(doc(db, this.COLLECTION_NAME, productId), updateData);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error updating product:', error);
      throw new Error('Failed to update product');
    }
  }

  /**
   * Update product status
   */
  static async updateProductStatus(productId: string, status: ProductStatus): Promise<void> {
    try {
      const updateData: unknown = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === 'published') {
        updateData.publishedAt = serverTimestamp();
      }

      await updateDoc(doc(db, this.COLLECTION_NAME, productId), updateData);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error updating product status:', error);
      throw new Error('Failed to update product status');
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(productId: string): Promise<void> {
    try {
      // Delete product images
      const product = await this.getProduct(productId);
      if (product?.images) {
        for (const image of product.images) {
          try {
            const imageRef = ref(storage, `products/${productId}/${image.id}`);
            await deleteObject(imageRef);
          } catch (imageError) {
            // if (process.env.NODE_ENV === 'development') console.warn('Error deleting product image:', imageError);
          }
        }
      }

      // Delete product document
      await deleteDoc(doc(db, this.COLLECTION_NAME, productId));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }

  /**
   * Increment product views
   */
  static async incrementViews(productId: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION_NAME, productId), {
        views: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error incrementing product views:', error);
      // Don't throw error for view tracking
    }
  }

  /**
   * Toggle product favorite
   */
  static async toggleFavorite(
    productId: string,
    _userId: string,
    isFavorite: boolean
  ): Promise<void> {
    try {
      const updateData = isFavorite ? { favorites: increment(1) } : { favorites: increment(-1) };

      await updateDoc(doc(db, this.COLLECTION_NAME, productId), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error toggling product favorite:', error);
      throw new Error('Failed to update favorite status');
    }
  }

  /**
   * Get product recommendations
   */
  static async getRecommendations(productId: string, limitCount: number = 6): Promise<Product[]> {
    try {
      const product = await this.getProduct(productId);
      if (!product) return [];

      // Get products from same category
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('category', '==', product.category),
        where('status', '==', 'published'),
        orderBy('views', 'desc'),
        limit(limitCount + 1) // +1 to exclude current product
      );

      const querySnapshot = await getDocs(q);
      const recommendations = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            ...(data as any),
            createdAt: data.createdAt.toDate() || new Date(),
            updatedAt: data.updatedAt.toDate() || new Date(),
            publishedAt: data.publishedAt.toDate() || new Date() || null,
          } as Product;
        })
        .filter(p => p.id !== productId)
        .slice(0, limitCount);

      return recommendations;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') if (process.env.NODE_ENV === 'development') console.error('Error getting product recommendations:', error);
      return [];
    }
  }

  /**
   * Upload product images to Firebase Storage
   */
  private static async uploadProductImages(productId: string, images: File[]): Promise<string[]> {
    const uploadPromises = images.map(async (image, index) => {
      const imageRef = ref(storage, `products/${productId}/image_${index}_${Date.now()}.jpg`);
      await uploadBytes(imageRef, image);
      return getDownloadURL(imageRef);
    });

    return Promise.all(uploadPromises);
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

  /**
   * Get enhanced product catalog
   */
  private static getEnhancedProductCatalog(): Product[] {
    // Luxury Cars
    const luxuryCars: Product[] = [
      {
        id: 'luxury-car-1',
        vendorId: 'premium-motors',
        title: 'Porsche 911 Turbo S 2024 - Track Performance Edition',
        description:
          'Ultimate sports car engineering with 640 HP twin-turbo flat-six engine. Carbon fiber aero package, ceramic brakes, and sport chrono package. This pristine example features Paint to Sample Riviera Blue with full leather interior.',
        category: 'cars',
        subcategory: 'sports',
        images: [
          {
            id: 'porsche-1',
            url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&h=800&fit=crop&crop=center',
            alt: 'Porsche 911 Turbo S - Riviera Blue Exterior',
            isPrimary: true,
            order: 0,
          },
        ],
        price: 4500000,
        originalPrice: 4800000,
        currency: 'EGP',
        inStock: true,
        quantity: 1,
        specifications: [
          { name: 'Engine', value: '3.8L Twin-Turbo Flat-6', category: 'engine' },
          { name: 'Power', value: '640 HP @ 6,750 RPM', category: 'engine' },
          { name: 'Torque', value: '590 lb-ft @ 2,500-4,000 RPM', category: 'engine' },
          { name: '0-60 mph', value: '2.6 seconds', category: 'performance' },
          { name: 'Top Speed', value: '205 mph', category: 'performance' },
        ],
        features: [
          'Sport Chrono Package',
          'Ceramic Composite Brakes (PCCB)',
          'Carbon Fiber Aero Kit',
          'Adaptive Sport Seats Plus',
          'Bose Surround Sound System',
          'Paint to Sample Riviera Blue',
        ],
        tags: ['porsche', '911', 'turbo-s', 'sports-car', 'luxury'],
        condition: 'new',
        warranty: { type: 'manufacturer', duration: 48, coverage: 'Full Porsche Warranty' },
        status: 'published',
        views: 245,
        favorites: 18,
        rating: 4.9,
        reviewCount: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Premium Parts
    const premiumParts: Product[] = [
      {
        id: 'part-brembo-1',
        vendorId: 'performance-parts',
        title: 'Brembo GT Series 6-Piston Front Brake Kit - BMW M3/M4',
        description:
          'Professional-grade Brembo GT brake system featuring 6-piston monobloc calipers with 380mm drilled rotors. Direct bolt-on fitment for BMW M3/M4 (F80/F82/F83). Includes stainless steel braided lines and performance brake pads.',
        category: 'parts',
        subcategory: 'brake_parts',
        images: [
          {
            id: 'brembo-kit-1',
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop&crop=center',
            alt: 'Brembo GT 6-Piston Brake Kit',
            isPrimary: true,
            order: 0,
          },
        ],
        price: 45000,
        originalPrice: 52000,
        currency: 'EGP',
        inStock: true,
        quantity: 8,
        specifications: [
          { name: 'Caliper Type', value: '6-Piston Monobloc Fixed', category: 'brake' },
          { name: 'Rotor Diameter', value: '380mm x 34mm', category: 'brake' },
          { name: 'Compatibility', value: 'BMW M3/M4 F80/F82/F83', category: 'fitment' },
        ],
        features: [
          'Brembo GT Monobloc Calipers',
          'High-Carbon Cast Iron Rotors',
          'Performance Ceramic Brake Pads',
          'Stainless Steel Braided Lines',
        ],
        tags: ['brembo', 'brake-kit', 'bmw', 'm3', 'm4', 'performance'],
        condition: 'new',
        warranty: { type: 'manufacturer', duration: 24, coverage: 'Brembo Limited Warranty' },
        status: 'published',
        views: 156,
        favorites: 11,
        rating: 4.7,
        reviewCount: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return [...luxuryCars, ...premiumParts];
  }

  /**
   * Get comprehensive sample products for development/demo
   */
  static getSampleProducts(): Product[] {
    // Import enhanced product catalog
    const enhancedCatalog = this.getEnhancedProductCatalog();

    const sampleProducts: Product[] = [
      // Enhanced Premium Catalog
      ...enhancedCatalog,

      // Premium Cars
      {
        id: 'car-1',
        vendorId: 'vendor-1',
        title: 'BMW X5 xDrive40i 2022 M Sport Package - Pristine Condition',
        description:
          'Exceptional BMW X5 xDrive40i featuring the prestigious M Sport Package. This luxury SAV combines sophisticated Alpine White Metallic paint with premium Cognac Vernasca leather interior. Equipped with BMW Live Cockpit Professional, Panoramic Sky Lounge LED roof, Harman Kardon Surround Sound System, and advanced driver assistance systems. Meticulously maintained with full service history.',
        category: 'cars',
        subcategory: 'suv',
        images: [
          {
            id: 'car-1-img-1',
            url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&h=800&fit=crop&crop=center&q=90',
            alt: 'BMW X5 2022 - Alpine White Metallic Exterior Front View',
            isPrimary: true,
            order: 0,
          },
          {
            id: 'car-1-img-2',
            url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop&crop=center&q=90',
            alt: 'BMW X5 2022 - Premium Interior with Live Cockpit Professional',
            isPrimary: false,
            order: 1,
          },
          {
            id: 'car-1-img-3',
            url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=800&fit=crop&crop=center&q=90',
            alt: 'BMW X5 2022 - Modern Dashboard Technology',
            isPrimary: false,
            order: 2,
          },
          {
            id: 'car-1-img-4',
            url: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=1200&h=800&fit=crop&crop=center&q=90',
            alt: 'BMW X5 2022 - Side Profile Dynamic View',
            isPrimary: false,
            order: 3,
          },
          {
            id: 'car-1-img-5',
            url: 'https://images.unsplash.com/photo-1606016159991-d5d3a8b2a8b1?w=1200&h=800&fit=crop&crop=center&q=90',
            alt: 'BMW X5 2022 - Rear View with M Sport Package',
            isPrimary: false,
            order: 4,
          },
        ],
        price: 1450000,
        originalPrice: 1600000,
        currency: 'EGP',
        inStock: true,
        quantity: 1,
        specifications: [
          { name: 'Engine', value: '3.0L BMW TwinPower Turbo I6', category: 'engine' },
          { name: 'Power Output', value: '335 HP @ 5,500-6,500 RPM', category: 'engine' },
          { name: 'Torque', value: '330 lb-ft @ 1,500-5,200 RPM', category: 'engine' },
          { name: 'Transmission', value: '8-Speed Steptronic Automatic', category: 'transmission' },
          { name: 'Drivetrain', value: 'BMW xDrive Intelligent AWD', category: 'drivetrain' },
          { name: 'Fuel Type', value: 'Premium Unleaded (91+ Octane)', category: 'fuel' },
          { name: 'Fuel Economy', value: '21 City / 26 Highway MPG', category: 'efficiency' },
          { name: 'Mileage', value: '45,000 km (Service Records Available)', category: 'mileage' },
          {
            name: 'Exterior Color',
            value: 'Alpine White III Metallic (300)',
            category: 'exterior',
          },
          { name: 'Interior', value: 'Cognac Vernasca Leather', category: 'interior' },
          { name: 'Wheels', value: '20" M Light Alloy Double-Spoke 716M', category: 'wheels' },
        ],
        features: [
          'M Sport Package with Aerodynamic Kit',
          'Panoramic Sky Lounge LED Roof',
          'BMW Live Cockpit Professional 12.3"',
          'Harman Kardon Surround Sound (16 Speakers)',
          'BMW Gesture Control',
          'Wireless Apple CarPlay & Android Auto',
          'Surround View Camera System (360°)',
          'Park Distance Control (PDC)',
          'Comfort Access Keyless Entry',
          'Multi-Zone Automatic Climate Control',
          'Heated & Ventilated Front Seats',
          'Memory Seats (Driver & Passenger)',
          'BMW Head-Up Display',
          'Active Driving Assistant Pro',
          'Adaptive LED Headlights with Laser High Beams',
        ],
        tags: ['bmw', 'x5', 'suv', 'luxury', 'panorama', 'full-option'],
        condition: 'used',
        warranty: {
          type: 'seller',
          duration: 12,
          coverage: 'ضمان شامل على المحرك وناقل الحركة والكهرباء',
        },
        status: 'published',
        views: 892,
        favorites: 67,
        rating: 4.9,
        reviewCount: 23,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        publishedAt: new Date('2024-01-16'),
        seoData: {
          slug: 'bmw-x5-2022-full-option-panorama',
          metaTitle: 'BMW X5 2022 فل أوبشن بانوراما للبيع',
          metaDescription: 'BMW X5 2022 بحالة الوكالة، فل أوبشن، بانوراما، جلد، نافيجيشن',
          keywords: ['bmw', 'x5', 'suv', 'luxury', 'panorama'],
        },
      },
      {
        id: 'car-2',
        vendorId: 'vendor-1',
        title: 'Mercedes-Benz E 350 2023 AMG Line Premium Plus - Obsidian Black',
        description:
          'Immaculate Mercedes-Benz E 350 AMG Line featuring the Premium Plus Package in stunning Obsidian Black Metallic. This executive sedan showcases the pinnacle of German engineering with MBUX Hyperscreen, AMG Night Package, and Burmester 3D Surround Sound. Factory warranty remaining with certified pre-owned program eligibility.',
        category: 'cars',
        subcategory: 'sedan',
        images: [
          {
            id: 'car-2-img-1',
            url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&h=800&fit=crop&crop=center&q=90',
            alt: 'Mercedes-Benz E 350 2023 - Elegant Black Exterior',
            isPrimary: true,
            order: 0,
          },
          {
            id: 'car-2-img-2',
            url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&h=800&fit=crop&crop=center&q=90',
            alt: 'Mercedes E 350 2023 - Luxury Interior with Premium Materials',
            isPrimary: false,
            order: 1,
          },
          {
            id: 'car-2-img-3',
            url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop&crop=center',
            alt: 'Mercedes E 350 2023 - MBUX Hyperscreen Display',
            isPrimary: false,
            order: 2,
          },
          {
            id: 'car-2-img-4',
            url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&crop=center',
            alt: 'Mercedes E 350 2023 - AMG Line Wheels',
            isPrimary: false,
            order: 3,
          },
        ],
        price: 1850000,
        originalPrice: 2100000,
        currency: 'EGP',
        inStock: true,
        quantity: 1,
        specifications: [
          { name: 'Engine', value: '2.0L Mercedes-AMG Turbo I4 M254', category: 'engine' },
          { name: 'Power Output', value: '255 HP @ 5,800 RPM', category: 'engine' },
          { name: 'Torque', value: '273 lb-ft @ 1,800-4,000 RPM', category: 'engine' },
          { name: 'Transmission', value: '9G-TRONIC 9-Speed Automatic', category: 'transmission' },
          { name: 'Drivetrain', value: 'Rear-Wheel Drive (RWD)', category: 'drivetrain' },
          { name: 'Fuel Type', value: 'Premium Unleaded (91+ Octane)', category: 'fuel' },
          { name: 'Fuel Economy', value: '23 City / 32 Highway MPG', category: 'efficiency' },
          { name: 'Mileage', value: '18,500 km (Dealer Maintained)', category: 'mileage' },
          { name: 'Exterior Color', value: 'Obsidian Black Metallic (197)', category: 'exterior' },
          {
            name: 'Interior',
            value: 'Black Artico/Dinamica with Red Stitching',
            category: 'interior',
          },
          { name: 'Wheels', value: '19" AMG Multi-Spoke Light Alloy', category: 'wheels' },
        ],
        features: [
          'AMG Line Exterior & Interior Package',
          'Premium Plus Package',
          'AMG Night Package',
          'MBUX Hyperscreen (56" Curved Display)',
          'Burmester 3D Surround Sound System',
          'Mercedes me connect Services',
          'KEYLESS-GO Comfort Package',
          'AIRMATIC Air Suspension',
          'AMG Performance Steering Wheel',
          'Multibeam LED Headlights',
          '360-Degree Camera System',
          'Active Parking Assist with PARKTRONIC',
          'Driver Assistance Package',
          'Heated & Ventilated AMG Sports Seats',
          'Ambient Lighting (64 Colors)',
          'Wireless Phone Charging',
          'Head-Up Display',
        ],
        tags: ['mercedes', 'e-class', 'sedan', 'luxury', 'elegance'],
        condition: 'used',
        warranty: {
          type: 'manufacturer',
          duration: 24,
          coverage: 'ضمان الوكالة المتبقي',
        },
        status: 'published',
        views: 654,
        favorites: 45,
        rating: 4.8,
        reviewCount: 18,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-18'),
        publishedAt: new Date('2024-01-13'),
        seoData: {
          slug: 'mercedes-e-class-2023-elegance-plus',
          metaTitle: 'Mercedes E-Class 2023 إيليجانس بلس للبيع',
          metaDescription: 'مرسيدس E-Class 2023 حالة الوكالة، أقل من 20 ألف كم',
          keywords: ['mercedes', 'e-class', 'sedan', 'luxury'],
        },
      },
      {
        id: 'car-3',
        vendorId: 'vendor-2',
        title: 'Toyota Camry 2021 - هايبرد فل أوبشن',
        description:
          'تويوتا كامري 2021 هايبرد، فل أوبشن، اقتصادية في الوقود، جلد بني، فتحة سقف، نظام Toyota Safety Sense، كاميرا خلفية، شاشة لمس 9 بوصة.',
        category: 'cars',
        subcategory: 'sedan',
        images: [
          {
            id: 'car-3-img-1',
            url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop',
            alt: 'Toyota Camry Hybrid',
            isPrimary: true,
            order: 0,
          },
          {
            id: 'car-3-img-2',
            url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop',
            alt: 'Camry Interior',
            isPrimary: false,
            order: 1,
          },
        ],
        price: 485000,
        originalPrice: 520000,
        currency: 'EGP',
        inStock: true,
        quantity: 1,
        specifications: [
          { name: 'المحرك', value: '2.5L Hybrid', category: 'engine' },
          { name: 'القوة', value: '208 حصان', category: 'engine' },
          { name: 'ناقل الحركة', value: 'CVT', category: 'transmission' },
          { name: 'نوع الوقود', value: 'هايبرد', category: 'fuel' },
          { name: 'المسافة المقطوعة', value: '65,000 كم', category: 'mileage' },
          { name: 'استهلاك الوقود', value: '4.5 لتر/100كم', category: 'efficiency' },
        ],
        features: [
          'هايبرد',
          'فتحة سقف',
          'جلد بني',
          'Toyota Safety Sense',
          'كاميرا خلفية',
          'شاشة 9 بوصة',
          'مثبت سرعة',
        ],
        tags: ['toyota', 'camry', 'hybrid', 'fuel-efficient', 'sedan'],
        condition: 'used',
        warranty: {
          type: 'seller',
          duration: 6,
          coverage: 'ضمان على المحرك والبطارية الهايبرد',
        },
        status: 'published',
        views: 432,
        favorites: 31,
        rating: 4.7,
        reviewCount: 15,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15'),
        publishedAt: new Date('2024-01-11'),
        seoData: {
          slug: 'toyota-camry-2021-hybrid-full-option',
          metaTitle: 'Toyota Camry 2021 هايبرد فل أوبشن',
          metaDescription: 'تويوتا كامري هايبرد اقتصادية في الوقود، فل أوبشن',
          keywords: ['toyota', 'camry', 'hybrid', 'fuel-efficient'],
        },
      },

      // Auto Parts
      {
        id: 'part-1',
        vendorId: 'vendor-3',
        title: 'Brembo Xtra Drilled Performance Brake Pads - Premium Ceramic Compound',
        description:
          'Professional-grade Brembo Xtra performance brake pads featuring advanced ceramic compound technology. Engineered for European luxury vehicles including BMW M-Series and Mercedes-AMG models. Superior heat dissipation, reduced brake fade, and extended pad life. OE-quality construction with noise-dampening shims and wear indicators.',
        category: 'parts',
        subcategory: 'brake_parts',
        images: [
          {
            id: 'part-1-img-1',
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop&crop=center&q=90',
            alt: 'Brembo High-Performance Brake Pads - Ceramic Compound',
            isPrimary: true,
            order: 0,
          },
          {
            id: 'part-1-img-2',
            url: 'https://images.unsplash.com/photo-1632823469190-6596598f8582?w=1200&h=800&fit=crop&crop=center&q=90',
            alt: 'Professional Brake System Installation Service',
            isPrimary: false,
            order: 1,
          },
          {
            id: 'part-1-img-3',
            url: 'https://images.unsplash.com/photo-1486496572940-2bb2341fdbdf?w=1200&h=800&fit=crop&crop=center&q=90',
            alt: 'Automotive Parts Quality Control and Testing',
            isPrimary: false,
            order: 2,
          },
        ],
        price: 850,
        originalPrice: 950,
        currency: 'EGP',
        inStock: true,
        quantity: 12,
        specifications: [
          { name: 'الماركة', value: 'Brembo Original', category: 'brand' },
          { name: 'المادة', value: 'سيراميك', category: 'material' },
          { name: 'التوافق', value: 'BMW X5, Mercedes E-Class', category: 'compatibility' },
          { name: 'درجة الحرارة', value: 'حتى 800°C', category: 'temperature' },
        ],
        features: ['مقاومة عالية للحرارة', 'عمر افتراضي طويل', 'أداء فائق', 'قليل الضوضاء', 'أصلي'],
        tags: ['brembo', 'ceramic', 'brake-pads', 'bmw', 'mercedes', 'performance'],
        condition: 'new',
        warranty: {
          type: 'manufacturer',
          duration: 24,
          coverage: 'ضمان الشركة المصنعة ضد عيوب التصنيع',
        },
        status: 'published',
        views: 234,
        favorites: 19,
        rating: 4.9,
        reviewCount: 31,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-12'),
        publishedAt: new Date('2024-01-09'),
        seoData: {
          slug: 'brembo-ceramic-brake-pads-bmw-mercedes',
          metaTitle: 'فرامل بريمبو سيراميك BMW Mercedes',
          metaDescription: 'فرامل سيراميك بريمبو عالية الأداء لسيارات BMW وMercedes',
          keywords: ['brembo', 'ceramic', 'brake-pads', 'bmw', 'mercedes'],
        },
      },
      {
        id: 'part-2',
        vendorId: 'vendor-3',
        title: 'إطارات ميشلان Pilot Sport 4S - 245/40/R18',
        description:
          'إطارات ميشلان Pilot Sport 4S عالية الأداء، مقاس 245/40/R18، مناسبة للسيارات الرياضية، قبضة ممتازة على الطرق الجافة والمبتلة، تقنية Dynamic Response.',
        category: 'tires',
        subcategory: 'performance_tires',
        images: [
          {
            id: 'part-2-img-1',
            url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
            alt: 'Michelin Pilot Sport 4S',
            isPrimary: true,
            order: 0,
          },
        ],
        price: 2400,
        currency: 'EGP',
        inStock: true,
        quantity: 8,
        specifications: [
          { name: 'الماركة', value: 'Michelin', category: 'brand' },
          { name: 'المقاس', value: '245/40/R18', category: 'size' },
          { name: 'النوع', value: 'Performance Summer', category: 'type' },
          { name: 'مؤشر السرعة', value: 'Y (300 km/h)', category: 'speed_rating' },
          { name: 'مؤشر الحمولة', value: '97', category: 'load_index' },
        ],
        features: [
          'قبضة ممتازة',
          'مقاومة التآكل',
          'هدوء في القيادة',
          'توفير الوقود',
          'Dynamic Response',
        ],
        tags: ['michelin', 'pilot-sport', 'performance', 'summer-tires', '18-inch'],
        condition: 'new',
        warranty: {
          type: 'manufacturer',
          duration: 60,
          coverage: 'ضمان ضد عيوب التصنيع لمدة 5 سنوات',
        },
        status: 'published',
        views: 189,
        favorites: 15,
        rating: 4.8,
        reviewCount: 24,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-10'),
        publishedAt: new Date('2024-01-06'),
        seoData: {
          slug: 'michelin-pilot-sport-4s-245-40-r18',
          metaTitle: 'إطارات ميشلان Pilot Sport 4S مقاس 245/40/R18',
          metaDescription: 'إطارات ميشلان عالية الأداء للسيارات الرياضية',
          keywords: ['michelin', 'pilot-sport', 'performance', 'tires'],
        },
      },
      {
        id: 'part-3',
        vendorId: 'vendor-4',
        title: 'فلتر هواء K&N عالي الأداء - قابل للغسيل',
        description:
          'فلتر هواء K&N عالي الأداء، قابل للغسيل وإعادة الاستخدام، يزيد من قوة المحرك وكفاءة استهلاك الوقود، مناسب لمعظم السيارات اليابانية والأوروبية.',
        category: 'parts',
        subcategory: 'engine_parts',
        images: [
          {
            id: 'part-3-img-1',
            url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',
            alt: 'K&N Air Filter',
            isPrimary: true,
            order: 0,
          },
        ],
        price: 320,
        currency: 'EGP',
        inStock: true,
        quantity: 15,
        specifications: [
          { name: 'الماركة', value: 'K&N', category: 'brand' },
          { name: 'النوع', value: 'قابل للغسيل', category: 'type' },
          { name: 'المادة', value: 'قطن مزيت', category: 'material' },
          { name: 'العمر الافتراضي', value: '1.6 مليون كم', category: 'lifespan' },
        ],
        features: ['قابل للغسيل', 'يزيد القوة', 'توفير الوقود', 'عمر طويل', 'صديق للبيئة'],
        tags: ['k&n', 'air-filter', 'washable', 'performance', 'reusable'],
        condition: 'new',
        warranty: {
          type: 'manufacturer',
          duration: 120,
          coverage: 'ضمان مدى الحياة من K&N',
        },
        status: 'published',
        views: 156,
        favorites: 12,
        rating: 4.7,
        reviewCount: 18,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-08'),
        publishedAt: new Date('2024-01-04'),
        seoData: {
          slug: 'k-n-washable-air-filter-high-performance',
          metaTitle: 'فلتر هواء K&N قابل للغسيل عالي الأداء',
          metaDescription: 'فلتر هواء K&N قابل للغسيل يزيد قوة المحرك',
          keywords: ['k&n', 'air-filter', 'washable', 'performance'],
        },
      },

      // Services
      {
        id: 'service-1',
        vendorId: 'vendor-5',
        title: 'خدمة صيانة دورية VIP - فحص شامل 50 نقطة',
        description:
          'خدمة صيانة دورية VIP تشمل فحص شامل لـ50 نقطة، تغيير الزيت والفلاتر، فحص الفرامل، فحص التعليق، فحص الكهرباء، تقرير مفصل مع الصور، ضمان 6 شهور.',
        category: 'services',
        subcategory: 'maintenance',
        images: [
          {
            id: 'service-1-img-1',
            url: 'https://images.unsplash.com/photo-1632823471565-1ecdf7c24c0d?w=800&h=600&fit=crop',
            alt: 'VIP Car Maintenance Service',
            isPrimary: true,
            order: 0,
          },
          {
            id: 'service-1-img-2',
            url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600&fit=crop',
            alt: 'Professional Mechanic',
            isPrimary: false,
            order: 1,
          },
        ],
        price: 450,
        currency: 'EGP',
        inStock: true,
        quantity: 999,
        specifications: [
          { name: 'مدة الخدمة', value: '3-4 ساعات', category: 'duration' },
          { name: 'عدد نقاط الفحص', value: '50 نقطة', category: 'inspection_points' },
          { name: 'الضمان', value: '6 شهور', category: 'warranty' },
          { name: 'المكان', value: 'مركز الخدمة المعتمد', category: 'location' },
        ],
        features: [
          'فحص 50 نقطة',
          'تقرير مفصل',
          'صور قبل وبعد',
          'ضمان 6 شهور',
          'فنيين معتمدين',
          'قطع غيار أصلية',
        ],
        tags: ['vip-maintenance', 'comprehensive-service', '50-point-inspection', 'warranty'],
        condition: 'new',
        warranty: {
          type: 'seller',
          duration: 6,
          coverage: 'ضمان شامل على جميع الأعمال والقطع المستبدلة',
        },
        status: 'published',
        views: 387,
        favorites: 28,
        rating: 4.9,
        reviewCount: 42,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-05'),
        publishedAt: new Date('2024-01-02'),
        seoData: {
          slug: 'vip-car-maintenance-50-point-inspection',
          metaTitle: 'خدمة صيانة VIP فحص 50 نقطة',
          metaDescription: 'خدمة صيانة شاملة VIP مع فحص 50 نقطة وضمان 6 شهور',
          keywords: ['vip-maintenance', 'comprehensive-service', 'car-service'],
        },
      },
      {
        id: 'service-2',
        vendorId: 'vendor-5',
        title: 'خدمة تنظيف وتلميع السيارة بالبخار',
        description:
          'خدمة تنظيف شاملة بتقنية البخار الحديثة، تنظيف داخلي وخارجي، تلميع الطلاء، حماية المقاعد الجلدية، تعقيم المقصورة، تنظيف المحرك، نتائج احترافية.',
        category: 'services',
        subcategory: 'detailing',
        images: [
          {
            id: 'service-2-img-1',
            url: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&h=600&fit=crop',
            alt: 'Steam Car Wash',
            isPrimary: true,
            order: 0,
          },
        ],
        price: 180,
        currency: 'EGP',
        inStock: true,
        quantity: 999,
        specifications: [
          { name: 'مدة الخدمة', value: '2-3 ساعات', category: 'duration' },
          { name: 'التقنية', value: 'تنظيف بالبخار', category: 'technology' },
          { name: 'المواد', value: 'صديقة للبيئة', category: 'materials' },
          { name: 'الضمان', value: '30 يوم', category: 'warranty' },
        ],
        features: [
          'تنظيف بالبخار',
          'تلميع الطلاء',
          'تعقيم المقصورة',
          'حماية الجلد',
          'صديق للبيئة',
          'نتائج احترافية',
        ],
        tags: ['steam-wash', 'car-detailing', 'eco-friendly', 'professional-cleaning'],
        condition: 'new',
        warranty: {
          type: 'seller',
          duration: 1,
          coverage: 'ضمان على جودة التنظيف لمدة شهر',
        },
        status: 'published',
        views: 267,
        favorites: 21,
        rating: 4.8,
        reviewCount: 35,
        createdAt: new Date('2023-12-28'),
        updatedAt: new Date('2024-01-03'),
        publishedAt: new Date('2023-12-29'),
        seoData: {
          slug: 'steam-car-wash-detailing-service',
          metaTitle: 'خدمة تنظيف السيارة بالبخار',
          metaDescription: 'تنظيف شامل بالبخار، تلميع وتعقيم احترافي',
          keywords: ['steam-wash', 'car-detailing', 'professional-cleaning'],
        },
      },

      // Accessories
      {
        id: 'accessory-1',
        vendorId: 'vendor-4',
        title: 'غطاء مقاعد جلد طبيعي فاخر - مقاوم للماء',
        description:
          'غطاء مقاعد من الجلد الطبيعي الفاخر، مقاوم للماء والبقع، سهل التركيب والتنظيف، متوفر بألوان متعددة، مناسب لجميع أنواع السيارات، تصميم أنيق ومريح.',
        category: 'accessories',
        subcategory: 'interior',
        images: [
          {
            id: 'accessory-1-img-1',
            url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop',
            alt: 'Premium Leather Seat Covers',
            isPrimary: true,
            order: 0,
          },
        ],
        price: 850,
        originalPrice: 950,
        currency: 'EGP',
        inStock: true,
        quantity: 20,
        specifications: [
          { name: 'المادة', value: 'جلد طبيعي 100%', category: 'material' },
          { name: 'المقاومة', value: 'مقاوم للماء والبقع', category: 'resistance' },
          { name: 'التوافق', value: 'جميع أنواع السيارات', category: 'compatibility' },
          { name: 'الألوان', value: 'أسود، بني، بيج، رمادي', category: 'colors' },
        ],
        features: [
          'جلد طبيعي 100%',
          'مقاوم للماء',
          'سهل التنظيف',
          'تركيب سهل',
          'ألوان متعددة',
          'تصميم أنيق',
        ],
        tags: ['leather', 'seat-covers', 'waterproof', 'premium', 'interior-accessories'],
        condition: 'new',
        warranty: {
          type: 'manufacturer',
          duration: 24,
          coverage: 'ضمان ضد عيوب التصنيع والخامات',
        },
        status: 'published',
        views: 198,
        favorites: 16,
        rating: 4.6,
        reviewCount: 22,
        createdAt: new Date('2023-12-25'),
        updatedAt: new Date('2023-12-30'),
        publishedAt: new Date('2023-12-26'),
        seoData: {
          slug: 'premium-leather-seat-covers-waterproof',
          metaTitle: 'غطاء مقاعد جلد طبيعي فاخر مقاوم للماء',
          metaDescription: 'أغطية مقاعد جلد طبيعي فاخرة، مقاومة للماء',
          keywords: ['leather', 'seat-covers', 'waterproof', 'premium'],
        },
      },
    ];

    return sampleProducts;
  }
}
