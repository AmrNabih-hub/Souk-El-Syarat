/**
 * AI Recommendation Engine Core
 * Handles personalized recommendations with real-time learning
 */

import { db, realtimeDb } from '@/config/firebase.config';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { ref, onValue, push, set } from 'firebase/database';
import { Product, User } from '@/types';
import { MLModel } from './ml-model';
import { CollaborativeFilter } from './collaborative-filter';
import { ContentBasedFilter } from './content-filter';

export interface RecommendationResult {
  productId: string;
  score: number;
  reason: string;
  confidence: number;
  type: 'collaborative' | 'content' | 'hybrid' | 'trending' | 'personalized';
}

export class RecommendationEngine {
  private static instance: RecommendationEngine;
  private mlModel: MLModel;
  private cfFilter: CollaborativeFilter;
  private cbFilter: ContentBasedFilter;
  private trendingProducts: string[] = [];
  
  private constructor() {
    this.mlModel = new MLModel();
    this.cfFilter = new CollaborativeFilter();
    this.cbFilter = new ContentBasedFilter();
    this.initialize();
  }

  static getInstance(): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine();
    }
    return RecommendationEngine.instance;
  }

  private async initialize() {
    await this.mlModel.load();
    await this.cfFilter.buildMatrix();
    await this.cbFilter.computeVectors();
    this.setupRealtimeListeners();
    this.startContinuousLearning();
  }

  private setupRealtimeListeners() {
    // Listen to trending products
    const trendingRef = ref(realtimeDb, 'trending_products');
    onValue(trendingRef, (snapshot) => {
      const trending = snapshot.val();
      if (trending) {
        this.trendingProducts = Object.keys(trending)
          .sort((a, b) => trending[b].score - trending[a].score)
          .slice(0, 20);
      }
    });

    // Listen to user interactions for real-time learning
    const interactionsRef = ref(realtimeDb, 'user_interactions');
    onValue(interactionsRef, (snapshot) => {
      const interactions = snapshot.val();
      if (interactions) {
        this.processInteractions(interactions);
      }
    });
  }

  private startContinuousLearning() {
    // Retrain model periodically
    setInterval(() => {
      this.mlModel.retrain();
    }, 6 * 60 * 60 * 1000); // Every 6 hours

    // Update trending scores
    setInterval(() => {
      this.updateTrendingScores();
    }, 60 * 60 * 1000); // Every hour
  }

  async getRecommendations(
    userId: string,
    count: number = 10,
    context?: {
      category?: string;
      priceRange?: { min: number; max: number };
      currentProduct?: string;
    }
  ): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];

    // Get collaborative filtering recommendations
    const cfRecs = await this.cfFilter.getRecommendations(userId, count);
    recommendations.push(...cfRecs);

    // Get content-based recommendations
    const cbRecs = await this.cbFilter.getRecommendations(userId, count, context);
    recommendations.push(...cbRecs);

    // Get hybrid recommendations using ML
    const hybridRecs = await this.getHybridRecommendations(userId, count);
    recommendations.push(...hybridRecs);

    // Add trending products
    const trendingRecs = this.getTrendingRecommendations(count);
    recommendations.push(...trendingRecs);

    // Deduplicate and sort
    const uniqueRecs = this.deduplicateRecommendations(recommendations);
    uniqueRecs.sort((a, b) => b.score - a.score);

    // Track for learning
    this.trackRecommendations(userId, uniqueRecs);

    return uniqueRecs.slice(0, count);
  }

  private async getHybridRecommendations(
    userId: string,
    count: number
  ): Promise<RecommendationResult[]> {
    const userVector = await this.cbFilter.getUserVector(userId);
    const productVectors = await this.cbFilter.getProductVectors();
    
    const recommendations: RecommendationResult[] = [];
    
    productVectors.forEach((productVector, productId) => {
      const score = this.mlModel.predict(userVector, productVector.features);
      
      if (score > 0.5) {
        recommendations.push({
          productId,
          score: score * productVector.popularity,
          reason: 'AI recommended for you',
          confidence: score,
          type: 'hybrid'
        });
      }
    });
    
    return recommendations.sort((a, b) => b.score - a.score).slice(0, count);
  }

  private getTrendingRecommendations(count: number): RecommendationResult[] {
    return this.trendingProducts.slice(0, count).map((productId, index) => ({
      productId,
      score: 1 - (index * 0.05),
      reason: 'Trending now',
      confidence: 0.8,
      type: 'trending' as const
    }));
  }

  private async updateTrendingScores() {
    const now = Date.now();
    const windowStart = now - 86400000; // 24 hours
    
    try {
      const viewsSnapshot = await getDocs(
        query(
          collection(db, 'product_views'),
          where('timestamp', '>', new Date(windowStart)),
          orderBy('timestamp', 'desc')
        )
      );
      
      const productScores = new Map<string, number>();
      
      viewsSnapshot.forEach(doc => {
        const view = doc.data();
        const age = (now - view.timestamp.toMillis()) / 86400000;
        const score = Math.exp(-age); // Exponential decay
        
        productScores.set(
          view.productId,
          (productScores.get(view.productId) || 0) + score
        );
      });
      
      // Update trending products in realtime database
      const trending: any = {};
      productScores.forEach((score, productId) => {
        trending[productId] = { score, timestamp: now };
      });
      
      await set(ref(realtimeDb, 'trending_products'), trending);
    } catch (error) {
      console.error('Error updating trending scores:', error);
    }
  }

  private processInteractions(interactions: any) {
    // Process user interactions for real-time learning
    Object.entries(interactions).forEach(([userId, userInteractions]: [string, any]) => {
      if (userInteractions.views) {
        this.cfFilter.updateUserItem(userId, Object.keys(userInteractions.views), 0.1);
      }
      if (userInteractions.purchases) {
        this.cfFilter.updateUserItem(userId, Object.keys(userInteractions.purchases), 1);
      }
    });
  }

  private deduplicateRecommendations(
    recommendations: RecommendationResult[]
  ): RecommendationResult[] {
    const seen = new Set<string>();
    const unique: RecommendationResult[] = [];
    
    recommendations.forEach(rec => {
      if (!seen.has(rec.productId)) {
        seen.add(rec.productId);
        unique.push(rec);
      }
    });
    
    return unique;
  }

  private async trackRecommendations(
    userId: string,
    recommendations: RecommendationResult[]
  ) {
    try {
      await push(ref(realtimeDb, 'recommendation_tracking'), {
        userId,
        recommendations: recommendations.map(r => ({
          productId: r.productId,
          score: r.score,
          type: r.type
        })),
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error tracking recommendations:', error);
    }
  }

  async getPersonalizedFeed(userId: string, page: number = 1): Promise<Product[]> {
    const recommendations = await this.getRecommendations(userId, page * 20);
    const productIds = recommendations.map(r => r.productId);
    
    // Fetch products
    const products: Product[] = [];
    for (const productId of productIds) {
      try {
        const productDoc = await getDocs(
          query(collection(db, 'products'), where('id', '==', productId))
        );
        
        if (!productDoc.empty) {
          products.push({ 
            id: productDoc.docs[0].id, 
            ...productDoc.docs[0].data() 
          } as Product);
        }
      } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
      }
    }
    
    return products;
  }

  async getSimilarProducts(productId: string, count: number = 5): Promise<Product[]> {
    const similar = await this.cbFilter.getSimilarProducts(productId, count);
    
    const products: Product[] = [];
    for (const rec of similar) {
      try {
        const productDoc = await getDocs(
          query(collection(db, 'products'), where('id', '==', rec.productId))
        );
        
        if (!productDoc.empty) {
          products.push({ 
            id: productDoc.docs[0].id, 
            ...productDoc.docs[0].data() 
          } as Product);
        }
      } catch (error) {
        console.error(`Error fetching product ${rec.productId}:`, error);
      }
    }
    
    return products;
  }

  trackUserInteraction(
    userId: string,
    productId: string,
    interactionType: 'view' | 'click' | 'purchase' | 'cart' | 'wishlist'
  ) {
    push(ref(realtimeDb, `user_interactions/${userId}/${interactionType}s`), {
      productId,
      timestamp: Date.now()
    });
  }
}

export const recommendationEngine = RecommendationEngine.getInstance();