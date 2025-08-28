/**
 * Content-Based Filtering for Recommendations
 * Feature extraction and similarity computation
 */

import { db } from '@/config/firebase.config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Product } from '@/types';
import { RecommendationResult } from './recommendation-engine';

export interface ProductVector {
  productId: string;
  features: number[];
  category: string;
  price: number;
  popularity: number;
  rating: number;
}

interface UserPreferences {
  categories: Map<string, number>;
  priceRange: { min: number; max: number };
  brands: Map<string, number>;
  viewHistory: string[];
  purchaseHistory: string[];
}

export class ContentBasedFilter {
  private productVectors: Map<string, ProductVector> = new Map();
  private userPreferences: Map<string, UserPreferences> = new Map();
  private readonly FEATURE_DIMENSIONS = 128;

  async computeVectors() {
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));
      
      productsSnapshot.forEach(doc => {
        const product = { id: doc.id, ...doc.data() } as Product;
        
        const vector: ProductVector = {
          productId: product.id,
          features: this.extractFeatures(product),
          category: product.category,
          price: product.price,
          popularity: 0, // Will be calculated based on interactions
          rating: product.rating || 0
        };
        
        this.productVectors.set(product.id, vector);
      });
    } catch (error) {
      console.error('Error computing product vectors:', error);
    }
  }

  async getRecommendations(
    userId: string,
    count: number,
    context?: any
  ): Promise<RecommendationResult[]> {
    const userPref = await this.getUserPreferences(userId);
    const userVector = this.computeUserVector(userPref);
    
    const recommendations: RecommendationResult[] = [];
    
    this.productVectors.forEach((productVector, productId) => {
      // Skip if user already interacted with product
      if (userPref.viewHistory.includes(productId) || 
          userPref.purchaseHistory.includes(productId)) {
        return;
      }
      
      // Apply context filters
      if (context) {
        if (context.category && productVector.category !== context.category) {
          return;
        }
        if (context.priceRange) {
          if (productVector.price < context.priceRange.min || 
              productVector.price > context.priceRange.max) {
            return;
          }
        }
      }
      
      // Calculate similarity
      const similarity = this.cosineSimilarity(userVector, productVector.features);
      
      if (similarity > 0.3) {
        recommendations.push({
          productId,
          score: similarity * (productVector.rating / 5),
          reason: 'Based on your preferences',
          confidence: similarity,
          type: 'content'
        });
      }
    });
    
    return recommendations.sort((a, b) => b.score - a.score).slice(0, count);
  }

  async getSimilarProducts(
    productId: string,
    count: number
  ): Promise<RecommendationResult[]> {
    const currentVector = this.productVectors.get(productId);
    if (!currentVector) return [];
    
    const recommendations: RecommendationResult[] = [];
    
    this.productVectors.forEach((productVector, pid) => {
      if (pid !== productId) {
        const similarity = this.cosineSimilarity(
          currentVector.features,
          productVector.features
        );
        
        if (similarity > 0.7) {
          recommendations.push({
            productId: pid,
            score: similarity,
            reason: 'Similar to what you\'re viewing',
            confidence: similarity,
            type: 'content'
          });
        }
      }
    });
    
    return recommendations.sort((a, b) => b.score - a.score).slice(0, count);
  }

  async getUserVector(userId: string): Promise<number[]> {
    const userPref = await this.getUserPreferences(userId);
    return this.computeUserVector(userPref);
  }

  getProductVectors(): Map<string, ProductVector> {
    return this.productVectors;
  }

  private extractFeatures(product: Product): number[] {
    const features: number[] = new Array(this.FEATURE_DIMENSIONS).fill(0);
    
    // Category embedding
    const categoryIndex = this.getCategoryIndex(product.category);
    features[categoryIndex % this.FEATURE_DIMENSIONS] = 1;
    
    // Price normalization
    const normalizedPrice = Math.log(product.price + 1) / 10;
    features[1] = normalizedPrice;
    
    // Text features from title and description
    const textFeatures = this.extractTextFeatures(
      `${product.title} ${product.description}`
    );
    
    for (let i = 0; i < textFeatures.length && i < 50; i++) {
      features[i + 2] = textFeatures[i];
    }
    
    // Brand features
    if (product.brand) {
      const brandIndex = this.hashString(product.brand);
      features[52 + (brandIndex % 20)] = 1;
    }
    
    // Normalize features
    const magnitude = Math.sqrt(features.reduce((sum, f) => sum + f * f, 0));
    if (magnitude > 0) {
      return features.map(f => f / magnitude);
    }
    
    return features;
  }

  private extractTextFeatures(text: string): number[] {
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const features: number[] = new Array(50).fill(0);
    
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    // Convert to feature vector using hashing
    wordFreq.forEach((freq, word) => {
      const hash = this.hashString(word);
      const index = hash % 50;
      features[index] = (features[index] || 0) + freq / words.length;
    });
    
    return features;
  }

  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    if (this.userPreferences.has(userId)) {
      return this.userPreferences.get(userId)!;
    }
    
    const pref: UserPreferences = {
      categories: new Map(),
      priceRange: { min: 0, max: 10000 },
      brands: new Map(),
      viewHistory: [],
      purchaseHistory: []
    };
    
    // Load from database
    try {
      const userDoc = await getDocs(
        query(collection(db, 'user_preferences'), where('userId', '==', userId))
      );
      
      if (!userDoc.empty) {
        const data = userDoc.docs[0].data();
        Object.assign(pref, data);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
    
    this.userPreferences.set(userId, pref);
    return pref;
  }

  private computeUserVector(userPref: UserPreferences): number[] {
    const vector = new Array(this.FEATURE_DIMENSIONS).fill(0);
    
    // Category preferences
    userPref.categories.forEach((weight, category) => {
      const catIndex = this.getCategoryIndex(category);
      vector[catIndex % this.FEATURE_DIMENSIONS] = weight;
    });
    
    // Price preference
    const avgPrice = (userPref.priceRange.min + userPref.priceRange.max) / 2;
    vector[1] = Math.log(avgPrice + 1) / 10;
    
    // Brand preferences
    userPref.brands.forEach((weight, brand) => {
      const brandIndex = this.hashString(brand);
      vector[52 + (brandIndex % 20)] = weight;
    });
    
    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      return vector.map(v => v / magnitude);
    }
    
    return vector;
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  private getCategoryIndex(category: string): number {
    const categories = ['cars', 'parts', 'accessories', 'services', 'tools'];
    return categories.indexOf(category) + 10;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}