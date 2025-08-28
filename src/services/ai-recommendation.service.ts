/**
 * 🤖 AI-POWERED RECOMMENDATION ENGINE
 * Advanced machine learning for personalized product recommendations
 */

import { db } from '@/config/firebase.config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  orderBy,
  doc,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { Product, User, Order } from '@/types';

interface UserBehavior {
  userId: string;
  viewedProducts: string[];
  purchasedProducts: string[];
  searchQueries: string[];
  clickThrough: Map<string, number>;
  timeSpent: Map<string, number>;
  cartAbandoned: string[];
  wishlist: string[];
}

interface ProductFeatures {
  productId: string;
  category: string;
  brand: string;
  priceRange: 'budget' | 'mid' | 'premium';
  popularity: number;
  rating: number;
  features: string[];
  embedding?: number[]; // For similarity calculations
}

interface RecommendationResult {
  products: Product[];
  confidence: number;
  reasoning: string[];
  type: 'collaborative' | 'content' | 'hybrid' | 'trending';
}

export class AIRecommendationService {
  private static instance: AIRecommendationService;
  private userBehaviorCache: Map<string, UserBehavior> = new Map();
  private productFeaturesCache: Map<string, ProductFeatures> = new Map();
  private collaborativeMatrix: Map<string, Map<string, number>> = new Map();

  private constructor() {
    this.initializeMLModels();
  }

  static getInstance(): AIRecommendationService {
    if (!AIRecommendationService.instance) {
      AIRecommendationService.instance = new AIRecommendationService();
    }
    return AIRecommendationService.instance;
  }

  /**
   * Initialize machine learning models
   */
  private async initializeMLModels(): Promise<void> {
    // In production, this would load TensorFlow.js models
    console.log('🤖 Initializing AI models...');
    
    // Load pre-trained models
    // await tf.loadLayersModel('/models/recommendation-model.json');
    
    // Initialize collaborative filtering matrix
    await this.buildCollaborativeMatrix();
    
    // Load product embeddings
    await this.loadProductEmbeddings();
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string, 
    count: number = 10
  ): Promise<RecommendationResult> {
    try {
      // Get user behavior data
      const userBehavior = await this.getUserBehavior(userId);
      
      // Get different types of recommendations
      const [collaborative, contentBased, trending] = await Promise.all([
        this.getCollaborativeRecommendations(userId, userBehavior),
        this.getContentBasedRecommendations(userId, userBehavior),
        this.getTrendingRecommendations()
      ]);
      
      // Hybrid approach - combine all recommendation types
      const hybridRecommendations = this.combineRecommendations(
        collaborative,
        contentBased,
        trending,
        userBehavior
      );
      
      // Apply business rules and filters
      const finalRecommendations = await this.applyBusinessRules(
        hybridRecommendations,
        userId
      );
      
      // Track recommendation impression
      await this.trackRecommendation(userId, finalRecommendations);
      
      return {
        products: finalRecommendations.slice(0, count),
        confidence: this.calculateConfidence(finalRecommendations, userBehavior),
        reasoning: this.generateReasoning(finalRecommendations, userBehavior),
        type: 'hybrid'
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Fallback to trending products
      return this.getTrendingRecommendations();
    }
  }

  /**
   * Collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(
    userId: string,
    userBehavior: UserBehavior
  ): Promise<Product[]> {
    const similarUsers = await this.findSimilarUsers(userId, userBehavior);
    const recommendations: Map<string, number> = new Map();
    
    // Aggregate products from similar users
    for (const [similarUserId, similarity] of similarUsers) {
      const similarUserBehavior = await this.getUserBehavior(similarUserId);
      
      for (const productId of similarUserBehavior.purchasedProducts) {
        if (!userBehavior.purchasedProducts.includes(productId)) {
          const score = (recommendations.get(productId) || 0) + similarity;
          recommendations.set(productId, score);
        }
      }
    }
    
    // Sort by score and fetch products
    const sortedProductIds = Array.from(recommendations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([productId]) => productId);
    
    return this.fetchProducts(sortedProductIds);
  }

  /**
   * Content-based filtering recommendations
   */
  private async getContentBasedRecommendations(
    userId: string,
    userBehavior: UserBehavior
  ): Promise<Product[]> {
    const userPreferences = await this.analyzeUserPreferences(userBehavior);
    const recommendations: Map<string, number> = new Map();
    
    // Find similar products based on features
    for (const productId of userBehavior.viewedProducts) {
      const similarProducts = await this.findSimilarProducts(productId);
      
      for (const [similarProductId, similarity] of similarProducts) {
        if (!userBehavior.purchasedProducts.includes(similarProductId)) {
          const score = (recommendations.get(similarProductId) || 0) + similarity;
          recommendations.set(similarProductId, score);
        }
      }
    }
    
    // Apply user preference weights
    for (const [productId, score] of recommendations) {
      const product = await this.getProductFeatures(productId);
      const preferenceScore = this.calculatePreferenceScore(product, userPreferences);
      recommendations.set(productId, score * preferenceScore);
    }
    
    // Sort and fetch
    const sortedProductIds = Array.from(recommendations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([productId]) => productId);
    
    return this.fetchProducts(sortedProductIds);
  }

  /**
   * Get trending recommendations
   */
  private async getTrendingRecommendations(): Promise<RecommendationResult> {
    const q = query(
      collection(db, 'products'),
      where('isActive', '==', true),
      orderBy('views', 'desc'),
      orderBy('rating', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
    
    return {
      products,
      confidence: 0.7,
      reasoning: ['Popular products', 'Highly rated items'],
      type: 'trending'
    };
  }

  /**
   * Find similar users using cosine similarity
   */
  private async findSimilarUsers(
    userId: string,
    userBehavior: UserBehavior
  ): Promise<Map<string, number>> {
    const similarities = new Map<string, number>();
    
    // Get all users with similar purchase patterns
    const q = query(
      collection(db, 'user_behaviors'),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    
    for (const doc of snapshot.docs) {
      if (doc.id !== userId) {
        const otherUserBehavior = doc.data() as UserBehavior;
        const similarity = this.calculateUserSimilarity(userBehavior, otherUserBehavior);
        
        if (similarity > 0.3) { // Threshold for similarity
          similarities.set(doc.id, similarity);
        }
      }
    }
    
    // Sort by similarity and return top similar users
    return new Map(
      Array.from(similarities.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    );
  }

  /**
   * Calculate similarity between two users
   */
  private calculateUserSimilarity(user1: UserBehavior, user2: UserBehavior): number {
    // Jaccard similarity for purchased products
    const purchased1 = new Set(user1.purchasedProducts);
    const purchased2 = new Set(user2.purchasedProducts);
    const purchaseIntersection = new Set([...purchased1].filter(x => purchased2.has(x)));
    const purchaseUnion = new Set([...purchased1, ...purchased2]);
    const purchaseSimilarity = purchaseUnion.size > 0 
      ? purchaseIntersection.size / purchaseUnion.size 
      : 0;
    
    // Cosine similarity for viewed products
    const viewed1 = new Set(user1.viewedProducts);
    const viewed2 = new Set(user2.viewedProducts);
    const viewIntersection = new Set([...viewed1].filter(x => viewed2.has(x)));
    const viewSimilarity = Math.sqrt(viewed1.size * viewed2.size) > 0
      ? viewIntersection.size / Math.sqrt(viewed1.size * viewed2.size)
      : 0;
    
    // Weighted combination
    return (purchaseSimilarity * 0.7) + (viewSimilarity * 0.3);
  }

  /**
   * Find similar products based on features
   */
  private async findSimilarProducts(
    productId: string
  ): Promise<Map<string, number>> {
    const product = await this.getProductFeatures(productId);
    const similarities = new Map<string, number>();
    
    // Get products from same category
    const q = query(
      collection(db, 'products'),
      where('category', '==', product.category),
      where('isActive', '==', true),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    
    for (const doc of snapshot.docs) {
      if (doc.id !== productId) {
        const otherProduct = await this.getProductFeatures(doc.id);
        const similarity = this.calculateProductSimilarity(product, otherProduct);
        
        if (similarity > 0.4) {
          similarities.set(doc.id, similarity);
        }
      }
    }
    
    return new Map(
      Array.from(similarities.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    );
  }

  /**
   * Calculate product similarity
   */
  private calculateProductSimilarity(
    product1: ProductFeatures,
    product2: ProductFeatures
  ): number {
    let similarity = 0;
    
    // Category match
    if (product1.category === product2.category) similarity += 0.3;
    
    // Brand match
    if (product1.brand === product2.brand) similarity += 0.2;
    
    // Price range match
    if (product1.priceRange === product2.priceRange) similarity += 0.2;
    
    // Feature overlap
    const features1 = new Set(product1.features);
    const features2 = new Set(product2.features);
    const featureIntersection = new Set([...features1].filter(x => features2.has(x)));
    const featureUnion = new Set([...features1, ...features2]);
    
    if (featureUnion.size > 0) {
      similarity += (featureIntersection.size / featureUnion.size) * 0.3;
    }
    
    // If embeddings are available, use cosine similarity
    if (product1.embedding && product2.embedding) {
      const cosineSim = this.cosineSimilarity(product1.embedding, product2.embedding);
      similarity = (similarity * 0.5) + (cosineSim * 0.5);
    }
    
    return similarity;
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Combine recommendations from different algorithms
   */
  private combineRecommendations(
    collaborative: Product[],
    contentBased: Product[],
    trending: RecommendationResult,
    userBehavior: UserBehavior
  ): Product[] {
    const combinedScores = new Map<string, number>();
    const productMap = new Map<string, Product>();
    
    // Weight collaborative filtering (40%)
    collaborative.forEach((product, index) => {
      const score = (collaborative.length - index) / collaborative.length * 0.4;
      combinedScores.set(product.id, score);
      productMap.set(product.id, product);
    });
    
    // Weight content-based (35%)
    contentBased.forEach((product, index) => {
      const currentScore = combinedScores.get(product.id) || 0;
      const score = (contentBased.length - index) / contentBased.length * 0.35;
      combinedScores.set(product.id, currentScore + score);
      productMap.set(product.id, product);
    });
    
    // Weight trending (25%)
    trending.products.forEach((product, index) => {
      const currentScore = combinedScores.get(product.id) || 0;
      const score = (trending.products.length - index) / trending.products.length * 0.25;
      combinedScores.set(product.id, currentScore + score);
      productMap.set(product.id, product);
    });
    
    // Apply user behavior boost
    for (const [productId, score] of combinedScores) {
      let boost = 1;
      
      // Boost if in wishlist
      if (userBehavior.wishlist.includes(productId)) boost *= 1.5;
      
      // Boost if frequently viewed
      const views = userBehavior.clickThrough.get(productId) || 0;
      if (views > 3) boost *= 1.2;
      
      // Reduce if abandoned in cart
      if (userBehavior.cartAbandoned.includes(productId)) boost *= 0.8;
      
      combinedScores.set(productId, score * boost);
    }
    
    // Sort by combined score
    const sortedProductIds = Array.from(combinedScores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([productId]) => productId);
    
    return sortedProductIds
      .map(id => productMap.get(id))
      .filter(product => product !== undefined) as Product[];
  }

  /**
   * Apply business rules to recommendations
   */
  private async applyBusinessRules(
    recommendations: Product[],
    userId: string
  ): Promise<Product[]> {
    const filtered = recommendations.filter(product => {
      // Remove out of stock items
      if (product.stock === 0) return false;
      
      // Remove inactive products
      if (!product.isActive) return false;
      
      // Apply price range filters based on user history
      // This would be more sophisticated in production
      
      return true;
    });
    
    // Diversify recommendations
    return this.diversifyRecommendations(filtered);
  }

  /**
   * Ensure diversity in recommendations
   */
  private diversifyRecommendations(products: Product[]): Product[] {
    const diversified: Product[] = [];
    const categories = new Set<string>();
    const brands = new Set<string>();
    
    for (const product of products) {
      // Ensure category diversity
      if (categories.has(product.category) && categories.size < 3) {
        continue;
      }
      
      // Ensure brand diversity
      if (brands.has(product.brand) && brands.size < 5) {
        continue;
      }
      
      diversified.push(product);
      categories.add(product.category);
      brands.add(product.brand);
      
      if (diversified.length >= 20) break;
    }
    
    return diversified;
  }

  /**
   * Track recommendation for learning
   */
  private async trackRecommendation(
    userId: string,
    products: Product[]
  ): Promise<void> {
    try {
      await setDoc(doc(db, 'recommendation_impressions', `${userId}_${Date.now()}`), {
        userId,
        products: products.map(p => p.id),
        timestamp: serverTimestamp(),
        context: {
          time: new Date().toISOString(),
          device: navigator.userAgent,
          page: window.location.pathname
        }
      });
    } catch (error) {
      console.error('Error tracking recommendation:', error);
    }
  }

  /**
   * Track user interaction for learning
   */
  async trackInteraction(
    userId: string,
    productId: string,
    action: 'view' | 'click' | 'cart' | 'purchase' | 'wishlist'
  ): Promise<void> {
    try {
      // Update user behavior
      const userBehavior = await this.getUserBehavior(userId);
      
      switch (action) {
        case 'view':
          userBehavior.viewedProducts.push(productId);
          userBehavior.timeSpent.set(productId, Date.now());
          break;
        case 'click':
          const clicks = userBehavior.clickThrough.get(productId) || 0;
          userBehavior.clickThrough.set(productId, clicks + 1);
          break;
        case 'cart':
          // Track cart addition
          break;
        case 'purchase':
          userBehavior.purchasedProducts.push(productId);
          break;
        case 'wishlist':
          userBehavior.wishlist.push(productId);
          break;
      }
      
      // Save updated behavior
      await setDoc(doc(db, 'user_behaviors', userId), {
        ...userBehavior,
        updatedAt: serverTimestamp()
      });
      
      // Update collaborative matrix
      this.updateCollaborativeMatrix(userId, productId, action);
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  /**
   * Helper methods
   */
  
  private async getUserBehavior(userId: string): Promise<UserBehavior> {
    if (this.userBehaviorCache.has(userId)) {
      return this.userBehaviorCache.get(userId)!;
    }
    
    // Fetch from database or create new
    const docRef = doc(db, 'user_behaviors', userId);
    const docSnap = await import('firebase/firestore').then(({ getDoc }) => getDoc(docRef));
    
    if (docSnap.exists()) {
      const behavior = docSnap.data() as UserBehavior;
      this.userBehaviorCache.set(userId, behavior);
      return behavior;
    }
    
    // Create new behavior profile
    const newBehavior: UserBehavior = {
      userId,
      viewedProducts: [],
      purchasedProducts: [],
      searchQueries: [],
      clickThrough: new Map(),
      timeSpent: new Map(),
      cartAbandoned: [],
      wishlist: []
    };
    
    this.userBehaviorCache.set(userId, newBehavior);
    return newBehavior;
  }

  private async getProductFeatures(productId: string): Promise<ProductFeatures> {
    if (this.productFeaturesCache.has(productId)) {
      return this.productFeaturesCache.get(productId)!;
    }
    
    // Fetch product and extract features
    const docRef = doc(db, 'products', productId);
    const docSnap = await import('firebase/firestore').then(({ getDoc }) => getDoc(docRef));
    
    if (docSnap.exists()) {
      const product = docSnap.data() as Product;
      const features: ProductFeatures = {
        productId,
        category: product.category,
        brand: product.brand,
        priceRange: this.getPriceRange(product.price),
        popularity: product.views || 0,
        rating: product.rating || 0,
        features: product.features || []
      };
      
      this.productFeaturesCache.set(productId, features);
      return features;
    }
    
    throw new Error(`Product ${productId} not found`);
  }

  private getPriceRange(price: number): 'budget' | 'mid' | 'premium' {
    if (price < 1000) return 'budget';
    if (price < 5000) return 'mid';
    return 'premium';
  }

  private async fetchProducts(productIds: string[]): Promise<Product[]> {
    const products: Product[] = [];
    
    for (const productId of productIds) {
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await import('firebase/firestore').then(({ getDoc }) => getDoc(docRef));
        
        if (docSnap.exists()) {
          products.push({
            id: docSnap.id,
            ...docSnap.data()
          } as Product);
        }
      } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
      }
    }
    
    return products;
  }

  private async analyzeUserPreferences(userBehavior: UserBehavior): Promise<any> {
    // Analyze user's historical behavior to determine preferences
    const preferences = {
      categories: new Map<string, number>(),
      brands: new Map<string, number>(),
      priceRanges: new Map<string, number>(),
      features: new Map<string, number>()
    };
    
    // Analyze viewed and purchased products
    const allProducts = [...userBehavior.viewedProducts, ...userBehavior.purchasedProducts];
    
    for (const productId of allProducts) {
      try {
        const features = await this.getProductFeatures(productId);
        
        // Update category preferences
        const categoryCount = preferences.categories.get(features.category) || 0;
        preferences.categories.set(features.category, categoryCount + 1);
        
        // Update brand preferences
        const brandCount = preferences.brands.get(features.brand) || 0;
        preferences.brands.set(features.brand, brandCount + 1);
        
        // Update price range preferences
        const priceCount = preferences.priceRanges.get(features.priceRange) || 0;
        preferences.priceRanges.set(features.priceRange, priceCount + 1);
      } catch (error) {
        // Skip if product not found
      }
    }
    
    return preferences;
  }

  private calculatePreferenceScore(product: ProductFeatures, preferences: any): number {
    let score = 1;
    
    // Category preference
    const categoryPref = preferences.categories.get(product.category) || 0;
    score *= (1 + categoryPref * 0.1);
    
    // Brand preference
    const brandPref = preferences.brands.get(product.brand) || 0;
    score *= (1 + brandPref * 0.05);
    
    // Price range preference
    const pricePref = preferences.priceRanges.get(product.priceRange) || 0;
    score *= (1 + pricePref * 0.05);
    
    return Math.min(score, 2); // Cap at 2x boost
  }

  private calculateConfidence(products: Product[], userBehavior: UserBehavior): number {
    // Calculate confidence based on available data
    let confidence = 0.5; // Base confidence
    
    // More user data = higher confidence
    if (userBehavior.purchasedProducts.length > 5) confidence += 0.2;
    if (userBehavior.viewedProducts.length > 20) confidence += 0.15;
    if (userBehavior.wishlist.length > 3) confidence += 0.1;
    
    // Product quality affects confidence
    const avgRating = products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length;
    if (avgRating > 4) confidence += 0.05;
    
    return Math.min(confidence, 0.95);
  }

  private generateReasoning(products: Product[], userBehavior: UserBehavior): string[] {
    const reasons: string[] = [];
    
    if (userBehavior.purchasedProducts.length > 0) {
      reasons.push('Based on your purchase history');
    }
    
    if (userBehavior.viewedProducts.length > 10) {
      reasons.push('Similar to products you viewed');
    }
    
    if (userBehavior.wishlist.length > 0) {
      reasons.push('Related to items in your wishlist');
    }
    
    // Check for common patterns
    const categories = new Set(products.map(p => p.category));
    if (categories.size <= 2) {
      reasons.push(`Popular in ${Array.from(categories).join(' and ')}`);
    }
    
    const hasHighRated = products.some(p => (p.rating || 0) > 4.5);
    if (hasHighRated) {
      reasons.push('Highly rated by other customers');
    }
    
    return reasons;
  }

  private async buildCollaborativeMatrix(): Promise<void> {
    // Build user-item interaction matrix for collaborative filtering
    // This would be done offline in production
    console.log('Building collaborative filtering matrix...');
  }

  private async loadProductEmbeddings(): Promise<void> {
    // Load pre-computed product embeddings for similarity calculations
    // In production, these would be generated by a separate ML pipeline
    console.log('Loading product embeddings...');
  }

  private updateCollaborativeMatrix(userId: string, productId: string, action: string): void {
    // Update the collaborative filtering matrix with new interaction
    if (!this.collaborativeMatrix.has(userId)) {
      this.collaborativeMatrix.set(userId, new Map());
    }
    
    const userMatrix = this.collaborativeMatrix.get(userId)!;
    const currentScore = userMatrix.get(productId) || 0;
    
    // Different actions have different weights
    const actionWeights = {
      view: 0.1,
      click: 0.2,
      cart: 0.5,
      wishlist: 0.6,
      purchase: 1.0
    };
    
    const weight = actionWeights[action as keyof typeof actionWeights] || 0;
    userMatrix.set(productId, currentScore + weight);
  }
}

// Export singleton instance
export const aiRecommendation = AIRecommendationService.getInstance();